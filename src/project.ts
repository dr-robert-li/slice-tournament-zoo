/**
 * Project-level driver state + DAG ordering (the multi-slice layer).
 *
 * STZ runs many slices through a dependency DAG. This module is the
 * deterministic spine for that: the project manifest (declarative slice DAG),
 * the project state (mutable phase + slice rollup), topological ordering, and
 * the "next runnable slice" computation. It mirrors `state.ts` conventions.
 *
 * The authority rule (no drift): per-slice status is DERIVED from each slice's
 * own `40-slices/<id>/state.json` via the existing per-slice helpers, never
 * trusted from a project-level copy. So `project-status` writing nothing and
 * re-deriving on every call IS the resume primitive.
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  PROJECT_PHASES,
  type ProjectPhase,
  type ProjectPhaseStatus,
  type ProjectState,
  type ProjectSliceEntry,
  type SliceRunStatus,
} from "./types.js";
import { STZ_DIR } from "./taxonomy.js";
import { loadState, stateExists, isComplete } from "./state.js";
import type { SliceState } from "./types.js";

export function projectManifestPath(root: string): string {
  return join(root, STZ_DIR, "00-intent", "project.json");
}

export function projectStatePath(root: string): string {
  return join(root, STZ_DIR, "90-audit", "project-state.json");
}

/** Project phase → the `.stz/` tier its artifacts live under. */
export const PROJECT_PHASE_TIER: Record<ProjectPhase, string> = {
  elicitation: "00-intent",
  research: "10-research",
  "ground-truth": "10-research/internal",
  standards: "20-standards",
  "testing-conventions": "30-tests",
  "slice-disaggregation": "40-slices",
};

export function freshProjectState(projectId: string): ProjectState {
  const phaseStatus = Object.fromEntries(
    PROJECT_PHASES.map((p) => [p, "pending" as ProjectPhaseStatus]),
  ) as Record<ProjectPhase, ProjectPhaseStatus>;
  return {
    schemaVersion: 1,
    projectId,
    phaseStatus,
    sliceStatus: {},
    events: [],
  };
}

export function appendProjectEvent(
  state: ProjectState,
  phase: ProjectPhase | "lifecycle" | "slice",
  kind: string,
  detail: string,
): ProjectState {
  state.events.push({ seq: state.events.length, phase, kind, detail });
  return state;
}

export async function saveProjectState(root: string, state: ProjectState): Promise<void> {
  const p = projectStatePath(root);
  await mkdir(join(p, ".."), { recursive: true });
  await writeFile(p, JSON.stringify(state, null, 2) + "\n", "utf8");
}

export async function loadProjectState(root: string): Promise<ProjectState> {
  return JSON.parse(await readFile(projectStatePath(root), "utf8")) as ProjectState;
}

export function projectStateExists(root: string): boolean {
  return existsSync(projectStatePath(root));
}

// ── topological ordering ────────────────────────────────────────────────────

export type TopoResult =
  | { ok: true; order: string[] }
  | { ok: false; error: "cycle"; cycle: string[] }
  | { ok: false; error: "dangling"; from: string; missing: string };

/**
 * Kahn's algorithm over the slice DAG. The ready frontier is sorted ascending
 * by id at every step so the order is fully deterministic (N6). Detects
 * dangling dependencies (a depends-on id not in the set) and cycles.
 */
export function topoOrder(slices: ProjectSliceEntry[]): TopoResult {
  const ids = new Set(slices.map((s) => s.id));
  for (const s of slices) {
    for (const dep of s.dependsOn) {
      if (!ids.has(dep)) return { ok: false, error: "dangling", from: s.id, missing: dep };
    }
  }
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const s of slices) {
    indegree.set(s.id, s.dependsOn.length);
    for (const dep of s.dependsOn) {
      const arr = dependents.get(dep) ?? [];
      arr.push(s.id);
      dependents.set(dep, arr);
    }
  }
  const order: string[] = [];
  let ready = [...indegree.entries()].filter(([, d]) => d === 0).map(([id]) => id).sort();
  while (ready.length > 0) {
    const id = ready.shift()!;
    order.push(id);
    for (const dependent of dependents.get(id) ?? []) {
      const d = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, d);
      if (d === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }
  if (order.length < slices.length) {
    const cycle = slices.map((s) => s.id).filter((id) => !order.includes(id));
    return { ok: false, error: "cycle", cycle };
  }
  return { ok: true, order };
}

// ── status derivation (the no-drift rule) ───────────────────────────────────

/** Derive a slice's rollup status from its own per-slice state.json. */
export async function deriveSliceStatus(root: string, sliceId: string): Promise<SliceRunStatus> {
  if (!stateExists(root, sliceId)) return "pending";
  let state: SliceState;
  try {
    state = await loadState(root, sliceId);
  } catch {
    return "pending";
  }
  if (state.escalation === "halted") return "halted";
  if (isComplete(state)) return "done";
  // "running" means the tournament half is actually in progress — not merely
  // that the project-level early phases were pre-seeded done. So: any phase
  // explicitly "running", OR any tournament-half phase already "done".
  const anyRunning = Object.values(state.phaseStatus).some((s) => s === "running");
  const tournamentHalf = ["test-authoring", "planning", "tournament", "judgment"] as const;
  const tournamentStarted = tournamentHalf.some((p) => state.phaseStatus[p] === "done");
  if (anyRunning || tournamentStarted) return "running";
  return "pending";
}

export interface NextRunnable {
  order: string[];
  frontier: string[];
  next: string | null;
}

/**
 * Compute the runnable frontier and the single deterministic next slice.
 * The frontier is every slice whose dependencies are all `done` and which is
 * not itself `done`/`halted`/`running`. `next` is the id-sorted first of the
 * frontier (a single pick). Returns empty/null on a non-ok topo order.
 */
export async function nextRunnable(
  slices: ProjectSliceEntry[],
  statusOf: (id: string) => Promise<SliceRunStatus>,
): Promise<NextRunnable & { topo: TopoResult }> {
  const topo = topoOrder(slices);
  if (!topo.ok) return { order: [], frontier: [], next: null, topo };
  const status = new Map<string, SliceRunStatus>();
  for (const id of topo.order) status.set(id, await statusOf(id));
  const byId = new Map(slices.map((s) => [s.id, s]));
  const frontier = topo.order.filter((id) => {
    const st = status.get(id);
    if (st === "done" || st === "halted" || st === "running") return false;
    const deps = byId.get(id)!.dependsOn;
    return deps.every((d) => status.get(d) === "done");
  });
  return { order: topo.order, frontier, next: frontier[0] ?? null, topo };
}
