import path from "node:path";
import os from "node:os";

export function storageDir() {
  return path.join(os.homedir(), ".lobster", "storage");
}

export function ensurePosix(p: string) {
  return p.split(path.sep).join("/");
}
