# Phase 1 — Contract Kernel + Human 7th Gate · ✅ EARNED

**Unlock condition (PHASED-PLAN):** the separation gate passes — a
naive-but-plausible impl passes the functional sealed suite yet fails ≥1 typed
contract predicate — AND the human accept gate is enforced.

## Build

| File | Role |
|---|---|
| `src/contract/contract-types.ts` | Requirement / Predicate / ContractDelta + state machine + cheap check kinds |
| `src/contract/predicate-eval.ts` | pure, vacuity-safe evaluator (missing observation ⇒ fail, never silent pass) |
| `src/contract/separation-gate.ts` | the go/no-go decision (pure, falsifiable) |
| `src/contract/contract-engine.ts` | state transitions + **human 7th gate** (rejects agent-role approvers) + slice compiler |
| `src/contract/traceability.ts` | req→predicate edges, orphan/dangling detection |
| `src/bridge.ts` → `separation-gate`, `contract-accept` | bridge subcommands (run the gate; the human accept) |
| `agents/stz-contract-{architect,verifier}.md`, `agents/stz-clarifier.md` | propose-only subagents |
| `commands/stz-contract.md` | `/stz:contract` operator surface |

## Iteration: rigged → fair (this is the important part)

**Attempt 1 — ipv4 octet-range (`separation-gate/`).** A shape-only regex
validator passed an 11-case functional suite (1.000) but failed
boundary predicates (`999.1.1.1`, `256.256.256.256`, `01.1.1.1`).
Technically separated — **but rejected as a manufactured positive.** A *good-faith*
IPv4 suite (STZ's own `stz-test-author` included) writes the octet-range test;
`256` rejection is canonical. So attempt 1 only proves "a deliberately weak suite
misses boundaries," not "a good-faith suite does." Downgraded in
`separation-gate.md` to a **mechanism existence proof**, not an earn. This is the
exact failure mode `docs/PAPER.md` discipline (honest limitations over
manufactured positives) exists to catch.

**Attempt 2 — no-new-dependency (`earn-phase1-depconstraint/`). FAIR.** The
separating predicate is an **architectural `diff-constraint`**: "the change adds
no runtime dependency." This is categorically *not a behaviour of the function*,
so **no functional test can express it, however thorough** the suite. The naive
candidate is behaviourally correct (passes a deliberately thorough good-faith
suite at 1.000) but declares a gratuitous dependency in its `package.json`.

## Eval + result

```
$ node experiments/0.9.6-evolution/earn-phase1-depconstraint/run.mjs
sealedSuitePassRate: 1.000   (good-faith behavioural suite fully passes)
failingPredicates: [pred.pad.no-new-dependency.v1]   (high severity)
separated: true → exit 0
```

Guarded by `test/contract.test.ts`:
- "dep-constraint substrate: FAIR earn — separates against a good-faith suite via an architectural predicate"
- Human 7th gate: rejects agent-role approvers (`promoter`, `automatic`, …) and empty; accepts a real human; only from `proposed` state.

**Verdict: EARNED (yes).** The contract type-system expresses an
architecture-conformance signal genuinely not derivable from a functional suite
(the candidate is functionally *correct* but *non-conforming*), and the
human-accept asymmetry is enforced in code.

## Honest scope

Earned: the *signal exists and is human-gated*. NOT earned here: that the signal
**changes outcomes** — that is Phase 3, below.
