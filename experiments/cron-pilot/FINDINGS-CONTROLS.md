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

- **Criterion 1 fires — best-of-N truth (1.000) ≈ frontier truth (1.000).** A weak model + good
  selection harness matched Opus best-of-1 on this task's own metric (absolute truth-correctness).
  → STZ's value here is the **selection signal**, not an iterative loop. Scaling samples + a strong
  blind suite suffices; the convergence loop (ROADMAP 0.8.0) is **not justified by this task** —
  do not build it yet.

- **Criterion 2 fires — best-of-N (1.000) > best-of-4-naive (DNF).** Both conditions drew 4+ Haiku
  samples; the ONLY structural difference in *selection* is the suite. Naive's public suite is
  **non-discriminating** here — all 4 naive specimens score public 1.000, so naive picks
  effectively blind (first id) and lands on `naive-a`, which **hangs** on the truth oracle. The
  blind sealed suite instead gave a gradient (0.858–1.000) and ranked a truth-perfect specimen on
  top. **This is the core STZ claim, cleanly shown: selection-signal quality is what converts N
  draws into a correct pick.**

## Honest confounds (do NOT bank past these)

1. **best-of-N's 1.000 is carried by the REUSED seed-1 specimens, not the fresh draws.** All four
   **new** Haiku draws (e,f,g,h) plateaued at truth **0.977** — the same spec-gap ceiling
   (`7`-as-Sunday, the vague brief said "0–6"). A fresh-only Haiku best-of-4 (by sealed: e or g)
   = **0.977**, i.e. it would NOT have matched frontier. The 1.000 comes entirely from `seed1-b`
   (truth 1.000), which the sealed suite *correctly ranked top* (sealed 1.000). So the honest
   statement is: **sealed selection picked the one perfect specimen out of a pool of 8** — a real
   selection win — but "Haiku best-of-N reaches frontier" only holds *at N=8 including prior good
   draws*, not for 4 fresh Haiku samples. Scaling N helped (4→8: 0.977→1.000); it did not make a
   single batch of weak draws individually frontier-grade.

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

4. **n=1, single task, single model tier.** A≈C (judge ablation) unchanged from FINDINGS: the
   top-sealed tier (seed1-b/c, sealed 1.000) is truth-tied, so a judge adds nothing here.

## Decision

- **Do NOT build the ROADMAP 0.8.0 convergence loop on the strength of this task.** Samples +
  blind-sealed selection reached frontier-truth; the loop's iteration earns its cost only if
  best-of-N *plateaus below* frontier, which it did not (at N=8).
- **The core STZ claim (selection signal > raw sampling) is supported directionally** — naive's
  public-suite selection is provably blind here while sealed selection is not.
- **Before banking either**: (a) expand to 3 seeds (~$15–30); (b) run a **fresh-only** best-of-N
  (no reused seed-1 specimens) to remove confound #1 — if fresh Haiku best-of-N stays at 0.977
  while Opus hits 1.000, the honest read flips to "weak model plateaus below frontier on fresh
  draws; STZ's selection picks the best *available*, but cannot manufacture a frontier specimen the
  pool lacks"; (c) to make the selection-vs-framing point airtight, give naive agents the SAME
  robustness contract and re-test — isolating selection from contract-framing.

## Reproduce

```
node ~/.claude/jobs/<job>/tmp/score-controls.mjs   # or the committed copy under cron-pilot/
# pools: bestN = seed-1 a–d (reused) + control-seed-1/bestN/e–h ; naive4 ; frontier a–b
# rate(suite, impl) = node <suite> <impl>, 60s timeout; SIGTERM -> HANG (a real liveness defect)
```

Tokens are `subagent_tokens` summed per condition (best-of-N includes the reused seed-1 86,714).
