import { handleExoframeStatus } from "../tools/exoframe_status.js";
import type { OpenClawContext } from "../index.js";

/**
 * RPC handler for `exoframe.status`.
 *
 * Thin delegation to the tool handler.
 */
export async function rpcStatus(
  params: Record<string, unknown>,
  ctx: OpenClawContext
): Promise<unknown> {
  return handleExoframeStatus(params, ctx);
}
