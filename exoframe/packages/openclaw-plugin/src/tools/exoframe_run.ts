import { run } from "@dexter/exoframe-core";
import type { ExoFrameMode } from "@dexter/exoframe-core";
import type { OpenClawContext } from "../index.js";

// ---------------------------------------------------------------------------
// Parameter type (mirrors the JSON-Schema in index.ts registerTool call)
// ---------------------------------------------------------------------------

interface ExoframeRunParams {
  task: string;
  mode?: ExoFrameMode;
  context?: Record<string, unknown>;
  constraints?: string[];
  files?: string[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * Tool handler for `exoframe_run`.
 *
 * Reads resolved plugin config, merges caller parameters, calls core.run(),
 * and returns a structured result.
 *
 * TODO – future integration points marked inline:
 *   [workspace]    Inject ctx.workspace accessor to resolve relative file paths
 *                  against the actual project root before passing to core.
 *   [permissions]  Call ctx.permissions.check("write", file) for each output
 *                  file before allowing the pipeline to write.
 *   [log persist]  Persist logs + result to a run store keyed by runId so
 *                  exoframe_status can retrieve them later.
 *   [runId]        Generate a UUID for this run and attach it to the result.
 */
export async function handleExoframeRun(
  params: Record<string, unknown>,
  ctx: OpenClawContext
): Promise<unknown> {
  const p = params as unknown as ExoframeRunParams;

  // TODO [permissions]: verify caller has execute rights in ctx.config.workspaceRoot
  // TODO [workspace]:   resolve p.files paths against ctx.config.workspaceRoot

  const input = {
    task: p.task,
    mode: p.mode ?? ctx.config.defaultMode,
    context: {
      workspaceRoot: ctx.config.workspaceRoot,
      allowWrite: ctx.config.allowWrite,
      ...(p.context ?? {}),
    },
    constraints: p.constraints ?? [],
    files: p.files ?? [],
  };

  ctx.log("info", `exoframe_run: starting task "${input.task}" in ${input.mode} mode`);

  const result = await run(input);

  ctx.log("info", `exoframe_run: finished with status=${result.status}`);

  // TODO [log persist]: store result in runStore.save(runId, result)

  return {
    ok: result.status !== "failed",
    status: result.status,
    summary: result.summary,
    outputs: result.outputs,
    nextActions: result.nextActions,
    // TODO [runId]: include runId: generatedRunId
  };
}
