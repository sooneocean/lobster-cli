import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { storageDir } from "./paths.js";
import Database from "better-sqlite3";
import { Client } from "pg";

export type HitlTask = {
  id: string;
  thread_id: string;
  node: string;
  created_at: string;
  status: "pending" | "resolved";
  action?: "approve" | "reject" | "revise";
  payload?: unknown;
};

export type ThreadState = {
  thread_id: string;
  updated_at: string;
  current_step?: string;
  state: Record<string, unknown>;
  checkpoints: Array<{ step: string; ts: string; state: Record<string, unknown> }>;
};

type Backend = "json" | "sqlite" | "postgres";
const backend: Backend = (process.env.LOBSTER_STORE as Backend) ?? "json";

let sqliteDb: Database.Database | null = null;
let pgClient: Client | null = null;

function sqlitePath() {
  return process.env.LOBSTER_SQLITE_PATH || path.join(os.homedir(), ".lobster", "lobster.sqlite");
}

async function initSqlite() {
  if (sqliteDb) return sqliteDb;
  const dir = path.dirname(sqlitePath());
  fs.mkdirSync(dir, { recursive: true });
  sqliteDb = new Database(sqlitePath());
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      thread_id TEXT PRIMARY KEY,
      updated_at TEXT,
      current_step TEXT,
      state TEXT
    );
    CREATE TABLE IF NOT EXISTS checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT,
      step TEXT,
      ts TEXT,
      state TEXT
    );
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

