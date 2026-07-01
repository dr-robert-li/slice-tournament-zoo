// Functional sealed suite for the IPv4 separation-gate substrate.
//
// COMMON cases only — the kind a good-faith functional test author writes:
// obviously-valid addresses accept, obviously-malformed strings reject. The
// naive impl passes ALL of these (passRate 1.000). The point of the experiment
// is that passing this suite is NOT sufficient for correctness — the boundary
// cases live in the contract predicates, not here.
//
// Usage: node sealed-suite.mjs <impl.mjs>  → prints {"passRate":N,...} JSON.
import { execFileSync } from "node:child_process";

const CASES = [
  // well-formed → true
  ["192.168.1.1", "true"],
  ["8.8.8.8", "true"],
  ["0.0.0.0", "true"],
  ["127.0.0.1", "true"],
  ["10.0.0.255", "true"],
  // obviously malformed → false
  ["abc", "false"],
  ["1.2.3", "false"],
  ["1.2.3.4.5", "false"],
  ["", "false"],
  ["1.2.3.", "false"],
  ["hello.world", "false"],
];

const impl = process.argv[2];
function run(input) {
  return execFileSync("node", [impl, input], { encoding: "utf8", timeout: 10000 }).trim();
}

let pass = 0;
const failures = [];
for (const [input, expect] of CASES) {
  const actual = run(input);
  if (actual === expect) pass++;
  else failures.push({ input, expect, actual });
}
const passRate = pass / CASES.length;
process.stdout.write(JSON.stringify({ passRate, total: CASES.length, pass, failures }) + "\n");
