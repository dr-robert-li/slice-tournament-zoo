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
import { join } from "node:path";
import type { EvalResult, PairwiseVote, SliceManifest } from "./types.js";
import { scaffold, writeDoc, stzPath } from "./taxonomy.js";
import { freshState, saveState, loadState, setPhaseStatus, appendEvent } from "./state.js";
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
    default:
      process.stderr.write(`unknown bridge subcommand: ${sub}\n`);
      process.exitCode = 1;
  }
}
