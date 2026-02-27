import { Command } from "commander";

export function cmdGraphRender() {
  return new Command("render")
    .argument("<workflow_name>")
    .option("--live", "watch mode (stub)")
    .description("Render graph to browser (stub)")
    .action((workflowName: string, opts: { live?: boolean }) => {
      process.stdout.write(
        `TODO: render graph for ${workflowName}. live=${Boolean(opts.live)}\n` +
          `Plan: generate DOT/JSON, serve via local dev server, hot-reload on file change.\n`
      );
    });
}
