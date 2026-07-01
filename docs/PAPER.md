# When does a self-improving coding harness actually improve competency? A negative result, earned

**Robert Li**
slice-tournament-zoo (STZ), 2026-06

## Abstract

STZ is a contract-bounded tournament harness for agentic coding. It runs several
implementer agents against one sealed, held-out test suite, eliminates anything that trips
a hack detector, ranks the survivors with a frozen judge, and leaves a markdown audit trail
that a reviewer can replay. Version 0.9.0 adds a harness-level meta-loop: the harness can
evolve its own genome (test-author heuristics, selection weights, judge rubric, fan-out, a
mutation battery) against held-out pilot fitness, in the style of the Darwin Gödel Machine
and HarnessX.

This paper reports the question that mattered most and the answer I did not want: does the
meta-improving harness ship more correct code than the same harness without the
improvement? Across six fresh substrates and every selection signal the harness can compute,
the answer is no, and the reason is structural rather than incidental. A suite-sharpening
gain needs a correctness axis that is, at the same time, large enough to move held-out
truth, split across the blind implementer pool, and invisible to a good-faith functional
suite. Those three properties are close to mutually exclusive in practice. The
mechanism that the meta-loop is built around does work: the harness discovers a genuine
blind spot and bakes a test for it. Turning that mechanism into demonstrably better shipped
code does not follow. I describe the build, the experiments, the discipline that kept the
result honest, and the open questions.

## 1. Motivation

The recent literature on recursive self-improvement for code agents reports gains when the
improvement happens at the harness altitude rather than inside a single rollout. The Darwin
Gödel Machine evolves an archive of agent variants; HarnessX-style work substitutes one
component at a time and keeps what scores. STZ was built to test a narrower and more
practical claim: if you let the harness rewrite the parts of itself that choose a winner
and author the tests, does the winner it ships get more correct on a held-out oracle it
never trained against.

The honest version of that question has a trap in it. Suite-sharpening helps selection by
definition: add a test for behavior X and the suite now prefers candidates that satisfy X.
Showing that is not a result. The result has to be a gain on quality the harness did not
target, measured on an oracle independent of the signal it optimized. Most of the work in
this paper is about not fooling myself on that point.

## 2. What was built, and where to test it

STZ runs inside Claude Code. The orchestrator is a slash command following a procedure in
markdown; the deterministic parts (the eval gate, GRPO selection, hack detection, sealing,
the meta-loop bookkeeping) live in a TypeScript CLI called `stz bridge` that takes JSON in
and returns JSON out. Implementer agents, the judge, the test author, and the documenter
are real in-session subagents. The pipeline runs eight phases per slice: elicitation,
research, ground-truth validation, conventions, frozen test authoring, planning, an
adversarial parallel tournament, then judgment and merge with an intent-versus-as-built
spec diff as the audit record.

The 0.9.0 meta-loop is opt-in and off by default. It keeps a content-addressed archive of
harness variants in `.stz/60-harness/`, samples parents with probability proportional to
fitness over one plus child count (the DGM diversity rule), mutates one gene per child,
scores each variant on the recall-free pilots, and promotes a variant only through five
gates: it must beat the incumbent on held-out fitness, be clean on its own outputs under
the hack detector, preserve sealing integrity, preserve the bridge command surface, and
come from a generation with enough variance to rank. Any sensor that trips halts and
surfaces; nothing rewrites its own guard, which is the failure mode the DGM and code-repair
literature keep running into.

Source, install, and replay:

- npm: `npm i -g slice-tournament-zoo`, then `stz init`, `stz run`, `stz bridge ...`.
- Claude Code plugin: drives the in-session `/stz:*` commands; the npm CLI satisfies its
  bridge dependency.
- GitHub: `https://github.com/dr-robert-li/slice-tournament-zoo` (Apache 2.0). 183 tests,
  green at the time of writing; `npm test` reproduces them.
- Every experiment in this paper lives under `experiments/<task>-pilot/` with a
  pre-registration, a results document, machine-readable result JSON, and the stored blind
  specimens, so each run replays deterministically from committed artifacts. The build
  journal that this paper compresses is `docs/JOURNAL.md`.

## 3. Related work

