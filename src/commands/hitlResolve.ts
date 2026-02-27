import { Command } from "commander";
import { listHitlTasks, writeHitlTasks } from "../lib/store.js";

export function cmdHitlResolve() {
  return new Command("resolve")
    .argument("<thread_id>")
    .requiredOption("--action <approve|reject|revise>")
    .description("Resolve a HITL task for a thread (stub)")
    .action((threadId: string, opts: { action: "approve" | "reject" | "revise" }) => {
      const tasks = listHitlTasks();
      const idx = tasks.findIndex((t) => t.thread_id === threadId && t.status === "pending");
      if (idx === -1) {
        process.stderr.write(`no pending task for thread: ${threadId}\n`);
        process.exitCode = 1;
        return;
      }
      tasks[idx] = { ...tasks[idx], status: "resolved", action: opts.action };
      writeHitlTasks(tasks);
      process.stdout.write(`OK: resolved ${threadId} -> ${opts.action}\n`);
    });
}
