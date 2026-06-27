# RESULTS — the automated-suite-sharpening CAPSTONE (cron)

> Pre-registration: `PREREG.md`. Machine-readable: `results/evolve-result.json`,
> `results/pool-scores.json`. N6 archive: `.stz/60-harness/MANIFEST.json` + battery.

## TL;DR

The flagship automated mechanism (`harness-mine` → `harness-promote-mutator`) ran **end
to end on a real, discovered blind spot** for the first time across all six substrates.
**Two findings, kept separate:**
1. **MECHANISM works (positive):** the harness automatically discovered, twice-verified,
   and baked in a genuine blind spot (the `malformed-trailing-token` class — accepting
   `5abc` as `5`).
2. **COMPETENCY does not move (the hypothesis):** measured on the established held-out
   oracle `truth_full`, the sharper genome's selected winner is **identical** to the
   incumbent's (0.9767), so `harness-select`/`harness-promote` **correctly decline**.

Mechanism-works ≠ competency-improves. The harness *can* sharpen its own suite; on this
pool that sharpening does not make the shipped code measurably better, because the
sharpened axis (`5abc`) is decoupled from held-out functional truth.

## 1. The mechanism fired (harness-mine, twice-verified)

| half | suite | result |
|------|-------|--------|
| i — real gap? | permissive `cron-pilot/suites-v2/cron.sealed.mjs` | **survives: true** (the suite misses the malformed-token bug) |
| ii — sharpened kills it? | `cron.sealed-sharpened.mjs` (battery-derived must-throw) | **survives: false** (caught) |

`harness-promote-mutator` then appended the mutator to the battery (size 8 → 9). This is
the documented "catch the bug class once, bake it in" flagship, run on a genuine
auto-discovered blind spot — not a hand-placed axis.

**Manual seam, stated honestly:** the load-bearing *automated* step is `harness-mine`'s
two-sided verification (survives-permissive ∧ killed-by-sharpened) plus the battery bake.
Turning the promoted class into the concrete `MUST_THROW` cases inside
`cron.sealed-sharpened.mjs` is the **test-author step that the battery normally drives an
agent to do** — here it was hand-authored (I stood in for that agent). So "the mechanism
works" rests on the automated verification + bake; the must-throw *generation* from the
baked class was done by hand, not code-derived.

## 2. The competency measurement (held-out truth_full)

8 fresh blind `haiku` cron specimens; natural `5abc` split (c6 rejects = spec-correct;
the other 7 accept; base rate ~1/8):

| specimen | sealed | truth_full | 5abc-correct | mustThrow |
|---|:---:|:---:|:---:|:---:|
| c1 | **1.0** | 0.9767 | no | 12/13 |
| c5 | 0.9992 | **1.0** | no | 12/13 |
| c6 | **1.0** | 0.9767 | **yes** | **13/13** |
| (c2,c3,c4,c7,c8) | <1.0 | 0.95–0.98 | no | 12/13 |

- **Incumbent** `baseline-cron` selects by permissive sealed → sealed-best set = {c1, c6}
  → realized competency = mean truth_full = **0.9767**.
- **Sharper** `sharper-cron-v1` selects by sealed + the promoted must-throw battery →
  among {c1, c6} prefers c6 (13/13) → realized competency = truth_full(c6) = **0.9767**.

The sharpening **changed the selection** (c6 specifically — the spec-correct one — over
c1) yet truth_full is **identical**. Note also that the genuine truth-best specimen, c5
(truth_full 1.0), **accepts 5abc** and is selected by *neither* genome: the `5abc` axis is
orthogonal to functional truth.

## 3. The gate (driven through the real bridge)

```
harness-promote-mutator -> battery 8 -> 9 (malformed-trailing-token baked)
harness-fitness baseline-cron     -> 7a9606e92f7576d4  fitness 0.9767
harness-fitness sharper-cron-v1   -> 3271b6c5ab401f0a  fitness 0.9767
harness-select [both @0.9767]     -> sigma 0  ->  VARIANCE COLLAPSE
harness-promote sharper-cron-v1   -> promote:false  failed:[does-not-beat-incumbent,
                                                            generation-variance-collapsed]
```

The meta-loop ran end to end, the mechanism fired, and the five-gate promotion **correctly
declined** because the sharpened axis is decoupled from the held-out competency metric.
Promoting here would require weighting the `5abc` axis (rigging) — refused.

## 4. Why this is the honest capstone, not a disappointment

This instantiates the five-substrate structural finding (`../EXPERIMENT-SUMMARY.md`): a
competency gain needs an axis that is **substantial ∧ split ∧ suite-invisible**, and these
are mutually exclusive. cron's `5abc` is **split ∧ suite-invisible** but **not
substantial** (1 case in ~1248; decoupled from truth_full) — so the sharper suite selects
a *different* winner without selecting a *better* one. The mechanism is real and works; the
competency hypothesis is not earned on a homogeneous capable pool, for a structural reason.
