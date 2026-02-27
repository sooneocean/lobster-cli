import fs from "node:fs";
import path from "node:path";
import { storageDir } from "./paths.js";

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

function fileForThread(threadId: string) {
  return path.join(storageDir(), "threads", `${threadId}.json`);
}

export function readThread(threadId: string): ThreadState | null {
  const f = fileForThread(threadId);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

export function writeThread(t: ThreadState) {
  const dir = path.dirname(fileForThread(t.thread_id));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fileForThread(t.thread_id), JSON.stringify(t, null, 2));
}

export function listHitlTasks(): HitlTask[] {
  const f = path.join(storageDir(), "hitl.json");
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

export function writeHitlTasks(tasks: HitlTask[]) {
  fs.mkdirSync(storageDir(), { recursive: true });
  const f = path.join(storageDir(), "hitl.json");
  fs.writeFileSync(f, JSON.stringify(tasks, null, 2));
}
