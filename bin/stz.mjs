#!/usr/bin/env node
// npx stz entrypoint. Runs the TS CLI via tsx so the package needs no build
// step (N10: minimal toolchain). For a published build this would point at
// compiled dist/cli.js; for the source-available template repo, tsx is fine.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "src", "cli.ts");
const r = spawnSync("npx", ["tsx", cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
