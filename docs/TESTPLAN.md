# STZ — Test & Evaluation Plan

Definition-of-done for this implementation: **every implemented requirement maps
to a deterministic `vitest` test, and the whole suite + typecheck pass.** The
deterministic spine is tested for real; the LLM layer is tested at the
interface-contract + mock-e2e level (it is explicitly *not* a live-tournament
result — see `ROADMAP.md`).

Run: `npm test` (163 tests) and `npm run typecheck`.

## Requirement → test map

| Req | What it requires | Where it lives | Test(s) |
|-----|------------------|----------------|---------|
| **F1** | 8-phase pipeline per slice | `orchestrator.ts` | `orchestrator.test.ts` — "runs all 8 phases", "every phase ends done" |
| **F2** | Elicitation exit: machine-checkable predicates, no prose-only | `orchestrator.ts` (throws on empty predicates) | `orchestrator.test.ts` success path asserts predicates emitted; guard in code |
| **F4/F5** | Contract-bounded slices, manifest + frontmatter | `types.ts`, `taxonomy.ts` | `taxonomy.test.ts` round-trip |
| **F6** | N parallel specimens per slice | `orchestrator.ts` (N=4) | `orchestrator.test.ts` — 4 prototype dirs materialized |
| **F7** | Hybrid selection: eval-gate then pairwise V=8 ranking | `selection.ts` | `selection.test.ts` (gate, tally, rank, select); `orchestrator.test.ts` — "V=8 votes recorded per pair" (24 judge calls) |
| **F8** | GRPO group-relative advantage `(r−μ)/(σ+ε)` | `grpo.ts` | `grpo.test.ts` — formula, mean-centering, **std=0 ε-guard** |
| **F9** | Pressure log + PDR top-K=4 refinement context | `pressure.ts` | `cost-pressure.test.ts`; `orchestrator.test.ts` pressure dir asserted |
| **F10/L3** | Anti-reward-hacking: hack-pattern detection ⇒ disqualification | `hack-detector.ts` | `hack-detector.test.ts` (11 patterns + no-false-positive + locations); integration in `selection.test.ts` + `orchestrator.test.ts` ("a hacky specimen never wins") |
| **F11** | Coverage + mutation captured per specimen | `types.ts` `EvalResult`, `selection.ts` `evalReward` | `selection.test.ts` reward bounds |
| **F13** | Intent vs as-built spec diff | `specdiff.ts` | `specdiff.test.ts`; `orchestrator.test.ts` spec-diff.md materialized |
| **F14** | Bounded escalation: 1 retry → 1 replan → halt (ceiling) | `escalation.ts`, `bridge.ts` `escalate` | `escalation.test.ts` — **"CEILING HOLDS"**, "halt is absorbing"; `orchestrator.test.ts` — "retry → replan → halt", exactly 3 rounds; `bridge.test.ts` — `escalate` persists the FSM over `state.json` across rounds + ceiling fail-safe (the command-driven path, 0.7.0) |
| **F15** | Adaptive complexity→budget + calibration | `budget.ts` | `budget.test.ts` (monotonic, pool cap, calibrate) |
| **F16** | state.json checkpoint + crash recovery | `state.ts` | `state.test.ts` — save/load, `resumePhase` interrupted/pending/complete/halted |
| **F17** | `npx stz init` distribution | `cli.ts`, `bin/stz.mjs` | manual: `node bin/stz.mjs init/run` (real shim) verified — see below |
| **N1** | Auditability: full tree replayable | `taxonomy.ts`, `state.ts`, orchestrator | `orchestrator.test.ts` — "materializes the full audit tree" (10 artifacts) |
| **N2** | Progressive disclosure: frontmatter summaries | `taxonomy.ts` | `taxonomy.test.ts` — summary invariant |
| **N5** | Cost governance: hard per-slice cap (enforced) | `budget.ts`, `cost-tracker.ts`, orchestrator `charge()` | `budget.test.ts` `wouldExceed`; `orchestrator.test.ts` — "spend within cap" **and** "tiny pool trips the kill-switch" (throws `BudgetExceededError`) |
| **N6** | Determinism / replayability | `cost-tracker.ts`, all pure modules | `cost-pressure.test.ts` JSONL round-trip; `orchestrator.test.ts` — "identical config → identical winner" |
| **N12** | Zoo vocabulary discipline | `cli.ts` AGENTS.md, `pressure.ts` | manual: AGENTS.md vocabulary table |

