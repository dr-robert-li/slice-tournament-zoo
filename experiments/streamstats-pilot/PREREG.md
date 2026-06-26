# PRE-REGISTRATION — harness-evolve arm on a fresh non-enumerable contract

**Status:** committed BEFORE any blind specimen is generated. The git commit of this
file is the timestamp. Nothing below is edited after specimens exist; results land in
`PILOT-RESULTS.md`.

## 0. What this arm is (and is not)

The 0.9.0 harness-level RSI meta-loop (`src/harness.ts` + `stz bridge harness-*` +
`stz:evolve`) was BUILT and unit-green (183 tests), but every prior pilot substrate
(cron/hexcolor/ipv4) is **enumerable** — a good-faith fixed suite pins its bug
classes — so the meta-loop could only show *non-regression* there. The judge-arm
verdict (`PILOT-RESULTS-JUDGE.md`) stated the one door that reopens a search/loop win:

> *"The loop could only win where correctness is genuinely **non-enumerable** (a finite
> suite cannot express it) OR the base rate is tiny."*

This arm runs the **exact experiment the boundary names**: a fresh, unprobed contract
whose correctness is **magnitude-dependent**, where the flagship gene (author broader
tests) is predicted to cross a gradient a good-faith fixed-example suite plausibly
misses — and drives the *actual built machinery* (archive → GRPO select → five-gate
promote → meta-FSM) to a genuine promotion.

**Honest scope (per advisor):** this is NOT a claim of strict mathematical
non-enumerability (a fixed suite that *happened* to include the extreme case would
catch it — which is *why* the gene is "author broader tests"). The claim is: **the
0.9.0 machinery executes a genuine, gated promotion on a fresh contract where the §7
boundary predicts the sharpener wins, under full discipline.** Symmetric-error rule
holds: a forced win is as bad as a missed null. If the sharper genome does not beat the
incumbent across the seeds, it is NOT promoted and that null is the reported result.

## 1. Substrate — `streamStats` (single-pass population mean+variance)

Contract: `experiments/streamstats-pilot/slice/CONTRACT.md`. Single forward pass, O(1)
memory, relative tolerance 1e-6. The "single pass, O(1)" constraint naturally tempts
the textbook `E[x²]−E[x]²` formula (catastrophic cancellation at large mean / small
spread) vs. Welford (stable). Recall-light: custom output shape; both formulas are
plausible specimen outputs.

### Separation gate (run BEFORE this commit — touches no blind data)
Two reference impls (`ref/correct.mjs` = Welford, `ref/naive.mjs` = sum-of-squares)
through all three suites:

| impl | fixed_suite | property_suite | truth |
|------|-------------|----------------|-------|
| correct (Welford) | **1.0** (30/30) | **1.0** (21/21) | **1.0** (129/129) |
| naive (sumSq) | **1.0** (30/30) | 0.667 (14/21) | 0.899 (116/129) |

The naive impl **passes the good-faith fixed suite completely** yet **fails** property
(0.667) and truth (0.899). Clean separation: the fixed suite cannot see the magnitude
axis; the property heuristic crosses it; the held-out truth oracle confirms the defect
is real correctness, not a suite artifact. Deterministic (seeded; re-run identical).

## 2. The two genomes — single-gene substitution (HarnessX)

Identical except **one gene** (`heuristicId`, the flagship test-author gene):

| gene | incumbent `baseline-v0` | mutant `sharper-v1` |
|------|-------------------------|---------------------|
| heuristicId | `explicit-examples-v0` → authors `fixed_suite.mjs` | `property-fuzz-v1` → authors `property_suite.mjs` |
| (all other genes) | identical | identical |

`baseline-v0` is the shipping seed genome (`defaultGenome()`); `sharper-v1` differs only
in `heuristicId` (and a `mutatorIds` tag for the property battery). Selection signal,
fan-out, votes, rubric, weights: held fixed. This is signal-matched — vary only the
authored suite.

## 3. Comparison shape (budget-matched, signal-matched)

- **Pool fixed within a seed.** One blind specimen pool of K=5 per seed (real `haiku`
  agents, contract only, BLIND to all suites). Both genomes select from the SAME pool,
  so generation budget is identical by construction.
- **Selector = the genome's authored suite.** Incumbent ranks by `fixed_suite` passRate;
  mutant ranks by `property_suite` passRate.
