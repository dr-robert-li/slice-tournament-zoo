/**
 * The in-session orchestration bridge.
 *
 * STZ runs *inside* Claude Code: the orchestrator is the command-driven main
 * agent, which spawns specimen/judge/test-author/documenter work as Task
 * subagents. A Node process cannot call the Task tool, so the model layer lives
 * in the agent loop — but every *deterministic* decision (eval gate, hack
 * detection, GRPO, selection, state, audit) must stay exact and replayable.
 *
 * This module is that deterministic half, exposed as JSON-in / JSON-out
 * subcommands the `/stz:run` command calls between agent spawns. The command
 * owns spawn-and-collect; the bridge owns all compute. If a tally or comparison
 * is ever tempting to write in the command markdown, it belongs here instead.
 *
 *   stz bridge begin       --root D --manifest M.json
 *   stz bridge record-eval --root D --slice S --specimen X --metrics J.json
 *   stz bridge gate        --root D --slice S
 *   stz bridge record-votes--root D --slice S --votes V.json
 *   stz bridge select      --root D --slice S
 *   stz bridge finalize    --root D --slice S --intent I.json --asbuilt A.json
 *
 * Every subcommand prints a single JSON object on stdout (the command parses
 * it) and writes its durable artifacts into the `.stz/` tree.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  EvalResult,
  PairwiseVote,
  SliceManifest,
  ProjectManifest,
  ProjectPhase,
  ProjectSliceEntry,
} from "./types.js";
import { PROJECT_PHASES } from "./types.js";
import { scaffold, writeDoc, readDoc, stzPath } from "./taxonomy.js";
import { freshState, saveState, loadState, setPhaseStatus, appendEvent } from "./state.js";
import {
  freshProjectState,
  saveProjectState,
  loadProjectState,
  appendProjectEvent,
  projectManifestPath,
  PROJECT_PHASE_TIER,
  topoOrder,
  deriveSliceStatus,
  nextRunnable,
} from "./project.js";
import { detectHacks } from "./hack-detector.js";
import { evalGate, select, pairings } from "./selection.js";
import { diffSpecs, renderSpecDiff, isFaithful, type Spec } from "./specdiff.js";
import { renderPressureLog, refinementContext, type CulledSpecimen } from "./pressure.js";
import { fullEval } from "./eval-runner.js";

// ── small arg parser ──────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a?.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1]!.startsWith("--") ? argv[++i]! : "true";
      out[key] = val;
    }
  }
  return out;
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function print(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

// ── paths within a slice ────────────────────────────────────────────────────

const sliceRel = (id: string) => join("40-slices", id);
const protoRel = (id: string, specimen: string) =>
  join(sliceRel(id), "prototypes", `specimen-${specimen}`);
const evalResultPath = (root: string, id: string, specimen: string) =>
  stzPath(root, join(protoRel(id, specimen), "eval", "result.json"));
const votesPath = (root: string, id: string) =>
  stzPath(root, join(sliceRel(id), "tournament", "votes.json"));
const judgmentPath = (root: string, id: string) =>
  stzPath(root, join(sliceRel(id), "tournament", "judgment.json"));

function readSpecimenFiles(root: string, id: string, specimen: string): Record<string, string> {
  const dir = stzPath(root, protoRel(id, specimen));
  const files: Record<string, string> = {};
  const walk = (rel: string) => {
    const abs = join(dir, rel);
    if (!existsSync(abs)) return;
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      if (ent.name === "eval") continue; // skip our own eval output dir
      const childRel = join(rel, ent.name);
      if (ent.isDirectory()) walk(childRel);
      else files[childRel] = readFileSync(join(dir, childRel), "utf8");
    }
  };
  walk(".");
  return files;
}

function listSpecimens(root: string, id: string): string[] {
  const dir = stzPath(root, join(sliceRel(id), "prototypes"));
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("specimen-"))
    .map((e) => e.name.replace("specimen-", ""))
    .sort();
}

// ── subcommands ─────────────────────────────────────────────────────────────

async function begin(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const manifest = readJSON<SliceManifest>(args.manifest!);
  await scaffold(root);
  await writeDoc(root, join(sliceRel(manifest.id), "manifest.md"), {
    frontmatter: {
      summary: manifest.summary,
      contract: manifest.contract,
      complexity: manifest.complexity,
      traceTier: manifest.traceTier,
      votesPerPair: manifest.judge.votesPerPair,
    },
    body:
      `# ${manifest.id} — ${manifest.name}\n\n## Contract\n\n\`${manifest.contract}\`\n\n` +
      `## Done predicates\n` +
      manifest.donePredicates.map((d) => `- \`${d.expr}\` (${d.kind})`).join("\n") +
      "\n",
  });
  const state = freshState(manifest.id, manifest.complexity);
  await saveState(root, setPhaseStatus(state, "planning", "done"));
  print({
    sliceId: manifest.id,
    votesPerPair: manifest.judge.votesPerPair,
    protoDirRoot: stzPath(root, join(sliceRel(manifest.id), "prototypes")),
    note: "spawn specimens to write into prototypes/specimen-<id>/; they return a path+summary, not file contents (N2).",
  });
}

/**
 * Record one specimen's eval result. The hack-detector runs HERE, for real,
 * over the specimen's written files (F10/L3 is never mocked). The model-side
 * metrics (testPassRate/coverage/mutation) are supplied by the eval runner the
 * command invoked, so the gate decision is deterministic given those inputs.
 */
