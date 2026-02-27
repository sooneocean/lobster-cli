import { Command } from "commander";
import { readThread } from "../lib/store.js";

export function cmdStateInspect() {
  return new Command("inspect")
    .argument("<thread_id>")
    .description("Inspect durable execution state (stub)")
    .action(async (threadId: string) => {
      const t = await readThread(threadId);
      if (!t) {
        process.stderr.write(`not found: ${threadId}\n`);
        process.exitCode = 1;
        return;
      }
      process.stdout.write(JSON.stringify(t, null, 2) + "\n");
    });
}
