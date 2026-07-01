# STZ 0.9.6 — Earned-Capability Phased Implementation Plan
## Contract Plane · Arena Plane · Ledger Plane — Bounded, Project-Local RSI

> **Source of truth for this plan:** `experiments/0.9.6-evolution/q-n-a.md` (research
> Q&A, final converged section lines 7436–7821), the earned-negative audit
> (q-n-a.md §3953–4022), `docs/PAPER.md`, and the shipping 0.9.5 code under `src/`.
> Companion plans `ITERATIVE-PLAN.md` (three-plane blueprint) and
> `PAPER-INFORMED-PLAN.md` (paper-mapped superset) are **input material, not the build
> order** — this document is the build order.

---

## 0. What this plan is, and is not

This is an **earned-capability roadmap**. Each capability is a *gate*, not a deadline.
A phase graduates only after it demonstrates **repo-local, non-regressive SWE
improvement on chronological held-out work**. If a phase returns null or mixed
evidence, the roadmap **stops there** and STZ remains a useful harness rather than a
speculative RSI science project (q-n-a.md §7458).

**It is NOT a rebuild.** STZ 0.9.5 already ships the arena, the ledger substrate, the
execution verifier, the promotion gate, and evolvable genes. This plan *extends the
existing flat `src/`* — no monorepo `packages/` split, no FAISS, no Python runtime
pre/post/invariant instrumentation, no global prompt evolution. Those were the
non-implementable or premature parts of the companion plans (q-n-a.md §7493–7498,
§7544, §7634–7642).

**The one thing it funds** (the genuine, un-crossed hypothesis — q-n-a.md §4008–4016):

> Does a **contract-grounded exogenous correctness object** (typed predicates,
> architecture rules) — used as the *definition of winner* rather than as a post-hoc
> oracle — change **which candidate wins, measured on held-out truth**?

STZ's proven negatives all reweighted **sealed-suite-derived** signals. The contract
plane introduces a **different signal class** (typed-predicate satisfaction +
architectural conformance) that is *not derivable from a functional test suite*. That
is the delta. Everything else in this plan is scaffolding to test it safely and, if it
proves out, to persist it as defensible project-local RSI.

---

## 1. The earned negatives — what this plan must NOT re-derive

From `docs/PAPER.md` via the q-n-a audit (§3953–4006). These are closed with strong
epistemic discipline. Re-deriving any is a 10× waste.

| Closed hypothesis | Status | This plan's obligation |
|---|---|---|
| Sealed-steered iterate-to-green loop (0.8.0) | ⛔ ruled out | No per-slice convergence loop. Keep best-of-N. |
| Judge-beyond-suite per-slice iteration | ⛔ ruled out twice | Judge is a **one-time authoring** instrument only, never a per-slice selection loop. |
| Numeric selection-gene reweighting as evolution | ⛔ ruled out structurally | No gene that reweights sealed-derived proxies (pass/coverage/kill). |
| Suite-sharpening as a broad competency lever (homogeneous pools) | ⛔ ruled out | Contract signal must be **non-suite-derived** or it reproduces the ceiling. |
| SWE-Bench as a deciding instrument | ⛔ silent (contaminated) | Demonstration-only. Never a graduation gate. |

**What STZ positively confirmed — preserve exactly (§3967–3975):**

1. `harness-mine` + `harness-promote-mutator` — suite-sharpening is a real one-time
   amortised gain. **Keep.**
2. The **six-gate promotion guard** (`promotionGate` in `src/harness.ts:285`) correctly
   halts when a sharper genome ties the incumbent on `truth_full`. **This is the single
   most important structural property to preserve.** The 0.9.6 ledger extends it, never
   loosens it.
3. The **judge as one-time selection/authoring instrument** (found the `5abc` bug past a
   green suite). **Keep this use only.**
4. The **synthetic recall-free substrate with sealed/truth split** is the *only*
   trustworthy evaluation instrument. **Mandatory for every 0.9.6 experiment.**

**The load-bearing safeguard (Phase 1 go/no-go — §4018–4022):** before building the
contract layer, run a **separation-gate pre-registration**: confirm a
naive-but-plausible implementation **passes the functional sealed suite but fails at
least one contract predicate**. If no such separation exists on the substrate, the
contract layer adds no new selection signal and the whole line stops at Phase 0. This is
the exact STZ separation-gate pattern applied to the new hypothesis class — the cheapest
possible insurance against building an expensive null.

---

## 2. Five hard principles (q-n-a.md §7440–7442)

1. **Contract before code.** Every arena run targets an accepted contract slice, not a
   free-form prompt.
2. **No direct writes to trusted state.** Arena sub-agents cannot mutate promoted
   contract artifacts, promoted knowledge, seal, or ledger history.
3. **Human approval for any trusted contract mutation.** Agents *propose* contract
   deltas; humans alone *accept*. This asymmetry is what gives STZ boundedness and is the
   only exogenous signal (α>0) in the system.
4. **No bulk memory injection.** Retrieval is selective, per-step, capped, explained
   (CTIM-Rover: one noisy word steers to the wrong function).
5. **No graduation without held-out repo-local improvement.** Internal artifact counts
   are not evidence.