/** Build, persist, and print an EvalResult from already-measured metrics. */
function commitEval(
  root: string,
  slice: string,
  specimen: string,
  metrics: { testPassRate: number; coverage: number; mutationScore: number },
  fixtureNames: string[],
  extra: Record<string, unknown> = {},
): void {
  const files = readSpecimenFiles(root, slice, specimen);
  const hackFindings = detectHacks(specimen, files, { fixtureNames });
  const result: EvalResult = {
    specimen,
    passedGate: metrics.testPassRate >= 1 && hackFindings.length === 0,
    testPassRate: metrics.testPassRate,
    coverage: metrics.coverage,
    mutationScore: metrics.mutationScore,
    hackFindings,
  };
  const out = evalResultPath(root, slice, specimen);
  mkdirSync(join(out, ".."), { recursive: true });
  writeFileSync(out, JSON.stringify(result, null, 2) + "\n", "utf8");
  print({ ...result, ...extra });
}

/** record-eval: metrics supplied by the caller (an external eval runner). */
function recordEval(args: Record<string, string>): void {
  const { root, slice, specimen } = args as { root: string; slice: string; specimen: string };
  const metrics = readJSON<{ testPassRate: number; coverage: number; mutationScore: number }>(args.metrics!);
  commitEval(root, slice, specimen, metrics, args.fixtures ? args.fixtures.split(",") : []);
}

/**
 * eval: run the REAL eval runner (sealed suite + V8 coverage + mutation) over a
 * specimen and record the result. This is the un-stubbed path — testPassRate,
 * coverage, and mutationScore are all genuinely executed, no caller trust.
 */
function evalCmd(args: Record<string, string>): void {
  const { root, slice, specimen } = args as { root: string; slice: string; specimen: string };
  const e = fullEval(args.sealed!, args.impl!);
  commitEval(
    root,
    slice,
    specimen,
    { testPassRate: e.testPassRate, coverage: e.coverage, mutationScore: e.mutationScore },
    args.fixtures ? args.fixtures.split(",") : [],
    { measured: { passed: e.passed, total: e.total, mutants: e.mutants, survivors: e.survivors } },
  );
}

function loadEvals(root: string, slice: string): EvalResult[] {
  return listSpecimens(root, slice)
    .map((s) => evalResultPath(root, slice, s))
    .filter(existsSync)
    .map((p) => readJSON<EvalResult>(p));
}

function gate(args: Record<string, string>): void {
  const { root, slice } = args as { root: string; slice: string };
  const evals = loadEvals(root, slice);
  const { passers, eliminated } = evalGate(evals);
  // Emit the pairing schedule the command must drive with judge agents.
  print({ passers, eliminated, pairings: pairings(passers) });
}

