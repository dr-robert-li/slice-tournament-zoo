// MUTANT sealed suite (genome sharper-v1, heuristicId = "property-fuzz-v1").
// Single-gene substitution: author distributional PROPERTY tests instead of structural
// examples. Mechanism: the PAIRWISE precedence invariant P(i before j) = w_i/(w_i+w_j)
// (Plackett-Luce), estimated over many seeded trials across several weight configs.
//
// TRAIN-ON-TEST GUARD: this is a DIFFERENT statistic and a DIFFERENT seed from the truth
// oracle (which uses the absolute first-selection law P(first=i)=w_i/Σw under SEED_T).
// Here: pairwise ratios, SEED_P. The suites share no trial stream; a win is broad
// distributional coverage, not a peek at truth.
//
// Harness contract: node property_suite.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
import { loadWithSeed, relCloseAbs } from "./_trials.mjs";

const SEED_P = 0x9b1e0017;
const N = 20000;
const TOL = 0.03;

let passed = 0, total = 0;
function check(c) { total += 1; try { if (c === true) passed += 1; } catch { /* throw=fail */ } }

// P(i before j) over N trials of a FULL ordering (k = n).
function pBefore(f, weights, i, j) {
  const items = weights.map((_, idx) => idx);
  let iWins = 0, seen = 0;
  for (let t = 0; t < N; t++) {
    const order = f(items.slice(), weights.slice(), weights.length);
    const pi = order.indexOf(i), pj = order.indexOf(j);
    if (pi < 0 || pj < 0) continue;
    seen++;
    if (pi < pj) iWins++;
  }
  return seen === 0 ? NaN : iWins / seen;
}

async function main() {
  const impl = process.argv[2];
  let f;
  try { f = await loadWithSeed(impl, SEED_P); } catch { f = undefined; }
  if (typeof f !== "function") { process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n"); process.exit(1); }

  const configs = [
    [1, 3],
    [2, 5],
    [1, 2, 4],
    [3, 3, 1],
    [1, 4, 9],
  ];
  for (const w of configs) {
    for (let i = 0; i < w.length; i++) {
      for (let j = i + 1; j < w.length; j++) {
        const exp = w[i] / (w[i] + w[j]);
        check(relCloseAbs(pBefore(f, w, i, j), exp, TOL));
      }
    }
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
