# RESULTS — the competency experiment (Arms A + B)

> Pre-registration: `PREREG.md` (committed `abc4240`, before build). Both arms returned
> **nulls, for two distinct structural reasons** — and together with the prior six arms
> they complete the picture: the meta-loop's *mechanism* works, but neither of its two
> levers (selection-gene, cross-slice sharpening) yields a *transferable competency gain*
> on these substrates.

## Arm A — selection-gene: NULL by **proxy exhaustion** (decided on cron, in-sample)

The hypothesis needs a computable selection proxy to correlate with hidden truth. On the
cron pool (8 blind specimens) it does not:

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

**Conclusion:** the residual truth signal (what makes c5 best) is in **none** of the
computable proxies, so selection-gene evolution cannot ship a higher-truth winner — it
cannot beat baseline even **in-sample**, so the train/test generalization is moot. This is
the pre-registered proxy-exhaustion null. It is a real, definitive statement about the
**ceiling of selection-based self-improvement**: selection can only surface truth a proxy
already encodes, and on cron the proxies are saturated at the residual gap.
(`results/armA-cron.json`.)

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

- **The competency positive is NOT earned**, and the two new arms say *why* in mechanism
  terms, beyond the prior "error-correlation" finding:
  - **selection lever** can't reach it — the truth signal isn't in the proxies (A);
  - **sharpening lever** can't transfer it — the blind spots aren't shared (B).
- **The mechanism still works** (cron `harness-mine` discover+bake; `../cron-capstone/`) —
  unchanged, and kept separate.
- **The honest boundary, now three-deep:** a homogeneous capable pool gives correlated
  errors (no split); where a split exists the axis is small and proxy-invisible (no
  selection gain); and the small blind spots are idiosyncratic (no sharpening transfer).
  All three legs point the same way.

## Bounds / open cell
- Arm A used 3 cheaply-computable proxies; the full STZ signal set adds coverage + mutation
  — but the cron pilots already showed selection reaches the sealed ceiling, and c5's
  superiority is a functional-correctness difference no cheap proxy encodes.
- Arm B tested transfer to hexcolor + ipv4; a different recurring class on a different
  parser family could in principle share a blind spot — untested.
- The genuinely open cell remains a **heterogeneous frontier-vs-frontier** pool with a
  **richer proxy set**; both larger experiments, the user's call. Neither was staged here.
