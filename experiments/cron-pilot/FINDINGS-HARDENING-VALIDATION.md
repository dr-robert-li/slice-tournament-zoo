# Validating the test-author hardening (permissive-suite guide) — blind, on cron

Tests the harness change: `stz-test-author` now must write **rejection** + **discriminating**
cases (the permissive-suite guide), so a spec-violating specimen can't tie a correct one. CONTROLS-2
proved the gap: the old sealed suite scored malformed-accepting code 1.000.

## Method (blind, non-circular)

- Spawned **3 hardened `stz-test-author`** instances seeing ONLY `slice/CONTRACT-VAGUE.md` —
  forbidden from `experiments/` findings, the probe, the truth suite, the old `cron.sealed.mjs`, and
  every specimen. Each wrote a new sealed suite + a reference it must satisfy.
- Control = the existing `suites-v2/cron.sealed.mjs` (already ties the specimens at 1.000).
- Scored the 7 probed specimens against old + all 3 new suites (`score-v3-validation.mjs`).
- **Did NOT** hand-author a suite, judge suites against the probe, or re-validate after seeing the
  result — those would be train-on-test (the experiments dir contains the answer).

## Result — mixed, and informative

**Structural win (the guidance is followed): 3/3 authors added rejection cases** (15, 17, 17
negative assertions each), all reference-green. **The "stay within the contract" guard held**:
author-3 explicitly *cut* `a/n`, `dow=7`, and inverted-range negatives because the vague contract is
silent on them — so the edit did **not** reintroduce the mirror (fragile-invariant) bug. That is
positive evidence the v1 edit is safe.

**Empirical separation: weak.** None of the new suites cleanly separated the malformed-rejecting
specimens (orig-a/orig-b) from the accepting ones; all specimens still scored ~1.000 (author-2:
0.994 on 3 specimens, on a non-malformed axis).

| specimen | malformed | OLD-sealed | v3-author-1 | v3-author-2 | v3-author-3 |
|----------|-----------|-----------|-------------|-------------|-------------|
| orig-b / orig-a | REJECTS | 1.000 | 1.000 | 1.000 | 1.000 |
| orig-c / orig-d / new-e / new-g / new-h | accepts | 1.000 | 1.000 | 0.994–1.000 | 1.000 |

## Why (root cause — `probe-malformed-battery.mjs`)

Of nine malformed forms, **only two leak**, and only one discriminates:

```
form:            5abc  abc  99  4fld  6fld  */0  1-40  5-  .
orig-a/b (REJ):   ·    ·    ·    ·     ·    ·    A     ·   ·
orig-c.. (acc):   A    ·    ·    ·     ·    ·    A     ·   ·
                  ^discriminates                ^leaks on ALL (incl. REJ)
```

- The malformed forms a blind author naturally hand-picks — a standalone out-of-range value (`99`),
  wrong field count, `*/0`, a fully-non-numeric token (`abc`), an invalid date — are **already
  rejected by every specimen**. They add coverage but no discrimination.
- The leniency that actually ships hides in the **parser's soft spots**: `5abc` (a token that is
  *partly* valid — `parseInt` reads `5`, drops the junk). That is the **only** form separating
  REJ from accept — and **0/3 blind authors picked it** (they wrote `abc`, `a b c d e`, not `5abc`).
- `1-40` (out-of-range *inside* a range) leaks on **every** specimen, including orig-a/orig-b. So
  even the "strict" specimens aren't fully strict — **the answer is a sharper suite, not a better
  specimen.**

## Conclusion

**Require-rejection-cases is necessary but NOT sufficient.** It reliably changes authoring behaviour
(3/3) and closes a real conceptual hole (the permissive-suite class was undocumented), but
hand-picked negatives cover only the obvious forms; the discriminating leniency lives in parser soft
spots a fixed list misses. **The real lever is a property-based generator over the negative space**
(mutate valid inputs to invalid, assert each throws) — added to the guide as a general PBT principle
(NOT keyed to `5abc`/`1-40`, which would be train-on-test).

**This was NOT re-validated on cron** — these specimens are burned (the leniency location is known),
so a re-run catching `5abc` would prove only "authors follow fuzz instructions on a known-fuzzable
task," not generalisation. A clean validation of the PBT-negative principle needs a **fresh contract
whose specimens have not been probed**. Roadmapped, not claimed.

## What ships on this evidence

- v1 rejection/discrimination guide — safe (mirror-bug guard held), closes the conceptual gap,
  strictly ≥ the old guide (more negatives never hurts).
- PBT-negative-space principle — reasoned hardening, clean-worded, validation deferred to a fresh
  task.
- Honest status: on cron, the change did not yet move the number — because the gap is a parser soft
  spot, and the fix for that is the generator, whose proof is pending a non-contaminated task.
