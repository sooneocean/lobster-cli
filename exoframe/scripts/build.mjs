#!/usr/bin/env node
/**
 * ExoFrame build script
 *
 * Builds packages in dependency order:
 *   1. @dexter/exoframe-core
 *   2. @dexter/exoframe-openclaw
 *
 * Usage:
 *   node scripts/build.mjs
 */

import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const packages = [
  "packages/core",
  "packages/openclaw-plugin",
];

let allOk = true;

for (const pkg of packages) {
  const pkgPath = resolve(root, pkg);
  console.log(`\n▶  Building ${pkg} …`);
  try {
    execSync("npm run build", {
      cwd: pkgPath,
      stdio: "inherit",
    });
    console.log(`✔  ${pkg} built successfully.`);
  } catch {
    console.error(`✖  ${pkg} build FAILED.`);
    allOk = false;
    // Continue building other packages so all errors are visible at once.
  }
}

if (!allOk) {
  console.error("\nBuild finished with errors.");
  process.exit(1);
}

console.log("\nAll packages built successfully.");