**Platform constraint:** every phase is implementable through Claude Code's *actual*
model — markdown-defined subagents that **return text (not typed TS objects)**, git
worktree isolation, JSON-schema validation with parse/validate/retry, and hooks-based
control surfaces. No imagined typed-subagent APIs (q-n-a.md §7442, §7580).

---

## 3. Target triad — mapped onto the existing codebase

The end state is the Contract / Arena / Ledger triad. Crucially, **two of the three
planes already exist** in 0.9.5; only the Contract plane is net-new.

```
┌─────────────────────────── CONTRACT PLANE (NET NEW — Phases 1,3) ───────────────────┐
│ .stz/contract/{requirements,predicates,deltas}/  ·  typed artifacts w/ state machine │
│ draft → proposed → accepted(human 7th gate) → active → challenged → superseded|sunset │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                         │ every run targets an ACCEPTED contract slice
┌───────────────────────────────────────▼──────────────────────────────────────────────┐
│ ARENA PLANE  (EXISTS — extend, do not rebuild)                                         │
│ harness.ts · selection.ts · specimen worktrees · manifests · seal.ts · diversity.ts   │
│ 0.9.6 adds: contractSliceId on manifests · scoped context packets · run modes ·       │
│             contract-verifier scoring · edge-hunt → predicate proposals               │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                         │ typed, evidence-backed learnings only
┌───────────────────────────────────────▼──────────────────────────────────────────────┐
│ LEDGER PLANE  (EXISTS as seal/MANIFEST — extend with event JSONL + 7th gate)          │
│ 60-harness/MANIFEST.json (append-only archive) · six-gate promotionGate (harness.ts)  │
│ 0.9.6 adds: .stz/ledger/events.jsonl · human-accept gate for contract-bearing kinds   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Reuse map (do not reinvent):**

| Triad need | Already in 0.9.5 | 0.9.6 action |
|---|---|---|
| Arena / tournament / worktrees | `harness.ts`, `selection.ts`, specimen prototype dirs | extend: add `contractSliceId`, context packet |
| Execution verifier | `eval-runner.ts`, `seal.ts` sealed suite + best-of-N | keep as-is; becomes one leg of the triad |
| Rubric / judge | `stz-judge` agent, `judge-reliability.ts` calibration | reuse for one-time rubric authoring only |
| Promotion gate | `promotionGate` six gates (`harness.ts:285`) | extend: add 7th human-accept gate for contract kinds |
| Ledger substrate | `60-harness/MANIFEST.json` append-only, content-addressed | add parallel `.stz/ledger/events.jsonl` event stream |
| Evolvable genes | `HarnessGenome` G1–G6 (`types.ts:355`) | add G7 contract/spec-crystallization gene (Phase 7 only) |
| Edge discovery | `harness-mine` + `harness-promote-mutator` | reuse mechanism; route survivors to **contract** proposals, not only sealed tests |
| Eval substrate | recall-free synthetic, sealed/truth split | mandatory instrument for every graduation |

---

## 4. Phase ladder (q-n-a.md §7446–7456)

| Phase | Adds | Precondition | Unlock condition (earned) |
|---|---|---|---|
| **0** | Measurement + safety baseline | 0.9.5 runs reliably | Stable, reproducible chronological baseline metrics |
| **1** | Contract kernel + human 7th gate | Phase 0 | **Separation gate passes** AND accepted predicates improve review/selection quality |
| **2** | Contract-aware arena wiring | Phase 1 positive | Contract slices change candidate behaviour with no regressions |
| **3** | Contract verifier + edge→predicate loop | Phase 2 positive | ≥1 accepted predicate catches a previously passing-but-wrong output |
| **4** | Rubric-lite verifier (reranking only) | Phase 3 positive | Rubric changes ranking on held-out tasks, beats tests-only, cost-justified |
| **5** | Promotion ledger for trusted artifacts | Phase 4 positive | ≥1 non-test artifact survives promotion, is reused, no regression |
| **6** | Selective retrieval of promoted predicates | Phase 5 positive | Retrieval improves success or cost on held-out tasks, no misdirection |
| **7** | Safe gene tuning (low blast radius) + G7 | Phase 6 positive | Fixed-manifest baseline beaten, no new regressions |
| **8** | Optional high-risk frontier modules | Phase 7 positive | Only if repeated evidence + manual approval per trial |

Each phase carries three gates: **promotion gate** (held-out improvement), **safety
gate** (no severe regression / no trusted-state corruption / no cost explosion), and a
**null-stop** (flat or negative → freeze at current phase).

---

## 5. Phases in detail

Legend for file actions: **MODIFY** = extend an existing 0.9.5 file · **CREATE** = new
file in the flat `src/` tree (no monorepo) · **AGENT** = markdown subagent under
`agents/` · **CMD** = slash command under `commands/`.

---

### Phase 0 — Measurement & safety baseline
**Duration:** Days 1–10 · **Risk:** Low · **Prereq:** 0.9.5 stable.

**Goal.** Prove you can *measure* "better SWE outcomes" before claiming any
self-improvement. Evaluation must be **chronological, held-out, repo-local**. Shuffled
or benchmark-only comparisons distort improvement claims (q-n-a.md §7462).

**Files.**
- **MODIFY** `src/harness.ts` — `emitRunManifest(runId)`: write a per-run manifest to
  `.stz/manifests/manifest_<runId>.json` capturing genome id, gene values, substrate,
  mode. Manifest emission **only** — no new primitive infrastructure yet.
- **CREATE** `src/eval/chronological-stream.ts` — declare three immutable splits over
  real STZ (or one adjacent repo) issues:
  `trainingLike` (learnings originate here) · `promotionHoldout` (justifies promotions) ·
  `finalReportHoldout` (untouched until milestone review). Chronological order enforced;
  never shuffled.
- **CREATE** `src/eval/reviewer-outcome.ts` — reviewer outcome schema:
  `{ issueId, verdict: 'accepted'|'accepted-with-edits'|'rejected', rejectionReason?: string }`.
- **CREATE** `src/eval/baseline-report.ts` — emit `RepoMetrics` (below) for three
  baseline conditions: **STZ stateless**, **STZ stateful (0.9.5)**, **human-assisted**.
- **CMD** `commands/stz-eval.md` → `/stz:eval` — run the baseline report on demand.

**Baseline `RepoMetrics` (per repo, never global — q-n-a.md §1380–1405):**
issue-resolution rate · time-to-first-correct-patch · regression-free success rate ·
human acceptance rate · accepted-with-edits rate · cost per resolved issue.

**Exit gate.** ≥8–12 chronological held-out issues locked; baseline report reproducible
across two runs; **no new adaptive behaviour introduced**.

**Kill criterion.** If baseline metrics are unstable across two runs, **do not add any
learning feature** — fix measurement first.

---

### Phase 1 — Contract kernel + human 7th gate  ★ the funded delta
**Duration:** Days 11–25 · **Risk:** Low–Medium · **Prereq:** Phase 0 exit.

**Goal.** Introduce the **contract** as a typed, bounded, human-gated correctness object.
A contract is *not* a full formal spec system — it is a typed layer of `requirement`,
`predicate`, `contract_delta`, each with provenance, symbol anchors where relevant, and
an explicit state machine (q-n-a.md §7484).

**★ Go/no-go FIRST: the separation-gate pre-registration** (q-n-a.md §4018–4022).
Before writing kernel code, on the recall-free substrate:
1. Author 3–5 candidate predicates for an existing substrate slice.
2. Construct a naive-but-plausible implementation that **passes the sealed suite**.
3. Confirm it **fails ≥1 predicate**.
- **PASS** → separation exists; the contract signal is real; build the kernel.
- **FAIL** (no naive impl separates suite-pass from predicate-fail) → the contract layer
  carries no new signal on this substrate. **STOP the contract line. Freeze at Phase 0.**
Record the pre-registration and result in `experiments/0.9.6-evolution/separation-gate.md`
under the symmetric-error rule (report the negative as loudly as the positive).

**Files (only if separation gate PASSES).**
- **CREATE** `.stz/contract/{requirements,predicates,deltas}/` per project.
- **CREATE** `src/contract/contract-types.ts` — schemas + state machine:
  ```ts
  type ContractState = 'draft'|'proposed'|'accepted'|'active'|'challenged'|'superseded'|'sunset';
  type PredicateType = 'invariant'|'postcondition'|'non-mutation'|'boundary-condition'|'compatibility-check';
  interface Requirement { id; kind:'requirement'; state:ContractState; title; statement;
      rationale; owner; acceptance:{predicates:string[]; tests:string[]}; risk:{severity;surfaces:string[]}; provenance }
  interface Predicate { id; kind:'predicate'; state:ContractState; requirement:string;
      type:PredicateType; scope:{symbols:string[]}; assertion:object; severity:'low'|'medium'|'high';
      provenance:{ proposedByRun:string; acceptedBy?:string; acceptedAt?:string } }
  interface ContractDelta { id; kind:'contract_delta'; state:ContractState;
      op:'add'|'modify'|'sunset'; target:string; evidenceRuns:string[]; provenance }
  ```
- **CREATE** `src/contract/contract-engine.ts` — `draftContract(intent, repoContext)`,
  `proposePredicate(reqId, evidence)`, `acceptContractDelta(deltaId, approver)`,
  `buildContractSlice(goalId)` (compiles accepted artifacts into a run-ready slice).
- **CREATE** `src/contract/traceability.ts` — requirement → predicate → test/spec/code
  edges; auto-generated, validated.
- **AGENT** `agents/stz-contract-architect.md` — drafts requirements from user intent.
  Tools: Read/Glob/Grep. Writes candidate artifacts only.
- **AGENT** `agents/stz-clarifier.md` — surfaces ambiguity, asks the human targeted
  questions before a slice is accepted.
- **AGENT** `agents/stz-contract-verifier.md` — checks predicate well-formedness,
  symbol-anchoring, non-vacuity. Scores only; writes nothing trusted.
- **CMD** `commands/stz-contract.md` → `/stz:contract-draft|refine|accept`.

**The human 7th gate.** No predicate or contract delta becomes `accepted` without an
explicit human approval event. Enforced in `contract-engine.acceptContractDelta` — the
`approver` field is mandatory and must be a human identity, never an agent role. This
is the α>0 exogenous signal.

**Do NOT add here** (q-n-a.md §7493): Python spec execution · FAISS/semantic memory ·
monorepo split · gene evolution.

**Success metrics.** Human acceptance rate of proposed predicates · predicate clarity
score from maintainers · reduction in ambiguity-driven candidate churn · evidence that
accepted predicates are specific enough to anchor future runs.

**Exit gate → Phase 2.** Separation gate passed **and** accepted contracts materially
reduce "wrong problem solved" failures or improve human-review efficiency on held-out
issues.

**Kill criterion.** Separation gate fails, OR human acceptance rate of proposed
predicates is near zero (agents cannot propose useful predicates) → freeze.

---

### Phase 2 — Contract-aware arena wiring
**Duration:** Days 26–40 (first half) · **Risk:** Medium · **Prereq:** Phase 1 positive.

**Goal.** Wire the contract into the **existing** arena. The arena plane already exists
in `harness.ts`, `selection.ts`, manifests, and worktree behaviour — reuse it. Every run
simply must target an **accepted contract slice** (q-n-a.md §7514).

**Files.**
- **MODIFY** `src/types.ts` — add `contractSliceId: string` to the run manifest and
  `ArchiveEntry`.
- **MODIFY** `src/harness.ts` — run rejects if no accepted contract slice is bound.
  Build a **scoped context packet** per candidate: `{ issue, contractSlice, allowedFiles,
  budget, mode }`.
- **MODIFY** `src/injector.ts` — inject the contract slice into candidate context (still
  no bulk memory; contract slice only).
- **MODIFY** `src/diversity.ts` / `src/selection.ts` — candidates may emit
  `proposedContractDeltas` but **cannot apply them**.
- **CREATE** `src/arena/run-modes.ts` — mode selector:
  `contract-first` (underspecified features) · `test-first` (crisp bugfix with repro) ·
  `mixed` (default) · `edge-hunt` (discover missing predicates, **no auto-promotion**).
- Reuse Claude Code **worktree isolation** for candidate separation — no architectural
  replatforming (q-n-a.md §7520).

**Success metrics.** % of runs that respect contract-slice boundaries · reduction in
spurious broad edits · lower variance between candidate branches · no increase in
regressions or cost.

**Exit gate → Phase 3.** Contract-bounded arena runs outperform free-form runs on
held-out repo tasks, **or** produce cleaner human-review outcomes — with no regression
or cost blowout.

**Kill criterion.** Contract binding degrades candidate quality or inflates cost with no
review benefit → freeze at Phase 2, keep the contract kernel as a human-facing spec tool.

---

### Phase 3 — Contract verifier + edge→predicate loop  ★ the novel evolution axis
**Duration:** Days 26–40 (second half) · **Risk:** Medium · **Prereq:** Phase 2 positive.

**Goal.** Add a **contract verifier** and the **edge→predicate loop** — the most novel,
repo-relevant improvement path. **Stay at the level of typed predicates and observable
run evidence.** Do **not** attempt runtime pre/post/invariant instrumentation across
arbitrary repos — that was the clearest non-implementable part of the earlier plans
(q-n-a.md §7544).

**Machine-checkable-where-cheap predicates only** (q-n-a.md §7549, §7553–7559):
- diff checks ("only files under X may change")
- test-outcome checks
- file/JSON/schema invariants
- CLI output checks ("subcommand preserves backward-compatible flags")
- targeted AST assertions ("no mutation of public interface Y", "no new dependency")

**Files.**
- **CREATE** `src/verifiers/contract-verifier.ts` — evaluates a candidate diff against
  the accepted predicate set; emits `{ predicateId, pass, evidence, severity }[]`.
  High-severity predicate failure = hard fail (feeds the promotion gate, never bypasses
  it).
- **MODIFY** `src/selection.ts` — contract verdict becomes a **primary selection signal**
  (the funded delta: contract as *definition of winner*, evaluated **before** test
  execution weighting, not as a post-hoc supplement — q-n-a.md §4014).
- **AGENT** `agents/stz-edge-explorer.md` — an `edge-hunt`-mode sub-agent that emits
  **candidate predicate proposals** when it finds a real missing case. Reuses the
  existing `harness-mine` survivor mechanism, but routes survivors to *contract
  proposals*, not only sealed tests. No auto-promotion.
- **MODIFY** `src/contract/contract-engine.ts` — human review flow to accept/reject
  edge-discovered predicates (routes through the Phase 1 7th gate).

**This is the key missing axis in current STZ:** edge discovery becomes **contract
evolution**, not merely sharper testing (q-n-a.md §505, §7544).

**Success metrics.** # edge discoveries converted to accepted predicates · rate at which
accepted predicates later block incorrect candidates · reduction in "tests pass but
behaviour still wrong" outcomes.

**Exit gate → Phase 4.** ≥1 accepted predicate **demonstrably changes candidate
selection or prevents a regression that tests alone did not prevent**, on held-out work.
This is the empirical proof that the funded hypothesis is true on this repo.

**Kill criterion.** No predicate ever changes selection vs tests-only after N runs →
the contract signal is redundant with the suite on this repo. Freeze at Phase 3; the
contract remains a documentation/review asset, not an RSI lever. **Report the negative.**

---

### Phase 4 — Rubric-lite verifier (reranking only)
**Duration:** Days 41–60 (if Phase 3 positive) · **Risk:** Medium · **Prereq:** Phase 3 positive.

**Goal.** Add a **minimal** rubric-lite verifier — *not* the full verifier triad from the
paper-informed plan. Rubric-based gains are real **only when criteria are authored
before patch generation** (Agentic Rubrics, +3.5pp SWE-Bench Verified — but that
benchmark is now contaminated, so held-out repo work is the real test). Building a heavy
rubric system too early replays the null at extra cost (q-n-a.md §7574, §342).

**Files.**
- **AGENT** `agents/stz-rubric-author.md` — authors a repo-grounded `rubric.yaml`
  **before** any patch, with anchored criteria: locality, interface compatibility,
  boundary adherence, repo-convention fit. Reuses `stz-judge` / `judge-reliability.ts`
  calibration infrastructure. Cannot see patches.
- **AGENT** `agents/stz-rubric-judge.md` — scores candidates against the pre-authored
  rubric. **Must not be the agent that authored the patch or the rubric** (no
  self-approval — reuses the evaluator-capture guard in `hack-detector.ts`).
- **CREATE** `src/verifiers/rubric-verifier.ts` — strict **JSON/YAML parser + validator +
  retry** wrapper (Claude Code subagents return text, not TS objects — q-n-a.md §7580).
- **MODIFY** `src/selection.ts` — rubric score is a **reranking input only**, never a
  promotion signal by itself. No rubric promotion yet.

**Constraints.** Rubric score ⇒ reranking, not promotion · patcher ≠ rubric author ·
one-time authoring, never a per-slice iteration loop (respects the ruled-out negative).

**Success metrics.** Fraction of issues where rubric changes top-candidate ranking ·
human-reviewer agreement with the rubric-changed winner · cost overhead per issue.

**Exit gate → Phase 5.** Rubric-lite produces measurable reranking benefit on held-out
tasks without disproportionate cost.

**Kill criterion.** Rubric never changes the winner, or reviewer disagrees with
rubric-changed winners → freeze at Phase 4 (contract + arena only).

---

### Phase 5 — Promotion ledger for trusted artifacts
**Duration:** Weeks 9–10 · **Risk:** Medium · **Prereq:** Phase 4 positive.

**Goal.** Introduce the **promotion ledger** as the auditable persistence path — but only
for artifacts already shown to matter (predicates, contract deltas, optionally rubric
templates). Rebuilding a whole ledger plane before proving signal duplicates what
`seal.ts` / MANIFEST already do (q-n-a.md §7601). **Incremental, reuse-first.**

**Files.**
- **CREATE** `src/ledger/events.ts` — append-only `.stz/ledger/events.jsonl`. Event
  types: `artifact_proposed` · `artifact_accepted` · `artifact_quarantined` ·
  `artifact_rejected` · `artifact_sunset`. Never overwrite.
- **CREATE** `src/ledger/promotion-engine.ts` — promotion decision requires **all of**:
  human approval for contract-bearing artifacts (7th gate) · no held-out regression ·
  positive effect on downstream selection/outcome · explicit evidence links to runs.
- **MODIFY** `src/harness.ts` — **extend `promotionGate` (line 285), never loosen it.**
  Add the 7th gate `humanAccepted` for contract-bearing kinds alongside the existing six
  (`beatsIncumbent, hackClean, sealOk, interfaceParity, diversityOk, rubricCalibrated`).
  The six-gate halt-on-tie property is preserved verbatim.
- **MODIFY** `src/types.ts` — `ArchiveEntry.gates` gains `humanAccepted?: boolean`.
- **CMD** `commands/stz-promote.md` → `/stz:promote`; `commands/stz-ledger.md` → `/stz:ledger`.

**Promotion states.** `candidate → accepted → quarantined → rejected → sunset`.

**Success metrics.** ≥1 promoted contract artifact reused in a later run · ≥1 quarantine
decision proving the guardrail fires · **zero** severe regressions from promoted
artifacts · promotion precision.

**Exit gate → Phase 6.** ≥1 non-test artifact survives promotion, is reused, and causes
no regression; the quarantine path has fired at least once (mechanism confirmed).

**Kill criterion.** Any promoted artifact corrupts harness behaviour, or nothing ever
qualifies for promotion → freeze; keep manual acceptance only.

---

### Phase 6 — Selective retrieval of promoted predicates
**Duration:** Weeks 11–12 · **Risk:** Medium · **Prereq:** Phase 5 positive.

**Goal.** Add **selective retrieval** — but only of promoted predicates and accepted
contract artifacts. **No FAISS, no sidecar vector DB, no ESRM memory primitives** — the
paper-informed plan overreaches here. Start with deterministic retrieval from local files
(q-n-a.md §7634–7642).

**Files.**
- **CREATE** `src/knowledge/retrieval.ts` — deterministic symbol/key/path matching, plus
  BM25-style text search only if needed. Retrieve **1–3 items per step**, capped by kind.
- **CREATE** `src/knowledge/retrieval-explainer.ts` — every retrieved artifact records
  *why it was selected* and *whether it was actually used*. Logged for audit.
- **MODIFY** `src/injector.ts` — **delete any bulk-injection path.** Only the
  SelectiveRetriever feeds promoted artifacts into context.

**Allowed retrieved kinds:** accepted predicates · accepted contract deltas · (later)
one accepted rubric family. **Disallowed:** free-form repo notes (default off) ·
candidate patches · raw past traces in prompts.

**Success metrics.** Retrieval utility (% of runs where a retrieved artifact changes rank
or improves success) · cost delta · context-bloat rate · **wrong-function steering
incidents** (must stay ~0 — the CTIM-Rover failure mode).

**Exit gate → Phase 7.** Retrieval improves repo-local outcomes or reduces search cost
with **no** increase in noisy misdirection.

**Kill criterion.** Any measurable wrong-function steering, or no utility → freeze;
retrieval stays off by default.

---

### Phase 7 — Safe gene tuning + G7 crystallization gene  ★ first true self-improving phase
**Duration:** Weeks 13–16 · **Risk:** Medium–High · **Prereq:** Phase 6 positive.

**Goal.** The first genuine **self-improving harness** phase — but only on
**low-blast-radius knobs**. Evolve *policy values*, not system logic. Much narrower than
the original proposal (q-n-a.md §7670).

**Allowed genes (extend `HarnessGenome`, `types.ts:355`):**
- existing G6 `fanout` / `votesPerPair` (candidate branch count) — already bounded ints
- reranking threshold
- contract-first vs test-first mode heuristic
- retrieval top-k
- repair-pass on/off
- rubric weight (only if Phase 4 proved rubric value)
- **G7 (new): contract/spec-crystallization heuristic id** — the evolvable heuristic for
  *how the edge-explorer crystallizes a discovered edge into a predicate*. This is the
  harness-altitude improvement axis that is **not derived from the test suite itself**
  (HarnessX validates harness-altitude evolution, +14.5% avg; weakest models improve
  most — q-n-a.md §313–321).

**Never allowed (Tier D — hard-frozen):** promotion thresholds · trusted-write controls ·
orchestrator logic · default knowledge-loading policy · source-rewrite behaviour ·
the six/seven-gate structure itself.

**Files.**
- **MODIFY** `src/types.ts` — add `G7 crystallizationHeuristicId: string` to
  `HarnessGenome`.
- **MODIFY** `src/harness.ts` — gene mutation proposals (one gene per child, HarnessX
  substitution — already the pattern at `bridge.ts:1177`) score fixed baseline manifest
  vs candidate manifest over chronological holdout; require explicit non-regression and
  statistically meaningful improvement; promotion of a gene change goes through the
  **same 7-gate ledger**.
- **CMD** `commands/stz-lineage.md` → `/stz:lineage` — show the DGM-style lineage tree
  (already tracked via `ArchiveEntry.parent`).

**Explicitly NOT re-derived:** numeric reweighting of sealed-derived proxies (ruled out
structurally). G7 evolves the *contract-crystallization* behaviour — a non-suite-derived
signal class — which is why it is fundable where numeric-gene evolution was not.

**Success metrics.** Held-out improvement over fixed baseline · no severe regressions ·
stable or improved cost per resolved issue.

**Exit gate → Phase 8.** Low-risk gene tuning wins **repeatedly** on held-out work.

**Kill criterion.** Gene tuning cannot beat the fixed baseline, or introduces regressions
→ freeze at a fixed manifest; STZ is a stable contract-arena harness without meta-evolution.

---

### Phase 8 — Optional high-risk frontier modules (deferred)
**Duration:** Week 17+ · **Risk:** Highest · **Prereq:** Phase 7 positive + manual approval per trial.

**Goal.** Only now consider the modules that most prior overdesign front-loaded. Not
justified until lower phases produce stable repo-local SWE gains (q-n-a.md §7708).

**Candidate modules (each an independent, human-approved experiment):**
- richer trace comparison for specialist-role discovery (ABSTRAL-style)
- memory-architecture evolution (MemEvolve ESRM) — only if bottleneck is proven to be
  memory, not contract quality
- MOSS-like failure-anchored source-rewrite proposals (propose-only, human-approved,
  never auto-executed)
- broader **cross-repo transfer** experiments (forward-transfer measurement)
- the **heterogeneous frontier-vs-frontier pool** (the one genuine open cell from
  PAPER.md — materially larger, plausibly still negative, expensive; **optional
  experiment, not a default** — q-n-a.md §3977–3983, §4004)

**Hard prerequisites (all).** Multiple stable promotions on record · clear evidence the
current bottleneck is meta-policy quality, not contract quality · manual approval for
every high-risk trial · every trial pre-registered with a null-stop.

---

## 5b. Core execution loops — the triad composing on one SWE task (q-n-a.md §1252–1298)

Two loops, deliberately separated. **Issue solving and learning promotion are distinct
phases** — this prevents "won one issue, therefore rewrite the harness" (q-n-a.md §1296).
The adversarial arena/tournament/zoo sub-agents feed the ledger **only** through the slow
loop, and **only** as typed, evidence-backed, human-gated artifacts.

**Fast loop — one issue (frequent):**

```text
Issue + repo state
  → SlicePlan (bind an ACCEPTED contract slice; reject if none — Phase 2)
  → RubricAuthor (author rubric BEFORE any patch — Phase 4, one-time)
  → SelectiveRetrieval (1–3 promoted predicates, explained — Phase 6)
  → CandidateTournament  ◀── adversarial zoo: N bounded worker specimens in isolated
  │      each candidate emits: patch · test adjustments · optional spec ·           worktrees
  │      rationale · proposedContractDeltas (propose-only, cannot apply)
  → TriadVerify (execution [seal best-of-N] + contract-verifier + rubric-lite rerank)
  → Rerank → Calibration (judge-reliability gate) → Select output patch
  → CandidateLearnings (edge-explorer survivors + deltas → .stz/artifacts/candidates/)
  → LedgerDecision: DEFERRED, not inline
