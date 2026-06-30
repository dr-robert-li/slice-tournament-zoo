# STZ Roadmap

A living record of what STZ set out to be, what is **built today**, what is **not
yet built**, and where the project is **going next**. It is updated every release
cycle: shipped features move from *Planned* into *What was built*, and new
direction lands in *Planned*. (This document was formerly `AS-BUILT.md`; it now
carries the forward roadmap as well as the as-built record.)

## Original intent

An agentic-coding harness that takes a request from elicitation through
implementation by running competing agents and keeping an auditable trail.

- Break a project into contract-bounded vertical slices that compose through a
  dependency DAG.
- Implement each slice adversarially: N independent "specimen" agents solve the
  same contract in parallel.
- Pick survivors by a two-stage selection: an eval-gate against a frozen, sealed
  test suite the implementers never see, then a pairwise LLM judge.
- Resist reward hacking in layers: a frozen test author, a sealed held-out
  suite, a trace-based hack-pattern detector, and inoculation prompting.
- Settle intent, research, conventions, and test strategy once per project,
  before any code is written.
- Leave a markdown audit trail a human can replay after the fact.
- Run inside Claude Code, spawning the agents as in-session subagents.

## What was built

**Deterministic spine (TypeScript, fully tested).** The exact, replayable core
that every decision flows through:

- the `.stz/` markdown taxonomy with YAML frontmatter and summary-field
  progressive disclosure;
- per-slice `state.json` checkpoint and crash recovery;
- GRPO group-relative advantage, computed over the whole specimen group;
- two-stage selection (eval-gate elimination, then pairwise win-count ranking);
- the hack-pattern detector (test-skip, assertion mutation, network-bypass,
  fixture-keyed branching, hardcoded sentinels) with remediation strings;
- the bounded escalation state machine (one retry, then one replan, then halt);
- the complexity-to-budget allocator with an enforced per-slice token cap;
- the cost and call ledger;
- the pressure log with PDR top-K refinement;
- the structural intent-vs-as-built spec-diff;
- a real eval runner: executed test pass rate, V8 coverage, and source-mutation
  survival, with no test-library dependency.

**In-session harness.** STZ runs inside a Claude Code session. The orchestrator
is the command-driven agent; the `stz bridge` CLI owns every deterministic
decision (JSON in, JSON out, over the `.stz/` tree). On top of the spine:

- the project DAG driver (`src/project.ts`): manifest, project state,
  topological ordering, and per-slice status derived from each slice's own state;
- the bridge subcommands for a single slice (begin, eval, gate, record-votes,
  select, finalize), the sealed-suite integrity set (seal, seal-verify,
  seal-crosscheck, seal-amend), the cross-slice merge integrity set
  (merge-validate, merge-compat-propose/approve/retire/list), and the project
  (project-init, project-phase, project-write-intent, project-record-area,
  project-set-config, project-dark-factory, project-config, slice-add,
  project-seed-slices, project-status, summary);
- the full command surface: `/stz:new`, `/stz:research`, `/stz:validate`,
  `/stz:standards`, `/stz:tests`, `/stz:slice`, `/stz:merge`, `/stz:summary`,
  `/stz:pipeline`, and `/stz:run`;
- eleven subagents: the per-slice specimen, judge, test-author,
  cross-reference, documenter and the project-level researcher, validator,
  conventions, test-planner, slicer, summarizer;
- packaging as a Claude Code plugin with a SessionStart hook, and an npm CLI
  (`npx stz init` / `stz bridge …`).

**Mock testing harness (`src/mock/`).** A self-contained, no-network demo that
drives the whole pipeline against a deterministic fake model. It is a testing
aid, not the production path, and the production spine does not depend on it.

**Quality gates.** 131 deterministic tests plus a typecheck, run in CI on Node 20
and 22, with a `prepublishOnly` (typecheck + test) guard before any npm publish.

## Resultant features

- **Cheaters lose even when they pass.** The sealed suite plus the hack-detector
  disqualify a specimen that games the grader. Demonstrated live: a
  network-bypass specimen passed all 304 sealed checks for a `clamp` slice and
  was still culled at the gate before any judge saw it
  (`examples/clamp-tournament/`).
- **The sealed suite catches incorrect code, not just gamed code (0.7.2).** The
  `stz-test-author` guide now owns the *permissive-suite* class — a suite that
  passes a spec-violating specimen because it only checks valid inputs — by
  mandating contract-driven rejection cases, discriminating inputs, a
  property-based generator over the negative space, and a "stay within the
  contract" guard so it does not fail a correct implementation of a spec-silent
  reading. Validated non-regressive + over-strictness-avoiding on two dogfood
  pilots (`experiments/`); full guide-class write-up in
  `docs/development/sealed-suite.md`.
- **Meaningful selection signal.** With real coverage and mutation feeding the
  reward, GRPO advantage is non-flat: the winner is both judge-preferred and
  highest-advantage on the same run.
- **No runaway loops.** The escalation ceiling (retry, replan, halt) is proven to
  hold; the per-slice token cap throws rather than overspending. The same FSM now
  drives the real command path: `/stz:run` calls `stz bridge escalate` on a
  no-passers gate, which advances the retry→replan→halt state over `state.json`
  and writes the PDR refinement the next round consumes — the loop is no longer
  mock-only.
- **A replayable audit trail.** Every run materializes intent, research,
  conventions, test strategy, per-slice tournaments, pressure logs, spec-diffs,
  and a completion summary under `.stz/`, reconstructible from the tree plus
  state.
