# Phase 3 — Contract Verifier + Selection Change · ✅ EARNED

**This is the funded hypothesis.** Unlock condition (PHASED-PLAN): ≥1 accepted
predicate catches a previously passing-but-**non-conforming** output (functionally
correct, but violating an architectural predicate) and **changes candidate
selection** — proof the contract signal moves outcomes, not just that it exists.

> Terminology (symmetric-error discipline): the dep-adding candidate is
> functionally **correct** — it is *non-conforming*, not *wrong*. The signal earned
> here is **architecture-conformance**, legitimate under "well-architected
> software," not "correctness."

> Note: built ahead of Phase 2's full arena wiring because it is the load-bearing
> claim and is *deterministically* earnable, whereas Phase 2's outcome half needs
> live runs. The mechanism earn does not depend on the arena plumbing.

## Build

| File | Role |
|---|---|
| `src/verifiers/contract-verifier.ts` | `scoreContract` (high-severity fail ⇒ hard-fail), `testsOnlyRank`, `contractAwareRank`, `contractChangesSelection` — all pure |

The funded delta made operational: the contract is the **definition of winner**.
A high-severity predicate failure **eliminates** a candidate *before* test-weight
tie-breaking. This is not a reweighting of sealed-derived proxies (STZ's
ruled-out negative) — it is a different selection *object*.

## Eval (what earns it)

Reuse the Phase-1 dep-constraint substrate as **two competing candidates**:

| Candidate | testPassRate | no-new-dep predicate | 
|---|---|---|
| `naive` (dep-adder, listed first) | 1.000 | ❌ high-severity FAIL |
| `correct` (baseline, no dep) | 1.000 | ✅ pass |

- **STZ's real reward ties them.** Not just tests-only: `measureCodeHealth` reads a
  single impl source and never reads `package.json`, and the two impls are logically
  identical — so `evalReward` (pass/coverage/kill/**codeHealth**/clean, `selection.ts`)
  scores them **equal** (empirically: codeHealth 0.9686 for both). STZ's shipped
  multi-objective selection *cannot* down-rank the dep-adder. This defeats the
  strawman-baseline objection: the predicate is not redundant with codeHealth.
- **Contract-aware** selection hard-fails `naive` on the high-severity predicate →
  winner becomes **`correct`**.

The winner **changed** because of an accepted predicate — against a baseline STZ's
real reward already surpasses everything else on. That is the exit-gate.

## Result

```
$ node experiments/0.9.6-evolution/earn-phase3-selection/run.mjs
testsOnlyWinner:      naive     (passes the suite)
contractAwareWinner:  correct
changed: true → exit 0
```

Guarded on the **canonical TS core** by `test/phase3-selection.test.ts` (runs the
real `contract-verifier.ts` against real observations produced by executing the
substrate — not just an artifact re-read):
- both candidates pass the suite (tests-only cannot distinguish; picks `naive`)
- **STZ's real `evalReward` also ties them** (codeHealth blind to `package.json`) —
  proves the earn is against STZ's shipped multi-objective reward, not a strawman
- the high-severity predicate hard-fails `naive`
- contract-aware winner is `correct`; `contractChangesSelection().changed === true`

**Verdict: EARNED (yes).** An accepted, human-gated, architectural predicate
caught a passing-but-non-conforming candidate (functionally correct, but violating
an architectural constraint) and moved tournament selection — against a baseline
STZ's real reward could not break. The exact hypothesis STZ's earned negatives
never crossed.

## Honest scope

Earned: the contract **changes selection** on a controlled two-candidate set.
NOT earned here: that this improves resolution/acceptance on **real repo issues
at scale** vs a good-faith suite. That is Phase 3's *outcome* gate and needs live
runs on a held-out chronological stream — deterministically un-earnable, tracked
in `remaining.md`. The mechanism is proven; the field effect is future work.
