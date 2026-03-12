/**
 * ExoFrame Core Types
 * These are platform-agnostic; no dependency on OpenClaw or any host runtime.
 */

/** Controls how aggressively ExoFrame executes a task. */
export type ExoFrameMode = "draft" | "execute" | "review";

/** Input contract for every ExoFrame invocation. */
export interface ExoFrameInput {
  /** The primary task description in natural language. */
  task: string;

  /** Arbitrary key-value context that may influence execution (env, project metadata, etc.). */
  context: Record<string, unknown>;

  /** Explicit constraints the pipeline must respect (e.g. "do not modify test files"). */
  constraints: string[];

  /** File paths relevant to the task (read-only list; actual I/O is handled by the executor). */
  files: string[];

  /** Execution mode. "draft" = plan only, "execute" = run plan, "review" = run + ask for approval. */
  mode: ExoFrameMode;
}

/** A single step produced by the planner. */
export interface ExoFrameStep {
  id: string;
  description: string;
  /** Fine-grained action type – extendable as real executors are added. */
  action: "analyze" | "read" | "write" | "run" | "verify" | "custom";
  /** Executor-specific payload; typed loosely here so executors can extend it. */
  payload: Record<string, unknown>;
}

/** Final result returned from a completed pipeline run. */
export interface ExoFrameResult {
  status: "success" | "failed" | "partial";
  summary: string;
  outputs: string[];
  logs: string[];
  nextActions: string[];
}
