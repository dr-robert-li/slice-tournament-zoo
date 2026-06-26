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
  STZ_ROLES,
  type ProjectPhase,
  type ProjectPhaseStatus,
  type ProjectState,
  type ProjectSliceEntry,
  type SliceRunStatus,
  type RunConfig,
  type SlicingGranularity,
  type MutationPolicy,
  type ConventionStrictness,
  type StzRole,
  type HarnessConfig,
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

// ── run configuration (0.3.0) ───────────────────────────────────────────────

export function runConfigPath(root: string): string {
  return join(root, STZ_DIR, "00-intent", "run-config.json");
}

export function runConfigExists(root: string): boolean {
  return existsSync(runConfigPath(root));
}

/**
 * Default run config — a balanced starting point used when the user never set
 * one (every downstream consumer falls back to this, so the pipeline always has
 * a complete config). Model values are spawn aliases so they drop straight into
 * an Agent `model` override: a cheap model for high-volume research, the strong
 * model for judging where quality matters most.
 */
export const DEFAULT_MODELS: Record<StzRole, string> = {
  planning: "sonnet",
  research: "haiku",
  execution: "sonnet",
  testing: "sonnet",
  validation: "sonnet",
  judging: "opus",
};

export function defaultRunConfig(): RunConfig {
  return {
    schemaVersion: 1,
    granularity: "balanced",
    fanout: 4,
    models: { ...DEFAULT_MODELS },
    strictness: {
      coverageTarget: 0.9,
      mutationPolicy: "standard",
      conventions: "standard",
    },
    // Human-in-the-loop by default — a fully autonomous run is opt-in (0.4.0).
    darkFactory: false,
  };
}

const GRANULARITIES: readonly SlicingGranularity[] = ["coarse", "balanced", "fine"];
const MUTATION_POLICIES: readonly MutationPolicy[] = ["off", "lenient", "standard", "strict"];
const CONVENTION_STRICTNESS: readonly ConventionStrictness[] = ["relaxed", "standard", "strict"];

/** Lower bound on specimen fan-out — a tournament needs at least a pair. */
export const FANOUT_MIN = 2;
/** Upper bound on specimen fan-out — the published RTV+PDR optimum for the
 *  cloud/CI profile (N3/F6). Workstation runs typically use far fewer. */
export const FANOUT_MAX = 16;

/**
 * Merge a partial config over the defaults and validate. Enum fields are
 * rejected if present-but-invalid (a typo must not silently fall back); fanout
 * is clamped to [FANOUT_MIN, FANOUT_MAX] and coverageTarget to [0, 1]. Model
 * values stay free-form (the get-shit-done "Other" pattern) — any string passes.
 */
export function normalizeRunConfig(partial: Partial<RunConfig> | undefined): RunConfig {
  const base = defaultRunConfig();
  const p = partial ?? {};

  if (p.granularity !== undefined && !GRANULARITIES.includes(p.granularity)) {
    throw new Error(`invalid granularity: ${p.granularity} (expected ${GRANULARITIES.join("|")})`);
  }
  const granularity = p.granularity ?? base.granularity;

  let fanout = base.fanout;
  if (p.fanout !== undefined) {
    const n = Math.round(Number(p.fanout));
    if (!Number.isFinite(n)) throw new Error(`invalid fanout: ${p.fanout}`);
    fanout = Math.max(FANOUT_MIN, Math.min(FANOUT_MAX, n));
  }

  const models: Record<StzRole, string> = { ...base.models };
  if (p.models) {
    for (const role of STZ_ROLES) {
      const v = p.models[role];
      if (v !== undefined && String(v).trim() !== "") models[role] = String(v).trim();
    }
  }

  const s: Partial<RunConfig["strictness"]> = p.strictness ?? {};
  if (s.mutationPolicy !== undefined && !MUTATION_POLICIES.includes(s.mutationPolicy)) {
    throw new Error(`invalid mutationPolicy: ${s.mutationPolicy} (expected ${MUTATION_POLICIES.join("|")})`);
  }
  if (s.conventions !== undefined && !CONVENTION_STRICTNESS.includes(s.conventions)) {
    throw new Error(`invalid conventions strictness: ${s.conventions} (expected ${CONVENTION_STRICTNESS.join("|")})`);
  }
  let coverageTarget = base.strictness.coverageTarget;
  if (s.coverageTarget !== undefined) {
    const c = Number(s.coverageTarget);
    if (!Number.isFinite(c)) throw new Error(`invalid coverageTarget: ${s.coverageTarget}`);
    coverageTarget = Math.max(0, Math.min(1, c));
  }

  // darkFactory is a plain boolean flag; accept the JSON literal or a stringy
  // "true"/"false" (it can arrive from a CLI arg), default to the base value.
  let darkFactory = base.darkFactory;
  if (p.darkFactory !== undefined) {
    darkFactory = p.darkFactory === true || String(p.darkFactory).trim().toLowerCase() === "true";
  }

  // Harness-level RSI (0.9.0) is opt-in: only attached when present, so existing
  // serialized configs (and their tests) keep their exact shape when it is absent.
  const harness = p.harness !== undefined ? normalizeHarnessConfig(p.harness) : undefined;

  return {
    schemaVersion: 1,
    granularity,
    fanout,
    models,
    strictness: {
      coverageTarget,
      mutationPolicy: s.mutationPolicy ?? base.strictness.mutationPolicy,
      conventions: s.conventions ?? base.strictness.conventions,
    },
    darkFactory,
    ...(harness ? { harness } : {}),
  };
}