- **Selection value = expected truth over the selector's indifference set.** A selector
  cannot distinguish specimens tied at its top passRate, so its realized truth is the
  **mean truth over `argmax(selectorRate)`** — this removes pool-order luck and is the
  faithful "the suite can't see within its ties" accounting (neither pro- nor anti-build).
  - `fitness_inc(seed) = mean_{i ∈ argmax fixedRate} truth(i)`
  - `fitness_mut(seed) = mean_{i ∈ argmax propRate}  truth(i)`
- **Cost accounting.** Generation cost identical. The mutant's ONLY extra cost is
  one-time suite authoring (the property suite), reported separately and amortized over
  all future slices — the judge-arm's own framing. Per-slice selection cost ≈ equal.

## 4. Seeds, decision rule, and the null

- **3 distinct generation seeds** → 3 independent K=5 pools, stored as artifacts
  (`runs/seed-{1,2,3}/cN.mjs`) for N6 replay. No regeneration in scoring.
- **Per-seed win:** `fitness_mut(seed) > fitness_inc(seed)`.
- **Promotion (harness level):** genome `sharper-v1` is promoted iff
  `mean_seeds fitness_mut > mean_seeds fitness_inc` AND all five gates pass
  (beats-incumbent ∧ hack-clean on its own authored suite ∧ seal integrity ∧ interface
  parity ∧ diverse generation). Driven by `stz bridge harness-fitness/select/promote`.
- **NULLS (reported as the result, not retried):**
  - A seed whose pool is **all-correct** (every specimen truth ≈ 1.0) has no selectable
    gap → contributes a tie (no win). Reported.
  - A seed whose pool is **all-buggy and equally so** → tie. Reported.
  - If `mean_mut ≤ mean_inc` across seeds → `sharper-v1` is **NOT promoted**; the
    meta-loop keeps the incumbent (the symmetric-error success outcome). Reported as the
    finding.
- **Pre-stated expectation:** the separation gate makes a win *likely* IF the blind pool
  is mixed (≥1 naive-style + ≥1 stable specimen). It is NOT guaranteed: haiku may emit
  all-stable or all-naive pools (recall), which yields a real null. We do not coach the
  specimens toward either formula.

## 5. Multi-generation (meta-FSM)

- **Gen-1:** archive seeded with `baseline-v0` (scored on the fresh substrate → mid-band),
  then `sharper-v1` scored; `harness-select` ranks; `harness-promote` applies the five
  gates. Promotion expected iff §4 holds.
- **Gen-2 (light):** re-spawn from the new incumbent; no further single-gene substitution
  improves held-out truth above the (now-stable) ceiling → BARREN → after the FSM's
  barren/converged rule the loop **halts keeping the incumbent**. This demonstrates the
  anti-build null halts correctly; we do not overspend proving gen-2 is barren.

## 6. Discipline (every guardrail from HANDOFF §6 carried)

- **Blindness:** specimens see only the contract; never any suite, the truth oracle, or
  the reference impls. Post-hoc audit: grep each stored specimen for suite/oracle
  constants (`SEED_P`, `SEED_T`, two-pass markers, magnitude ladders).
- **Train-on-test:** the mutant's `property_suite` checks ALGEBRAIC INVARIANTS
  (shift/scale/closed-form) under its OWN seed `SEED_P`; the `truth` oracle uses an
  ABSOLUTE two-pass reference under a DIFFERENT seed `SEED_T` and a DIFFERENT
  distribution (log-uniform magnitudes vs. power-of-ten ladder). The suites share no
  fuzz; a win is broad coverage, not a peek at truth.
- **Good-faith incumbent:** `fixed_suite` is a competent hand suite (n/mean/variance,
  edges, negatives, floats, a thousands-scale "large" case), not a strawman.
- **Budget-matched, 3-seed minimum, symmetric-error null, N6 replay** from stored
  artifacts + `60-harness/MANIFEST.json` append order.

## 7. What would falsify the "machinery works / boundary holds" claim

- Mutant fails to beat incumbent on mixed pools (gradient not crossed) → boundary wrong
  or substrate not actually non-enumerable for these specimens. Report null.
- Promotion gate trips on a real signal (hack finding on the property suite, seal drift,
  parity break) → the variant is rejected and we report WHY (the gate did its job).
- Determinism breaks on replay → N6 violated; result void.