- **A full interactive pipeline.** A get-shit-done-style command-per-phase flow
  with elicitation Q&A, approval gates, a DAG co-design step, a dashboard, and
  `--auto` chaining. The front phases were run live end to end for a `slugify`
  project (`examples/full-pipeline/`).
- **A run config set once and obeyed everywhere (0.3.0).** `/stz:new` batches its
  questions per area and captures slicing granularity, specimen fan-out N (2–16),
  a per-role model map (planning/research/execution/testing/validation/judging,
  with suggested combos plus free-form "Other"), and a strictness bar
  (coverage/mutation/conventions). It persists as `00-intent/run-config.json` via
  `stz bridge project-set-config` (validated, clamped, defaults for anything
  unset) and rides on every `project-status` read, so the slicer, `/stz:run`'s N,
  each subagent's `model`, and `/stz:standards` + `/stz:tests` all consume it.
- **Dark-factory mode (0.4.0).** An opt-in fully autonomous run: once the F2
  predicate gate is satisfied, the orchestrator drives every phase → per-slice
  tournament → summary with no human in the loop, skipping the downstream approval
  gates. A dedicated `project-dark-factory` toggle (load-modify-save, never resets
  the rest of the config) flips it at any point; `project-status` hoists the flag.
- **Cross-family reference (0.5.0).** A second, independently-authored reference
  (different family/model) is run against the same sealed suite before sealing, to
  catch blind spots the single test-author reference shares with the suite.
  `seal-crosscheck` reports both-pass / divergent / both-fail and blocks on
  anything but both-pass; divergence is a guide-class signal for human
  adjudication, never an auto-rewrite.
- **Cross-slice merge integrity (0.5.2).** When slice winners are assembled, an
  earlier slice's sealed suite can legitimately fail because a later slice
  supersedes one of its invariants. `merge-validate` adjudicates *reported* suite
  results against an audited, signature-pinned compat manifest (propose ≠ approve;
  transitional debt retired by a `seal-amend`) instead of the orchestrator
  hand-waving the distinction.
- **Tabulated pipeline dashboard (0.5.4).** `project-status` emits a computed
  `progress` rollup and dashboard-ready slice rows (winner/faithful), so
  `/stz:pipeline` renders the same fixed phases/slices tables every tick rather
  than ad-hoc prose.
- **Installs as a plugin, and ships on npm.** The commands resolve the bundled
  bridge with no PATH setup; the CLI is also published to npm (`npx stz init`).
- **Update pathway (0.6.0 / F19).** `stz --version`, `stz update [--check]` (npm
  staleness; prints commands, never self-installs; also reports CLI-vs-plugin
  drift when a plugin manifest is reachable via `CLAUDE_PLUGIN_ROOT` or a repo
  checkout), `stz migrate` (additive, backed-up `.stz/` schema upgrade), and `stz
  bridge version`. Every `.stz/` tree carries a versioned `manifest.json`; a
  single `src/version.ts` seam sources the version from `package.json` and a test
  guards against the three version manifests drifting apart.
- **Real escalation path wired (0.7.0).** `stz bridge escalate` is the
  deterministic owner of bounded cross-round failure handling. `/stz:run` calls it
  on a no-passers gate; it advances the retry→replan→halt FSM over `state.json`,
  writes the PDR refinement the next round consumes, and on halt writes
  `failure-report.md`. The escalation loop now lives in the real command path, not
  only the mock.

## Not yet built (current gaps)

- **Cross-family *specimens and judge*** (OpenAI / Codex / Gemini) are not wired;
  the seam accepts any subagent, but only Claude Code subagents are connected.
  (Distinct from the **cross-family *reference*** for the sealed suite, which *is*
  built — see 0.5.0 above: the second reference can be authored by a different
  family today.)
- **Python eval drivers** (Hypothesis, mutmut, Stryker) are not used. Coverage and
  mutation are executed in JavaScript via V8 and source mutators.
- **Per-specimen git worktrees and observability stacks** are not built; distinct
  `prototypes/specimen-X/` directories stand in for worktrees.
- **Cross-slice RAG / embeddings** are not built — no semantic lookup across the
  markdown tree. (The spec-diff's old literal over-flagging is fixed: claims now
  carry stable ids and the documenter adjudicates each intent claim by id, so
  reworded as-built claims match. `faithful` reflects real coverage, not wording.
  Fully semantic, id-free matching would still need embeddings.)
- **OS-level sealing** of the held-out suite (git read-only attributes plus a
  pre-commit hook) is not applied; only the prompts withhold it from implementers.
- **The bundled bridge runs the TypeScript CLI through `tsx`**, fetched by `npx`
  on first use, so a fresh environment needs Node 20+ and network for that first
  call. Shipping a prebuilt `dist/` to drop the runtime `tsx` dependency is a
  hardening follow-up.

## Intent vs as-built (the diff)

- **Delivered as intended:** the deterministic spine, the in-session adversarial
  tournament, the full project pipeline with sealed tests and layered
  anti-reward-hacking, the replayable audit trail, and an installable plugin.
- **Deferred and documented (not missing by accident):** cross-family specimens
  and judge, Python eval libraries, worktrees and observability, cross-slice RAG,
  OS-level sealing, and the `dist/` build.
- **Built beyond the original plan:** the `stz bridge` JSON contract, a
  dependency-free real eval runner (V8 coverage plus source mutation), the
  two-level project DAG driver, the persisted run config (granularity, fan-out,
  per-role model map, strictness) consumed across the pipeline, dark-factory mode
  (autonomous end-to-end), the cross-family reference + `seal-crosscheck` against
  the sealed suite, cross-slice merge integrity (`merge-validate` + the audited
  supersession-compat manifest), the tabulated pipeline dashboard, the
  deterministic mock harness, the two worked example runs, the CI pipeline, the
  npm CLI distribution, the sustainable update/migrate pathway (`stz update`,
  `stz migrate`, versioned `.stz/manifest.json`), and real escalation wired into
  the command path (`stz bridge escalate`).

