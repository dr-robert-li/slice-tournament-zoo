# Validating the 0.9.5 additions against what they claim

> Goal: validate 0.9.5 (calibrated-verifier gating + WAF authoring gene) against its *claims*,
> pre-registered, on committed data, symmetric-error null — no constructed pools, no rubric-shopping.
> Verdict up front: **arm 1 is a unit-tested decision-logic + an honest limitation; arm 2 is a
> structural guarantee, not a competency delta; arm 3 stands pre-registered.** No manufactured
> positive was staged.

## Why this is a limitation report, not a positive

Two checks killed the easy "positives" before they were run, and recording *that* is the result:

1. **Arm 1 on committed data is tautological.** The would-be metric — "fraction of judge votes
   landing on a truth-best specimen" — *is* the outcome it claims to predict ("did the judge ship
   truth-best"); the gate is a monotone threshold of that same number. It cannot come out any way
   but "gate agrees," by construction, and the two committed realizations (homogeneous accuracy
   0.20, heterogeneous 1.0) are maximally separated, so they say nothing about where the 0.7 cut
   belongs. It is also **already a unit test** (below). Re-running it through the CLI would be "the
   separation gate and the unit tests re-run, dressed up as a result" — the exact trap this project
   refuses (`docs/JOURNAL.md`).
2. **Arm 2 kill-delta is constructed-or-circular.** No committed substrate is WAF-shaped, so a real
   delta needs a fresh authored contract+suite+mutants — a constructed pool the goal forbids — and
   if one author writes both the WAF suite and the mutants it catches, the delta is "I catch the bug
   I planted" (the cron-capstone mechanism-works tautology, not competency).

So the honest validations are narrower and below.

## Arm 1 — calibrated-verifier gating

**Claim (precise):** the gate is *fail-closed* — an un-calibrated or low-accuracy judge cannot steer
a harness promotion. It buys **bounded-safe** (does not ship a known-bad selection), **not**
continuous lift.

**What is validated (decision logic, deterministic, committed in `test/`):**
- `test/harness.test.ts` — `calibrationGate` is true only when `blindAccuracyBucket` is non-null AND
  not "low" AND consistency ≥ threshold; an unseen slice-type default-*distrusts* (diverges from the
  runtime `trustGate`, which default-trusts). The sixth gate `rubricCalibrated` fails closed:
  null/missing profile ⇒ `promote:false` with `judge-rubric-not-calibrated`.
- `test/bridge.test.ts` — end-to-end: `harness-promote` blocks when uncalibrated, passes once a
  calibrated profile exists; `judge-stress` + `judge-calibration` merge into one profile entry
  without clobbering.

**What is NOT establishable on committed data (the honest limitation):** an *empirical*
"calibration accuracy predicts ship-quality" claim. The committed `judge-selection/` runs recorded
final winners, not per-pair verdicts, so there is no decision *disjoint* from the gated decision to
measure accuracy on. The real arm needs the judge run on K held-out cron pairwise comparisons with
known truth winners (paid API) — named here as future work, not run.

**Illustration (labeled as such, not validation):** the committed homogeneous cron run shows the
gate's input range is real — a genuine frozen judge scored **1/5 = 0.20** truth-best-tier
(`judge-selection/results/cron-judge-result.json`: votes `{c4:4, c6:1}`, truth-best tier `{c5,c6}`),
which buckets "low" and *would* block, avoiding the c4 ship (full_truth 0.9643 < numeric baseline
0.9732). The heterogeneous run scored 5/5 = 1.0 (shipped truth-best o2). These are an illustration
that the gate operates over realistic inputs — they are **not** an independent prediction, per the
tautology above.

**Verdict:** gate decision-logic — **validated (unit tests).** Empirical predict-ship-quality —
**not establishable on committed data; deferred to a paid held-out battery.** Symmetric-error clean:
the limitation is reported, not papered over.

## Arm 2 — WAF authoring gene (`waf-playbook-autogen-v0`)

**Claim (precise):** it is **one-time amortized authoring** — when invoked, the test author also
reaches for AWS Well-Architected playbook negative/edge cases for behaviour the contract already
specifies. It is explicitly **not** a competency loop, and WAF-conformance must **never** be a
reward.

**What is validated:**
- *Authoring behaviour* — by inspection of `agents/stz-test-author.md`: the `heuristicId` branch
  exists and is scoped to contract-specified behaviour. (Authoring is a prompt capability; there is
  no deterministic competency number to earn here without a constructed substrate.)
- *The Goodhart guard, structurally* — `test/harness.test.ts` now asserts the selection weight tuple
  is exactly `{pass, coverage, kill, codeHealth, clean}` with **no WAF key**, in both
  `defaultGenome().weights` and `REWARD_WEIGHTS`. This turns the prose guard ("WAF is never a
  reward") into an enforced invariant — a prose guard rots; a test does not.

**What is NOT run (the honest limitation):** a mutation-kill delta. It would require a constructed
WAF substrate (forbidden by the goal) and independent mutants (a single author co-writing suite +
mutants is the plant-and-catch tautology). Recorded as not-establishable here.

**Verdict:** the gene is authoring (validated by inspection); the no-reward guard is **enforced by
test**. A competency kill-delta is **not earned and not claimed.**

## Arm 3 — door A (post-merge exogenous grounding)

Stands as `experiments/postmerge-grounding/PREREG.md`. Not run (real repos, paid, larger). It is the
only arm that could test a *continuous* outcome, and it is gated through arm 1's calibration gate.

## Bottom line

The 0.9.5 additions are validated **at the altitude they actually claim**: arm 1's gate logic is
unit-tested and fail-closed; arm 2 is authoring with a now-test-enforced no-reward guard; neither a
continuous-competency lift (arm 1) nor a kill-delta (arm 2) is claimed or manufactured. The empirical
predict-ship-quality claim (arm 1a) and door A (arm 3) are named, costed, and deferred — not staged
under the goal's hook.
</content>