function recordVotes(args: Record<string, string>): void {
  const { root, slice } = args as { root: string; slice: string };
  const votes = readJSON<PairwiseVote[]>(args.votes!);
  const p = votesPath(root, slice);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, JSON.stringify(votes, null, 2) + "\n", "utf8");
  print({ recorded: votes.length });
}

async function selectCmd(args: Record<string, string>): Promise<void> {
  const { root, slice } = args as { root: string; slice: string };
  const evals = loadEvals(root, slice);
  const votes = existsSync(votesPath(root, slice)) ? readJSON<PairwiseVote[]>(votesPath(root, slice)) : [];
  const { judgment } = select(evals, votes);
  writeFileSync(judgmentPath(root, slice), JSON.stringify(judgment, null, 2) + "\n", "utf8");
  await writeDoc(root, join(sliceRel(slice), "tournament.md"), {
    frontmatter: {
      summary: `Tournament ${slice}: winner specimen-${judgment.winner ?? "none"}, ${judgment.ranking.length} passer(s).`,
    },
    body:
      `# Tournament — ${slice}\n\n- **winner:** ${judgment.winner ? "specimen-" + judgment.winner : "none"}\n` +
      `- **ranking:** ${judgment.ranking.join(" > ") || "—none—"}\n- **votes:** ${votes.length}\n\n` +
      `## GRPO advantages (whole group)\n` +
      judgment.advantages
        .map((a) => `- specimen-${a.specimen}: reward=${a.reward.toFixed(3)} advantage=${a.advantage.toFixed(3)}`)
        .join("\n") +
      "\n",
  });
  let state = await loadState(root, slice);
  state = appendEvent(state, "judgment", "winner", `winner=${judgment.winner}, ranking=[${judgment.ranking.join(",")}]`);
  await saveState(root, state);
  print({ winner: judgment.winner, ranking: judgment.ranking, advantages: judgment.advantages });
}

async function finalize(args: Record<string, string>): Promise<void> {
  const { root, slice } = args as { root: string; slice: string };
  const evals = loadEvals(root, slice);
  const judgment = existsSync(judgmentPath(root, slice))
    ? readJSON<ReturnType<typeof select>["judgment"]>(judgmentPath(root, slice))
    : { ranking: [], winner: null, advantages: [], votes: [] };

  // Pressure log: every non-winning specimen is a negative exemplar (F9).
  const culled: CulledSpecimen[] = evals
    .filter((e) => e.specimen !== judgment.winner)
    .map((e) => ({
      specimen: e.specimen,
      reason: e.hackFindings.length
        ? `hack: ${e.hackFindings.map((f) => f.pattern).join(",")}`
        : `gate testPassRate=${e.testPassRate.toFixed(2)}`,
      diff: Object.entries(readSpecimenFiles(root, slice, e.specimen))
        .map(([p, c]) => `+++ ${p}\n${c}`)
        .join("\n"),
      critique: "",
      hackFindings: e.hackFindings,
    }));
  await writeDoc(root, join("50-pressure", slice, "pressure.md"), {
    frontmatter: { summary: `Pressure log ${slice}: ${culled.length} culled.` },
    body: renderPressureLog({ sliceId: slice, culled }),
  });
  if (judgment.advantages.length > 0) {
    await writeDoc(root, join("50-pressure", slice, "refinement.md"), {
      frontmatter: { summary: `PDR top-K refinement for ${slice}.` },
      body: refinementContext({ sliceId: slice, culled }, judgment.advantages),
    });
  }

  // Spec-diff (F13).
  const intent = readJSON<Spec>(args.intent!);
  const asBuilt = readJSON<Spec>(args.asbuilt!);
  const sdiff = diffSpecs(intent, asBuilt);
  await writeDoc(root, join(sliceRel(slice), "spec-diff.md"), {
    frontmatter: {
      summary: `Spec diff ${slice}: ${sdiff.missing.length} missing, ${sdiff.added.length} added, ${sdiff.kept.length} kept.`,
    },
    body: renderSpecDiff(slice, sdiff),
  });

  let state = await loadState(root, slice);
  state = setPhaseStatus(state, "judgment", "done");
  await saveState(root, state);
  await writeDoc(root, join("90-audit", "journal.md"), {
    frontmatter: { summary: `Event journal for ${slice}: ${state.events.length} events.` },
    body:
      `# Journal — ${slice}\n\n` +
      state.events.map((e) => `${e.seq}. [${e.phase}] ${e.kind}: ${e.detail}`).join("\n") +
      "\n",
  });
  print({
    winner: judgment.winner,
    faithful: isFaithful(sdiff),
    specDiff: { missing: sdiff.missing.length, added: sdiff.added.length, kept: sdiff.kept.length },
    culled: culled.length,
  });
}

