# HANDOFF-CURRENT — read this first to resume (2026-06-26)

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
- **Newest result (clean):** a **blind, recall-free, budget-matched** iterate-vs-best-of-N run on the
  synthetic cron task. Iterate ties best-of-N (truth 0.9767 each), both capped by the sealed signal's
  blind spot. This **rules out SEALED-STEERED convergence** and **proves the gradient exists** (a
  42/43 residual a hardened suite did not catch). It does NOT test the judge-beyond-suite form.
- **SWE-Bench is built and works on this aarch64 host**, but three pilots (A/B/C, scaled, the
  SWE-Bench iterate arm) were each **silent/confounded** on 0.8.0. SWE-Bench is demoted to
  *demonstration-only*; it cannot *decide* the build (recall contamination + the public/held-out test
  split fights the experiment). Decisions are made on the synthetic substrate.
- **THE NEXT STEP (section 7):** the **judge-beyond-suite blind arm** on the synthetic substrate. It
  is the only open door left on 0.8.0.

---

## 2. The decision, precisely

| flavor of "more rounds / loop" | tested? | result |
|--------------------------------|---------|--------|
| best-of-N sampling, sealed-selected | yes (cron, budget-matched) | reaches the sealed ceiling, not above |
| **sealed-steered** iterate loop (stop = sealed green) | yes (cron, budget-matched, recall-free) | **ties best-of-N; cannot cross the sealed-blind gradient. NOT warranted.** |
| **judge-beyond-suite** loop (judge reasons past the suite) | **NO — open door** | CONTROLS-2 banked signal (judge picked spec-correct 3/3 where flat sealed ties); untested as a budget-matched loop |

The sealed-steered null is partly definitional: a loop that stops at "sealed = 1.0" structurally
cannot fix what the suite cannot see. That is exactly why the remaining question is the
judge-beyond-suite form, whose stop condition is not "sealed green."

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
- **Blind iterate arm (cron)** — the clean one. `PILOT-PREREG-BLIND.md`, **`PILOT-RESULTS-BLIND.md`**,
  `results/blind-arm-cron.json`.

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

## 7. THE NEXT STEP — the judge-beyond-suite blind arm (spec it, then run)

The only open door on 0.8.0. Run on the synthetic substrate (recall-free), budget-matched, same as
the sealed-steered arm, with ONE change: the loop's stop/steer signal is a **reasoning judge that
reads the CONTRACT and the candidate and reasons past the sealed suite**, not "sealed = 1.0".

Design:
1. Reuse cron. best-of-N baseline already measured: max-sealed selection caps at truth 0.9767, and the
   residual 42/43 is a sealed-blind case (a malformed-rejection / convention the contract
   under-specifies).
2. **iterate-judge:** generate a candidate; instead of stopping at sealed=1.0, a frozen judge (the
   CONTROLS-2 judge, `stz-judge`) reads {contract, candidate code, sealed-suite output} and decides
   whether the candidate is *contract-correct beyond what the suite checks* — e.g. does it reject the
   malformed forms the contract mandates, handle the `7`==Sunday / leap conventions. If the judge
   flags a gap, critique → revise → repeat, within budget B. Stop only when the judge is satisfied OR
   B is exhausted. Score on truth.
3. **The test:** does iterate-judge cross the 42/43 → 43/43 gradient that sealed-steering could not,
   at equal budget? If yes → the judge-beyond-suite loop earns its cost → **0.8.0 (judge-steered
   form) warranted**, spec it against ROADMAP §239-625. If no → even a reasoning judge can't beat a
   sharpened suite here → **build a sharper suite, not the loop**, and 0.8.0 stays shelved.
4. Keep blindness (judge never sees truth), recall-free substrate, budget-matched, 3 seeds, and the
   symmetric-error rule. Replicate on hexcolor/ipv4 for breadth before any build call.

Pre-register this before running (the project's discipline). `PILOT-PREREG-BLIND.md` is the template;
write `PILOT-PREREG-JUDGE.md` and lock the decision table first.

---

## 8. Inventory + recent commits

Detail docs: `swebench-pilot/{PILOT-RESULTS-BLIND,PILOT-PREREG-BLIND,PILOT-RESULTS-SCALED,PILOT-RESULTS,
PILOT-PREREG,ENV-FINDINGS,DRYRUN-RESULTS,README}.md`, `cron-pilot/FINDINGS*.md`. Scripts:
`swebench-pilot/{run_epoch_arm64,grade_pool_official,grade_candidate}.py`,
`swebench-pilot/eval-adapter.mjs`, `cron-pilot/{sealed,truth}_verbose.mjs`. Machine-readable results:
`swebench-pilot/results/*.json` (incl. `blind-arm-cron.json`, `batch1-combined.json`).

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
