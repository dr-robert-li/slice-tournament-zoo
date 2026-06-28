# RESULTS — judge-as-selection-gene (decisive cron test)

> Pre-reg: `PREREG.md` (`ecdbfad`, before any judge spawned). Data:
> `results/{cron-full-truth,cron-judge-result}.json`.

## TL;DR — NULL (a slight negative)

The judge is the one selection signal **not** derived from the sealed suite, so it was the
only structurally-possible path to a competency positive. On the decisive cron test, **5
frozen blind Sonnet judges shipped a *lower*-truth winner than the numeric baseline.** The
residual held-out truth is unreachable even by the judge. Per the pre-reg, cron is negative
→ the cross-slice train/test is not run.

## The test

Fixed cron pool (8 blind specimens). Metric = **full-contract held-out truth** (functional
`truth_full` + the contract-mandated malformed battery), disjoint from any sealed suite.
5 independent frozen judges read **only** the contract + the 8 specimen codes (blind to all
suites/truth) and each picked the single most spec-correct.

| | shipped winner | full_truth |
|---|---|---|
| numeric baseline (sealed-best {c1,c6}, expected) | — | **0.9732** |
| **judge** (majority 4/5 → c4; 1 → c6) | **c4** | **0.9643** |
| reachable ceiling | c5 / c6 | 0.9821 |

**Judge − baseline = −0.0089.** The judge ships *below* the numeric baseline and far below
the ceiling.

## Why — the informative part

The judges were **not incompetent** — they found *real* bugs, correctly downgrading c5's
DOW=7 logic bug and c7/c8's broken Vixie restriction-detection. But their quality criterion
— **depth of visible defensive validation** (they unanimously praised c4's explicit
Feb-30/calendar-rollover guard) — **diverged from held-out truth**, which is dominated by
functional case-coverage + malformed-rejection. They over-valued c4's rigor and
under-valued c6's malformed-rejection (13/13) and c5's functional completeness (43/43) — the
actual ceiling. **"Looks most rigorous" ≠ "passes the most held-out truth,"** and naming
malformed-rejection in the prompt did not fix it.

## What this closes

Combined with the numeric arms, **every available selection signal is now tested** and
none ships the truth-best specimen on cron:
- numeric proxies (`pass`/`coverage`/`kill`) — sealed-derived, structurally blind to
  outside-sealed truth;
- the **judge** — not sealed-derived, but its code-reasoning quality criterion is
  *miscalibrated* against held-out truth (rewards defensive rigor over case-coverage).

So the competency positive is **not earned by selection-genome evolution of any kind on
these substrates**. The mechanism (auto-discover + bake a blind spot) still works; turning
it into broadly-more-correct shipped code does not.

## Bounds / what stays open
- n=1 slice, 1 pool, 5 votes; **one** judge rubric (shopping rubrics on cron until c6 wins
  = the refused shopping trap). A stronger or differently-rubric'd judge *might* do better —
  untested; the honest read is the default judge signal does not reach the residual truth.
- The remaining genuinely-open cell is unchanged: a **heterogeneous frontier-vs-frontier**
  pool (different question — pool diversity, not selection signal). The user's call.
