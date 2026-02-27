// Placeholder LangGraph wiring.
// Replace with real LangGraph StateGraph once integrated.
import type { __WORKFLOW__State } from "./state";
import { entryNode } from "./nodes/entry";

export async function run(__state: __WORKFLOW__State): Promise<__WORKFLOW__State> {
  let s = __state;
  s = await entryNode(s);
  return s;
}
