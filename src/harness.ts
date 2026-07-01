/**
 * Harness-level recursive self-improvement meta-loop core (0.9.0).
 *
 * The per-slice tournament is untouched and earned-correct (best-of-N + good
 * selection; the per-slice convergence loop was empirically ruled out — see
 * experiments/swebench-pilot/PILOT-RESULTS-JUDGE.md). This module evolves the
 * HARNESS ITSELF — a DGM/HarnessX-style meta-loop over a population of harness
 * variants, selected by GRPO group-relative advantage on held-out pilot fitness.
 *
 * Everything here is the deterministic spine (N6): genome record, archive I/O,
 * parent-sampling, the meta-FSM ceiling, and the promotion gate. The LLM-driven
 * gene mutation (new heuristics/strategies/rubrics) is the agent layer's job,
 * realized through `stz:evolve`; this module only validates and records.
 *
 * Archive location resolves the per-run-vs-global trap by DOGFOODING: it lives
 * in STZ's own `.stz/60-harness/`, append-only, timestamp-free — append-order in
 * MANIFEST.json is the audit sequence, exactly like `seal.ts`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { ArchiveEntry, HarnessGenome } from "./types.js";
import type { JudgeReliabilityProfile, SliceTypeReliability } from "./judge-reliability.js";
import { stzPath } from "./taxonomy.js";
import { genomeHash } from "./harness-hash.js";

// ── the seed/incumbent genome ───────────────────────────────────────────────

/**
 * The default harness genome = the current shipping harness expressed as genes.
 * Weights mirror selection.ts REWARD_WEIGHTS; fan-out/votes mirror the RTV
 * defaults. A fresh archive is seeded with this as the incumbent.
 */
export function defaultGenome(): HarnessGenome {
  return {
    // G1 test-author heuristic. Known values: "baseline-v0"/"explicit-examples-v0",
    // "property-fuzz-v1", and (0.9.5) "waf-playbook-autogen-v0" — the AWS
    // Well-Architected authoring gene (one-time amortized authoring; never a
    // reward — see agents/stz-test-author.md). A free string; agents route it.
    heuristicId: "baseline-v0",
    mutatorIds: [],
    strategySet: ["explicit-allowed-set", "field-expander", "strict-validation"],
    rubricId: "contract-conformance-v0",
    weights: { pass: 0.45, coverage: 0.2, kill: 0.2, codeHealth: 0.1, clean: 0.05 },
    fanout: 4,
    votesPerPair: 8,
    // G7 (0.9.6): default edge→predicate crystallizer. A free string; agents route it.
    crystallizationHeuristicId: "edge-to-predicate-v0",
  };
}

// ── archive paths + I/O ─────────────────────────────────────────────────────

const HARNESS_REL = "60-harness";

export function harnessDir(root: string): string {
  return stzPath(root, HARNESS_REL);
}
export function manifestPath(root: string): string {
  return join(harnessDir(root), "MANIFEST.json");
}
export function batteryDir(root: string): string {
  return join(harnessDir(root), "battery");
}
export function reliabilityPath(root: string): string {
  return join(harnessDir(root), "judge-reliability.json");
}

// ── judge-reliability profile I/O (0.9.5 calibrated-verifier gating) ─────────

/**
 * Read the persisted machine-readable judge-reliability profile. Distinct from
 * the human-readable `90-audit/judge-reliability.md` prose: this JSON is what the
 * promotion gate consumes. Missing file ⇒ empty profile (every slice-type then
 * reads as uncalibrated — fail-closed at the gate).
 */
export function readReliabilityProfile(root: string): JudgeReliabilityProfile {
  const p = reliabilityPath(root);
  if (!existsSync(p)) return { schemaVersion: 1, perSliceType: [] };
  return JSON.parse(readFileSync(p, "utf8")) as JudgeReliabilityProfile;
}

/**
 * Merge one slice-type's reliability fields, preserving fields the OTHER caller
 * owns: `judge-stress` owns `consistency`, `judge-calibration` owns
 * `blindAccuracyBucket`. Merging (not clobbering) lets the two commands run in
 * either order and have both fields survive — without it, whichever ran second
 * would wipe the first's signal and the gate could never see a complete profile.
 * N6-clean: entries kept sorted by sliceType; no timestamps (append-order-free,
 * deterministic on replay, mirrors MANIFEST.json posture).
 */