// ── project-level subcommands (the multi-slice driver) ──────────────────────

/** project-init: scaffold + write project manifest + fresh project state. */
async function projectInit(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const manifest = readJSON<ProjectManifest>(args.manifest!);
  manifest.schemaVersion = 1;
  manifest.slices = manifest.slices ?? [];
  await scaffold(root);
  await writeFile(projectManifestPath(root), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const state = freshProjectState(manifest.projectId);
  appendProjectEvent(state, "lifecycle", "project-init", `project ${manifest.projectId} created`);
  await saveProjectState(root, state);
  await writeDoc(root, join("00-intent", "project.md"), {
    frontmatter: { summary: manifest.summary || `Project ${manifest.name}.` },
    body:
      `# ${manifest.name}\n\n${manifest.summary}\n\n## Slices (DAG)\n` +
      (manifest.slices.length
        ? manifest.slices.map((s) => `- ${s.id} (${s.name}) deps: [${s.dependsOn.join(", ")}]`).join("\n")
        : "_none yet — added during slice-disaggregation_") +
      "\n",
  });
  print({ projectId: manifest.projectId, slices: manifest.slices.map((s) => s.id), phases: PROJECT_PHASES });
}

function isProjectPhase(p: string): p is ProjectPhase {
  return (PROJECT_PHASES as readonly string[]).includes(p);
}

/** project-phase: mark a project-level phase done + write a tier marker. */
async function projectPhase(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const phase = args.phase!;
  if (!isProjectPhase(phase)) {
    process.stderr.write(`unknown project phase: ${phase}\n`);
    process.exitCode = 1;
    return;
  }
  const state = await loadProjectState(root);
  state.phaseStatus[phase] = "done";
  appendProjectEvent(state, phase, "phase-done", `${phase} → done`);
  await saveProjectState(root, state);
  const tier = PROJECT_PHASE_TIER[phase];
  await writeDoc(root, join(tier, `${phase}.md`), {
    frontmatter: { summary: `Project phase ${phase} marked done.` },
    body: `# ${phase}\n\nCompleted at the project level. Artifacts live under \`${tier}/\`.\n`,
  });
  print({ phase, status: "done", tier });
}

/** project-write-intent: persist the elicited intent + done-predicates. */
async function projectWriteIntent(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const intent = readJSON<{
    problem?: string;
    users?: string;
    constraints?: string[];
    donePredicates?: { id: string; expr: string; kind: string }[];
    areas?: string[];
  }>(args.intent!);
  const preds = intent.donePredicates ?? [];
  await writeFile(stzPath(root, join("00-intent", "intent.json")), JSON.stringify(intent, null, 2) + "\n", "utf8");
  await writeDoc(root, join("00-intent", "intent.md"), {
    frontmatter: { summary: `Intent: ${preds.length} done-predicate(s); ${(intent.areas ?? []).length} area(s).` },
    body:
      `# Intent\n\n## Problem\n${intent.problem ?? ""}\n\n## Users\n${intent.users ?? ""}\n\n` +
      `## Constraints\n${(intent.constraints ?? []).map((c) => `- ${c}`).join("\n")}\n\n` +
      `## Done predicates (machine-checkable)\n${preds.map((p) => `- \`${p.expr}\` (${p.kind})`).join("\n")}\n`,
  });
  print({ predicates: preds.length, areas: (intent.areas ?? []).length });
}

/** project-record-area: durable per-area checkpoint during elicitation. */
async function projectRecordArea(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const phase = args.phase!;
  if (!isProjectPhase(phase)) {
    process.stderr.write(`unknown project phase: ${phase}\n`);
    process.exitCode = 1;
    return;
  }
  const state = await loadProjectState(root);
  appendProjectEvent(state, phase, "area-resolved", `${args.area}: ${args.resolution ?? ""}`);
  await saveProjectState(root, state);
  const resolved = state.events.filter((e) => e.phase === phase && e.kind === "area-resolved").map((e) => e.detail.split(":")[0]);
  print({ phase, area: args.area, recorded: true, resolved });
}

/** slice-add: append a slice to the DAG (permissive; validation in status). */
async function sliceAdd(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const id = args.id!;
  const entry: ProjectSliceEntry = {
    id,
    name: args.name ?? id,
    dependsOn: args.depends ? args.depends.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
  const manifest = readJSON<ProjectManifest>(projectManifestPath(root));
  manifest.slices = (manifest.slices ?? []).filter((s) => s.id !== id);
  manifest.slices.push(entry);
  await writeFile(projectManifestPath(root), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const state = await loadProjectState(root);
  if (!(id in state.sliceStatus)) state.sliceStatus[id] = "pending";
  appendProjectEvent(state, "slice", "slice-added", `${id} deps=[${entry.dependsOn.join(",")}]`);
  await saveProjectState(root, state);
  print({ id, dependsOn: entry.dependsOn, totalSlices: manifest.slices.length });
}

/** project-seed-slices: write per-slice manifests + seed early phases done. */
async function projectSeedSlices(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const dag = readJSON<SliceManifest[]>(args.dag!);
  const created: string[] = [];
  for (const m of dag) {
    m.judge = m.judge ?? { votesPerPair: 8 };
    m.dependsOn = m.dependsOn ?? [];
    m.donePredicates = m.donePredicates ?? [];
    mkdirSync(stzPath(root, sliceRel(m.id)), { recursive: true });
    await writeFile(stzPath(root, join(sliceRel(m.id), "manifest.json")), JSON.stringify(m, null, 2) + "\n", "utf8");
    await writeDoc(root, join(sliceRel(m.id), "manifest.md"), {
      frontmatter: { summary: m.summary, contract: m.contract, complexity: m.complexity },
      body: `# ${m.id} — ${m.name}\n\n## Contract\n\n\`${m.contract}\`\n\n## Depends on\n${m.dependsOn.join(", ") || "—"}\n`,
    });
    // Seed per-slice state: the four early phases were settled at the project
    // level, so they start `done`; the tournament half remains for /stz:run.
    let st = freshState(m.id, m.complexity ?? 1);
    for (const p of ["elicitation", "research", "ground-truth-validation", "standards"] as const) {
      st = setPhaseStatus(st, p, "done");
    }
    await saveState(root, st);
    created.push(m.id);
    // Also register in the project DAG.
    await sliceAddInternal(root, { id: m.id, name: m.name, dependsOn: m.dependsOn });
  }
  print({ created, seeded: true });
}

