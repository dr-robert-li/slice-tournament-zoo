# RESULTS — the competency experiment (Arms A + B)

> Pre-registration: `PREREG.md` (committed `abc4240`, before build). Both arms returned
> **nulls, for two distinct structural reasons** — and together with the prior six arms
> they complete the picture: the meta-loop's *mechanism* works, but neither of its two
> levers (selection-gene, cross-slice sharpening) yields a *transferable competency gain*
> on these substrates.

## Arm A — selection-gene: proxy exhaustion **on cron, with three cheap proxies** (a scoped null, NOT the full pre-registered test)

**Deviation from pre-reg, stated up front.** The pre-reg specified evolving the five
reward weights `{pass,coverage,kill,codeHealth,clean}` on TRAIN={cron,ipv4} → TEST=hexcolor.
What actually ran is **narrower**: a **cron-only, in-sample** grid over **three cheaply
per-specimen-computable proxies** `{sealed, malformed, codeHealth}`. `coverage` and — more
importantly — **`kill` (mutation-survival) were dropped** because they are not cleanly
per-specimen-computable without the heavier eval-runner machinery, and ipv4/hexcolor truth
oracles were not built, so the **cross-slice train/test never ran**. This is a real result
but it is *not* the pre-registered experiment; treat it as a scoped probe.

The hypothesis needs a computable selection proxy to correlate with hidden truth. For the
**three cheap proxies tested**, on the cron pool (8 blind specimens), none does:

| specimen | sealed | malformed | codeHealth | **truth** |
|---|:---:|:---:|:---:|:---:|
| c1 | **1.0** | 0.923 | 0.538 | 0.9767 |
| c5 | 0.9992 | 0.923 | 0.557 | **1.0** ← truth-best |
| c6 | **1.0** | **1.0** | 0.525 | 0.9767 |
| c7 | 0.960 | 0.923 | **0.567** | 0.9767 |

- **truth-best = c5**, but c5 is the **argmax of no proxy** (sealed→c1, malformed→c6,
  codeHealth→c7).
- Grid search over **all** weight tuples `{sealed, malformed, codeHealth}`: the best
  achievable shipped-winner truth is **0.9767** — **identical to baseline**. No reweighting
  ships c5.

**Follow-up: mutation-kill tested (closes the flagged gap).** `kill` (mutation-survival)
was the proxy most likely to encode c5's functional edge. Computed per specimen, it does
**not** rank c5 first — it ties the truth-best (c5, 1.0) with the truth-**worst** (c3,
0.9535) at 0 survivors. So the **full computable proxy set** `{sealed, malformed,
codeHealth, mutation-kill}` cannot ship c5.

**Conclusion (now earned, with a structural reason).** No weighting of the computable
numeric proxies ships the truth-best specimen, because **all of them are
sealed-suite-derived** (pass / coverage / mutation-kill all measure the specimen against the
sealed suite), and **c5's truth advantage is *outside* the sealed suite by construction** —
c5 is sealed-*worse* (0.9992) yet truth-*best* (1.0). A signal derived from the sealed suite
cannot rank a specimen by quality the sealed suite does not test. Since evolution cannot beat
baseline **in-sample** on cron, the cross-slice train/test is moot (nothing to generalize).
Caveat held: this is cron-only; coverage wasn't separately computed (it is sealed-derived
too, so the structural argument covers it). (`results/armA-cron.json`.)

**The one selection lever that is NOT sealed-derived: the judge.** The only selection signal
independent of the sealed suite is the **judge** (LLM reasoning over code + contract). Prior
`cron-pilot/FINDINGS-CONTROLS-2.md` showed a frozen judge picks the spec-correct candidate
3/3. Evolving/testing the **judge** as a selection gene (`rubricId`), train/test across
slices vs the numeric-proxy baseline, is the honest path to a *possible* competency positive
— not more numeric-weight evolution. (Open cell.)

## Arm B — amortization: NULL by **idiosyncratic (non-shared) blind spot**

The amortization claim needs the discovered blind spot to **recur** across the slice
family. The `missing-end-anchor` mutator (`$/` → `/`; accept trailing garbage), discovered
and twice-verified on cron (`../cron-capstone/`), applied to hexcolor:

| slice | permissive good-faith suite blind to it? | evidence |
|---|---|---|
| cron | **yes** (survives) | parseInt-truncation of `5abc` is subtle; the permissive suite misses it |
| hexcolor | **no** (killed) | the mutant accepts `#1234567`/`#123456xx`; the permissive `old-1` suite **catches** it (passRate 0.963, 80 cases fail) — a good-faith hex author naturally tests trailing garbage |
| ipv4 | n/a | uses `parseInt` range-validation, not a regex anchor — the same mutator does not even apply (different idiom) |

**Conclusion:** the blind spot is **slice-idiosyncratic, not family-recurring**. cron's
permissive suite missed its malformed-token edge because that edge is subtle (digit
truncation); hexcolor's good-faith suite already catches its (obvious) malformed cases; and
ipv4's validation idiom differs entirely. So baking the cron discovery once does **not**
harden the family — the family does not share the blind spot. Amortization of this
discovery is cron-specific. (`results/armB-hex.json`.)

## What this earns (and what it does not)

- **The competency positive is NOT earned** on these substrates. The two new arms add
  mechanism detail, with honestly-scoped strength:
  - **selection lever** — the residual truth signal isn't in the *three cheap* proxies
    tested on cron (A). NOT a proven ceiling: the designed mutation-kill proxy and the
    cross-slice train/test were not run.
  - **sharpening lever** — the cron blind spot doesn't transfer; the family's blind spots
    aren't shared (B). Well-grounded (`old-1` = pre-hardening good-faith suite, per the
    hexcolor pilot's own FINDINGS, still catches it).
- **The mechanism still works** (cron `harness-mine` discover+bake; `../cron-capstone/`) —
  unchanged, and kept separate.
- **The honest boundary, now three-deep (legs 1–2 firm, leg-3 scoped):** a homogeneous
  capable pool gives correlated errors (no split); where a split exists the axis is small
  and invisible to the *cheap* proxies tested (no selection gain *from those proxies* — the
  designed mutation-kill proxy untested); and the small blind spots are idiosyncratic (no
  sharpening transfer). The legs point the same way; the selection leg is a cron-scoped
  probe, not a proof.

## Bounds / open cell
- **Arm A is cron-only and in-sample**, but the full computable proxy set (incl.
  mutation-kill) is now tested and null, with a structural reason. A cross-slice
  numeric-weight train/test would only confirm a structurally-predicted null at large cost
  (build ipv4/hex truth oracles) — **low value**.
- Arm B tested transfer to hexcolor + ipv4; a different recurring class on a different
  parser family could in principle share a blind spot — untested.
- **The promising open cell:** evolve/test the **judge** as a selection gene (the one signal
  independent of the sealed suite), train/test across slices vs the numeric-proxy baseline.
  CONTROLS-2 already hints the judge can pick spec-correct winners. This — not more numeric
  proxy evolution — is the honest path to a possible competency positive.
- Also open: a **heterogeneous frontier-vs-frontier** pool. Both are the user's call; the
  judge-selection experiment is the higher-value one.
