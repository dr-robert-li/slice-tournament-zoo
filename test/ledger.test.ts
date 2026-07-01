/**
 * EARN Phase 5 — promotion ledger + 7-gate decision engine. Deterministic, on
 * the canonical TS core. Proves: a contract-bearing artifact with held-out gain +
 * human accept PROMOTES; the same without human accept QUARANTINES (7th gate); a
 * test-only win QUARANTINES (STZ's proven test-sharpening guard); a regression or
 * a failed six-gate REJECTS. Append-only ledger records every decision.
 */
import { describe, it, expect } from "vitest";
import {
  promotionDecision,
  type PromotionEvidence,
  type SixGates,
} from "../src/ledger/promotion-engine.js";
import { appendLedgerEvent, serializeLedger, parseLedger, type LedgerEvent } from "../src/ledger/events.js";

const GATES_OK: SixGates = {
  hackClean: true,
  sealOk: true,
  interfaceParity: true,
  diversityOk: true,
  beatsIncumbent: true,
  rubricCalibrated: true,
};

const base: PromotionEvidence = {
  artifactId: "pred.x.v1",
  kind: "predicate",
  humanAccepted: true,
  sixGates: GATES_OK,
  heldOutRegression: false,
  executionDelta: 0.04,
  contractDelta: 0.06,
  sampleSize: 8,
};

describe("Phase 5 — promotion decision engine (7 gates, test-sharpening guard)", () => {
  it("PROMOTES a contract-bearing artifact with gain + human accept + gates + sample", () => {
    expect(promotionDecision(base).decision).toBe("promote");
  });

  it("QUARANTINES a contract-bearing artifact without human acceptance (7th gate)", () => {
    const v = promotionDecision({ ...base, humanAccepted: false });
    expect(v.decision).toBe("quarantine");
    expect(v.reasons.join(" ")).toMatch(/7th gate|human acceptance/);
  });

  it("QUARANTINES a test-only win with no contract gain (proven test-sharpening guard)", () => {
    const v = promotionDecision({ ...base, kind: "test", humanAccepted: true, contractDelta: 0, executionDelta: 0.2 });
    expect(v.decision).toBe("quarantine");
    expect(v.reasons.join(" ")).toMatch(/test-sharpening|execution-test-only/);
  });

  it("REJECTS a severe held-out regression", () => {
    expect(promotionDecision({ ...base, heldOutRegression: true }).decision).toBe("reject");
  });

  it("REJECTS when any of the six existing gates fails (guard preserved, never loosened)", () => {
    const v = promotionDecision({ ...base, sixGates: { ...GATES_OK, beatsIncumbent: false } });
    expect(v.decision).toBe("reject");
    expect(v.reasons[0]).toMatch(/beatsIncumbent/);
  });

  it("QUARANTINES an under-sampled artifact", () => {
    expect(promotionDecision({ ...base, sampleSize: 3 }).decision).toBe("quarantine");
  });
});

describe("Phase 5 — append-only ledger", () => {
  it("assigns monotonic seq and round-trips through JSONL", () => {
    let ledger: LedgerEvent[] = [];
    ledger = appendLedgerEvent(ledger, {
      type: "artifact_accepted",
      artifactId: "pred.x.v1",
      artifactKind: "predicate",
      reasons: ["promoted"],
      evidenceRuns: ["run-1"],
    });
    ledger = appendLedgerEvent(ledger, {
      type: "artifact_quarantined",
      artifactId: "test.y.v1",
      artifactKind: "test",
      reasons: ["test-sharpening"],
      evidenceRuns: ["run-2"],
    });
    expect(ledger.map((e) => e.seq)).toEqual([0, 1]);
    expect(parseLedger(serializeLedger(ledger))).toEqual(ledger);
  });
});