```

Boundary rule: the fast loop **never** writes trusted state. Every learning it produces
lands in `candidates/` as untrusted. Promotion is someone else's job (the slow loop).

**Slow loop — promotion (rare; scheduled or after N issues):**

```text
Gather candidate artifacts (predicates, deltas, rubric templates)
  → Cluster by kind + intent
  → Select those with enough supporting-run evidence
  → Evaluate against held-out CHRONOLOGICAL issue set (promotionHoldout split)
  → Compare baseline manifest vs candidate manifest
  → Require: no severe regression ∧ positive composite gain ∧ (human 7th gate for
    contract-bearing kinds) ∧ existing six gates (beatsIncumbent, hackClean, sealOk,
    interfaceParity, diversityOk, rubricCalibrated) all pass
  → Write .stz/ledger/events.jsonl decision → promote | quarantine | reject | sunset
```

This is the defensible project-local RSI path: adversarial candidates compete against a
**co-built, versioned contract**; only artifacts that survive held-out evaluation **and**
human acceptance become trusted; every trusted-state change leaves an append-only ledger
record. The slow loop runs far less often than the fast loop.

---

## 6. Sub-agent topology & permissions (q-n-a.md §1298–1316)

Strict permission separation prevents self-approval loops and evaluator leakage. All
agents are markdown subagents returning **text**; the harness parses/validates/retries.

| Agent | Writes code | Writes candidate artifacts | Writes trusted/promoted | Reads project knowledge | Phase |
|---|:--:|:--:|:--:|:--:|:--:|
| stz-contract-architect | No | Yes | No | Yes | 1 |
| stz-clarifier | No | Yes | No | Yes | 1 |
| stz-contract-verifier | No | scores only | No | Yes | 1/3 |
| stz-specimen (patcher, exists) | Yes | Yes | No | Limited | 2 |
| stz-edge-explorer | No | proposals only | No | Yes | 3 |
| stz-rubric-author | No | Yes | No | Yes | 4 |
| stz-rubric-judge | No | scores only | No | Yes | 4 |
| execution verifier (`eval-runner`) | No | run outputs only | No | No | exists |
| promoter | No | ledger only | **Yes** (7th-gate) | Yes | 5 |

**Invariants (security/boundedness — q-n-a.md §3581–3593):** no candidate agent writes to
`promoted/` or `ledger/` · no verifier agent edits implementation · no implementation
agent authors the final rubric used to score itself · no candidate sees hidden
calibration tasks · **no automatic promotion from arena to trusted state** · no raw
memory artifact auto-injected into future prompts.

---

## 7. Data model & repo layout — extend flat `src/`, no monorepo

**Engine (extend the existing flat tree — do NOT split into `packages/`):**

```
src/
  # existing 0.9.5 — preserved
  harness.ts  selection.ts  eval-runner.ts  seal.ts  types.ts  injector.ts
  hack-detector.ts  judge-reliability.ts  diversity.ts  bridge.ts  ...
  # new 0.9.6 modules (flat, phase-gated)
  contract/   contract-types.ts  contract-engine.ts  traceability.ts   # Phase 1,3
  arena/      run-modes.ts                                             # Phase 2
  verifiers/  contract-verifier.ts  rubric-verifier.ts                 # Phase 3,4
  ledger/     events.ts  promotion-engine.ts                           # Phase 5
  knowledge/  retrieval.ts  retrieval-explainer.ts                     # Phase 6
  eval/       chronological-stream.ts  reviewer-outcome.ts  baseline-report.ts  # Phase 0
