# STZ 0.9.6 — Progression Ledger
## Earned-capability implementation of PHASED-PLAN.md

This directory is the **append-only record** of implementing
`experiments/0.9.6-evolution/PHASED-PLAN.md` phase by phase. Each phase must
**EARN its existence** with an autonomous, deterministic eval on the repo's
recall-free substrate before the next phase is built. A phase that cannot be
earned is frozen and reported as a documented negative — not carried forward.

**Why deterministic evals for 0/1/3/5 (and what changed for 4–8):** the plan
mandates the synthetic recall-free substrate as the trustworthy instrument, so the
mechanism earns here are deterministic separation/selection experiments — cheap,
reproducible, no LLM. The billing constraint applies only to the `claude -p`/SDK/
standalone-loop route (paid API); it does **not** forbid live LLM per se. Live
tournaments run by *this interactive session's* in-session `Agent`/`Task`
subagents are **subscription-billed** (the original STZ interactive contract), so
phases 4/6/7 can be earned live-on-subscription — their real blockers are a real
held-out issue stream and Dr. Li's human 7th gate, not API cost. See
[remaining.md](remaining.md) for the corrected classification.

## Earn status

| Phase | Capability | Earn test (deterministic) | Verdict | Record |
|---|---|---|---|---|
| 0 | Measurement & safety baseline | split determinism + reproducibility + no-adaptive | ✅ **EARNED** | [phase-0.md](phase-0.md) |
| 1 | Contract kernel + human 7th gate | separation vs a **good-faith** suite (architectural predicate) | ✅ **EARNED** | [phase-1.md](phase-1.md) |
| 2 | Contract-aware arena wiring | guards + boundedness outcome on a 2nd axis (file-scope): contract bounds broad edits, changes selection | ◑ **MECHANISM EARNED** | [phase-2.md](phase-2.md) |
| 3 | Contract verifier + edge→predicate | accepted predicate **changes selection** (funded hypothesis) | ✅ **EARNED** | [phase-3.md](phase-3.md) |
| 4 | Rubric-lite verifier | **live** rubric-author + separate judge (in-session agents, $0 API) rerank a tests+codeHealth tie; human-agreement pending | ◑ **MECHANISM EARNED (live)** | [phase-4.md](phase-4.md) |
| 5 | Promotion ledger | 7-gate decision matrix on synthetic evidence (promote + both quarantine paths + rejects) | ✅ **EARNED** | [phase-5.md](phase-5.md) |
| 6 | Selective retrieval | guards (7 deterministic tests) + **live** A/B: a retrieved predicate made an implicit invariant explicit where discovery-by-example dropped it (cost/amortization NOT claimed) | ✅ **EARNED (narrow)** | [phase-6.md](phase-6.md) |
| 7 | Safe gene tuning + G7 | G7 gene added (5 tests, halt-on-tie preserved); tuning-over-holdout needs issue stream | ◑ **MECHANISM EARNED** | [phase-7.md](phase-7.md) |
| 8 | Frontier modules | deferred by design (prereq: multiple stable promotions) | ⏸ **DEFERRED** | [remaining.md](remaining.md) |

## The central result so far

Phases 1 and 3 together cross the one hypothesis STZ's earned negatives never
touched (docs/PAPER.md; q-n-a §4008):

> A typed contract predicate can express an **architecture-conformance signal not
> derivable from a functional test suite** (Phase 1) — and, crucially, not visible
> to STZ's own `codeHealth` reward either (it reads impl source, never
> `package.json`) — and that signal can **change which candidate wins a
> tournament** (Phase 3) against a baseline STZ's real multi-objective `evalReward`
> ties, without reweighting any sealed-suite-derived proxy.

The dep-adding candidate is functionally **correct** — the earned signal is
*architecture-conformance*, legitimate under "well-architected software," not
"correctness." (Symmetric-error labeling, same discipline that rejected the rigged
ipv4 substrate.)

The load-bearing move was rejecting the first, *rigged* separation substrate
(ipv4 octet-range, which a good-faith suite would catch) and re-earning on an
**architectural** predicate (`no-new-dependency`) that no functional test can
express by construction. See [phase-1.md](phase-1.md) §"Iteration: rigged → fair".

**Live earns on subscription (Phases 4, 6).** Two phases were earned with live
LLM at **$0 marginal API** by spawning in-session `Agent` subagents (the
subscription path):
- **Phase 4** — a before-patch, blind rubric-author + a separate judge reranked a
  tie toward the conforming candidate (0.97 vs 0.65, decisive criterion =
  no-gratuitous-dependency).
- **Phase 6** — a retrieval A/B where the retrieved predicate carried an invariant
  ("lowercase") that the control's discovery-by-example dropped; verified on
  uppercase input. Cost/amortization is **not** claimed (circular at n=1); the earn
  is the single on-thesis axis: explicit predicates make implicit invariants
  explicit.

**Tally:** 0,1,3,5,6 earned (6 narrowly) · 2,4,7 mechanism-earned · 8 deferred by
design. 241 tests green.

**Cumulative honesty caveat.** The earns span **two hand-picked toy axes**
(dependency/lowercase for 1/3/4/6; file-scope for 2) — richer than one, but still
not a diverse *real* issue stream. Every mechanism is earned deterministically or
live-on-subscription; what is NOT yet shown is any **field-scale outcome** across
many real, varied tasks. That, plus the human 7th gate, is all that remains — never
API cost.

## What "EARNED" means here (and does not)

- **Does** mean: on a controlled substrate, the mechanism demonstrably produces
  the claimed effect (separation / selection-change), guarded by a test on the
  canonical TS core.
- **Does NOT** mean: the effect holds on real repo issues at scale, or improves
  human-review outcomes. That is each phase's *outcome* gate and requires live
  runs — tracked separately, never conflated with the mechanism earn.

## Provenance

- Plan: `experiments/0.9.6-evolution/PHASED-PLAN.md`
- Research Q&A: `experiments/0.9.6-evolution/q-n-a.md`
- Earned negatives (do-not-re-derive): `docs/PAPER.md`
- Code: `src/contract/`, `src/eval/`, `src/verifiers/`, `src/ledger/`, bridge subcommands in `src/bridge.ts`
- Substrates: `experiments/0.9.6-evolution/{separation-gate,earn-phase1-depconstraint,earn-phase3-selection,earn-phase4-rubric,earn-phase5-ledger}/`
- Tests: `test/contract.test.ts`, `test/eval-phase0.test.ts`, `test/phase3-selection.test.ts`, `test/ledger.test.ts`
