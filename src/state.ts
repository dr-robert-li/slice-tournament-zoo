/**
 * Per-slice state store (F16, N1). git is the artifact store; `state.json`
 * tracks current phase, active specimens, escalation, budget, and an
 * append-only event sequence. Crash recovery resumes from `state.json` + the
 * last commit on the slice branch.
 *
 * Lives at `.stz/40-slices/<sliceId>/state.json`. (The §3 taxonomy lists
 * state.json under 90-audit; we keep a per-slice copy beside the slice so a
 * slice is self-contained, matching F16 "state.json per slice".)
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { PHASES, type Phase, type PhaseStatus, type SliceState } from "./types.js";
import { STZ_DIR } from "./taxonomy.js";
import { allocateBudget } from "./budget.js";

export function statePath(root: string, sliceId: string): string {
  return join(root, STZ_DIR, "40-slices", sliceId, "state.json");
}

export function freshState(sliceId: string, complexity = 1, poolRemaining = 5_000_000): SliceState {
  const phaseStatus = Object.fromEntries(
    PHASES.map((p) => [p, "pending" as PhaseStatus]),
  ) as Record<Phase, PhaseStatus>;
  return {
    schemaVersion: 1,
    sliceId,
    currentPhase: PHASES[0],
    phaseStatus,
    escalation: "normal",
    retryCount: 0,
    replanCount: 0,
    activeSpecimens: [],
    budget: allocateBudget(complexity, poolRemaining),
    events: [],
    callCount: 0,
    failureReport: null,
  };
}

/** Append a structured event (N1 replay spine). Mutates and returns state. */
export function appendEvent(
  state: SliceState,
  phase: Phase | "lifecycle",
  kind: string,
  detail: string,
): SliceState {
  state.events.push({ seq: state.events.length, phase, kind, detail });
  return state;
}

export function setPhaseStatus(
  state: SliceState,
  phase: Phase,
  status: PhaseStatus,
): SliceState {
  state.phaseStatus[phase] = status;
  if (status === "running") state.currentPhase = phase;
  return appendEvent(state, phase, `phase-${status}`, `${phase} → ${status}`);
}

export async function saveState(root: string, state: SliceState): Promise<void> {
  const p = statePath(root, state.sliceId);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

export async function loadState(root: string, sliceId: string): Promise<SliceState> {
  const raw = await readFile(statePath(root, sliceId), "utf8");
  return JSON.parse(raw) as SliceState;
}

export function stateExists(root: string, sliceId: string): boolean {
  return existsSync(statePath(root, sliceId));
}

/**
 * Crash recovery (F16): determine the phase to resume from. A phase left in
 * "running" was interrupted and must be re-entered; otherwise resume at the
 * first non-done phase. Returns null if the slice is fully complete or halted.
 */
export function resumePhase(state: SliceState): Phase | null {
  if (state.escalation === "halted") return null;
  const running = PHASES.find((p) => state.phaseStatus[p] === "running");
  if (running) return running;
  const pending = PHASES.find(
    (p) => state.phaseStatus[p] === "pending" || state.phaseStatus[p] === "failed",
  );
  return pending ?? null;
}

export function isComplete(state: SliceState): boolean {
  return PHASES.every((p) => state.phaseStatus[p] === "done");
}
