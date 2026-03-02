import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import chokidar from "chokidar";
import { storageDir, ensurePosix } from "../lib/paths.js";

type GraphSchema = {
  nodes: Array<{ id: string; label?: string }>;
  edges: Array<{ from: string; to: string }>;
};

function listNodes(wfDir: string) {
  const nodesDir = path.join(wfDir, "nodes");
  if (!fs.existsSync(nodesDir)) return [] as string[];
  return fs.readdirSync(nodesDir).filter((f) => f.endsWith(".ts")).map((f) => path.parse(f).name);
}

function readGraphSchema(wfDir: string): GraphSchema | null {
  const json = path.join(wfDir, "graph.json");
  if (!fs.existsSync(json)) return null;
  return JSON.parse(fs.readFileSync(json, "utf8"));
}

async function readGraphFromModule(modPath?: string): Promise<GraphSchema | null> {
  if (!modPath) return null;
  const abs = path.isAbsolute(modPath) ? modPath : path.resolve(process.cwd(), modPath);
  if (!fs.existsSync(abs)) throw new Error(`module not found: ${abs}`);
  const mod = await import(abs);
  if (mod.graphSchema) return mod.graphSchema as GraphSchema;
  if (typeof mod.getGraphSchema === "function") return (await mod.getGraphSchema()) as GraphSchema;
  if (mod.graph && mod.graph.nodes && mod.graph.edges) return mod.graph as GraphSchema;
  return null;
}

function renderMermaid(schema: GraphSchema | null, nodesFallback: string[]) {
  if (schema && schema.nodes?.length) {
    const lines = ["graph TD"];
    for (const n of schema.nodes) lines.push(`  ${n.id}[${n.label ?? n.id}]`);
    for (const e of schema.edges || []) lines.push(`  ${e.from}-->${e.to}`);
    return lines.join("\n");
  }
  if (nodesFallback.length === 0) return "graph TD\n  Start-->End";
  const lines = ["graph TD", "  Start-->" + nodesFallback[0]];
  for (let i = 0; i < nodesFallback.length - 1; i++) {
    lines.push(`  ${nodesFallback[i]}-->${nodesFallback[i + 1]}`);
  }
  lines.push(`  ${nodesFallback[nodesFallback.length - 1]}-->End`);
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
    .option("--module <path>", "import a JS module that exports graphSchema")
    .description("Render graph to browser (mermaid)")
    .action(async (workflowName: string, opts: { live?: boolean; port: number; module?: string }) => {
      const wfDir = path.resolve(process.cwd(), workflowName);
      if (!fs.existsSync(wfDir)) throw new Error(`workflow not found: ${wfDir}`);

      const outDir = path.join(storageDir(), "graph");
      fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, `${workflowName}.html`);

      const write = async () => {
        const modSchema = await readGraphFromModule(opts.module);
        const schema = modSchema ?? readGraphSchema(wfDir);
        const nodes = listNodes(wfDir);
        const html = buildHtml(renderMermaid(schema, nodes));
        fs.writeFileSync(outFile, html);
      };

      await write();

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
        write().catch((e) => process.stderr.write(String(e) + "\n"));
      });
    });
}
