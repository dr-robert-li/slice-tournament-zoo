# PRE-REGISTRATION — the automated-suite-sharpening CAPSTONE (cron)

**Status:** *written* before driving `harness-promote-mutator` / `harness-select` /
`harness-promote`, but — unlike the earlier arms (9bc2e25, ad4e1bf) — **not separately
committed beforehand**; it lands in the same commit as the results. This is acceptable
here only because the outcome was **data-forced**: the decline follows from per-specimen
scores already observed before this file existed (c1 and c6 both `truth_full` 0.9767, so
both genomes' selected-winner truth is identical regardless). The `harness-mine`
verification (below) is read-only and was already run. The load-bearing discipline this
pre-reg locks is the **metric choice** (truth_full, not the sharpened 5abc axis), which is
independent of commit timing.

## 0. Why this run exists, and what it can and cannot claim

Five fresh substrates (streamStats 3-seed, shuffle probe, weightedSample K=8, expr-eval
probe, and this cron pool) establish a **structural negative**: a broad competency gain
from suite-sharpening needs an axis that is **substantial ∧ split ∧ suite-invisible**
simultaneously, and those three are mutually exclusive in practice (see
`../EXPERIMENT-SUMMARY.md`). cron is the ONLY substrate that carries a real, automated,
*discoverable* blind spot (the documented `5abc` malformed-token class) — so it is the
one place to run the **flagship automated mechanism** (`harness-mine` → sharpen) end to
end and see what the promotion gate does.

**Two claims, kept surgically separate (per the discipline):**
1. **MECHANISM (positive):** the harness can automatically *discover and bake in* a real
   blind spot. `harness-mine` twice-verifies the `malformed-trailing-token` mutator: it
   SURVIVES the permissive sealed suite (genuine gap, half-i ✓) and is KILLED by the
   sharpened suite (half-ii ✓).
2. **COMPETENCY (the hypothesis under test):** does sharpening make the *shipped* code
   broadly better? Measured ONLY on the established held-out oracle **`truth_full`** —
   NOT on the `5abc` axis that was sharpened (mutator-axis == metric-axis is teach-to-the-
   test; the judge-arm already ruled `5abc` suite-expressible and truth-neutral).

## 1. harness-mine verification (read-only, already run)

| half | suite | expected | observed |
|------|-------|----------|----------|
| i  | permissive `suites-v2/cron.sealed.mjs` | survives: true  | **survives: true** |
| ii | sharpened `cron.sealed-sharpened.mjs`  | survives: false | **survives: false** |

→ `malformed-trailing-token` is a genuine, bakeable blind spot. Mechanism confirmed.

## 2. The competency measurement (the decision rule, locked here)

Pool: 8 fresh blind `haiku` cron specimens (`cron-pilot/runs/frontier-pool/c{1..8}`).
Natural split on `5abc`: c6 rejects (spec-correct), the other 7 accept (base rate ~1/8).

- Incumbent genome `baseline-v0` selects by the **permissive sealed** passRate. Its
  indifference set = the sealed-best specimens; its realized competency =
  **mean `truth_full` over that set**.
- Sharper genome `sharper-cron-v1` selects by **sealed + the promoted must-throw battery**
  (tiebreak toward malformed-rejection); its realized competency = **mean `truth_full`
  over its selected winner(s)**.
- **Fitness scalar fed to `harness-fitness` = the selected winner's `truth_full`.**

### Decision rule + pre-stated expectation
- Promote `sharper-cron-v1` iff its selected-winner `truth_full` **exceeds** the
  incumbent's AND the five gates pass.
- **Pre-stated expectation: the gate DECLINES.** `truth_full` is decoupled from the
  `5abc` axis (in this pool c5 *accepts* 5abc yet has the highest truth_full 1.0; c6
  *rejects* 5abc but truth_full 0.9767). Sharpening changes *which* sealed-best specimen
  is chosen (c6 over c1) but both have identical `truth_full` (0.9767) → Δ=0 → σ-collapse
  → no promotion. This is the honest capstone: **the mechanism fires; competency on the
  held-out oracle does not move; the gate correctly declines.** A promotion here would
  require weighting the sharpened axis (rigging) — explicitly refused.

## 3. What this run is NOT
- NOT a demonstration that the harness ships more competent code (truth_full is flat).
- NOT a reopening of the `5abc`/judge-arm verdict (it corroborates it through the
  meta-loop lens).
- NOT a constructed pool, vague contract, or axis-weighting — all refused.
