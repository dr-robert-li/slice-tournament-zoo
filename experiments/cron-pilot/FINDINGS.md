# Cron-Pilot Findings — does STZ beat naive iteration on a HARD task?

Companion to `../slugify-pilot/DRY-RUN-FINDINGS.md`. Same protocol, harder task (`nextRun`,
cron next-firing-time), vague spec + Haiku implementers, **blind-authored** sealed suite.

## Honesty gate (frozen)

Reference passes public (10/10) + truth (43/43). All naive fixtures fail truth; the classic
**dom/dow AND bug** (`naive-1`) passes public 1.0 but fails truth 0.953 — proving truth
discriminates a genuine cron bug the happy-path suite misses. Suites sealed (`seal.mjs`).

The sealed suite (`suites-v2/cron.sealed.mjs`, 1243 checks) was authored by `stz-test-author`
**blind to the truth suite**, from the vague contract only.

## Results (n=3 seeds; cells = blind-SEALED / TRUTH passRate)

| seed | spec-a | spec-b | spec-c | spec-d | B (naive) | C-winner (best sealed) | B |
|------|--------|--------|--------|--------|-----------|------------------------|---|
| 1 | 0.999/0.977 | 1.000/**1.000** | 1.000/**1.000** | 0.993/1.000 | 0.993/0.977 | b → **1.000** | 0.977 |
| 2 | 1.000/**1.000** | 0.999/1.000 | 1.000/1.000 | 1.000/1.000 | 0.993/0.977 | a → **1.000** | 0.977 |
| 3 | 1.000/0.977 | 0.993/0.977 | 1.000/0.977 | 0.994/**HANG** | 0.999/**HANG** | a → 0.977 | **DNF (hang)** |

`C` = best-of-N selected purely by the blind sealed suite (tie → first id). `A` (tournament+judge)
selects from the same top-sealed tier; in every seed that tier is truth-tied, so **A ≈ C** — the
judge adds nothing here (consistent with the structural judge-ablation note from slugify).

### The success metric is ABSOLUTE correctness, not per-token (by project design)

STZ's README (§47–50) explicitly discloses the tradeoff: a tournament is "deliberately
redundant … **token-intensive, far more than a single-agent run.** That buys selection pressure
and an auditable trail." So **per-token efficiency is NOT the objective** — STZ trades compute
for absolute correctness on purpose. Judging it by quality-per-token and declaring "naive wins"
misreads the project's own value proposition. Token figures below are reported (a) for
comparison fairness — so an absolute win can't be dismissed as merely "spent more on the same
axis" — and (b) to quantify the disclosed price, not as the scorecard.

| seed | C tokens (4 specimens) | B tokens (1 agent) | C truth | B truth | cost multiple | truth/100k (C / B) |
|------|------------------------|--------------------|---------|---------|---------------|--------------------|
| 1 | 86,714 | 26,295 | **1.000** | 0.977 | 3.3× | 1.15 / 3.72 |
| 2 | 115,933 | 26,509 | **1.000** | 0.977 | 4.4× | 0.86 / 3.69 |
| 3 | 66,441 | 30,255 | **0.977** | 0.000 (hang) | 2.2× | 1.47 / 0.00 |

### Outcome (on the project's own metric: absolute correctness)

- **STZ ≥ naive on the hard task, every seed.** Seeds 1–2: C/A = **1.000** vs B = **0.977**.
  Seed 3: C = **0.977** vs B = **DNF (hang)**. The opposite of slugify, where bugs were
  convention-only and STZ ≈ B.
- **The cost multiple (2–4×) is the expected, README-disclosed price** of selection pressure —
  not a refutation. Per-token, naive is cheaper (1–4×); the project never claims otherwise.
- **But the absolute edge is modest and partly soft — read the three caveats below before
  banking it.** The honest one-liner: *on the metric STZ optimizes (absolute correctness), it
  beats naive iteration on the hard task in all 3 seeds; the win is real but small (≈ one
  feature) and one seed is a hang-avoidance, and STZ pays the disclosed 2–4× compute premium for
  it.*

### What actually drove the gaps (with the convention caveat the advisor flagged)

- **Spec-gap-assisted (discount like slugify's NFKD):** the recurring +0.023 in seeds 1–2 is
  **7-as-Sunday**. Implementers got a vague brief that literally said "0–6"; the truth suite + the
  blind test-author require `7 ≡ Sunday`. That is *real POSIX* (more defensible than NFD-vs-NFKD),
  but it is **structurally the same shape** as the NFKD case discounted on slugify: the oracle and
  test-author share an assumption the implementers' spec excluded. It must be flagged as
  spec-gap-assisted, not banked as pure correctness.
- **Genuinely unambiguous bugs (untainted):** the **step-0 `*/0` infinite loop** (seed-3 B) and a
  wrong throw on multi-year `0 0 29 2 *`. These are real defects with no spec ambiguity — but they
  showed up in seed-3 B, *not* in the seed 1–2 wins.
- **Seed-3's "win" was ranking luck, not detection.** specimen-d *also* hangs (sealed 0.994 /
  truth HANG); the blind sealed suite did **not** catch d's liveness bug. C avoided the hang only
  because `a` happened to outrank `d`. STZ's selection did not *detect* the hang.

### Contrast with slugify (the controlled comparison)

| | slugify (easy/ambiguous) | cron (hard) |
|--|--------------------------|-------------|
| implementer errors | correct-modulo-**convention** (NFD/NFKD) | mix: one spec-gap (7=Sun) + genuine bugs (step-0 hang, leap) |
| **absolute correctness (STZ's metric): STZ vs B** | ≈ tie | **STZ ≥ B all 3 seeds** (+0.023 s1–2; hang-avoid s3) |
| token cost: STZ vs B | ~4× | 2–4× (disclosed, accepted) |

**Refined conclusion (on STZ's own metric):** STZ's goal is **absolute correctness, bought with
extra compute by design** (README §47–50). On that metric: STZ **ties** naive when implementer
errors are convention-only (slugify) and **beats** naive when errors are genuine bugs (cron,
3/3 seeds). The 2–4× token premium is the disclosed price, not a strike against it. The honest
qualifier is on *magnitude, not direction*: the cron edge is small (≈ one feature), the recurring
driver is spec-gap-assisted, and one seed is a hang-avoidance rather than a quality win. So:
**directionally STZ does what it claims on hard tasks; this pilot shows the effect is real but
small, and a stronger demonstration needs unambiguous-bug gaps that don't lean on a spec gap.**

## Caveats

- **n=3, single task, single model tier, selection-only (judge ablation uninformative — the
  top-sealed tier is truth-tied every seed, so A ≈ C).**
- **Token parity is per-seed approximate** (specimen sums vs one B agent; sealed-author amortized).
  A cleaner study fixes a token budget and lets B iterate more rounds for equal spend.
- **Missing control: best-of-4 _naive_ agents.** That would isolate whether STZ's edge is the
  *selection signal* (sealed suite sees the bug) vs merely drawing 4 samples — the naive user
  can't select the good draw because their public suite can't see the bug. Worth running next.
- Brute-force specimens are slow on multi-year searches; two seed-3 impls exceeded a 60s grade
  timeout (one a genuine hang → DNF).
