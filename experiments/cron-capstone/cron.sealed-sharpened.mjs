// SHARPENED sealed scorer = the permissive sealed suite PLUS the must-throw cases the
// test-author heuristic emits once the `malformed-trailing-token` mutator is promoted
// into the battery (the flagship automated-suite-sharpening mechanism). A correct impl
// passes; an impl that accepts malformed trailing tokens (e.g. "5abc") FAILS the
// must-throw cases, so harness-mine half-ii reports survives:false. Prints one JSON line
// {passed,total,passRate}.
import { execFileSync } from "node:child_process";

const ROOT = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot";
const SEALED = `${ROOT}/suites-v2/cron.sealed.mjs`;
// must-throw cases derived from the promoted malformed-token class (battery-driven).
const MUST_THROW = ["5abc * * * *", "1a * * * *", "*/2x * * * *", "1-5z * * * *", "0 0 3b * *"];

async function main() {
  const impl = process.argv[2];
  // 1. permissive sealed score (subprocess, same contract).
  let sealedPassed = 0, sealedTotal = 0;
  try {
    const out = execFileSync("node", [SEALED, impl], { encoding: "utf8" });
    const j = JSON.parse(out.trim().split("\n").pop());
    sealedPassed = j.passed; sealedTotal = j.total;
  } catch (e) {
    const s = (e.stdout || "").toString().trim();
    if (s) { const j = JSON.parse(s.split("\n").pop()); sealedPassed = j.passed; sealedTotal = j.total; }
  }
  // 2. battery-derived must-throw cases.
  let f;
  try { f = (await import(impl)).nextRun; } catch { f = undefined; }
  const after = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
  let mtPassed = 0;
  for (const expr of MUST_THROW) {
    let threw = false;
    try { f(expr, new Date(after)); } catch { threw = true; }
    if (threw) mtPassed++;
  }
  const passed = sealedPassed + mtPassed;
  const total = sealedTotal + MUST_THROW.length;
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
