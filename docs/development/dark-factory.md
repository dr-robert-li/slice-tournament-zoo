# Dark-factory mode: the autonomous-run contract

A *dark factory* runs lights-out: no human on the floor, product and a report at
the end. STZ's dark-factory mode (0.4.0) is the same idea for the slice pipeline —
elicitation hands off and the orchestrator drives research → ground-truth →
standards → testing-conventions → slice-disaggregation → every per-slice
tournament → summary with **no human in the loop**, surfacing only the final
completion report.

This is the literal intent in the project's executive summary ("software
engineering dark factories with auditable outputs"): autonomous, but every
decision still lands in the replayable `.stz/` audit tree, so a human can review
the whole run after the fact.

## The one gate that never closes

Dark-factory skips every *downstream* human gate, but **not** the F2 done-predicate
gate in `/stz:new`. Elicitation may not exit with zero machine-checkable
predicates, and acceptance criteria are never auto-invented — the predicates are
the contract the autonomous run executes against. So the question is offered only
*after* the predicate gate is satisfied; by the time dark-factory drives anything,
the contract is already locked.

Gates that ARE skipped when `darkFactory` is on:

- `/stz:slice` "Approve as-is" — the proposed slice DAG is auto-approved.
- `/stz:run` step 8b winner-approval — the selected winner is auto-accepted. The
  full ranking, GRPO advantages, and any disqualified specimens with their hack
  findings still land in the audit tree; nothing is hidden, only un-prompted.

A halted slice does not stall the factory: it is reported and the rest of the DAG
continues. Every halt surfaces in the final `/stz:summary` completion report.

This is also how the autonomous run handles the decisions it must not make alone.
Two human-only gates can arise mid-run:

- A `seal-crosscheck` divergence (0.5.0) — a blind-spot signal that requires human
  adjudication and must never auto-rewrite.
- A blocked `merge-validate` (0.5.2) — an `unsanctioned`/`invalid` merge failure,
  or a compat entry still `pendingApproval` (the merge agent proposed it but no
  human has approved). Auto-approving would defeat the gate.

In both cases, rather than act on an unresolved signal — or block forever waiting
for a human who isn't there — the slice is **halted** and the DAG continues; the
signal (already recorded in `30-tests/cross-reference.md` or
`90-audit/merge-validation.md`) is surfaced in the final summary for after-the-fact
review. The factory defers that decision; it does not guess.

## Where the flag lives, and why a dedicated toggle

`darkFactory` is a boolean on the persisted run config (`00-intent/run-config.json`).
It is set two ways:

1. **At the end of elicitation** — `/stz:new` asks once, after the predicate gate.
2. **At any point** — `stz bridge project-dark-factory --root . --on` (or `--off`).

The toggle is a deliberate **load-modify-save**: it reads the existing config,
flips the one field, and writes it back. It is NOT routed through
`project-set-config`, because that command runs `normalizeRunConfig(partial)`,
which merges the partial over the *defaults* — a mid-run `set-config
{darkFactory:true}` would silently reset fan-out, models, and strictness. The
dedicated command is the single source of truth; never hand-edit run-config.json.

`project-status` hoists the resolved value to a top-level `darkFactory` field (as
well as inside `runConfig`), so each command reads it once at the start of every
phase. Engaging it between phases therefore takes effect at the next phase with no
restart.

## What is and isn't tested

The deterministic plumbing — the config field, normalization/coercion, the
load-modify-save toggle (with a regression test proving it never resets sibling
fields), persistence, and the hoisted status surface — is covered end-to-end in
`test/project.test.ts`. The autonomous *orchestration loop itself* lives in command
markdown (`/stz:pipeline`, `/stz:run`, `/stz:slice`) and is driven by the agent,
so it is not unit-tested; the tests cover the flag plumbing those commands read,
not the agent loop.
