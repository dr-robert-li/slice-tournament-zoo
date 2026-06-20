/**
 * Bounded failure escalation (F14, R1 mitigation).
 *
 *   no passers → 1 GRPO retry round (losers' pressure log as negative context)
 *             → 1 replanning loop (failure analysis fed back into planning)
 *             → halt with a structured failure report.
 *
 * Hard ceiling. This FSM is the single source of truth for "are we allowed to
 * try again?" — the orchestrator must consult it and never loop on its own.
 * The ceiling is exactly: at most 1 retry and at most 1 replan, ever.
 */
import type { EscalationStage } from "./types.js";

export interface EscalationState {
  stage: EscalationStage;
  retryCount: number;
  replanCount: number;
}

export const MAX_RETRIES = 1;
export const MAX_REPLANS = 1;

export function initialEscalation(): EscalationState {
  return { stage: "normal", retryCount: 0, replanCount: 0 };
}

export type EscalationAction =
  | { type: "retry"; note: string }
  | { type: "replan"; note: string }
  | { type: "halt"; note: string };

/**
 * Given the current escalation state after a tournament produced no gate-passers,
 * decide the next action and return the advanced state. Pure function: same
 * input → same output (N6).
 */
export function onNoPassers(s: EscalationState): {
  next: EscalationState;
  action: EscalationAction;
} {
  if (s.retryCount < MAX_RETRIES) {
    return {
      next: { stage: "grpo-retry", retryCount: s.retryCount + 1, replanCount: s.replanCount },
      action: {
        type: "retry",
        note: "Re-running tournament with pressure log + K=4 surviving summaries as PDR refinement context.",
      },
    };
  }
  if (s.replanCount < MAX_REPLANS) {
    return {
      next: { stage: "replan", retryCount: s.retryCount, replanCount: s.replanCount + 1 },
      action: {
        type: "replan",
        note: "Re-entering planning phase with failure analysis from the prior round.",
      },
    };
  }
  return {
    next: { stage: "halted", retryCount: s.retryCount, replanCount: s.replanCount },
    action: {
      type: "halt",
      note: "Retry and replan budgets exhausted. Emitting structured failure report.",
    },
  };
}

/** True once no further attempts are permitted. */
export function isHalted(s: EscalationState): boolean {
  return s.stage === "halted";
}

/**
 * Drive the FSM to terminal state from a given start, recording the action
 * sequence. Used to prove the ceiling holds (test) and to dry-run the path.
 */
export function escalationTrace(start = initialEscalation()): EscalationAction[] {
  const actions: EscalationAction[] = [];
  let s = start;
  // Bound the loop independently as a belt-and-suspenders guard; the FSM must
  // terminate in at most MAX_RETRIES + MAX_REPLANS + 1 steps.
  for (let guard = 0; guard < MAX_RETRIES + MAX_REPLANS + 5; guard++) {
    const { next, action } = onNoPassers(s);
    actions.push(action);
    s = next;
    if (action.type === "halt") return actions;
  }
  throw new Error("escalation FSM failed to terminate — ceiling violated");
}
