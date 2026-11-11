import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const SKIP = new Set(["node_modules", ".git"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (name.endsWith(".js") || name.endsWith(".mjs")) files.push(path);
  }
  return files;
}

const files = walk(".");
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed += 1;
    process.stderr.write(`${file}\n${result.stderr || result.stdout}`);
  }
}

if (failed) {
  process.stderr.write(`${failed} file(s) failed syntax check\n`);
  process.exit(1);
}

console.log(`syntax ok (${files.length} files)`);