## Planned (roadmap)

Direction for upcoming cycles. These are intent, not yet built; each moves into
*What was built* when it ships. Ordered roughly by dependency, not date.

### Post-merge exogenous grounding (door A) — pre-registered, gated on the 0.9.5 calibration gate

The survey's one open door is an exogenous correctness signal (α>0) fed each round; the only
genuinely exogenous SDLC signal is **delayed post-merge reality** (PR-acceptance + downstream
regression across later commits) — not CI/hidden-test pass, which is the sealed suite (door B).
`experiments/postmerge-grounding/PREREG.md` pre-registers the test on **real SWE repos** via the
existing swebench adapter, contamination-controlled by **blind per-instance sealed suites**, and
**gated through** the 0.9.5 `calibrationGate` (the post-merge signal is just another verifier and
must pass calibration before it may steer). Symmetric-error null; continuity over merge cycles is
the real test (plateau/decline is a valid, reportable result). **Scope:** a live
prod/canary/incident **telemetry plane is a v2 item, gated on this probe** returning a non-null,
non-degrading result — real-repo git history substitutes for it here; a null stops the line (no
plane is built). It would breach N9 (single-repo, local) and is not built in v1.

### Additional agentic-coding runtimes

Today STZ drives its specimens/judge/test-author as **Claude Code** in-session
subagents. The model seam already accepts any subagent, so the work is adapter +
command wiring per host, not a redesign. Targets:

- **OpenAI Codex CLI** — the prior-art harness STZ borrows from (AGENTS.md table
  of contents, per-worktree observability). Run specimens/judges as Codex agents;
  enables genuine **cross-family** tournaments and a cross-family quorum judge
  (closes the "cross-family specimens and judge" gap above).
- **Pi** — drive the pipeline from Pi as an alternate host.
- **OpenCode** — run STZ under the OpenCode agent runtime.

Each runtime needs: a bridge resolver entry (like the existing
`CLAUDE_PLUGIN_ROOT` fallback), a host-native way to spawn N parallel specimens
and collect pointers, and the per-role model map honored against that host's
model catalog. The deterministic bridge is unchanged — it is host-agnostic by
construction.

### A distinct STZ-native harness (BYO LLM)

Beyond riding inside an existing agent host, STZ should be able to run as its
**own harness** — a standalone runner that owns the spawn-and-collect loop and
talks to models directly, so the tournament is not bound to any one vendor's CLI.
Bring-your-own-LLM via:

- **A generic API provider** — any OpenAI-/Anthropic-compatible HTTP endpoint,
  model + base-URL + key supplied by the operator.
- **LiteLLM** — as the provider-routing layer, so one config reaches 100+
  hosted models behind a single API shape.
- **Local inference servers** — **vLLM** and **Ollama** for fully local,
  no-egress runs (matching N5/sustainability and the air-gapped use case).

This is the largest item: it needs a real spawn/concurrency layer (the worktrees
+ per-specimen observability stack currently stubbed), a provider abstraction
over the model seam, and budget/cost tracking against per-provider token pricing.
It also unlocks heterogeneous specimens (one vLLM-served model vs one hosted)
without depending on a third-party agent CLI.

### Supporting hardening (already noted as gaps)

Prerequisites or natural companions to the above: per-specimen **git worktrees +
ephemeral observability**, a prebuilt **`dist/`** to drop the runtime `tsx`
dependency, **OS-level sealing** of the held-out suite, Python eval drivers, and
cross-slice RAG/embeddings.

### Multi-round convergence: iterative selection-pressure → design-feedback loop (0.8.0) — ⛔ SHELVED, SUPERSEDED BY 0.9.0

> **STATUS (0.9.0): SHELVED — empirically ruled out, energy relocated to the harness altitude.**
> The per-slice convergence loop below was tested against its own pre-registered
> decision table on the recall-free synthetic substrate, budget-matched, twice:
> - **Sealed-steered arm** (`experiments/swebench-pilot/PILOT-RESULTS-BLIND.md`):
>   `iterate ≈ best-of-N` at matched budget — a loop that stops at "sealed = 1.0"
>   cannot cross a gradient the suite cannot see.
> - **Judge-beyond-suite arm** (`PILOT-RESULTS-JUDGE.md`): signal-matched,
>   `judge+iterate == hardened-suite+best-of-N` at the same truth ceiling; the
>   gradient the judge crosses (the `5abc` `parseInt` silent-truncation trap) is
>   **suite-expressible**, so a hardened suite + best-of-N reaches it at ~0
>   marginal cost while the loop paid ~74k judge tokens/round.
>
> **Verdict:** the lever is **selection-signal quality + suite sharpening**, NOT
> per-slice iteration. 0.8.0 is not built as specced. Its design ideas are
> **relocated** to the **0.9.0 harness-level RSI meta-loop** (next section), where
> the 2024–2026 literature (Darwin Gödel Machine, HarnessX, SIA) actually shows
> gains: `rewardDelta`/`convergenceRate` → variant-fitness deltas; `diversityFloor`
> → the variance-collapse guard (`src/diversity.ts`); `interfaceHash` → the
> harness-contract parity (`src/harness-hash.ts`); `RoundSnapshot` → `ArchiveEntry`;
> the ICRL pressure log → the cross-variant mining log. The prose below is kept as
> the design record of WHY the per-slice form was shelved.