export function mergeReliabilityEntry(
  root: string,
  patch: { sliceType: string } & Partial<Omit<SliceTypeReliability, "sliceType">>,
): JudgeReliabilityProfile {
  const profile = readReliabilityProfile(root);
  const existing = profile.perSliceType.find((e) => e.sliceType === patch.sliceType);
  if (existing) {
    if (patch.consistency !== undefined) existing.consistency = patch.consistency;
    if (patch.blindAccuracyBucket !== undefined) existing.blindAccuracyBucket = patch.blindAccuracyBucket;
    if (patch.n !== undefined) existing.n = patch.n;
  } else {
    profile.perSliceType.push({
      sliceType: patch.sliceType,
      consistency: patch.consistency ?? 0,
      blindAccuracyBucket: patch.blindAccuracyBucket ?? null,
      n: patch.n ?? 0,
    });
  }
  profile.perSliceType.sort((a, b) => (a.sliceType < b.sliceType ? -1 : a.sliceType > b.sliceType ? 1 : 0));
  mkdirSync(harnessDir(root), { recursive: true });
  writeFileSync(reliabilityPath(root), JSON.stringify(profile, null, 2) + "\n", "utf8");
  return profile;
}

export function readArchive(root: string): ArchiveEntry[] {
  const p = manifestPath(root);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8")) as ArchiveEntry[];
}

function writeArchive(root: string, entries: ArchiveEntry[]): void {
  mkdirSync(harnessDir(root), { recursive: true });
  writeFileSync(manifestPath(root), JSON.stringify(entries, null, 2) + "\n", "utf8");
}

/** Append one entry to the archive (append-order = audit sequence). */
export function appendArchiveEntry(root: string, entry: ArchiveEntry): ArchiveEntry[] {
  const entries = readArchive(root);
  entries.push(entry);
  writeArchive(root, entries);
  return entries;
}

/** Increment a parent's childCount in place + persist (DGM bookkeeping). */
export function bumpChildCount(root: string, parentId: string): void {
  const entries = readArchive(root);
  const parent = entries.find((e) => e.variantId === parentId);
  if (parent) {
    parent.childCount += 1;
    writeArchive(root, entries);
  }
}

/** The current incumbent = highest-fitness archived variant (ties → first appended). */
export function incumbent(root: string): ArchiveEntry | null {
  const entries = readArchive(root);
  if (entries.length === 0) return null;
  return entries.reduce((best, e) => (e.fitness > best.fitness ? e : best), entries[0]!);
}

// ── deterministic parent-sampling (DGM diversity rule) ──────────────────────

/** mulberry32 — a tiny deterministic PRNG seeded from an integer. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed the sampler deterministically from the archive's append-order (N6 replay). */
export function archiveSeed(entries: ArchiveEntry[]): number {
  const h = createHash("sha256").update(entries.map((e) => e.variantId).join("|")).digest("hex");
  return parseInt(h.slice(0, 8), 16);
}

/**
 * Sample `k` parents from the archive with P(v) ∝ fitness/(1+childCount) — the
 * DGM rule: high performers are favoured but prolific lineages are damped, so
 * lower-fitness variants survive as stepping stones and the search does not
 * collapse onto the current best. Deterministic given the archive (seeded from
 * append-order). Sampling is with replacement (a strong parent may seed several
 * children); an empty archive yields an empty list (caller seeds the incumbent).
 */
export function sampleParents(entries: ArchiveEntry[], k: number): ArchiveEntry[] {
  if (entries.length === 0) return [];
  const weights = entries.map((e) => Math.max(1e-9, e.fitness) / (1 + e.childCount));
  const total = weights.reduce((a, b) => a + b, 0);
  const rng = mulberry32(archiveSeed(entries));
  const picks: ArchiveEntry[] = [];
  for (let i = 0; i < k; i++) {
    let r = rng() * total;
    let idx = 0;
    for (; idx < entries.length; idx++) {
      r -= weights[idx]!;
      if (r <= 0) break;
    }
    picks.push(entries[Math.min(idx, entries.length - 1)]!);
  }
  return picks;
}

// ── meta-FSM ceiling (mirrors escalation.ts) ────────────────────────────────

export const MAX_GENERATIONS_DEFAULT = 5;

export type MetaStage = "evolving" | "converged" | "exhausted" | "collapsed";

