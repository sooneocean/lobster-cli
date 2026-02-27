import { Command } from "commander";

export function cmdChaosSpawn() {
  return new Command("spawn")
    .argument("<workflow_name>")
    .requiredOption("--workers <n>", "number of workers", (v) => parseInt(v, 10))
    .option("--mock <name>", "mock profile")
    .description("Spawn many mock runs to stress durable execution (stub)")
    .action((workflowName: string, opts: { workers: number; mock?: string }) => {
      process.stdout.write(
        `TODO: chaos spawn ${opts.workers} workers for ${workflowName} mock=${opts.mock ?? "none"}\n`
      );
    });
}
