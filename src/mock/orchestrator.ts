/**
 * The per-slice orchestrator (§3 Pipeline Topology). Sequences the 8 phases
 * (F1), checkpoints `state.json` at every phase boundary (F16), tracks cost
 * through the ledger middleware (N5/N6), runs the adversarial tournament (F6),
 * applies hybrid selection (F7) + GRPO (F8), persists the pressure log (F9),
 * drives bounded escalation (F14), and materializes the audit artifacts (F13).
 *
 * The model layer is injected (ModelLayer), so this runs identically against
 * the deterministic mock and a future live Claude Code / Codex implementation.
 *
 * STUBBED vs the full design (logged via the `log` sink, surfaced in ROADMAP):
 *   - git worktrees per specimen → prototypes/specimen-X/ directories instead.
 *   - per-worktree ephemeral observability stacks → not spun up.
 *   - live Python eval drivers / mutation / PBT → mock EvalRunner.
 *   - local embeddings / cross-slice RAG → not built.
 */
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import type {
  Judgment,
  Phase,
  SliceManifest,
  SliceState,
  SpecimenId,
} from "../types.js";
import { PHASES } from "../types.js";
import { CostTracker } from "../cost-tracker.js";
import {
  freshState,
  saveState,
  setPhaseStatus,
  appendEvent,
} from "../state.js";
import { allocateBudget, wouldExceed } from "../budget.js";
import { scaffold, writeDoc, stzPath } from "../taxonomy.js";
import { select, pairings, evalReward } from "../selection.js";
import { votePair, type ModelLayer, type SpecimenOutput } from "./interfaces.js";
import {
  onNoPassers,
  initialEscalation,
  type EscalationState,
} from "../escalation.js";
import {
  renderPressureLog,
  refinementContext,
  type CulledSpecimen,
  type PressureLog,
} from "../pressure.js";
import { diffSpecs, renderSpecDiff, isFaithful, type Spec } from "../specdiff.js";

export interface OrchestratorOptions {
  root: string;
  manifest: SliceManifest;
  model: ModelLayer & { nextRound?: () => void };
  /** Specimen count N (F6, default 4). */
  n?: number;
  poolRemaining?: number;
  /** Progress sink (defaults to no-op; CLI passes console.log). */
  log?: (msg: string) => void;
}

export interface SliceResult {
  sliceId: string;
  state: SliceState;
  judgment: Judgment | null;
  winner: SpecimenId | null;
  halted: boolean;
  faithful: boolean;
  /** Relative paths of materialized audit artifacts under .stz/. */
  artifacts: string[];
  rounds: number;
}

/** Synthetic per-call token charge so the ledger/budget are exercised (N5). */
const TOKENS_PER_CALL = { prompt: 1200, completion: 800 };

