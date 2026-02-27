import { Command } from "commander";

export function cmdTraceSnipe() {
  return new Command("snipe")
    .argument("<thread_id>")
    .option("--cost", "show estimated token cost (stub)")
    .description("Fetch LangSmith trace details (stub)")
    .action((threadId: string, opts: { cost?: boolean }) => {
      process.stdout.write(
        `TODO: LangSmith API trace for ${threadId}. cost=${Boolean(opts.cost)}\n` +
          `Plan: call LangSmith REST, summarize spans, compute token/cost hot spots.\n`
      );
    });
}