## In-session harness (steps 1–5)

| Capability | Where | Test / proof |
|---|---|---|
| Deterministic bridge (begin→eval→gate→votes→select→finalize) | `src/bridge.ts` | `bridge.test.ts` — full sequence, planted hack disqualified |
| Real eval runner: executed tests + V8 coverage + mutation | `src/eval-runner.ts` | `eval-runner.test.ts` — passRate, coverage in (0,1], mutation kills, **comment-mutation guard** |
| Parallel in-session subagents | `commands/stz-run.md` + Agent tool | executed run in `examples/clamp-tournament/` (4 specimens parallel, 6 judges, hacker culled, GRPO non-flat) |
| Plugin packaging | `.claude-plugin/{plugin,marketplace}.json` | JSON validity asserted; install/restart cycle not run (see ROADMAP) |
| SessionStart activation | `hooks/` | hook script executed, emits context when `.stz/` present |
| Human winner gate | `commands/stz-run.md` step 8b | command-level (AskUserQuestion) |
| Run config + dark-factory toggle (0.3.0 / 0.4.0) | `src/project.ts`, `src/bridge.ts` | `project.test.ts` — set-config round-trip, clamp/validate, load-modify-save toggle preserves sibling fields |
| Sealed-suite integrity: seal / verify / amend (0.3.3) | `src/seal.ts` | `seal.test.ts` — drift detection, audited amend, stable manifest |
| Cross-family reference: `seal-crosscheck` (0.5.0) | `src/eval-runner.ts`, `src/bridge.ts` | `eval-runner.test.ts` (both-pass/divergent/both-fail on a real boundary pair); `bridge.test.ts` exit codes + audit doc |
| Cross-slice merge integrity: `merge-validate` (0.5.2) | `src/merge.ts`, `src/bridge.ts` | `merge.test.ts` — four verdict buckets on the slice-03/slice-05 fixture + propose→approve→retire lifecycle with exit codes |
| Tabulated pipeline dashboard (0.5.4) | `src/bridge.ts` `project-status` | `project.test.ts` — computed `progress` totals + enriched slice rows (winner/faithful) |
| Update/upgrade pathway: `stz update` / `migrate` (0.6.0, F19) | `src/version.ts`, `src/update.ts`, `src/migrate.ts` | `version.test.ts` — version sourced from package.json + 3-manifest drift guard; `update.test.ts` — semver compare, verdict/commands, injectable registry check (offline); `migrate.test.ts` — additive backed-up `.stz/` schema upgrade, idempotent |

## Manual / CLI acceptance

```
tsx src/cli.ts init <dir>   # → scaffolds 13-tier .stz/ tree + AGENTS.md
tsx src/cli.ts run  <dir>   # → full mock pipeline; winner=specimen-a, faithful=true
```

Asserted by inspection: `.stz/` tree contains questionnaire, sealed held-out
suite, plan, 4 specimen prototypes, tournament, spec-diff, pressure log,
refinement context, call ledger (jsonl), cost, journal, and per-slice state.json.

## Not asserted here (out of scope — stubbed behind interfaces)

Live LLM/subagent calls; real Python eval drivers / Hypothesis / mutation
testing; git worktrees; per-worktree observability; cross-slice RAG. These have
real interfaces (`src/mock/interfaces.ts`) and deterministic mocks, so a live
implementation drops in without touching the tested spine.