/** Raised when a slice would breach its hard token cap (N5/R3 kill-switch). */
export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export async function runSlice(opts: OrchestratorOptions): Promise<SliceResult> {
  const { root, manifest, model } = opts;
  const n = opts.n ?? 4;
  const log = opts.log ?? (() => {});
  const tracker = new CostTracker();
  const sliceDir = join("40-slices", manifest.id);
  const artifacts: string[] = [];

  await scaffold(root);

  // Elicitation drives the budget, so allocate after we know complexity.
  let state = freshState(manifest.id, manifest.complexity, opts.poolRemaining ?? 5_000_000);

  const charge = (phase: Phase, role: Parameters<CostTracker["record"]>[0]["role"]) => {
    const cost = TOKENS_PER_CALL.prompt + TOKENS_PER_CALL.completion;
    // N5 hard per-slice token cap / R3 kill-switch: refuse to proceed past the
    // cap rather than silently overrunning. The cap is enforced here, the one
    // place every model call is metered.
    if (wouldExceed(state.budget, cost)) {
      throw new BudgetExceededError(
        `${manifest.id}: token cap ${state.budget.tokenCap} would be exceeded ` +
          `(spent ${state.budget.tokensSpent} + ${cost} in ${phase}/${role}).`,
      );
    }
    const rec = tracker.record({
      id: `${manifest.id}-${role}-${tracker.count()}`,
      phase,
      role,
      model: "mock",
      temperature: 0,
      seed: 0,
      promptTokens: TOKENS_PER_CALL.prompt,
      completionTokens: TOKENS_PER_CALL.completion,
    });
    state.budget.tokensSpent += rec.promptTokens + rec.completionTokens;
    state.callCount = tracker.count();
  };

  const checkpoint = async () => {
    await saveState(root, state);
  };

  // ── Phase 1: elicitation (F2) ───────────────────────────────────────────
  state = setPhaseStatus(state, "elicitation", "running");
  await checkpoint();
  const elicited = await model.elicitor.elicit(manifest.contract);
  charge("elicitation", "elicitor");
  // Re-derive budget from the elicited complexity (F15).
  state.budget = {
    ...allocateBudget(elicited.complexity, opts.poolRemaining ?? 5_000_000),
    tokensSpent: state.budget.tokensSpent,
  };
  if (elicited.donePredicates.length === 0) {
    throw new Error("F2 violation: elicitation produced no machine-checkable predicates");
  }
  await writeDoc(root, join("00-intent", "questionnaire.md"), {
    frontmatter: {
      summary: `Elicitation for ${manifest.id}: ${elicited.donePredicates.length} done-predicates, complexity ${elicited.complexity}.`,
      complexity: elicited.complexity,
    },
    body:
      `# Elicitation — ${manifest.id}\n\n## Questionnaire\n` +
      Object.entries(elicited.questionnaire).map(([k, v]) => `- **${k}:** ${v}`).join("\n") +
      `\n\n## Done predicates (machine-checkable)\n` +
      elicited.donePredicates.map((d) => `- \`${d.expr}\` (${d.kind})`).join("\n") +
      "\n",
  });
  artifacts.push(`${sliceDir}/../../00-intent/questionnaire.md`);
  state = setPhaseStatus(state, "elicitation", "done");
  await checkpoint();
  log(`[${manifest.id}] elicitation: ${elicited.donePredicates.length} predicates, complexity ${elicited.complexity}`);

  // ── Phase 2: research (stub, F3 routes documented) ──────────────────────
  state = setPhaseStatus(state, "research", "running");
  await checkpoint();
  charge("research", "researcher");
  await writeDoc(root, join("10-research", "validated.md"), {
    frontmatter: { summary: `Research for ${manifest.id} (stubbed: tiered ground-truth validation routes documented, not executed).` },
    body: "# Validated research\n\n_Stub: live research + 3-route ground-truth validation (F3) deferred to live model layer._\n",
  });
  state = setPhaseStatus(state, "research", "done");
  state = setPhaseStatus(state, "ground-truth-validation", "done");
  await checkpoint();

  // ── Phase 4: standards (stub) ───────────────────────────────────────────
  state = setPhaseStatus(state, "standards", "running");
  await checkpoint();
  await writeDoc(root, join("20-standards", "conventions.md"), {
    frontmatter: { summary: `Conventions v1 for ${manifest.id}.`, version: 1 },
    body: "# Conventions (v1)\n\n- Slices are contract-bounded.\n- No secrets in the markdown tree.\n",
  });
  state = setPhaseStatus(state, "standards", "done");
  await checkpoint();

  // ── Phase 5: test-authoring (F10/L1 frozen, sealed) ─────────────────────
  state = setPhaseStatus(state, "test-authoring", "running");
  await checkpoint();
  const { sealed, rubric } = await model.testAuthor.authorTests(manifest);
  charge("test-authoring", "test-author");
  for (const [path, contents] of Object.entries(sealed)) {
    await writeDoc(root, join("30-tests", path), {
      frontmatter: { summary: `Sealed held-out test ${path} (read-only; judge-loaded only).`, sealed: true },
      body: contents,
    });
  }
  await writeDoc(root, join("30-tests", "rubric.md"), {
    frontmatter: { summary: "Judge ranking rubric." },
    body: `# Rubric\n\n${rubric}\n`,
  });
  artifacts.push("30-tests/held-out");
  state = setPhaseStatus(state, "test-authoring", "done");
  await checkpoint();
  log(`[${manifest.id}] test-author: sealed ${Object.keys(sealed).length} held-out file(s)`);

  // ── Phase 6: planning (F5 intent spec) ──────────────────────────────────
  state = setPhaseStatus(state, "planning", "running");
  await checkpoint();
  let intent = await model.planner.intentSpec(manifest);
  charge("planning", "planner");
  await writeDoc(root, join(sliceDir, "plan.md"), {
    frontmatter: { summary: `Intent spec for ${manifest.id}: ${intent.claims.length} claims.` },
    body: `# Intent spec — ${manifest.id}\n\n${intent.claims.map((c) => `- ${c}`).join("\n")}\n`,
  });
  artifacts.push(`${sliceDir}/plan.md`);
  state = setPhaseStatus(state, "planning", "done");
  await checkpoint();

  // ── Phases 7+8: tournament + judgment with bounded escalation (F6/F7/F14) ─
  let esc: EscalationState = initialEscalation();
  let refinement: string | null = null;
  let judgment: Judgment | null = null;
  let winner: SpecimenId | null = null;
  let asBuilt: Spec | null = null;
  let rounds = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    rounds++;
    state = setPhaseStatus(state, "tournament", "running");
    state.escalation = esc.stage;
    state.retryCount = esc.retryCount;
    state.replanCount = esc.replanCount;
    await checkpoint();

    // Strategy diversification (R5) → spawn N specimens in parallel (F6).
    const strategies = await model.strategist.strategies(manifest, n);
    charge("tournament", "specimen");
    log(`[${manifest.id}] round ${rounds}: spawning ${n} specimens [${strategies.join(", ")}] (worktrees STUBBED → prototype dirs)`);

    const outputs: SpecimenOutput[] = [];
    for (const strat of strategies) {
      const out = await model.specimen.implement(manifest, strat, refinement);
      charge("tournament", "specimen");
      outputs.push(out);
      // Materialize into prototypes/specimen-X/ (worktree stand-in).
      const protoDir = stzPath(root, join(sliceDir, "prototypes", `specimen-${out.specimen}`));
      await mkdir(protoDir, { recursive: true });
      for (const [path, contents] of Object.entries(out.files)) {
        const full = join(protoDir, path);
        await mkdir(join(full, ".."), { recursive: true });
        await writeFile(full, contents, "utf8");
      }
    }

    // Eval gate: sealed suite + coverage + mutation + hack-pattern detect (F7/F10).
    const evals = [];
    for (const out of outputs) {
      const r = await model.evalRunner.evaluate(out, sealed);
      charge("tournament", "specimen");
      evals.push(r);
    }
    state = setPhaseStatus(state, "tournament", "done");
    state.activeSpecimens = evals.filter((e) => e.passedGate).map((e) => e.specimen);
    await checkpoint();

    // Judgment (F7 stage 2 + F8).
    state = setPhaseStatus(state, "judgment", "running");
    await checkpoint();
    const passers = evals.filter((e) => e.passedGate).map((e) => e.specimen);
    const outById = new Map(outputs.map((o) => [o.specimen, o]));

    if (passers.length === 0) {
      // No passers → consult the escalation FSM (F14). The orchestrator NEVER
      // loops on its own; the FSM alone decides whether another round is allowed.
      const culled = buildPressure(manifest.id, evals, outputs, []);
      await persistPressure(root, manifest.id, culled, []);
      artifacts.push(`50-pressure/${manifest.id}`);
      const { next, action } = onNoPassers(esc);
      esc = next;
      state.escalation = esc.stage;
      state = appendEvent(state, "judgment", `escalation-${action.type}`, action.note);
      await checkpoint();
      log(`[${manifest.id}] no passers → ${action.type}: ${action.note}`);

      if (action.type === "halt") {
        state.failureReport = structuredFailure(manifest, evals, rounds);
        await writeDoc(root, join(sliceDir, "failure-report.md"), {
          frontmatter: { summary: `Halt: no passers after ${rounds} round(s).` },
          body: state.failureReport,
        });
        artifacts.push(`${sliceDir}/failure-report.md`);
        state = setPhaseStatus(state, "judgment", "failed");
        await checkpoint();
        await writeAudit(root, manifest.id, tracker, state);
        return { sliceId: manifest.id, state, judgment: null, winner: null, halted: true, faithful: false, artifacts, rounds };
      }

      // retry or replan: build refinement context (F9), advance the model round.
      const advantages = select(evals, []).judgment.advantages;
      refinement = refinementContext({ sliceId: manifest.id, culled }, advantages);
      if (action.type === "replan") {
        // Re-enter planning with failure analysis (F14).
        state = setPhaseStatus(state, "planning", "running");
        intent = await model.planner.intentSpec(manifest);
        charge("planning", "planner");
        state = setPhaseStatus(state, "planning", "done");
      }
      model.nextRound?.();
      continue;
    }

    // We have passers → pairwise V votes (F7), then select.
    const pairs = pairings(passers);
    const votes = [];
    for (const [pa, pb] of pairs) {
      const oa = outById.get(pa)!;
      const ob = outById.get(pb)!;
      const v = await votePair(model.judge, oa, ob, sealed, manifest.judge.votesPerPair);
      for (let i = 0; i < manifest.judge.votesPerPair; i++) charge("judgment", "judge");
      votes.push(...v);
    }
    const sel = select(evals, votes);
    judgment = sel.judgment;
    winner = judgment.winner;
    state.activeSpecimens = passers;
    state = appendEvent(state, "judgment", "winner", `winner=${winner}, ranking=[${judgment.ranking.join(",")}]`);

    // Pressure log for culled + non-winning passers (F9).
    const culled = buildPressure(manifest.id, evals, outputs, judgment.ranking.slice(1).concat(sel.eliminated.map((e) => e.specimen)));
    await persistPressure(root, manifest.id, culled, judgment.advantages);
    artifacts.push(`50-pressure/${manifest.id}`);

    // Documenter → as-built spec → spec-diff (F13).
    const winnerOut = outById.get(winner!)!;
    asBuilt = await model.documenter.asBuilt(winnerOut);
    charge("judgment", "documenter");
    const sdiff = diffSpecs(intent, asBuilt);
    await writeDoc(root, join(sliceDir, "tournament.md"), {
      frontmatter: { summary: `Tournament ${manifest.id}: winner specimen-${winner}, ${passers.length}/${outputs.length} passed gate.` },
      body:
        `# Tournament — ${manifest.id}\n\n- **winner:** specimen-${winner}\n- **ranking:** ${judgment.ranking.join(" > ")}\n` +
        `- **votes:** ${votes.length} pairwise (V=${manifest.judge.votesPerPair}/pair)\n\n## GRPO advantages\n` +
        judgment.advantages.map((a) => `- specimen-${a.specimen}: reward=${a.reward.toFixed(3)} advantage=${a.advantage.toFixed(3)}`).join("\n") +
        "\n",
    });
    await writeDoc(root, join(sliceDir, "spec-diff.md"), {
      frontmatter: { summary: `Spec diff ${manifest.id}: ${sdiff.missing.length} missing, ${sdiff.added.length} added, ${sdiff.kept.length} kept.` },
      body: renderSpecDiff(manifest.id, sdiff),
    });
    artifacts.push(`${sliceDir}/tournament.md`, `${sliceDir}/spec-diff.md`);

    state = setPhaseStatus(state, "judgment", "done");
    await checkpoint();
    log(`[${manifest.id}] winner=specimen-${winner}; faithful=${isFaithful(sdiff)}`);
    await writeAudit(root, manifest.id, tracker, state);
    return {
      sliceId: manifest.id,
      state,
      judgment,
      winner,
      halted: false,
      faithful: isFaithful(sdiff),
      artifacts,
      rounds,
    };
  }
}