async function sliceAddInternal(root: string, entry: ProjectSliceEntry): Promise<void> {
  const manifest = readJSON<ProjectManifest>(projectManifestPath(root));
  manifest.slices = (manifest.slices ?? []).filter((s) => s.id !== entry.id);
  manifest.slices.push(entry);
  await writeFile(projectManifestPath(root), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const state = await loadProjectState(root);
  if (!(entry.id in state.sliceStatus)) state.sliceStatus[entry.id] = "pending";
  await saveProjectState(root, state);
}

/** project-status: READ-ONLY DAG + phase status + next runnable slice. */
async function projectStatus(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const manifest = readJSON<ProjectManifest>(projectManifestPath(root));
  const slices = manifest.slices ?? [];
  const state = await loadProjectState(root);
  const topo = topoOrder(slices);
  if (!topo.ok) {
    print(topo.error === "cycle" ? { error: "cycle", cycle: topo.cycle } : { error: "dangling", from: topo.from, missing: topo.missing });
    process.exitCode = 1;
    return;
  }
  const sliceStatus: Record<string, string> = {};
  for (const id of topo.order) sliceStatus[id] = await deriveSliceStatus(root, id);
  const runnable = await nextRunnable(slices, (id) => deriveSliceStatus(root, id));
  const slicingDone = state.phaseStatus["slice-disaggregation"] === "done";
  print({
    projectPhases: state.phaseStatus,
    order: topo.order,
    sliceStatus,
    frontier: slicingDone ? runnable.frontier : [],
    next: slicingDone ? runnable.next : null,
    blocked: !slicingDone,
    note: slicingDone ? undefined : "slice execution gated until /stz:slice completes slice-disaggregation",
  });
}

/** summary: aggregate every slice's outcome into a completion report. */
async function summaryCmd(args: Record<string, string>): Promise<void> {
  const root = args.root!;
  const manifest = readJSON<ProjectManifest>(projectManifestPath(root));
  const slices = manifest.slices ?? [];
  const rows: { id: string; winner: string | null; faithful: boolean | null; culled: number | null; status: string }[] = [];
  let done = 0, halted = 0, pending = 0;
  for (const s of slices) {
    const status = await deriveSliceStatus(root, s.id);
    if (status === "done") done++; else if (status === "halted") halted++; else pending++;
    let winner: string | null = null;
    const jPath = judgmentPath(root, s.id);
    if (existsSync(jPath)) winner = (readJSON<{ winner: string | null }>(jPath)).winner;
    let faithful: boolean | null = null;
    const sdPath = stzPath(root, join(sliceRel(s.id), "spec-diff.md"));
    if (existsSync(sdPath)) {
      const sd = await readDoc(root, join(sliceRel(s.id), "spec-diff.md"));
      faithful = /0 missing/.test(String(sd.frontmatter.summary ?? ""));
    }
    let culled: number | null = null;
    const pPath = stzPath(root, join("50-pressure", s.id, "pressure.md"));
    if (existsSync(pPath)) {
      const pd = await readDoc(root, join("50-pressure", s.id, "pressure.md"));
      const m = String(pd.frontmatter.summary ?? "").match(/(\d+) culled/);
      culled = m ? Number(m[1]) : null;
    }
    rows.push({ id: s.id, winner, faithful, culled, status });
  }
  await writeDoc(root, join("90-audit", "completion-report.md"), {
    frontmatter: { summary: `Completion: ${done} done, ${halted} halted, ${pending} pending of ${slices.length} slice(s).` },
    body:
      `# Completion report — ${manifest.name}\n\n` +
      `| slice | status | winner | faithful | culled |\n|---|---|---|---|---|\n` +
      rows.map((r) => `| ${r.id} | ${r.status} | ${r.winner ?? "—"} | ${r.faithful ?? "—"} | ${r.culled ?? "—"} |`).join("\n") +
      "\n",
  });
  print({ slices: rows, done, halted, pending });
}

export async function runBridge(argv: string[]): Promise<void> {
  const [sub, ...rest] = argv;
  const args = parseArgs(rest);
  switch (sub) {
    case "begin": await begin(args); break;
    case "record-eval": recordEval(args); break;
    case "eval": evalCmd(args); break;
    case "gate": gate(args); break;
    case "record-votes": recordVotes(args); break;
    case "select": await selectCmd(args); break;
    case "finalize": await finalize(args); break;
    case "project-init": await projectInit(args); break;
    case "project-phase": await projectPhase(args); break;
    case "project-write-intent": await projectWriteIntent(args); break;
    case "project-record-area": await projectRecordArea(args); break;
    case "slice-add": await sliceAdd(args); break;
    case "project-seed-slices": await projectSeedSlices(args); break;
    case "project-status": await projectStatus(args); break;
    case "summary": await summaryCmd(args); break;
    default:
      process.stderr.write(`unknown bridge subcommand: ${sub}\n`);
      process.exitCode = 1;
  }
}
