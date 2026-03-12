import type { OpenClawContext } from "../index.js";

// ---------------------------------------------------------------------------
// Parameter type
// ---------------------------------------------------------------------------

interface ExoframeStatusParams {
  runId?: string;
}

// ---------------------------------------------------------------------------
// Mock run store (placeholder)
// ---------------------------------------------------------------------------

/**
 * In-memory last-run record.
 *
 * TODO [data store]: Replace this module-level variable with a real persistence
 * layer – e.g. a local SQLite DB, a file in ctx.config.workspaceRoot/.exoframe/,
 * or an in-process Map passed via a shared service singleton.
 *
 * Shape matches ExoFrameResult from @dexter/exoframe-core.
 */
const _mockLastRun = {
  runId: "mock-run-001",
  status: "success" as const,
  summary: "No real runs recorded yet. This is a placeholder status.",
  outputs: [],
  logs: [],
  nextActions: ["Call exoframe_run with a real task to populate this status."],
  startedAt: new Date(0).toISOString(),
  finishedAt: new Date(0).toISOString(),
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Tool handler for `exoframe_status`.
 *
 * Returns the status of a specific run (by runId) or the most recent run.
 *
 * TODO [data store]: Look up run by runId in the persistent run store.
 * TODO [runId]:      Return a proper 404-like error when runId is not found.
 */
export async function handleExoframeStatus(
  params: Record<string, unknown>,
  ctx: OpenClawContext
): Promise<unknown> {
  const { runId } = params as ExoframeStatusParams;

  ctx.log("info", `exoframe_status: querying run ${runId ?? "(latest)"}`);

  // TODO [data store]: const record = runId ? runStore.get(runId) : runStore.latest();
  const record = _mockLastRun;

  if (runId && runId !== record.runId) {
    // TODO [data store]: once real store exists, return a not-found error here
    return {
      ok: false,
      error: `Run "${runId}" not found. (Data persistence not yet implemented.)`,
    };
  }

  return {
    ok: true,
    ...record,
  };
}
