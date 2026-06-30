# Post-Opus-4.8 harness self-improvement: which approaches beat STZ's earned law?

**Date:** 2026-06-28 · **Author:** Robert Li · companion to `docs/PAPER.md` (the earned negative)
and `docs/CLAUDE.md` F19 (the 0.9.0 meta-loop).

## 0. The question, and the bar

STZ's 0.9.0 harness meta-loop does **not** reliably ship more correct code. `docs/PAPER.md`
proves why with a six-arm structural law. This survey asks: in the recent arXiv literature on
**meta-loops that recursively self-improve a harness within the bounds of a project**, is there
any approach that

1. delivers **material, *continuous*** competency improvement (sustained over runs, not a single
   step then plateau), **and**
2. is **compatible** with what the STZ harness was built to do (F1–F19 / N1–N12: contract-bounded
   slices, sealed held-out suites, auditable replay, bounded optimization depth, anti-reward-hack).

**The bar is STZ's, not the papers'.** A paper's claimed benchmark gain is *not* an earned
competency gain here. STZ's discipline (`docs/PAPER.md` §4) applies to *this* task: a gain measured
on a signal that includes the optimized axis is a **circular positive**, scored down; a closed loop
with no external oracle is suspect *by construction*. The honest possible answer is "most hit the
wall." It is.

## 1. Scope of the corpus

