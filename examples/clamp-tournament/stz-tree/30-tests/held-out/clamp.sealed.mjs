// SEALED held-out suite for slice `clamp`. Frozen test author output.
// Harness contract: node clamp.sealed.mjs <impl-path>
// Imports `clamp` export, runs edge + randomized property checks,
// prints exactly one JSON line {"passed":int,"total":int,"passRate":float},
// exits 0 iff passRate === 1 else 1. Node built-ins only.

let passed = 0;
let total = 0;

function check(cond) {
  total += 1;
  try {
    if (cond === true) passed += 1;
  } catch {
    // a throwing predicate counts as a failure, not an abort
  }
}

// Assert the three done-predicates for a single (x, lo, hi) with lo <= hi.
// Each predicate is an independent assertion so partial gaming is exposed.
function assertContract(clamp, x, lo, hi) {
  let r;
  let threw = false;
  try {
    r = clamp(x, lo, hi);
  } catch {
    threw = true;
  }
  // P0: must not throw on valid input
  check(threw === false);
  if (threw) {
    // still consume the remaining predicate slots as failures for honest counts
    check(false); // P1 bounds
    check(false); // P2 interior identity / boundary
    check(false); // P3 saturation direction
    return;
  }
  // P1: result lies within the inclusive range
  check(lo <= r && r <= hi);
  // P2: interior/boundary identity — if lo <= x <= hi then result === x
  if (lo <= x && x <= hi) {
    check(r === x);
  } else {
    // outside the range: result must be the saturated endpoint, never x
    check(r !== x || x === lo || x === hi);
  }
  // P3: saturation direction
  if (x < lo) {
    check(r === lo);
  } else if (x > hi) {
    check(r === hi);
  } else {
    // inside [lo, hi]: already covered by P2 identity; reaffirm membership
    check(r === x);
  }
}

async function main() {
  const implPath = process.argv[2];
  let clamp;
  try {
    const mod = await import(implPath);
    clamp = mod.clamp;
  } catch (e) {
    // Import failure: emit a zeroed result so the orchestrator gets the JSON line.
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }

  if (typeof clamp !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }

  // --- Hard edge cases: [x, lo, hi] ---
  const edges = [
    // x strictly below lo
    [-5, 0, 10],
    [0, 1, 1],            // x < lo with lo == hi
    // x strictly above hi
    [15, 0, 10],
    [2, 1, 1],            // x > hi with lo == hi
    // x == lo (boundary, identity)
    [0, 0, 10],
    // x == hi (boundary, identity)
    [10, 0, 10],
    // x strictly inside
    [5, 0, 10],
    [7, -3, 9],
    // far below / far above
    [-1e9, 0, 10],
    [1e9, 0, 10],
    // negative ranges
    [-50, -20, -10],      // below
    [-5, -20, -10],       // above
    [-15, -20, -10],      // inside
    [-20, -20, -10],      // == lo
    [-10, -20, -10],      // == hi
    // lo == hi degenerate, x inside (== both)
    [3, 3, 3],
    // lo == hi, x below and above
    [1, 3, 3],
    [9, 3, 3],
    // fractional values
    [0.5, 0, 1],          // inside
    [-0.25, 0, 1],        // below
    [1.75, 0, 1],         // above
    [0.123456789, 0.1, 0.2], // inside fractional
    // mixed-sign range
    [0, -5, 5],           // inside
    [-9, -5, 5],          // below
    [9, -5, 5],           // above
    // large magnitude range
    [12345, -1e6, 1e6],   // inside
  ];
  for (const [x, lo, hi] of edges) {
    assertContract(clamp, x, lo, hi);
  }

  // --- ~50 randomized property checks ---
  // Random lo, then a non-negative span -> hi >= lo guaranteed.
  // x drawn from a window that can fall below, inside, or above [lo, hi].
  const N = 50;
  for (let i = 0; i < N; i++) {
    const lo = (Math.random() - 0.5) * 2000;       // roughly [-1000, 1000)
    const span = Math.random() * 1000;             // [0, 1000)
    const hi = lo + span;                          // hi >= lo
    // x ranges wider than [lo, hi] so it can saturate either side
    const x = lo - 500 + Math.random() * (span + 1000);
    assertContract(clamp, x, lo, hi);
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}

main();
