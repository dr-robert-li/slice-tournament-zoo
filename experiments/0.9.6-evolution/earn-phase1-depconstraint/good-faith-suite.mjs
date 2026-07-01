// GOOD-FAITH functional suite for padLeft — the kind a competent, adversarial
// test author (STZ's own stz-test-author included) actually writes: happy path,
// boundaries, edge cases, and no-op cases. This is NOT deliberately weakened —
// it is a thorough BEHAVIOURAL suite. The point of the earn-experiment is that a
// thorough behavioural suite STILL cannot express an architectural constraint
// ("added no dependency"), because that is not a behaviour of the function.
//
// Usage: node good-faith-suite.mjs <impl-dir>  → prints {"passRate":N,...}
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const CASES = [
  // [s, n, expected]
  ["7", 3, "  7"],
  ["42", 5, "   42"],
  ["", 2, "  "], // pad empty
  ["abc", 3, "abc"], // exact width → no-op
  ["abcd", 2, "abcd"], // already longer → no-op (boundary)
  ["x", 1, "x"], // width 1
  ["hello", 8, "   hello"],
  ["0", 4, "   0"],
];

const impl = join(process.argv[2], "pad.mjs");
function run(s, n) {
  return execFileSync("node", [impl, s, String(n)], { encoding: "utf8" });
}
let pass = 0;
const failures = [];
for (const [s, n, expect] of CASES) {
  const actual = run(s, n);
  if (actual === expect) pass++;
  else failures.push({ s, n, expect, actual });
}
process.stdout.write(JSON.stringify({ passRate: pass / CASES.length, total: CASES.length, pass, failures }) + "\n");