#### Background and framing

STZ's existing tournament is a single-round adversarial selection: N specimens
are generated independently from the contract, scored, and the winner is
promoted. This is structurally equivalent to **best-of-N sampling** — a
well-understood strategy whose ceiling is bounded by the strategy space
accessible in a single generation pass.

The planned 0.8.0 architecture introduces a **multi-round convergence loop**:
after each round's winner is selected, a natural-language *pressure log*
summarising why losers failed is injected into the next round's generation
context. New specimens are generated independently (preserving diversity), but
informed by the accumulated strategic failure analysis of all prior rounds. The
loop runs until a convergence criterion is met or `maxRounds` is exhausted.

This is the **in-context analogue of GRPO** applied to software engineering:

| GRPO (training) | STZ 0.8.0 (SDLC) |
|---|---|
| Group of completions sampled from policy π | Round of N specimens generated from contract |
| Reward signal per completion | Sealed suite score per specimen |
| Group-relative advantage A_i = (r_i − μ) / σ | Specimen score minus round mean (already in `grpo.ts`) |
| Policy update via gradient step | Context update via pressure log (natural-language policy steering) |
| KL penalty to prevent policy collapse | Interface-hash constraint + independent specimen seeding |
| Convergence = policy stabilises | Convergence = inter-round reward delta < threshold for K rounds |

The critical distinction from training: the "policy update" is a readable
markdown pressure log in `.stz/50-pressure/`, not an opaque weight change. Every
"update" is auditable by a human engineer. The in-context policy shift persists
for the lifetime of the project (each project is an independent optimisation
trajectory) but does not generalise across projects — which is correct, since
each project has its own contract, invariants, and strategic context.

This also resolves a structural identity question: STZ is not purely
**spec-driven** (the sealed suite is a selection mechanism, not a specification
language) nor purely **test-driven** (implementations are not revising against
public test failures). The multi-round loop makes it more precise: **iterative
adversarial tournament with strategic memory**, an instance of **in-context
reinforcement learning (ICRL)** applied to code generation with a deterministic
reward function.

#### Architecture

**The loop:**

```
ROUND 0
  Generate N specimens (from contract only, independent seeds)
  Eval-gate → disqualify hackers and gate-failures
  GRPO group-relative advantage over survivors
  Pairwise judge → winner₀ selected
  Pressure log for round 0 written (strategic failure analysis, not raw test output)
  interfaceHash pinned to winner₀'s exported interface

ROUND R (R = 1..maxRounds-1)
  Generate N specimens (from contract + all prior pressure logs + winner_{R-1})
    — specimens may diverge from or improve on the prior winner; they are not revising it
  Eval-gate → disqualify
  GRPO advantage computed; convergenceRate checked against prior round
  If convergenceRate < convergenceThreshold for plateauRounds consecutive rounds → CONVERGED, halt
  Pairwise judge → winner_R candidate
  interfaceHash verified: if mismatch → winner_R disqualified, contract drift escalated to /stz:slice
  assembled-crate merge-validate: if fails → round rejected, merge defect surfaced
  If both pass: winner_R promoted, RoundSnapshot appended to state.json, proceed to R+1

FINAL
  winner_{last} is the slice winner
  Held-out adversarial suite fired once (never used mid-loop as convergence criterion)
```

**Key invariants:**
- The pressure log encodes *strategic failure analysis* (why an approach failed,
  what failure modes it hit), never raw test output. Raw test output is
  information the specimens are not permitted to see (sealed-suite integrity).
- Round-0 locks the interface boundary (`interfaceHash`). Subsequent rounds may
  only improve the implementation, never change exported types, function
  signatures, or observable side effects that downstream slices depend on.
- A winner whose reward regresses vs. the prior round is never promoted. In
  training, loss can temporarily spike and recover; in discrete selection there
  is no gradient descent to recover — so regression is a hard block.
- Multi-round convergence on slices with downstream dependents in the DAG
  requires assembled-crate `merge-validate` after each promotion (not just
  in-slice sealed-suite pass). This is not optional: a round winner that improves
  in isolation but breaks a downstream slice's invariants must be rejected.
- `maxRounds = 1` (default) reproduces existing single-round behaviour exactly.
  The feature is fully backward-compatible.

#### Merge logic for multi-round loops

The existing `merge.ts` `validateMerge` handles *cross-slice supersession*:
when slice-B's winner legitimately breaks slice-A's sealed suite because the
invariants evolved. This is unchanged.

Multi-round convergence introduces a second, distinct merge problem: each round's
winner replaces the prior round's winner for the *same slice*. The round-R winner
may be superior in isolation but:

1. Break downstream slices co-designed with the round-0 winner's interface
2. Reintroduce bugs the prior winner happened to avoid
3. Drift from the contract in ways the sealed suite does not catch

The resolution is a three-condition promotion gate enforced by the new
`round-promote` bridge command:

1. **Interface hash parity** — `interfaceHash` in `state.json` must match the
   candidate winner's exported interface. A mismatch means the round exposed a
   contract ambiguity; escalate to `/stz:slice` for re-planning, do not promote.
2. **Assembled-crate `merge-validate` pass** — run the full cross-slice merge
   validation (existing `merge.ts` logic) against the assembled crate with the
   candidate winner substituted for the prior round winner. Any unsanctioned
   failures block promotion.
3. **No reward regression** — candidate `topReward` must be ≥ prior round
   `topReward`. Regression is a hard block; the prior winner is retained.

Only if all three pass is the round winner promoted and a `RoundSnapshot`
appended to `state.json`.

