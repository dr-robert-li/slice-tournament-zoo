# slice-tournament-zoo (STZ)

> An agentic-coding harness for "software-engineering dark factories with
> auditable outputs." Each slice is one interface contract + its implementation
> + its tests, implemented adversarially by N **specimens**; survivors are
> selected by an eval-gate + pairwise LLM judge against a **frozen, sealed** test
> suite the implementers never see. Every run leaves a markdown audit trail a
> human can replay.

This repository is the **slice-00 kernel**: the deterministic, auditable spine
implemented for real and fully tested, with the LLM/subagent layer behind thin
interfaces + a deterministic mock so the whole pipeline runs with no network
call. See [`AS-BUILT.md`](./AS-BUILT.md) for exactly what is real vs. mocked and
[`CLAUDE.md`](./CLAUDE.md) for the full architectural design pattern.

## Quick start

```bash
npm install
npm test            # 66 deterministic tests
npm run typecheck

tsx src/cli.ts init <dir>   # scaffold the .stz/ taxonomy + AGENTS.md
tsx src/cli.ts run  <dir>   # run the demo slice through the mock pipeline
```

The demo run drives a slice through all 8 phases, runs a 4-specimen tournament,
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
