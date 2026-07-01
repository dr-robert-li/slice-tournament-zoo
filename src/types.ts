/**
 * STZ domain types — the data model that the whole harness reads/writes.
 *
 * Design anchor: N1 (auditability) + N6 (determinism/replay). Every decision
 * the harness makes must be reconstructible from the markdown tree + git +
 * the `state.json` event sequence. These types are the schema for that state.
 */

/** The 8 phases of the per-slice pipeline (F1). Order is significant. */
export const PHASES = [
  "elicitation",
  "research",
  "ground-truth-validation",
  "standards",
  "test-authoring",
  "planning",
  "tournament",
  "judgment",
] as const;

export type Phase = (typeof PHASES)[number];

/** Lifecycle status of a single phase within a slice. */
export type PhaseStatus = "pending" | "running" | "done" | "failed";

/** Where the bounded failure-escalation FSM (F14) currently sits. */
export type EscalationStage =
  | "normal"
  | "grpo-retry"
  | "replan"
  | "halted";

/** Specimen identifiers default to a..d for N=4 (F6). */
export type SpecimenId = string;

/**
 * A machine-checkable success predicate (F2). Elicitation may not exit until
 * every quantitative success criterion is expressed as one of these — no
 * prose-only acceptance.
 */
export interface DonePredicate {
  /** Stable id, e.g. "p95_latency". */
  id: string;
  /** The predicate expression, e.g. "p95_latency_ms < 200". */
  expr: string;
  /** How it is checked: a sealed test, a metric threshold, a schema match. */
  kind: "test" | "metric" | "schema";
}

/** Trace tier declared per slice (F11). */
export type TraceTier = "minimal" | "otel";

/**
 * Per-slice manifest frontmatter (F5). The orchestrator loads this summary,
 * never the full slice body (N2 progressive disclosure).
 */
export interface SliceManifest {
  id: string; // "slice-01"
  name: string; // "elicitation-subagent"
  /** Interface contract the slice implements (F4). Prose/signature surface. */
  contract: string;
  donePredicates: DonePredicate[];
  traceTier: TraceTier;
  /** Complexity estimate 1..5 (F15) — drives budgeting. */
  complexity: number;
  /** Slice ids this one depends on (DAG ordering, F5). */
  dependsOn: string[];
  /** Judge config (F7): votes per pairwise comparison. */
  judge: { votesPerPair: number };
  /** ~200-token summary for progressive disclosure (N2). */
  summary: string;
  /**
   * 0.9.6 Contract Plane: the accepted contract slice id this run targets. When
   * set (and `RunConfig.contract.enabled`), specimens are gated on the slice's
   * predicates in `select()`. Optional ⇒ absent leaves 0.9.5 behaviour intact.
   */
  contractSliceId?: string;
}

/**
 * 0.9.6 Contract Plane feature flag (RunConfig.contract). Default OFF: absent or
 * `enabled:false` ⇒ the tournament runs exactly as 0.9.5, no contract gating.
 */
export interface ContractRunConfig {
  enabled: boolean;
  /** Accepted contract slice id to bind, if any. */
  sliceId?: string;
}

/** Result of running one specimen through the eval-gate (F7 stage 1). */
export interface EvalResult {
  specimen: SpecimenId;
  /** Did it pass the sealed held-out suite? Gate failures are eliminated. */
  passedGate: boolean;
  /** 0..1 fraction of sealed tests passed. */
  testPassRate: number;
  /** 0..1 code coverage (F11). */
  coverage: number;
  /** 0..1 mutation survival rate; lower is better (F11). */
  mutationScore: number;
  /** Hack-pattern findings (F10/L3). Non-empty ⇒ disqualified. */
  hackFindings: HackFinding[];
  /**
   * 0..1 code-health score (0.9.0, CodeClash-informed). Rewards parsimony and
   * penalizes bloat/redundancy/branch-sprawl. Optional: absent ⇒ treated as the
   * neutral best (1) so legacy callers are unaffected and a perfect specimen
   * still scores reward 1.0.
   */
  codeHealth?: number;
  /**
   * 0..1 graded "soft-suspicion" sub-DQ signal (0.9.0). Weaker than the hard
   * `hackFindings` gate — a specimen that passes the gate can still carry a
   * non-zero suspicion (e.g. fixture-name proximity that doesn't trip the hard
   * rule). Higher is worse. Optional: absent ⇒ treated as 0 (clean).
   */
  suspicion?: number;
}