Opus 4.8 shipped **2026-05-28** ([Anthropic](https://www.anthropic.com/news/claude-opus-4-8),
[Axios](https://www.axios.com/2026/05/28/anthropic-opus-release-mythos)). "Post-release" is
therefore a **~1-month window** → arXiv `2606.*`. Strictly in-window (5 papers found):

| in-window (post 2026-05-28) | id | submitted | project-bounded? |
|---|---|---|---|
| Adaptive Auto-Harness: Sustained Self-Improvement on Open-Ended Task Streams | [2606.01770](https://arxiv.org/abs/2606.01770) | Jun 1 | yes |
| Retrospective Harness Optimization (RHO): Self-Preference over Trajectories | [2606.05922](https://arxiv.org/abs/2606.05922) | Jun 4 | yes (SE/agent harness) |
| Self-Harness: Harnesses That Improve Themselves | [2606.09498](https://arxiv.org/abs/2606.09498) | Jun 8 | yes |
| From 0-to-1 to 1-to-N: MetaAI Recursive Self-Design | [2606.09663](https://arxiv.org/abs/2606.09663) | Jun 8 | yes |
| Beyond Correctness: Architectural Reasoning via Agentic Judgment | [2606.14948](https://arxiv.org/abs/2606.14948) | Jun 12 | yes (repo-level) |

The mechanisms that could actually *open a door* cluster in the **weeks just before** the cutoff —
flagged honestly as **out-of-window** but included because the task is about the idea, not the date:

| borderline / out-of-window | id | submitted |
|---|---|---|
| Continual Harness: Online Adaptation for Self-Improving Agents (embodied/general) | [2605.09998](https://arxiv.org/abs/2605.09998) | May 11 |
| VeriScale: Adversarial Test-Suite Scaling for Verifiable Code | [2605.22368](https://arxiv.org/abs/2605.22368) | May 21 |
| Meta-Engineering Harnesses (contract-driven adversarial verification, project-bounded) | [2605.25665](https://arxiv.org/abs/2605.25665) | May 25 |
| SIA: Self-Improving AI with Harness & Weight Updates (general) | [2605.27276](https://arxiv.org/abs/2605.27276) | May 26 |
| **On the Limits of Self-Improving LLMs** (the theorem) | [2601.05280](https://arxiv.org/abs/2601.05280) | Jan (backbone) |

Pre-cutoff ancestors used only as citation seeds: ADAS [2408.08435], Gödel Agent [2410.04444],
DGM [2505.22954], DARWIN [2602.05848], Hyperagents [2603.19461], Meta-Harness [2603.28052],
Kitchen Loop [2603.25697].

**Search scope (so the "in-window corpus = 5" claim is evidenced, not asserted).** Searched
~12 queries across two axes: (i) generic harness-RSI / DGM-successor / ADAS-lineage, and (ii) the
*door-opener* axis the verdict hinges on — independent-verifier / external-grounding /
teacher-relabel / process-reward / continual-with-held-out / sustained-iteration. The targeted
June door-opener sweep surfaced the two strongest continuity candidates (Adaptive Auto-Harness,
RHO) and **both confirm the law rather than break it** (§3, §4). Residual risk: a June paper using a
search phrasing not covered could exist; the door it would have to walk through (exogenous α>0 +
measured non-degrading continuity on an independent oracle) is named explicitly, so any such paper
is checkable against the same bar.

## 2. The law to beat (restated) + its in-window theoretical confirmation

STZ earned (`docs/PAPER.md` §6): a suite-sharpening competency gain needs an axis that is at once
**(A) substantial**, **(B) split across the blind pool**, and **(C) invisible to a good-faith
functional suite** — and A∧B∧C is empirically empty. Plus **sealed-derived blindness**: every
numeric proxy is a function of the sealed suite, so none can rank a specimen by truth that lives
outside it. Plus: **the judge is the only non-sealed signal, and it tracks visible rigor, not
held-out correctness.**

**This is now a theorem, not just six arms.** [2601.05280](https://arxiv.org/abs/2601.05280)
formalizes recursive self-training as a dynamical system and proves: when the **exogenous,
externally-grounded signal fraction α_t → 0**, the loop suffers **degenerative dynamics** —
*Entropy Decay* (monotonic loss of distributional diversity) and *Variance Amplification* (random-walk
drift). A harness optimizing against its own generated tests/judges **satisfies α_t → 0 by
construction**. The theorem's prescribed escape is **persistent external grounding** (it proposes
neurosymbolic / program-synthesis anchoring). This is *exactly* STZ's "non-sealed correctness signal"
open door, with a proof attached. **Therefore the discriminator for every candidate is one question:
does it inject α_t > 0 — a correctness signal genuinely outside the optimized suite — or not?**

## 3. Two probes: the wall is on STZ's own data — and in the in-window literature

The dominant in-window class is **self-grounded harness RSI** (Self-Harness, MetaAI 0→1→N, SIA,
RHO): mine weaknesses / self-preference → propose harness edits → **validate against the same
self-generated or same-benchmark signal**. The theorem predicts this collapses.

**Probe 1 — variance collapse on STZ's committed data ($0, in-discipline).**
- `experiments/wsample-pilot/results/evolve-result.json` →
  `harness_select: { sigma: 0, ok: false, verdict: "VARIANCE COLLAPSE" }`; promotion blocked on
  `generation-variance-collapsed`. σ→0 **is** the theorem's Entropy-Decay fixed point.
- `experiments/competency-experiment/results/armA-cron.json`: grid over the full computable proxy
  set `{sealed, malformed, codeHealth, mutation-kill}` ships truth **0.9767 = baseline**; the
  truth-best specimen c5 (truth 1.0, sealed-*worse* 0.9992) is the argmax of **no** proxy.
- `src/diversity.ts` is the guard that exists *because* the closed loop hits exactly this
  degeneracy (it cites RC-GRPO 2602.03025, AceGRPO 2602.07906 for the σ→0 failure).

**Probe 2 — the appearance-bias of candidate A, on STZ's committed data ($0).**
`experiments/judge-selection/results/cron-judge-result.json`: on the homogeneous cron pool, five
frozen blind judges shipped **c4** (truth 0.9643) — *below* the numeric baseline (0.9732) and the
reachable ceiling (0.9821). The judge — the only non-sealed signal STZ has — **rewarded c4's visible
Feb-30 guard over candidates that passed more held-out cases.** This is a direct on-data test of
candidate A's central risk (a teacher/judge that tracks visible rigor, not held-out truth), and it
**failed**. RHO ([2606.05922](https://arxiv.org/abs/2606.05922)) reproduces the same failure at the
harness altitude in-window: "the chosen harness does not invariably coincide with the highest-scoring
candidate on the test set… self-preference may reward behaviors that look good to itself."

**Literature confirmation — Adaptive Auto-Harness ([2606.01770](https://arxiv.org/abs/2606.01770)),
the strongest in-window continuity attempt, documents the collapse instead of escaping it:** *"All
stopping budgets eventually peak and decline; later in the stream, shorter runs outperform longer
ones"* — early gains fade, the harness overfits its own history (the theorem's Variance Amplification,
observed). Its remedy is solve-time **routing** (a harness-tree), **not** sustained single-harness
improvement — i.e. it concedes continuity and routes around it. Its "oracle" is *analytically
defined, not estimated*; no held-out independent oracle.

So the self-grounded class is **falsified-for-continuity on STZ's substrate AND in the in-window
literature's own measurements**. The June papers reproduce STZ's negative; they do not escape it.

## 4. Every approach, tested against the law

Scoring, both 0–5. **Competency (C):** does it inject α_t>0 (a non-sealed correctness signal) **and**
show *continuity* (sustained, non-degrading over runs)? **Compatibility (K):** fit with STZ intent
(sealing, auditability, bounded depth, contract-bounded tournament, $0-closed-loop posture).

| # | approach (source) | injects α>0? | continuity shown? | gain circular? | **C** | **K** | verdict |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| A | **Independent adversarial verifier + frontier-teacher relabeling** (Continual Harness 2605.09998 process-reward co-learning ⊕ Meta-Eng 2605.25665 four-way adversarial arbiter ⊕ theorem's prescription) | **yes** (teacher/arbiter is exogenous) | **no** (abstracts don't quantify; plateau untested) | no, if teacher ⟂ suite | **3** | **4** | **the one plausible door-opener** — necessary α>0, but continuity unproven & teacher may be appearance-biased |
| F | **Neurosymbolic / formal-proof grounding** (theorem 2601.05280; VeriScale's *spec+proof* framing 2605.22368) | **yes** (proof ⟂ suite) | **n/a** (no harness realization) | no (proof is ground truth) | **2** | **2** | principled, opens the "non-sealed numeric proxy" door — but **unbuilt** and narrow (formal-verifiable slices only) |
| B | **Adversarial suite expansion→reduction / weakness-mine-and-bake** (VeriScale 2605.22368; Self-Harness 2606.09498) | **no** (sealed-derived) | **no** (single-step gains) | **yes** by STZ's bar | **1** | **5** | **earned — but one-time authoring only**, not a competency loop. This *is* STZ's F19 gene; STZ already earned this exact split |
| E | **Self-grounded DGM-archive self-design** (MetaAI 0→1→N 2606.09663; SIA 2605.27276) | **no** | **no** (MetaAI-Mini is protocol-only) | **yes** | **1** | **4** | confirms the wall; STZ already implements the DGM archive (`.stz/60-harness/`) |
| E′ | **Self-preference / self-consistency harness opt** (RHO 2606.05922, in-window) | **no** ("no ground-truth labels used") | **no** (1 round; Meta-Harness 10 rounds → 0.80 vs RHO 0.78 = diminishing) | low (held-out eval, but self-preference signal is the appearance axis) | **1** | **4** | in-window reproduction of STZ's judge appearance-bias (Probe 2). Held-out *eval* ≠ exogenous *signal* |
| E″ | **Sustained-stream auto-harness w/ routing** (Adaptive Auto-Harness 2606.01770, in-window) | **no** (HITL = credentials, not an oracle) | **explicitly NO — "peak and decline"** | yes (no held-out oracle; analytic oracle only) | **1** | **3** | the strongest in-window continuity attempt; **documents the theorem's collapse** and routes around it (§3) |
| C | **Architectural-conformance agentic judge** (Beyond Correctness 2606.14948) | partial (judge ⟂ suite) but scores **appearance** not correctness | n/a | — | **0** | **3** | the judge *appearance-bias* STZ identified, **named as a feature**. Compatible only as an F12 *conventions* gene — must **not** be wired to correctness selection |

### Why each scored as it did (the test, not the abstract)

- **A — the door-opener.** It is the only family that supplies what the theorem proves is *required*:
  α_t>0 from a source outside the optimized suite (a frontier teacher relabeling rollouts; an
  independent/adversarial arbiter). It maps onto STZ's named open door (`docs/PAPER.md` §8,
  "a correctness-tracking judge", "a non-sealed-derived proxy"). **But** neither in-window-adjacent
  paper *quantifies* continuity — Continual Harness reports "recovers a majority of the gap" on
  Pokémon with no curves; Meta-Eng is a 17-feature deployment report, reactive patching, not a
  measured trajectory. And the teacher is the trap STZ already hit: STZ's judge "rewards visible
  defensive rigor over candidates that actually passed more held-out cases" (`docs/PAPER.md` §5).
  A teacher that is more *impressive* but not more *correct* re-introduces the bias. **C=3 not 5.**
- **F — principled but unbuilt.** A machine-checkable proof *is* an oracle independent of any
  visible suite — the cleanest α>0 possible. The theorem prescribes it. But there is no harness
  realization in the corpus (VeriScale's abstract does not confirm proof synthesis; it evaluates on
  the *expanded suite*, circular), and STZ slices are language-agnostic while formal verification is
  narrow (N10). A real door, behind a large build. **C=2, K=2.**
- **B — earned, but it's the conclusion STZ already wrote.** Self-Harness is STZ's exact mechanism
  (weakness-mine → propose → regression-validate) and reports single-step gains validated against
  the same benchmark = circular by STZ's bar. **VeriScale was checked specifically for door F** (it
  is built on Verina, a Lean-4 spec+proof benchmark): the full text confirms it *generates and
  expands **test cases** only* — "no… machine-checkable proofs"; SpecGen/CodeGen "primarily rely on
  test cases"; it evaluates on the *expanded suite itself* (VerinaPlus/VerinaLite), no held-out
  oracle. So despite the formal-verification *substrate*, VeriScale's **signal is sealed-derived**
  and it belongs in B, not F. (Verina's separate *ProofGen* task does check Lean proofs directly —
  that is the door-F oracle — but VeriScale does not use it for selection.) Both B papers deliver
  **amortized one-time authoring** (bake a discovered bug-class once), which `docs/PAPER.md` §7
  already earned — *not* a continuous closed loop. Max compatibility (it's the F19 gene +
  `agents/stz-injector.md`), zero new competency. **C=1, K=5.**
- **E — confirms the wall.** DGM-lineage open-ended archives self-grounded on the optimized
  benchmark; MetaAI-Mini is "a protocol rather than an experimental result." STZ already ships the
  archive and parent-sampling; adding more of it inherits α→0. **C=1, K=4.**
- **C — the appearance axis, named.** Beyond Correctness explicitly targets "architectural quality…
  impossible to verify through tests alone," scoring "patch conformance to repository-specific
  conventions." That is precisely the visible-rigor axis STZ's judge over-weights. It is *useful* —
  as an F12 convention-amendment evaluator (which is independent-of-correctness *by design*) — but
  wiring it to *correctness selection* would institutionalize STZ's known bias. **C=0 for
  correctness, K=3 as a conventions gene.**

## 5. Earned / validated approaches that satisfy both dims — ranked

By the bar (continuous competency **and** STZ-compatibility), **no approach in the post-4.8 window is
fully validated.** Ranked by how close each comes to satisfying *both*:

1. **A — exogenous grounding (independent verifier + frontier-teacher relabel).** *Plausible,
   unvalidated for continuity.* The only family that injects the α>0 the theorem requires and that
   maps to STZ's design (F7 judge / F10 L1–L3 / `agents/stz-injector.md` / the v1.1 cross-family
   quorum judge). The earned next step, **not** a shipped result. Out-of-window by days — flag it.
2. **F — formal/neurosymbolic grounding.** *Principled, unbuilt.* Opens the "non-sealed numeric
   proxy" door with a genuine oracle, but large build and narrow applicability.
3. **B — adversarial suite-sharpening as one-time authoring.** *Earned and compatible — but it is
   amortized authoring, not a competency loop.* Already STZ's conclusion; safe to keep, do not
   re-badge as competency.
4. **C — conformance judge as a conventions gene only.** *Compatible in a strictly bounded slot.*
5. **E — self-grounded archive self-design.** *Confirms the wall; do not expect lift.*

## 6. Risks (per approach)

- **A:** (i) *teacher appearance-bias* — STZ's exact failure; a teacher more impressive than correct
  re-creates the judge problem. Mitigation: pre-registered teacher protocol with a held-out
  truth set, teacher accuracy measured vs ground truth before use (`docs/PAPER.md` §8). (ii) *Cost
  /billing* — a frontier teacher relabeling rollouts is **paid API per call** (CLAUDE.md billing
  policy); it breaks the "$0 closed loop" premise and must be budgeted/sampled. (iii) *Grounding
  drift* — if teacher calls are decimated to save cost, α_t→0 returns and the theorem's collapse
  resumes. (iv) Out-of-window provenance.
- **F:** narrow (formal-verifiable slices only; conflicts with N10 polyglot-agnostic); proof-synthesis
  cost; spec itself can be wrong (the spec becomes the new attack surface).
- **B:** *false continuity* — single-step authoring gains can be mis-read as a loop; reward hacking
  compounds with depth (R1 / Kernel-Bench 2601.20103). Keep the bounded-depth cap; report drops.
- **E:** variance collapse (already observed, §3); open-ended archives need diversity pressure or
  they degenerate to the incumbent.
- **C:** institutionalizes appearance-bias if mis-wired to selection; rubric-shopping (tuning the
  rubric until a known specimen wins) is the contamination STZ refuses.
- **Cross-cutting:** **contamination / circular positives.** Every paper here measures gains on the
  optimized signal. STZ's SWE-Bench experience (77%→23% contamination collapse) is the cautionary
  tale: discount any gain whose oracle includes the sharpened axis.

## 7. Bottom line

- The **theorem** (2601.05280) explains STZ's earned negative and **predicts** the in-window
  harness-RSI papers' ceiling: self-grounded loops have α_t→0 → degenerate. STZ's own
  variance-collapse telemetry **confirms it on real data** (§3).
- **No post-4.8 approach is a validated, continuous, STZ-compatible competency win.** All five
  strictly-in-window papers either reproduce STZ's mechanism-works/competency-doesn't split
  (Self-Harness, MetaAI 0→1→N), optimize the appearance axis (Beyond Correctness; RHO's
  self-preference), or **explicitly document the theorem's peak-then-decline** when they push for
  continuity (Adaptive Auto-Harness). Two of them (RHO, Adaptive Auto-Harness) independently
  reproduce STZ's own committed-data probes (§3).
- The **one earned direction** is **A: inject exogenous correctness grounding** (independent
  adversarial verifier / frontier-teacher relabel) — necessary per the theorem, mapped to STZ's
  named open door, **but unproven for continuity and carrying the teacher-appearance-bias + paid-API
  risks.** It is the honest next experiment, not a result to ship.
- Keep **B** (suite-sharpening) exactly where STZ already put it: one-time amortized authoring,
  bounded depth — *not* a closed competency loop.

**The reframe:** the post-4.8 literature does not rescue the STZ negative; it corroborates it, and
hands over a proof of *why*. The only way through is the door STZ already named — external grounding —
and nobody in the window has walked through it with measured, continuous, non-circular gains.

---

# Part II — door A under *persistent exogenous grounding*: SDLC outcomes + AWS Well-Architected

Refined question (2026-06-29): given that **multi-round + memory is necessary but not sufficient**,
and the missing ingredient is **α_t > 0 persisting each round** (an exogenous correctness signal —
independent verifier / truth-tracking teacher fed every cycle), which approaches deliver **material,
*continuous* improvement in (a) outcomes/correctness AND (b) AWS Well-Architected adherence across
the SWE SDLC**, *and* stay compatible with STZ? Same discipline; "reachable" is not "works."

## II.1 The headline finding (validated + dual-dim compatible): calibrated-verifier gating

The strongest in-window result is a **caution that sharpens the thesis**:
**When Good Verifiers Go Bad** ([2606.14629](https://arxiv.org/abs/2606.14629), Jun 12). Feeding an
exogenous verifier *each round* is **necessary but still not sufficient**: every verifier tested
**silently regressed** the student **−3.4 to −10.9 pts** below the frozen baseline *while training
loss kept dropping*, because a verifier above-threshold on task A drops to **8–23% rubric accuracy**
on task B — and **confident-but-wrong verifiers regress *worse* than near-random ones**. The
**sufficiency condition** it supplies: the exogenous signal must be **target-task-calibrated**,
validated *before* the loop; rank verifiers by **target-task rubric quality, not size**; treat
above-threshold **diminishing returns as a compute cap**.

This is **STZ's earned data, restated as a law.** STZ's only non-sealed signal — the judge — shipped
**c4 (truth 0.9643, *worse* than the 0.9732 numeric baseline)** because it rewarded c4's visible
Feb-30 guard (`experiments/judge-selection/results/cron-judge-result.json`). That is precisely a
**confident-but-wrong verifier silently regressing the selection** — an on-data instance of
2606.14629 (Probe 2, Part I §3). The convergence is exact and it is the most important result here:

> **α_t > 0 is necessary, target-task *calibration* is the sufficiency gate, and even calibrated it
> buys *bounded-safe* improvement, not *perpetual* competency** (above-threshold still hits
> diminishing returns). The in-window literature thereby **validates STZ's guard architecture** —
> bounded retry depth (F14), judge-reliability per-slice-type trust gating (`src/judge-reliability.ts`),
> variance-collapse floor (`src/diversity.ts`), and *halt-and-surface* (F19) — and hands over a
> concrete protocol upgrade: **gate every selection signal on measured target-task rubric accuracy
> before it is allowed to steer, and cap depth at the diminishing-returns knee.**

## II.2 The CI / "SDLC oracle" category error — corrected

It is tempting to say "the real SDLC supplies exogenous oracles the synthetic substrate lacked
(CI, tests)." **Mostly false at *selection* time, and the correction matters:**

- **Hidden-test / CI pass-fail *is* the sealed-suite signal** (STZ F7 stage-1 gate). In a real repo
  the project tests are usually *visible* to the implementer → **gameable → worse** than STZ's
  held-out suite. Richer SDLC tests (integration / e2e / real fixtures) capture *more truth* than a
  synthetic suite — but that is **door B (a better suite = one-time authoring)**, already earned as
  *authoring, not a loop*. It is **not** door A, and STZ already ruled SWE-Bench
  demonstration-only for exactly this contamination + public/private-split reason (Part I §5).
- The **only genuinely exogenous (α_t > 0)** SDLC signal is **post-merge reality** — prod/canary
  outcomes, incident reports, PR acceptance. That *is* door A, but it arrives **after** selection,
  **across many merge cycles**, and is **appearance-biased** when it is human "looks-good"
  acceptance. So the SDLC re-opens **door B + a narrow, delayed, cross-cycle door A** — it does
  **not** open door A at the per-slice selection moment.

**Scope, stated plainly:** *none of the in-window door-A papers are SWE-native* — 2606.14629 is VLM
(MathVista/MMMU/BLINK); EDV [2606.24428] is τ²-Bench/web-nav; AgentX [2606.26859] is recommender
systems. The SWE/SDLC door-A case here is **assembled cross-domain + from STZ-internal data**, which
is why its status is *earned direction, not validated win*. ([2606.17799](https://arxiv.org/abs/2606.17799),
"Coding Benchmarks Are Misaligned with Agentic SE," independently argues that narrow correctness
benchmarks under-measure real SDLC outcomes — supporting the broadened outcome axis, not a door-A win.)

## II.3 AWS Well-Architected as the second outcome axis

The **AWS Well-Architected Agentic AI Lens** ([published Jun 10 2026](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentic-ai-lens.html))
is the yardstick for the WAF dimension. STZ already maps onto it strongly (it anticipated this in
`docs/CLAUDE.md §5`):

| Agentic-AI-Lens practice | STZ mechanism (already present) |
|---|---|
| AGENTOPS05 tracing / audit / reconstruct execution | N1 auditability, N6 determinism, spec-diff (F13), `90-audit/calls/*.jsonl` |
| AGENTOPS06 testing + eval frameworks (LLM-as-judge), goal alignment | F7 judge, F10 anti-reward-hack, inoculation (L4) |
| AGENTREL04 **arbiter patterns** + fallbacks | judge / GRPO selection (F7/F8); maps Meta-Eng's four-way arbiter |
| AGENTSEC04 guardrails + human-in-the-loop on critical decisions | five-gate **halt-and-surface** (F19), bounded autonomy (contract-bounded slices F4) |
| AGENTSEC07 detect rogue agents | hack-pattern detector L3 (F10) |
| Bounded autonomy / bounded depth | F14 bounded escalation |
| **Gaps to checklist** | **AGENTCOST05** cost-attribution across multi-agent workflows (STZ has N5 per-slice cost but not per-agent attribution); **AGENTSEC07** rogue-agent detection *beyond* static AST L3; AGENTREL06 idempotent legacy integration |

**Critical, by STZ's own lens:** WAF adherence is **rubric-conformance**, not a verifiable truth.
The companion `aws-samples/well-architected-skills-and-steering` repo evaluates its WAF skills with an
**LLM-as-judge paired comparison over assertions, with *no ground truth / no held-out* signal**
(grader = Opus 4.8; baseline 85% → with-skill 99%). That is **appearance-adjacent** — the same axis
STZ's conformance-judge warning (Part I, row C) flags. Therefore:

> **WAF-adherence gains are *authoring* gains, not *loop* gains.** Baking WAF playbooks into the
> test-author / conventions gene (one-time, amortized, ~0 marginal cost per slice — STZ's *earned*
> positive) raises WAF adherence safely. **Closing a loop that *optimizes* an LLM-judged
> WAF-conformance score invites the same Goodhart** STZ already refused. Conform + checklist the
> gaps; do not make WAF-conformance a fitness signal.

## II.4 Scored & ranked — dim-1 split into sub-scores (they diverge)

**Dim-1** (0–5 each, because bundling hides divergence): **Cx** = correctness/outcome lift ·
**WAF** = Well-Architected adherence lift · **Cont(+)** = *positive, sustained, non-degrading
continuity over runs* — the user's #1 requirement. **Dim-2 K** = STZ compatibility (F1–F19 / N1–N12
+ Agentic-AI-Lens conformance). **Read Cont(+) first: it is ~0 on every row — no approach in the
window earns positive continuity.** Calibrated gating's value is *degradation-safety* (it stops the
loop going *negative*), which is a distinct, separately-tagged property — **not** continuity, so it
does not score in the Cont(+) column.

**Ranking rule:** ordered by **earned/validated status first, then joint dim-1 × dim-2** — the task
asks for *validated* approaches that satisfy both, so a validated authoring gain outranks an
unvalidated, off-domain correctness *potential*. "—" = unmeasured/off-domain; never an earned score.

| rank | approach (source) | Cx | WAF | **Cont(+)** | degr-safe | **K** | verdict |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **1** | **Calibrated-verifier gating** (When-Good-Verifiers-Go-Bad 2606.14629) | 3 | 4 | **0** | **✓ strong** | **5** | **validated + dual-dim compatible.** Necessary-not-sufficient + calibration gate; buys *bounded-safe*, **not** continuity. Concrete upgrade to `judge-reliability.ts`. *The earned win — on safety + compatibility, not on continuity.* |
| 2 | **WAF playbook-bake gene** (aws-samples skills+steering ⊕ Agentic-AI-Lens) | 0 | **5** | **0** (amortized authoring, not a loop) | n/a | **5** | **earned for the WAF axis — as one-time authoring**, not a loop. Highly STZ-native (skills + judge). Do **not** loop-optimize the conformance score (Goodhart). |
| 3 | **Post-merge exogenous grounding** (delayed α>0: PR-accept / canary / incidents; AgentX A/B 2606.26859) | — | 3 | **0** (unproven; potential only) | — | 2 | **earned *direction*, unvalidated, off-domain.** The only true per-cycle α>0, but delayed, cross-merge-cycle, appearance-biased; beyond v1 single-repo/local scope (needs deploy telemetry; maps AGENTOPS05). |
| 4 | **Multi-agent execute-distill-verify consensus** (EDV 2606.24428) | 2 | 2 | **0** | ✗ | 4 | STZ-shaped (heterogeneous specimens + third-party distiller + consensus = F6/F7) **but grounding is consensus, not truth** → fails on *correlated* errors (STZ expr-eval: 5/5 same bug). α≈0 dressed as verification. |
| 5 | **Self-grounded harness RSI** (Self-Harness 2606.09498, RHO 2606.05922, MetaAI 2606.09663, Adaptive Auto-Harness 2606.01770, Harness-flaw-repair 2606.06324) | 1 | 1 | **0** (peak-then-decline) | ✗ | 4 | **confirms the wall** (Part I). α→0; peak-decline / diminishing / single-step. Keep only as one-time authoring. |
| 6 | **Conformance / architecture judge** (Beyond Correctness 2606.14948) | 0 | 3 | **0** | n/a | 3 | WAF/architecture axis only; appearance-biased on correctness. F12 conventions gene **only**, never correctness selection. |

**The Cont(+) column is uniformly 0 by design: it is the literal answer to "continuous over runs?" —
no.** The page must not let a skimmer find continuity anywhere, because there is none to find.

## II.5 Risks (per ranked approach)

- **1 Calibrated-verifier gating:** (i) the calibration set itself can be unrepresentative → a
  verifier "passes" calibration then drifts on the live distribution (2606.14629's own failure, one
  level up). Mitigation: re-measure rubric accuracy per slice-type (STZ already gates this way). (ii)
  *No continuity promise* — diminishing returns are the ceiling; do not market bounded-safe as
  perpetual. (iii) Calibration consumes paid verifier calls (billing).
- **2 WAF playbook-bake:** Goodhart if the LLM-judged conformance score is ever made a fitness
  signal (§II.3); WAF rubric staleness as AWS docs evolve; conformance ≠ actual operational quality
  (a patch can recite all six pillars and still be wrong — the conformance/correctness gap).
- **3 Post-merge grounding:** appearance-bias of human acceptance (= STZ's judge problem at SDLC
  scale); **reward hacking compounds with the *long* feedback delay** (R1 / Kernel-Bench); attribution
  noise (which merge caused the incident?); scope breach (v1 is local single-repo, N9); contamination
  if post-merge outcomes leak back as training-on-test.
- **4 EDV consensus:** correlated-failure blindness (homogeneous pools agree on the same wrong
  answer); threshold-gaming of the similarity cutoffs (paper's own caveat); distiller uses the same
  LLM pool under test (circularity).
- **5 Self-grounded RSI:** variance collapse (observed), peak-then-decline (observed), false-continuity
  mis-read of single-step authoring as a loop.
- **6 Conformance judge:** institutionalizes appearance-bias if mis-wired to selection; rubric-shopping.

## II.6 Bottom line (Part II)

- **The refined thesis is correct and now has an in-window proof:** α_t > 0 each round is
  **necessary; target-task *calibration* is the sufficiency gate** (2606.14629); even calibrated it
  yields **bounded-safe, not continuous-perpetual** improvement.
- **No validated continuous-competency win exists in the post-4.8 window — including on SDLC outcomes
  and WAF.** The headline search (SWE-native, execution-grounded, *continuous*, non-circular) came
  back dry; door-A papers are cross-domain.
- **The earned, dual-dim-satisfying result is calibrated-verifier gating** — it *validates STZ's
  existing guard architecture* (bounded depth + judge-reliability gating + variance floor +
  halt-and-surface) and sharpens it into a calibration protocol. Ship that.
- **WAF adherence is an earned *authoring* axis** (bake the AWS Agentic-AI-Lens playbooks into the
  test-author/conventions gene); STZ already conforms to most of the Lens — close the
  cost-attribution (AGENTCOST05) and rogue-agent (AGENTSEC07) gaps by *conformance*, not by looping.
- **Door A in the SWE SDLC is reachable only via *delayed post-merge* grounding** (prod/canary/
  incidents/PR-acceptance) — earned direction, unvalidated, off-domain, scope-breaching for v1, and
  appearance-biased. It is the honest next experiment, not a result to ship.
</content>
</invoke>
