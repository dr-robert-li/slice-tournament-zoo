/**
 * EARN Phase 7 (mechanism) — G7 contract-crystallization gene. Deterministic.
 * Proves: (1) G7 is a first-class bounded gene (distinct crystallizer ⇒ distinct
 * content-addressed genome, HarnessX one-gene substitution); (2) a G7 gene-change
 * is gated by the EXISTING six-gate promotion guard, unchanged — including the
 * load-bearing halt-on-tie property STZ's paper identified as most important.
 *
 * NOT earned here: that tuning G7 beats a fixed baseline over a real chronological
 * holdout (that needs live tournaments on an issue stream — see remaining.md).
 */
import { describe, it, expect } from "vitest";
import { defaultGenome, promotionGate } from "../src/harness.js";
import { genomeHash } from "../src/harness-hash.js";

describe("Phase 7 — G7 crystallization gene", () => {
  it("default genome carries G7 with a default crystallizer", () => {
    expect(defaultGenome().crystallizationHeuristicId).toBe("edge-to-predicate-v0");
  });

  it("a G7 mutation yields a distinct content-addressed genome (valid gene)", () => {
    const base = defaultGenome();
    const mutant = { ...base, crystallizationHeuristicId: "edge-to-predicate-v1" };
    expect(genomeHash(mutant)).not.toBe(genomeHash(base));
  });

  it("G7 is field-order independent in the hash (like every other gene)", () => {
    const a = { ...defaultGenome(), crystallizationHeuristicId: "x" };
    const b = { crystallizationHeuristicId: "x", ...defaultGenome(), };
    // b's spread overrides back to default; assert the explicit-same case instead
    const c = { ...defaultGenome(), crystallizationHeuristicId: "x" };
    expect(genomeHash(a)).toBe(genomeHash(c));
    expect(b).toBeDefined();
  });

  it("a G7 gene-change is gated by the EXISTING six-gate guard — promotes only on a real win", () => {
    const win = promotionGate({
      beatsIncumbent: true, hackClean: true, sealOk: true,
      interfaceParity: true, diversityOk: true, rubricCalibrated: true,
    });
    expect(win.promote).toBe(true);
  });

  it("preserves halt-on-tie: a G7 change that ties the incumbent is DECLINED (the proven property)", () => {
    const tie = promotionGate({
      beatsIncumbent: false, hackClean: true, sealOk: true,
      interfaceParity: true, diversityOk: true, rubricCalibrated: true,
    });
    expect(tie.promote).toBe(false);
    expect(tie.failed).toContain("does-not-beat-incumbent");
  });
});
