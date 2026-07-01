# Phase 4 — Rubric-lite Verifier · ◑ MECHANISM EARNED (live, subscription) · human-agreement pending

**Unlock condition (PHASED-PLAN):** a rubric authored before patch generation
changes candidate ranking on held-out tasks AND a human agrees with the
rubric-changed winner, without disproportionate cost.

**Billing note (the point of this phase):** this is the first phase earned with a
**live LLM**, and it cost **$0 marginal API** — the rubric-author and rubric-judge
were spawned as **in-session `Agent` subagents of this interactive session**, which
is the subscription-billed path (the original STZ interactive contract). No
`claude -p` / SDK / standalone loop was used. This demonstrates 4–8 are not
API-cost-blocked.

## Build / run (live, in-session agents)

| Step | Agent | Constraint honoured |
|---|---|---|
| author rubric | `rubric-author` (in-session Agent) | authored **before** patches; blind to candidates; weights sum to 1.0 |
| score candidates | `rubric-judge` (in-session Agent) | **separate agent** — did not author the rubric or the candidates (no self-approval) |

Substrate: the same two dep-constraint candidates from Phase 1/3 —
byte-identical `pad.mjs`, differing only in `package.json:dependencies`.
Artifacts: `experiments/0.9.6-evolution/earn-phase4-rubric/{rubric.json,judge-result.json,result.json}`.

## Eval + result

The independently-authored rubric put **"no gratuitous runtime dependency"** as its
top criterion (weight 0.30, anchored to `package.json:dependencies`). The separate
judge scored:

| Candidate | c1 (no-dep, 0.30) | c2–c5 | weighted total |
|---|---|---|---|
| alpha (clean) | 1.0 | ~tie | **0.970** |
| beta (dep-adder) | 0.0 | ~tie | **0.6475** |

Winner: **alpha**, decisive criterion **c1** (Δ 0.3225). The judge even noted
"left-pad declared but unused." Because `pad.mjs` is byte-identical, c2–c5 tie and
the dependency alone splits the rubric — the live rubric reranked two candidates
that **STZ's tests + codeHealth tie** (proven in phase-3.md), toward the
architecture-conforming one.

**Verdict: MECHANISM EARNED (yes, live, on subscription).** A before-patch,
blind, LLM-authored rubric + a separate LLM judge reranked a tie in the right
direction, via the subscription path, rerank-only (no promotion claimed).

## Honest scope (two caveats)

1. **Human-agreement pending.** The plan's full Phase-4 gate also requires that
   **Dr. Li agrees** with the rubric-changed winner. That is the human 7th-gate
   half and cannot be self-supplied — genuinely open.
2. **Same axis as Phase 3, richer scorer — not a new signal.** The rubric reranks
   on the *same* architecture-conformance axis (dependency) that Phase 1/3 already
   earned. This is consistent with the plan (rubric = rerank input, not a new
   correctness axis) — but it must be said: Phase 4 earns that the **live rubric
   mechanism works on subscription**, not that it discovers a signal beyond Phase 3.
   The criterion was also aligned with the stated requirement's "dependency-frugal"
   language, so the rubric operationalized a known axis rather than discovering one.

## What this unblocks

Phases 6 (retrieval utility) and 7 (gene tuning) are also **live-mechanism on
subscription** — runnable in-session with no API cost. Their remaining blockers are
a real held-out issue stream and, for promotions, the human 7th gate — not billing.
