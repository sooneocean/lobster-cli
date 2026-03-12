import { validateInput } from "./validators.js";
import type { ExoFrameInput, ExoFrameResult, ExoFrameStep } from "./types.js";

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

/**
 * Converts a validated ExoFrameInput into an ordered list of steps.
 *
 * CURRENT STATE: Mock implementation – always returns a static set of steps
 * derived from the task string.
 *
 * TODO (future integration):
 *   - Call an LLM to decompose the task into typed ExoFrameStep objects.
 *   - Respect input.constraints when building the plan.
 *   - Attach file-read steps for each entry in input.files.
 */
export function plan(input: ExoFrameInput): ExoFrameStep[] {
  const steps: ExoFrameStep[] = [
    {
      id: "step-analyze",
      description: `Analyze task: "${input.task}"`,
      action: "analyze",
      payload: { task: input.task, context: input.context },
    },
  ];

  // Emit a read step for every referenced file
  for (const file of input.files) {
    steps.push({
      id: `step-read-${file.replace(/[^a-z0-9]/gi, "_")}`,
      description: `Read file: ${file}`,
      action: "read",
      payload: { path: file },
    });
  }

  steps.push({
    id: "step-execute",
    description: "Execute primary task actions",
    action: "run",
    payload: { task: input.task, mode: input.mode },
  });

  steps.push({
    id: "step-verify",
    description: "Verify outputs",
    action: "verify",
    payload: {},
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

/**
 * Executes an ordered list of steps against the given input.
 *
 * CURRENT STATE: Mock – logs each step and returns placeholder outputs.
 *
 * TODO (future integration):
 *   - Inject an Executor interface so each action type dispatches to a real handler.
 *   - Support per-step timeout and retry policies.
 *   - Persist step results for status queries (runId → stepResults mapping).
 *   - Respect input.mode: skip execution side-effects when mode === "draft".
 */
export async function execute(
  steps: ExoFrameStep[],
  input: ExoFrameInput
): Promise<{ outputs: string[]; logs: string[] }> {
  const outputs: string[] = [];
  const logs: string[] = [];

  for (const step of steps) {
    logs.push(`[${step.id}] ${step.description}`);

    if (input.mode === "draft") {
      // In draft mode: plan only, never execute side-effecting actions.
      outputs.push(`[draft] would run: ${step.description}`);
      continue;
    }

    // --- Real executor dispatch point ---
    // TODO: replace this mock with an actual Executor registry, e.g.:
    //   const handler = executorRegistry.get(step.action);
    //   const result = await handler.run(step, input);
    outputs.push(`[mock] completed: ${step.description}`);
  }

  return { outputs, logs };
}

// ---------------------------------------------------------------------------
// Verifier
// ---------------------------------------------------------------------------

/**
 * Verifies raw execution outputs and produces a final ExoFrameResult.
 *
 * CURRENT STATE: Mock – always returns success with a generic summary.
 *
 * TODO (future integration):
 *   - Run assertions defined in input.constraints against actual outputs.
 *   - Call an LLM reviewer when input.mode === "review".
 *   - Determine "partial" vs "failed" based on step failure flags.
 */
export function verify(
  raw: { outputs: string[]; logs: string[] },
  input: ExoFrameInput
): ExoFrameResult {
  const allSucceeded = raw.outputs.every((o) => !o.startsWith("[error]"));

  return {
    status: allSucceeded ? "success" : "partial",
    summary: `Task "${input.task}" completed in ${input.mode} mode. ${raw.outputs.length} step(s) processed.`,
    outputs: raw.outputs,
    logs: raw.logs,
    nextActions:
      input.mode === "draft"
        ? ['Switch mode to "execute" to run the plan.']
        : ["Review outputs and confirm no regressions."],
  };
}

// ---------------------------------------------------------------------------
// Main entry – run()
// ---------------------------------------------------------------------------

/**
 * Full pipeline: validate → plan → execute → verify.
 *
 * @param rawInput  Possibly partial input from the caller.
 * @returns         A complete ExoFrameResult.
 */
export async function run(rawInput: Partial<ExoFrameInput>): Promise<ExoFrameResult> {
  // 1. Validate & sanitize
  const input = validateInput(rawInput);

  // 2. Plan
  const steps = plan(input);

  // 3. Execute
  const raw = await execute(steps, input);

  // 4. Verify
  return verify(raw, input);
}
