# slice-tournament-zoo (STZ)

> An agentic-coding harness for "software-engineering dark factories with
> auditable outputs." Each slice is one interface contract plus its
> implementation plus its tests, implemented adversarially by N **specimens**.
> Survivors are selected by an eval-gate and a pairwise LLM judge against a
> **frozen, sealed** test suite the implementers never see. Every run leaves a
> markdown audit trail a human can replay.

STZ runs two ways. The **deterministic spine** is real and fully tested. The
**model layer** runs either against a deterministic mock (for tests and a
no-network demo) or, the way it is meant to be used, as **in-session Claude Code
Task subagents** driven by the `/stz:run` command.

- Reference docs live in [`docs/`](./docs): `AS-BUILT.md` (what is real vs.
  deferred) and `TESTPLAN.md` (requirement-to-test map). The full architectural
  design pattern is kept locally as `docs/CLAUDE.md`.
- The build narrative is in [`JOURNAL.md`](./JOURNAL.md).
- A worked example of a real run is in
  [`examples/clamp-tournament/`](./examples/clamp-tournament).

## Contents

- [Requirements](#requirements)
- [Install](#install)
- [Use](#use)
- [Example commands and workflows](#example-commands-and-workflows)
- [Uninstall](#uninstall)
- [The pipeline](#the-pipeline-per-slice)
- [The audit tree](#the-stz-audit-tree)
- [License](#license)

## Requirements

- Node.js 20 or newer.
- For the in-session harness: Claude Code (the CLI, desktop, or web app).
- No database, no vector service, no API keys beyond what Claude Code already
  uses for its subagents.

## Install

### As a Claude Code plugin (the real harness)

From inside Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add dr-robert-li/slice-tournament-zoo
/plugin install stz
```

This registers the `/stz:run` command, the four subagents (specimen, judge,
test-author, documenter), and a SessionStart hook that announces STZ when a
project contains a `.stz/` tree. Restart the session (or reload) so the agent
definitions load.

The plugin shells out to the `stz bridge` CLI for every deterministic decision.
Install the CLI on the machine so it is on `PATH`:

```bash
git clone https://github.com/dr-robert-li/slice-tournament-zoo
cd slice-tournament-zoo
npm install
npm link        # exposes `stz` globally; or call `node bin/stz.mjs ...`
```

### As a library / local CLI only

If you only want the deterministic engine and the mock pipeline:

```bash
git clone https://github.com/dr-robert-li/slice-tournament-zoo
cd slice-tournament-zoo
npm install
npm test            # 75 deterministic tests
npm run typecheck
```

## Use

### Scaffold a project

```bash
stz init .          # create the .stz/ taxonomy + AGENTS.md in the current repo
```

This writes the tiered `.stz/` tree (`00-intent` through `90-audit`) and an
`AGENTS.md` table of contents. Nothing else is required to start.

### Run a slice as a tournament (in Claude Code)

```
/stz:run slice-01
```

You, the session, become the orchestrator. The command:

1. Reads or elicits the slice manifest (the contract plus at least one
   machine-checkable done-predicate). It refuses prose-only acceptance.
2. Spawns a frozen **test-author** subagent to write the sealed held-out suite.
3. Spawns N **specimen** subagents in parallel, each implementing the contract
   with a different strategy.
4. Runs the real eval runner over each specimen with `stz bridge eval`
   (executed sealed suite, V8 coverage, mutation survival, hack-pattern
   detection), then gates them.
5. Spawns **judge** subagents for pairwise votes across the survivors.
6. Selects a winner with `stz bridge select` (two-stage selection plus GRPO).
7. Pauses for your approval of the winner, then spawns a **documenter** and
   writes the spec-diff, pressure log, and audit journal.

Every exact decision is made by the CLI, never by the agent's own arithmetic.

### Run the mock pipeline (no network, no subagents)

```bash
stz run .           # drive the demo slice end to end against the mock model
```

Useful for a fast smoke test of the whole eight-phase flow, including a
disqualified hacker and a GRPO-weighted winner, with no API calls.

### The bridge CLI directly

The deterministic half is scriptable on its own:

```bash
stz bridge begin        --root . --manifest .stz/40-slices/slice-01/manifest.json
stz bridge eval         --root . --slice slice-01 --specimen a \
                        --sealed .stz/30-tests/held-out/<file> \
                        --impl   .stz/40-slices/slice-01/prototypes/specimen-a/<file>
stz bridge gate         --root . --slice slice-01
stz bridge record-votes --root . --slice slice-01 --votes votes.json
stz bridge select       --root . --slice slice-01
stz bridge finalize     --root . --slice slice-01 --intent intent.json --asbuilt asbuilt.json
```

Each subcommand prints one JSON object and writes its artifacts under `.stz/`.

## Example commands and workflows

### A single feature slice, start to finish

```
/stz:run payment-validator
```

Answer the elicitation prompts (contract, done-predicates), let four specimens
compete, approve the winner, then read the result:

```bash
cat .stz/40-slices/payment-validator/spec-diff.md      # intent vs as-built
cat .stz/50-pressure/payment-validator/pressure.md     # why the losers lost
cat .stz/90-audit/journal.md                           # the replayable event log
```

### Inspect the worked example without running anything

```bash
ls   examples/clamp-tournament/stz-tree/40-slices/slice-01
cat  examples/clamp-tournament/stz-tree/40-slices/slice-01/tournament.md
```

Four specimens implement `clamp`; a planted network-bypass cheater passes all
304 sealed checks but is disqualified at the gate; the winner is chosen by six
judge votes and the highest GRPO advantage.

### CI-style local check (no Claude Code)

```bash
npm test && npm run typecheck && stz run /tmp/stz-smoke
```

### A multi-slice feature

Scaffold once, then run slices in dependency order, reading the spec-diff after
each before moving on:

```
/stz:run schema
/stz:run validator      # depends on schema
/stz:run api-handler    # depends on validator
```

## Uninstall

### Remove the plugin

```
/plugin uninstall stz
/plugin marketplace remove dr-robert-li/slice-tournament-zoo
```

### Remove the CLI

```bash
npm unlink -g stz       # if you used `npm link`
```

### Remove harness data from a project

The `.stz/` tree is the only thing STZ writes into your repo. Delete it to
remove all harness state:

```bash
rm -rf .stz AGENTS.md
```

Nothing else is touched. There is no external state to clean up.

## The pipeline (per slice)

```
elicit -> research -> ground-truth-validate -> conventions
   -> test-author (frozen, sealed held-out suite)
   -> plan (intent spec)
   -> spawn N specimens in parallel  ->  eval-gate (sealed suite + coverage
                                          + mutation + hack-pattern detect)
   -> judge (pairwise votes, GRPO group-relative advantage)
   -> winner -> merge -> as-built spec -> spec-diff
   -> ratify conventions -> state.json checkpoint -> next slice

failure (bounded): no passers -> 1 GRPO retry -> 1 replan -> halt + report
```

## The `.stz/` audit tree

| Tier | Purpose |
| ---- | ------- |
| `00-intent/` | elicitation, questionnaire, done-predicates |
| `10-research/` | research, validated claims, spikes |
| `20-standards/` | versioned conventions, ADRs |
| `30-tests/` | plan, rubric, sealed held-out suite |
| `40-slices/` | manifest, plan, specimen prototypes, tournament, spec-diff |
| `50-pressure/` | culled specimens' diffs and critiques (the pressure log) |
| `90-audit/` | journal, call ledger, cost, state.json |

## Module map (`src/`)

`types.ts` (schema), `taxonomy.ts` (tree and frontmatter), `state.ts`
(checkpoint and recovery), `grpo.ts`, `selection.ts`, `hack-detector.ts`,
`escalation.ts`, `budget.ts`, `cost-tracker.ts`, `pressure.ts`, `specdiff.ts`,
`orchestrator.ts` (mock pipeline), `bridge.ts` (the in-session CLI),
`eval-runner.ts` (real tests, coverage, mutation), and `llm/` (the model seam
plus the deterministic mock).

The requirement-to-test mapping is in [`docs/TESTPLAN.md`](./docs/TESTPLAN.md).
What is real versus deferred is in [`docs/AS-BUILT.md`](./docs/AS-BUILT.md).

## License

[Apache-2.0](./LICENSE).
