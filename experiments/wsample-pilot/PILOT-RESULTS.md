# RESULTS — the OUT-OF-RECALL arm (weightedSample)

> Pre-registration: `PREREG.md`, committed at `ad4e1bf` **before any specimen existed**.
> Machine-readable: `results/evolve-result.json`, `results/evolve-scores.json`.
> N6 archive: `.stz/60-harness/MANIFEST.json`. Scores recompute from stored artifacts via
> `score_evolve.mjs`. Companion to `../streamstats-pilot/PILOT-RESULTS.md`.

## TL;DR

This arm exists because the streamStats and shuffle nulls only tested the **in-recall**
cell; the sharpened boundary is about the **out-of-recall** cell, where the goal's
required positive lives. `weightedSample` (weighted sampling without replacement) is
non-enumerable (correctness is a distribution) **and** recall-resistant (the correct
Efraimidis–Spirakis exponential-key scheme is not reflexively memorized; the tempting
`weight*random` heuristic is a natural wrong answer).

**Outcome: a third NULL — and the most informative one.** All 8 blind specimens are
correct (truth = 1.0), via a *mix* of algorithms. Out-of-recall did **not** produce
failure: given a faithful precise contract, blind `haiku` **reasoned** to correct
implementations rather than recalling one. The five-gate machinery again **correctly
promoted nothing**.

## 1. Separation gate (the substrate discriminates, with a large margin)

| reference impl | `fixed_suite` | `property_suite` | `truth` |
|----------------|:---:|:---:|:---:|
| correct (Efraimidis–Spirakis) | **1.000** | **1.000** | **1.000** |
| naive (`weight*random` sort) | **1.000** | 0.091 | 0.158 |

The naive impl passes the good-faith structural fixed suite completely but fails the
distributional property (0.091) and held-out truth (0.158). The gap (1.0 vs 0.158) is
large — a mixed blind pool would clear the σ floor easily, unlike streamStats' thin
0.899-vs-1.0 margin. Train-on-test avoided: property = pairwise `P(i before j)` under
`SEED_P`; truth = absolute `P(first=i)` under `SEED_T` (different statistic, different
seed). Determinism via a seeded `Math.random` monkeypatch.

## 2. The blind pool — all correct, by reasoning not recall

K=8 blind `haiku` specimens (contract only). Spread detected per the pre-reg by running
the validated truth oracle (truth < 1 ⇒ a natural buggy specimen):

| specimen | fixed | property | truth | algorithm |
|---|:---:|:---:|:---:|---|
| c1 | 1.0 | 1.0 | 1.0 | other-correct |
| c2 | 1.0 | 1.0 | 1.0 | Efraimidis–Spirakis exp-key |
| c3 | 1.0 | 1.0 | 1.0 | cumulative / roulette (renormalized) |
| c4 | 1.0 | 1.0 | 1.0 | cumulative / roulette (renormalized) |
| c5 | 1.0 | 1.0 | 1.0 | cumulative / roulette (renormalized) |
| c6 | 1.0 | 1.0 | 1.0 | other-correct |
| c7 | 1.0 | 1.0 | 1.0 | Efraimidis–Spirakis exp-key |
| c8 | 1.0 | 1.0 | 1.0 | Efraimidis–Spirakis exp-key |

Zero buggy specimens. Blindness audit: 0/8 reference any suite/oracle constant (clean).
`fitness_inc = fitness_mut = 1.0`; no gap, no win.

**The finding:** unlike streamStats (one memorized algorithm) the pool used *several*
distinct correct algorithms — so this is genuinely out-of-recall in the sense that there
is no single canonical the model retrieves. Yet every specimen is correct, because the
contract states the distribution precisely (`P(first=i)=w/Σw` and the pairwise law) and a
careful implementer can *reason* to a correct cumulative method. The natural wrong answer
I built the arm to catch — `weight*random` — was written by **none**.

## 3. The machinery declined again (correctly)

```
harness-fitness baseline-v0 -> 008ec06ffaa1d4e6  fitness 1.0
harness-fitness sharper-v1  -> 63089087a032df8f  fitness 1.0
harness-select [both @1.0]  -> sigma 0 < floor 0.02  ->  VARIANCE COLLAPSE, winner null
harness-promote sharper-v1  -> promote:false  failed:[does-not-beat-incumbent,
                                                       generation-variance-collapsed]
                               interface-parity: OK
```

## 4. Analysis — the boundary, doubly sharpened

- judge-arm: a win needs **non-enumerable** correctness.
- streamStats/shuffle: …**and out-of-recall** (memorized tasks don't split).
- **weightedSample (this arm): …and the real binding precondition is implementer
  fallibility on the axis.** A suite-sharpening / search win requires blind specimens to
  actually fall into the blind spot. Competent specimens reasoning from a *faithful
  precise* contract do not — by recall on famous tasks, or by reasoning on
  unfamiliar-but-precisely-specified ones. The win-cell needs specimens at their genuine
  **competence frontier** (a task hard enough that they err) — not merely a non-enumerable
  or unmemorized task.

Manufacturing errors by making the contract vague on the failing axis is the
opposite-direction confound (coaching toward failure) and was **not** done. The honest
conclusion is that, with capable implementers and faithful contracts, the blind spot the
sharper genome exploits does not arise — so the 0.9.0 promotion machinery, run across two
full arms (streamStats, 3 seeds; weightedSample, one K=8 pool) plus one fingerprint-only
probe (shuffle, 5 specimens), correctly promotes nothing. Scope: what executed on real
data is the no-gap **decline** path; the promotion path was exercised only in unit tests.
That is the symmetric-error anti-build null, and it is the result.

## 5. Bounds

- n=3 substrates; one capable-but-small implementer; precise contracts by design.
- The separation gate proves each *suite* discriminates; the null is about *implementers*.
- Constructed-pool promotion rejected throughout.
- N6: deterministic re-scoring from stored artifacts; `MANIFEST.json` is the audit trail.
