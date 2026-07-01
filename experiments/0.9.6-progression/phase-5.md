# Phase 5 — Promotion Ledger + 7-Gate Engine · ✅ EARNED

**Unlock condition (PHASED-PLAN):** ≥1 non-test artifact promoted through the
extended gate; ≥1 quarantine decision fires (mechanism confirmed); zero severe
regressions from promoted artifacts; the six-gate guard preserved, never loosened.

## Build

| File | Role |
|---|---|
| `src/ledger/events.ts` | append-only ledger: monotonic `seq`, JSONL round-trip, no timestamps (N6, mirrors seal.ts) |
| `src/ledger/promotion-engine.ts` | pure 7-gate decision: six existing gates + `humanAccepted`, plus the proven test-sharpening guard |

The engine **reuses, never loosens** the six-gate guard from `harness.ts:285`
(`hackClean, sealOk, interfaceParity, diversityOk, beatsIncumbent,
rubricCalibrated`) and adds:
- **7th gate** — contract-bearing kinds (`predicate`/`contract_delta`/`rubric`)
  cannot auto-promote without human acceptance.
- **test-sharpening guard** — an execution-test-only win (`kind:test`,
  `contractDelta≤0`) is quarantined, never promoted. This is the structural
  property `docs/PAPER.md` identified as load-bearing: it stops suite-sharpening
  from masquerading as SWE improvement.

## Eval (decision matrix)

Five synthetic evidence records → deterministic decisions
(`earn-phase5-ledger/run.mjs`, guarded by `test/ledger.test.ts` on the real core):

| Artifact | kind | condition | decision |
|---|---|---|---|
| `pred.filter-nonmutation.v1` | predicate | human-accepted, gain, gates ok, n=8 | **promote** ✅ |
| `pred.no-dep.v1` | predicate | **no human accept** | **quarantine** (7th gate) |
| `test.sharpened-suite.v1` | test | exec +20%, contract 0 | **quarantine** (test-sharpening guard) |
| `contract_delta.bad.v1` | contract_delta | held-out regression | **reject** |
| `pred.interface-broken.v1` | predicate | six-gate `interfaceParity` fails | **reject** |

```
$ node experiments/0.9.6-evolution/earn-phase5-ledger/run.mjs
earned: true → exit 0   (≥1 promote AND ≥1 test-sharpening quarantine)
```

## Result

**Verdict: EARNED (yes).** A contract-bearing artifact promotes; a test-only win
is quarantined (the proven negative is actively guarded); the human 7th gate and
the six-gate guard both decline correctly; every decision is written to an
append-only ledger. Guarded by `test/ledger.test.ts` (225 tests total pass).

## Honest scope

Earned: the *decision logic + ledger* on synthetic evidence. NOT earned here:
promotion decisions driven by **real held-out evaluation** of live artifacts —
that needs the live-run harness (same gate as Phases 2-live / 3-outcome). The
guard mechanism is proven; wiring it to real evidence streams is future work.