The interface hash acts as the mechanical KL constraint: the "policy" (in-context
GRPO loop) is free to improve implementation strategy but cannot collapse the
interface boundary — analogous to GRPO's KL penalty preventing policy collapse
onto reward-maximising but degenerate outputs.

#### Convergence signal: the operator-visible loss curve

Without a visible convergence signal, `maxRounds` is a blind hard stop rather
than a tuning knob. The planned convergence metrics are derived from existing
`grpo.ts` primitives and stored in the per-round `RoundSnapshot`:

- **`rewardDelta`** (Δ_R): top reward this round minus top reward prior round.
  Null for round 0.
- **`convergenceRate`**: Δ_R divided by the prior round's group standard
  deviation (+ ε). Range approximately [0, 1] in practice. Null for round 0.
  When this trends toward 0, the in-context policy has exhausted its improvement
  capacity.
- **`groupStddev`**: standard deviation of the round's specimen group rewards.
  Collapsing stddev signals diversity death — all specimens have converged to the
  same strategy.

Halt condition: `convergenceRate < convergenceThreshold` for `plateauRounds`
consecutive rounds.

The `stz bridge round-status` command renders the full convergence curve as a
table (round, topReward, groupMean, groupStd, Δ, convergenceRate, status) so
the operator can inspect it without opening JSON. This is the training loss curve
equivalent for the SDLC context.

#### `RunConfig` additions (`00-intent/run-config.json`)

A new `convergence` key is added to `RunConfig` (types.ts). All fields have
defaults; existing configs without the key behave identically to today.

```typescript
export interface ConvergenceConfig {
  /** Hard ceiling on rounds per slice. Default: 1 (current single-round behaviour). */
  maxRounds: number;
  /** Halt when convergenceRate < this for plateauRounds consecutive rounds.
   *  Range [0,1]. Default: 0.05. */
  convergenceThreshold: number;
  /** Consecutive below-threshold rounds required to trigger halt. Default: 2. */
  plateauRounds: number;
  /** Feed pressure log into next round (ICRL loop). False = independent re-draws.
   *  Default: true. */
  feedPressureLog: boolean;
}
```

Suggested operator presets offered at `/stz:new` elicitation (Area F):

| Preset | `maxRounds` | `convergenceThreshold` | `plateauRounds` | `feedPressureLog` | Use when |
|---|---|---|---|---|---|
| **Single** (default) | 1 | — | — | — | Backward compat; simple slices |
| **Standard** | 3 | 0.05 | 2 | true | Most slices; balanced cost/quality |
| **Deep** | 5 | 0.03 | 2 | true | High-complexity or safety-critical slices |
| **Survey** | 4 | 0.05 | 1 | false | Diversity sampling; no learning signal |

#### `SliceState` additions (`state.json`)

```typescript
/** Immutable snapshot of one completed tournament round. */
export interface RoundSnapshot {
  round: number;                  // 0-based
  winnerSpecimen: SpecimenId;
  groupMeanReward: number;
  groupStddev: number;
  topReward: number;
  advantages: Advantage[];
  rewardDelta: number | null;     // null for round 0
  convergenceRate: number | null; // null for round 0
  interfaceHashMatch: boolean;
  tokenCost: { input: number; output: number };
  completedAt: string;            // ISO 8601
}
```

Two new optional fields on `SliceState`:
- `roundHistory?: RoundSnapshot[]` — the full convergence curve; append-only
- `currentRound?: number` — 0-based index of the active round

#### New bridge commands

- **`stz bridge round-promote`** — accepts a round winner candidate; verifies
  interface hash parity, runs `merge-validate` against the assembled crate,
  checks for reward regression; promotes only if all three pass; appends
  `RoundSnapshot` to `state.json`; archives prior winner alongside culled
  specimens in `50-pressure/`.
- **`stz bridge round-status`** — renders the convergence curve table for a
  given slice; JSON and human-readable table output modes.

Both commands follow the existing bridge contract: JSON in, JSON out, all
decisions made by the CLI rather than the orchestrator agent.

#### `/stz:new` elicitation additions (Area F)

A new batched question area added to `/stz:new` for convergence tuning:

```
Area F — Convergence tuning
  F1. How many rounds per slice? (1 = single-round default; 2–5 for complex slices)
  F2. Stop early when improvement stalls? (yes/no; default yes)
  F3. Convergence sensitivity: conservative (3 rounds) / standard (2) / aggressive (1)
  F4. Feed pressure log into next round? (yes = ICRL loop; no = independent re-draws)
```

#### What the operator can tune

| Signal | Interpretation | Response |
|---|---|---|
| `convergenceRate` drops fast (by round 2) | Shallow strategy space | Reduce `maxRounds`; save tokens |
| `convergenceRate` stays high through round 4 | Rich strategy space | Increase `maxRounds` |
| `groupStddev` collapses early | Diversity death; pressure log over-constraining | Set `feedPressureLog: false` |
| `rewardDelta` is negative | Round winner regressed | Hard block; prior winner retained |
| `interfaceHashMatch: false` | Contract ambiguous; implementations diverged on interface | Escalate to `/stz:slice` for re-planning |

#### Token budget note

Multi-round loops multiply token cost non-linearly: R rounds × N specimens × judge
calls ≈ R × (N × generation + O(N²) judge). With R=3, N=4, approximately 3–5×
the cost of a single-round run. The `ConvergenceConfig` presets are calibrated
to converge before hitting `maxRounds` on typical tasks; the `budget` cap in
`SliceState` still applies and `round-promote` will hard-fail if the per-slice
token ceiling is exhausted before convergence.

#### Validation findings and hardening adjustments

