# Slice Tournament Zoo (STZ)

```text
  ██████╗  ████████╗ ███████╗
 ██╔════╝  ╚══██╔══╝ ╚══███╔╝
 ╚█████╗      ██║      ███╔╝ 
  ╚═══██╗     ██║     ███╔╝  
 ██████╔╝     ██║    ███████╗
 ╚═════╝      ╚═╝    ╚══════╝
```

[![CI](https://github.com/dr-robert-li/slice-tournament-zoo/actions/workflows/ci.yml/badge.svg)](https://github.com/dr-robert-li/slice-tournament-zoo/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](./package.json)

> An agentic-coding harness for "software-engineering dark factories with
> auditable outputs." Each slice is one interface contract plus its
> implementation plus its tests, implemented adversarially by N **specimens**.
> Survivors are selected by an eval-gate and a pairwise LLM judge against a
> **frozen, sealed** test suite the implementers never see. Every run leaves a
> markdown audit trail a human can replay.

## Contents

- [Requirements](#requirements)
- [Install](#install)
- [Use](#use)
- [Example commands and workflows](#example-commands-and-workflows)
- [Uninstall](#uninstall)
- [The pipeline](#the-pipeline-two-levels)
- [The audit tree](#the-stz-audit-tree)
- [License](#license)

## Requirements

- Node.js 20 or newer.
- For the in-session harness: Claude Code (the CLI, desktop, or web app).
- No database, no vector service, no API keys beyond what Claude Code already
  uses for its subagents.

## Install

STZ installs two ways: as a global CLI via **npm**, or as a **Claude Code
plugin**. They are complementary — the plugin drives the in-session `/stz:*`
commands, and the npm CLI gives you `stz init`, `stz run`, and direct
`stz bridge` access. Installing the npm CLI also satisfies the plugin's bridge
dependency without any `${CLAUDE_PLUGIN_ROOT}` fallback.

### Via npm (global CLI)

```bash
npm i -g slice-tournament-zoo               # from npm
# or install straight from GitHub (no npm publish needed):
npm i -g dr-robert-li/slice-tournament-zoo
```

This puts `stz` on your `PATH` (`stz`, `stz init`, `stz run`, `stz bridge …`)
and bundles its `tsx` runtime, so it works offline after install. Requires
Node.js 20+. Run `stz` with no arguments to see the banner and commands.

### As a Claude Code plugin (the real harness)

From inside Claude Code, add the marketplace and install the plugin:

```text
/plugin marketplace add dr-robert-li/slice-tournament-zoo
/plugin install stz
```

This registers the project commands (`/stz:new`, `/stz:research`, `/stz:validate`,
`/stz:standards`, `/stz:tests`, `/stz:slice`, `/stz:summary`, `/stz:pipeline`) and
`/stz:run`, the subagents (the per-slice specimen, judge, test-author, documenter
plus the project-level researcher, validator, conventions, test-planner, slicer,
summarizer), and a SessionStart hook that announces STZ when a project contains a
`.stz/` tree. Restart the session (or reload) so the definitions load.

The plugin calls a bundled `stz bridge` CLI for every deterministic decision. If
you installed the npm CLI above, the commands use that `stz` directly. Otherwise
they resolve the bundled copy via `${CLAUDE_PLUGIN_ROOT}`, with no `PATH` setup
needed (Node.js 20+ is the only requirement; the bundled copy fetches `tsx` via
`npx` on first use, so that first call needs network).

### As a library / local CLI only

If you only want the deterministic engine and the mock pipeline:

```bash
git clone https://github.com/dr-robert-li/slice-tournament-zoo
cd slice-tournament-zoo
npm install
npm test            # 84 deterministic tests
npm run typecheck
```

## Use

### Scaffold a project

```bash
stz init .          # create the .stz/ taxonomy + AGENTS.md in the current repo
```

This writes the tiered `.stz/` tree (`00-intent` through `90-audit`) and an
`AGENTS.md` table of contents. Nothing else is required to start.

### The full pipeline (in Claude Code)

`/stz:run` handles one slice. The full pipeline takes a project from an idea to a
completion report, one command per phase (a get-shit-done-style UX):

```text
/stz:new        elicit intent + machine-checkable done-predicates (interactive Q&A)
/stz:research   external (docs, prior art) + internal (codebase) research
/stz:validate   ground-truth: verify each claim against reality, not recall
/stz:standards  style, architecture, naming conventions
/stz:tests      test strategy + coverage targets, locked BEFORE implementation
/stz:slice      collaborative breakdown into a DAG of vertical slices
/stz:run <id>   the adversarial tournament, once per slice
/stz:summary    aggregate every document into one completion report
```

`/stz:pipeline` is a dashboard: it shows project-phase and per-slice status, then
dispatches the recommended next step (and can run independent slices in
parallel).

`--auto` means different things by scope, so keep the mental model straight:

- `/stz:run slice-01` runs that one slice's tournament and nothing else.
- `/stz:run slice-01 --auto` runs that one slice with no approval pause (it skips
  the human winner-approval gate). It does **not** cascade to other slices.
- The project phase commands (`/stz:new --auto`, `/stz:research --auto`, …) each
  chain to the next phase.
- `/stz:pipeline --auto` runs everything: it walks the DAG in dependency order,
  fires `/stz:run` for each runnable slice (independent slices in the frontier in
  parallel), and continues through to `/stz:summary`. This is the entry point for
  "do the whole project automatically."

Two human gates remain even in full auto: confirming a done-predicate in
`/stz:new`, and approving the slice breakdown in `/stz:slice`.

The DAG ordering and per-slice seeding are backed by the deterministic
`stz bridge project-status` (which computes the runnable frontier). The `--auto`
chaining itself is orchestration the agent follows from the command markdown, not
a hard-coded loop.

Each project-level phase writes its own `.stz/` tier and is settled once, before
any slice runs. When `/stz:slice` seeds the DAG, each slice inherits those early
phases as done, leaving only the tournament half for `/stz:run`. Project status
is derived from each slice's own `state.json`, so an interrupted pipeline resumes
by re-reading state. A worked run of the front phases (a `slugify` library) lives
in [`examples/full-pipeline/`](./examples/full-pipeline).

### Run a slice as a tournament (in Claude Code)

```text
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

### Mock run (testing only, no network)

A self-contained mock drives the whole pipeline with no API keys, network, or
subagents — handy as a fast smoke test of the deterministic spine. It is a
testing aid, not the production path. See [`src/mock/`](./src/mock).

```bash
stz run <dir>       # drive the demo slice end to end against the mock model
```

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

### A whole project (the full pipeline)

Run the project-level phases once, let `/stz:slice` break the work into a DAG and
seed the slices, then let `/stz:pipeline` drive each slice's tournament in
dependency order:

```text
/stz:new          # elicit intent + done-predicates
/stz:research     # external + internal research
/stz:validate     # ground-truth the research
/stz:standards    # conventions
/stz:tests        # test strategy, before any code
/stz:slice        # co-design the slice DAG; seeds 40-slices/<id> manifests
/stz:pipeline     # dashboard: dispatches /stz:run for each slice in dep order
/stz:summary      # completion report once the slices are done
```

You do not hand-author slice manifests or run `/stz:run` by hand here. `/stz:slice`
creates the manifests and `/stz:pipeline` sequences the tournaments. To run the
whole thing automatically, `/stz:pipeline --auto` walks the DAG and dispatches
each slice through to the summary. (Note: `/stz:run --auto` is single-slice only;
it just skips that slice's winner-approval pause and does not cascade.)

### A single slice, standalone (no project)

For a one-off slice without the project pipeline, `/stz:run <name>` elicits its
own contract and one done-predicate if no manifest exists, runs the tournament,
then you read the result:

```text
/stz:run payment-validator
```

```bash
cat .stz/40-slices/payment-validator/spec-diff.md      # intent vs as-built
cat .stz/50-pressure/payment-validator/pressure.md     # why the losers lost
cat .stz/90-audit/journal.md                           # the replayable event log
```

### Inspect a worked example without running anything

```bash
# a real tournament (one slice)
cat examples/clamp-tournament/stz-tree/40-slices/slice-01/tournament.md
# a real project front-pipeline (slugify)
cat examples/full-pipeline/stz-tree/90-audit/SUMMARY.md
```

`clamp-tournament`: four specimens implement `clamp`; a planted network-bypass
cheater passes all 304 sealed checks but is disqualified at the gate; the winner
is chosen by six judge votes and the highest GRPO advantage. `full-pipeline`: the
project phases run for a `slugify` library through to a seeded slice DAG.

### CI-style local check (no Claude Code)

```bash
npm test && npm run typecheck && stz run /tmp/stz-smoke
```

## Uninstall

### Remove the plugin

```text
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

## The pipeline (two levels)

The pipeline runs at two levels. The **project level** settles intent, research,
conventions, and test strategy once for the whole project. **Slice
disaggregation** then breaks the work into a DAG and seeds each slice, marking
those early phases done so they are not repeated. Each slice then runs only the
**tournament half**.

```text
PROJECT (once):
  elicit (/stz:new) -> research (/stz:research) -> ground-truth (/stz:validate)
    -> standards (/stz:standards) -> test strategy (/stz:tests)
    -> slice disaggregation (/stz:slice)  [seeds each slice; early phases done]

PER SLICE (/stz:run <id>, sequenced by /stz:pipeline over the DAG):
  test-author (frozen, sealed held-out suite)
    -> spawn N specimens in parallel
    -> eval-gate (sealed suite + coverage + mutation + hack-pattern detect)
    -> judge (pairwise votes, GRPO group-relative advantage)
    -> winner -> as-built spec -> spec-diff -> state.json checkpoint

FINISH:
  /stz:summary  -> completion report across every slice

failure (bounded): no passers -> 1 GRPO retry -> 1 replan -> halt + report
```

Note: the standalone mock demo (`stz run`, no Claude Code) runs all eight phases
inside a single slice for a self-contained, no-network smoke test. The two-level
split above is the real in-session flow.

## The `.stz/` audit tree

| Tier | Purpose |
| ---- | ------- |
| `00-intent/` | project + intent manifests, elicitation, done-predicates |
| `10-research/` | external/internal research, ground-truth validation |
| `20-standards/` | versioned conventions, ADRs |
| `30-tests/` | test strategy, rubric, sealed held-out suite |
| `40-slices/` | the slice DAG, manifests, specimen prototypes, tournament, spec-diff |
| `50-pressure/` | culled specimens' diffs and critiques (the pressure log) |
| `90-audit/` | project state, journal, call ledger, cost, completion report, SUMMARY |

## Module map (`src/`)

Production spine: `types.ts` (schema), `taxonomy.ts` (tree and frontmatter),
`state.ts` (checkpoint and recovery), `grpo.ts`, `selection.ts`,
`hack-detector.ts`, `escalation.ts`, `budget.ts`, `cost-tracker.ts`,
`pressure.ts`, `specdiff.ts`, `eval-runner.ts` (real tests, coverage, mutation),
`project.ts` (the project DAG driver), and `bridge.ts` (the in-session CLI,
per-slice and project subcommands).

The `mock/` subfolder is the no-network testing harness (the `stz run` demo):
its orchestrator, the model-layer seam, and the deterministic mock. Not part of
the production path — see [`src/mock/`](./src/mock).

The requirement-to-test mapping is in [`docs/TESTPLAN.md`](./docs/TESTPLAN.md).
What is real versus deferred is in [`docs/AS-BUILT.md`](./docs/AS-BUILT.md).

## License

[Apache-2.0](./LICENSE).