The selection layer follows GRPO from DeepSeekMath, with group-relative advantage
`A_i = (r_i - mean) / std`, and gates reasoning rewards on outcome correctness in the
spirit of Posterior-GRPO (Fan et al., 2025). The tournament shape, recursive pairwise
voting at fan-out 16 with two-way comparisons and eight votes per pair, and the sequential
refinement with four surviving summaries, come from the Meta RTV and PDR work on scaling
test-time compute for agentic coding (2026), which also reports that LLM judges run 60 to
80 percent accurate on subtle code changes. That last number turned out to predict a lot.

The held-out suite leans on property-based testing, which kills far more mutants than
example tests and catches most mutations within the first twenty inputs (OOPSLA 2025). The
anti-reward-hacking posture uses inoculation prompting from Anthropic's 2025 work on
emergent misalignment from reward hacking, and a hard cap on optimization depth motivated
by the Kernel-Bench and ALE-Bench finding that the proxy-to-real eval gap widens as agents
iterate. The audit-trail-as-deliverable design borrows event-sourced deterministic replay
from OpenHands, adapted to markdown plus git plus a per-slice state file. The harness
engineering patterns (progressive disclosure, per-worktree observability, a recurring
doc-gardener) come from the OpenAI Codex CLI write-up. The meta-loop's archive and
parent-sampling follow the Darwin Gödel Machine. Other prior art that shaped the design:
SWE-agent on tools shaping outcomes, Aider on git-native repo maps, MetaGPT and ChatDev on
multi-role decomposition, AutoCodeRover on structure-aware search, and Devin 2.0 on parallel
candidates with planner-coder-critic separation.

## 4. Method and discipline

The experimental spine is a synthetic, recall-free substrate per task. Each task has a
contract, a sealed suite that the implementers never see and that drives selection, and a
separate truth oracle that grades frozen winners and is never a selection signal. The two
must differ in mechanism and seed so a win cannot be the suite quietly reading the oracle.

Several guardrails were each bought with a mistake earlier in the project, and they are the
reason the later results are trustworthy:

- **Blindness.** Implementers, the judge, the reviser, and the test author never see the
  truth oracle. A post-hoc grep audit confirms specimens carry no suite or oracle
  constants.
- **The separation gate.** Before pre-registering a substrate, I confirm with reference
  implementations that a naive-but-plausible version fails the truth oracle and a correct
  version passes, and that a good-faith fixed suite passes both. If the substrate does not
  separate, it demonstrates nothing.
- **Pre-registration.** The design, the decision rule, and the null are committed to git
  before any blind specimen is generated. The commit is the timestamp.
- **Budget-matched comparison.** Iterate-versus-sample and variant-versus-incumbent compare
  at equal token budget, with the one-time authoring cost reported separately.
- **The symmetric-error rule.** A confounded run that leans toward "build it" is the same
  error as one that leans toward "do not build it." A confound makes a run silent, not
  supportive. The same rule applies to pressure: a positive staged to satisfy a deadline is
  the same integrity failure as a null one refuses to accept.
- **No constructed pools, no coaching.** A promotion only counts when the buggy specimen
  arises from a blind implementer, not when I insert a reference implementation or make a
  contract vague on the failing axis to manufacture errors.

## 5. Experiments and outcomes

The early pilots (cron, hexcolor, ipv4) established that STZ's selection signal beats a flat
pass rate on absolute correctness, and that a good-faith sealed suite can be hardened safely.
A SWE-Bench evaluation adapter was built and made to run on aarch64 through Epoch AI's arm64
images, but three attempts to use it to decide the convergence-loop question were each
silent because of recall contamination and the public-versus-held-out test split. Decisions
moved to the synthetic substrate.

Two convergence-loop arms closed the per-slice question. A blind, budget-matched iterate arm
on cron tied best-of-N: iteration cannot cross a gradient the sealed suite cannot see. A
judge-beyond-suite arm confirmed the judge mechanism works (a blind judge reasoned past a
fully green suite and found a spec-mandated malformed-token bug) but found the judge loop no
better than a hardened suite with best-of-N at the truth ceiling. The lesson was to relocate
the effort to suite-sharpening at the harness altitude, which became 0.9.0, and to state the
one door that could still justify a search loop: a task whose correctness is genuinely
non-enumerable.

