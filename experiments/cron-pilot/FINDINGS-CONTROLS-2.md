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

### First: the truth oracle is leaky — proven on a SPEC-MANDATED axis (no convention needed)

Verified real-cron probes (`probe-real-correctness.mjs`). **The probe was written to check whether
the judges' cited bugs were real — so it CANNOT be used to measure a judge "accuracy rate" (that
would be circular: the yardstick is built from the judges' own answers). It is used only for what
it can support: (a) the bugs are real code behaviour, not hallucination; (b) at least one bug class
is spec-mandated.** Axes are bucketed by FINDINGS discipline (discount convention-only gaps, as was
done for `7`=Sunday):

| | **spec-MANDATED** | | spec-GAP-assisted (discount) | | |
|----------|-------------------|-----------|------|----------|-----------|
| specimen | malformed reject (`5abc`→throw) | oor-hour reject | 7=Sun (`7`) | a/n step (`5/15`) | list+step (`0,30/15`) |
| s1 orig-b (T1.0) | **OK** | OK | OK | OK | OK |
| s2 orig-a (T1.0) | **OK** | OK | OK | OK | OK |
| s1 orig-c (T1.0) | **XX** | OK | OK | OK | XX |
| s2 orig-d (T1.0) | **XX** | OK | OK | XX | XX |
| s2 new-h (T.977) | **XX** | OK | XX | OK | OK |
| s1 new-g (T.977) | **XX** | OK | XX | XX | OK |
| s1 new-e (T.977) | **XX** | OK | XX | XX | XX |

- **The clean pillar (spec-mandated, no convention):** CONTRACT-VAGUE says *"Throw on a malformed
  expression."* `orig-c` and `orig-d` are **truth=1.000** yet return `00:05` on `5abc * * * *`
  instead of throwing — and the **sealed suite also scores them 1.000**. So **both the truth AND
  sealed oracles pass spec-violating code on an unambiguous, spec-mandated rule.** Truth-passRate —
  the metric the whole pilot treated as ground truth — is provably leaky, with zero reliance on a
  convention. (`oor-hour` is spec-clean too but non-discriminating: everyone throws.)
- **Discounted (spec-gap-assisted):** `7`=Sunday (contract says `0–6`), bare `a/n` (contract lists
  `*/n`, `a-b/n` — not bare `a/n`), and `0,30/15` list+step union are real Vixie conventions the
  vague brief does not mandate. Same shape as the `7`=Sunday discount in FINDINGS — directional, not
  banked. (This means the earlier "orig-d 2/5 < new-h 3/5" ranking was spec-gap-weighted; retracted
  as a clean claim — on the spec-mandated axis alone, orig-d and new-h both fail malformed, so that
  axis doesn't separate them.)

### The judge beats flat-rate selection on the spec-mandated axis

The malformed axis discriminates exactly three of the six cross-truth pairs (one specimen throws,
the other accepts): **P1 (b vs e), P3 (b vs g), P5 (a vs h)** — in each, `orig-a`/`orig-b` throw
(spec-correct) and the gap specimen accepts. **The judge picked the throwing, spec-correct specimen
in all three, both orders.** Flat sealed-rate selection cannot: it scores both 1.000.

- So the clean, spec-grounded claim: **a reasoning judge catches a spec-MANDATED bug class
  (malformed-rejection) that flat suite pass-rate is blind to.** No number is claimed for an overall
  "tracking rate" (the probe can't support one — see above).
- The judges' other cited defects (a/n step in `orig-c`/`orig-d`/`new-e`, list+step in `orig-c`, the
  4-year-horizon leap bug in `new-e`, `5-7` dow throw in `orig-c`) were all probe-confirmed as **real
  code behaviour** — the judges did not hallucinate — but they live on spec-gap axes, so they support
  "the judge surfaces real issues" qualitatively, not a scored rate.
- Same-truth controls still show the judge discriminates *within* a flat-rate-tied tier (preferred
  `orig-b` over `orig-c`; `new-g` over `new-e`) — qualitative evidence that reasoning adds signal
  flat pass-rate lacks.

---

## Decision — this REVERSES the earlier lean

| question | FINDINGS-CONTROLS (n=1, pre-judge) | CONTROLS-2 (resolved) |
|----------|-----------------------------------|------------------------|
| weak best-of-N reaches frontier? | "≈ yes" (tie-break artifact) | **No** — plateaus ~0.985, seed-3 hard 0.977 |
| naive DNF = selection? | "yes, naive blind" | **Mostly framing**; selection-blindness real but milder (0.953, not DNF) |
| does the judge add value? | "A≈C, judge adds nothing" | **Yes on truth-mixed tiers — catches a spec-mandated bug class flat-rate is blind to** |
| build the 0.8.0 convergence loop? | "do NOT" → "not-yet-determined" | **Reasoning-based selection earns its cost; prioritise the judge + a sharper suite, loop still untested** |

**The core, robust conclusion:** STZ's value is **selection signal quality**, and *flat suite
pass-rate is a poor selection signal* — it ties truth-mixed tiers and (proven on the spec-mandated
malformed-rejection axis) passes spec-violating code at 1.000. A **reasoning judge** picked the
spec-correct specimen in all three pairs where that axis discriminates, where flat-rate selection
cannot. That is positive evidence the **judge phase** (and, by extension, reasoning-based steering
like the 0.8.0 loop) **earns its cost** — contradicting FINDINGS' "judge adds nothing," which was an
artifact of only ever testing truth-*tied* tiers. (No overall judge "accuracy rate" is claimed: the
verification probe was built from the judges' own cited bugs, so scoring the judge against it would
be circular — see §3+4.)

**But the deeper lever is the oracle, not the loop.** The sealed suite missed `a/n`/list+step/
malformed discrimination *and* false-negatived a correct Opus impl; the truth suite mis-ranked
orig-d vs new-h. The cheapest, highest-value next step is a **sharper sealed suite** (add the bug
classes the judge surfaced) — that converts the gradient flat-rate selection needs, without paying
for either a judge panel or an iterative loop on every slice. Build the loop only after testing
judge-augmented selection against a hardened suite.

## Honest limits

- **No judge "accuracy rate" is claimed — and shouldn't be from this data.** `probe.mjs` was
  authored to verify the judges' *cited* bugs, so its cases are drawn from the judges' own
  rationales. Scoring the judge against it is circular. Measuring a real tracking rate needs a probe
  authored **blind to the judge rationales** (a fixed, pre-registered cron conformance battery). The
  surviving claims here are deliberately rate-free: (a) truth+sealed both pass spec-violating
  malformed code (leak proven), (b) the judge picked the spec-correct specimen 3/3 on the pairs the
  malformed axis discriminates.
- **Small n; single task/model tier.** Mechanism (judge > flat-rate on the spec-mandated axis;
  truth is leaky) is robust; anything finer is directional.
- **Pooling caveat (fresh seeds 2–3):** original-pilot a–d and control-style e–h are two prompt
  regimes in one "seed."
- **Judge order-effect:** the c-vs-g pair split by presentation order — real position sensitivity;
  a production judge should be run both-orders and tie-broken, or replaced by a stronger rubric.
- **"Verified /5" is itself only 5 probes** — a sixth axis could re-rank again. The meta-point
  stands precisely because *adding 5 probes already overturned truth-1.0 rankings*: correctness
  here is multi-axis and no small suite captures it.
- Blindness: specimens' code shows no forbidden-path strings; prompts forbade the reads. Evidence,
  not proof (a silent Read wouldn't show in code).
