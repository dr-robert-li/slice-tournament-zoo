<div align="center">

# Slice Tournament Zoo (STZ)

<pre>
  ██████╗  ████████╗ ███████╗
 ██╔════╝  ╚══██╔══╝ ╚══███╔╝
 ╚█████╗      ██║      ███╔╝ 
  ╚═══██╗     ██║     ███╔╝  
 ██████╔╝     ██║    ███████╗
 ╚═════╝      ╚═╝    ╚══════╝
</pre>

[![CI](https://github.com/dr-robert-li/slice-tournament-zoo/actions/workflows/ci.yml/badge.svg)](https://github.com/dr-robert-li/slice-tournament-zoo/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/package.json)

</div>

> An agentic-coding harness for "software-engineering dark factories with
> auditable outputs." Each slice is one interface contract plus its
> implementation plus its tests, implemented adversarially by N **specimens**.
> Survivors are selected by an eval-gate and a pairwise LLM judge against a
> **frozen, sealed** test suite the implementers never see. Every run leaves a
> markdown audit trail a human can replay.

## Contents

- [Requirements](#requirements)
- [Install](#install)
- [Updating](#updating)
- [Use](#use)
- [Example commands and workflows](#example-commands-and-workflows)
- [Uninstall](#uninstall)
- [The pipeline](#the-pipeline-two-levels)
- [The audit tree](#the-stz-audit-tree)
- [Documentation](#documentation)
- [License](#license)

## Requirements

- Node.js 20 or newer.
- For the in-session harness: Claude Code (the CLI, desktop, or web app).
- No database, no vector service, no API keys beyond what Claude Code already
  uses for its subagents.

> **Token cost.** A tournament is deliberately redundant: every slice runs *N*
> specimens in parallel, a judge casts multiple votes per pair, and a multi-slice
> GRPO project repeats that across the DAG. That buys selection pressure and an
> auditable trail — but it is **token-intensive**, far more than a single-agent
> run. Budget accordingly (tune `n`, `votesPerPair`, and `traceTier` down for
> cheaper runs), and consider installing token-efficiency companion plugins
> alongside STZ: **Caveman** (compressed responses), **RTK** (token-optimized CLI
> proxy), **Headroom**, and **CodeSight**. They reduce the per-call overhead the
> tournament multiplies.

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

### As a Claude Code plugin

From inside Claude Code, add the marketplace and install the plugin:

```text
/plugin marketplace add dr-robert-li/slice-tournament-zoo
/plugin install stz
```

This registers the project commands (`/stz:new`, `/stz:research`, `/stz:validate`,
`/stz:standards`, `/stz:tests`, `/stz:slice`, `/stz:summary`, `/stz:pipeline`,
`/stz:merge`) and `/stz:run`, the subagents (the per-slice specimen, judge,
test-author, cross-reference, documenter plus the project-level researcher,
validator, conventions, test-planner, slicer, summarizer), and a SessionStart hook
that announces STZ when a project contains a `.stz/` tree. Restart the session (or
reload) so the definitions load.

The plugin calls a bundled `stz bridge` CLI for every deterministic decision. If
you installed the npm CLI above, the commands use that `stz` directly. Otherwise
they resolve the bundled copy via `${CLAUDE_PLUGIN_ROOT}`, with no `PATH` setup
needed (Node.js 20+ is the only requirement; the bundled copy fetches `tsx` via
`npx` on first use, so that first call needs network).

> Developing STZ itself, or running the engine without Claude Code? See
> [`docs/development/local-and-testing.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/local-and-testing.md).

## Updating

STZ ships through two channels that update independently — the **npm CLI** and
the **Claude Code plugin**. Keep them on the same version so the `/stz:*`
commands and the `stz` you call by hand agree.

```bash
stz --version          # what you have
stz update             # check npm for a newer release + plugin/CLI drift
stz update --check     # same, as JSON (CI-friendly; exits non-zero if action needed)
```

`stz update` does not self-install (it never runs `npm`/`/plugin` behind your
back); it checks the npm registry, compares against your installed version, and
prints the exact commands to run. When a plugin manifest is reachable — i.e.
`CLAUDE_PLUGIN_ROOT` is set (as in a Claude Code session) or you run from a repo
checkout — it also reports **drift** between the CLI and the plugin's bundled
engine:

```bash
npm i -g slice-tournament-zoo@latest      # update the CLI
/plugin update stz                        # update the plugin (inside Claude Code)
```

After updating the engine, bring an **existing project's `.stz/` tree** up to the
current taxonomy schema. Engine updates never touch a scaffolded project on their
own, so a tree created by an older STZ can fall behind:

```bash
stz migrate            # additive + backed-up; no-op if already current
```

`migrate` is safe by construction: it only *creates* missing tiers (never
deletes or renames), and copies the prior tree to a `.stz.bak-schema<N>/` sibling
before any change. Each `.stz/` carries a `manifest.json` stamped with the STZ
version and schema version so drift is detectable. Pass `--no-backup` to skip the
copy.

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
/stz:new        elicit intent + done-predicates + run config (batched Q&A)
/stz:research   external (docs, prior art) + internal (codebase) research
/stz:validate   ground-truth: verify each claim against reality, not recall
/stz:standards  style, architecture, naming conventions
/stz:tests      test strategy + coverage targets, locked BEFORE implementation
/stz:slice      collaborative breakdown into a DAG of vertical slices
/stz:run <id>   the adversarial tournament, once per slice
/stz:summary    aggregate every document into one completion report
```

`/stz:pipeline` is a dashboard: it shows project-phase and per-slice status (plus
the run config), then dispatches the recommended next step (and can run
independent slices in parallel).

#### Run configuration (set once, applied everywhere)

`/stz:new` batches its questions per area and, at the end, captures a **run
config** the rest of the pipeline obeys — stored in `.stz/00-intent/run-config.json`
and surfaced by `stz bridge project-status` so every later command reads it in one
call:

| Choice | Set in `/stz:new` | Consumed by |
|---|---|---|
| **Slicing granularity** (`coarse`/`balanced`/`fine`) | area E | `/stz:slice` |
| **Specimen fan-out** (N, 2–16) | area E | `/stz:run` (the number of specimens) |
| **Model per role** (planning, research, execution, testing, validation, judging) | area E | each phase's subagent `model` |
| **Strictness** (coverage target, mutation policy, conventions) | area E | `/stz:standards`, `/stz:tests` |

Model choices follow the get-shit-done "Other" pattern: pick a suggested combo
(Balanced / Thrifty / Max quality) or type your own spawn alias
(`opus`/`sonnet`/`haiku`/`fable`) or model id. Anything unset falls back to a
balanced default, so the pipeline always has a complete config.

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

#### Dark-factory mode (lights-out, fully autonomous)

`--auto` still pauses at those two human gates. **Dark-factory mode** goes one
step further: it skips *every* downstream human gate — the `/stz:slice` approval
and the `/stz:run` winner-approval — and runs the whole pipeline lights-out to a
final `/stz:summary` completion report. The only gate it cannot skip is the F2
done-predicate confirmation in `/stz:new`; acceptance criteria are never
auto-invented. Everything the run decides (DAG, winners, GRPO advantages, hack
findings) still lands in the `.stz/` audit tree for after-the-fact review.

It is offered once at the end of elicitation (after the predicate gate) and can be
flipped at any point:

```bash
stz bridge project-dark-factory --root . --on    # engage; --off to disengage
```

The toggle only flips the `darkFactory` flag in the run config — it never resets
your fan-out / models / strictness. `project-status` hoists the flag to the top
level, so engaging it between phases takes effect immediately. See
[`docs/development/dark-factory.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/dark-factory.md) for the full
contract.

The DAG ordering and per-slice seeding are backed by the deterministic
`stz bridge project-status` (which computes the runnable frontier). The `--auto`
chaining itself is orchestration the agent follows from the command markdown, not
a hard-coded loop.

Each project-level phase writes its own `.stz/` tier and is settled once, before
any slice runs. When `/stz:slice` seeds the DAG, each slice inherits those early
phases as done, leaving only the tournament half for `/stz:run`. Project status
is derived from each slice's own `state.json`, so an interrupted pipeline resumes
by re-reading state. A worked run of the front phases (a `slugify` library) lives
in [`examples/full-pipeline/`](https://github.com/dr-robert-li/slice-tournament-zoo/tree/main/examples/full-pipeline).

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

### Evolve the harness itself (0.9.0, opt-in)

STZ can improve **its own harness**, not just the code it produces. The per-slice
tournament stays exactly as above; a separate, default-off meta-loop evolves the
harness *genome* (test-author heuristics, specimen strategies, judge rubric,
selection weights, fan-out, the suite battery) against **held-out, recall-free**
pilot fitness — a DGM/HarnessX-style archive selected by GRPO advantage with a
six-gate promotion guard (0.9.5 adds calibrated-verifier gating: a selection
judge must pass a blind target-task accuracy battery before it may steer a
promotion, fail-closed).

```text
/stz:inject slice-01     # adversarially harden the sealed suite (find blind spots)
/stz:evolve              # run the bounded harness-evolution meta-loop (needs harness.enabled)
```

The flagship is **automated suite sharpening**: a blind-spot bug-class the judge
finds past a green suite (e.g. the `5abc` malformed-token trap) is mined *once*
into the test-author's repertoire + the mutation battery, so every future suite is
born sharper at ~0 marginal cost — instead of re-deriving it per slice. This is
the empirically-grounded relocation of the shelved 0.8.0 per-slice convergence
loop (ruled out budget-matched and recall-free; see `docs/ROADMAP.md` and
`experiments/swebench-pilot/PILOT-RESULTS-{BLIND,JUDGE}.md`). Bridge primitives:
`inject`, `harness-mine`, `harness-promote-mutator`, `harness-spawn`,
`harness-fitness`, `harness-select`, `harness-promote`, `harness-status`,
`judge-stress`, `judge-calibration`. A 0.9.5 authoring gene
(`waf-playbook-autogen-v0`) lets the test author bake AWS Well-Architected
playbook edge-cases for contracted behaviour (one-time, never a reward). Every
kill-switch halts and surfaces; nothing auto-rewrites its own guard.

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

## Contract Plane (0.9.6, optional, default-off)

0.9.6 adds a **Contract Plane** — a typed, human-gated correctness object the
arena competes against, so tests stop being the *only* definition of winner. A
`requirement` decomposes into machine-checkable `predicate`s (cheap kinds only:
diff-constraint, output-assertion, JSON/file invariant — no runtime
instrumentation). Agents **propose** predicates; a human **alone accepts** them
(the 7th gate) — the one exogenous signal that makes the self-improvement bounded.

When enabled (`RunConfig.contract.enabled`, off by default), a specimen that
hard-fails a high-severity accepted predicate is eliminated in `select()` — even
if it passes the sealed suite and STZ's multi-objective reward. Flag off ⇒ the
tournament is **byte-identical to 0.9.5** (proven by an integration test).

```bash
stz bridge separation-gate --root . --contract preds.json --impl naive.mjs --suite suite.mjs   # Phase-1 go/no-go
stz bridge contract-accept  --artifact req.json --approver "your-name" --at 2026-07-02          # human 7th gate
```

Commands: `/stz:contract` (draft → verify → separation-gate → accept),
`/stz:eval` (Phase-0 baseline). The capability was built **earned-first**: every
piece was validated on a substrate before being wired in — see
[`experiments/0.9.6-progression/`](experiments/0.9.6-progression/) for the
phase-by-phase build/eval/results (honest yes/no per phase, including deferred
and mechanism-only verdicts).

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

## Documentation

For contributors and anyone going past day-to-day operation:

- **Contributing** — setup, the architecture rule, the quality bar:
  [`CONTRIBUTING.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/CONTRIBUTING.md).
- **Source layout** — the `src/` module map: [`src/README.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/src/README.md).
- **Local development & testing** — run the engine without Claude Code, the mock
  pipeline, CI checks: [`docs/development/local-and-testing.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/local-and-testing.md).
- **The bridge CLI** — the deterministic `stz bridge` subcommands:
  [`docs/development/bridge-cli.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/bridge-cli.md).
- **Sealed-suite integrity** — the guide-vs-sensor contract behind the frozen
  held-out suite: [`docs/development/sealed-suite.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/sealed-suite.md).
- **Requirement-to-test mapping** — [`docs/TESTPLAN.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/TESTPLAN.md).
- **Roadmap — what is built, deferred, and planned next** —
  [`docs/ROADMAP.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/ROADMAP.md).

## License

[Apache-2.0](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/LICENSE).

## Research

The full account of what STZ is, the experiments under `experiments/`, the outcomes, and
the open questions is in **[docs/PAPER.md](docs/PAPER.md)** ("When does a self-improving
coding harness actually improve competency? A negative result, earned"). The first-person
build log is in [docs/JOURNAL.md](docs/JOURNAL.md).
