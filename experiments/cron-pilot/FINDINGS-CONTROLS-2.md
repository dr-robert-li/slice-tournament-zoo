# Cron-Pilot CONTROLS-2 — disambiguating the controls (judge, fresh-only, naive+contract)

Resolves the four open questions flagged at the end of `FINDINGS-CONTROLS.md`. **The judge run
overturns part of the earlier read** and surfaces a deeper finding: on this task **no single
automated suite — public, sealed, OR truth — is ground truth for "more correct."** A reasoning
judge tracks real correctness better than any of them.

Scripts: `score-3seed.mjs` (fresh-only + frontier + naive-contract), `probe-real-correctness.mjs`
(the 5 verified cron probes below). n is small (directional), but the central result is mechanism,
not magnitude.

---

## 1. Fresh-only best-of-N (3 seeds, N=8) — does weak-model sampling reach frontier? **No.**

Drop the reused seed-1 specimens; pool = 4 original-pilot Haiku (a–d) + 4 fresh Haiku (e–h) per
seed. (Caveat: two prompt regimes mixed in one pool — directional only.)

| seed | top-sealed tier (truth) | mixed? | tie-break-winner truth | expected-under-random-tie | frontier (Opus) |
|------|-------------------------|--------|------------------------|---------------------------|-----------------|
| 1 | b:1.0 c:1.0 e:.977 g:.977 | **YES** | 1.000 (luck) | 0.988 | 1.000 |
| 2 | a:1.0 c:1.0 d:1.0 h:.977 | **YES** | 1.000 (luck) | 0.994 | 1.000 |
| 3 | a:.977 c:.977 g:.977 | no | 0.977 | 0.977 | 1.000 |

- The **truth-mixed top-sealed tier reproduces within single fresh seeds** (1 & 2) — confirming the
  tie-break artifact is not an artifact of pooling reused specimens. Flat sealed-rate cannot
  separate truth-1.0 from truth-0.977 at the top.
- **Fresh Haiku best-of-8 ≈ 0.985 truth (expected), below frontier 1.000**, and seed-3 is a hard
  plateau at 0.977 (no truth-perfect specimen exists in the pool — selection picks the best
  *available*, cannot manufacture one). → **Confound #1 resolved: weak-model best-of-N does NOT
  cleanly reach frontier; seeds 1–2's frontier-match was tie-break luck.**
- Side note (another oracle leak): seed-2 Opus `opus-a` scored **sealed 0.950 while truth 1.000** —
  the sealed suite *false-negatives* a truth-correct frontier impl. The suites cut both ways.

## 2. Naive + same contract — was the original naive DNF selection or framing? **Mostly framing.**

Original `naive4` (bare "make the public suite pass") → all 4 **HANG** on truth. Re-run with the
**same CONTRACT-VAGUE** the specimens got (still naive selection: pick by public pass-rate):

| | public | sealed | truth |
|--|--------|--------|-------|
| naive+contract a | 1.000 | 0.999 | 0.953 |
| naive+contract b | 1.000 | 0.993 | 0.953 |
| naive+contract c | 1.000 | 0.999 | 0.977 |
| naive+contract d | 1.000 | 0.993 | 0.977 |

- **No hangs.** The contract's robustness language ("bounded", "throw on malformed", leap years)
  removed the liveness defect. → **Confound #2 resolved: the original naive DNF was largely
  prompt-framing, not pure selection.** The honest "naive 1.000 > DNF" headline from
  FINDINGS-CONTROLS overstated the selection gap.
- **Selection point still survives, narrowly:** all four naive+contract specimens score public
  1.000, so naive's selection is still blind — it lands on a 0.953 specimen (the classic dom/dow
  AND bug) it cannot see. So public-suite selection remains non-discriminating; it just no longer
  produces a catastrophic DNF when the contract supplies robustness.

## 3 + 4. THE JUDGE on the truth-mixed tier — and the discovery that truth isn't ground truth

The crux. On the truth-mixed sealed-tied tiers (seeds 1 & 2), run the **frozen `stz-judge`**
(reasons on "the contract's intent, edge-case handling, clarity"; may read the sealed suite, which
ties these specimens so it leaks nothing; truth suite forbidden; no `7`=Sunday hint in prompt).
6 cross-truth pairs (truth-1.0 "G" vs truth-0.977 "gap") × both orders = 12 judgments, + 2
same-truth controls.

### First: the truth oracle is incomplete. Verified real-cron probes (`probe-real-correctness.mjs`)

| specimen | truth-rate | 7=Sun | a/n step | list+step | oor reject | malformed reject | **verified /5** |
|----------|-----------|-------|----------|-----------|-----------|------------------|-----------------|
| s1 orig-b | 1.000 | OK | OK | OK | OK | OK | **5** |
| s2 orig-a | 1.000 | OK | OK | OK | OK | OK | **5** |
| s1 orig-c | 1.000 | OK | OK | **XX** | OK | **XX** | 3 |
| s2 new-h | **0.977** | XX | OK | OK | OK | XX | **3** |
| s2 orig-d | **1.000** | OK | **XX** | **XX** | OK | **XX** | **2** |
| s1 new-g | 0.977 | XX | XX | OK | OK | XX | 2 |
| s1 new-e | 0.977 | XX | XX | XX | OK | XX | 1 |