```

**Per-project working state (`.stz/` inside the target repo):**

```
<repo>/.stz/
  config.yaml
  contract/{requirements,predicates,deltas}/
  manifests/               # per-run manifest_<id>.json  (Phase 0)
  artifacts/{candidates,promoted,quarantined,sunset}/
  ledger/events.jsonl      # append-only event stream  (Phase 5)
  eval/{issue-stream,calibration,reports}/
  60-harness/MANIFEST.json # EXISTING append-only archive — unchanged
```

**Per-project `config.yaml` (gates default to Phase state):**

```yaml
project: { id: project-x, mode: bounded-rsi, default_manifest: manifest.repo-x.v1 }
promotion: { min_sample_size: 8, required_positive_delta: 0.03, max_severe_regressions: 0 }
retrieval: { enabled: false, max_items_per_step: 3, allow_repo_notes: false }  # off until Phase 6
verifiers: { execution: true, contract: false, rubric: false }                 # earned per phase
contract:  { human_gate: true }                                                # never false
```

---

## 8. Gates, metrics, kill conditions (q-n-a.md §7724–7772)

**Every phase has three gates:**

| Gate | Required proof |
|---|---|
| Promotion gate | New feature improves held-out repo-local outcomes or reviewer acceptance |
| Safety gate | No severe regression, no trusted-state corruption, no cost explosion |
| Null stop | Flat or negative evidence → **freeze at current phase** |

**Recommended thresholds.** ≥8 held-out issues before any graduation · zero severe
regressions · **≥1 non-test signal improvement for any promotion beyond Phase 2** ·
human approval mandatory for contract-bearing trusted state · cost increase capped unless
outcome improvement justifies it.

**Primary metrics (per repo, never global).** issue-resolution rate · human acceptance
rate · accepted-with-edits rate · regression-free success rate · time-to-first-correct
patch · cost per resolved issue · predicate utility rate · rubric-reranking utility rate ·
retrieval utility rate · promotion precision.

**Secondary.** candidate diversity · reviewer churn · false-predicate rate · quarantine
rate · sunset rate · wrong-function-steering incidents.

**Interpretation rule.** A feature is "earned" only when **primary metrics improve on
held-out repo work**, not when internal artifact counts go up. Publish per repo — bounded
persistence, not assumed transfer.

**Load-bearing eval instrument.** Every graduation experiment runs on the **synthetic
recall-free substrate with sealed/truth split** (the only trustworthy instrument, PAPER.md).
SWE-Bench is demonstration-only, never a gate.

---

## 9. Concrete first 60 days (q-n-a.md §7774–7805)

| Days | Work | Stop condition |
|---|---|---|
| 1–10 | Lock baseline eval set; manifest emission + reviewer-outcome capture; baseline report | Baseline unstable → fix measurement, do not proceed |
| 11–25 | **Separation-gate pre-registration** → if PASS: contract kernel + 3 agents + human 7th gate; pilot on one issue stream | Separation gate FAIL → **stop the contract line, freeze at Phase 0** |
| 26–40 | Wire contract slices into current arena; add edge-hunt emitting predicate proposals; measure whether accepted predicates affect outcomes | Predicates never change outcomes → freeze at Phase 3, report negative |
| 41–60 | If Phase 3 positive → add rubric-lite. If not positive → **stop and consolidate Phases 1–3** | — |

**First 60 days stop at the first meaningful plateau — do not assume all phases complete.**

> **On the shared Days 26–40 window:** Phases 2 and 3 occupy the same calendar block, yet
> Phase 3's precondition is "Phase 2 positive" (which needs ≥8 held-out issues to
> graduate). This is not a gate violation — **phases are gates, not deadlines** (§4). The
> window is the *earliest* Phase 3 could begin; if Phase 2 has not earned its unlock by
> day 40, Phase 3 waits. The calendar mirrors the q-n-a 60-day table; the gate always wins
> over the date.

---

## 10. First 90 days (target state, if evidence keeps earning)

- 2–3 repos using contract-first arena flows (per-repo, no cross-repo claim yet)
- stable ledger-backed promotion with the 7-gate guard
- selective retrieval of promoted predicates only
- **measurable stateful gain over stateless baseline on held-out repo work**
- ≥1 promoted predicate family, ≥1 promoted contract delta originating from edge
  exploration, optionally ≥1 promoted rubric family
- G7 crystallization gene tuned with held-out evidence (Phase 7) — only if earned

If any gate returns null, 90-day state is "frozen at phase N with a documented negative"
— which is a **successful, defensible outcome**, not a failure.

---

## 11. Traceability — why each funded item is not a re-derived negative

| Funded item | Distinct from STZ negatives because… | Research basis |
|---|---|---|
| Contract as **primary selection object** | Changes the *selection object*, not the *weight*; typed-predicate + architectural conformance is a signal class **not derivable from a functional suite** | q-n-a §4008–4016; ITERATIVE-PLAN |
| Human 7th accept gate | Introduces an **exogenous** signal (α>0); every prior arm was closed-loop model-derived | ITERATIVE-PLAN §119; q-n-a §3977; PostTrainBench |
| Edge → predicate loop | Edge discovery becomes **contract evolution**, not suite-sharpening (the ruled-out lever) | ITERATIVE-PLAN §505; q-n-a §7544 |
| Rubric-lite (reranking only) | One-time authoring pre-patch, never a per-slice iteration loop (the ruled-out loop) | Agentic Rubrics; q-n-a §7574 |
| G7 crystallization gene | Evolves contract-crystallization behaviour, **not** numeric reweighting of sealed-derived proxies | HarnessX; q-n-a §313 |
| Preserve six-gate + seal + harness-mine | These are STZ's **proven positives** — extended, never loosened | PAPER.md; q-n-a §3967–3975 |

**The separation-gate pre-registration (Phase 1) is the whole plan's insurance:** if the
contract signal cannot be shown to separate suite-pass from predicate-fail on the
recall-free substrate, the line stops before any expensive build — the cheapest possible
defence against reproducing the earned negative at 10× cost.

---

### Recommended path (single sentence)
Baseline & safety → contract kernel with human approval → contract-bounded arena reuse →
edge→predicate evolution → rubric-lite only if earned → promotion ledger for trusted
artifacts → selective retrieval of promoted predicates only → low-risk gene tuning (+G7)
→ optional frontier modules last — each step forced to justify itself with measurable
repo-local SWE improvement, not architectural elegance.
