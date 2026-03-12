/**
 * Minimal CLI entry point for ExoFrame.
 *
 * Usage (when installed as a standalone script):
 *   exoframe --task "migrate all test files to vitest" [--mode draft|execute|review]
 *
 * When loaded via OpenClaw's registerCli, argv is the slice after "exoframe".
 */

import { run } from "@dexter/exoframe-core";
import type { ExoFrameMode } from "@dexter/exoframe-core";

// ---------------------------------------------------------------------------
// Argument parser (no external dependency – plain argv parsing)
// ---------------------------------------------------------------------------

interface CliArgs {
  task: string;
  mode: ExoFrameMode;
  files: string[];
}

function parseArgv(argv: string[]): CliArgs {
  let task = "";
  let mode: ExoFrameMode = "execute";
  const files: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--task" || arg === "-t") && argv[i + 1]) {
      task = argv[++i];
    } else if ((arg === "--mode" || arg === "-m") && argv[i + 1]) {
      const raw = argv[++i];
      if (raw === "draft" || raw === "execute" || raw === "review") {
        mode = raw;
      } else {
        console.warn(`Unknown mode "${raw}", defaulting to "execute".`);
      }
    } else if ((arg === "--file" || arg === "-f") && argv[i + 1]) {
      files.push(argv[++i]);
    } else if (!arg.startsWith("-") && !task) {
      // First positional arg is the task
      task = arg;
    }
  }

  return { task, mode, files };
}

// ---------------------------------------------------------------------------
// Output formatter
// ---------------------------------------------------------------------------

function printResult(result: Awaited<ReturnType<typeof run>>): void {
  const sep = "─".repeat(60);
  console.log(`\n${sep}`);
  console.log(`Status   : ${result.status.toUpperCase()}`);
  console.log(`Summary  : ${result.summary}`);

  if (result.outputs.length > 0) {
    console.log("\nOutputs:");
    for (const o of result.outputs) console.log(`  • ${o}`);
  }

  if (result.nextActions.length > 0) {
    console.log("\nNext actions:");
    for (const a of result.nextActions) console.log(`  → ${a}`);
  }

  console.log(sep);
}

// ---------------------------------------------------------------------------
// Main export – called by plugin's registerCli and by direct invocation
// ---------------------------------------------------------------------------

export async function runCli(argv: string[]): Promise<void> {
  const args = parseArgv(argv);

  if (!args.task) {
    console.error("Error: --task <description> is required.\n");
    console.error("Usage: exoframe --task <description> [--mode draft|execute|review] [--file <path>]");
    process.exit(1);
  }

  console.log(`Running ExoFrame task: "${args.task}" (mode: ${args.mode})`);

  const result = await run({
    task: args.task,
    mode: args.mode,
    files: args.files,
    context: {},
    constraints: [],
  });

  printResult(result);
}

// Allow direct execution: node dist/cli/exoframe.js --task "..."
if (process.argv[1]?.endsWith("exoframe.js")) {
  runCli(process.argv.slice(2)).catch((err) => {
    console.error("ExoFrame CLI error:", err);
    process.exit(1);
  });
}