The 0.8.0 architecture was reviewed against GRPO theory, ICRL literature, and
best-of-N sampling research prior to implementation. Three issues were confirmed
and the architecture adjusted accordingly. The findings below are the permanent
record of that validation; they are not aspirational — they are binding
constraints on the implementation.

**Finding 1 — The ICRL framing is correct; the GRPO analogy is structural only.**

The loop is a valid instance of in-context reinforcement learning: the agent
adapts by conditioning on accumulated context (pressure logs) rather than by
updating weights. This matches the ICRL definition precisely. The GRPO analogy
holds at the structural level (group sampling → group-relative reward → iterative
improvement), but not at the optimization-mechanics level — there is no gradient
step, no clipping ratio, and no PPO-style surrogate objective. The analogy is
useful for intuition and for borrowing the convergence vocabulary; it must not be
used to import GRPO's convergence *rate* guarantees, which depend on the gradient
machinery. STZ's convergence is empirical, not provably monotone.

Independent specimens each round (not single-lineage self-revision) is confirmed
as the correct scaffolding. Iterative single-lineage self-correction without
strong external anchoring is known to degrade; population-based iteration with a
shared external reward is the pattern that scales.

**Finding 2 — The convergence signal `convergenceRate = Δ_R / σ_{R-1}` has a
known failure mode under quantized rewards and must be stabilised.**

When rewards are quantized (discrete pass/fail test counts rather than continuous
scores), `σ_{R-1}` can be near zero even when the group has not converged — all
specimens in a round may happen to score identically on quantized buckets,
driving σ toward 0 and inflating `convergenceRate` spuriously. This risks
premature halt.

**Adjustment:** The convergence signal is revised to use a windowed absolute
delta rather than a σ-normalized ratio. The new primary convergence criterion is:

```
convergenceRate = Δ_R / (windowMeanDelta + ε)
```

where `windowMeanDelta` is the mean of `|Δ_R|` over the last `plateauRounds`
rounds (minimum 1, to avoid cold-start). This preserves the "relative
improvement" intuition while remaining stable when σ collapses. A floor of `ε =
0.001` prevents division by zero regardless of reward distribution.

The existing `groupStddev` field is retained in `RoundSnapshot` as a diversity
signal (see Finding 3), but it is no longer the denominator of `convergenceRate`.

The `ConvergenceConfig` interface is updated: `convergenceThreshold` now applies
to the windowed-delta form and its default of `0.05` is calibrated for
normalised reward in `[0, 1]`. Operators working with raw test counts should
scale accordingly; a note is added to the Area F elicitation.

**Finding 3 — Diversity collapse must be a hard guardrail, not an operator
interpretation.**

`groupStddev` collapsing toward zero is a signal that the pressure log is
over-constraining the generation distribution — all specimens are converging to
the same strategy. In the training analogy this is policy collapse; here it means
the loop has lost its ability to explore. Treating it as an operator-tuning hint
(as originally specified in the operator table above) is insufficient: an
operator running dark-factory mode has no opportunity to observe it.

**Adjustment:** A `diversityFloor` field is added to `ConvergenceConfig`:

```typescript
/** Minimum acceptable groupStddev. If groupStddev < diversityFloor for
 *  plateauRounds consecutive rounds, round-promote emits a DIVERSITY_COLLAPSE
 *  warning and sets feedPressureLog: false for the next round automatically.
 *  Default: 0.02 (normalised reward scale). Set to 0 to disable. */
