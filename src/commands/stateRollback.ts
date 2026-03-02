import { Command } from "commander";
import path from "node:path";
import { readThread, writeThread } from "../lib/store.js";

async function importPath(p: string) {
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  return abs;
}

export function cmdStateRollback() {
  return new Command("rollback")
    .argument("<thread_id>")
    .requiredOption("--step <step_name>", "checkpoint step name")
    .description("Rollback to a prior checkpoint")
    .option("--module <path>", "import adapter module for LangGraph checkpointer")
    .action(async (threadId: string, opts: { step: string; module?: string }) => {
      if (opts.module) {
        const modPath = await importPath(opts.module);
        const mod = await import(modPath);
        if (typeof mod.rollbackThread !== "function") throw new Error("adapter missing rollbackThread()");
        await mod.rollbackThread(threadId, opts.step);
        process.stdout.write(`OK: rolled back ${threadId} -> ${opts.step}\n`);
        return;
      }
      const t = await readThread(threadId);
      if (!t) {
        process.stderr.write(`not found: ${threadId}\n`);
        process.exitCode = 1;
        return;
      }
      const cp = [...t.checkpoints].reverse().find((c) => c.step === opts.step);
      if (!cp) {
        process.stderr.write(`checkpoint not found: ${opts.step}\n`);
        process.exitCode = 1;
        return;
      }
      t.state = cp.state;
      t.current_step = cp.step;
      t.updated_at = new Date().toISOString();
      await writeThread(t);
      process.stdout.write(`OK: rolled back ${threadId} -> ${opts.step}\n`);
    });
}
