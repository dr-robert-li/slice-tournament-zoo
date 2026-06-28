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

**Conclusion (scoped).** The residual truth signal (what makes c5 best) is in **none of
the three cheap proxies**, so a weight gene over *those* proxies cannot ship a higher-truth
winner than baseline, **in-sample on cron**. This is proxy exhaustion *here* — for this
pool, these proxies. It is **not** a definitive ceiling for selection-based self-improvement,
and the most important reason is the omission: **`kill` (mutation-survival) is the STZ
proxy designed to encode exactly this functional gap** (c5's extra correctness), and it was
not tested. So "the selection lever can't reach it" is **not earned** — only "these three
cheap proxies don't, on cron." The full claim needs the real reward-weight set (incl.
mutation-kill + coverage) across the cross-slice train/test — see open cell.
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
- **Arm A is a scoped probe, not the pre-registered test.** The full experiment — evolve
  the real reward-weight set **including mutation-kill and coverage** across the cross-slice
  **train/test** (cron/ipv4 → hexcolor, with truth oracles built for each) — was **not
  run**. It is the single most important open item: mutation-kill is the proxy designed to
  encode functional correctness, and it could plausibly rank c5 first where the cheap
  proxies cannot. Until then, "selection can't reach competency" is unproven.
- Arm B tested transfer to hexcolor + ipv4; a different recurring class on a different
  parser family could in principle share a blind spot — untested.
- The genuinely open cells: (1) the **full reward-weight cross-slice train/test** above;
  (2) a **heterogeneous frontier-vs-frontier** pool. Both larger experiments, the user's
  call. Neither was staged here (refusing to build mutation-kill under the hook = the
  shopping trap).