The competency line walked through that door six times.

**streamStats** (single-pass variance, where the naive sum-of-squares formula loses to
catastrophic cancellation). Separation gate clean. All fifteen blind Haiku specimens across
three seeds wrote Welford's algorithm and scored truth 1.0. Recall saturation: nothing to
select on. The machinery ran end to end and correctly declined.

**shuffle** (uniform permutation, where `sort` with a random comparator is biased). A
fingerprint-only probe found five of five blind specimens wrote correct Fisher-Yates.
Saturated again.

**weightedSample** (weighted sampling without replacement, recall-resistant because the
Efraimidis-Spirakis key scheme is not reflexively memorized). Separation gate the cleanest
yet: the naive `weight times random` heuristic passed the good-faith fixed suite and scored
0.09 on the property suite, 0.16 on truth. Eight blind specimens, all correct, by a mix of
algorithms. Out-of-recall did not produce failure: with a precise contract the implementers
reasoned to correct code rather than recalling it.

**expr-eval** (Python-precedence arithmetic, where `**` is right-associative and binds
tighter than unary minus). The first substrate where blind specimens genuinely erred. All
five made the identical unary-`**` mistake and all five got right-associativity right. The
errors were correlated. A homogeneous pool of capable implementers makes the same mistake,
and you cannot select your way out of a bug every candidate shares.

**cron capstone.** cron is the one substrate with a real natural split: a malformed-token
bug (`5abc` accepted via integer truncation) that a permissive suite swallows. The flagship
automated mechanism ran end to end for the first time. `harness-mine` twice-verified the
blind spot (it survives the permissive suite and is killed by the sharpened one), and the
mutator was baked into the battery. But measured on the functional truth oracle, not the
axis that was sharpened, the sharper genome's selected winner tied the incumbent (0.9767).
Sharpening changed which winner was shipped without shipping a better one. The five-gate
promotion correctly declined.

**The numeric selection arms.** If selection cannot ship the truth-best specimen, ask
whether evolving the selection weights can. On the cron pool the truth-best specimen (c5,
truth 1.0) is the argmax of no computable proxy, and a grid over every weight tuple ships at
best the baseline number. Adding mutation-kill, the proxy designed to encode correctness,
did not change it: mutation-kill tied the truth-best with the truth-worst. The reason is
structural. Every numeric proxy (pass, coverage, kill) is derived from the sealed suite, and
the truth-best specimen's advantage lives outside the sealed suite by construction. It is
sealed-worse and truth-better. No sealed-derived weighting can reach it.

