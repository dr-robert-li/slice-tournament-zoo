// MUTANT sealed suite (genome `sharper-v1`, heuristicId = "property-fuzz-v1").
// The single-gene substitution: instead of fixed examples, author tests from the
// ALGEBRAIC INVARIANTS of variance, fuzzed over a magnitude sweep. This is the
// "author broader tests" heuristic the §7 boundary predicts will cross the
// magnitude-dependent gradient a good-faith fixed suite misses.
//
// TRAIN-ON-TEST GUARD: this suite NEVER compares against a two-pass numeric oracle
// (that is the held-out truth.mjs's mechanism). It checks only invariants that hold
// by definition — shift-invariance var(x+C)=var(x), scale var(a·x)=a²·var(x), and
// the closed form for an arithmetic progression — over its OWN independently-seeded
// PRNG (SEED_P) and its OWN magnitude ladder. Different seed AND different mechanism
// from the truth oracle, so a win here is broad coverage, not a peek at truth.
//
// Harness contract: node property_suite.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.

const SEED_P = 0x5715c0de; // property suite's own seed — NOT the truth seed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED_P);

let passed = 0, total = 0;
function relClose(got, exp, tol = 1e-6) {
  if (typeof got !== "number" || !Number.isFinite(got)) return false;
  if (Math.abs(exp) < 1e-9) return Math.abs(got) <= 1e-6;
  return Math.abs(got - exp) / Math.abs(exp) <= tol;
}
function check(cond) { total += 1; try { if (cond === true) passed += 1; } catch { /* throw = fail */ } }

function varOf(f, arr) { let r; try { r = f(arr.slice()); } catch { return NaN; } return r ? r.variance : NaN; }
function meanOf(f, arr) { let r; try { r = f(arr.slice()); } catch { return NaN; } return r ? r.mean : NaN; }

async function main() {
  const implPath = process.argv[2];
  let f;
  try { f = (await import(implPath)).streamStats; } catch { f = undefined; }
  if (typeof f !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
  }

  // magnitude ladder: the offsets that probe cancellation. A fixed suite stops at
  // ~1e3; the heuristic sweeps up to 1e9.
  const OFFSETS = [0, 1e2, 1e4, 1e6, 1e8, 1e9];

  for (const off of OFFSETS) {
    // a base sequence with unit-ish spread, generated from SEED_P.
    const base = Array.from({ length: 24 }, () => rng() * 2 - 1); // ~[-1,1]
    const shifted = base.map((x) => x + off);

    // (1) SHIFT-INVARIANCE: variance(base+off) === variance(base). Holds exactly in
    //     real arithmetic; the naive formula violates it as off grows (cancellation).
    const vBase = varOf(f, base);
    const vShift = varOf(f, shifted);
    check(relClose(vShift, vBase));

    // (2) MEAN tracks the offset: mean(base+off) === mean(base)+off.
    check(relClose(meanOf(f, shifted), meanOf(f, base) + off));

    // (3) SCALE: variance(a·shifted) === a²·variance(shifted) for a modest a.
    const a = 3;
    const scaled = shifted.map((x) => x * a);
    check(relClose(varOf(f, scaled), a * a * vShift, 1e-5));
  }

  // (4) CLOSED FORM: arithmetic progression k=0..N-1 has population variance
  //     (N²−1)/12, exactly — checked with a large offset so the property bites.
  for (const off of [0, 1e7, 5e8]) {
    const N = 50;
    const seq = Array.from({ length: N }, (_, k) => off + k);
    check(relClose(varOf(f, seq), (N * N - 1) / 12));
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
