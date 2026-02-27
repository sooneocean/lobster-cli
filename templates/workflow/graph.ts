// Placeholder LangGraph wiring.
// Replace with real LangGraph StateGraph once integrated.
import type { __WORKFLOW__State } from "./state";
import { entryNode } from "./nodes/entry";
import { createCheckpointer, defaultCheckpointer } from "./checkpointer";
import { createHitlTask } from "./hitl";

export async function run(__state: __WORKFLOW__State): Promise<__WORKFLOW__State> {
  // Example: bind LangGraph checkpointer
  // const checkpointer = await createCheckpointer(defaultCheckpointer);
  // const graph = new StateGraph<__WORKFLOW__State>() ...
  // graph.compile({ checkpointer })

  // Example HITL hook (pseudo):
  // const task = createHitlTask(__state.thread_id, "manager_review", { reason: "needs approval" });
  // interrupt(task)  // from LangGraph JS

  let s = __state;
  s = await entryNode(s);
  return s;
}