**The judge selection arm.** The judge is the only selection signal not derived from the
sealed suite, so it was the one structurally possible path to a positive. On the cron pool,
five frozen blind judges shipped c4, at full-contract truth 0.9643, below the numeric
baseline's expected 0.9732 and below the reachable ceiling of 0.9821. The judges reasoned
well and found real bugs in other candidates, but they rewarded visible defensive rigor
(c4's explicit Feb-30 guard) over the candidates that actually passed more held-out cases.

**The heterogeneous pool.** The last open cell mixes model strengths so the pool splits.
Adding two Sonnet and two Opus specimens to the eight Haiku gave a twelve-candidate cron
pool in which the Opus specimen o2 was perfect on full-contract truth and also sealed-best.
Five judges unanimously shipped o2, a lift of +0.0214 over the numeric baseline's expected
0.9786. A positive, on the literal re-ranking control. It is confounded three ways. It comes
from the default harness's judge stage, not from anything the meta-loop evolved. The win is
the strongest model's specimen, which is both most correct and most impressive, so part of
what is being measured is Opus beating Haiku. And it does not survive the contrast with the
homogeneous pool, where the judge shipped a worse candidate than numeric selection. The
judge signal is noisy and not reliably truth-tracking. It landed on the truth-best only
where the truth-best was also the best-looking candidate. (The judge is not pure appearance
either: it separated o2 from a near-identical Opus sibling by their one hidden functional
difference, unanimously, which is weak evidence of a real but unreliable correctness signal.)

## 6. Findings

**The structural law.** A suite-sharpening competency gain needs a correctness axis that is
substantial, split across the blind pool, and invisible to a good-faith functional suite, at
the same time. These three rarely co-occur, for three independent reasons. A substantial
axis comes from the core of the task, and a capable model either gets the core or does not,
as one decision, so the pool does not split. A split is a near coin-flip, which is by
definition a peripheral edge case, which carries little weight in held-out truth. And an axis
that a good-faith functional suite misses is one that normal inputs do not exercise, which
again makes it small. Six substrates are consistent with this, and the reasoning explains
why it is a regularity rather than bad luck.

**Sealed-derived blindness.** Every numeric selection proxy is a function of the sealed
suite, and the residual held-out truth lives outside the sealed suite. Reweighting cannot
recover a signal that none of the proxies carry.

**The judge is the only non-sealed signal, and it is unreliable.** It can reason past a green
suite, which is real, but as a selection signal it tracks visible thoroughness more than
held-out correctness, consistent with the 60-to-80-percent judge accuracy in the RTV work.
It helps when the most correct candidate is also the most impressive and hurts when those
diverge.

**The mechanism works; the competency claim does not follow.** `harness-mine` discovers and
twice-verifies a genuine blind spot and bakes a test for it. That is a true and useful
property. It is not the same as the harness shipping reliably better code, and the two were
kept separate throughout.

## 7. Discussion

The practical reading is that the value of harness self-improvement on these tasks is
one-time authoring rather than per-slice search, which is what the judge-beyond-suite arm
already suggested and what the competency line confirms with a mechanism. Bake a discovered
bug class into the test author once and every future suite is born catching it at near-zero
marginal cost. That is worth having. It is not a closed feedback loop that lifts correctness
on quality nobody encoded.

The result also says something about evaluation. A held-out oracle that excludes the axis
you sharpened will report a null by construction, and an oracle that includes it will report
a circular positive. The only honest measurement of a selection gene is on full-contract
truth with a train/test split across slices, and even then the gene has to be the kind that
can move the metric. A battery gene cannot; a selection gene can in principle but is starved
by sealed-derived proxies; the judge can in principle but is too noisy.

Two scope limits matter. Every competency arm used small, capable, mostly homogeneous Haiku
pools, so the correct claim is about these substrates and this pool, not a universal
impossibility. And the parser family is narrow, so the non-transfer of one blind spot across
cron, ipv4, and hexcolor is evidence about that family rather than a law about all parsers.

## 8. Open questions

- **A correctness-tracking judge.** The one remaining lever is a judge rubric that scores
  held-out correctness rather than visible rigor. The appearance bias looks intrinsic to LLM
  code judging, and tuning rubrics until a known specimen wins is shopping, so this needs a
  pre-registered protocol with a held-out test set rather than a quick fix.
- **A non-sealed-derived numeric proxy.** Is there a cheap, per-specimen signal that
  correlates with held-out truth without being a function of the sealed suite? If not, the
  ceiling on numeric selection is structural and worth stating as such.
- **Frontier-versus-frontier at scale.** The heterogeneous result is confounded by model
  strength. A pool of equally strong, genuinely diverse implementers on a task at their real
  competence frontier, with full-contract truth and a train/test split, is the experiment
  that could still separate "the harness selects better" from "the strong model wrote better
  code." It is materially larger than anything here.
- **Cross-slice amortization, properly measured.** The amortization claim (one discovery
  hardens a family) failed on this parser family because the blind spots were not shared. A
  family deliberately chosen to share a recurring, subtle bug class would test it fairly.
- **SWE-Bench as a deciding instrument.** The adapter runs on arm64, but recall and the
  public-versus-held-out split kept it demonstration-only. A clean per-instance sealed suite
  authored blind to the oracle would let a real benchmark decide the build, at the cost of
  the train-on-test risk that has to be controlled.

### 8.1 The 0.9.6 contract plane — a different signal class, earned then wired

Every negative in §6 concerns signals *derived from the sealed suite* — iterate-to-green,
judge-beyond-suite, numeric-gene reweighting. All are functions of what a functional
suite can see. 0.9.6 introduces a signal that is not: **typed contract predicates**,
including architectural/`diff-constraint` classes ("no new dependency", "only files
under X change") that no functional test can express *by construction*, because they are
properties of the change, not behaviours of the program. This is not a re-derivation of
the earned negatives; it changes the selection *object*, not the weight (the numeric-gene
negative already ruled out reweighting).

The claim is deliberately narrow and honestly bounded:
- **Earned (mechanism, on substrates):** an accepted predicate separates a naive impl
  from a good-faith suite (Phase 1), and *changes tournament selection* against STZ's own
  multi-objective reward — verified that `codeHealth` is literally blind to `package.json`
  so the win is not redundant with the shipped reward (Phase 3). Human acceptance is the
  sole path to trusted state (the α>0 exogenous signal); an agent role is rejected as
  approver in code.
- **NOT shown:** any field-scale outcome on a real held-out issue stream. Every earn rides
  two hand-picked toy axes (dependency, file-scope), not a distribution. Two candidate
  positives were *rejected* mid-build as manufactured — a rigged separation substrate
  (ipv4 octet-range, which a good-faith suite catches) and an amortization-fallacy cost
  claim (retrieval "6× cheaper", circular at n=1). The symmetric-error rule cuts both
  ways: refusing a staged positive and preserving a real one are the same discipline.

The plane is wired into `select()` behind a **default-off flag**; flag-off is
byte-identical to 0.9.5 (integration-tested), so the capability is dormant until a human
turns it on with an accepted contract — the boundedness is the point. Phase-by-phase
build/eval/verdicts (including deferred and mechanism-only) are in
`experiments/0.9.6-progression/`. The open cell of §8 remains open: this earns the
*mechanism* of the missing signal class, not the field win that would close it.

## 9. Reproducibility

Each substrate under `experiments/` ships a `PREREG.md` committed before specimens, a
`PILOT-RESULTS.md` or `RESULTS.md`, a `results/*.json`, and the stored blind specimens.
`experiments/EXPERIMENT-SUMMARY.md` is the cross-arm finding;
`experiments/HANDOFF-CURRENT.md` is the resume document; `docs/JOURNAL.md` is the
first-person log. The deterministic spine and its tests are in `src/` and `test/`. The
harness genome, archive, and bridge commands are documented in `docs/CLAUDE.md` (F19) and
`docs/ROADMAP.md`. Install and run per Section 2.

## References

1. DeepSeekMath, GRPO. verl documentation. https://verl.readthedocs.io/en/latest/algo/grpo.html
2. Fan et al. Posterior-GRPO (P-GRPO), Aug 2025. https://arxiv.org/html/2508.05170v2
3. Meta. Scaling Test-Time Compute for Agentic Coding (RTV + PDR), Apr 2026. https://www.swiftscholar.net/paper/69eab9ef84947a5132b6304c
4. Anthropic. Natural Emergent Misalignment from Reward Hacking, Nov 2025. https://www.anthropic.com/research/emergent-misalignment-reward-hacking
5. Reward Hacking in Self-Improving Code Agents (Kernel-Bench / ALE-Bench), 2025. https://arxiv.org/html/2601.20103v1
6. Empirical Evaluation of Property-Based Testing in Python, OOPSLA 2025. https://cseweb.ucsd.edu/~mcoblenz/assets/pdf/OOPSLA_2025_PBT.pdf
7. OpenHands (paper + V1 SDK). https://arxiv.org/pdf/2407.16741.pdf
8. OpenAI Codex CLI, Harness Engineering, Feb 2026. https://openai.com/index/harness-engineering/
9. SWE-agent, ACI design. https://github.com/SWE-agent/SWE-agent/blob/main/docs/background/aci.md
10. Aider architecture. https://agentwiki.org/aider
11. MetaGPT. https://github.com/geekan/MetaGPT
12. ChatDev, arXiv 2307.07924. https://arxiv.org/html/2307.07924v5
13. AutoCodeRover, arXiv 2404.05427. https://arxiv.org/abs/2404.05427
14. Cognition, Devin 2.0, Mar 2025. https://cognition.ai/blog/devin-2
15. Darwin Gödel Machine; HarnessX; SIA. Harness-level recursive self-improvement (2024-2026), as surveyed in `docs/ROADMAP.md`.
16. Epoch AI. arm64 images for SWE-bench Verified. `ghcr.io/epoch-research/swe-bench.eval.arm64.*`
