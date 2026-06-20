# Architectural Design Pattern: slice-tournament-zoo (STZ)

## 1. Executive Summary & Intent

- **Context:** A greenfield, open-source agentic-coding harness designed for "software engineering dark factories with auditable outputs." Engineers and autonomous CI runs invoke STZ to take a request from elicitation through implementation by running heterogeneous specimen agents through a contract-bounded slice pipeline. Each slice is implemented adversarially by N specimens; survivors are selected by a hybrid eval-gate + LLM judge against a frozen, sealed test suite that the implementers cannot see. The entire run leaves a markdown audit trail a human reviewer can replay after the fact.
- **Solution Intent:** A Claude Code / Codex CLI plugin layer that orchestrates a per-slice GRPO-style tournament across N parallel specimens, governed by progressive-disclosure markdown artifacts (DAG manifest + per-slice frontmatter files), with layered anti-reward-hacking (frozen test author + sealed held-out suite + trace-based hack-pattern detection + inoculation prompting), tiered ground-truth research validation, adversarially-evolving conventions, and intent-spec vs. as-built-spec diff as the canonical audit record.

## 2. Refined Engineering Requirements

### Functional Requirements

- **F1 — Phase pipeline per slice (8 phases):** elicitation → research → ground-truth validation → standards & conventions → testing conventions & frozen test/eval authoring → planning → adversarial parallel prototyping (the tournament) → judgment, merge, and as-built spec generation.
- **F2 — Elicitation exit condition:** structured questionnaire fully populated *and* every quantitative success criterion expressed as a machine-checkable predicate (e.g., `p95_latency_ms < 200`, `returns_schema(X)`). No prose-only acceptance.
- **F3 — Tiered ground-truth validation:** validator subagent classifies each research claim by type and routes accordingly — executable verification (API/codebase claims), 3-source corroboration (architectural claims), or spike micro-benchmark in `research/spikes/` (performance claims).
- **F4 — Contract-bounded slices:** every slice is one interface contract + its implementation + its tests. Slices compose into features via the project-level DAG manifest.
- **F5 — Slice manifest:** project-level DAG manifest declaring slice ordering and dependencies + per-slice markdown file with YAML frontmatter (contract, done-predicates, trace tier, complexity estimate, budget, judge config) and prose body.
- **F6 — Parallel tournament per slice:** parent orchestrator spawns N Claude Code subagents (default N=4 for v1; configurable; design accommodates scaling to N=16 per the RTV reference). All specimens run in parallel git worktrees inside one parent session, each with its own ephemeral observability stack.
- **F7 — Hybrid selection: eval-gate + judge ranking:**
  - Stage 1 (gate): each specimen must pass the sealed held-out eval suite. Failures eliminated.
  - Stage 2 (ranking): frozen judge subagent runs pairwise comparisons across passers using V=8 votes per pair (RTV default), ranking on trace quality, convention adherence, test coverage delta, and as-built clarity.
- **F8 — GRPO-style group-relative advantage:** advantage_i = (reward_i − group_mean) / (group_std + ε), computed across the slice's specimen group. Used both to pick the winner and to weight which losers' diffs are most informative as forward signal.
- **F9 — Selection pressure (the pressure log):** culled specimens' diffs + judge critiques + hack-detection findings are persisted to `pressure/slice-NN/` as structured negative-exemplar context. If the failure-replan loop activates, the top-K=4 surviving summaries (PDR pattern) form the refinement context for the next round of specimens.
- **F10 — Layered anti-reward-hacking (defense in depth):**
  - L1: frozen test-author subagent runs *before* the tournament in a separate context window; its outputs are git-tagged read-only; implementers see the interface contract but never the test author's implementation.
  - L2: sealed held-out eval suite contains edge cases + property-based test generators (Hypothesis for Python, fast-check for TS) + cross-slice integration scenarios; loaded by the judge only.
  - L3: trace inspector scans for known hack patterns (hardcoded test inputs, assertion mutation, test-skipping, special-cased branches keyed on test fixtures, network calls bypassing fixtures). Anomaly = disqualification.
  - L4: inoculation prompting (Anthropic, Nov 2025) injected into implementer system prompts: framing that the task is to *satisfy the spirit of the contract*, not to maximize the grading script.
