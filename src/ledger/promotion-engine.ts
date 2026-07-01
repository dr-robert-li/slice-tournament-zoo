/**
 * STZ 0.9.6 — promotion decision engine (PHASED-PLAN Phase 5).
 *
 * Pure decision function. Extends the existing six-gate guard (never loosens it)
 * with the 7th human-accept gate for contract-bearing kinds, and preserves STZ's
 * proven test-sharpening guard: a win that is execution-test-only (no contract
 * gain) is QUARANTINED, not promoted — the exact structural property that halts
 * suite-sharpening from masquerading as SWE improvement (docs/PAPER.md).
 */
export type PromotedKind = "test" | "predicate" | "contract_delta" | "rubric" | "search_heuristic";
export type PromotionDecision = "promote" | "quarantine" | "reject" | "sunset";

/** The six existing gates (harness.ts:285) — reused verbatim, never loosened. */
export interface SixGates {
  hackClean: boolean;
  sealOk: boolean;
  interfaceParity: boolean;
  diversityOk: boolean;
  beatsIncumbent: boolean;
  rubricCalibrated: boolean;
}

export interface PromotionEvidence {
  artifactId: string;
  kind: PromotedKind;
  /** The 7th gate. Mandatory for contract-bearing kinds. */
  humanAccepted: boolean;
  sixGates: SixGates;
  /** Severe regression on the held-out set → hard reject. */
  heldOutRegression: boolean;
  /** Gains on the held-out set. */
  executionDelta: number;
  contractDelta: number;
  sampleSize: number;
}

export interface PromotionConfig {
  minSampleSize: number;
  requiredPositiveDelta: number;
}

export const DEFAULT_PROMOTION_CONFIG: PromotionConfig = { minSampleSize: 8, requiredPositiveDelta: 0.03 };

const CONTRACT_BEARING: ReadonlySet<PromotedKind> = new Set(["predicate", "contract_delta", "rubric"]);

export interface PromotionVerdict {
  decision: PromotionDecision;
  reasons: string[];
}

/**
 * Decide the fate of one candidate artifact. Pure. Order of checks encodes the
 * priority: hard rejections first, then the human gate, then the test-sharpening
 * guard, then sample/threshold, then promote.
 */
export function promotionDecision(
  e: PromotionEvidence,
  cfg: PromotionConfig = DEFAULT_PROMOTION_CONFIG,
): PromotionVerdict {
  // 1. Hard rejections — preserve every existing structural guard.
  if (e.heldOutRegression) {
    return { decision: "reject", reasons: ["severe regression on held-out set"] };
  }
  const failedGate = (Object.entries(e.sixGates) as [keyof SixGates, boolean][]).find(([, ok]) => !ok);
  if (failedGate) {
    return { decision: "reject", reasons: [`six-gate guard failed: ${failedGate[0]}`] };
  }

  // 2. The 7th human-accept gate — contract-bearing kinds may not auto-promote.
  if (CONTRACT_BEARING.has(e.kind) && !e.humanAccepted) {
    return {
      decision: "quarantine",
      reasons: [`${e.kind} is contract-bearing and requires human acceptance (7th gate) before promotion`],
    };
  }

  // 3. Test-sharpening guard (STZ's proven negative): an execution-test-only win
  //    with no contract gain is quarantined, never promoted.
  if (e.kind === "test" && e.contractDelta <= 0) {
    return {
      decision: "quarantine",
      reasons: [
        "gain is execution-test-only (no contract signal improvement)",
        "consistent with test-sharpening rather than SWE improvement — quarantined per docs/PAPER.md",
      ],
    };
  }

  // 4. Sample-size / threshold guards.
  if (e.sampleSize < cfg.minSampleSize) {
    return { decision: "quarantine", reasons: [`insufficient sample size ${e.sampleSize} < ${cfg.minSampleSize}`] };
  }
  const composite = 0.5 * e.executionDelta + 0.5 * e.contractDelta;
  if (composite < cfg.requiredPositiveDelta) {
    return {
      decision: "quarantine",
      reasons: [`composite gain ${composite.toFixed(4)} below threshold ${cfg.requiredPositiveDelta}`],
    };
  }

  // 5. Promote.
  return {
    decision: "promote",
    reasons: [
      `composite gain +${(composite * 100).toFixed(2)}% (exec +${(e.executionDelta * 100).toFixed(2)}%, ` +
        `contract +${(e.contractDelta * 100).toFixed(2)}%)`,
      "six gates passed, no severe regression" + (CONTRACT_BEARING.has(e.kind) ? ", human-accepted" : ""),
    ],
  };
}
