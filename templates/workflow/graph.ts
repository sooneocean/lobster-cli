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

  // Example HITL hook (LangGraph JS):
  // import { interrupt, Command } from "@langchain/langgraph";
  // const task = await hitlInterruptPersist(__state.thread_id, "manager_review", { reason: "needs approval" });
  // const response = interrupt(task);
  // if (response instanceof Command) return response; // graph will pause here

  let s = __state;
  s = await entryNode(s);
  return s;
}
