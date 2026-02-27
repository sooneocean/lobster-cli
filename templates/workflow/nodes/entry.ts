import type { __WORKFLOW__State } from "../state";

export async function entryNode(state: __WORKFLOW__State): Promise<__WORKFLOW__State> {
  return { ...state, meta: { ...(state.meta ?? {}), startedAt: new Date().toISOString() } };
}
