// Placeholder LangGraph wiring.
// Replace with real LangGraph StateGraph once integrated.
import type { __WORKFLOW__State } from "./state";
import { entryNode } from "./nodes/entry";
import { createCheckpointer, defaultCheckpointer } from "./checkpointer";

export async function run(__state: __WORKFLOW__State): Promise<__WORKFLOW__State> {
  // Example: bind LangGraph checkpointer
  // const checkpointer = await createCheckpointer(defaultCheckpointer);
  // const graph = new StateGraph<__WORKFLOW__State>() ...
  // graph.compile({ checkpointer })

  let s = __state;
  s = await entryNode(s);
  return s;
}
