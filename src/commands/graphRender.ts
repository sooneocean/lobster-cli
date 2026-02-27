import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import chokidar from "chokidar";
import { storageDir, ensurePosix } from "../lib/paths.js";

function listNodes(wfDir: string) {
  const nodesDir = path.join(wfDir, "nodes");
  if (!fs.existsSync(nodesDir)) return [] as string[];
  return fs.readdirSync(nodesDir).filter((f) => f.endsWith(".ts")).map((f) => path.parse(f).name);
}

function renderMermaid(nodes: string[]) {
  if (nodes.length === 0) return "graph TD\n  Start-->End";
  const lines = ["graph TD", "  Start-->" + nodes[0]];
  for (let i = 0; i < nodes.length - 1; i++) {
    lines.push(`  ${nodes[i]}-->${nodes[i + 1]}`);
  }
  lines.push(`  ${nodes[nodes.length - 1]}-->End`);
  return lines.join("\n");
}

function buildHtml(mermaid: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true });</script>
  <style>body{font-family:system-ui;margin:20px}</style>
</head>
<body>
  <div class="mermaid">
${mermaid}
  </div>
</body>
</html>`;
}

export function cmdGraphRender() {
  return new Command("render")
    .argument("<workflow_name>")
    .option("--live", "watch mode")
    .option("--port <n>", "dev server port", (v) => parseInt(v, 10), 7731)
    .description("Render graph to browser (mermaid)")
    .action((workflowName: string, opts: { live?: boolean; port: number }) => {
      const wfDir = path.resolve(process.cwd(), workflowName);
      if (!fs.existsSync(wfDir)) throw new Error(`workflow not found: ${wfDir}`);

      const outDir = path.join(storageDir(), "graph");
      fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, `${workflowName}.html`);

      const write = () => {
        const nodes = listNodes(wfDir);
        const html = buildHtml(renderMermaid(nodes));
        fs.writeFileSync(outFile, html);
      };

      write();

      if (!opts.live) {
        process.stdout.write(`OK: ${ensurePosix(outFile)}\n`);
        return;
      }

      const server = http.createServer((_, res) => {
        res.setHeader("content-type", "text/html");
        res.end(fs.readFileSync(outFile, "utf8"));
      });
      server.listen(opts.port, () => {
        process.stdout.write(`LIVE: http://localhost:${opts.port} (watching ${ensurePosix(wfDir)})\n`);
      });

      chokidar.watch(wfDir, { ignoreInitial: true }).on("all", () => {
        try {
          write();
        } catch (e) {
          process.stderr.write(String(e) + "\n");
        }
      });
    });
}