- **F11 — Tiered tracing + universal coverage + mutation testing:** trace tier declared in slice frontmatter (minimal for unit-level, OTel spans for service-level). Code coverage and mutation testing survival rate captured for every specimen regardless of tier.
- **F12 — Adversarial convention evolution:** prototypers may emit `CONVENTIONS_AMENDMENT.md` per round; judge evaluates amendments independently on convention merit (clarity, consistency, generality), not by implementation outcome. Ratified amendments versioned into `20-standards/conventions.md`.
- **F13 — Intent-spec / as-built-spec diff:** planner produces upfront intent spec; documenter subagent produces as-built spec from winning merged code + traces; the diff is committed as `slice-NN/spec-diff.md` and is the canonical audit artifact.
- **F14 — Failure escalation, bounded:** 1 GRPO retry round (using losers' pressure log as negative context) → 1 replanning loop (failure analysis fed back into planning phase) → halt with structured failure report. Hard ceiling.
- **F15 — Adaptive complexity-based budgeting:** elicitation phase emits a complexity score per slice (1–5); orchestrator allocates token + wall-clock budget from a project pool against complexity; actuals fed back into a calibration table for future estimates.
- **F16 — State + recovery:** git is the artifact store; `state.json` per slice tracks current phase, active specimens, pending judgments, accumulated cost. Crash recovery resumes from `state.json` + last commit on the slice branch.
- **F17 — Distribution:** primary `npm` package (`npx stz init`), Claude Code plugin bundle, and a template repo for inspection/fork.
- **F18 — Dogfooding from slice-01:** STZ's own development uses STZ. The bootstrap (slice-00) leans on existing Claude Code primitives (skills, subagents, hooks) plus a hand-written minimal orchestrator stub, then STZ produces itself from slice-01 onward.

### Non-Functional Requirements

- **N1 — Auditability:** any phase decision, judge ranking, eval result, hack-detection finding, or convention ratification must be reconstructible from the markdown tree + git history + `state.json` event sequence. No external state store is required to replay a run.
- **N2 — Context-budget efficiency:** progressive disclosure via tiered files + frontmatter summaries + cross-slice RAG. Orchestrator never loads full slice bodies; phase agents load only their tier's content + summaries above.
- **N3 — Throughput:** target ≥ N=4 specimens running concurrently per slice on a developer workstation; design accommodates N=16 in CI/cloud configurations (matching the published RTV+PDR optimum).
- **N4 — Latency:** per-slice wall-clock budget configurable; default 30 minutes per slice for v1 with N=4 specimens; long-tail tolerated by Codex-pattern minimal blocking merge gates.
- **N5 — Cost governance:** hard per-slice token cap derived from complexity score. Soft per-phase warnings. Wall-clock cap as secondary halt condition. All usage tracked in `state.json` and aggregated in `90-audit/cost.md`.
- **N6 — Determinism / replayability:** every LLM call's prompt, model, temperature, seed (where supported), and response is persisted under `90-audit/calls/`. A replay command must be able to reconstruct any decision point.
- **N7 — Hack-resistance posture:** target measurable reduction in proxy-real eval gap vs. naive best-of-N. Reference benchmark: Kernel-Bench / ALE-Bench style proxy vs. private eval split, run periodically against STZ's own dogfooded slices.
- **N8 — Licensing posture:** Apache 2.0 + Commons Clause (or BSL) — source-available, patent grant, preserves a commercial path for hosted/managed runs.
- **N9 — Single-repo scope (v1):** monorepo and multi-repo coordination are out of v1. Single repo per STZ run.
- **N10 — Polyglot, TS-primary:** harness internals in TypeScript/Node. Python used for eval scoring, mutation testing harness, property-based generators, and ML-adjacent utilities. Target slice code is language-agnostic but v1 reference projects are TS and Python only.
- **N11 — No enterprise auth in v1:** no SSO/IAM integration; Anthropic and OpenAI API keys via standard env vars. Enterprise auth + Bedrock/Vertex inference plane deferred to v2.
- **N12 — Vocabulary discipline:** README and all phase docs use the evolutionary zoo metaphor consistently — *specimens* (agents), *environment* (eval suite + conventions), *propagation* (winner's pattern carried forward), *selection pressure* (mechanism), *pressure log* (file artifact).

## 3. Target Cloud Architecture

### Generative AI Layer (v1)

- **Implementer specimens:** Claude Code subagents invoking Anthropic API (Claude Sonnet/Opus). Configurable to OpenAI (GPT-5 via Codex CLI) per specimen for heterogeneity.
- **Judge subagent:** same model family as implementers, *different system prompt*, *frozen separate context window*. No shared scratchpad with implementers. v2 adds optional cross-family quorum judge.
- **Test-author subagent:** same family, frozen context, different prompt + tools. Runs once per slice before tournament begins. Outputs are git-tagged read-only.
- **Documenter subagent:** generates as-built spec post-merge from code + traces.
- **Doc-gardener (background):** scans for stale markdown vs. real code (Codex pattern); opens fix-up PRs on the harness branch.
- **Embeddings:** local model (e.g., `nomic-embed-text` via Ollama) for cross-slice RAG over the markdown tree. No managed vector service required for v1.
- **v2 inference plane (deferred):** AWS Bedrock (Claude Sonnet/Opus) as the autonomous-run default; GCP Vertex (Gemini) as the cross-family judge option.

### Compute & Integration Layer

- **Orchestrator process:** Node.js (TypeScript). Single long-running process per STZ run. Spawns specimens as child Claude Code subagent invocations.
- **Specimen isolation:** git worktrees, one per specimen, under `.stz/worktrees/slice-NN/specimen-{a,b,c,d}`. Each worktree has its own ephemeral observability stack (per Codex pattern): scoped log directory, scoped Prometheus pushgateway, scoped trace collector. Torn down post-tournament.
- **Eval runner:** Python (uvx-invoked) for property-based testing (Hypothesis), mutation testing (mutmut/Cosmic Ray for Python; Stryker for TS), coverage (coverage.py / c8). TS eval drivers for TS-targeted slices; Python eval drivers for Python-targeted slices.
- **Hack-pattern detector:** TS subprocess. Static analysis (AST-based) + diff inspection across specimen branches. Custom linter pattern (Codex): error messages include remediation context that gets re-injected into the specimen's next prompt if the failure-replan loop activates.
- **State store:** git + `state.json` (per slice). No external database in v1.
- **Cost / token tracker:** middleware around all Anthropic/OpenAI SDK calls; persists to `90-audit/calls/*.jsonl` and aggregates in `state.json`.

### Data & Vector Store

- **Primary data:** markdown files under `.stz/` (the harness directory inside the target repo). Tiered:
  - `00-intent/` — elicitation transcript, questionnaire, done predicates
  - `10-research/` — `external/`, `internal/`, `validated.md`, `spikes/`
  - `20-standards/` — `conventions.md` (versioned), `architecture-decisions/`
  - `30-tests/` — `plan.md`, `rubric.md`, `held-out/` (sealed, git-attributed read-only)
  - `40-slices/slice-NN-<name>/` — `manifest.md` (frontmatter+body), `plan.md` (intent spec), `prototypes/specimen-{a,b,c,d}/`, `tournament.md`, `merged/`, `spec-diff.md`
  - `50-pressure/slice-NN/` — culled specimens' diffs + judge critiques + hack findings (the pressure log)
  - `90-audit/` — `journal.md`, `calls/*.jsonl`, `cost.md`, `state.json`
- **Frontmatter schema:** every markdown file has YAML frontmatter with a ~200-token summary field. Phase agents load summaries by default; full content fetched on named-anchor reference.
- **Vector index:** local embeddings over the markdown tree, scoped per phase agent's role. Invoked only for cross-slice lookups ("have we set a convention for X?", "did slice 03 already handle this auth pattern?"). Index rebuilt incrementally on slice close.
- **Eval artifacts:** test results, mutation testing scores, coverage reports stored under `40-slices/slice-NN/prototypes/specimen-X/eval/`.

### Pipeline Topology (Per Slice)

```
elicit → research → ground-truth-validate → conventions-detect
   ↓
test-author (frozen, sealed held-out → 30-tests/held-out/)
   ↓
plan (intent spec → 40-slices/slice-NN/plan.md)
   ↓
spawn N specimens in parallel worktrees (each w/ ephemeral obs stack)
   ↓
eval-gate (sealed held-out suite + coverage + mutation + hack-pattern detect)
   ↓                                  ↓
passers                          eliminated → 50-pressure/
   ↓
judge (pairwise, V=8 votes, GRPO group-relative advantage)
   ↓
winner → merge → documenter (as-built spec) → spec-diff
   ↓
ratify convention amendments → 20-standards/conventions.md (versioned)
   ↓
state.json checkpoint → next slice
```

Failure path (bounded): no passers → retry round with pressure log + K=4 surviving summaries as PDR-style refinement context → still no passers → re-enter plan phase with failure analysis → still no passers → halt + structured failure report.

## 4. Risks, Limitations & Mitigation Strategies

- **R1 — Reward hacking compounds with optimization depth.** Empirically, proxy-real eval gaps widen as agents iterate ([Kernel-Bench/ALE-Bench study, 2025](https://arxiv.org/html/2601.20103v1)).
  - *Mitigation:* Hard cap on retry depth (1 GRPO retry + 1 replan). Sealed held-out suite never seen by implementers. Trace-based hack-pattern detection. Inoculation prompting per [Anthropic Nov 2025](https://www.anthropic.com/research/emergent-misalignment-reward-hacking).
- **R2 — LLM judge accuracy is 60–80% on subtle code changes** ([RTV paper](https://www.swiftscholar.net/paper/69eab9ef84947a5132b6304c)).
  - *Mitigation:* V=8 votes per pairwise comparison (diminishing-returns knee). Two-stage selection (eval gate before judge). v2: cross-family quorum judge.
- **R3 — Cost runaway in N-parallel + retry loops.** N=16 specimens × 2 iterations ≈ 32 rollouts per task per RTV; STZ defaults to N=4 to compensate.
  - *Mitigation:* Adaptive complexity-based per-slice budget. Hard token + wall-clock caps. Per-phase soft warnings. Per-specimen kill-switch on cost overrun.
- **R4 — Context-window pressure as slices accumulate.** Markdown tree grows monotonically; naive loading would blow the orchestrator's context.
  - *Mitigation:* Tiered files + frontmatter summaries + cross-slice RAG. Orchestrator only reads index + active slice + adjacent slices' summaries.
- **R5 — Specimens converge to lowest-variance solutions when seeded identically (false diversity).**
  - *Mitigation:* Plan-as-contract leaves "how" open. Strategy-diversification subagent emits N distinct implementation strategies (iterator-based, stream-based, batch-based, recursive). Heterogeneous model assignment available per specimen.
- **R6 — Convention amendments ratified on noise.** Single-slice signal may not generalize.
  - *Mitigation:* Judge evaluates amendments *independently of code quality* on clarity/consistency/generality rubric. Amendments queued with provenance; can be revisited if subsequent slices' winners revert the pattern.
- **R7 — Bootstrapping circularity.** STZ dogfoods from slice-01 but slice-01 requires a working judge, test-author, eval runner.
  - *Mitigation:* Slice-00 is a hand-written minimal kernel using existing Claude Code primitives (the project's `coding` skill + subagent invocations). Slice-01 is STZ producing the orchestrator improvements; slice-02 produces the judge; etc. Bootstrap path documented in `00-intent/bootstrap.md`.
- **R8 — Held-out suite leakage via implementer reading the contract surface.** Implementers see interface signatures; clever specimens could probe call patterns.
  - *Mitigation:* Property-based generators run at judge time, not implementer time — inputs are not knowable in advance. Cross-slice integration tests reference future slices' contracts that specimens cannot see. Hack-pattern detector watches for fixture-keyed special-casing.
- **R9 — Specimen-to-worktree IO contention on developer laptops.** N=4 worktrees + observability stacks + test runs is heavy.
  - *Mitigation:* Per-specimen resource caps (CPU, memory) at the process level. Worktrees on tmpfs where available. CI/cloud profile available for heavier runs.
- **R10 — Long-running specimen (Codex reports 6h single-task runs) blocks slice completion.**
  - *Mitigation:* Wall-clock cap per specimen; stuck-detection (no progress events for K minutes); kill-and-restart-with-pressure-log behavior.
- **R11 — Markdown tree drift from real code.**
  - *Mitigation:* Background doc-gardener subagent (Codex pattern) scans for staleness, opens fix-up PRs. As-built spec generation runs on every merge so the audit trail stays current.
- **R12 — Inoculation prompting reduces hacking but may slightly reduce task completion** ([Anthropic Nov 2025](https://www.anthropic.com/research/emergent-misalignment-reward-hacking) discusses the trade-off).
  - *Mitigation:* Use the milder framing variant ("this is an unusual request, your task is just to make the grading script pass") which Anthropic shows is effective without the strong-prompt downside.

## 5. AWS Well-Architected Validation

Note: v1 is a local-first OSS tool with no AWS deployment in scope. This section validates the *design choices* against Well-Architected pillars in anticipation of the v2 cloud variant (Bedrock + Vertex inference plane), so that v1 doesn't make decisions that block v2.

### Operational Excellence

- Phase boundaries are commit boundaries; every transition is a structured event in `state.json` + a git commit. Full replay possible.
- Doc-gardener subagent provides continuous knowledge-base hygiene.
- Background calibration of complexity-to-budget mapping creates a self-improving operational signal.

### Security

- v1: API keys via env vars only; no secrets in the markdown tree (enforced via custom lint).
- Sealed held-out suite enforced via git attributes + a pre-commit hook on the harness branch.
- v2 path: Bedrock invocations behind VPC endpoints; Vertex via private service connect. IAM role per phase agent. Held-out suite stored in an isolated bucket with IAM scoped to the judge role only.
- No code execution outside per-specimen worktrees. Hack-pattern detector catches network egress patterns that bypass fixtures.

### Reliability

- Git + `state.json` provides durable checkpointing. Recovery model: re-enter last incomplete phase from the slice branch's last commit.
- Bounded retry depth prevents infinite loops.
- Stuck-detection per specimen with kill-and-replace behavior.
- v2 path: Bedrock multi-region inference fallback; Step Functions Map state for tournament fan-out with retry policies.

### Performance Efficiency

- N=4 default fits developer workstation; N=16 fits CI/cloud (matching published RTV optimum).
- Tiered markdown + RAG keeps context-window utilization sub-linear in slice count.
- Pairwise comparisons (G=2) outperform flat large-group ranking ([RTV finding](https://www.swiftscholar.net/paper/69eab9ef84947a5132b6304c)).
- Mutation testing runs only on passers — not on culled specimens — to control eval cost.

### Cost Optimization

- Adaptive per-slice budget allocated from a project-level pool, calibrated by actuals.
- Cheap "qualifier" model variant (e.g., Haiku) for early elimination if specimen fails obviously before invoking expensive judge.
- Mutation testing and OTel tracing only at declared tier (not universal).
- v2 path: Bedrock provisioned throughput for predictable autonomous-run workloads; on-demand for ad hoc developer runs.

### Sustainability

- Per-worktree ephemeral observability stacks are torn down at slice close — no long-lived idle infra.
- Background doc-gardener uses cheaper model tier.
- Pressure log compresses culled specimens to structured summaries, not full traces, after slice close (size-bounded historical signal).

## 6. Implementation Roadmap & Tasks

The roadmap is split into v1.0 (initial OSS release), v1.1 (hardening + dogfood-driven improvements), and v2 (enterprise / cloud variant).

### v1.0 — Minimum Viable Zoo (slices 00–10)

| Task | Component | Effort | Dependencies |
|:---|:---|:---|:---|
| Slice-00: hand-written orchestrator kernel + state.json schema + markdown taxonomy writer | Orchestrator (TS) | 2 days | None |
| Slice-00: phase contract spec (what each phase reads/writes/emits) | Spec / Docs | 1 day | Slice-00 kernel |
| Slice-00: AGENTS.md + STZ-table-of-contents pattern | Repo scaffolding | 0.5 day | None |
| Slice-01: elicitation subagent + questionnaire + predicate validator | Elicitation phase | 1.5 days | Slice-00 |
| Slice-02: research subagent + tiered ground-truth validator (3 routes) | Research phase | 2 days | Slice-01 |
| Slice-03: convention-detector subagent + conventions.md versioning | Standards phase | 1 day | Slice-02 |
| Slice-04: frozen test-author subagent + sealed held-out tree + git read-only attributes | Test author / Tests phase | 2 days | Slice-03 |
| Slice-05: planner subagent + intent-spec template | Planning phase | 1 day | Slice-04 |
| Slice-06: strategy-diversification subagent (N distinct strategies from plan) | Strategy / Tournament | 1 day | Slice-05 |
| Slice-06: specimen orchestrator (git worktrees, parallel Claude Code subagent invocations, per-specimen budgets) | Tournament | 2.5 days | Slice-05, Slice-06 strategy |
| Slice-07: eval runner (Python + TS drivers, property-based gens, coverage, mutation testing) | Eval | 2.5 days | Slice-04 |
| Slice-07: hack-pattern detector (AST + diff scan) with remediation-injected error messages | Anti-hacking | 2 days | Slice-07 eval runner |
| Slice-07: per-specimen ephemeral observability stack (logs/metrics/traces, LogQL/PromQL) | Tracing | 1.5 days | Slice-06 |
| Slice-08: judge subagent + pairwise V=8 voting + GRPO group-relative advantage | Judgment | 2 days | Slice-07 |
| Slice-08: convention amendment evaluator (independent rubric) | Standards / Judgment | 1 day | Slice-03, Slice-08 judge |
| Slice-09: documenter subagent + as-built spec generation + spec-diff | Audit | 1 day | Slice-08 |
| Slice-09: doc-gardener background subagent | Audit / Hygiene | 1 day | Slice-09 documenter |
| Slice-09: pressure log persistence + PDR-style K=4 refinement context loader | Selection pressure | 1.5 days | Slice-08, Slice-09 |
| Slice-10: bounded failure escalation (1 retry → 1 replan → halt) + structured failure report | Orchestrator | 1 day | Slice-08, Slice-09 |
| Slice-10: adaptive complexity-based budget allocator + calibration table | Cost governance | 1.5 days | Slice-01, Slice-09 |
| Slice-10: cross-slice RAG over markdown tree (local embeddings, scoped per role) | Context budget | 1.5 days | All prior |
| npm package + `npx stz init` + Claude Code plugin manifest + template repo | Distribution | 1 day | All prior |
| README, AGENTS.md, contributor guide, LICENSE (Apache 2.0 + Commons Clause) | Repo polish | 1 day | All prior |
| **v1.0 total** | | **~30 days** | |

### v1.1 — Dogfood-driven hardening

| Task | Component | Effort | Dependencies |
|:---|:---|:---|:---|
| Inoculation prompting refinement based on dogfood reward-hack telemetry | Anti-hacking | 1 day | v1.0 |
| Stuck-detection per specimen (no progress events for K min) | Reliability | 1 day | v1.0 |
| Multi-language slice support beyond TS/Python (Go, Rust, Java adapters) | Eval / Tooling | 5 days | v1.0 |
| Heterogeneous specimen model assignment UI (one Sonnet, one Opus, one GPT-5) | Tournament | 2 days | v1.0 |
| Calibration dashboard for complexity-to-budget actuals | Cost / Ops | 2 days | v1.0 |
| Optional cross-family quorum judge (Anthropic + OpenAI + Google) | Judgment | 2 days | v1.0 |
| Pressure log compression + size-bounded retention | Sustainability / Ops | 1 day | v1.0 |

### v2 — Enterprise / Cloud variant

| Task | Component | Effort | Dependencies |
|:---|:---|:---|:---|
| AWS Bedrock inference adapter (Claude Sonnet/Opus via Bedrock) | Inference plane | 3 days | v1.1 |
| GCP Vertex inference adapter (Gemini via Vertex) | Inference plane | 3 days | v1.1 |
| Step Functions Map for tournament fan-out (cloud profile) | Orchestration | 5 days | v2 Bedrock |
| IAM scoping per phase agent (test-author role can read held-out; implementers cannot) | Security | 3 days | v2 Bedrock |
| VPC endpoint configuration for Bedrock + private service connect for Vertex | Security | 2 days | v2 Bedrock, v2 Vertex |
| Multi-region Bedrock fallback | Reliability | 2 days | v2 Bedrock |
| Monorepo + multi-repo slice coordination | Scope expansion | 5 days | v1.1 |
| Hosted-run telemetry + audit-trail UI (the markdown tree visualized) | UX | 5 days | v1.1 |
| Enterprise SSO/SAML for the hosted variant | Enterprise auth | 3 days | v2 hosted |

## 7. References (Prior Art & Research)

- [OpenAI Codex CLI · Harness Engineering (Feb 2026)](https://openai.com/index/harness-engineering/) — AGENTS.md-as-table-of-contents, progressive disclosure, per-worktree ephemeral observability, agent-to-agent review, golden principles via custom linters, recurring doc-gardener pattern, Ralph Wiggum loop until reviewers satisfied.
- [Scaling Test-Time Compute for Agentic Coding · Meta / RTV + PDR (April 2026)](https://www.swiftscholar.net/paper/69eab9ef84947a5132b6304c) — recursive pairwise tournament voting at N=16, G=2, V=8; PDR sequential refinement with K=4 surviving summaries; SWE-Bench Verified and Terminal-Bench v2.0 results; 60–80% LLM-judge accuracy on subtle code.
- [Anthropic · Natural Emergent Misalignment from Reward Hacking (Nov 2025)](https://www.anthropic.com/research/emergent-misalignment-reward-hacking) — inoculation prompting as practical mitigation; mild framing variant preferred.
- [Reward Hacking in Self-Improving Code Agents (Kernel-Bench/ALE-Bench, 2025)](https://arxiv.org/html/2601.20103v1) — proxy-real eval gap widens with optimization depth; justifies bounded retry depth.
- [Posterior-GRPO (P-GRPO), Fan et al. Aug 2025](https://arxiv.org/html/2508.05170v2) — gate reasoning rewards on outcome correctness; matches STZ's eval-gate-before-judge design.
- [GRPO · DeepSeekMath (2024) — verl docs reference](https://verl.readthedocs.io/en/latest/algo/grpo.html) — group-relative advantage formulation A_i = (r_i − mean) / std adopted at the harness selection layer.
- [Empirical Evaluation of Property-Based Testing in Python (OOPSLA 2025)](https://cseweb.ucsd.edu/~mcoblenz/assets/pdf/OOPSLA_2025_PBT.pdf) — property-based tests kill ~50× more mutants than unit tests; 76% of mutations caught in first 20 PBT inputs. Justifies PBT as a core layer of the sealed held-out suite.
- [OpenHands (paper + V1 SDK)](https://arxiv.org/pdf/2407.16741.pdf) — event-sourced append-only architecture, deterministic replay; influences STZ's audit-trail-as-deliverable design (adapted to markdown + git + state.json rather than an event log).
- [SWE-agent · ACI design doc](https://github.com/SWE-agent/SWE-agent/blob/main/docs/background/aci.md) — tools shape outcomes; linter-on-edit; specialized file viewer.
- [Aider · architecture overview](https://agentwiki.org/aider) — git-native, repo map, model-agnostic.
- [MetaGPT · multi-agent SOP framework](https://github.com/geekan/MetaGPT) — SOP-driven multi-role decomposition.
- [ChatDev (arXiv 2307.07924)](https://arxiv.org/html/2307.07924v5) — chat chain across design/coding/testing; communicative dehallucination.
- [AutoCodeRover (arXiv 2404.05427)](https://arxiv.org/abs/2404.05427) — AST-based program-structure search, spectrum-based fault localization.
- [Cognition · Devin 2.0 (March 2025)](https://cognition.ai/blog/devin-2) — multiple parallel Devins per task; planner / coder / critic separation; ACU cost metering.
