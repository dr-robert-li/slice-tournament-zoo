// PUBLIC suite (Suite 1) for slice `nextRun`. NOT sealed — readable by all conditions; only
// condition B iterates against its failures. Deliberately happy-path: every-minute, daily,
// simple steps and single values. It intentionally omits the hard cron realities (dom/dow
// union, leap years, month/year rollover, inverted-range errors) — that omission is a
// pre-registered feature (B's signal is weaker than the sealed test-author's).
//
// Harness contract: node cron.public.mjs <impl-path>
// Imports `nextRun`; prints exactly one JSON line {"passed":int,"total":int,"passRate":float};
// exits 0 iff passRate===1. Node built-ins only.

let passed = 0;
let total = 0;
function eqMs(got, wantMs) {
  total += 1;
  try {
    if (got instanceof Date && got.getTime() === wantMs) passed += 1;
  } catch {
    /* throwing counts as failure */
  }
}
const U = (y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h, mi, 0);
const AFTER = new Date(U(2024, 1, 1, 0, 0)); // 2024-01-01T00:00:00Z (Monday)

// [expr, expectedUTCms]
const CASES = [
  ["* * * * *", U(2024, 1, 1, 0, 1)],
  ["0 0 * * *", U(2024, 1, 2, 0, 0)],
  ["*/15 * * * *", U(2024, 1, 1, 0, 15)],
  ["*/30 * * * *", U(2024, 1, 1, 0, 30)],
  ["30 * * * *", U(2024, 1, 1, 0, 30)],
  ["5 0 * * *", U(2024, 1, 1, 0, 5)],
  ["0 12 * * *", U(2024, 1, 1, 12, 0)],
  ["0 9 * * *", U(2024, 1, 1, 9, 0)],
  ["0 0 15 * *", U(2024, 1, 15, 0, 0)],
  ["0 0 * * 1", U(2024, 1, 8, 0, 0)], // next Monday, strictly after this Monday
];

async function main() {
  const implPath = process.argv[2];
  let nextRun;
  try {
    nextRun = (await import(implPath)).nextRun;
  } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  if (typeof nextRun !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  for (const [expr, wantMs] of CASES) {
    let got;
    try {
      got = nextRun(expr, new Date(AFTER.getTime()));
    } catch {
      got = null;
    }
    eqMs(got, wantMs);
  }
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