diversityFloor: number;
```

When triggered, the automatic response is to suppress the pressure log for the
next round (equivalent to `feedPressureLog: false` for that round only), forcing
the specimens to generate from the contract alone. This breaks the echo-chamber
dynamic without halting the loop. The event is recorded in `RoundSnapshot` as
`diversityCollapseRecovery: boolean` and surfaced in `round-status` output.

The operator table is updated to reflect that `groupStddev` collapse now triggers
automatic intervention rather than a manual response.

**Finding 4 — Regression handling must use retry semantics, not silent retention
with possible halt.**

The original spec blocks promotion on regression (`rewardDelta < 0`) and retains
the prior winner. This is correct. However, a regressive round in a stochastic
system may be a sampling artifact — a bad draw of N specimens — rather than
evidence that the strategy space is exhausted. Silently retaining the prior
winner and continuing to the next round with no signal is ambiguous; under
`plateauRounds = 2`, two consecutive regressions could trigger premature
convergence halt when the loop was merely unlucky.

**Adjustment:** A regressive round triggers the existing **escalation state
machine** (one retry, then replan, then halt) rather than silent retention. The
retry re-draws N fresh specimens from the same round context (contract + same
pressure logs) without incrementing `currentRound`. The replan path triggers a
PDR refinement of the pressure log before the retry, on the same logic as the
single-round escalation path. This means regression handling is consistent with
the rest of the system's no-runaway-loops guarantee, and the escalation ceiling
still applies.

`round-promote` returns a structured verdict with `outcome: "REGRESSION"` (not
`"FAIL"`) when `rewardDelta < 0`, so the orchestrator can distinguish a bad draw
from a genuine failure. The halt path is reached only if retry and replan both
fail to produce a non-regressive winner — at which point the loop genuinely
cannot improve and the current winner is finalised.

**Finding 5 — Pressure log context growth must be bounded.**

Appending all prior pressure logs plus full winner code to every round's
generation context grows O(R) in token count and introduces two risks: (a) the
model's effective attention degrades on later rounds as earlier context is
discarded or diluted, and (b) the cost model underestimates actual spend on
deeper convergence runs.

**Adjustment:** The pressure log passed to round-R specimens is not a raw
concatenation of all prior logs. Instead, `round-promote` maintains a single
**rolling strategy document** (`50-pressure/active-strategy.md`) that is updated
(not appended) at each promotion: it contains the current winning approach, the
top-K failure modes across all rounds to date, and the most recent round's
specific lessons. Full per-round logs are archived to
`50-pressure/rounds/round-R.md` for the audit trail but are not included in
generation context after round R+1. This bounds the strategy context to a fixed
size regardless of `maxRounds`, eliminates re-correction of already-resolved
failure modes, and keeps the cost model accurate.

The `RoundSnapshot` records `activeStrategyTokens: number` (the token count of
the rolling document fed to that round) alongside the existing `tokenCost` field.

**Consolidated operator table (updated)**

| Signal | Interpretation | Response |
|---|---|---|
| `convergenceRate` drops fast (by round 2) | Shallow strategy space | Reduce `maxRounds`; save tokens |
| `convergenceRate` stays high through round 4 | Rich strategy space | Increase `maxRounds` |
| `groupStddev < diversityFloor` | Diversity collapse; auto-recovery triggered | `feedPressureLog` suppressed for next round automatically; operator notified via `round-status` |
| `rewardDelta < 0` | Regression; sampling artifact or exhausted space | Escalation retry fired automatically; escalation ceiling applies |
| `interfaceHashMatch: false` | Contract ambiguity exposed | Escalate to `/stz:slice` for re-planning; round not promoted |
| `activeStrategyTokens` growing | Rolling doc not summarising correctly | Inspect `50-pressure/active-strategy.md`; reduce manually if needed |
| Convergence halt before `maxRounds` | Loop converged early | Normal; prior winner retained as slice winner |

---

### Harness-level recursive self-improvement: the meta-loop (0.9.0) — ✅ BUILT

The relocation of the shelved 0.8.0 energy to the altitude where RSI actually
pays. The per-slice tournament is **untouched** (earned-correct: best-of-N + good
selection). 0.9.0 adds a separate, **opt-in, default-off** meta-loop that evolves
the **harness itself** — a DGM/HarnessX-style population of harness variants,
selected by GRPO group-relative advantage on **held-out, recall-free** pilot
fitness, with a six-gate promotion guard (0.9.5 adds calibrated-verifier gating).

#### Grounding (2024–2026 literature)

| System | Mechanism adopted | STZ realization |
|---|---|---|
| Darwin Gödel Machine (arXiv:2505.22954) | branching archive; parent-sampling P ∝ fitness/(1+children); held-out fitness replaces formal proof | `src/harness.ts` archive + `sampleParents` in `.stz/60-harness/` |
| HarnessX (arXiv:2606.14249) | typed substitution algebra; Critic validates on held-out before promotion | the harness **genome** (genes G1–G6) + `agents/stz-harness-critic.md` |
| GRPO + RC-GRPO/AceGRPO | group-relative advantage; variance-collapse guard; learnability-frontier curriculum | `src/grpo.ts` reused one altitude up + `src/diversity.ts` |
| Self-Play SWE-RL / SSR (arXiv:2512.18552) | bug-injector adversary vs the suite | `agents/stz-injector.md` + `injectMutants` (`src/eval-runner.ts`) |
| Judge-reliability crisis (arXiv:2606.10315 / 2505.19477) | one robust judge + consistency CI; **no naive ensembles** | `src/judge-reliability.ts` + `bridge judge-stress` |

#### The harness genome (mutable genes) — `HarnessGenome` in `src/types.ts`

`G1` test-author negative-case heuristic (the flagship) · `G2` suite battery
mutators · `G3` specimen strategy set · `G4` judge rubric · `G5` selection-weight
tuple · `G6` fan-out + votes. Frozen (never a gene): `seal.ts` integrity, the
`hack-detector` RULES floor, the `grpo.ts` formula, the escalation ceilings, the
truth suites, and the N6 contract. A variant mutating any frozen file is rejected
at the gate before its fitness is even read.

#### Flagship: automated suite sharpening

The pilots' lever made mechanical. `eval-runner.ts measureMutation` **is** the
objective verifier: a surviving mutant is a suite blind spot. A discovered
bug-class (e.g. `5abc`) becomes (a) a promoted `MutatorSpec` in the expanding
`60-harness/battery` and (b) a negative-case heuristic appended to
`stz-test-author.md` — promoted only when TWICE-verified (`harness-mine`: the
mutator **survives** the incumbent suite ✓ AND **is killed** by suites authored
with the new heuristic ✓). Caught once at ~0 marginal/slice instead of re-derived
per slice — the entire redirect.

#### New bridge commands (deterministic spine; the bridge owns all compute, N6)

`inject` (blind-spot discovery + bounded FSM) · `harness-mine` (skill verifier
half i) · `harness-promote-mutator` (append a verified mutator to the battery) ·
`harness-spawn` (DGM parent-sampling) · `harness-fitness` (AceGRPO-weighted
held-out fitness → `ArchiveEntry`) · `harness-select` (GRPO advantage + diversity
guard) · `harness-promote` (six-gate) · `harness-status` · `judge-stress`
(consistency CI) · `judge-calibration` (0.9.5 — blind target-task accuracy →
`60-harness/judge-reliability.json`). Driven by `commands/stz-evolve.md` and `commands/stz-inject.md`;
config via the optional `harness` block in `run-config.json`.

#### The six-gate promotion guard (DGM hack-resistance built in)

A variant becomes the incumbent ONLY if it (1) beats the incumbent on held-out
fitness AND (2) is **hack-clean on its OWN outputs** (it cannot win by weakening
its own gate — the DGM self-detector-bypass failure) AND (3) preserved sealing
integrity (`verifySeal`) AND (4) interface parity (`harness-hash.ts`) AND (5)
came from a diverse (non-collapsed) generation AND (6, **0.9.5**) its selection
**judge is target-task calibrated** (`calibrationGate` — fail-closed; an
uncalibrated verifier silently regresses, arXiv:2606.14629). Kill-switches
**halt and surface**; nothing ever auto-rewrites its own guard.

#### Discipline (earned, not asserted)

Held-out & recall-free · budget-matched · 3-seed minimum · symmetric-error null
("no variant beats the incumbent → keep it" is a SUCCESS) · convention-axis
discount · N6 replay from `60-harness/MANIFEST.json` append-order. The pilots are
burned as blind-spot substrates (non-regression only); a fresh, pre-registered,
unprobed contract is required for any generalization claim.

#### Operator table (0.9.0 meta-loop)

| Signal | Interpretation | Response |
|---|---|---|
| `harness-select` σ < `diversityFloor` | Variance collapse — generation is non-discriminating | Do not promote; re-sample with forced gene diversity (RC-GRPO) |
| two BARREN generations in a row | Converged — nothing beats the incumbent | Halt; incumbent stands (anti-build null — a SUCCESS) |
| `harness-mine` mutator killed by incumbent suite | Not a blind spot | Reject the candidate skill as a no-op |
| six-gate `promote:false` with `hack-findings-on-own-outputs` | Variant tried to win by weakening its gate | Reject; the DGM failure mode, caught |
| `judge-stress` consistency below threshold for a slice-type | Judge unreliable here | Down-weight the judge; lean on the sealed/truth divergence backstop |
| six-gate `promote:false` with `judge-rubric-not-calibrated` (0.9.5) | Selection judge not target-task calibrated (or `--slice-type` omitted) | Run `judge-calibration` on a blind battery first; gate is fail-closed by design |

---

## 0.9.0 empirical status (2026-06-28) — the competency claim was tested and is a negative

The 0.9.0 meta-loop above is built and works as a mechanism. The claim it was built to
support, that harness self-improvement ships more correct code, was then tested directly
and does not hold on the substrates tried. Across six substrates and every selection signal
the harness can compute (sealed-derived numeric proxies, the judge, and a heterogeneous
pool), no configuration produces a competency lift attributable to the harness detecting
correctness. The reason is structural: a suite-sharpening gain needs an axis that is large,
split across the blind pool, and invisible to a good-faith suite at the same time, and those
properties do not co-occur. The `harness-mine` discover-and-bake mechanism is real and
useful; converting it into reliably better shipped code is the part that does not follow.

Full account: `docs/PAPER.md`. Cross-arm summary: `experiments/EXPERIMENT-SUMMARY.md`.
Build log: `docs/JOURNAL.md`. The remaining open questions (a correctness-tracking judge
rubric, a non-sealed-derived numeric proxy, frontier-vs-frontier at scale, cross-slice
amortization on a family with a shared bug class, and SWE-Bench as a deciding instrument)
are in the paper's Section 8.

## 0.9.5 — calibrated-verifier gating + a Well-Architected authoring gene — ✅ BUILT

The post-Opus-4.8 RSI literature was surveyed against STZ's earned negative
(`experiments/META-RSI-SURVEY.md`). It did not rescue the negative; it corroborated it and
handed over a proof of *why*, plus two **earned** moves that satisfy both competency-and-
compatibility, which 0.9.5 ships:

- **Calibrated-verifier gating (the sixth promotion gate).** [arXiv:2606.14629](https://arxiv.org/abs/2606.14629)
  (*When Good Verifiers Go Bad*) sharpened the open door: an exogenous verifier each round is
  **necessary but not sufficient** — it must be **target-task calibrated before it steers**, or
  it silently regresses the result (above-threshold-on-A can be sub-threshold-on-B;
  confident-but-wrong regresses worse than random). STZ's own judge-shipped-c4-worse
  (`experiments/judge-selection/`) is an on-data instance. 0.9.5 adds `judge-calibration`
  (measures judge target-task accuracy on a blind, pre-registered battery → persisted
  `60-harness/judge-reliability.json`) and a **fail-closed** sixth gate `rubricCalibrated`
  in `promotionGate` (`src/harness.ts`, `src/judge-reliability.ts:calibrationGate`). It buys
  **bounded-safe**, not continuous, improvement — it stops the loop going negative. This
  *validates and sharpens* the existing guard architecture (bounded depth F14 +
  judge-reliability gating + variance floor + halt-and-surface F19).
- **WAF authoring gene `waf-playbook-autogen-v0` (G1).** A `heuristicId` branch in
  `agents/stz-test-author.md` lets the test author consult the AWS Well-Architected Agentic AI
  Lens playbooks to sharpen negative/edge cases for behaviour the contract already specifies —
  **one-time amortized authoring**, the survey's earned WAF result. **Goodhart-guarded:** WAF
  never adds an unstated requirement and no LLM-judged WAF-conformance score is ever a fitness
  signal (weights tuple untouched; promotion stays on held-out functional fitness). STZ already
  maps strongly onto the Agentic AI Lens (`docs/CLAUDE.md` §5); the remaining Lens gaps
  (AGENTCOST05 per-agent cost-attribution, AGENTSEC07 rogue-agent detection beyond static L3)
  are conformance items, not loops.

The honest headline (carried from the survey): **no validated *continuous*-competency win
exists in the window.** 0.9.5 ships only what is earned (degradation-safety + authoring) and
pre-registers the one speculative direction (door A) as a gated experiment (below).
