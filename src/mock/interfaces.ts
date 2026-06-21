/**
 * The LLM / subagent boundary (§3 Generative AI Layer).
 *
 * These interfaces are the seam between the deterministic STZ spine and the
 * non-deterministic model layer. A live implementation invokes Claude Code /
 * Codex subagents; the deterministic mock (./mock.ts) lets the whole pipeline
 * run end-to-end in tests without any network call. Keeping the seam this thin
 * is what makes "drop in a live impl" real rather than aspirational.
 */
import type {
  DonePredicate,
  EvalResult,
  PairwiseVote,
  SliceManifest,
  SpecimenId,
} from "../types.js";
import type { Spec } from "../specdiff.js";

/** What a specimen produces when it implements a slice (F6). */
export interface SpecimenOutput {
  specimen: SpecimenId;
  /** relative path → file contents (the implementation diff, materialized). */
  files: Record<string, string>;
  /** Strategy label assigned by the diversification subagent (R5). */
  strategy: string;
}

/** Elicitation subagent (F2): questionnaire → done predicates + complexity. */
export interface Elicitor {
  elicit(request: string): Promise<{
    questionnaire: Record<string, string>;
    donePredicates: DonePredicate[];
    complexity: number;
  }>;
}

/** Frozen test-author subagent (F10/L1): authors the sealed held-out suite. */
export interface TestAuthor {
  authorTests(manifest: SliceManifest): Promise<{
    /** relative path → sealed test contents (judge-only, read-only). */
    sealed: Record<string, string>;
    rubric: string;
  }>;
}

/** Strategy-diversification subagent (R5): N distinct implementation strategies. */
export interface Strategist {
  strategies(manifest: SliceManifest, n: number): Promise<string[]>;
}

/** An implementer specimen (F6). */
export interface Specimen {
  implement(
    manifest: SliceManifest,
    strategy: string,
    /** Refinement context from the pressure log on a retry round (F9/F14). */
    refinement: string | null,
  ): Promise<SpecimenOutput>;
}

/** Eval runner (§3 Compute): runs sealed suite + coverage + mutation (F7/F11). */
export interface EvalRunner {
  evaluate(
    output: SpecimenOutput,
    sealed: Record<string, string>,
  ): Promise<EvalResult>;
}

/** Judge subagent (F7 stage 2): one pairwise vote, frozen separate context. */
export interface Judge {
  vote(
    a: SpecimenOutput,
    b: SpecimenOutput,
    sealed: Record<string, string>,
  ): Promise<SpecimenId>;
}

/** Documenter subagent (F13): as-built spec from winning merged code. */
export interface Documenter {
  asBuilt(winner: SpecimenOutput): Promise<Spec>;
}

/** Planner subagent (F5): intent spec from the manifest. */
export interface Planner {
  intentSpec(manifest: SliceManifest): Promise<Spec>;
}

/** The full set of model-layer collaborators the orchestrator needs. */
export interface ModelLayer {
  elicitor: Elicitor;
  testAuthor: TestAuthor;
  strategist: Strategist;
  specimen: Specimen;
  evalRunner: EvalRunner;
  judge: Judge;
  documenter: Documenter;
  planner: Planner;
}

/** Convenience: aggregate V votes for a pair into the list form (F7). */
export async function votePair(
  judge: Judge,
  a: SpecimenOutput,
  b: SpecimenOutput,
  sealed: Record<string, string>,
  votes: number,
): Promise<PairwiseVote[]> {
  const out: PairwiseVote[] = [];
  for (let v = 0; v < votes; v++) {
    const winner = await judge.vote(a, b, sealed);
    out.push({ a: a.specimen, b: b.specimen, winner });
  }
  return out;
}
