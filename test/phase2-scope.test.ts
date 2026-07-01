/**
 * EARN Phase 2 (outcome-mechanism, deterministic) — contract-bounded arena.
 *
 * A SECOND predicate axis (file-scope diff-constraint, distinct from the
 * dependency axis of Phases 1/3/4/6): a slice declares "only files under
 * src/feature/ may change." A free-form candidate edits outside that scope but
 * still passes the functional suite; the contract-verifier hard-fails it, so
 * contract-aware selection keeps the in-scope candidate. This is the boundedness
 * half of Phase 2 — "contract slices change candidate selection / bound broad
 * edits" — earned on a fresh axis, deterministically (no live agent, no human).
 */
import { describe, it, expect } from "vitest";
import type { Predicate } from "../src/contract/contract-types.js";
import { evaluatePredicates, type Observations } from "../src/contract/predicate-eval.js";
import { scoreContract, contractAwareRank, testsOnlyRank, type RankableCandidate } from "../src/verifiers/contract-verifier.js";

const ALLOWED_SCOPE = "src/feature/";

const scopePredicate: Predicate = {
  schemaVersion: 1,
  id: "pred.scope.only-feature.v1",
  kind: "predicate",
  state: "accepted",
  requirement: "req.feature.localized-change.v1",
  type: "boundary-condition",
  scope: { symbols: ["src/feature/"] },
  checks: [
    { checkId: "no-out-of-scope-file", kind: "diff-constraint", expect: "false", description: "no changed file outside src/feature/" },
  ],
  severity: "high",
  provenance: { proposedByRun: "phase2-prereg" },
};

/** Deterministic diff-scope observation: did any changed file fall outside scope? */
function outOfScope(changedFiles: string[]): Observations {
  const any = changedFiles.some((f) => !f.startsWith(ALLOWED_SCOPE));
  return { "no-out-of-scope-file": any ? "true" : "false" };
}

function candidate(id: string, changedFiles: string[]): RankableCandidate {
  const results = evaluatePredicates([scopePredicate], outOfScope(changedFiles));
  return { candidateId: id, testPassRate: 1, contract: scoreContract(id, results) };
}

describe("Phase 2 — contract-bounded arena (file-scope axis)", () => {
  // free-form listed first, so tests-only (tie → first) would pick the broad-edit one.
  const cands = [
    candidate("freeform", ["src/feature/x.ts", "src/unrelated/y.ts"]),
    candidate("bounded", ["src/feature/x.ts"]),
  ];

  it("both pass the functional suite — tests-only picks the broad-edit candidate", () => {
    expect(cands.every((c) => c.testPassRate === 1)).toBe(true);
    expect(testsOnlyRank(cands).winner).toBe("freeform");
  });

  it("the scope predicate hard-fails the out-of-scope candidate", () => {
    const ff = cands.find((c) => c.candidateId === "freeform")!;
    expect(ff.contract.hardFail).toBe(true);
    expect(ff.contract.hardFailReasons).toContain("pred.scope.only-feature.v1");
  });

  it("contract-bounded selection keeps the localized candidate", () => {
    expect(contractAwareRank(cands).winner).toBe("bounded");
    expect(contractAwareRank(cands).eliminated).toContain("freeform");
  });
});
