# Cron-Pilot CONTROLS — isolating STZ's edge (1 seed, directional)

Executes the `experiments/HANDOFF.md` NEXT STEP: the go/no-go controls that separate the two
confounds left open by `FINDINGS.md`. Same blind-sealed task (`nextRun`), reused contract + suites.
**n=1 seed — directional only.** Decision is "is the signal promising enough to spend 3 seeds /
build the convergence loop", not a final verdict.

## What the controls separate

1. Is STZ's edge the **selection signal** (blind sealed suite catches what public can't) or just
   **drawing N samples**? → `best-of-4-naive` (4 naive agents, naive selects by its own weak
   **public** suite) vs `best-of-N` (sealed-selected). Both draw 4+; only the selection suite differs.
2. Does a **weak model + good harness** reach the **frontier**? → Haiku `best-of-N` vs Opus
   `frontier` (best-of-1). If yes, scaling samples may make the expensive convergence loop
   (ROADMAP 0.8.0) unnecessary.

## Conditions (all blind-authored; specimens never saw `suites-v2/` or `truth-suite/`)

| condition | agents | model | selection signal | winner | winner-truth | winner-sealed | tokens |
|-----------|--------|-------|------------------|--------|-------------|---------------|--------|
| **best-of-N** | 8 (4 reused seed-1 + 4 new) | haiku | **blind sealed** pass-rate | seed1-b | **1.000** | 1.000 | 173,131 |
| **best-of-4-naive** | 4 | haiku | **public** pass-rate | naive-a | **HANG (DNF)** | 0.998 | 102,506 |
| **frontier** | 2 (best-of-1) | opus | blind sealed | opus-a | **1.000** | 1.000 | 33,382 |

Per-specimen (public / sealed / truth):

```
best-of-N pool:
  seed1-a  1.000 / 0.999 / 0.977     new-e  1.000 / 1.000 / 0.977
  seed1-b  1.000 / 1.000 / 1.000 *   new-f  1.000 / 0.994 / 0.977
  seed1-c  1.000 / 1.000 / 1.000     new-g  1.000 / 1.000 / 0.977
  seed1-d  1.000 / 0.993 / 1.000     new-h  1.000 / 0.858 / 0.977
naive-4 pool:
  naive-a  1.000 / 0.998 / HANG *    naive-c  1.000 / 0.899 / HANG
  naive-b  1.000 / 0.879 / HANG      naive-d  1.000 / 0.899 / HANG
frontier pool:
  opus-a   1.000 / 1.000 / 1.000 *   opus-b  1.000 / 1.000 / 1.000
(* = condition winner)
```

## Findings (against HANDOFF decision criteria)

- **Criterion 1 — best-of-N truth (1.000) ≈ frontier truth (1.000) is met BY NUMBER, NOT BY
  MECHANISM. Do not bank the inference.** The headline number matches, but the sealed suite did
  **not** discriminate the perfect specimen. **Four** specimens tie at sealed **1.000** —
  `seed1-b` (truth 1.000), `seed1-c` (truth 1.000), `new-e` (truth 0.977), `new-g` (truth 0.977).
  The scorer's `v > best` returns the **first** 1.000 in pool order; because the reused seed-1
  specimens are listed before the new ones, it returns `seed1-b`. **Reorder the pool (put `new-e`
  first) and best-of-N returns 0.977.** So the frontier-match is **id-order tie-break luck over a
  truth-MIXED top tier**, not a selection win. The discriminable sealed signal **plateaus** at a
  tier that mixes truth 1.000 and 0.977 — i.e. this looks closer to **criterion 3 (plateau)** than
  criterion 1. The inference "selection signal reaches frontier → convergence loop unnecessary" is
  **not earned by this data**.

- **Criterion 2 — the clean, framing-independent core holds; the "1.000 > DNF" headline is
  weaker than it looks.** Solid and surviving: **all 4 naive specimens score public 1.000**, so
  naive's selection is **provably blind** — it cannot tell its own draws apart and lands on
  `naive-a` (first id), which **hangs** on the truth oracle. That is a real demonstration that
  public-suite selection is non-discriminating. **But two caveats narrow the headline:** (a)
  best-of-N's winning 1.000 is the tie-break artifact above, not a selection win; and (b) the
  naive pool **contained no truth-good specimen at all** (all 4 hang) — so the gap is partly
  *pool composition*, not purely selection. The robust statement: the sealed **gradient** correctly
  rejects the clearly-worse specimens (0.858 / 0.879 / 0.899) that public 1.000 cannot, but that
  gradient does **not** extend to discriminating frontier-truth at the top tier.

## Honest confounds (do NOT bank past these)

