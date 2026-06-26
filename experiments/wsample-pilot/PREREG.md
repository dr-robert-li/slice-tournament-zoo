# PRE-REGISTRATION — the OUT-OF-RECALL arm (weightedSample)

**Status:** committed BEFORE any blind specimen is generated (the git commit is the
timestamp). Methodology shared with `../streamstats-pilot/PREREG.md`; this file states
only what differs and the decision rule + null.

## 0. Why this arm exists

The streamStats and shuffle arms both returned a recall-saturation NULL: blind `haiku`
pools were 100% correct, so selection had nothing to discriminate. Those two tasks are
**in-recall** (variance→Welford, shuffle→Fisher-Yates are memorized). That tested the
*in-recall* cell. It said nothing about the cell the sharpened boundary is actually about
— **out-of-recall** — and that is where the goal's required positive ("a promoted variant
beats the incumbent") lives. This arm tests exactly that single variable.

`weightedSample` (`slice/CONTRACT.md`): weighted sampling without replacement.
**Non-enumerable** (correctness is a distribution — no finite example list expresses it)
AND **recall-resistant** (the correct algorithm, Efraimidis–Spirakis exponential keys
`U^(1/w)`, is far less memorized than Welford/Fisher-Yates; the tempting `weight*random`
heuristic is a natural, common, *wrong* answer). This is the one task property the two
nulls could not touch.

This is **not** shopping (which would be trying in-recall tasks until one randomly
splits) and **not** a constructed pool (the specimens are real and blind). It tests the
independent variable. The outcome is reported whatever it is — including a third null.

## 1. Separation gate (run BEFORE this commit — touches no blind data)

| reference impl | `fixed_suite` | `property_suite` | `truth` |
|----------------|:---:|:---:|:---:|
| correct (Efraimidis–Spirakis) | **1.000** | **1.000** | **1.000** |
| naive (`weight*random` sort) | **1.000** | 0.091 | 0.158 |

The naive impl passes the good-faith structural fixed suite completely but fails the
distributional property (0.091) and held-out truth (0.158). The gap is **large**
(truth 1.0 vs 0.158), so a mixed blind pool clears the σ diversity floor comfortably.
Train-on-test avoided: property = pairwise `P(i before j)=w_i/(w_i+w_j)` under `SEED_P`;
truth = absolute `P(first=i)=w_i/Σw` under `SEED_T` — different statistic, different seed.
Determinism: seeded `Math.random` monkeypatch; identical on re-run.

## 2. Design (same machinery, single-gene substitution)

- Genomes: `baseline-v0` (`explicit-examples-v0` → `fixed_suite`) vs `sharper-v1`
  (`property-fuzz-v1` → `property_suite`). One gene (`heuristicId`) differs.
- **K = 8** blind `haiku` specimens (one pool; `streamStats` used K=5, and a 5/5
  Fisher-Yates probe is weak evidence — at a 15% bug rate P(0 buggy in 5) ≈ 0.44, so K is
  raised). Contract only, blind to all suites.
- **Spread detection = the oracle itself.** Per advisor: no code fingerprint needed —
  run the validated `truth` oracle on each blind specimen; **truth < 1 ⇒ a natural buggy
  specimen**. (Algorithm fingerprint reported as corroboration only.)
- Selection value (per `streamStats` PREREG §3): expected truth over each genome's
  selector-indifference set:
  - `fitness_inc = mean_{i ∈ argmax fixedRate} truth(i)`
  - `fitness_mut = mean_{i ∈ argmax propRate} truth(i)`

## 3. Decision rule + null

- **Promotion:** `sharper-v1` is promoted iff `fitness_mut > fitness_inc` AND the five
  gates pass (driven through `stz bridge harness-fitness/select/promote`).
- **If the pool is mixed** (≥1 specimen with truth<1 that the fixed suite still passes at
  1.0, AND ≥1 correct specimen): the fixed suite's indifference set includes a low-truth
  specimen → `fitness_inc < 1`, while the property suite excludes it → `fitness_mut = 1`.
  Expected: **a genuine gated promotion** — the positive result.
- **NULL (reported, not retried):**
  - All-correct pool (recall saturated again) → no gap → no promotion → a **third
    cross-substrate null**, which now *includes the win-cell* and genuinely sharpens the
    boundary (the win-cell is empirically hard to reach even out-of-recall).
  - All-buggy pool → both suites pick from buggy; report the (smaller) gap or tie honestly.
- This is the only arm planned. No further substrate switch; whatever K=8 yields is the
  reported out-of-recall result.

## 4. Discipline

Blindness (specimens see only the contract; post-hoc grep audit), budget-match (shared
pool), symmetric-error null, N6 replay from stored artifacts + `60-harness/MANIFEST.json`.
A constructed pool remains rejected.
