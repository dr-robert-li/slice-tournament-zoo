The right evolution is to make STZ a **contract-driven arena harness** on top of Claude Code, where the arena preserves the “tournament zoo” ontology, the contract bounds the search, and the ledger turns adaptation into defensible project-local RSI. [arxiv](https://arxiv.org/html/2604.16314v1)

## Target system

STZ should become a plugin harness with three first-class objects: **Contract**, **Arena**, and **Ledger**. The contract defines what “correct, useful, well-architected” means for a project slice; the arena lets sub-agents explore implementations, tests, specs, and heuristics in isolation; the ledger is the only path by which anything becomes trusted project knowledge or default harness behavior. [iclr](https://iclr.cc/virtual/2026/10018717)

At a systems level, the main loop is:

```text
User Intent
  -> Contract Co-Build
  -> Arena Run
  -> Verifier Triad
  -> Candidate Selection
  -> Learning Distillation
  -> Promotion Review
  -> Ledger
  -> Better Future Runs
```

This directly addresses the current STZ ceiling: tests remain necessary, but they stop being the only correctness object. SelfEvolve’s TDD results support making contract/spec formation precede implementation, while PostTrainBench and reward-hacking work show why sub-agents must not control trusted state or hidden evaluation surfaces. [iclr](https://iclr.cc/virtual/2026/10018648)

## Architectural principles

The implementation plan should obey seven non-negotiable principles.

1. **Contract before code.** Every arena run targets an approved contract slice, not a free-form prompt. [arxiv](https://arxiv.org/html/2604.16314v1)
2. **Creative freedom only inside the arena.** Sub-agents can branch, mutate, refactor, and speculate, but only in isolated candidate workspaces. [arxiv](https://arxiv.org/html/2603.22791v1)
3. **No direct writes to trusted state.** Arena agents cannot mutate promoted contract artifacts, promoted knowledge, or ledger history. [iclr](https://iclr.cc/virtual/2026/10018717)
4. **Triangulated verification.** Candidate ranking uses execution, contract/spec, and rubric signals, not tests alone. [iclr](https://iclr.cc/virtual/2026/10018679)
5. **Typed persistence only.** Persisted learnings are artifacts with schemas, provenance, and promotion evidence.
6. **Selective retrieval, not memory dumping.** Future runs consume only promoted, code-grounded artifacts with explicit triggers.
7. **Per-project boundedness.** STZ claims project-local improvement, not abstract general RSI.

## System blueprint

### Contract plane

The contract is the canonical bounded object. It is not a single document; it is a typed graph.

Recommended structure:

```text
.stz/
  contract/
    contract.yaml
    requirements/
    predicates/
    specs/
    rubrics/
    architecture/
    traceability/
    versions/
```

Core artifact classes:

| Artifact | Purpose | Promotion gate |
|---|---|---|
| Requirement | User/business intent | Human approval |
| Predicate | Minimal verifiable condition | Human or maintainer approval plus validation |
| Behavior spec | Pre/post/invariant semantics | Verifier-backed and linked to requirement |
| Acceptance test | Executable check | Must discriminate at least one bad candidate when practical |
| Rubric | Architectural/semantic scoring criteria | Must improve ranking on calibration tasks |
| Architecture rule | Project norms and boundaries | Human approval plus repo evidence |
| Traceability edge | Links requirement -> predicate -> test/spec/code | Auto-generated, validated |

Suggested `requirement` schema:

```yaml
id: req.reporting.csv-export.v1
kind: requirement
state: accepted
title: CSV export of visible report rows
statement: Users can export the currently visible report as CSV.
rationale: Downstream spreadsheet workflows.
owner: user
acceptance:
  predicates:
    - pred.reporting.csv.includes-visible-rows.v1
    - pred.reporting.csv.includes-header-row.v1
    - pred.reporting.csv.no-filter-mutation.v1
  tests:
    - test.reporting.csv.visible-rows.v1
  rubrics:
    - rubric.reporting.export.boundary.v1
risk:
  severity: medium
  surfaces:
    - reporting
    - permissions
```

Suggested `predicate` schema:

```yaml
id: pred.reporting.csv.no-filter-mutation.v1
kind: predicate
state: accepted
requirement: req.reporting.csv-export.v1
type: invariant
scope:
  symbols:
    - ReportFilters
    - exportCsv
assertion:
  before: report.filters
  after: report.filters
  relation: equal
severity: high
```

Contract state machine:

```text
draft -> proposed -> accepted -> active -> challenged -> superseded | sunset
```

Important policy: contract changes are **proposed** by agents but **accepted** only by human approval plus verifier evidence. That asymmetry is what gives STZ boundedness. [iclr](https://iclr.cc/virtual/2026/10018648)

### Arena plane

The arena is the tournament zoo preserved and elevated into the core product metaphor. It is where the harness becomes useful rather than restrictive.

Recommended structure:

```text
.stz/
  arena/
    runs/
      run-<id>/
        manifest.yaml
        contract-slice.yaml
        candidates/
          cand-a/
          cand-b/
          cand-c/
        traces/
        verifier/
        selected/
        learnings/
```

Each candidate gets:
- isolated git worktree or branch,
- scoped context packet,
- explicit objective,
- tool budget,
- max rounds,
- output schema.

Candidate directory example:

```text
cand-a/
  plan.md
  patch.diff
  changed-files.json
  candidate-tests/
  candidate-specs/
  rationale.md
  verifier-results.json
  trace.jsonl
```

Arena modes:

| Mode | Use case | Freedom | Gate strength |
|---|---|---:|---:|
| `contract-first` | New feature, underspecified task | Medium | High |
| `test-first` | Clear bugfix with repro | Medium | High |
| `spec-first` | Stateful or risky domain logic | Medium | Very high |
| `explore-first` | Novel design space, spike work | High | No promotion by default |
| `refactor-safe` | Internal cleanup | Medium | High regression gate |
| `edge-hunt` | Discover missing predicates/tests | High | Contract proposal only |

This keeps the “zoo” ontology: the arena is explicitly a habitat for competing candidate species. The key upgrade is that they compete against a contract, not just a test suite.

### Ledger plane

The ledger is the only trusted persistence path.

Recommended structure:

```text
.stz/
  ledger/
    events.jsonl
    promotions.jsonl
    regressions.jsonl
    sunsets.jsonl
    evaluations/
```

Event types:
- `run_started`
- `contract_proposed`
- `contract_accepted`
- `candidate_scored`
- `candidate_selected`
- `learning_distilled`
- `artifact_promoted`
- `artifact_quarantined`
- `artifact_rejected`
- `artifact_sunset`

Promotion record example:

```json
{
  "promotion_id": "promo_000142",
  "timestamp": "2026-07-01T13:00:00Z",
  "repo": "project-x",
  "subject": {
    "kind": "search_heuristic",
    "id": "heuristic.reporting.inspect-filter-state.v1"
  },
  "source_runs": ["run_381", "run_397", "run_411"],
  "baseline_manifest": "manifest.v12",
  "candidate_manifest": "manifest.v12+heuristic1",
  "evaluation": {
    "heldout_tasks": 12,
    "execution_delta": 0.06,
    "contract_delta": 0.08,
    "rubric_delta": 0.05,
    "regressions": 0,
    "cost_delta": 0.03
  },
  "decision": "promote",
  "supersedes": null,
  "sunset_policy": {
    "recheck_after_runs": 25,
    "sunset_if_minor_regressions": 2
  }
}
```

This is how STZ moves from “adaptive harness” to “auditable foundry.”

## Plugin architecture on Claude Code

STZ should be implemented as a Claude Code plugin adapter with strict state control.

Top-level components:

```text
Claude Code
  -> STZ Plugin Adapter
      -> Contract Engine
      -> Arena Manager
      -> Agent Router
      -> Verifier Stack
      -> Artifact Store
      -> Retrieval Engine
      -> Ledger Engine
      -> Evaluation Engine
```

### Plugin adapter

Responsibilities:
- expose slash/CLI commands,
- generate role-specific prompts,
- enforce schema validation,
- prevent forbidden writes,
- collect run telemetry.

Commands:

```text
/stz:init
/stz:contract-draft
/stz:contract-refine
/stz:contract-accept
/stz:arena-run
/stz:verify
/stz:select
/stz:learn
/stz:promote
/stz:ledger
/stz:sunset
/stz:eval
```

Equivalent CLI:

```bash
stz init
stz contract draft "Add CSV export for filtered reports"
stz contract refine
stz contract accept
stz arena run --mode contract-first --candidates 3
stz verify
stz select
stz learn
stz promote
stz eval
```

### Contract engine

Responsibilities:
- generate draft requirements from user intent,
- manage artifact schemas and versions,
- build contract slices for runs,
- maintain traceability matrix,
- validate contract deltas.

Core APIs:
- `draftContract(intent, repoContext)`
- `proposePredicate(requirementId, candidateEvidence)`
- `acceptContractDelta(deltaId, approver)`
- `buildContractSlice(goalId)`

### Arena manager

Responsibilities:
- create per-candidate worktrees,
- materialize context packets,
- spawn sub-agents,
- collect traces and diffs,
- isolate side effects,
- clean up branches.

Core APIs:
- `createRun(goal, mode, candidateCount)`
- `spawnCandidate(runId, role, config)`
- `collectArtifacts(runId)`
- `finalizeRun(runId)`

### Agent router

Responsibilities:
- select sub-agent role topology,
- enforce max rounds and tool budgets,
- keep verifier agents separate from implementation agents,
- manage critique and reranking passes.

Recommended initial roles:
- Contract Architect
- Clarifier
- Test Synthesizer
- Spec Synthesizer
- Rubric Author
- Candidate Patcher
- Edge Explorer
- Rubric Judge
- Contract Verifier
- Promoter
- Ledger Keeper

### Verifier stack

The verifier triad is mandatory.

1. **Execution verifier**
   - build/install,
   - unit/integration tests,
   - static checks,
   - regression suites,
   - optional perf/security checks.

2. **Contract/spec verifier**
   - requirement coverage,
   - predicate checks,
   - pre/post/invariant checks,
   - traceability completeness.

3. **Rubric verifier**
   - architecture boundary adherence,
   - maintainability,
   - compatibility,
   - minimality/locality,
   - repo convention alignment.

Suggested initial scoring:

```text
composite =
  0.45 * execution +
  0.35 * contract +
  0.20 * rubric
```

Hard fails:
- build failure,
- any high-severity predicate failure,
- security regression,
- hidden calibration regression,
- contract coverage below threshold.

The reason for triad verification is well supported by rubric co-evolution work and reward-hacking evidence: quality of criteria matters, and single-proxy optimization drifts badly over time. [iclr](https://iclr.cc/virtual/2026/10018679)

### Artifact store

Store all artifacts in typed namespaces:
- `candidates/`
- `promoted/`
- `quarantined/`
- `sunset/`

Artifact kinds:
- `requirement`
- `predicate`
- `behavior_spec`
- `acceptance_test`
- `rubric`
- `architecture_rule`
- `patch`
- `search_heuristic`
- `repo_note`
- `retrieval_policy`
- `verifier_policy`
- `promotion_decision`

### Retrieval engine

Retrieval must only use promoted artifacts and must be selective.

Policy:
- no raw memory dump,
- retrieve per step or per slice,
- top-k caps by artifact kind,
- include “why retrieved” rationale,
- log whether retrieved items were used.

Suggested limits:
- rubrics: 1-2
- specs: 1-3
- heuristics: 1
- repo notes: 0 by default, 1 only if explicitly whitelisted

This defends against contextual drag and experience misuse while still letting project knowledge compound.

### Evaluation engine

Purpose:
- compare stateless vs stateful STZ,
- run held-out chronological issue streams,
- produce ablations,
- support promotion decisions.

Ablation matrix:
- tests-only,
- tests + rubric,
- tests + contract/spec,
- full triad,
- full triad + promoted knowledge,
- full triad + evolved harness primitive.

## Detailed execution flow

### Flow 1: Contract co-build

1. User states goal.
2. Contract Architect drafts requirements.
3. Clarifier identifies ambiguity and asks questions.
4. Contract Engine converts accepted requirements into predicates.
5. Test Synthesizer proposes acceptance tests.
6. Spec Synthesizer proposes pre/post/invariants.
7. Rubric Author drafts architectural criteria.
8. User approves slice.
9. Contract slice becomes active for arena run.

Outputs:
- accepted requirement artifacts,
- predicate artifacts,
- initial tests/specs/rubrics,
- traceability map.

### Flow 2: Arena run

1. Arena Manager creates run manifest.
2. Retrieval Engine builds minimal context packet.
3. Candidate Patchers spawn in parallel.
4. Edge Explorer spawns separately to find failure modes.
5. Candidates may propose contract deltas but not apply them.
6. Candidate artifacts collected.
7. Verifier triad scores all candidates.
8. Selector ranks candidates.
9. Repair pass may run on top 1-2 candidates.
10. Final candidate selected.

### Flow 3: Learning distillation

1. Compare winning vs losing traces.
2. Cluster repeated success patterns.
3. Distill candidate learnings into typed artifacts:
   - heuristic,
   - rubric improvement,
   - spec pattern,
   - architecture rule proposal,
   - retrieval hint.
4. Promoter evaluates on held-out tasks.
5. Ledger records promote/quarantine/reject.

### Flow 4: Contract evolution

1. Edge Explorer or post-run analysis identifies a genuine missing case.
2. New predicate or requirement delta proposed.
3. Contract Engine links it to evidence.
4. User reviews.
5. If accepted, traceability map updates and future runs consume the tighter contract.

This is the key missing axis in current STZ: edge discovery becomes contract evolution, not merely sharper testing.

## Repo structure

Recommended repository layout:

```text
stz/
  packages/
    core/
      contract/
      arena/
      verifier/
      ledger/
      retrieval/
      evaluation/
      schemas/
    agents/
      contract-architect/
      clarifier/
      test-synthesizer/
      spec-synthesizer/
      rubric-author/
      candidate-patcher/
      edge-explorer/
      rubric-judge/
      contract-verifier/
      promoter/
    plugin/
      claude-code/
    cli/
  examples/
  docs/
```

Per-project working directory:

```text
<repo>/
  .stz/
    config.yaml
    contract/
    arena/
    artifacts/
      candidates/
      promoted/
      quarantined/
      sunset/
    ledger/
    eval/
      calibration/
      issue-stream/
      reports/
```

## Schemas and interfaces

### Primitive schema

```ts
type PrimitiveKind =
  | "planner"
  | "slice"
  | "candidate"
  | "retrieval"
  | "verifier"
  | "promotion"
  | "consolidation";

interface HarnessPrimitive<T> {
  id: string;
  version: string;
  kind: PrimitiveKind;
  description: string;
  config: T;
  inputSchema: object;
  outputSchema: object;
  promotable: boolean;
}
```

### Arena run schema

```ts
interface ArenaRun {
  id: string;
  repo: string;
  goal: string;
  mode: "contract-first" | "test-first" | "spec-first" | "explore-first" | "refactor-safe" | "edge-hunt";
  contractVersion: string;
  candidateCount: number;
  manifestId: string;
  status: "created" | "running" | "verifying" | "selected" | "closed";
}
```

### Candidate schema

```ts
interface Candidate {
  id: string;
  runId: string;
  branch: string;
  role: "candidate-patcher";
  changedFiles: string[];
  proposedContractDeltas: string[];
  scores?: {
    execution: number;
    contract: number;
    rubric: number;
    composite: number;
  };
  hardFails?: string[];
  decision?: "selected" | "rejected" | "repair";
}
```

### Promotion schema

```ts
interface PromotionDecision {
  id: string;
  subjectKind: string;
  subjectId: string;
  sourceRuns: string[];
  baselineManifest: string;
  candidateManifest: string;
  evaluation: {
    sampleSize: number;
    executionDelta: number;
    contractDelta: number;
    rubricDelta: number;
    regressions: number;
    costDelta: number;
  };
  decision: "promote" | "quarantine" | "reject" | "sunset";
}
```

## Security and boundedness controls

Hard boundaries:
- no candidate agent writes to `promoted/`,
- no candidate agent writes to `ledger/`,
- no verifier agent edits implementation,
- no implementation agent authors final rubric used to score itself,
- no candidate sees hidden calibration tasks,
- no automatic promotion from arena to trusted state,
- no raw memory artifact auto-injected into future prompts.

These boundaries are essential because reward hacking is pervasive in recursive code optimization, with proxy gains diverging from real gains as optimization steps increase. [iclr](https://iclr.cc/virtual/2026/10018648)

## Phased roadmap

### Phase 0: Freeze unsafe persistence

Goal: stop direct mutation of trusted state.

Tasks:
- create `.stz/artifacts/candidates` and `.stz/artifacts/promoted`,
- redirect all existing learnings to candidate area,
- create append-only ledger shell,
- add write guard middleware.

Exit criteria:
- current STZ still runs,
- nothing can silently mutate trusted harness behavior.

### Phase 1: Contract kernel

Goal: make contract the canonical bounded object.

Tasks:
- implement schemas for requirement/predicate/spec/rubric,
- add contract draft/refine/accept commands,
- add traceability graph,
- build contract slice compiler.

Exit criteria:
- user can co-build and approve contract slices before implementation.

### Phase 2: Arena runner

Goal: preserve the tournament zoo as the creative engine.

Tasks:
- worktree orchestration,
- candidate spawning,
- run manifests,
- trace collection,
- candidate artifact directories.

Exit criteria:
- multiple isolated candidates can run against one contract slice.

### Phase 3: Verifier triad

Goal: make tests no longer the sole success surface.

Tasks:
- execution verifier integration,
- predicate/spec verifier,
- rubric author and judge separation,
- score aggregation and hard-fail logic.

Exit criteria:
- at least one repo issue where triad changes candidate ranking versus tests-only.

### Phase 4: Ledger and promotion

Goal: create defensible RSI.

Tasks:
- promotion decision engine,
- quarantine/reject/sunset flows,
- immutable JSONL event log,
- evidence report generation.

Exit criteria:
- no trusted artifact change without ledger record.

### Phase 5: Retrieval and project knowledge

Goal: make learnings useful without memory pollution.

Tasks:
- promoted artifact index,
- retrieval triggers,
- top-k caps,
- retrieval explanations,
- ablation flags.

Exit criteria:
- promoted artifacts improve candidate quality or reduce search cost on held-out tasks.

### Phase 6: Contract evolution loop

Goal: let STZ improve the bounded object itself.

Tasks:
- edge-hunt mode,
- contract delta proposals from arena learnings,
- user review UI for new predicates/requirements,
- traceability updates.

Exit criteria:
- at least one genuine edge case discovered in arena becomes a promoted contract artifact.

### Phase 7: Safe primitive evolution

Goal: allow narrow meta-level improvement.

Start with evolvable genes:
- candidate fanout,
- slice granularity,
- verifier weights,
- retrieval top-k,
- repair pass threshold,
- mode selection heuristics.

Exit criteria:
- held-out gain over fixed baseline without regressions.

## 30-day execution plan

### Week 1
- Freeze writes.
- Add artifact store and ledger shell.
- Implement contract schemas and CLI/plugin commands.
- Build contract drafting flow.

### Week 2
- Implement arena worktree manager.
- Add candidate spawning and trace capture.
- Add basic execution verifier.

### Week 3
- Add predicate/spec verification.
- Add rubric author/judge split.
- Integrate composite scoring and selection.

### Week 4
- Add learning distillation.
- Add promotion workflow.
- Run first ablation: tests-only vs full triad.
- Pilot on one real repo issue stream.

Success criterion:
- one project where contract + arena + triad outperforms tests-only on held-out tasks, with at least one promoted artifact and zero severe regressions. [arxiv](https://arxiv.org/html/2604.16314v1)

## 90-day execution plan

By day 90, STZ should have:
- 2-3 repos using contract-first arena flows,
- stable ledger-backed promotion,
- retrieval from promoted artifacts,
- measurable stateful gain over stateless baseline,
- at least one promoted rubric family,
- at least one promoted heuristic family,
- at least one promoted contract delta originating from edge exploration.

## Product and UX details

The UX should emphasize three visible views:

1. **Contract view**
   - requirements,
   - predicates,
   - acceptance tests,
   - traceability,
   - approvals.

2. **Arena view**
   - candidate habitats,
   - scores,
   - traces,
   - diffs,
   - rerank reasons.

3. **Ledger view**
   - promotions,
   - quarantines,
   - sunsets,
   - evidence deltas,
   - calibration outcomes.

This preserves the “zoo” identity while making the system legible to serious engineers.

## What not to do

- Do not start by evolving prompts globally.
- Do not persist free-form notes into runtime context.
- Do not claim general self-improvement from benchmark gains alone.
- Do not let candidate-generated tests justify themselves without independent signals.
- Do not merge contract and implementation into one mutable blob.

## Converged recommendation

The correct implementation path is to rebuild STZ around a **Contract Plane**, an **Arena Plane**, and a **Ledger Plane**, in that order. The arena remains the creative heart of STZ and should preserve the tournament-zoo ontology, but it must now operate against a co-built, versioned project contract and feed only typed, evidence-backed learnings into the ledger. That is the narrowest architecture that still gives you usable, high-quality, well-architected software while creating a real, defensible story of bounded RSI. [arxiv](https://arxiv.org/html/2603.22791v1)