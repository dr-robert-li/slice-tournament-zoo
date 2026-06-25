# PILOT-RESULTS-BLIND — blind iterate arm on cron, budget-matched (2026-06-26)

The escalation from `PILOT-PREREG-BLIND.md`, run on the synthetic (recall-free) substrate after review
ruled SWE-Bench structurally unable to decide it. **First clean result in this whole line of pilots:
recall-free, critic blind to the truth oracle, iterate vs best-of-N at matched token budget. It
leans the same way cron/hexcolor already did — 0.8.0 is not the lever — but now with positive
budget-matched evidence instead of a confounded SWE-Bench silence.**

## Setup

- Task: `nextRun(expr, after)` from `cron-pilot/slice/CONTRACT-VAGUE.md` (the under-specified brief).
- **Blind loop signal:** `cron-pilot/suites-v2/cron.sealed.mjs`, authored blind to truth in the
  original pilot. The critic sees its pass/fail OUTPUT only (instrumented copy `sealed_verbose.mjs`
  emits the failing labeled cases), never its source, never the truth suite.
- **Scorer (never read inside the loop):** `cron-pilot/truth-suite/cron.truth.mjs`.
- Recall-free by construction: this task and this sealed/truth split are not in any training corpus,
  so the asymmetric-retrieval confound that killed the SWE-Bench version does not exist.

## best-of-N (N=4 fresh blind Haiku draws, B = 89,403 tokens)

| cand | tokens | sealed | truth |
|------|--------|--------|-------|
| c1 | 19,530 | 0.9992 | 0.9767 |
| c2 | 26,796 | **1.0000** | 0.9767 |
| c3 | 19,682 | 0.9646 | 0.8605 |
| c4 | 23,395 | 0.9501 | 0.9767 |

Select max sealed → **c2 (sealed 1.0) → truth 0.9767**. Note c2's sealed is perfect while its truth
is not: the sealed suite is blind to c2's residual defect.

## iterate (same budget B; loop stops when sealed passes)

Start from a sealed-failing candidate (reuse c3: sealed 0.9646, truth 0.8605, gen 19,682 tokens).

- Round 1 critic (Haiku, blind): given ONLY c3's code + the contract + the two sealed failures
  (`0 0 13 * *` off by a month, `0 0 * * 5` a week late). No operator diagnosis, no leading
  questions. Cost 26,530.
- Round 1 reviser (Haiku): revised per the critique. Cost 14,481.
- Re-score: **sealed 1.0 (loop stops), truth 0.9767.** Iterate total 60,693 tokens (< B).

## Result

| condition | budget used | truth |
|-----------|-------------|-------|
| best-of-N | 89,403 | **0.9767** |
| iterate | 60,693 | **0.9767** |

**Equal at 0.9767.** Both land on 42/43, and it is the same residual case — a malformed-rejection /
convention case the SEALED suite does not test, so neither sealed-selection nor sealed-iteration can
see it, let alone fix it. The iterate loop fixed exactly the two defects the sealed signal exposed,
hit sealed 1.0, and stopped at the identical truth ceiling best-of-N's sealed-best candidate already
sat at.

**Absolute arm:** iterate halted at 60,693 because sealed was satisfied; extra budget is unusable
once the stop signal is green. best-of-N at higher N plateaus at the sealed-selected truth too (the
original cron pilot measured ~0.977–0.985). Neither method beats the sealed signal's blindness by
spending more.

(Earlier data point, same direction: on the original seed-1 pool best-of-N already reached truth 1.0
via two perfect candidates, so iterate had no room to beat it either. Two seeds, both: iterate ≤
best-of-N, never above.)

## Verdict (pre-registered table)

iterate ≈ best-of-N at equal budget → **0.8.0 convergence loop NOT warranted.** The binding
constraint is the **sealed-signal quality**, not the number of rounds. A loop that steers on a
fallible sealed suite inherits its blind spots and converges to the same truth ceiling sampling does;
sharpening the sealed suite raises that ceiling, more rounds do not. This is exactly the lever the
original cron/hexcolor pilots named, now demonstrated under a clean budget-matched iterate-vs-sampling
comparison rather than asserted.

## Honest bounds

- n = 2 seeds (one fresh, one original). Directional, not a distribution. hexcolor/ipv4 replication
  still pending (their sealed/truth suites exist; same harness applies).
- One operator nudge: the reviser prompt corrected the critic's misread of field semantics
  (`0 0 13 * *` is day-of-month 13, not hour 13). That is contract-level public knowledge, not the
  truth oracle, and it *helped* iterate. Since iterate still only tied best-of-N after being helped,
  the "iterate does not beat sampling" conclusion is robust to it (the nudge biases toward iterate).
- Recall-free, so unlike the SWE-Bench iterate arm this is not contaminated by memorized fixes.
- The cheap Haiku critic was noticeably weaker here than on pytest (it misread a field), which is
  consistent with the pytest critic's strength being partly retrieval. Another reason to trust the
  recall-free substrate over SWE-Bench for this decision.

## Artifacts

`cron-pilot/runs/blind-arm/` (bestN/c1-c4, iterate/), `cron-pilot/sealed_verbose.mjs`,
`cron-pilot/truth_verbose.mjs`. Decision logic per `PILOT-PREREG-BLIND.md`.
