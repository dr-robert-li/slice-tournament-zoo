/**
 * Tests for the STZ 0.9.6 Contract Plane kernel (PHASED-PLAN Phase 1):
 * predicate evaluation, the separation gate, the human 7th gate, the state
 * machine, slice compilation, and traceability.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Predicate, Requirement } from "../src/contract/contract-types.js";
import { evaluatePredicate, evaluatePredicates } from "../src/contract/predicate-eval.js";
import { separationGate } from "../src/contract/separation-gate.js";
import {
  transition,
  humanAccept,
  buildContractSlice,
  assertProposalsNotApplied,
  ContractStateError,
  HumanGateError,
} from "../src/contract/contract-engine.js";
import type { ContractDelta } from "../src/contract/contract-types.js";
import { buildTraceability } from "../src/contract/traceability.js";

function pred(id: string, checks: Predicate["checks"], severity: Predicate["severity"] = "high"): Predicate {
  return {
    schemaVersion: 1,
    id,
    kind: "predicate",
    state: "accepted",
    requirement: "req.x.v1",
    type: "boundary-condition",
    scope: { symbols: ["isIPv4"] },
    checks,
    severity,
    provenance: { proposedByRun: "run-1" },
  };
}

function req(id: string, state: Requirement["state"] = "accepted", predicates: string[] = []): Requirement {
  return {
    schemaVersion: 1,
    id,
    kind: "requirement",
    state,
    title: "t",
    statement: "s",
    rationale: "r",
    owner: "dr-robert-li",
    acceptance: { predicates, tests: [] },
    risk: { severity: "high", surfaces: ["validation"] },
    provenance: { proposedByRun: "run-1" },
  };
}

describe("predicate-eval — pure, vacuity-safe", () => {
  const p = pred("pred.range", [
    { checkId: "c1", kind: "output-assertion", input: "999.1.1.1", expect: "false", description: "range" },
  ]);

  it("passes when every check's observation matches", () => {
    const r = evaluatePredicate(p, { c1: "false" });
    expect(r.pass).toBe(true);
    expect(r.vacuous).toBe(false);
  });

  it("fails when an observation mismatches", () => {
    const r = evaluatePredicate(p, { c1: "true" });
    expect(r.pass).toBe(false);
  });

  it("a missing observation fails (never a silent pass) and flags vacuity", () => {
    const r = evaluatePredicate(p, {});
    expect(r.pass).toBe(false);
    expect(r.vacuous).toBe(true);
    expect(r.checks[0]!.actual).toBe("<no-observation>");
  });
});

describe("separation-gate — the Phase 1 go/no-go", () => {
  const preds = [
    pred("pred.a", [{ checkId: "a", kind: "output-assertion", input: "999.1.1.1", expect: "false", description: "d" }], "high"),
    pred("pred.b", [{ checkId: "b", kind: "output-assertion", input: "192.168.0.1", expect: "true", description: "d" }], "low"),
  ];

  it("SEPARATED: suite passes, ≥1 predicate fails", () => {
    const results = evaluatePredicates(preds, { a: "true", b: "true" }); // a fails (naive accepts 999)
    const v = separationGate({ sealedSuitePassed: true, predicateResults: results });
    expect(v.separated).toBe(true);
    expect(v.failingPredicates).toContain("pred.a");
    expect(v.highSeverityFailures).toContain("pred.a");
  });

  it("NOT separated when the suite already fails the naive impl", () => {
    const results = evaluatePredicates(preds, { a: "true", b: "true" });
    const v = separationGate({ sealedSuitePassed: false, predicateResults: results });
    expect(v.separated).toBe(false);
  });

  it("NOT separated when every predicate passes (contract redundant with suite)", () => {
    const results = evaluatePredicates(preds, { a: "false", b: "true" });
    const v = separationGate({ sealedSuitePassed: true, predicateResults: results });
    expect(v.separated).toBe(false);
    expect(v.reason).toMatch(/adds no selection signal/);
  });
});

describe("separation-gate — reproduces the committed pre-registration results", () => {
  const readResult = (dir: string) =>
    JSON.parse(
      readFileSync(join(__dirname, "..", "experiments", "0.9.6-evolution", dir, "result.json"), "utf8"),
    ) as { separated: boolean; sealedSuitePassRate: number; highSeverityFailures: string[]; failingPredicates: string[] };

  it("ipv4 substrate: mechanism proof — separates against THIS (weak) suite", () => {
    const r = readResult("separation-gate");
    expect(r.separated).toBe(true);
    expect(r.sealedSuitePassRate).toBe(1);
    expect(r.highSeverityFailures.length).toBeGreaterThanOrEqual(1);
  });

  it("dep-constraint substrate: FAIR earn — separates against a good-faith suite via an architectural predicate", () => {
    const r = readResult("earn-phase1-depconstraint");
    expect(r.separated).toBe(true);
    expect(r.sealedSuitePassRate).toBe(1); // good-faith behavioural suite fully passes
    // the separating predicate is architectural (no-new-dependency) — not expressible as a functional test
    expect(r.failingPredicates).toContain("pred.pad.no-new-dependency.v1");
    expect(r.highSeverityFailures).toContain("pred.pad.no-new-dependency.v1");
  });
});

describe("human 7th gate — the α>0 exogenous signal", () => {
  const proposed: Requirement = req("req.x.v1", "proposed");

  it("accepts a real human approver and stamps provenance", () => {
    const accepted = humanAccept(proposed, "dr-robert-li", "2026-07-01");
    expect(accepted.state).toBe("accepted");
    expect(accepted.provenance.acceptedBy).toBe("dr-robert-li");
    expect(accepted.provenance.acceptedAt).toBe("2026-07-01");
  });

  it("REJECTS an agent role as approver (not just empty)", () => {
    for (const role of ["contract-architect", "promoter", "automatic", "AGENT"]) {
      expect(() => humanAccept(proposed, role, "2026-07-01")).toThrow(HumanGateError);
    }
  });

  it("rejects an empty approver", () => {
    expect(() => humanAccept(proposed, "   ", "2026-07-01")).toThrow(HumanGateError);
  });

  it("rejects accepting an artifact that is not in 'proposed' state", () => {
    const draft = req("req.x.v1", "draft");
    expect(() => humanAccept({ ...draft, provenance: { proposedByRun: "r" } }, "dr-robert-li", "d")).toThrow();
  });
});

describe("state machine", () => {
  it("allows a legal edge and rejects an illegal one", () => {
    const d = req("req.x.v1", "draft");
    expect(transition(d, "proposed").state).toBe("proposed");
    expect(() => transition(d, "active")).toThrow(ContractStateError);
  });
});

describe("buildContractSlice — accepted artifacts only", () => {
  it("compiles from accepted requirements + predicates", () => {
    const slice = buildContractSlice("slice-1", [req("req.x.v1", "accepted", ["pred.a"])], [pred("pred.a", [
      { checkId: "a", kind: "output-assertion", input: "x", expect: "y", description: "d" },
    ])]);
    expect(slice.predicates).toHaveLength(1);
  });

  it("rejects a non-accepted requirement entering a run slice", () => {
    expect(() => buildContractSlice("slice-1", [req("req.x.v1", "proposed")], [])).toThrow(ContractStateError);
  });
});

describe("Phase 2 — propose-not-apply guard", () => {
  const delta = (state: ContractDelta["state"]): ContractDelta => ({
    schemaVersion: 1,
    id: "delta.1",
    kind: "contract_delta",
    state,
    op: "add",
    target: "pred.new",
    evidenceRuns: ["run-1"],
    provenance: { proposedByRun: "run-1" },
  });

  it("allows candidate-emitted deltas in draft/proposed", () => {
    expect(() => assertProposalsNotApplied([delta("draft"), delta("proposed")])).not.toThrow();
  });

  it("rejects a candidate that self-applied a delta to trusted state", () => {
    expect(() => assertProposalsNotApplied([delta("accepted")])).toThrow(ContractStateError);
    expect(() => assertProposalsNotApplied([delta("active")])).toThrow(ContractStateError);
  });
});

describe("traceability", () => {
  it("links predicates to requirements and flags orphans + dangling", () => {
    const r = buildTraceability(
      [req("req.a", "accepted"), req("req.b", "accepted")],
      [
        pred("pred.1", [{ checkId: "c", kind: "output-assertion", input: "x", expect: "y", description: "d" }]),
      ].map((p) => ({ ...p, requirement: "req.a" })),
    );
    expect(r.edges).toEqual([{ requirement: "req.a", predicate: "pred.1" }]);
    expect(r.orphanRequirements).toContain("req.b"); // accepted but no predicate
    expect(r.valid).toBe(false);
  });

  it("flags a dangling predicate pointing at a missing requirement", () => {
    const r = buildTraceability(
      [req("req.a", "accepted")],
      [{ ...pred("pred.1", [{ checkId: "c", kind: "output-assertion", input: "x", expect: "y", description: "d" }]), requirement: "req.MISSING" }],
    );
    expect(r.danglingPredicates).toContain("pred.1");
    expect(r.valid).toBe(false);
  });
});
