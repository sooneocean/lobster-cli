// HITL helper template
// Wire this into your graph nodes when you call interrupt().

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

// TODO: Persist tasks (e.g., via your checkpointer DB or a shared store)
// and let lobster-cli hitl pending/resolve operate on that store.
