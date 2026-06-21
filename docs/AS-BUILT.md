# STZ — As-Built Note

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
- the bridge subcommands for both a single slice (begin, eval, gate,
  record-votes, select, finalize) and the project (project-init, project-phase,
  slice-add, project-seed-slices, project-status, summary);
- the full command surface: `/stz:new`, `/stz:research`, `/stz:validate`,
  `/stz:standards`, `/stz:tests`, `/stz:slice`, `/stz:summary`, `/stz:pipeline`,
  and `/stz:run`;
- ten subagents: the per-slice specimen, judge, test-author, documenter and the
  project-level researcher, validator, conventions, test-planner, slicer,
  summarizer;
- packaging as a Claude Code plugin with a SessionStart hook.

**Mock testing harness (`src/mock/`).** A self-contained, no-network demo that
drives the whole pipeline against a deterministic fake model. It is a testing
aid, not the production path, and the production spine does not depend on it.

**Quality gates.** 84 deterministic tests plus a typecheck, run in CI on Node 20
and 22.

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
  hold; the per-slice token cap throws rather than overspending.
- **A replayable audit trail.** Every run materializes intent, research,
  conventions, test strategy, per-slice tournaments, pressure logs, spec-diffs,
  and a completion summary under `.stz/`, reconstructible from the tree plus
  state.
- **A full interactive pipeline.** A get-shit-done-style command-per-phase flow
  with elicitation Q&A, approval gates, a DAG co-design step, a dashboard, and
  `--auto` chaining. The front phases were run live end to end for a `slugify`
  project (`examples/full-pipeline/`).
- **Installs as a plugin.** The commands resolve the bundled bridge with no PATH
  setup.

## Gaps

- **Cross-family specimens** (OpenAI / Codex) are not wired; the seam accepts any
  subagent, but only Claude Code subagents are connected.
- **Python eval drivers** (Hypothesis, mutmut, Stryker) are not used. Coverage and
  mutation are executed in JavaScript via V8 and source mutators.
- **Per-specimen git worktrees and observability stacks** are not built; distinct
  `prototypes/specimen-X/` directories stand in for worktrees.
- **Cross-slice RAG / embeddings** are not built. A visible consequence: the
  spec-diff matches claims literally, so intent (the what) and as-built (the how)
  read as divergent and the diff over-flags for human review. Conservative, not
  wrong; semantic matching is the fix.
- **OS-level sealing** of the held-out suite (git read-only attributes plus a
  pre-commit hook) is not applied; only the prompts withhold it from implementers.
- **The bundled bridge runs the TypeScript CLI through `tsx`**, fetched by `npx`
  on first use, so a fresh environment needs Node 20+ and network for that first
  call. Shipping a prebuilt `dist/` to drop the runtime `tsx` dependency is a
  hardening follow-up.
- **Cross-round escalation in `/stz:run`**: a single command invocation halts on
  no-passers; the retry-then-replan loop currently lives in the mock orchestrator
  and is not yet driven by the command across rounds.

## Intent vs as-built (the diff)

- **Delivered as intended:** the deterministic spine, the in-session adversarial
  tournament, the full project pipeline with sealed tests and layered
  anti-reward-hacking, the replayable audit trail, and an installable plugin.
- **Deferred and documented (not missing by accident):** cross-family specimens,
  Python eval libraries, worktrees and observability, cross-slice RAG, OS-level
  sealing, the `dist/` build, and cross-round escalation from the command.
- **Built beyond the original plan:** the `stz bridge` JSON contract, a
  dependency-free real eval runner (V8 coverage plus source mutation), the
  two-level project DAG driver, the deterministic mock harness, the two worked
  example runs, and the CI pipeline.
