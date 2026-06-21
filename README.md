# slice-tournament-zoo (STZ)

> An agentic-coding harness for "software-engineering dark factories with
> auditable outputs." Each slice is one interface contract + its implementation
> + its tests, implemented adversarially by N **specimens**; survivors are
> selected by an eval-gate + pairwise LLM judge against a **frozen, sealed** test
> suite the implementers never see. Every run leaves a markdown audit trail a
> human can replay.

STZ runs two ways. The **deterministic spine** is real and fully tested. The
**model layer** runs either against a deterministic mock (for tests and a
no-network demo) or, the way it is meant to be used, as **in-session Claude Code
Task subagents** driven by the `/stz:run` command. See [`AS-BUILT.md`](./AS-BUILT.md)
for exactly what is real, [`JOURNAL.md`](./JOURNAL.md) for the build narrative,
and [`CLAUDE.md`](./CLAUDE.md) for the full design.

## Run inside Claude Code (the real harness)

Install as a plugin, then run a slice as a live tournament:

```
/plugin marketplace add <this-repo>
/plugin install stz
/stz:run slice-01
```

You (the session) become the orchestrator. The command spawns N **specimen**
subagents in parallel to implement the slice, a frozen **test-author** writes a
sealed suite, the real eval runner gates them (executed tests + V8 coverage +
mutation + hack detection), **judge** subagents rank the survivors, and a
**documenter** produces the as-built spec. Every deterministic decision is made
by the `stz bridge` CLI, never by the agent's own arithmetic.

A worked example of a real run lives in
[`examples/clamp-tournament/`](./examples/clamp-tournament/): four specimens
implement `clamp`, a planted network-bypass cheater passes all 304 sealed checks
but is disqualified at the gate, and the winner is chosen by six judge votes and
the highest GRPO advantage.

## Quick start (local, no network)

```bash
npm install
npm test            # 75 deterministic tests
npm run typecheck

node bin/stz.mjs init <dir>   # scaffold the .stz/ taxonomy + AGENTS.md
node bin/stz.mjs run  <dir>   # run the demo slice through the mock pipeline
```

The mock run drives a slice through all 8 phases, runs a 4-specimen tournament,
disqualifies a test-skipping specimen via the hack detector, selects a winner by
GRPO-weighted pairwise voting, and writes the full audit tree under `.stz/`.

## The pipeline (per slice)

```
elicit → research → ground-truth-validate → conventions
   → test-author (frozen, sealed held-out suite)
   → plan (intent spec)
   → spawn N specimens in parallel  →  eval-gate (sealed suite + coverage
                                        + mutation + hack-pattern detect)
   → judge (pairwise V=8 votes, GRPO group-relative advantage)
   → winner → merge → as-built spec → spec-diff
   → ratify conventions → state.json checkpoint → next slice

failure (bounded): no passers → 1 GRPO retry → 1 replan → halt + report
```

## The `.stz/` audit tree

| Tier | Purpose |
|------|---------|
| `00-intent/` | elicitation, questionnaire, done-predicates |
| `10-research/` | research + validated claims + spikes |
| `20-standards/` | versioned conventions, ADRs |
| `30-tests/` | plan, rubric, **sealed held-out suite** |
| `40-slices/` | manifest, plan, specimen prototypes, tournament, spec-diff |
| `50-pressure/` | culled specimens' diffs + critiques (the pressure log) |
| `90-audit/` | journal, call ledger, cost, state.json |

## Module map (`src/`)

`types.ts` (schema) · `taxonomy.ts` (tree + frontmatter) · `state.ts` (checkpoint
/recovery) · `grpo.ts` (F8) · `selection.ts` (F7) · `hack-detector.ts` (F10/L3) ·
`escalation.ts` (F14) · `budget.ts` (F15) · `cost-tracker.ts` (N5/N6) ·
`pressure.ts` (F9) · `specdiff.ts` (F13) · `orchestrator.ts` (F1) ·
`llm/interfaces.ts` + `llm/mock.ts` (the model seam).

Test → requirement mapping: [`TESTPLAN.md`](./TESTPLAN.md).

## License

Apache-2.0.
