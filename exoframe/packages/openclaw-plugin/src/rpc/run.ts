import { handleExoframeRun } from "../tools/exoframe_run.js";
import type { OpenClawContext } from "../index.js";

/**
 * RPC handler for `exoframe.run`.
 *
 * Thin delegation to the tool handler.  RPC callers receive the same result
 * shape as the tool, allowing programmatic integrations without going through
 * the tool dispatch layer.
 */
export async function rpcRun(
  params: Record<string, unknown>,
  ctx: OpenClawContext
): Promise<unknown> {
  return handleExoframeRun(params, ctx);
}