/** A single anti-reward-hacking finding (F10 / L3). */
export interface HackFinding {
  specimen: SpecimenId;
  pattern: HackPattern;
  /** File + line where the pattern was detected. */
  location: string;
  /** Remediation context re-injected into the next prompt on replan (F14). */
  remediation: string;
}

export type HackPattern =
  | "hardcoded-test-input"
  | "assertion-mutation"
  | "test-skip"
  | "fixture-keyed-branch"
  | "network-bypass";

/** A single pairwise judge vote (F7 stage 2). */
export interface PairwiseVote {
  a: SpecimenId;
  b: SpecimenId;
  /** Winner of this vote. */
  winner: SpecimenId;
}

/** GRPO group-relative advantage for one specimen (F8). */
export interface Advantage {
  specimen: SpecimenId;
  reward: number;
  advantage: number;
}

/** Final ranking output of the judgment phase. */
export interface Judgment {
  /** Specimens ordered best→worst among gate-passers. */
  ranking: SpecimenId[];
  winner: SpecimenId | null;
  advantages: Advantage[];
  votes: PairwiseVote[];
}

/** One persisted LLM/subagent call for replay (N6). */
export interface CallRecord {
  id: string;
  phase: Phase;
  role: "specimen" | "judge" | "test-author" | "documenter" | "elicitor" | "researcher" | "planner";
  model: string;
  temperature: number;
  seed: number | null;
  promptTokens: number;
  completionTokens: number;
  /** Monotonic sequence index for deterministic replay ordering. */
  seq: number;
}

/** Per-slice budget derived from complexity (F15, N5). */
export interface Budget {
  tokenCap: number;
  wallClockMs: number;
  tokensSpent: number;
}

/** A structured state-transition event (N1: replayable event sequence). */
export interface StateEvent {
  seq: number;
  phase: Phase | "lifecycle";
  kind: string;
  detail: string;
}

/**
 * `state.json` — the per-slice durable checkpoint (F16). Combined with git and
 * the markdown tree it is sufficient to replay any decision (N1) and to resume
 * after a crash from the last committed phase.
 */
export interface SliceState {
  schemaVersion: 1;
  sliceId: string;
  currentPhase: Phase;
  phaseStatus: Record<Phase, PhaseStatus>;
  escalation: EscalationStage;
  /** How many GRPO retries / replans consumed (ceiling enforced by F14). */
  retryCount: number;
  replanCount: number;
  activeSpecimens: SpecimenId[];
  budget: Budget;
  /** Append-only event log — the replay spine. */
  events: StateEvent[];
  /** Accumulated call ledger pointers (full records under 90-audit/calls). */
  callCount: number;
  /** Set when escalation reaches "halted". */
  failureReport: string | null;
}

// ── Project-level pipeline (multi-slice driver) ─────────────────────────────

/**
 * Project-level pipeline phases — run ONCE for the whole project, before and
 * around the per-slice tournaments. These share names with the per-slice
 * `PHASES` but are a different scope: project preparation vs. one slice's
 * tournament. Kept as a separate enum on purpose; do not overload `PHASES`.
 */
export const PROJECT_PHASES = [
  "elicitation",
  "research",
  "ground-truth",
  "standards",
  "testing-conventions",
  "slice-disaggregation",
] as const;

export type ProjectPhase = (typeof PROJECT_PHASES)[number];
export type ProjectPhaseStatus = "pending" | "done";

/** Per-slice rollup status as seen by the project driver. */
export type SliceRunStatus = "pending" | "running" | "done" | "halted";

/** One slice as registered in the project DAG. A thin pointer; the full
 *  SliceManifest still lives at 40-slices/<id>/manifest.json. */
