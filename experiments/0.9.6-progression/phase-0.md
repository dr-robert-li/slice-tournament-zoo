# Phase 0 — Measurement & Safety Baseline · ✅ EARNED

**Unlock condition (PHASED-PLAN):** stable, reproducible chronological baseline
metrics; splits deterministic; no adaptive behaviour introduced.

## Build

| File | Role |
|---|---|
| `src/eval/chronological-stream.ts` | contiguous, order-preserving splits (trainingLike / promotionHoldout / finalReportHoldout); never shuffles |
| `src/eval/reviewer-outcome.ts` | reviewer verdict schema (accepted / accepted-with-edits / rejected) + rate summary |
| `src/eval/baseline-report.ts` | per-repo `RepoMetrics` for the three baseline conditions; cost amortised over resolved issues |
| `src/bridge.ts` → `eval-baseline` | bridge subcommand; writes `.stz/90-audit/baseline-report.json` |
| `commands/stz-eval.md` | `/stz:eval` operator surface |

## Eval (what earns it)

The Phase-0 claim is *measurement is trustworthy*, which reduces to two
deterministic properties, both tested in `test/eval-phase0.test.ts`:

1. **No shuffle / order-preserving.** `assignSplits` maps issue at index *i* to
   `issues[i]`; splits are contiguous (a prefix, a middle, a suffix) with no
   interleaving. Shuffling would leak future data and inflate scores.
2. **Deterministic + total.** Same input → identical splits; every issue assigned
   exactly once; sizes floor as specified (20 issues → 12/5/3).

Baseline metric math is also checked: resolution rate, regression-free rate,
cost-per-**resolved**-issue amortisation, and zero-safety on empty input.

## Result

```
test/eval-phase0.test.ts  — all pass (determinism, no-shuffle, partition, metrics, zero-safety)
```

**Verdict: EARNED (yes).** Measurement is deterministic and reproducible; no
adaptive behaviour was added. This is the precondition for every later phase —
per the plan's kill criterion, an unstable baseline would forbid adding any
learning feature.

## Honest scope

The *infra* is earned. Producing a real ≥8-issue baseline **report** on a live
repo issue stream is an operator action (`/stz:eval` with real records), not
something auto-generated here — the schema, determinism, and math are proven;
the data collection is the operator's.
