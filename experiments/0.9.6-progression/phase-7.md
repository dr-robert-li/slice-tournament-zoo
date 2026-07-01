# Phase 7 — Safe Gene Tuning + G7 · ◑ MECHANISM EARNED · tuning-over-holdout gated

**Unlock condition (PHASED-PLAN):** a low-blast-radius gene (or the new G7
contract-crystallization gene) beats a fixed-manifest baseline over a
chronological holdout with no regressions; only policy values evolve, never
system logic; gene changes go through the same promotion guard.

## Build

| File | Change |
|---|---|
| `src/types.ts` | `HarnessGenome` gains **G7 `crystallizationHeuristicId?`** — optional, so every existing genome literal is unaffected |
| `src/harness.ts` | `defaultGenome()` seeds `crystallizationHeuristicId: "edge-to-predicate-v0"` |

G7 evolves *how the edge-explorer crystallizes a discovered edge into a typed
predicate* — a **harness-altitude** gene (HarnessX) whose signal is **not derived
from the sealed suite**. That matters: STZ's numeric-gene negative ruled out
reweighting sealed-derived proxies; G7 is a different axis (contract
crystallization), which is why it is fundable where numeric-gene tuning was not.

## Earn — mechanism (deterministic, `test/phase7-gene.test.ts`, 5 tests)

- G7 is a **first-class bounded gene**: a distinct `crystallizationHeuristicId`
  yields a distinct content-addressed genome (HarnessX one-gene substitution),
  field-order-independent in the hash like every other gene.
- A G7 gene-change is gated by the **existing six-gate `promotionGate`,
  unchanged** — promotes only on a real win.
- **Halt-on-tie preserved:** a G7 change that ties the incumbent is DECLINED
  (`does-not-beat-incumbent`). This is the single most important structural
  property `docs/PAPER.md` identified; G7 inherits it for free by routing through
  the same guard.
- Added **without breaking any existing genome test** (238 pass): optionality was
  the ponytail-correct, non-breaking choice, mirroring the codebase's other
  optional evolvable fields (`codeHealth?`, `harness?`).

## Verdict

**MECHANISM EARNED (yes).** G7 is a real, bounded, hash-distinct gene gated by
STZ's proven promotion guard with its halt-on-tie property intact.

## Honest scope — the tuning claim is NOT earned here

Proving that *tuning* G7 (or any gene) **beats a fixed-manifest baseline over a
chronological holdout** is intrinsically a tournament-over-many-tasks measurement.
That needs a real held-out issue stream — the same blocker as Phases 2-outcome and
3-field. It is **not** API-cost-blocked (in-session `Agent` tournaments are
subscription-billed), only issue-stream-blocked. Until a real stream exists, the
tuning win stays an honest open item; the gene *mechanism* is earned.
