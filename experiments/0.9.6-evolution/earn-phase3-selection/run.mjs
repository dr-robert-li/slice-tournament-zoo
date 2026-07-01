// EARN Phase 3 — does an accepted predicate CHANGE tournament selection?
//
// Reuses the Phase-1 dep-constraint substrate as TWO competing candidates:
//   - candidate "correct": baseline impl, no new dependency  (passes suite + predicate)
//   - candidate "naive":   dep-adding impl                   (passes suite, FAILS predicate)
// Both pass the good-faith functional suite at 1.000, so tests-only selection
// TIES and picks the first-listed. Contract-aware selection hard-fails the naive
// candidate on the high-severity no-new-dependency predicate, so the winner
// changes. That change is the Phase-3 exit-gate evidence.
//
// Decision logic mirrors src/verifiers/contract-verifier.ts (guarded by
// test/phase3-selection.test.ts, which runs the canonical TS core).
// Usage: node run.mjs  (writes result.json; exit 0 iff the contract changed the winner)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SUB = join(HERE, "..", "earn-phase1-depconstraint");
const contract = JSON.parse(readFileSync(join(SUB, "predicates.json"), "utf8"));
const suiteJs = join(SUB, "good-faith-suite.mjs");
const depCheck = join(SUB, "check-no-new-dep.mjs");
const baseline = join(SUB, "baseline");

// Present the naive candidate FIRST so tests-only (tie → first) would pick the
// WRONG one — making the contract's correction observable.
const candidates = [
  { candidateId: "naive", dir: join(SUB, "naive") },
  { candidateId: "correct", dir: baseline },
];

function evalCandidate({ candidateId, dir }) {
  const suite = JSON.parse(execFileSync("node", [suiteJs, dir], { encoding: "utf8" }).trim());
  const testPassRate = suite.passRate;
  const observed = {
    "no-new-dep": execFileSync("node", [depCheck, baseline, dir], { encoding: "utf8" }).trim(),
    canonical: testPassRate >= 1 ? "true" : "false",
  };
  const predicateResults = contract.predicates.map((p) => {
    const checks = p.checks.map((c) => ({ pass: (observed[c.checkId] ?? "") === c.expect }));
    return { predicateId: p.id, severity: p.severity, pass: checks.every((c) => c.pass) };
  });
  const highFails = predicateResults.filter((r) => !r.pass && r.severity === "high");
  return {
    candidateId,
    testPassRate,
    hardFail: highFails.length > 0,
    hardFailReasons: highFails.map((r) => r.predicateId),
    contractScore: predicateResults.filter((r) => r.pass).length / predicateResults.length,
  };
}

const scored = candidates.map(evalCandidate);

// tests-only: by testPassRate, ties keep input order.
const testsOnlyWinner = [...scored].sort((a, b) => b.testPassRate - a.testPassRate)[0].candidateId;
// contract-aware: eliminate hard-fails, then by (testPassRate, contractScore).
const survivors = scored.filter((s) => !s.hardFail);
const contractAwareWinner =
  [...survivors].sort((a, b) => b.testPassRate - a.testPassRate || b.contractScore - a.contractScore)[0]
    ?.candidateId ?? null;

const changed = testsOnlyWinner !== contractAwareWinner;
const result = {
  substrate: "pad-no-new-dependency (selection-change)",
  candidates: scored,
  testsOnlyWinner,
  contractAwareWinner,
  changed,
  verdict: changed
    ? `EARNED — tests-only picked '${testsOnlyWinner}' (passes the suite) but it hard-failed a high-severity ` +
      `predicate; the contract changed the winner to '${contractAwareWinner}'. An accepted predicate caught a ` +
      `passing-but-non-conforming candidate (functionally correct, but violates an architectural predicate) and moved selection.`
    : `NOT EARNED — contract did not change the winner ('${testsOnlyWinner}').`,
};
writeFileSync(join(HERE, "result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
process.exit(changed ? 0 : 1);
