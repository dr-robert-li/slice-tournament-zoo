# PILOT-PREREG-JUDGE — judge-beyond-suite blind arm, signal-matched, on cron (2026-06-26)

Pre-registered before the judge-loop run. This is the open door HANDOFF-CURRENT §7 and
`PILOT-RESULTS-BLIND.md` left: the sealed-steered loop was ruled out (it halts at sealed=1.0 and
cannot cross a gradient the suite cannot see), but a loop whose stop/steer signal is a **reasoning
judge that reads the contract and reasons past the sealed suite** was untested as a budget-matched
loop. This doc fixes three design errors inherited from §7 (flagged on review), records the
base-rate gate that decides whether the loop *can even* win, and locks the decision table to the
strong form before running.

## What §7 got wrong (corrected here)

§7 said: reuse cron, judge stops past sealed, test the **42/43 → 43/43** gradient. The empirical
residual on the best-of-N winner breaks all three points:

1. **The 42/43 residual is the `7`==Sunday CONVENTION, not a spec-mandated bug.** The best-of-N
   winner `c2` (sealed 1.0, truth 0.9767) misses exactly one truth case: `"0 0 * * 7"`, on which it
   *throws*. But CONTRACT-VAGUE says day-of-week is **`0–6` with `0 = Sunday`** and never mentions
   `7`. Throwing on out-of-stated-range `7` is contract-faithful; the truth suite credits the Vixie
   convention `7`==Sunday *against* a contract that excludes it. "Crossing" that gradient = teaching
   memorized Vixie convention = **recall** — the exact contamination the synthetic substrate exists
   to exclude. → **`7`==Sunday is dropped from the primary scorer** (reported separately, directional).
2. **§7 step 3 compares judge+iterate against *sealed* best-of-N — that measures the SIGNAL upgrade,
   not the LOOP.** Judge-vs-suite is a *signal* change that helps sampling and iteration equally;
   0.8.0 is a *search-strategy* change (iterate vs sample). To value the loop you must hold the
   signal fixed and vary only the search: **judge+iterate vs judge+best-of-N at equal budget.**
   Comparing judge+iterate to sealed best-of-N would read as a loop win when it is a signal win —
   the pro-build symmetric error.
3. **The real spec-mandated gradient on cron is a single, suite-expressible axis** (see gate below),
   so it tests judge-as-*selection* (already banked in CONTROLS-2), not judge-as-*loop-beyond-a-
   hardened-suite*. The pre-registered honest outcome is therefore knowable in structure and must be
   confirmed, not engineered away.

## The gate (measured before locking — this is the load-bearing fact)

