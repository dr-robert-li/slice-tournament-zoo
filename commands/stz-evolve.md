---
description: Run the bounded harness-level recursive-self-improvement meta-loop (0.9.0). Evolves the STZ harness genome (test-author heuristics, specimen strategies, judge rubric, selection weights, fan-out, suite battery) against held-out recall-free pilot fitness, DGM/HarnessX-style, with a six-gate promotion guard (0.9.5 adds calibrated-verifier gating). The per-slice tournament is untouched.
argument-hint: "[--generations N] [--k K] (defaults from run-config harness block)"
---

Evolve the harness itself. This is the relocation of the shelved 0.8.0
per-slice convergence loop (empirically ruled out — see
`experiments/swebench-pilot/PILOT-RESULTS-{BLIND,JUDGE}.md`) to the **harness
altitude**, where the 2024–2026 RSI literature (Darwin Gödel Machine, HarnessX,
SIA) actually shows gains. The bridge owns all compute (N6); agents do the LLM
work and feed numbers in.

Requires `harness.enabled: true` in `00-intent/run-config.json`. Default OFF —
nothing here changes a normal run.

## One generation

1. **Spawn parents.** `stz bridge harness-spawn --root <root> --k K` samples K
   parents from the archive with P ∝ fitness/(1+childCount) (DGM diversity rule;
   deterministic). An empty archive yields the seed/incumbent genome.
2. **Mutate one gene per child (HarnessX substitution).** For each parent, spawn
   the Evolver (a `claude` agent) to change exactly ONE gene — a `stz-test-author`
   heuristic, a `stz-specimen` strategy label, the `stz-judge` rubric, the
   selection-weight tuple, fan-out, or a promoted battery mutator. Stratify gene
   choices across the group (RC-GRPO) so the generation spans the substitution
   algebra and σ stays > 0.
3. **Score each variant on held-out fitness.** Run the variant's harness through
   the per-slice tournament on each recall-free substrate
   (`experiments/{cron,hexcolor,ipv4}-pilot`), score the winner against the
   never-in-loop **truth** suite, and pass the per-substrate numbers to
   `stz bridge harness-fitness --root <root> --genome <g.json> --scores <{...}>`.
   The bridge AceGRPO-weights toward the learnable frontier (mid-band substrates)
   and appends a content-addressed `ArchiveEntry`.
4. **Select.** `stz bridge harness-select --variants <[{variantId,fitness}]>
   --floor <diversityFloor>`. GRPO group-relative advantage picks the winner; if
   σ < floor the generation **collapsed** → do not promote, re-sample with forced
   gene diversity.
5. **Calibrate the judge first (0.9.5, fail-closed).** Before promotion, the
   selection judge for this slice-type must be target-task calibrated, or the
   sixth gate `rubricCalibrated` declines (an uncalibrated verifier silently
   regresses — arXiv:2606.14629). Run the judge on a blind, pre-registered
   ground-truth battery and feed picks + labels in:
   `stz bridge judge-calibration --root <root> --slice-type <t> --verdicts <[picked]> --labels <[truth]>`
   (also run `judge-stress` for the consistency half; they merge into one
   profile). `60-harness/judge-reliability.json` is what the gate reads.
6. **Critic + promote (six gates).** Spawn `stz-harness-critic` for the
   budget-matched, no-regression, convention-discounted read, then
   `stz bridge harness-promote --root <root> --variant <id> --slice-type <t>
   --hack-clean <b> --seal-ok <b> --diversity-ok <b>`. A variant becomes the
   incumbent ONLY if it beats the incumbent on held-out fitness AND is hack-clean
   on its OWN outputs AND preserved sealing integrity AND interface parity AND
   came from a diverse generation AND its selection judge is calibrated. Omitting
   `--slice-type` (or an un-calibrated judge) fails closed — `promote:false`,
   `judge-rubric-not-calibrated`.
7. **Advance the meta-FSM.** The loop halts on: max generations, two BARREN
   generations in a row (converged — "nothing better, keep incumbent" is a
   SUCCESS, the symmetric-error null), or variance collapse. `harness.ts`
   `onGeneration` is the single source of "spawn again?" — never loop on your own.

## The flagship gene: automated suite sharpening
The highest-value mutation is a new `stz-test-author` heuristic + battery mutator
mined from a discovered blind spot (e.g. the `5abc` malformed class the judge
found past a green suite). Promotion of such a skill is TWICE-verified:
`harness-mine` must show the mutator **survives** the incumbent suite (a real gap,
half i) AND **is killed** by suites authored with the new heuristic (half ii).
Then `harness-promote-mutator` appends it to `60-harness/battery` and every future
suite is born sharper — caught once at ~0 marginal cost, not re-derived per slice.

## The bound (kill-switches — sensors HALT, never auto-rewrite)
hack-detector gate · seal integrity (`verifySeal`) · seal-amend reference
re-verify · escalation ceiling · meta-FSM `MAX_GENERATIONS` · held-out blindness
audit (grep variant outputs for suite constants) · judge-reliability consistency
regression. Any trip **halts and surfaces**; nothing self-modifies its own guard
(the DGM/code-repair reward-hacking failure mode).

## Verification (earned, not asserted)
Held-out & recall-free · budget-matched · 3-seed minimum · symmetric-error null ·
N6 replay from `60-harness/MANIFEST.json` append-order. Pre-register before any
generalization claim; the burned pilots show non-regression only — a fresh,
unprobed contract is required to claim a NEW blind spot is generally surfaced.
