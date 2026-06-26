/**
 * Adversarial suite-hardening FSM (0.9.0, SSR-style — arXiv:2512.18552).
 *
 * One agent plays bug-INJECTOR (adversary) against the SEALED suite: it perturbs
 * a winning specimen into plausible variants it believes still satisfy the
 * contract. A variant the sealed suite still passes is a candidate suite blind
 * spot (the `injectMutants` survivors in eval-runner.ts). This module is the
 * bounded control loop around that — modeled on `escalation.ts`: pure, hard
 * ceiling, halt state, replayable (N6).
 *
 * The promotion of a survivor into a new sealed test is GATED (the mutant-
 * promotion oracle problem), not automatic — the bridge `inject` command runs
 * the gate: contract-clause adjudication → general-case authoring → amendSeal →
 * REFERENCE RE-VERIFY (if the sealed reference no longer passes, revert + halt).
 * The injector is blind to the truth oracle; it must never key a test to a
 * mutant's bytes (train-on-test). This FSM only decides "keep injecting?".
 */
import type { SurvivingMutant } from "./eval-runner.js";

export const MAX_INJECT_ROUNDS = 2;

export type InjectStage = "injecting" | "converged" | "exhausted";

export interface InjectState {
  stage: InjectStage;
  round: number;
  /** Survivors promoted into the suite so far (across rounds). */
  promoted: number;
}

export function initialInject(): InjectState {
  return { stage: "injecting", round: 0, promoted: 0 };
}

export type InjectAction =
  | { type: "inject"; note: string }
  | { type: "halt"; note: string };

/**
 * Advance the injector after a round produced `survivors` (suite-passing
 * mutants) of which `promoted` were gate-passed into the suite. Pure (N6).
 * Halts when: the suite caught everything this round (no survivors — converged),
 * or the round ceiling is hit (mirrors escalation MAX_RETRIES/MAX_REPLANS).
 */
export function onInjectRound(
  s: InjectState,
  round: { survivors: number; promoted: number },
): { next: InjectState; action: InjectAction } {
  const promoted = s.promoted + round.promoted;
  if (round.survivors === 0) {
    return {
      next: { stage: "converged", round: s.round + 1, promoted },
      action: { type: "halt", note: "No surviving mutant — the sealed suite caught every injected variant; converged." },
    };
  }
  if (s.round + 1 >= MAX_INJECT_ROUNDS) {
    return {
      next: { stage: "exhausted", round: s.round + 1, promoted },
      action: { type: "halt", note: "Inject-round ceiling reached; halting (bounded, like escalation)." },
    };
  }
  return {
    next: { stage: "injecting", round: s.round + 1, promoted },
    action: { type: "inject", note: `Suite still has a blind spot — injecting round ${s.round + 2}.` },
  };
}

export function isInjectDone(s: InjectState): boolean {
  return s.stage !== "injecting";
}

/**
 * Summarize a round's survivors for the adjudication/audit step. Pure projection
 * — no decision. The bridge `inject` command takes these to the clause
 * adjudicator and (if a named clause is violated) to stz-test-author.
 */
export function summarizeSurvivors(survivors: SurvivingMutant[]): { name: string; passRate: number }[] {
  return survivors.map((s) => ({ name: s.name, passRate: s.sealedResult.passRate }));
}