1. **best-of-N's 1.000 is a tie-break artifact over a truth-mixed top tier — NOT a selection
   win.** (Corrected after review.) The sealed suite ties FOUR specimens at 1.000: `seed1-b`
   (truth 1.000), `seed1-c` (truth 1.000), `new-e` (0.977), `new-g` (0.977). Sealed-rate alone
   **cannot** separate the truth-perfect from the truth-0.977 here; the winner is decided by
   id-order tie-break, and only lands on a perfect specimen because (a) the pool happens to contain
   two perfect *reused seed-1* specimens and (b) they are ordered first. Reorder → 0.977. Under
   random tie order the expected outcome is 50/50. So: the sealed suite did **not** "rank the
   perfect specimen top"; it failed to discriminate the last 0.023 of truth. Separately, all four
   **fresh** Haiku draws (e,f,g,h) plateaued at truth **0.977** (the `7`-as-Sunday spec-gap
   ceiling), so a **fresh-only** Haiku best-of-4 would return 0.977 regardless of tie order. Net:
   weak-model best-of-N did **not** demonstrably reach frontier; it returned a frontier number by
   pool-composition + ordering luck.

2. **The naive HANG is partly a prompt-framing confound, not purely selection.** The naive agents
   got bare "make my public suite pass"; the tournament specimens got robustness hints ("don't
   hang on `*/0`", "handle leap years / bounded search"). Those hints are part of what an STZ
   *contract* legitimately supplies — but it means the hang gap reflects contract-framing +
   selection, not selection alone. The clean, framing-independent point survives regardless:
   **within naive's own 4, the public suite cannot discriminate the hang** (all public 1.000), so
   naive's *selection* is blind even over its own draws.

3. **Sealed did not "catch the hang" directly.** `naive-a` scored sealed **0.998** while hanging on
   truth — consistent with FINDINGS seed-3 (the sealed suite does not detect liveness bugs).
   best-of-N avoided hangs because its pool contained truth-perfect specimens that outranked any
   hanging one, not because sealed flags hangs. Mutation/liveness coverage in the sealed suite
   remains a real gap.

4. **n=1, single task, single model tier — and the judge was ablated exactly where it matters.**
   Unlike FINDINGS (where the top-sealed tier was truth-*tied*, so a judge could add nothing), here
   the top-sealed tier is truth-*mixed* (1.000 and 0.977 both at sealed 1.000). The judge is
   precisely the mechanism that *might* break this tie correctly — and the controls did **not** run
   it. So this data cannot conclude "selection signal alone reaches frontier"; if anything it points
   the other way (raw sealed-rate is insufficient at the top; a judge or sharper suite or the loop
   may be needed).

## Decision

- **Convergence loop (ROADMAP 0.8.0): NOT-YET-DETERMINED — do not green-light AND do not kill it on
  this data.** (Revised after review.) The earlier "do NOT build it" was based on a
  selection-reaches-frontier reading that the tie-break artifact does not support. A sealed-rate
  that cannot separate the last 0.023 of truth is, if anything, mild evidence that raw sealed-rate
  selection is **insufficient** at the top tier — which is an argument *for* one of {judge, sharper
  suite, convergence loop}, not against. Verdict deferred to the disambiguating runs below.
- **The core STZ claim (selection signal > raw sampling) is supported only in its narrow, robust
  form**: public-suite selection is provably non-discriminating (all naive = public 1.000), and the
  sealed *gradient* rejects clearly-worse specimens. It is **not** supported in the strong form
  "sealed selection reaches frontier-truth" — that was a tie-break artifact.
- **Disambiguating runs before any verdict**: (a) **fresh-only best-of-N** (drop the reused seed-1
  specimens) — if it stays at 0.977 while Opus hits 1.000, the read is "weak model plateaus below
  frontier; selection picks the best *available* but cannot manufacture a frontier specimen the
  pool lacks." (b) **Run the judge** on the truth-mixed top tier — does pairwise judging break the
  sealed tie toward truth, or not? This directly tests whether the loop/judge earns its cost. (c)
  3 seeds (~$15–30) for stability. (d) Give naive agents the SAME robustness contract and re-test,
  to isolate selection from contract-framing (see confound #2).

## Reproduce

```
node ~/.claude/jobs/<job>/tmp/score-controls.mjs   # or the committed copy under cron-pilot/
# pools: bestN = seed-1 a–d (reused) + control-seed-1/bestN/e–h ; naive4 ; frontier a–b
# rate(suite, impl) = node <suite> <impl>, 60s timeout; SIGTERM -> HANG (a real liveness defect)
```

Tokens are `subagent_tokens` summed per condition (best-of-N includes the reused seed-1 86,714).

**Blindness note (don't oversell):** the verification grep only catches forbidden *paths written
into the produced code* — it would NOT catch an agent that merely *Read* the sealed/truth suite
without referencing it. Prompts forbade those reads explicitly and no leakage strings appear, but
that is evidence, not proof, of blindness.