The advisor's binding question: *does cron offer a recall-free, contract-mandated gradient with a
base rate low enough that best-of-N's pool reliably lacks a correct candidate, AND that a hardened
suite cannot express?* Measured across a 15-specimen fresh-ish pool (Haiku + frontier Opus), a clean
contract-mandated **must-throw** battery of 13 forms (garbage tokens, out-of-range minute/hour/dom/
month/dow, wrong field count, step-0, inverted range, bare dot — all derivable from "5 fields; throw
on malformed expression or invalid date", no candidate-specific tuning):

- **Forms 1–12 are non-discriminating:** every specimen throws on all of them (bits all `1`).
- **Exactly ONE form discriminates: form 0, `5abc * * * *`** (leading-digit-then-garbage, the
  `parseInt("5abc")===5` silent-truncation trap). Reject rate **5/15 ≈ 0.33**.
- This single axis is **invisible to sealed** (`c2` sealed 1.0) **and to the current truth suite**
  (`c2` truth 0.9767 — truth only tests pure-garbage `abc`, which everyone throws on). So it is a
  genuine recall-free, contract-mandated, sealed-and-truth-blind gradient. Good.
- **BUT it is a single finite test you can add to a suite.** By the standing decision's own bar
  ("build a loop only if the judge crosses a gradient a HARDENED suite CANNOT express"), `5abc` does
  **not** qualify: a hardened suite that adds one `expect(() => nextRun("5abc * * * *", t)).toThrow()`
  case crosses it via plain best-of-N selection. The judge's advantage on `5abc` is authoring/
  selection (derive the requirement from the contract without hand-writing the test) — which is the
  CONTROLS-2 result restated — not a search-strategy advantage that survives signal-matching against
  a hardened suite.

**Structural pre-finding (to be empirically confirmed, not assumed):** cron exposes no recall-free,
contract-mandated gradient that a hardened suite cannot express. Every spec-mandated defect found is
finite and enumerable. So the strong-form loop bar is expected to fail on cron; the loop should at
most *tie* hardened+best-of-N. The run below is the falsifiable confirmation.

## Conditions (signal-matched; per seed; equal token budget B)

Task: `nextRun(expr, after)` from `cron-pilot/slice/CONTRACT-VAGUE.md`. **Fresh blind draws only** —
NOT the c1–c4 pool (their per-axis defects are now known; selecting on them is train-on-test). All
specimens see CONTRACT-VAGUE only; never the sealed suite, the malformed battery, or the truth suite.

The signal is held FIXED across the two loop-vs-sample conditions = **the frozen reasoning judge**
(`stz-judge` / a blind critic) that reads {contract, candidate code, sealed-suite pass/fail OUTPUT}
and reasons about contract-conformance beyond what the sealed suite checks. It never sees the
malformed battery or the truth suite.

- **A. judge + best-of-N** *(signal = judge; search = sample)*: spend B drawing N fresh blind
  candidates. The frozen judge scores each on contract-conformance (reasoning past the sealed suite)
  and selects the best. No iteration. Score the selected impl on the primary scorer.
- **B. judge + iterate** *(signal = judge; search = loop)*: spend B on a loop. Draw 1 candidate; the
  judge reasons about contract-conformance beyond the sealed suite; if it flags a gap (e.g. "accepts
  `5abc`, contract mandates throw-on-malformed"), critique → revise → re-judge; repeat until the
  judge is satisfied OR B is exhausted. Score the final impl on the primary scorer.
- **C. hardened-suite + best-of-N** *(the cheap baseline the loop must beat — signal = hardened
  suite incl. the `5abc` case; search = sample)*: spend B drawing N fresh blind candidates; select
  by the hardened conformance battery's pass-rate. Score on the primary scorer. This is the
  "sharpen the suite" lever the standing decision keeps naming.

Same B for all three = the equal-budget arm. Also run 1×/2×/4× B for the absolute curve. B is a
token ceiling summed from `subagent_tokens`; a condition stops spawning once the next agent would
exceed B.

## Primary scorer (authored blind, contract-mandated only)

A frozen **conformance battery** = the current truth `CASES` (firing-time + valid-field properties)
**plus** the 13-form contract-mandated must-throw set above, **minus the `7`==Sunday case and any
other convention axis** (bare `a/n`, list+step union — Vixie conventions the vague brief does not
mandate; reported separately as directional, never in the primary number). The judge and all
specimens are blind to it. It is the sharper truth oracle the whole pilot line kept pointing at; it
is also condition C's *selection* signal (deliberately — that is the test).

## Blindness (non-negotiable, audited)

- Specimens, reviser, judge NEVER see the sealed suite source, the malformed battery, or the primary
  scorer. The judge additionally sees the candidate code and the sealed suite's pass/fail OUTPUT.
- Judge/critic prompts carry NO operator diagnosis and NO leading questions — contract + candidate +
  sealed output only. (The scaled-run confound fix; the one cron field-semantics nudge is not
  repeated.)
- The loop's stop/continue decision reads the JUDGE only, never the primary scorer, never truth.

## Metrics + pre-registered decision (LOCKED — strong form)

Per condition: primary-scorer pass-rate of the scored impl, the `5abc`-axis pass (0/1), total
tokens, conformance-per-token. **3 seeds minimum; report every seed** (tie-break luck hid at
seed level before). Convention axes reported separately, never folded into the primary number.

| outcome (equal budget, signal-matched) | reading | action |
|----------------------------------------|---------|--------|
| **B (judge+iterate) > C (hardened+best-of-N)** | the LOOP crosses a gradient even a hardened suite + sampling cannot — the only result that isolates search-strategy value | **0.8.0 (judge-steered loop) WARRANTED** — spec it vs ROADMAP §239–625 |
| **B ≈ C**, and both ≥ A (judge+best-of-N) ≥ sealed | the lever is signal quality (judge or sharper suite), not the loop; sampling on a good signal already gets there | **0.8.0 NOT warranted — sharpen the suite.** Loop adds nothing sampling+good-signal doesn't |
| **B < C** | the loop chases the judge into worse conformance than a sharpened suite selects | 0.8.0 harmful as-designed; suite quality is the lever |

The decisive comparison is **B vs C**, NOT B vs sealed-best-of-N. §7's pass-branch ("beat
sealed-steering") is retired: it contradicts §7's own fail-branch ("can't beat a sharpened suite").
Resolved to the fail-branch — the consistent strong form.

## Discipline carried forward

- **Symmetric-error:** a confound leaning pro-build = one leaning anti-build. If a confound survives,
  the run is SILENT, not supportive.
- **No judge "accuracy rate" claim** — report selection/conformance wins, not an oracle-accuracy number.
- Recall-free substrate; convention axes discounted from the primary number with contract citation.
- n=slice is directional; expand only on a clean signal.

## Execution order

1. Confirm the gate on a fresh slice: draw N fresh blind candidates (1 seed), verify the malformed
   `5abc` axis is the only contract-mandated discriminator and the base rate (~1/3) holds.
2. Run A/B/C at equal B on cron, 1 seed; verify the loop is judge-steered (judge output, not the
   primary scorer, drives stop/continue) and the scorer is never read inside the loop.
3. 3 seeds: equal-budget B-vs-C table + absolute curve. Apply the locked table.
4. Only if B > C cleanly (loop beats a hardened suite): replicate on hexcolor/ipv4 before any build
   call, then demonstrate on SWE-Bench (recall-contaminated → demonstration only, never decision).
