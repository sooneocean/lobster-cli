import { Command } from "commander";
import fs from "node:fs";
import { readThread, writeThread } from "../lib/store.js";

export function cmdStateMutate() {
  return new Command("mutate")
    .argument("<thread_id>")
    .requiredOption("--apply <patch.json>")
    .description("Apply a state schema patch to an in-flight thread (stub)")
    .action(async (threadId: string, opts: { apply: string }) => {
      const t = await readThread(threadId);
      if (!t) {
        process.stderr.write(`not found: ${threadId}\n`);
        process.exitCode = 1;
        return;
      }
      const patch = JSON.parse(fs.readFileSync(opts.apply, "utf8"));
      t.state = { ...t.state, ...patch };
      t.updated_at = new Date().toISOString();
      await writeThread(t);
      process.stdout.write(`OK: mutated ${threadId}\n`);
    });
}