export interface ProjectSliceEntry {
  id: string;
  name: string;
  /** Slice ids this one depends on — reuses SliceManifest.dependsOn semantics. */
  dependsOn: string[];
}

/** 00-intent/project.json — the declarative project spec + slice DAG. */
export interface ProjectManifest {
  schemaVersion: 1;
  projectId: string;
  name: string;
  summary: string;
  slices: ProjectSliceEntry[];
}

/** A project-level structured event (N1 replay spine, project scope). */
export interface ProjectStateEvent {
  seq: number;
  phase: ProjectPhase | "lifecycle" | "slice";
  kind: string;
  detail: string;
}

/**
 * 90-audit/project-state.json — the mutable project driver state. `sliceStatus`
 * is a cache; `project-status` re-derives the authoritative value from each
 * slice's own 40-slices/<id>/state.json (no dual-write, no drift).
 */
export interface ProjectState {
  schemaVersion: 1;
  projectId: string;
  phaseStatus: Record<ProjectPhase, ProjectPhaseStatus>;
  sliceStatus: Record<string, SliceRunStatus>;
  events: ProjectStateEvent[];
}

// ── Run configuration (0.3.0 — captured during elicitation, consumed
//    downstream) ─────────────────────────────────────────────────────────────

/** How finely `/stz:slice` breaks the work into vertical slices. */
export type SlicingGranularity = "coarse" | "balanced" | "fine";

/** Mutation-testing bar for `/stz:tests`. */
export type MutationPolicy = "off" | "lenient" | "standard" | "strict";

/** Conventions/lint bar for `/stz:standards`. */
export type ConventionStrictness = "relaxed" | "standard" | "strict";

/** The per-role subagents whose model can be chosen up front. */
export const STZ_ROLES = [
  "planning",
  "research",
  "execution",
  "testing",
  "validation",
  "judging",
] as const;
export type StzRole = (typeof STZ_ROLES)[number];

/** Strictness bar applied to standards and testing conventions. */
export interface StrictnessConfig {
  /** Coverage target in [0, 1] — `/stz:tests` strategy + per-slice eval. */
  coverageTarget: number;
  mutationPolicy: MutationPolicy;
  conventions: ConventionStrictness;
}

/**
 * 00-intent/run-config.json — the run configuration the user sets during
 * `/stz:new`, applied downstream: `granularity` → `/stz:slice`, `fanout` → the
 * specimen count N in `/stz:run`, `models` → the per-role subagent model
 * overrides, `strictness` → `/stz:standards` and `/stz:tests`.
 *
 * `models` values are FREE-FORM strings (the get-shit-done "Other" pattern):
 * the suggested combos use spawn aliases (`opus`/`sonnet`/`haiku`/`fable`) so
 * they drop straight into an Agent `model` override, but any string is allowed.
 */
export interface RunConfig {
  schemaVersion: 1;
  granularity: SlicingGranularity;
  /** Specimens per tournament (N). Clamped to [2, 8]. */
  fanout: number;
  models: Record<StzRole, string>;
  strictness: StrictnessConfig;
  /**
   * Dark-factory mode (0.4.0). When true the pipeline runs end-to-end with no
   * human in the loop: the orchestrator skips every interactive gate it can
   * legitimately skip (the `/stz:slice` "approve as-is" gate and the `/stz:run`
   * winner-approval gate) and drives every phase → per-slice run → summary
   * autonomously, surfacing only the final completion report. The one gate it
   * may NOT skip is the F2 done-predicate confirmation in elicitation — a run
   * with zero machine-checkable predicates is never auto-invented. Off by
   * default; offered at the end of elicitation and flippable at any point via
   * `stz bridge project-dark-factory` (the invoke-anytime flag).
   */
  darkFactory: boolean;
  /**
   * Harness-level recursive self-improvement (0.9.0). Optional + default-off:
   * absent or `enabled:false` ⇒ STZ runs exactly as before (the per-slice
   * tournament is untouched and earned-correct). When enabled, `stz:evolve`
   * runs the DGM/HarnessX-style meta-loop that evolves the harness genome
   * against held-out pilot fitness. See `HarnessConfig`.
   */
  harness?: HarnessConfig;
  /**
   * 0.9.6 Contract Plane. Optional + default-off: absent ⇒ STZ runs exactly as
   * 0.9.5 (no contract gating in selection). When `enabled`, a bound accepted
   * contract slice gates specimens in `select()` via their predicate results.
   */
  contract?: ContractRunConfig;
}

