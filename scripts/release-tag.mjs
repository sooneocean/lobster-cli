import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
const v = `v${pkg.version}`;
execSync(`git tag ${v}`);
execSync(`git push origin ${v}`);
console.log(`tagged ${v}`);
