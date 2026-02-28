// HITL helper template
// Wire this into your graph nodes when you call interrupt().
// This version integrates with lobster-cli by persisting tasks to the shared store.

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

export function createHitlTask(thread_id: string, node: string, payload?: unknown): HitlTask {
  return {
    id: `${thread_id}:${node}:${Date.now()}`,
    thread_id,
    node,
    created_at: new Date().toISOString(),
    status: "pending",
    payload
  };
}

import { upsertHitlTask, waitForHitlResolution } from "./lobster_store";

export async function hitlInterruptPersist(thread_id: string, node: string, payload?: unknown) {
  const task = createHitlTask(thread_id, node, payload);
  await upsertHitlTask(task);
  // you still need to call interrupt() in your LangGraph node.
  return task;
}

export async function hitlAwaitAction(taskId: string) {
  return waitForHitlResolution(taskId);
}
