import { Command } from "commander";
import { readThread, writeThread } from "../lib/store.js";

export function cmdStateRollback() {
  return new Command("rollback")
    .argument("<thread_id>")
    .requiredOption("--step <step_name>", "checkpoint step name")
    .description("Rollback to a prior checkpoint (stub)")
    .action(async (threadId: string, opts: { step: string }) => {
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
