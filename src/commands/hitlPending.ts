import { Command } from "commander";
import { listHitlTasks } from "../lib/store.js";

export function cmdHitlPending() {
  return new Command("pending")
    .description("List pending HITL tasks (stub)")
    .action(() => {
      const tasks = listHitlTasks().filter((t) => t.status === "pending");
      process.stdout.write(JSON.stringify(tasks, null, 2) + "\n");
    });
}