export interface MetaState {
  stage: MetaStage;
  generation: number;
  maxGenerations: number;
  /** Generations in a row with no promotion (convergence detector). */
  barren: number;
}

export function initialMeta(maxGenerations = MAX_GENERATIONS_DEFAULT): MetaState {
  return { stage: "evolving", generation: 0, maxGenerations, barren: 0 };
}

export type MetaAction =
  | { type: "spawn"; note: string }
  | { type: "halt"; note: string };

/**
 * Advance the meta-FSM after a generation. `promoted` = a variant beat the
 * incumbent and passed all gates this generation; `collapsed` = the diversity
 * floor could not be met. Pure (N6). Halts on: max generations, two barren
 * generations in a row (convergence — the symmetric-error null: "nothing better,
 * keep incumbent" is a SUCCESS outcome, not a failure), or variance collapse.
 */
export function onGeneration(
  s: MetaState,
  result: { promoted: boolean; collapsed: boolean },
): { next: MetaState; action: MetaAction } {
  if (result.collapsed) {
    return {
      next: { ...s, stage: "collapsed" },
      action: { type: "halt", note: "Diversity floor unmet after re-sampling — variance collapse; halting." },
    };
  }
  const generation = s.generation + 1;
  const barren = result.promoted ? 0 : s.barren + 1;
  if (generation >= s.maxGenerations) {
    return {
      next: { ...s, stage: "exhausted", generation, barren },
      action: { type: "halt", note: "Max generations reached; keeping best archived incumbent." },
    };
  }
  if (barren >= 2) {
    return {
      next: { ...s, stage: "converged", generation, barren },
      action: { type: "halt", note: "Two barren generations — converged; incumbent stands (anti-build null)." },
    };
  }
  return {
    next: { ...s, stage: "evolving", generation, barren },
    action: { type: "spawn", note: `Spawning generation ${generation + 1}.` },
  };
}

// ── promotion gate ──────────────────────────────────────────────────────────

export interface PromotionInputs {
  beatsIncumbent: boolean;
  hackClean: boolean;
  sealOk: boolean;
  interfaceParity: boolean;
  diversityOk: boolean;
  /**
   * 0.9.5: the judge/verifier that produced this variant's selection signal is
   * target-task CALIBRATED (passed the blind-accuracy battery). Fail-closed: an
   * uncalibrated judge may not steer promotion (2606.14629).
   */
  rubricCalibrated: boolean;
}

export interface PromotionVerdict {
  promote: boolean;
  failed: string[];
}

/**
 * The six-gate promotion decision (DGM hack-resistance built in). A variant
 * replaces the incumbent ONLY if it beats it on held-out fitness AND is
 * hack-clean on its OWN outputs (it cannot win by weakening its gate — the DGM
 * self-detector-bypass failure) AND preserved sealing integrity AND interface
 * parity AND came from a diverse (non-collapsed) generation AND its selection
 * judge is target-task calibrated (0.9.5 — an uncalibrated verifier silently
 * regresses, per 2606.14629, so calibration must precede steering).
 */
export function promotionGate(i: PromotionInputs): PromotionVerdict {
  const failed: string[] = [];
  if (!i.beatsIncumbent) failed.push("does-not-beat-incumbent");
  if (!i.hackClean) failed.push("hack-findings-on-own-outputs");
  if (!i.sealOk) failed.push("seal-integrity-drift");
  if (!i.interfaceParity) failed.push("interface-parity-broken");
  if (!i.diversityOk) failed.push("generation-variance-collapsed");
  if (!i.rubricCalibrated) failed.push("judge-rubric-not-calibrated");
  return { promote: failed.length === 0, failed };
}

/** Construct an ArchiveEntry from a scored variant (content-addressed id). */
export function makeArchiveEntry(args: {
  genome: HarnessGenome;
  parent: string | null;
  fitness: number;
  perSubstrate: Record<string, number>;
  advantage: number;
  gates: ArchiveEntry["gates"];
}): ArchiveEntry {
  return {
    schemaVersion: 1,
    variantId: genomeHash(args.genome),
    parent: args.parent,
    genome: args.genome,
    fitness: args.fitness,
    perSubstrate: args.perSubstrate,
    advantage: args.advantage,
    childCount: 0,
    gates: args.gates,
  };
}
