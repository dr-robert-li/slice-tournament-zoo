// Deterministic scorer for the harness-evolve arm (N6: runs over STORED specimen
// artifacts, no regeneration). For each seed it runs all three suites on every
// specimen, then computes the pre-registered selection metric:
//   fitness_inc(seed) = mean truth over argmax(fixed_suite passRate)   [incumbent]
//   fitness_mut(seed) = mean truth over argmax(property_suite passRate) [sharper-v1]
// "expected truth over the selector's indifference set" — the faithful "the suite
// can't see within its ties" accounting (PREREG §3). Emits JSON to stdout.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SEEDS = [1, 2, 3];
const SPECIMENS = [1, 2, 3, 4, 5];

function runSuite(suite, impl) {
  try {
    const out = execFileSync("node", [join(here, suite), impl], { encoding: "utf8" });
    const line = out.trim().split("\n").pop();
    return JSON.parse(line).passRate;
  } catch (e) {
    // a suite exits non-zero when passRate<1; recover the JSON it still printed
    const out = (e.stdout || "").toString().trim().split("\n").pop();
    try { return JSON.parse(out).passRate; } catch { return 0; }
  }
}

function argmaxSet(scored, key) {
  const max = Math.max(...scored.map((s) => s[key]));
  return scored.filter((s) => Math.abs(s[key] - max) < 1e-12);
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const perSeed = [];
for (const seed of SEEDS) {
  const scored = [];
  for (const k of SPECIMENS) {
    const impl = join(here, `runs/seed-${seed}/c${k}.mjs`);
    if (!existsSync(impl)) continue;
    scored.push({
      id: `s${seed}c${k}`,
      fixed: runSuite("fixed_suite.mjs", impl),
      prop: runSuite("property_suite.mjs", impl),
      truth: runSuite("truth.mjs", impl),
    });
  }
  const incSet = argmaxSet(scored, "fixed");
  const mutSet = argmaxSet(scored, "prop");
  const fitness_inc = mean(incSet.map((s) => s.truth));
  const fitness_mut = mean(mutSet.map((s) => s.truth));
  perSeed.push({
    seed,
    specimens: scored,
    incumbent_indifference_set: incSet.map((s) => s.id),
    sharper_argmax_set: mutSet.map((s) => s.id),
    fitness_inc,
    fitness_mut,
    win: fitness_mut > fitness_inc,
  });
}

const mean_inc = mean(perSeed.map((s) => s.fitness_inc));
const mean_mut = mean(perSeed.map((s) => s.fitness_mut));
const result = {
  substrate: "streamStats (single-pass population variance) — fresh, non-enumerable",
  metric: "expected truth over each genome's selector-indifference set (PREREG §3)",
  perSeed,
  mean_fitness_incumbent: mean_inc,
  mean_fitness_sharper: mean_mut,
  promote_by_decision_rule: mean_mut > mean_inc,
  all_correct_pools: perSeed.every((s) => s.specimens.every((x) => x.truth === 1)),
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
