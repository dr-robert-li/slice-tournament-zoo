# RESULTS — heterogeneous-pool experiment (exhausting the positive)

> Goal: "Run the heterogeneous-pool experiment and exhaust all possibility of positive
> competency lift." Data: `results/hetero-result.json`.

## What ran

A 12-specimen heterogeneous cron pool — 8 Haiku (c1–c8) + 2 Sonnet (s1,s2) + 2 Opus
(o1,o2), all blind. Full-contract truth (functional + malformed) per specimen; 5 frozen
blind Sonnet judges, pick-best-of-12.

| | full_truth |
|---|---|
| **o2 (Opus)** | **1.000** ← truth-best, also sealed 1.0 |
| o1, s2, c6, c5 | 0.9821 |
| c1, s1 (+ rest) | ≤ 0.9643 |

Sealed-best set (sealed 1.0): {c1, c6, s1, o1, o2}. Numeric baseline is **indifferent**
across it → expected full_truth **0.9786**, ships the perfect o2 only 1/5.

**Judge: unanimous o2 (5/5) → full_truth 1.0. Lift over numeric = +0.0214.**

## The honest read — a positive appears, but it is not a competency lift

By the **literal** re-ranking control, this passes: the judge re-ranks *within* the
sealed-indifferent set to a functionally-better specimen (o2) the numeric signal cannot
prefer. If that is your definition, gate+judge beats gate-only by +0.0214. **But it is not
a competency lift attributable to the meta-improving harness**, for three reasons, and the
third is decisive:

1. **Not meta-improvement.** The judge is the *default* harness's stage-2 (F7), not an
   evolved gene. The meta-loop did nothing here — this is the existing two-stage harness
   working as designed.
2. **Appearance-confounded (strong-model effect).** The judges shipped o2 citing
   *thoroughness* cues (day-level jumping, DOW=7 normalization, regex validation) — the
   **same rigor heuristic** that shipped c4 on the homogeneous pool. Here the
   most-thorough-*looking* specimen (Opus o2) *happens* to also be truth-best, so the
   heuristic accidentally aligns with truth. This is "Opus beats Haiku + judge likes
   Opus-style" — a **pool** effect, the exact confound pre-flagged.
3. **Not robust — the divergence control reverses it.** On the homogeneous Haiku pool the
   truth-best (c5, functional 43/43) does **not** look most thorough, and the judge shipped
   c4 (0.9643) — **below** the numeric baseline (0.9732). When appearance and truth
   **diverge**, the judge tracks **appearance, not truth.** The hetero "win" exists only
   because they coincide.

The judge's behaviour is *consistent*: it ships the most-thorough-**looking** specimen —
c4 on homo (wrong), o2 on hetero (right). Competency lift happens **iff appearance = truth**,
which a strong model in the pool tends to produce but the harness does not *detect*.

## Exhaustive verdict

- **Strict definition** (harness self-improvement that *detects* correctness): **NULL.** No
  configuration ships a truth-best specimen that does not *also* look best. The clean test
  (homogeneous c5-vs-c4, where they diverge) is negative.
- **Weak definition** (gate+judge ships a better specimen than gate-only numeric): a
  +0.0214 positive exists on the heterogeneous pool — but it is the existing harness plus a
  strong-model-in-pool correlation, not meta-loop competency lift, and it reverses when
  appearance ≠ truth.

**Every selection signal and pool composition is now exhausted:** numeric proxies
(sealed-derived → structurally blind), judge on homogeneous pool (tracks appearance →
negative when truth ≠ appearance), judge on heterogeneous pool (positive only because the
strong model's specimen is both best and best-looking). The one conceivable remaining lever
— a judge rubric that tracks held-out correctness rather than visible rigor — is exactly
the appearance-bias that is fundamental to LLM code-judging; tuning rubrics until c5 wins is
the shopping trap, refused.

## Bottom line
The meta-improving harness does **not** produce a robust competency lift on these
substrates. The apparent heterogeneous positive is a strong-model pool effect riding the
judge's appearance-bias, and it collapses on the divergence control. The sharpening
*mechanism* still works; converting it (or any selection signal) into *detected* better
code does not.