function buildPressure(
  _sliceId: string,
  evals: { specimen: SpecimenId; testPassRate: number; hackFindings: any[] }[],
  outputs: SpecimenOutput[],
  culledIds: SpecimenId[],
): CulledSpecimen[] {
  const wanted = culledIds.length > 0
    ? new Set(culledIds)
    : new Set(evals.map((e) => e.specimen)); // all, when none passed
  const outById = new Map(outputs.map((o) => [o.specimen, o]));
  return evals
    .filter((e) => wanted.has(e.specimen))
    .map((e) => {
      const out = outById.get(e.specimen);
      return {
        specimen: e.specimen,
        reason: e.hackFindings.length
          ? `hack: ${e.hackFindings.map((f) => f.pattern).join(",")}`
          : `gate testPassRate=${e.testPassRate.toFixed(2)}`,
        diff: out ? Object.entries(out.files).map(([p, c]) => `+++ ${p}\n${c}`).join("\n") : "",
        critique: "",
        hackFindings: e.hackFindings,
      } as CulledSpecimen;
    });
}

async function persistPressure(
  root: string,
  sliceId: string,
  culled: CulledSpecimen[],
  advantages: Judgment["advantages"],
): Promise<void> {
  const log: PressureLog = { sliceId, culled };
  await writeDoc(root, join("50-pressure", sliceId, "pressure.md"), {
    frontmatter: { summary: `Pressure log ${sliceId}: ${culled.length} culled specimen(s).` },
    body: renderPressureLog(log),
  });
  if (advantages.length > 0) {
    await writeDoc(root, join("50-pressure", sliceId, "refinement.md"), {
      frontmatter: { summary: `PDR top-K refinement context for ${sliceId}.` },
      body: refinementContext(log, advantages),
    });
  }
}

