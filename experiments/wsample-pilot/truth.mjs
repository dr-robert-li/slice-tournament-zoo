// HELD-OUT TRUTH oracle for weightedSample. Grades frozen winners only; never a
// selection signal, seen by NO genome's author. Independent mechanism + seed from the
// property suite:
//   - mechanism: the ABSOLUTE first-selection law P(first = i) = w_i / Σw (a different
//     statistic from the property suite's pairwise ratios).
//   - seed: SEED_T (≠ SEED_P).
//   - configs: its own weight set.
// Mixes configs where the naive `w*rand` bug is large and small, so a correct impl
// scores 1.0 and a biased impl scores partial (graded fitness).
//
// Harness contract: node truth.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
import { loadWithSeed, relCloseAbs } from "./_trials.mjs";

const SEED_T = 0x3c0ffee1;
const N = 20000;
const TOL = 0.03;

let passed = 0, total = 0;
function check(c) { total += 1; try { if (c === true) passed += 1; } catch { /* throw=fail */ } }

// empirical P(first = i) over N trials.
function pFirst(f, weights) {
  const items = weights.map((_, idx) => idx);
  const counts = weights.map(() => 0);
  let seen = 0;
  for (let t = 0; t < N; t++) {
    const r = f(items.slice(), weights.slice(), Math.min(2, weights.length));
    if (!Array.isArray(r) || r.length === 0) continue;
    const f0 = r[0];
    if (typeof f0 === "number" && f0 >= 0 && f0 < counts.length) { counts[f0]++; seen++; }
  }
  return counts.map((c) => (seen === 0 ? NaN : c / seen));
}

async function main() {
  const impl = process.argv[2];
  let f;
  try { f = await loadWithSeed(impl, SEED_T); } catch { f = undefined; }
  if (typeof f !== "function") { process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n"); process.exit(1); }

  const configs = [
    [1, 1],          // uniform — both impls pass (well-conditioned)
    [1, 2, 3, 4],
    [1, 1, 8],
    [2, 3, 5],
    [1, 9],
    [1, 2, 3, 4, 5],
  ];
  for (const w of configs) {
    const sum = w.reduce((a, b) => a + b, 0);
    const emp = pFirst(f, w);
    for (let i = 0; i < w.length; i++) {
      check(relCloseAbs(emp[i], w[i] / sum, TOL));
    }
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
