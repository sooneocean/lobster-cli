// Shared durable store between workflow runtime and lobster-cli
// Backend selection via env:
//  LOBSTER_STORE=json|sqlite|postgres
//  LOBSTER_SQLITE_PATH=~/.lobster/lobster.sqlite
//  LOBSTER_PG_URL=postgres://...

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export type HitlAction = "approve" | "reject" | "revise";
export type HitlTask = {
  id: string;
  thread_id: string;
  node: string;
  created_at: string;
  status: "pending" | "resolved";
  action?: HitlAction;
  payload?: unknown;
};

type Backend = "json" | "sqlite" | "postgres";
const backend: Backend = (process.env.LOBSTER_STORE as Backend) ?? "json";

function storageDir() {
  return path.join(os.homedir(), ".lobster", "storage");
}

function sqlitePath() {
  return process.env.LOBSTER_SQLITE_PATH || path.join(os.homedir(), ".lobster", "lobster.sqlite");
}

// JSON backend
const jsonFile = () => path.join(storageDir(), "hitl.json");

async function jsonRead(): Promise<HitlTask[]> {
  const f = jsonFile();
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, "utf8"));
}
async function jsonWrite(tasks: HitlTask[]) {
  fs.mkdirSync(path.dirname(jsonFile()), { recursive: true });
  fs.writeFileSync(jsonFile(), JSON.stringify(tasks, null, 2));
}

// SQLite backend
let sqliteDb: any = null;
async function initSqlite() {
  if (sqliteDb) return sqliteDb;
  const Database = (await import("better-sqlite3")).default;
  fs.mkdirSync(path.dirname(sqlitePath()), { recursive: true });
  sqliteDb = new Database(sqlitePath());
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS hitl (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      node TEXT,
      created_at TEXT,
      status TEXT,
      action TEXT,
      payload TEXT
    );
  `);
  return sqliteDb;
}

async function sqliteRead(): Promise<HitlTask[]> {
  const db = await initSqlite();
  const rows = db.prepare("SELECT * FROM hitl").all();
  return rows.map((r: any) => ({
    id: r.id,
    thread_id: r.thread_id,
    node: r.node,
    created_at: r.created_at,
    status: r.status,
    action: r.action ?? undefined,
    payload: r.payload ? JSON.parse(r.payload) : undefined
  }));
}

async function sqliteUpsert(t: HitlTask) {
  const db = await initSqlite();
  db.prepare(
    "INSERT INTO hitl(id, thread_id, node, created_at, status, action, payload) VALUES (?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET status=excluded.status, action=excluded.action, payload=excluded.payload"
  ).run(t.id, t.thread_id, t.node, t.created_at, t.status, t.action ?? null, t.payload ? JSON.stringify(t.payload) : null);
}

// Postgres backend
let pgClient: any = null;
async function initPg() {
  if (pgClient) return pgClient;
  const url = process.env.LOBSTER_PG_URL;
  if (!url) throw new Error("LOBSTER_PG_URL missing");
  const { Client } = await import("pg");
  pgClient = new Client({ connectionString: url });
  await pgClient.connect();
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS hitl (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      node TEXT,
      created_at TEXT,
      status TEXT,
      action TEXT,
      payload JSONB
    );
  `);
  return pgClient;
}

async function pgRead(): Promise<HitlTask[]> {
  const db = await initPg();
  const rows = (await db.query("SELECT * FROM hitl")).rows;
  return rows.map((r: any) => ({
    id: r.id,
    thread_id: r.thread_id,
    node: r.node,
    created_at: r.created_at,
    status: r.status,
    action: r.action ?? undefined,
    payload: r.payload ?? undefined
  }));
}

async function pgUpsert(t: HitlTask) {
  const db = await initPg();
  await db.query(
    "INSERT INTO hitl(id, thread_id, node, created_at, status, action, payload) VALUES ($1,$2,$3,$4,$5,$6,$7) " +
      "ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status, action=EXCLUDED.action, payload=EXCLUDED.payload",
    [t.id, t.thread_id, t.node, t.created_at, t.status, t.action ?? null, t.payload ?? null]
  );
}

export async function upsertHitlTask(task: HitlTask) {
  if (backend === "sqlite") return sqliteUpsert(task);
  if (backend === "postgres") return pgUpsert(task);
  // json
  const all = await jsonRead();
  const idx = all.findIndex((x) => x.id === task.id);
  if (idx === -1) all.push(task);
  else all[idx] = task;
  await jsonWrite(all);
}

export async function listHitlTasks() {
  if (backend === "sqlite") return sqliteRead();
  if (backend === "postgres") return pgRead();
  return jsonRead();
}

export async function waitForHitlResolution(taskId: string, opts?: { intervalMs?: number; timeoutMs?: number }) {
  const intervalMs = opts?.intervalMs ?? 500;
  const timeoutMs = opts?.timeoutMs ?? 5 * 60_000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const tasks = await listHitlTasks();
    const t = tasks.find((x) => x.id === taskId);
    if (t && t.status === "resolved" && t.action) return t.action;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`HITL timeout: ${taskId}`);
}