async function writeAudit(
  root: string,
  sliceId: string,
  tracker: CostTracker,
  state: SliceState,
): Promise<void> {
  const callsPath = stzPath(root, join("90-audit", "calls", `${sliceId}.jsonl`));
  await mkdir(join(callsPath, ".."), { recursive: true });
  await writeFile(callsPath, tracker.toJSONL() + "\n", "utf8");
  await writeDoc(root, join("90-audit", "cost.md"), {
    frontmatter: { summary: `Cost for ${sliceId}: ${tracker.totalTokens()} tokens over ${tracker.count()} calls.` },
    body:
      `# Cost — ${sliceId}\n\n- **total tokens:** ${tracker.totalTokens()}\n- **calls:** ${tracker.count()}\n` +
      `- **budget cap:** ${state.budget.tokenCap}\n- **within cap:** ${state.budget.tokensSpent <= state.budget.tokenCap}\n`,
  });
  await writeDoc(root, join("90-audit", "journal.md"), {
    frontmatter: { summary: `Replayable event journal for ${sliceId}: ${state.events.length} events.` },
    body:
      `# Journal — ${sliceId}\n\n` +
      state.events.map((e) => `${e.seq}. [${e.phase}] ${e.kind}: ${e.detail}`).join("\n") +
      "\n",
  });
}

function structuredFailure(
  manifest: SliceManifest,
  evals: { specimen: SpecimenId; testPassRate: number; hackFindings: any[] }[],
  rounds: number,
): string {
  return [
    `# Structured failure report — ${manifest.id}`,
    "",
    `Halted after ${rounds} round(s): no specimen passed the sealed eval gate.`,
    "",
    "## Per-specimen outcome (final round)",
    ...evals.map(
      (e) =>
        `- specimen-${e.specimen}: testPassRate=${e.testPassRate.toFixed(2)}, ` +
        `hacks=[${e.hackFindings.map((f) => f.pattern).join(",") || "none"}]`,
    ),
    "",
    "## Escalation budget",
    "- GRPO retry: exhausted (1/1)",
    "- replan: exhausted (1/1)",
    "",
    "Recommend human review of the contract and sealed suite difficulty.",
  ].join("\n");
}

export { PHASES };
