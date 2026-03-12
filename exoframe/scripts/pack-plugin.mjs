#!/usr/bin/env node
/**
 * ExoFrame pack-plugin script
 *
 * Runs `npm pack` inside packages/openclaw-plugin and reports the output
 * .tgz filename so you can pass it directly to:
 *
 *   openclaw plugins install ./packages/openclaw-plugin/<filename>.tgz
 *
 * Usage:
 *   node scripts/pack-plugin.mjs
 */

import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginDir = resolve(__dirname, "../packages/openclaw-plugin");

console.log("▶  Packing @dexter/exoframe-openclaw …\n");

try {
  // npm pack prints the generated filename to stdout
  const output = execSync("npm pack", {
    cwd: pluginDir,
    encoding: "utf-8",
  }).trim();

  // npm pack may output extra lines; the last non-empty line is the filename
  const lines = output.split("\n").filter(Boolean);
  const tgzName = lines[lines.length - 1];
  const tgzPath = resolve(pluginDir, tgzName);

  console.log(`✔  Plugin packed: ${tgzPath}\n`);
  console.log("To install in OpenClaw, run:");
  console.log(`   openclaw plugins install -l ${pluginDir}\n`);
  console.log("Or install the packed tarball:");
  console.log(`   openclaw plugins install ${tgzPath}`);
} catch (err) {
  console.error("✖  npm pack failed:", err.message);
  process.exit(1);
}
