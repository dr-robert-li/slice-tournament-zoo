# Phase 2 — Contract-Aware Arena Wiring · ◑ PARTIAL

**Unlock condition (PHASED-PLAN):** contract slices change candidate behaviour
with no regressions; runs bind an accepted slice; candidates may propose but not
apply contract deltas; contract-bounded runs outperform free-form on held-out
tasks.

This phase splits cleanly into a **deterministic half** (trusted-state boundaries)
and a **live half** (outperform free-form on held-out repo work). The former is
earned; the latter needs live paid tournaments and is deferred.

## Earned (deterministic guards)

| Guard | Where | Test |
|---|---|---|
| A run may only target **accepted** contract state | `buildContractSlice` rejects any non-accepted requirement/predicate | `contract.test.ts` — "rejects a non-accepted requirement entering a run slice" |
| Candidates **propose, never apply** deltas | `assertProposalsNotApplied` throws on a candidate-emitted delta in `accepted`/`active` | `contract.test.ts` — "rejects a candidate that self-applied a delta to trusted state" |
| No agent can reach trusted state | state machine + human-only accept (Phase 1) | `contract.test.ts` — state-machine + human-gate suites |

These are the "no direct writes to trusted state" boundary — the safety-critical
half of Phase 2 — and they hold deterministically.

## Deferred (live half — GATED)

- **`contractSliceId` on run manifests + scoped context packets** and run modes
  (`contract-first` / `test-first` / `mixed` / `edge-hunt`) touch the agent-driven
  run loop in `harness.ts`. Wiring is mechanical; *proving it changes behaviour
  without regressions* requires executing real tournaments.
- **"Outperform free-form on held-out repo tasks"** is an outcome claim that can
  only be measured with live runs on a chronological issue stream. Per the plan
  and billing policy, not auto-run here.

## Earned — outcome-mechanism on a second axis (`test/phase2-scope.test.ts`)

A slice declares "only files under `src/feature/` may change" (a **file-scope
`diff-constraint`** — a *different* predicate axis from the dependency axis of
Phases 1/3/4/6). A free-form candidate edits outside scope but still passes the
functional suite; tests-only picks it. The contract-verifier hard-fails it →
contract-bounded selection keeps the localized candidate. This earns the
boundedness *outcome* mechanism ("contract slices bound broad edits / change
selection"), deterministically, and adds a second axis to the evidence base.

## Verdict

**MECHANISM EARNED (guards + boundedness outcome).** The safety guards are earned
and tested; the boundedness outcome is now earned on the file-scope axis. What
remains is the **field-scale** claim ("contract-bounded runs outperform free-form
across many real tasks"), which needs a held-out issue stream — the same blocker
as Phase 3-field / Phase 7-tuning, not billing.
