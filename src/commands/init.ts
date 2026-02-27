import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import fse from "fs-extra";
import pc from "picocolors";

function copyDir(src: string, dest: string) {
  fse.mkdirpSync(dest);
  fse.copySync(src, dest, { overwrite: false, errorOnExist: false });
}

export function cmdInit() {
  const cmd = new Command("init")
    .argument("<workflow_type>")
    .description("Scaffold a LangGraph workflow skeleton")
    .option("--dir <dir>", "target directory", ".")
    .action((workflowType: string, opts: { dir: string }) => {
      const root = path.resolve(process.cwd(), opts.dir);
      const wfDir = path.join(root, workflowType);
      const tplRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../templates");
      if (fs.existsSync(wfDir) && fs.readdirSync(wfDir).length > 0) {
        throw new Error(`target not empty: ${wfDir}`);
      }
      fse.mkdirpSync(wfDir);
      copyDir(path.join(tplRoot, "workflow"), wfDir);
      const rename = (p: string) => fs.readFileSync(p, "utf8").replaceAll("__WORKFLOW__", workflowType);
      for (const rel of ["state.ts", "nodes/entry.ts", "graph.ts", "checkpointer.ts"]) {
        const fp = path.join(wfDir, rel);
        fs.writeFileSync(fp, rename(fp));
      }
      process.stdout.write(pc.green(`OK: scaffolded ${workflowType} -> ${path.relative(process.cwd(), wfDir)}\n`));
    });
  return cmd;
}
