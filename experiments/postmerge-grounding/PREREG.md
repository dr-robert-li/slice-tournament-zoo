# PRE-REGISTRATION — post-merge exogenous grounding (door A), gated on calibration

**Status:** committed BEFORE any specimen, oracle, or run artifact exists — the git commit is the
timestamp. This is a **design only**; no loop/bridge code ships in 0.9.5. The gating mechanism it
depends on (`calibrationGate` / the `rubricCalibrated` promotion gate) ships in 0.9.5; this
experiment may only run once that is in place.

## 0. Why this arm

The competency line (`docs/PAPER.md`, `experiments/META-RSI-SURVEY.md`) earned a structural law:
every selection signal STZ can compute is **sealed-suite-derived**, so it cannot rank a specimen by
truth that lives outside the sealed suite. The survey's one genuinely open door is an **exogenous
correctness signal (α>0)** fed each round. The literature (2606.14629, *When Good Verifiers Go Bad*)
sharpened this: an exogenous verifier is **necessary but not sufficient** — it must be **target-task
calibrated** before it steers, or it silently regresses the result. 0.9.5 builds that calibration
gate. This arm tests the *one* SDLC signal that is actually exogenous: **delayed post-merge reality**.

This is **not** the per-slice selection moment. CI/hidden-test pass at selection time is the *sealed
suite* (door B), and in a real repo visible project tests are gameable. The only true α>0 is what
happens *after* a change merges — across later commits.

## 1. Separation gate (run BEFORE this commit — touches no blind data)

Confirm on reference instances, before any blind run, that the substrate *separates*:

- a **naive-but-plausible** patch passes the per-instance sealed suite yet is later **reverted /
  breaks a downstream commit / is rejected in review**, and
- a **correct** patch passes the sealed suite **and** survives downstream, and
- a **good-faith fixed suite** passes both.

If post-merge fate does not discriminate the naive patch from the correct one on instances where the
sealed suite cannot, the substrate demonstrates nothing and the arm does not run.

## 2. Design (substrate, signal, oracle)

- **Substrate:** real SWE repositories via the existing `experiments/swebench-pilot/` eval adapter
  (arm64 Epoch images). No production deploy plane is built (see §5).
- **Exogenous signal (α>0):** real **post-merge reality** for each instance — PR-acceptance and
  **downstream test/regression breakage across the repo's later commits** (the merged change is, or
  is not, reverted/broken by subsequent history). This signal is **outside** any suite the
  implementer or the per-instance judge can see.
- **Contamination control (load-bearing):** author a **blind per-instance sealed suite** *blind to
  the post-merge oracle* (`docs/PAPER.md` §8 clean path). Implementers, judge, and test-author never
  see the oracle; a post-hoc grep audit confirms specimens carry no oracle constants. The mechanism
  and seed of the sealed suite and the post-merge oracle must differ, so a "win" cannot be the suite
  quietly reading downstream history.
- **Pool:** blind specimens per instance (model + K stated at run pre-reg time, before specimens).

## 3. Decision rule + NULL

- **Gated THROUGH calibration (this is why the arm depends on 0.9.5):** the post-merge signal is
  treated as *another verifier*. It may steer selection **only after it passes `calibrationGate`** —
  its target-task accuracy measured on a held-out, blind, pre-registered ground-truth set first
  (`judge-calibration`). A confident-but-wrong post-merge oracle (human "looks-good" PR acceptance)
  is the 2606.14629 failure one level up; the calibration gate is the defense.
- **Promotion:** a post-merge-grounded selection is promoted iff it ships a winner that is **more
  correct on the held-out post-merge oracle** than the sealed-derived baseline ships, the signal is
  **calibrated**, AND the five other gates pass.
- **Continuity is the real test:** report whether any gain **sustains over multiple merge cycles** or
  **peaks then declines** (the survey's open question; Adaptive Auto-Harness 2606.01770 saw decline).
  Plateau/decline is a fully reportable result, not a failure to hide.
- **NULL (reported, not retried) — symmetric-error rule:**
  - post-merge signal does not beat the sealed-derived baseline → **keep incumbent** (a SUCCESS
    outcome, identical to the meta-FSM two-barren-generations null).
  - signal fails calibration → it does not steer; report uncalibrated, do not promote.
  - gain appears then degrades over cycles → report the decline; do **not** stop at the peak.
  - A confounded run (contamination suspected, separation gate not clean) is **silent**, not
    supportive — same error whether it leans "build it" or "don't."

## 4. Discipline

Blindness (specimens/judge/test-author never see the oracle; grep audit) · separation gate before
commit · budget-matched (post-merge-grounded vs sealed-baseline at equal token budget; calibration
cost reported separately) · symmetric-error null · no constructed pools / no vague-contract error
manufacturing · N6 replay from stored artifacts (`results/*.json`, stored specimens, the calibration
set under `.stz/60-harness/calibration/`).

## 5. Scope flags (explicit)

- **Off-domain & unvalidated.** None of the in-window door-A papers are SWE-native; this is the first
  SWE test. Contamination is the managed risk; the blind per-instance sealed suite is the control.
- **Prod telemetry is *replaced*, not deferred-because-hard.** For this probe, **real-repo git
  history is the post-merge signal** — cheaper, N6-replayable, contamination-controllable. A live
  prod/canary/incident telemetry plane adds nothing the probe needs and would breach **N9** (v1 =
  single-repo, local). It is a **v2 item, gated on this probe**: build the plane only if this arm
  returns a **non-null, non-degrading** result. A null/plateau **stops the line** — no plane is built.

## 6. Status

Pre-registered design. Not run. Depends on 0.9.5 `calibrationGate` (shipped). Running it is the
operator's call; until then this file is the committed hypothesis and decision rule.
