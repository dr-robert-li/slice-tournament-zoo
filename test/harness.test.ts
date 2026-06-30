/**
 * Tests for the 0.9.0 harness-level RSI meta-loop spine (deterministic core).
 */
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDiversity, frontierWeights, weightedFitness } from "../src/diversity.js";
import { genomeHash, checkParity, interfaceSignature } from "../src/harness-hash.js";
import {
  defaultGenome,
  sampleParents,
  onGeneration,
  initialMeta,
  promotionGate,
  makeArchiveEntry,
  appendArchiveEntry,
  readArchive,
  incumbent,
  bumpChildCount,
  readReliabilityProfile,
  mergeReliabilityEntry,
} from "../src/harness.js";
import { initialInject, onInjectRound, MAX_INJECT_ROUNDS } from "../src/injector.js";
import { consistencyScore, bucketOf, trustGate, calibrationGate, type JudgeReliabilityProfile } from "../src/judge-reliability.js";
import { REWARD_WEIGHTS } from "../src/selection.js";
import { measureCodeHealth, loadBattery, type MutatorSpec } from "../src/eval-runner.js";
import { suspicionScore } from "../src/hack-detector.js";
import type { ArchiveEntry } from "../src/types.js";

describe("diversity — variance-collapse guard", () => {
  it("passes when spread ≥ floor, fails on collapse", () => {
    expect(checkDiversity([0.9, 0.96, 0.8], 0.02).ok).toBe(true);
    const collapsed = checkDiversity([0.9, 0.9001, 0.9], 0.02);
    expect(collapsed.ok).toBe(false);
    expect(collapsed.sigma).toBeLessThan(0.02);
  });

  it("frontierWeights favours mid-band substrates, zeroes saturated ones", () => {
    const w = frontierWeights([1.0, 0.5, 0.0]); // saturated, mid, failed
    expect(w[1]).toBeGreaterThan(w[0]!); // mid-band weighted most
    expect(w[0]).toBeCloseTo(0, 9);
    expect(w[2]).toBeCloseTo(0, 9);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });

  it("frontierWeights falls back to uniform when all substrates are extreme", () => {
    const w = frontierWeights([1, 0, 1]);
    expect(w).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it("weightedFitness applies the weights", () => {
    expect(weightedFitness([1, 0], [0.5, 0.5])).toBeCloseTo(0.5, 9);
    // mismatched lengths → plain mean
    expect(weightedFitness([1, 0, 0.5], [0.5])).toBeCloseTo(0.5, 9);
  });
});

describe("harness-hash — content address + interface parity", () => {
  it("genomeHash is stable and field-order independent", () => {
    const g1 = defaultGenome();
    const g2 = { ...defaultGenome() };
    expect(genomeHash(g1)).toBe(genomeHash(g2));
    const g3 = { ...g1, heuristicId: "different" };
    expect(genomeHash(g3)).not.toBe(genomeHash(g1));
  });

  it("interface parity holds for the same command surface, breaks otherwise", () => {
    const base = ["a", "b", "c"];
    expect(checkParity(base, ["c", "b", "a"]).ok).toBe(true); // order-independent
    expect(checkParity(base, ["a", "b"]).ok).toBe(false); // dropped a command
    expect(interfaceSignature(base)).toBe(interfaceSignature(["c", "a", "b"]));
  });
});

describe("harness — archive, parent-sampling, FSM, promotion gate", () => {
  function tmpRoot(): string {
    return mkdtempSync(join(tmpdir(), "stz-harness-test-"));
  }

  it("appends + reads archive, picks max-fitness incumbent", () => {
    const root = tmpRoot();
    try {
      appendArchiveEntry(root, makeArchiveEntry({ genome: defaultGenome(), parent: null, fitness: 0.8, perSubstrate: { cron: 0.8 }, advantage: 0, gates: gates() }));
      const g2 = { ...defaultGenome(), heuristicId: "v2" };
      appendArchiveEntry(root, makeArchiveEntry({ genome: g2, parent: null, fitness: 0.9, perSubstrate: { cron: 0.9 }, advantage: 0, gates: gates() }));
      expect(readArchive(root).length).toBe(2);
      expect(incumbent(root)!.fitness).toBe(0.9);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("parent-sampling is deterministic and damps prolific lineages", () => {
    const a = makeArchiveEntry({ genome: defaultGenome(), parent: null, fitness: 0.9, perSubstrate: {}, advantage: 0, gates: gates() });
    const b = makeArchiveEntry({ genome: { ...defaultGenome(), heuristicId: "b" }, parent: null, fitness: 0.9, perSubstrate: {}, advantage: 0, gates: gates() });
    a.childCount = 10; // prolific → damped
    const e: ArchiveEntry[] = [a, b];
    const s1 = sampleParents(e, 20).map((x) => x.variantId);
    const s2 = sampleParents(e, 20).map((x) => x.variantId);
    expect(s1).toEqual(s2); // deterministic (seeded from append-order)
    const bShare = s1.filter((id) => id === b.variantId).length;
    expect(bShare).toBeGreaterThan(10); // the non-prolific parent dominates
  });

  it("empty archive yields no parents", () => {
    expect(sampleParents([], 4)).toEqual([]);
  });

  it("meta-FSM halts on max generations, two barren rounds, or collapse", () => {
    // converge after two barren generations
    let s = initialMeta(10);
    let r = onGeneration(s, { promoted: false, collapsed: false });
    expect(r.action.type).toBe("spawn");
    r = onGeneration(r.next, { promoted: false, collapsed: false });
    expect(r.action.type).toBe("halt");
    expect(r.next.stage).toBe("converged");
    // collapse halts immediately
    expect(onGeneration(initialMeta(10), { promoted: false, collapsed: true }).next.stage).toBe("collapsed");
    // exhaustion
    let e = initialMeta(1);
    expect(onGeneration(e, { promoted: true, collapsed: false }).next.stage).toBe("exhausted");
  });

  it("promotion gate requires ALL six gates", () => {
    const ok = { beatsIncumbent: true, hackClean: true, sealOk: true, interfaceParity: true, diversityOk: true, rubricCalibrated: true };
    expect(promotionGate(ok).promote).toBe(true);
    expect(promotionGate({ ...ok, hackClean: false }).promote).toBe(false);
    expect(promotionGate({ ...ok, beatsIncumbent: false }).failed).toContain("does-not-beat-incumbent");
    expect(promotionGate({ ...ok, interfaceParity: false }).failed).toContain("interface-parity-broken");
    // 0.9.5 calibrated-verifier gate: an uncalibrated judge cannot steer promotion.
    expect(promotionGate({ ...ok, rubricCalibrated: false }).promote).toBe(false);
    expect(promotionGate({ ...ok, rubricCalibrated: false }).failed).toContain("judge-rubric-not-calibrated");
  });

  it("bumpChildCount increments lineage bookkeeping", () => {
    const root = mkdtempSync(join(tmpdir(), "stz-harness-test-"));
    try {
      const e = makeArchiveEntry({ genome: defaultGenome(), parent: null, fitness: 0.8, perSubstrate: {}, advantage: 0, gates: gates() });
      appendArchiveEntry(root, e);
      bumpChildCount(root, e.variantId);
      expect(readArchive(root)[0]!.childCount).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

function gates(): ArchiveEntry["gates"] {
  return { hackClean: false, sealOk: false, interfaceParity: false, diversityOk: false, beatsIncumbent: false, rubricCalibrated: false };
}

describe("injector — bounded suite-hardening FSM", () => {
  it("converges when the suite catches everything", () => {
    const r = onInjectRound(initialInject(), { survivors: 0, promoted: 0 });
    expect(r.action.type).toBe("halt");
    expect(r.next.stage).toBe("converged");
  });

  it("keeps injecting while blind spots remain, up to the ceiling", () => {
    let s = initialInject();
    let r = onInjectRound(s, { survivors: 2, promoted: 1 });
    expect(r.action.type).toBe("inject");
    // next round hits the ceiling
    r = onInjectRound(r.next, { survivors: 2, promoted: 1 });
    expect(r.action.type).toBe("halt");
    expect(r.next.stage).toBe("exhausted");
    expect(r.next.round).toBe(MAX_INJECT_ROUNDS);
    expect(r.next.promoted).toBe(2);
  });
});

describe("judge-reliability", () => {
  it("consistency is the invariant fraction; empty → 1", () => {
    expect(consistencyScore([]).score).toBe(1);
    const r = consistencyScore([
      { original: "a", perturbed: "a" },
      { original: "b", perturbed: "b" },
      { original: "a", perturbed: "b" },
    ]);
    expect(r.score).toBeCloseTo(2 / 3, 9);
  });

  it("buckets and trust-gates per slice-type", () => {
    expect(bucketOf(0.95)).toBe("high");
    expect(bucketOf(0.75)).toBe("medium");
    expect(bucketOf(0.5)).toBe("low");
    const profile: JudgeReliabilityProfile = {
      schemaVersion: 1,
      perSliceType: [
        { sliceType: "parser", consistency: 0.95, blindAccuracyBucket: "high", n: 20 },
        { sliceType: "flaky", consistency: 0.5, blindAccuracyBucket: null, n: 20 },
      ],
    };
    expect(trustGate(profile, "parser").trust).toBe(true);
    expect(trustGate(profile, "flaky").trust).toBe(false);
    expect(trustGate(profile, "unseen").trust).toBe(true); // default trust, flagged
  });

  it("calibrationGate is FAIL-CLOSED where trustGate default-trusts (0.9.5)", () => {
    const profile: JudgeReliabilityProfile = {
      schemaVersion: 1,
      perSliceType: [
        { sliceType: "calibrated", consistency: 0.95, blindAccuracyBucket: "high", n: 20 },
        { sliceType: "no-battery", consistency: 0.95, blindAccuracyBucket: null, n: 20 }, // battery not run
        { sliceType: "low-acc", consistency: 0.95, blindAccuracyBucket: "low", n: 20 },
        { sliceType: "inconsistent", consistency: 0.5, blindAccuracyBucket: "high", n: 20 },
      ],
    };
    // calibrated only when bucket non-null AND not "low" AND consistency ≥ threshold
    expect(calibrationGate(profile, "calibrated").calibrated).toBe(true);
    expect(calibrationGate(profile, "no-battery").calibrated).toBe(false); // null bucket
    expect(calibrationGate(profile, "low-acc").calibrated).toBe(false); // low accuracy
    expect(calibrationGate(profile, "inconsistent").calibrated).toBe(false); // sub-threshold consistency
    // the divergence from trustGate: an unseen slice-type defaults TRUST but NOT calibrated
    expect(trustGate(profile, "unseen").trust).toBe(true);
    expect(calibrationGate(profile, "unseen").calibrated).toBe(false);
  });
});

describe("WAF gene Goodhart guard (0.9.5) — WAF can never be a reward weight", () => {
  // The prose guard ("WAF stays authoring, never a reward") rots; this enforces it.
  // Selection weights are a fixed 5-tuple; a WAF-conformance key must never appear.
  const EXPECTED = ["clean", "codeHealth", "coverage", "kill", "pass"];
  it("defaultGenome and REWARD_WEIGHTS carry exactly the 5 selection weights, no WAF key", () => {
    expect(Object.keys(defaultGenome().weights).sort()).toEqual(EXPECTED);
    expect(Object.keys(REWARD_WEIGHTS).sort()).toEqual(EXPECTED);
    expect(Object.keys(REWARD_WEIGHTS).some((k) => /waf|architect|conform/i.test(k))).toBe(false);
  });
});

describe("judge-reliability profile persistence (0.9.5 merge-not-clobber)", () => {
  it("judge-stress (consistency) and judge-calibration (bucket) merge without clobbering", () => {
    const root = mkdtempSync(join(tmpdir(), "stz-rel-"));
    try {
      // empty profile until anything is written
      expect(readReliabilityProfile(root).perSliceType.length).toBe(0);
      // calibration writes the bucket first (consistency defaults to 0)
      mergeReliabilityEntry(root, { sliceType: "parser", blindAccuracyBucket: "high", n: 12 });
      // then consistency arrives and must NOT wipe the bucket
      mergeReliabilityEntry(root, { sliceType: "parser", consistency: 0.95, n: 20 });
      const entry = readReliabilityProfile(root).perSliceType.find((e) => e.sliceType === "parser")!;
      expect(entry.consistency).toBeCloseTo(0.95, 9);
      expect(entry.blindAccuracyBucket).toBe("high"); // preserved across the second write
      // and the now-complete entry calibrates
      expect(calibrationGate(readReliabilityProfile(root), "parser").calibrated).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("eval-runner 0.9.0 additions", () => {
  it("measureCodeHealth rewards parsimony, penalizes duplication", () => {
    const dir = mkdtempSync(join(tmpdir(), "stz-ch-"));
    try {
      const lean = join(dir, "lean.mjs");
      writeFileSync(lean, "export function f(x){ return x + 1; }\n");
      const dup = join(dir, "dup.mjs");
      writeFileSync(dup, Array(20).fill("const z = compute(a, b, c, d);").join("\n") + "\n");
      expect(measureCodeHealth(lean)).toBeGreaterThan(measureCodeHealth(dup));
      expect(measureCodeHealth(lean)).toBeLessThanOrEqual(1);
      expect(measureCodeHealth(dup)).toBeGreaterThanOrEqual(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("loadBattery unions built-ins with promoted specs, skips dupes/corrupt", () => {
    const builtIn = loadBattery();
    const dir = mkdtempSync(join(tmpdir(), "stz-bat-"));
    try {
      mkdirSync(dir, { recursive: true });
      const spec: MutatorSpec[] = [{ name: "promoted-x", find: "a", replace: "b" }];
      writeFileSync(join(dir, "x.json"), JSON.stringify(spec));
      writeFileSync(join(dir, "corrupt.json"), "{ not json");
      const loaded = loadBattery(dir);
      expect(loaded.length).toBe(builtIn.length + 1);
      expect(loaded.some((m) => m.name === "promoted-x")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("hack-detector — graded soft-suspicion", () => {
  it("clean code scores 0; smelly code scores > 0; bounded ≤ 1", () => {
    expect(suspicionScore({ "a.mjs": "export const f = (x) => x + 1;\n" })).toBe(0);
    const smelly = suspicionScore({
      "a.mjs": "try { risky(); } catch { return 0; }\nif (true) { shortcut(); }\n",
    });
    expect(smelly).toBeGreaterThan(0);
    expect(smelly).toBeLessThanOrEqual(1);
  });
});
