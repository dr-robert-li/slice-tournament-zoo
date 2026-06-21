# STZ As-Built Note

A self-contained record of what this project set out to be, what was actually
built, the features that resulted, the gaps that remain, and the difference
between intent and delivery.

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
- **Update pathway (F19).** `stz --version`, `stz update [--check]` (npm
  staleness; prints commands, never self-installs; also reports CLI-vs-plugin
  drift when a plugin manifest is reachable via `CLAUDE_PLUGIN_ROOT` or a repo
  checkout), `stz migrate` (additive, backed-up `.stz/` schema upgrade), and `stz
  bridge version`. Every `.stz/` tree carries a versioned `manifest.json`; a
  single `src/version.ts` seam sources the version from `package.json` and a test
  guards against the three version manifests drifting apart.

## Gaps

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
  deterministic mock harness, the two worked example runs, the CI pipeline, and
  the npm CLI distribution.
