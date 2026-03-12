/**
 * ExoFrame OpenClaw Plugin – entry point.
 *
 * OpenClaw's plugin loader calls the default export (or named export
 * `registerExoFramePlugin`) with an API object when the plugin is loaded.
 *
 * NOTE: OpenClaw's SDK type definitions are not publicly available at the time
 * of writing.  We use the minimal `OpenClawPluginAPI` interface below to
 * express only the surface we actually need.  Once official types ship, replace
 * this interface with the real import.
 */

import { handleExoframeRun } from "./tools/exoframe_run.js";
import { handleExoframeStatus } from "./tools/exoframe_status.js";
import { rpcRun } from "./rpc/run.js";
import { rpcStatus } from "./rpc/status.js";

// ---------------------------------------------------------------------------
// Minimal OpenClaw API surface (placeholder until official SDK ships)
// ---------------------------------------------------------------------------

/** A single tool definition presented to OpenClaw's tool registry. */
export interface OpenClawToolDefinition {
  name: string;
  description: string;
  /** JSON-Schema object describing accepted parameters. */
  parameters: Record<string, unknown>;
  handler: (params: Record<string, unknown>, ctx: OpenClawContext) => Promise<unknown>;
}

/** An RPC endpoint definition. */
export interface OpenClawRpcDefinition {
  /** Dotted namespace, e.g. "exoframe.run" */
  method: string;
  handler: (params: Record<string, unknown>, ctx: OpenClawContext) => Promise<unknown>;
}

/** Runtime context injected into every handler call. */
export interface OpenClawContext {
  /** Resolved plugin configuration (validated against openclaw.plugin.json#configSchema). */
  config: ExoFramePluginConfig;
  /** Logging utility provided by the host. */
  log: (level: "info" | "warn" | "error", message: string) => void;
  // TODO: add workspace accessor, permission checker, etc. once API stabilises
}

/** Plugin configuration shape – mirrors openclaw.plugin.json#configSchema. */
export interface ExoFramePluginConfig {
  workspaceRoot: string;
  defaultMode: "draft" | "execute" | "review";
  allowWrite: boolean;
}

/** Minimal subset of the OpenClaw plugin registration API. */
export interface OpenClawPluginAPI {
  registerTool: (tool: OpenClawToolDefinition) => void;
  registerRpc: (rpc: OpenClawRpcDefinition) => void;
  /** CLI command registration – optional as not all hosts expose a CLI. */
  registerCli?: (command: {
    name: string;
    description: string;
    /** argv handler; receives the slice after the command name. */
    run: (argv: string[]) => Promise<void>;
  }) => void;
}

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

/**
 * Called by OpenClaw when it loads this plugin.
 *
 * Register order: tools → RPCs → CLI
 */
export function registerExoFramePlugin(api: OpenClawPluginAPI): void {
  // --- Tools ---
  api.registerTool({
    name: "exoframe_run",
    description:
      "Run an ExoFrame task pipeline: validate → plan → execute → verify. " +
      "Returns a structured result with summary, outputs, and next actions.",
    parameters: {
      type: "object",
      required: ["task"],
      properties: {
        task: { type: "string", description: "Natural-language task description." },
        mode: {
          type: "string",
          enum: ["draft", "execute", "review"],
          description: "Execution mode. Defaults to plugin config defaultMode.",
        },
        context: {
          type: "object",
          description: "Arbitrary key-value context passed to the pipeline.",
        },
        constraints: {
          type: "array",
          items: { type: "string" },
          description: "Explicit constraints the pipeline must respect.",
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "File paths relevant to the task.",
        },
      },
    },
    handler: handleExoframeRun,
  });

  api.registerTool({
    name: "exoframe_status",
    description:
      "Query the status of an ExoFrame run. Optionally supply a runId to retrieve a specific run.",
    parameters: {
      type: "object",
      properties: {
        runId: {
          type: "string",
          description: "ID of a previous run. Omit to get the most recent run status.",
        },
      },
    },
    handler: handleExoframeStatus,
  });

  // --- RPCs ---
  api.registerRpc({ method: "exoframe.run", handler: rpcRun });
  api.registerRpc({ method: "exoframe.status", handler: rpcStatus });

  // --- CLI (optional) ---
  if (api.registerCli) {
    api.registerCli({
      name: "exoframe",
      description: "Run ExoFrame tasks from the OpenClaw CLI.",
      run: async (argv) => {
        // Lazy import to avoid loading CLI deps when not needed
        const { runCli } = await import("./cli/exoframe.js");
        await runCli(argv);
      },
    });
  }
}

export default registerExoFramePlugin;
