# Changelog

All notable changes to slice-tournament-zoo (STZ) are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned (0.3.0)

Version bumped to 0.3.0 to open this feature cycle. Scope, not yet implemented:

- **Batched elicitation.** `/stz:new` asks grouped questions per area (multi-
  question AskUserQuestion calls) instead of one at a time, cutting round-trips.
- **Run-configuration choices during elicitation.** Let the user set, up front:
  - **Slicing granularity** — how finely `/stz:slice` breaks the work into slices.
  - **Specimen fan-out** — the number of specimens N each slice's tournament runs.
  - **Model combination per role** — which model handles planning, research,
    execution, testing, validation, judging. Offer a few suggested combinations
    with a one-line rationale each (for example a cheap model for research and a
    stronger one for judging), and let the user type their own combination, the
    same way answer options already accept free-form "Other" input (the
    get-shit-done pattern).
  - **Strictness** — the bar for conventions and testing (coverage target,
    mutation policy, lint/convention strictness).
- **Persisted run config consumed downstream.** Store the choices as project
  config and apply them: granularity to the slicer, fan-out to `/stz:run`'s N,
  the model map to the per-role subagents, and strictness to `/stz:standards` and
  `/stz:tests`.

## [0.2.2]

### Added
- ASCII-art logo in the README header, the `stz` CLI banner (`stz help` / no-arg),
  and the SessionStart hook.
- npm install path: `npm i -g slice-tournament-zoo` (or
  `npm i -g dr-robert-li/slice-tournament-zoo` straight from GitHub), mirroring
  the get-shit-done install UX. `tsx` moved to runtime dependencies so the global
  CLI works offline after install.
- README documentation guide (install, use, uninstall, examples); `LICENSE`
  (Apache-2.0); this `CHANGELOG.md`; and a `docs/` folder (`AS-BUILT.md`,
  `TESTPLAN.md`, design pattern kept locally as `docs/CLAUDE.md`).

### Changed
- Production-ready layout: isolated the no-network mock demo into `src/mock/`
  (the orchestrator, the model-layer seam, and the deterministic mock), with its
  own README; removed `src/llm/`. The production spine (`bridge.ts`, `project.ts`,
  commands, agents) does not depend on it. Trimmed the README's mock sections to
  a pointer and split the module map into production spine versus mock harness.
- `docs/AS-BUILT.md` rewritten as a self-contained note (original intent, what
  was built, resultant features, gaps, and the intent-vs-as-built diff); dropped
  references to the design doc and its requirement codes.
- README: corrected the `--auto` semantics. `/stz:run --auto` is single-slice and
  skips only that slice's winner-approval pause; it does not cascade.
  `/stz:pipeline --auto` walks the DAG in dependency order and runs every slice
  through to the summary.
- `package.json`, plugin, and marketplace versions bumped to 0.2.2.

## [0.2.1]

### Fixed
- Plugin install failed with `agents: Invalid input`. The manifest declared
  `commands`, `agents`, and `hooks` as path strings; Claude Code auto-discovers
  `commands/`, `agents/`, and `hooks/hooks.json` and rejects those string
  fields. Removed them and corrected the `homepage` URL.
- Commands assumed a global `stz` on `PATH`, which a plugin install never
  creates (it is not an npm install, ignores `package.json` `bin`, and adds no
  symlink). Each command now resolves the bundled bridge first via a linked
  `stz`, then `${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs`, then a plugin-cache glob, and
  calls it through `$STZ`. `npm link` is now optional, for manual CLI use only.

### Changed
- Moved `AS-BUILT.md` and `TESTPLAN.md` under `docs/`; README links updated.
- README: corrected the pipeline description to the real two-level flow
  (project-level phases once, then the per-slice tournament half). Removed the
  contradictory "per slice re-elicits/researches" diagram and the superseded
  manual multi-slice `/stz:run` workflow; refreshed the subagent list, audit-tree
  tier table, and module map.

## [0.2.0]

The full interactive multi-phase pipeline (a get-shit-done-style UX) feeding the
existing per-slice tournament.

### Added
- **Project-level driver** (`src/project.ts`): a project manifest + state, a
  DAG of slices with topological ordering, per-slice status derived from each
  slice's own `state.json` (no drift), and the next-runnable computation.
- **Bridge subcommands** (`stz bridge`): `project-init`, `project-phase`,
  `project-write-intent`, `project-record-area`, `slice-add`,
  `project-seed-slices`, `project-status`, `summary`.
- **Eight commands**: `/stz:new` (interactive elicitation), `/stz:research`,
  `/stz:validate` (standalone ground-truth validation), `/stz:standards`,
  `/stz:tests`, `/stz:slice` (collaborative DAG co-design), `/stz:summary`, and
  the `/stz:pipeline` dashboard. Each accepts `--auto` for chaining.
- **Six subagents**: `stz-researcher`, `stz-validator`, `stz-conventions`,
  `stz-test-planner`, `stz-slicer`, `stz-summarizer` (H2 completion markers).
- The project-tier to per-slice handoff: `project-seed-slices` writes each slice
  manifest and seeds its `state.json` with the four early phases already done.
- A worked live run of the front phases in `examples/full-pipeline/`.

### Changed
- Plugin and marketplace bumped to `0.2.0`.

## [0.1.0]

The slice-00 kernel plus the in-session Claude Code harness.

### Added
- **Deterministic spine** (fully tested): the `.stz/` markdown taxonomy with
  frontmatter progressive disclosure; `state.json` checkpoint and crash
  recovery; GRPO group-relative advantage; two-stage eval-gate plus pairwise
  win-count selection; the layered hack-pattern detector; the bounded
  escalation FSM (1 retry then 1 replan then halt); the complexity-to-budget
  allocator with an enforced token cap; the cost and call ledger; the pressure
  log with PDR top-K refinement; the intent vs as-built spec-diff; and the
  orchestrator that sequences all eight phases.
- **In-session harness**: the `stz bridge` deterministic CLI
  (begin, eval, gate, record-votes, select, finalize); the `/stz:run` command;
  the frozen subagent definitions (specimen, judge, test-author, documenter)
  with inoculation framing; parallel specimen fan-out via the Agent tool.
- **Real eval runner**: executed sealed test pass rate, V8 coverage, and
  source-mutation survival, with no test-library dependency.
- **Packaging and activation**: the Claude Code plugin manifest, the
  marketplace entry, and a SessionStart hook.
- **CLI**: `stz init`, `stz run` (mock pipeline), and `stz bridge`.
- A worked example of a real tournament in `examples/clamp-tournament/`.

### Fixed
- GRPO advantage now spans the whole specimen group, including gate-eliminated
  specimens, so losers' diffs can be weighted.
- The per-slice token cap is enforced at the metering point, not only tracked.
- Mutation testing strips comments before mutating, so a mutator can no longer
  produce a behaviour-identical survivor and report a false zero-kill rate.
- The eval runner resolves implementation paths to absolute, removing the
  relative-path import failure seen in the first live run.
