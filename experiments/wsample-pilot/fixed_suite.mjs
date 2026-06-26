// INCUMBENT sealed suite (genome baseline-v0, heuristicId = "explicit-examples-v0").
// GOOD-FAITH competent structural suite for weightedSample: it checks the things a
// careful author verifies WITHOUT building a distributional oracle — correct length,
// distinctness, subset membership, no mutation, k=0 and k=n edges — plus ONE weak
// distributional smoke (heavier item is picked first more often than lighter, over a
// modest sample). The naive `w*rand` impl passes ALL of this; the suite cannot see the
// proportionality bug, which is the whole point of the arm. NOT a strawman.
//
// Harness contract: node fixed_suite.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
import { loadWithSeed } from "./_trials.mjs";

let passed = 0, total = 0;
function check(c) { total += 1; try { if (c === true) passed += 1; } catch { /* throw=fail */ } }

async function main() {
  const impl = process.argv[2];
  let f;
  try { f = await loadWithSeed(impl, 0x100d); } catch { f = undefined; }
  if (typeof f !== "function") { process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n"); process.exit(1); }

  const items = [0, 1, 2, 3, 4];
  const weights = [1, 2, 3, 4, 5];

  // structure across k
  for (const k of [0, 1, 3, 5]) {
    const r = f(items.slice(), weights.slice(), k);
    check(Array.isArray(r) && r.length === k);
    check(new Set(r).size === k);                       // distinct
    check(r.every((x) => items.includes(x)));           // subset
  }
  // no mutation
  const itC = items.slice(), wC = weights.slice();
  f(itC, wC, 3);
  check(itC.length === 5 && itC.every((x, i) => x === items[i]));
  check(wC.length === 5 && wC.every((x, i) => x === weights[i]));

  // weak distributional smoke: with weights [1,9], item 1 is first MORE often than item 0
  // over 2000 trials. Both correct and naive pass this — it does not pin proportionality.
  let first1 = 0, first0 = 0;
  for (let t = 0; t < 2000; t++) {
    const r = f([0, 1], [1, 9], 2);
    if (r[0] === 1) first1++; else if (r[0] === 0) first0++;
  }
  check(first1 > first0);

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
