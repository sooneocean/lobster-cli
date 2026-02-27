import { Command } from "commander";
import pLimit from "p-limit";
import { writeThread } from "../lib/store.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function cmdChaosSpawn() {
  return new Command("spawn")
    .argument("<workflow_name>")
    .requiredOption("--workers <n>", "number of workers", (v) => parseInt(v, 10))
    .option("--mock <name>", "mock profile")
    .option("--concurrency <n>", "parallelism", (v) => parseInt(v, 10), 50)
    .description("Spawn many mock runs to stress durable execution")
    .action(async (workflowName: string, opts: { workers: number; mock?: string; concurrency: number }) => {
      const limit = pLimit(opts.concurrency);
      const started = Date.now();

      const jobs = Array.from({ length: opts.workers }).map((_, i) =>
        limit(async () => {
          const thread_id = `${workflowName}-${i + 1}`;
          const ts = new Date().toISOString();
          const latency = opts.mock === "erp" ? 150 + Math.random() * 300 : 20 + Math.random() * 50;
          await sleep(latency);
          await writeThread({
            thread_id,
            updated_at: ts,
            current_step: "entry",
            state: { workflow: workflowName, worker: i + 1, mock: opts.mock ?? null },
            checkpoints: [{ step: "entry", ts, state: { ok: true } }]
          });
        })
      );

      await Promise.all(jobs);
      const dur = Date.now() - started;
      process.stdout.write(`OK: spawned ${opts.workers} workers in ${dur}ms\n`);
    });
}