async function initPg() {
  if (pgClient) return pgClient;
  const url = process.env.LOBSTER_PG_URL;
  if (!url) throw new Error("LOBSTER_PG_URL missing");
  pgClient = new Client({ connectionString: url });
  await pgClient.connect();
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS threads (
      thread_id TEXT PRIMARY KEY,
      updated_at TEXT,
      current_step TEXT,
      state JSONB
    );
    CREATE TABLE IF NOT EXISTS checkpoints (
      id SERIAL PRIMARY KEY,
      thread_id TEXT,
      step TEXT,
      ts TEXT,
      state JSONB
    );
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

// JSON backend
function fileForThread(threadId: string) {
  return path.join(storageDir(), "threads", `${threadId}.json`);
}

async function jsonReadThread(threadId: string): Promise<ThreadState | null> {
  const f = fileForThread(threadId);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

async function jsonWriteThread(t: ThreadState) {
  const dir = path.dirname(fileForThread(t.thread_id));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fileForThread(t.thread_id), JSON.stringify(t, null, 2));
}

async function jsonListHitlTasks(): Promise<HitlTask[]> {
  const f = path.join(storageDir(), "hitl.json");
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

async function jsonWriteHitlTasks(tasks: HitlTask[]) {
  fs.mkdirSync(storageDir(), { recursive: true });
  const f = path.join(storageDir(), "hitl.json");
  fs.writeFileSync(f, JSON.stringify(tasks, null, 2));
}

// SQLite backend
async function sqliteReadThread(threadId: string): Promise<ThreadState | null> {
  const db = await initSqlite();
  const row = db.prepare("SELECT * FROM threads WHERE thread_id = ?").get(threadId);
  if (!row) return null;
  const cps = db
    .prepare("SELECT step, ts, state FROM checkpoints WHERE thread_id = ? ORDER BY id ASC")
    .all(threadId)
    .map((c: any) => ({ step: c.step, ts: c.ts, state: JSON.parse(c.state) }));
  return {
    thread_id: row.thread_id,
    updated_at: row.updated_at,
    current_step: row.current_step ?? undefined,
    state: JSON.parse(row.state || "{}"),
    checkpoints: cps
  };
}

async function sqliteWriteThread(t: ThreadState) {
  const db = await initSqlite();
  db.prepare(
    "INSERT INTO threads(thread_id, updated_at, current_step, state) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(thread_id) DO UPDATE SET updated_at=excluded.updated_at, current_step=excluded.current_step, state=excluded.state"
  ).run(t.thread_id, t.updated_at, t.current_step ?? null, JSON.stringify(t.state));
  db.prepare("DELETE FROM checkpoints WHERE thread_id = ?").run(t.thread_id);
  const stmt = db.prepare("INSERT INTO checkpoints(thread_id, step, ts, state) VALUES (?, ?, ?, ?)");
  for (const c of t.checkpoints) stmt.run(t.thread_id, c.step, c.ts, JSON.stringify(c.state));
}

async function sqliteListHitlTasks(): Promise<HitlTask[]> {
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

async function sqliteWriteHitlTasks(tasks: HitlTask[]) {
  const db = await initSqlite();
  db.prepare("DELETE FROM hitl").run();
  const stmt = db.prepare("INSERT INTO hitl(id, thread_id, node, created_at, status, action, payload) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const t of tasks) {
    stmt.run(t.id, t.thread_id, t.node, t.created_at, t.status, t.action ?? null, t.payload ? JSON.stringify(t.payload) : null);
  }
}

// Postgres backend
async function pgReadThread(threadId: string): Promise<ThreadState | null> {
  const db = await initPg();
  const row = (await db.query("SELECT * FROM threads WHERE thread_id=$1", [threadId])).rows[0];
  if (!row) return null;
  const cps = (await db.query("SELECT step, ts, state FROM checkpoints WHERE thread_id=$1 ORDER BY id ASC", [threadId])).rows;
  return {
    thread_id: row.thread_id,
    updated_at: row.updated_at,
    current_step: row.current_step ?? undefined,
    state: row.state ?? {},
    checkpoints: cps.map((c: any) => ({ step: c.step, ts: c.ts, state: c.state ?? {} }))
  };
}

async function pgWriteThread(t: ThreadState) {
  const db = await initPg();
  await db.query(
    "INSERT INTO threads(thread_id, updated_at, current_step, state) VALUES ($1, $2, $3, $4) " +
      "ON CONFLICT(thread_id) DO UPDATE SET updated_at=EXCLUDED.updated_at, current_step=EXCLUDED.current_step, state=EXCLUDED.state",
    [t.thread_id, t.updated_at, t.current_step ?? null, t.state]
  );
  await db.query("DELETE FROM checkpoints WHERE thread_id=$1", [t.thread_id]);
  for (const c of t.checkpoints) {
    await db.query("INSERT INTO checkpoints(thread_id, step, ts, state) VALUES ($1, $2, $3, $4)", [t.thread_id, c.step, c.ts, c.state]);
  }
}

async function pgListHitlTasks(): Promise<HitlTask[]> {
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

async function pgWriteHitlTasks(tasks: HitlTask[]) {
  const db = await initPg();
  await db.query("DELETE FROM hitl");
  for (const t of tasks) {
    await db.query(
      "INSERT INTO hitl(id, thread_id, node, created_at, status, action, payload) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [t.id, t.thread_id, t.node, t.created_at, t.status, t.action ?? null, t.payload ?? null]
    );
  }
}

export async function readThread(threadId: string) {
  if (backend === "sqlite") return sqliteReadThread(threadId);
  if (backend === "postgres") return pgReadThread(threadId);
  return jsonReadThread(threadId);
}

export async function writeThread(t: ThreadState) {
  if (backend === "sqlite") return sqliteWriteThread(t);
  if (backend === "postgres") return pgWriteThread(t);
  return jsonWriteThread(t);
}

export async function listHitlTasks() {
  if (backend === "sqlite") return sqliteListHitlTasks();
  if (backend === "postgres") return pgListHitlTasks();
  return jsonListHitlTasks();
}

export async function writeHitlTasks(tasks: HitlTask[]) {
  if (backend === "sqlite") return sqliteWriteHitlTasks(tasks);
  if (backend === "postgres") return pgWriteHitlTasks(tasks);
  return jsonWriteHitlTasks(tasks);
}