/** Default harness-evolution config (0.9.0). Disabled — no behaviour change. */
export function defaultHarnessConfig(): HarnessConfig {
  return {
    enabled: false,
    generationSize: 4,
    maxGenerations: 5,
    archiveMax: 64,
    diversityFloor: 0.02,
    substrates: ["cron", "hexcolor", "ipv4"],
    weightsLever: "off",
  };
}

const GEN_SIZE_MIN = 2;
const GEN_SIZE_MAX = 8;

/** Merge + bound a partial harness config over the defaults. All fields clamped. */
export function normalizeHarnessConfig(partial: Partial<HarnessConfig> | undefined): HarnessConfig {
  const base = defaultHarnessConfig();
  const p = partial ?? {};
  const enabled = p.enabled === true || String(p.enabled).trim().toLowerCase() === "true";
  const clampInt = (v: unknown, lo: number, hi: number, dflt: number): number => {
    if (v === undefined) return dflt;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) throw new Error(`invalid harness numeric field: ${String(v)}`);
    return Math.max(lo, Math.min(hi, n));
  };
  let diversityFloor = base.diversityFloor;
  if (p.diversityFloor !== undefined) {
    const f = Number(p.diversityFloor);
    if (!Number.isFinite(f)) throw new Error(`invalid diversityFloor: ${String(p.diversityFloor)}`);
    diversityFloor = Math.max(0, Math.min(1, f));
  }
  const substrates =
    Array.isArray(p.substrates) && p.substrates.length > 0
      ? p.substrates.map((x) => String(x).trim()).filter(Boolean)
      : base.substrates;
  return {
    enabled,
    generationSize: clampInt(p.generationSize, GEN_SIZE_MIN, GEN_SIZE_MAX, base.generationSize),
    maxGenerations: clampInt(p.maxGenerations, 1, 50, base.maxGenerations),
    archiveMax: clampInt(p.archiveMax, 2, 4096, base.archiveMax),
    diversityFloor,
    substrates,
    weightsLever: "off",
  };
}

export async function saveRunConfig(root: string, config: RunConfig): Promise<void> {
  const p = runConfigPath(root);
  await mkdir(join(p, ".."), { recursive: true });
  await writeFile(p, JSON.stringify(config, null, 2) + "\n", "utf8");
}

/** Load the persisted run config, or the default if none was ever set. */
export async function loadRunConfig(root: string): Promise<RunConfig> {
  if (!runConfigExists(root)) return defaultRunConfig();
  const raw = JSON.parse(await readFile(runConfigPath(root), "utf8")) as Partial<RunConfig>;
  return normalizeRunConfig(raw);
}

/**
 * Flip dark-factory mode in place (0.4.0) without disturbing any other field.
 * This is a LOAD-MODIFY-SAVE on the existing config — deliberately NOT routed
 * through `normalizeRunConfig(partial)`, which merges over the *defaults* and
 * would silently reset fanout/models/strictness mid-run. Returns the resolved
 * config so the caller can echo it back.
 */
export async function setDarkFactory(root: string, enabled: boolean): Promise<RunConfig> {
  const current = await loadRunConfig(root);
  const next: RunConfig = { ...current, darkFactory: enabled };
  await saveRunConfig(root, next);
  return next;
}