**`orig-d` is truth-1.000 but only 2/5 on real cron cases — strictly worse than `new-h` (truth
0.977, 3/5).** The 43-case truth suite simply never tests `a/n`-step disambiguation, list+step
union, or malformed-token rejection. **So truth-passRate — the metric the whole pilot treated as
ground truth — is itself a leaky oracle.** Every claimed defect below was independently confirmed
by the probe; the judges did not hallucinate.

### The judge tracks real correctness, beating the truth oracle

Judge pick per cross-truth pair (both orders), scored against the **verified /5** column:

| pair | verified-better | judge order-1 | judge order-2 | judge correct? |
|------|-----------------|---------------|---------------|----------------|
| b vs e | orig-b (5>1) | orig-b | orig-b | ✓✓ |
| b vs g | orig-b (5>2) | orig-b | orig-b | ✓✓ |
| c vs e | orig-c (3>1) | orig-c | orig-c | ✓✓ |
| a vs h | orig-a (5>3) | orig-a | orig-a | ✓✓ |
| **d vs h** | **new-h (3>2)** | **new-h** | **new-h** | ✓✓ *(against truth label!)* |
| c vs g | orig-c (3>2) | orig-c | new-g | ✓✗ (3-v-2 near-tie) |

- **Judge vs verified correctness: ~11/12.** The single "miss" is a 3-vs-2 near-tie (c vs g) where
  the judge split on order. **Judge vs truth-label: 9/12** — and all 3 "disagreements" are cases
  where the judge is *more right than the truth oracle* (it preferred the genuinely-more-correct
  specimen truth mis-ranks).
- Same-truth controls confirm the judge discriminates *within* a flat-rate-tied tier: among two
  truth-1.0 specimens it preferred `orig-b` over `orig-c` (orig-c throws on `5-7` dow ranges); among
  two truth-0.977 it preferred `new-g` over `new-e` (new-e has a 4-year-horizon leap bug on
  `0 0 29 2 *` → 2100). Both confirmed by probe.
- The judge cited, and the probe confirmed, **≥4 real bug classes that flat sealed-rate selection
  is blind to**: `7`=Sunday, `a/n` step form, list+step union, malformed/out-of-range rejection.

---

## Decision — this REVERSES the earlier lean

| question | FINDINGS-CONTROLS (n=1, pre-judge) | CONTROLS-2 (resolved) |
|----------|-----------------------------------|------------------------|
| weak best-of-N reaches frontier? | "≈ yes" (tie-break artifact) | **No** — plateaus ~0.985, seed-3 hard 0.977 |
| naive DNF = selection? | "yes, naive blind" | **Mostly framing**; selection-blindness real but milder (0.953, not DNF) |
| does the judge add value? | "A≈C, judge adds nothing" | **Wrong on truth-mixed tiers — the judge adds a lot** |
| build the 0.8.0 convergence loop? | "do NOT" → "not-yet-determined" | **Reasoning-based selection earns its cost; prioritise the judge + a sharper suite, loop still untested** |

**The core, robust conclusion:** STZ's value is **selection signal quality**, and *flat suite
pass-rate is a poor selection signal* — it ties truth-mixed tiers and is blind to ≥4 real bug
classes. A **reasoning judge** recovers most of that (≈11/12 vs verified correctness) and even
out-performs the truth oracle. This is positive evidence that the **judge phase** (and, by
extension, reasoning-based steering like the 0.8.0 loop) **earns its cost** — directly contradicting
FINDINGS' "judge adds nothing," which was an artifact of only ever testing truth-*tied* tiers.

**But the deeper lever is the oracle, not the loop.** The sealed suite missed `a/n`/list+step/
malformed discrimination *and* false-negatived a correct Opus impl; the truth suite mis-ranked
orig-d vs new-h. The cheapest, highest-value next step is a **sharper sealed suite** (add the bug
classes the judge surfaced) — that converts the gradient flat-rate selection needs, without paying
for either a judge panel or an iterative loop on every slice. Build the loop only after testing
judge-augmented selection against a hardened suite.

## Honest limits

- **Small n; single task/model tier.** Mechanism (judge > flat-rate; truth is leaky) is robust;
  the percentages are directional.
- **Pooling caveat (fresh seeds 2–3):** original-pilot a–d and control-style e–h are two prompt
  regimes in one "seed."
- **Judge order-effect:** the c-vs-g pair split by presentation order — real position sensitivity;
  a production judge should be run both-orders and tie-broken, or replaced by a stronger rubric.
- **"Verified /5" is itself only 5 probes** — a sixth axis could re-rank again. The meta-point
  stands precisely because *adding 5 probes already overturned truth-1.0 rankings*: correctness
  here is multi-axis and no small suite captures it.
- Blindness: specimens' code shows no forbidden-path strings; prompts forbade the reads. Evidence,
  not proof (a silent Read wouldn't show in code).
