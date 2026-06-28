# PRE-REGISTRATION — judge-as-selection-gene (the one structurally-possible positive)

Committed before any judge is spawned. The numeric-proxy arms (`../competency-experiment/`)
closed with a structural null: every numeric selection proxy (`pass`, `coverage`,
`kill`) is **sealed-suite-derived**, and the residual held-out truth lives *outside* the
sealed suite by construction, so no numeric weighting can reach it. The **only** selection
signal not derived from the sealed suite is the **judge** (LLM reasoning over code +
contract). This arm tests whether *that* signal ships higher-truth code.

## Why the judge is the right gene (the advisor's rule)

*The gene must be able to move the metric you score.* A suite-battery gene moves only its
axis (→ circular or null-by-construction). The **judge is a general correctness reasoner**:
it can, in principle, move a **full-contract-truth** metric on any dimension. So the judge
is the one gene for which a non-circular competency test exists.

## Hypothesis

A frozen, blind judge used as the selection signal ships a **higher full-contract-truth**
winner than the numeric-proxy baseline, on a **fixed** pool — and generalizes to a slice it
never saw.

## Metric — full-contract held-out truth (NOT the sealed suite, NOT a single axis)

`full_truth` = the held-out truth oracle covering **all** contract requirements
(functional + the contract-mandated malformed-rejection), inputs disjoint from any sealed
suite. For cron: `full_truth = (truth_full functional cases + the must-throw malformed
battery)`, normalized. The judge **never sees** this oracle or any sealed suite — it reads
only the contract + each specimen's code.

## Conditions (fixed pool, frozen blind judge)

- **Pool:** the existing blind specimen pools (`cron-pilot/runs/frontier-pool/c1..8`;
  later ipv4/hexcolor). Held **fixed** across conditions.
- **Baseline genome:** numeric selection — winner = sealed-best (its indifference set's
  expected full_truth).
- **Judge genome:** winner = the frozen blind judge's pick (pairwise, V votes; majority),
  reading contract + code only. The judge is `stz-judge`/`claude`, frozen prompt, no truth,
  no sealed suite.

## Decisive cron existence test (run first)

Does the judge ship a higher-`full_truth` winner than the numeric baseline on cron? The
numeric baseline is indifferent within its sealed-best set {c1 (accepts `5abc`), c6
(rejects)}; a judge that reasons about the contract's "throw on malformed" clause should
prefer c6 (and ideally the truth-best c5). If the judge ships ≥ c6's full_truth where the
baseline expects avg{c1,c6}, that is a real gain. **If the judge cannot, the residual truth
is unreachable by *any* current signal — a definitive selection ceiling.**

## Cross-slice train/test (only if cron is positive)

TRAIN = {cron, ipv4}, TEST = {hexcolor}. Pick the judge config that maximizes TRAIN
shipped-winner full_truth; freeze; report TEST shipped-winner full_truth, judge vs numeric
baseline. Requires building full_truth oracles for ipv4/hexcolor. The TEST slice is the
non-circular independent oracle.

## Decision rule + NULL

- **Earned** iff judge-genome shipped-winner full_truth **>** numeric baseline, **by
  re-ranking within the fixed pool** (a functionally-better specimen the numeric proxy
  ranked lower), on the **held-out** slice.
- **NULL risks (real, pre-stated):**
  1. The judge-arm found the judge's value is *one-time authoring*, and ruled the
     judge-*loop* not warranted; judge-*selection* (CONTROLS-2) was small (n=3). The judge
     may not beat numeric baseline at scale.
  2. The cron c5 gap is ~1 functional case — likely **below judge resolution**; the judge
     may only reach the *malformed* axis (clear spec violation), not the fine scheduling
     edge. If so the gain is small and may not generalize.
  3. Judge noise: pairwise order-effects (the cron order-effect is documented). V votes +
     order-swap control.
- Any null is reported as the result. No staged positive.

## Discipline
Judge blind to truth + sealed; fixed pool; full-contract metric (general, not the judge's
own axis); train/test for generalization; N6 (frozen judge prompt + stored pairings).
Symmetric-error null held under the goal + Stop hook.
