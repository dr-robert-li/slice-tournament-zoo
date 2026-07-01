// EARN Phase 1 — fair separation-gate on a diff-constraint predicate.
//
// Unlike the ipv4 mechanism-proof (where a good-faith suite WOULD catch the
// boundary), here the separating predicate is "added no dependency" — an
// architectural property of the CHANGE that no functional test can express,
// however thorough. So separation here holds against ANY good-faith behavioural
// suite, which is the genuine Phase-1 earn.
//
// Decision logic mirrors src/contract/{predicate-eval,separation-gate}.ts.
// Usage: node run.mjs  (writes result.json; exit 0 iff separated)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const naive = join(HERE, "naive");
const baseline = join(HERE, "baseline");
const contract = JSON.parse(readFileSync(join(HERE, "predicates.json"), "utf8"));

// 1. Good-faith BEHAVIOURAL suite against the naive candidate.
const suite = JSON.parse(execFileSync("node", [join(HERE, "good-faith-suite.mjs"), naive], { encoding: "utf8" }).trim());
const sealedSuitePassed = suite.passRate >= 1;

// 2. Produce observations for each predicate check.
//    - diff-constraint "no-new-dep": run the structural checker.
//    - output-assertion SENTINEL_BEHAVIOUR: "true" iff the behavioural suite passed.
const observed = {
  "no-new-dep": execFileSync("node", [join(HERE, "check-no-new-dep.mjs"), baseline, naive], { encoding: "utf8" }).trim(),
  canonical: sealedSuitePassed ? "true" : "false",
};

// 3. Evaluate predicates (pass iff every check's actual === expect).
const predicateResults = contract.predicates.map((p) => {
  const checks = p.checks.map((c) => {
    const actual = observed[c.checkId] ?? "<no-observation>";
    return { checkId: c.checkId, pass: actual === c.expect, expected: c.expect, actual };
  });
  return { predicateId: p.id, severity: p.severity, pass: checks.length > 0 && checks.every((c) => c.pass), checks };
});

// 4. Separation rule.
const failing = predicateResults.filter((r) => !r.pass);
const separated = sealedSuitePassed && failing.length > 0;
const result = {
  substrate: "pad-no-new-dependency (diff-constraint)",
  sealedSuitePassed,
  sealedSuitePassRate: suite.passRate,
  predicateResults,
  separated,
  failingPredicates: failing.map((r) => r.predicateId),
  highSeverityFailures: failing.filter((r) => r.severity === "high").map((r) => r.predicateId),
  verdict: separated
    ? "SEPARATED against a GOOD-FAITH suite — the failing predicate is architectural (no-new-dependency), a signal class NO functional test can express. This EARNS Phase 1's existence claim."
    : "NOT SEPARATED — freeze/iterate.",
};
writeFileSync(join(HERE, "result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
process.exit(separated ? 0 : 1);
