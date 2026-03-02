import { Command } from "commander";
import path from "node:path";
import { readThread } from "../lib/store.js";

async function importPath(p: string) {
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  return abs;
}

export function cmdStateInspect() {
  return new Command("inspect")
    .argument("<thread_id>")
    .description("Inspect durable execution state")
    .option("--module <path>", "import adapter module for LangGraph checkpointer")
    .action(async (threadId: string, opts: { module?: string }) => {
      if (opts.module) {
        const modPath = await importPath(opts.module);
        const mod = await import(modPath);
        if (typeof mod.getThreadState !== "function") throw new Error("adapter missing getThreadState()");
        const t = await mod.getThreadState(threadId);
        process.stdout.write(JSON.stringify(t, null, 2) + "\n");
        return;
      }
      const t = await readThread(threadId);
      if (!t) {
        process.stderr.write(`not found: ${threadId}\n`);
        process.exitCode = 1;
        return;
      }
      process.stdout.write(JSON.stringify(t, null, 2) + "\n");
    });
}
