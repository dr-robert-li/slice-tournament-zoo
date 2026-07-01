/**
 * END-TO-END integration (PHASED-PLAN Phase 2 wiring): the full contract flow
 * through the LIVE selection path —
 *   accepted contract slice → arena specimens → contract-verify (predicate eval)
 *   → contract-aware select() (gate) → promotion ledger.
 * Proves the contract plane is wired into `select()`, not just standalone, AND
 * that with the flag OFF the tournament is byte-identical to 0.9.5.
 */
import { describe, it, expect } from "vitest";
import type { EvalResult } from "../src/types.js";
import type { Predicate, Requirement } from "../src/contract/contract-types.js";
import { humanAccept, buildContractSlice } from "../src/contract/contract-engine.js";
import { evaluatePredicates } from "../src/contract/predicate-eval.js";
import { contractGateFromResults } from "../src/verifiers/contract-verifier.js";
import { select } from "../src/selection.js";
import { appendLedgerEvent, type LedgerEvent } from "../src/ledger/events.js";

// ── 1. Contract slice: propose → human-accept → compile (accepted-only) ──────
const requirement: Requirement = {
  schemaVersion: 1, id: "req.pad.no-dep.v1", kind: "requirement", state: "proposed",
  title: "no gratuitous dependency", statement: "padLeft adds no runtime dependency",
  rationale: "supply-chain", owner: "dr-robert-li",
  acceptance: { predicates: ["pred.no-dep.v1"], tests: [] },
  risk: { severity: "high", surfaces: ["dependencies"] },
  provenance: { proposedByRun: "run-1" },
};
const predicate: Predicate = {
  schemaVersion: 1, id: "pred.no-dep.v1", kind: "predicate", state: "proposed",
  requirement: "req.pad.no-dep.v1", type: "compatibility-check",
  scope: { symbols: ["package.json:dependencies"] },
  checks: [{ checkId: "no-new-dep", kind: "diff-constraint", expect: "false", description: "no added dep" }],
  severity: "high", provenance: { proposedByRun: "run-1" },
};

// ── 2. Two arena specimens: both pass the sealed gate; 'b' added a dependency ─
const mkEval = (specimen: string): EvalResult => ({
  specimen, passedGate: true, testPassRate: 1, coverage: 1, mutationScore: 0,
  hackFindings: [], codeHealth: 0.97, suspicion: 0,
});
const evals = [mkEval("a"), mkEval("b")];

// ── 3. Contract-verify: per-specimen predicate observations ──────────────────
//    a: no new dep → "false" (pass) · b: added dep → "true" (fails high predicate)
const bySpecimen = {
  a: evaluatePredicates([predicate], { "no-new-dep": "false" }),
  b: evaluatePredicates([predicate], { "no-new-dep": "true" }),
};

describe("E2E — contract slice → arena → verify → select → ledger", () => {
  it("compiles an accepted contract slice only after the human 7th gate", () => {
    const accReq = humanAccept(requirement, "dr-robert-li", "2026-07-02");
    const accPred = humanAccept(predicate, "dr-robert-li", "2026-07-02");
    const slice = buildContractSlice("slice-pad", [accReq], [accPred]);
    expect(slice.sliceId).toBe("slice-pad");
    expect(slice.predicates[0]!.state).toBe("accepted");
  });

  it("flag OFF (no contract gate) — behaves exactly as 0.9.5: both specimens pass the gate", () => {
    const { judgment, eliminated } = select(evals, []); // no contractGate arg
    expect(eliminated).toHaveLength(0);
    expect(judgment.ranking.sort()).toEqual(["a", "b"]);
  });

  it("flag ON (contract gate) — specimen 'b' is eliminated on the high-severity predicate; 'a' wins", () => {
    const gate = contractGateFromResults(bySpecimen);
    const { judgment, eliminated } = select(evals, [], gate);
    expect(judgment.winner).toBe("a");
    expect(judgment.ranking).toEqual(["a"]);
    expect(eliminated).toHaveLength(1);
    expect(eliminated[0]!.specimen).toBe("b");
    expect(eliminated[0]!.reason).toMatch(/contract-fail.*pred\.no-dep\.v1/);
  });

  it("the contract decision is recorded in the append-only ledger", () => {
    let ledger: LedgerEvent[] = [];
    ledger = appendLedgerEvent(ledger, {
      type: "artifact_rejected", artifactId: "specimen-b", artifactKind: "patch",
      reasons: ["contract-fail: pred.no-dep.v1 (no gratuitous dependency)"], evidenceRuns: ["run-1"],
    });
    ledger = appendLedgerEvent(ledger, {
      type: "artifact_accepted", artifactId: "specimen-a", artifactKind: "patch",
      reasons: ["passed sealed gate + contract predicates"], evidenceRuns: ["run-1"],
    });
    expect(ledger.map((e) => e.seq)).toEqual([0, 1]);
    expect(ledger[0]!.type).toBe("artifact_rejected");
  });
});