// ── 0.9.0 Harness-level recursive self-improvement (meta-loop) ───────────────

/**
 * Configuration of the harness-evolution meta-loop (0.9.0). Every field is
 * bounded; the meta-loop is opt-in (default `enabled:false`) so existing runs
 * behave identically. The per-slice tournament is NOT a gene — only the harness
 * genome (prompts, batteries, weights, fan-out) evolves.
 */
export interface HarnessConfig {
  /** Master switch. Default false ⇒ no behaviour change. */
  enabled: boolean;
  /** K variants per generation (the GRPO "group"). Bounded [2, 8]. */
  generationSize: number;
  /** Hard ceiling on generations (meta-FSM, mirrors escalation MAX_*). */
  maxGenerations: number;
  /** Archive cap; lowest fitness/(1+childCount) retired when full (never incumbent). */
  archiveMax: number;
  /** Minimum group fitness stddev; below it a generation is a variance-collapse artifact. */
  diversityFloor: number;
  /** Recall-free held-out fitness substrates (pilot task names). */
  substrates: string[];
  /** SIA/BYO-LLM v2 seam: a future LoRA lever plugs in here. Off in 0.9.0. */
  weightsLever: "off";
}

/** The mutable genes of a harness variant (HarnessX substitution algebra). */
export interface HarnessGenome {
  /** G1: test-author negative-case heuristic id (the flagship gene). */
  heuristicId: string;
  /** G2: appended bug-class mutator ids active in the battery. */
  mutatorIds: string[];
  /** G3: specimen strategy-label set. */
  strategySet: string[];
  /** G4: judge rubric id. */
  rubricId: string;
  /** G5: selection weights tuple (must sum to 1, each [0,1]). */
  weights: { pass: number; coverage: number; kill: number; codeHealth: number; clean: number };
  /** G6: fan-out + votes per pair (bounded ints). */
  fanout: number;
  votesPerPair: number;
  /**
   * G7 (0.9.6): contract/spec-crystallization heuristic id — how the
   * edge-explorer crystallizes a discovered edge into a typed contract predicate.
   * Optional + free string (mirrors G1 `heuristicId`); absent ⇒ the default
   * crystallizer, so every existing genome literal is unaffected. This is a
   * harness-altitude gene (HarnessX) whose signal is NOT derived from the sealed
   * suite — the one axis STZ's numeric-gene negative did not close.
   */
  crystallizationHeuristicId?: string;
}

/**
 * One archived harness variant (DGM stepping-stone). N6-CLEAN: no timestamps —
 * append-order in `60-harness/MANIFEST.json` is the audit sequence (mirrors
 * `seal.ts`). `variantId` is the content-addressed harness-contract hash.
 */
export interface ArchiveEntry {
  schemaVersion: 1;
  variantId: string;
  /** Stepping-stone lineage (DGM); null for the seed/incumbent. */
  parent: string | null;
  genome: HarnessGenome;
  /** Held-out pilot fitness (AceGRPO-weighted mean over substrates). */
  fitness: number;
  /** Per-substrate truth scores (cron/hexcolor/ipv4 …). */
  perSubstrate: Record<string, number>;
  /** GRPO advantage within its generation. */
  advantage: number;
  /** For parent-sampling P ∝ fitness/(1+childCount). */
  childCount: number;
  /** The six-gate promotion verdict snapshot (0.9.5 adds rubricCalibrated). */
  gates: { hackClean: boolean; sealOk: boolean; interfaceParity: boolean; diversityOk: boolean; beatsIncumbent: boolean; rubricCalibrated: boolean };
}
