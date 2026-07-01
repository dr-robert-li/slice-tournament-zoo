// Separation-gate pre-registration RUNNER (PHASED-PLAN Phase 1 go/no-go).
//
// Executes the naive impl to PRODUCE observations (not hand-fed), runs the
// functional sealed suite, then applies the separation rule. The decision logic
// is identical to the canonical, unit-tested TS core in
//   src/contract/predicate-eval.ts + src/contract/separation-gate.ts
// This runner is the IO shell that demonstrates that core against a real impl.
//
// Usage: node run.mjs   (writes result.json, prints a verdict, exits 0/1)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const IMPL = join(HERE, "naive-ipv4.mjs");
const SUITE = join(HERE, "sealed-suite.mjs");
const contract = JSON.parse(readFileSync(join(HERE, "predicates.json"), "utf8"));

// 1. Run the functional sealed suite against the naive impl.
const suiteOut = JSON.parse(execFileSync("node", [SUITE, IMPL], { encoding: "utf8" }).trim());
const sealedSuitePassed = suiteOut.passRate >= 1;

// 2. Produce observations by executing the impl on each predicate check input.
const runImpl = (input) => execFileSync("node", [IMPL, input], { encoding: "utf8" }).trim();

// 3. Evaluate predicates (pure: pass iff every check's actual === expect).
const predicateResults = contract.predicates.map((p) => {
  const checks = p.checks.map((c) => {
    const actual = runImpl(c.input);
    return { checkId: c.checkId, pass: actual === c.expect, expected: c.expect, actual };
  });
  return {
    predicateId: p.id,
    severity: p.severity,
    pass: checks.length > 0 && checks.every((c) => c.pass),
    checks,
  };
});

// 4. Separation rule (mirrors separation-gate.ts).
const failing = predicateResults.filter((r) => !r.pass);
const highSeverityFailures = failing.filter((r) => r.severity === "high").map((r) => r.predicateId);
const separated = sealedSuitePassed && failing.length > 0;

const result = {
  substrate: "ipv4-strict-validation",
  sealedSuitePassed,
  sealedSuitePassRate: suiteOut.passRate,
  predicateResults,
  separated,
  failingPredicates: failing.map((r) => r.predicateId),
  highSeverityFailures,
  verdict: separated
    ? "SEPARATED-against-this-suite — mechanism existence proof: the predicate type-system expresses a condition this suite misses. NOT proof a good-faith suite misses it (this suite is deliberately weak; see separation-gate.md). Real outcome-separation is Phase 3's gate."
    : "NOT SEPARATED — freeze at Phase 0, report the negative (symmetric-error rule).",
};

writeFileSync(join(HERE, "result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
process.exit(separated ? 0 : 1);
