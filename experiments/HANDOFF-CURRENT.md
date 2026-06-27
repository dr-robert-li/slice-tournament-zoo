# HANDOFF-CURRENT — read this first to resume (2026-06-26)

> **UPDATE 2026-06-27 — the harness-evolve arm RAN on a fresh non-enumerable
> contract and returned a faithful NULL (recall saturation).** `streamstats-pilot/`:
> a 3-seed, budget-matched, pre-registered single-gene (`heuristicId`) evolve on
> `streamStats` (single-pass population variance — magnitude-dependent correctness,
> Welford vs naive sum-of-squares). Separation gate proven before pre-reg (naive
> passes the good-faith fixed suite 1.0, fails property 0.667 / truth 0.899). But all
> 15 blind haiku specimens were Welford (truth 1.0); one pre-registered switch to
> `shuffle` also saturated (5/5 Fisher-Yates fingerprint-probe — no suites/machinery).
> The 0.9.0 machinery's **no-gap decline path** ran on real data and **correctly
> declined** — `harness-select` σ=0 → variance collapse, `harness-promote` failed on
> `does-not-beat-incumbent`+`generation-variance-collapsed`, incumbent stands (the
> PROMOTION path itself never ran on real specimens — no gap; one generation, collapsed). A constructed pool (inserting the naive ref) was REJECTED as
> rigging. **Boundary sharpened:** a search/evolve win needs non-enumerable AND
> out-of-recall AND base-rate-not-tiny — strictly narrower than the judge-arm's
> "non-enumerable" door. See `streamstats-pilot/{PREREG,PILOT-RESULTS}.md`,
> `results/evolve-result.json`, `.stz/60-harness/MANIFEST.json`.
>
> **THEN the OUT-OF-RECALL arm (`wsample-pilot/`) closed the cell the above left
> untested.** `weightedSample` (weighted sampling w/o replacement) is non-enumerable
> AND recall-resistant (Efraimidis–Spirakis is not reflexive; naive `weight*random`
> is the natural wrong answer). Separation gate cleanest yet (naive: fixed 1.0,
> property 0.091, truth 0.158; correct 1.0/1.0/1.0). K=8 blind specimens: **all
> correct, via a MIX of algorithms** — out-of-recall did NOT yield failure; blind
> haiku *reasoned* to correct impls from the precise contract. Machinery declined a
> third time. **Boundary DOUBLY sharpened:** the binding precondition is not recall
> but **implementer fallibility on the axis** — a win needs specimens at their genuine
> competence frontier, which clever substrate choice does not supply (and inducing
> errors via a vague contract is the opposite-direction confound, refused). Two full
> arms (streamStats 3-seed, weightedSample K=8) + one probe (shuffle) across three
> non-enumerable substrates → three honest nulls, gate correct each time. **Plainly:
> the requested positive promotion was NOT achieved; a positive needs implementers
> fallible on the axis (a competence-frontier experiment, materially larger).** See
> `wsample-pilot/{PREREG,PILOT-RESULTS}.md`, `results/evolve-result.json`.
>
> **THEN the competence-frontier experiment ran (`expr-pilot/` + `cron-capstone/`),
> and the answer is now DEFINITIVE — see `experiments/EXPERIMENT-SUMMARY.md`.**
> expr-eval (frontier task): 5/5 blind specimens made the SAME unary-`**` bug —
> errors are CORRELATED, so no split. The real blocker, across all 5 substrates, is
> **error correlation**: a homogeneous capable pool makes the same mistakes. cron is
> the one substrate with a real natural split (`5abc`), so the **flagship automated
> sharpening** ran end-to-end there for the first time: `harness-mine` twice-verified
> the `malformed-trailing-token` blind spot (survives permissive, killed by sharpened),
> `harness-promote-mutator` baked it in — **MECHANISM WORKS**. But measured on held-out
> `truth_full` (NOT the sharpened `5abc` axis — that would be teach-to-the-test), the
> sharper genome's selected winner ties the incumbent (0.9767) → gate **correctly
> declines**. **Structural finding:** a competency gain needs an axis that is
> substantial ∧ split ∧ suite-invisible at once, and these are mutually exclusive
> (substantial⟹core⟹uniform; split⟹edge⟹small; invisible⟹edge⟹small). **The broad
> competency positive is NOT earned and structurally not obtainable with a homogeneous
> capable pool; the mechanism works; heterogeneous frontier pool is the open cell
> (user's call).** Mechanism-works ≠ competency-improves, kept separate. JOURNAL last
> two entries.

> **UPDATE 2026-06-27 — 0.9.0 SHIPPED the harness-level RSI meta-loop.** The §7
> conclusion below ("sharpen the suite, not the per-slice loop") is now BUILT, at
> the harness altitude. The per-slice 0.8.0 convergence loop is formally shelved
> in `docs/ROADMAP.md`; its energy is relocated to a DGM/HarnessX-style meta-loop
> that evolves the harness genome against held-out recall-free pilot fitness, with
> GRPO variant selection, a variance-collapse guard, a five-gate promotion guard,
> an SSR-style bug-injector for suite hardening, judge-reliability profiling (no
> naive ensembles), and a multi-objective anti-hack reward. New code:
> `src/{harness,harness-hash,diversity,injector,judge-reliability}.ts` +
> `eval-runner`/`hack-detector`/`selection` extensions + 9 `harness-*`/`inject`/
> `judge-stress` bridge commands + `agents/stz-{injector,harness-critic}.md` +
> `commands/stz-{evolve,inject}.md`. The flagship — automated suite sharpening —
> mines a discovered blind-spot bug-class once into the test-author repertoire +
> mutation battery (twice-verified via `harness-mine`), catching it at ~0
> marginal/slice. 183 tests green; the meta-loop spine validated end-to-end on the
> cron pilot with real execution. See ROADMAP §"Harness-level RSI (0.9.0)".


Self-contained resume doc for the STZ benchmark-evidence line. The older `HANDOFF.md` is the layered
decision log (stacked UPDATE blocks, full chain). This file is the single entry point: state, what is
built, how to run it, the discipline, and the exact next step. Branch: `main`. Everything below is
committed.

---

## 1. TL;DR — where we are

- **The question:** does STZ's machinery (selection signal, and possibly the 0.8.0 convergence loop)
  produce *absolute* better outcomes than naive sampling / frontier single-shot, demonstrably?
- **The standing decision (held since the cron/hexcolor pilots, now EARNED not asserted):** do NOT
  build the 0.8.0 convergence loop yet. **Sharpen the sealed suite first.** Build a loop only if a
  reasoning judge that steers *beyond* the suite can cross a correctness gradient a hardened suite
  cannot express, tested at equal token budget.
- **Newest result (clean — CLOSES the last open door):** the **judge-beyond-suite blind arm** on
  cron, signal-matched and budget-matched (`PILOT-RESULTS-JUDGE.md`). A blind judge reading only
  {contract, code, green-sealed} reasoned PAST a fully-green suite and found the spec-mandated `5abc`
  malformed bug + two more real gaps — so the **judge-loop mechanism works** (stronger than
  CONTROLS-2). **But B (judge+iterate) == C (hardened-suite+best-of-N)** at the truth-1.0 ceiling, and
  B cost ~92k extra tokens (74k/critique) to reach what C selects at ~0. The gradient is
  **suite-expressible**, so the loop is **NOT warranted**. Verdict: sharpen the suite. **0.8.0 is now
  ruled out on BOTH the sealed-steered AND the judge-beyond-suite forms.**
- **Prior clean result:** the sealed-steered iterate arm (`PILOT-RESULTS-BLIND.md`) — iterate ties
  best-of-N (truth 0.9767), proving the gradient exists but sealed-steering can't cross it.
- **SWE-Bench is built and works on this aarch64 host**, but three pilots (A/B/C, scaled, the
  SWE-Bench iterate arm) were each **silent/confounded** on 0.8.0. SWE-Bench is demoted to
  *demonstration-only*; it cannot *decide* the build (recall contamination + the public/held-out test
  split fights the experiment). Decisions are made on the synthetic substrate.
- **THE NEXT STEP (section 7):** with 0.8.0 ruled out both ways, the live work is **building the
  sharper sealed suite** (bake in the judge-surfaced bug classes) + the judge as a one-time
  selection/authoring instrument — NOT the convergence loop.

---

## 2. The decision, precisely

| flavor of "more rounds / loop" | tested? | result |
|--------------------------------|---------|--------|
| best-of-N sampling, sealed-selected | yes (cron, budget-matched) | reaches the sealed ceiling, not above |
| **sealed-steered** iterate loop (stop = sealed green) | yes (cron, budget-matched, recall-free) | **ties best-of-N; cannot cross the sealed-blind gradient. NOT warranted.** |
| **judge-beyond-suite** loop (judge reasons past the suite) | **yes (cron, signal-matched, budget-matched)** | **judge+iterate == hardened-suite+best-of-N at the truth-1.0 ceiling; loop NOT warranted.** Mechanism confirmed (blind judge found the `5abc` bug past a green suite) but the gradient is suite-expressible, so selection reaches the same ceiling at ~0 marginal cost vs 74k/critique-round. → sharpen the suite. (`PILOT-RESULTS-JUDGE.md`) |

The sealed-steered null is partly definitional: a loop that stops at "sealed = 1.0" structurally
cannot fix what the suite cannot see. The judge-beyond-suite form was the escape from that
definitional trap — and it was tested (signal-matched, holding the judge fixed, varying only
sample-vs-loop). The judge loop *works* but does not beat a hardened suite + best-of-N: every
contract-mandated gradient found on cron is a finite test you can bake into the suite, so the judge's
value is selection/authoring (one-time), not per-slice search. **Both loop forms are now ruled out.**

---

## 3. The pilot arc (each line → its detail doc)

Synthetic pilots (the load-bearing, recall-free evidence; `experiments/<task>-pilot/`):
- **slugify** — easy/ambiguous task; STZ ≈ naive (nothing to select on). `slugify-pilot/`.
- **cron** — hard task, real bugs. STZ ≥ naive on absolute correctness. The home of the sealed/truth
  split everything reuses. `cron-pilot/FINDINGS.md`, `FINDINGS-CONTROLS.md`,
  **`FINDINGS-CONTROLS-2.md`** (the frozen judge picking spec-correct 3/3 — the open-door evidence),
  `FINDINGS-HARDENING-VALIDATION.md`.
- **hexcolor / ipv4** — fresh-task validations of the sealed-suite hardening. `hexcolor-pilot/`,
  `ipv4-pilot/`.

SWE-Bench line (`experiments/swebench-pilot/`):
- **Substrate + adapter** — pytest eval adapter conforming to the bridge `{passed,total,passRate}`
  contract; faithful `resolved` oracle. `eval-adapter.mjs` + `eval-adapter.test.mjs` (16 tests).
  `README.md`.
- **ARM odyssey** — official images are x86_64, host is aarch64; native provisioning dies on Python
  3.13. Unblocked via **Epoch AI arm64 images**. `ENV-FINDINGS.md`.
- **report-mode wiring + dry run** — `run_epoch_arm64.py`; 5-instance gold dry run (3 resolved, 2
  network-bound excluded). `DRYRUN-RESULTS.md`.
- **A/B/C pilot** — does NOT update 0.8.0 (A>B tautological, A≈C n=1). `PILOT-PREREG.md`,
  `PILOT-RESULTS.md`.
- **Scaled pilot + SWE-Bench iterate arm** — best-of-N ≈ frontier but complementary; iterate arm
  CONFOUNDED (critic not blind to F2P, pointed questions, recall). Silent on 0.8.0.
  `PILOT-RESULTS-SCALED.md`.
- **Blind iterate arm (cron)** — the clean sealed-steered one. `PILOT-PREREG-BLIND.md`,
  **`PILOT-RESULTS-BLIND.md`**, `results/blind-arm-cron.json`.
- **Judge-beyond-suite arm (cron)** — the LAST arm; signal-matched, closes 0.8.0. Judge-loop
  mechanism confirmed but B==C (loop not warranted; gradient suite-expressible). `PILOT-PREREG-JUDGE.md`,
  **`PILOT-RESULTS-JUDGE.md`**, `results/judge-arm-cron.json`, `cron-pilot/runs/judge-arm/`.

---

## 4. Assets and how to run them (exhaustive)

### 4a. Synthetic blind arm (cron) — NO Docker, fast, recall-free. THE substrate for decisions.
```
cd experiments/cron-pilot
# blind loop signal (failing cases on stderr as __SEALED_FAILURES__<json>):
node sealed_verbose.mjs <abs path to impl/index.mjs>
# truth scorer (failing CASES on stderr as __TF__<json>):
node truth_verbose.mjs <abs path to impl/index.mjs>
# plain contract specimens see:
slice/CONTRACT-VAGUE.md
# blind-arm artifacts from the last run:
runs/blind-arm/bestN/c{1..4}/index.mjs   runs/blind-arm/iterate/index.mjs
```
Both suites print one final JSON line `{passed,total,passRate}` to stdout (the bridge contract).
`cron.sealed.mjs` / `cron.truth.mjs` are the originals; the `*_verbose.mjs` copies add failure capture
for the critic and for residual-defect identification. Do NOT show specimens/critic the suite source.

### 4b. SWE-Bench on aarch64 (Docker; demonstration-only).
```
cd experiments/swebench-pilot
pip install swebench        # 4.1.0 used
# gold-resolve check / report-mode on Epoch arm64 images (auto pull+retag+monkeypatch):
STZ_RUN_DIR=/tmp/out STZ_TIMEOUT=400 python3 run_epoch_arm64.py <run_id> <instance_id> ...
# grade a candidate pool (predictions per slot) through the official harness:
python3 grade_pool_official.py <pool_patches.json> <out_dir>
# quick pytest-native grader (fragile on non-pytest repos; official path preferred):
python3 grade_candidate.py <instance_id> <candidate.patch|GOLD> --out result.json
```
Epoch arm64 image name: `ghcr.io/epoch-research/swe-bench.eval.arm64.<instance_id>`. All 500 Verified
have arm64 images (~79% of full SWE-bench). `run_epoch_arm64.py` forces arch=arm64 + no-ops the env
build (the harness hardcodes x86_64 and can't build on ARM).

### 4c. Generation / selection agents (in-session Agent tool — subscription-billed, NOT `claude -p`).
- specimen: `subagent_type: stz-specimen`, `model: haiku` (cheap implementer under test) or default
  Opus (frontier). Reads the contract/issue only; BLIND to suites/tests.
- judge / critic: `subagent_type: stz-judge` (frozen pairwise) or `claude` for free-form critique.
- Capture cost from each Agent result's `subagent_tokens` to enforce a token budget B.

---

## 5. Environment facts (load-bearing)

- **Host is aarch64** (Grace/GH200-class DGX), Docker runtime `runc`, shared with a live
  `wp-v4-judge-vllm` container. Do NOT mutate the Docker daemon or build arm64 images globally.
- **In-session Agent/Task subagents bill the subscription, not the API** (per user policy). `claude -p`
  / SDK / managed agents bill the API. So all pilot generation here is subscription-billed; cost is
  time + quota, not money. A standalone python loop shelling to `claude -p` would be paid API.
- **Heavy artifacts are gitignored** in `swebench-pilot/.gitignore` (`runs/`, `logs/`, `gold.*.json`,
  `__pycache__/`). Use `$CLAUDE_JOB_DIR/tmp` for scratch.
- **RTK `git diff` is lossy** — to capture an applicable patch use raw `git diff` via a python
  subprocess (`subprocess.run(["git","-C",d,"diff"])`), not the hooked shell `git diff`.

---

## 6. Discipline / guardrails (every one was bought with a mistake)

- **Symmetric-error rule:** a confounded run leaning pro-build is the same error as one leaning
  anti-build. If a confound survives, the run is SILENT, not supportive. (Caught twice.)
- **Blindness:** specimens, reviser, critic, sealed-suite author NEVER see the truth oracle /
  FAIL_TO_PASS / test_patch. On SWE-Bench, PASS_TO_PASS is public; FAIL_TO_PASS is held out.
- **Recall:** SWE-Bench fixes are plausibly in-weights; the iterate arm is the most recall-sensitive
  (it only has to retrieve). The synthetic tasks are recall-free — prefer them for any decision.
- **Train-on-test:** an issue-derived sealed suite collapses toward the oracle. Use the judge, or a
  suite authored blind to the oracle (cron's already is).
- **No judge/critic "accuracy rate" claim** — report selection wins, not an oracle-accuracy number.
- **Budget-matched comparison** is mandatory: equal token B for iterate vs best-of-N, plus the
  absolute curve. (The piece every pre-blind pilot lacked.)
- **No operator diagnosis in critic prompts** — give only the sealed-failure output + code. (One
  small contract-level field-semantics nudge slipped into the cron run; it HELPED iterate, so the
  null result is robust to it, but don't repeat it.)

---

## 7. THE NEXT STEP — judge-beyond-suite is DONE; build the sharper suite

**The judge-beyond-suite arm ran and closed the door** (`PILOT-PREREG-JUDGE.md` →
`PILOT-RESULTS-JUDGE.md`, `results/judge-arm-cron.json`). What it found, and what it leaves:

- **Done / decided:** signal-matched A/B/C on cron. The judge-loop *mechanism* is real and confirmed
  (a blind judge, given only {contract, code, green-sealed}, reasoned past a fully-green suite and
  found the spec-mandated `5abc` malformed bug + 2 more gaps). But **B (judge+iterate) == C
  (hardened-suite+best-of-N)** at the truth-1.0 ceiling, and B cost ~92k extra tokens to reach what C
  selects at ~0. The only contract-mandated gradient on cron (`5abc`) is **suite-expressible**, so the
  loop is **not warranted**. 0.8.0 is ruled out on both forms. (Two §7-original design errors were
  fixed first: the 42/43 residual is the `7`==Sunday *convention* not a spec bug; and the comparison
  must be signal-matched B-vs-C, not B-vs-sealed-best-of-N — see the pre-reg.)

- **The actual next step (build, not pilot):** the **sharper sealed suite** is now the named lever
  on every arm (sealed-steered, judge-beyond-suite, CONTROLS-2). Bake the judge-surfaced bug classes
  into the suite: strict malformed-token rejection (`5abc`), out-of-range range/step endpoints,
  multi-component-token rejection (`1-5-9`, `*/2/3`). Keep the judge as a **one-time
  selection/authoring** instrument that mines those classes from the contract — NOT as a per-slice
  loop. The `runs/judge-arm/score.mjs` 13-form must-throw battery is the seed for it.

- **Only thing that could reopen 0.8.0 (the boundary, stated once):** the loop loses whenever the
  gradient is *suite-expressible* AND the base rate is *not tiny* (`> ~0.20`, so draw-more is cheap) —
  cron is **both**. A loop could win only where correctness is genuinely *non-enumerable* (a finite
  suite cannot express it) **OR** the base rate is *tiny* enough that draw-more's `(1/p)·gen` exceeds
  the loop's flat cost. Same door; cron walks through neither (single `5abc` axis, base rate
  ~0.33–0.50). If STZ ever targets such a task, re-run the signal-matched B-vs-C arm there; until
  then, the loop stays shelved. (Probative detail: in this run's all-buggy cell {j3,j4}, B wins the
  binary but draw-more still beats it on cost — see `PILOT-RESULTS-JUDGE.md`.)

---

## 8. Inventory + recent commits

Detail docs: `swebench-pilot/{PILOT-RESULTS-JUDGE,PILOT-PREREG-JUDGE,PILOT-RESULTS-BLIND,PILOT-PREREG-BLIND,
PILOT-RESULTS-SCALED,PILOT-RESULTS,PILOT-PREREG,ENV-FINDINGS,DRYRUN-RESULTS,README}.md`,
`cron-pilot/FINDINGS*.md`. Scripts:
`swebench-pilot/{run_epoch_arm64,grade_pool_official,grade_candidate}.py`,
`swebench-pilot/eval-adapter.mjs`, `cron-pilot/{sealed,truth}_verbose.mjs`,
`cron-pilot/runs/judge-arm/score.mjs` (13-form must-throw battery + sealed/truth — seed for the
sharper suite). Machine-readable results: `swebench-pilot/results/*.json` (incl. `judge-arm-cron.json`,
`blind-arm-cron.json`, `batch1-combined.json`).

Recent commits (newest first):
```
98176ee scope the blind-arm verdict to sealed-steered convergence
8233187 blind iterate arm on cron — iterate ties best-of-N at matched budget
00775eb redirect blind iterate arm to synthetic substrate (recall-free)
40bfc4c pre-register the blind iterate arm (matched-budget vs best-of-N)
2c2c50e journal: SWE-Bench substrate, A/B/C pilot, iterate arm I do not trust yet
3c261a8 scaled pilot + iterate arm — STILL silent on 0.8.0 (confounded)
5b25df4 scaled pilot batch-1 — 7 pytest instances (Haiku pool vs Opus)
4d87642 correct A/B/C verdict — pilot does NOT update 0.8.0 (post-review)
e6998bc A/B/C SWE-Bench pilot results (directional) + official pool grader
8f5b435 wire report-mode to Epoch arm64 + 5-instance dry-run
270b156 SWE-Bench pilot UNBLOCKED on aarch64 via Epoch arm64 images
```
The human-voice narrative of this arc is in `docs/JOURNAL.md` (last three entries).
```
```
