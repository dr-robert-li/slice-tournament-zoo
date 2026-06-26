// Deterministic scorer for the out-of-recall arm (N6: over STORED artifacts). One blind
// pool of K=8. Selection metric per PREREG §2 = expected truth over each genome's
// indifference set. Emits JSON to stdout.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const POOL = [1, 2, 3, 4, 5, 6, 7, 8];

function runSuite(suite, impl) {
  try {
    const out = execFileSync("node", [join(here, suite), impl], { encoding: "utf8" });
    return JSON.parse(out.trim().split("\n").pop()).passRate;
  } catch (e) {
    const out = (e.stdout || "").toString().trim().split("\n").pop();
    try { return JSON.parse(out).passRate; } catch { return 0; }
  }
}
function argmaxSet(scored, key) {
  const max = Math.max(...scored.map((s) => s[key]));
  return scored.filter((s) => Math.abs(s[key] - max) < 1e-12);
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const scored = [];
for (const k of POOL) {
  const impl = join(here, `runs/pool/c${k}.mjs`);
  if (!existsSync(impl)) continue;
  scored.push({
    id: `c${k}`,
    fixed: runSuite("fixed_suite.mjs", impl),
    prop: runSuite("property_suite.mjs", impl),
    truth: runSuite("truth.mjs", impl),
  });
}
const incSet = argmaxSet(scored, "fixed");
const mutSet = argmaxSet(scored, "prop");
const fitness_inc = mean(incSet.map((s) => s.truth));
const fitness_mut = mean(mutSet.map((s) => s.truth));

const result = {
  substrate: "weightedSample (weighted sampling without replacement) — fresh, non-enumerable, OUT-OF-RECALL",
  metric: "expected truth over each genome's selector-indifference set (PREREG §2)",
  specimens: scored,
  incumbent_indifference_set: incSet.map((s) => s.id),
  sharper_argmax_set: mutSet.map((s) => s.id),
  fitness_inc, fitness_mut,
  win: fitness_mut > fitness_inc,
  all_correct_pool: scored.every((s) => s.truth === 1),
  buggy_specimens: scored.filter((s) => s.truth < 1).map((s) => s.id),
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
