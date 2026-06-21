# Changelog

All notable changes to slice-tournament-zoo (STZ) are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.4]

### Changed
- **Made the sealed-suite contract explicit (guides vs sensors), not just
  implicit in the code.** The harness now states plainly, in the command, the
  agent, and a dedicated doc, that responsibilities are bifurcated:
  - **Prompt hardening is the GUIDE** that owns semantic robustness (the
    fragile-invariant class) — and it is the *only* control for it, because the
    smoke gate's reference is authored by the same agent and shares its blind
    spot.
  - **The smoke gate is a SENSOR** that owns mechanical validity only. A green
    gate means exactly "compiles and is satisfiable against the sealed
    reference" — explicitly **not** "semantically robust". `/stz:run` now names
    the compile-only primitive (`cargo test --no-run`, `tsc --noEmit`) and runs
    the reference strictly in a throwaway scratch dir, never a specimen-visible
    path.
- **Error handling now classifies failures by which control should have caught
  them.** A compile/unsatisfiable failure is a *gate (sensor) failure* → loop the
  exact stderr back to `stz-test-author`. A fragile invariant found later (the
  sealed suite failing identically across all correct specimens at eval) is an
  *authoring (guide) failure, not a gate miss* → fix via an audited `seal-amend`
  and strengthen the author guidance, rather than treating it as a gate bug.

### Added
- `docs/development/sealed-suite.md` — the integrity contract: the guide/sensor
  split, the four phases (author → gate → seal → amend), where the full-solution
  reference lives, and the failure-classification rules. Linked from the README
  and the bridge-CLI doc.

## [0.3.3]

Hardening of sealed-suite creation (L1/F10), prompted by a run where the
test-author emitted a held-out suite that did not compile and encoded a
fragile invariant (alien identity keyed on mutable `(row,col)`, which broke
under legitimate formation movement) — and the only recovery was editing the
*frozen* suite mid-tournament, undermining the anti-hacking seal. Note: this
adds a three-command bridge surface, so it is more than a pure bugfix.

### Added
- **Immutable sealed manifest + audited amend flow** (`src/seal.ts`, three new
  bridge commands). `seal` sha256-hashes every held-out file (suite + reference)
  into a byte-stable, timestamp-free `30-tests/held-out/SEAL.json` (the file
  excludes itself). `seal-verify` re-hashes and exits non-zero on any drift —
  `/stz:run` runs it immediately before the eval/gate, so a frozen-suite edit
  can't slip in mid-tournament. `seal-amend --reason` is the only sanctioned way
  to change a sealed file: it records per-file from→to hashes + the reason into
  the manifest's amendment log and re-freezes; a silent edit then fails verify.
- **Pre-freeze smoke gate.** `stz-test-author` now also writes a minimal correct
  **reference implementation** (sealed, never specimen-visible — it is a full
  solution). `/stz:run` compiles the suite and runs it against the reference in a
  scratch dir; it must be green before `seal`. Catches non-compiling and
  unsatisfiable suites before specimens run. (It does not catch a fragile
  invariant the reference shares — that is the prompt hardening's job.)

### Changed
- **`stz-test-author` prompt hardened** with anti-fragile-test rules: the suite
  must compile; never key entity identity on mutable state (position/index of a
  thing that moves); assert movement-invariant aggregates (counts, totals) over
  per-element position snapshots.

## [0.3.2]

### Fixed
- **Completed slices now read `done`, so the pipeline advances and resumes
  correctly.** Two bugs left a finished slice stuck as `running` forever, which
  made `/stz:pipeline` never move past it — and re-derive it as unfinished (and
  re-run the tournament) after any session restart:
  - `begin` called `freshState`, **clobbering** the four early phases that
    `project-seed-slices` had marked done at the project level — so a pipeline
    slice could never become `isComplete`. `begin` now loads and preserves an
    existing per-slice state, only seeding fresh for a standalone `/stz:run`.
  - `finalize` marked only `judgment` done, leaving `test-authoring` and
    `tournament` pending. It now marks the whole tournament half done
    (idempotent, with journaled `phase-done` events), so the slice is complete.
  Together these remove the per-slice manual `state.json` reconciliation the
  orchestrator had to do every slice. (Note: a *session restart* — the "Welcome
  back" banner from context exhaustion or a crash — is a Claude Code behaviour
  STZ cannot prevent; this fix makes such a restart resume cleanly instead of
  redoing finished work.)

## [0.3.1]

### Fixed
- **Spec-diff faithfulness was meaningless on real runs.** The intent-vs-as-built
  diff (F13) matched claims by exact normalized string, but the planner and the
  documenter are different agents that word the same behaviour differently — so
  every real run reported `kept=0, missing=all, faithful=false`. Claims now carry
  a stable `id`: the planner emits `{id, text}`, and the documenter **adjudicates
  each intent claim by id** (`{id, satisfied, evidence}`, plus `x*` extras for
  behaviour beyond the plan). `diffSpecs` matches on id (falling back to
  normalized text for legacy/bare-string claims, so old artifacts and the mock
  still work). `faithful` now reflects real coverage, not wording.
- **Mis-keyed verdicts no longer miscount silently.** A documenter that fumbles
  an id would turn a constant failure into an intermittent one (a false `missing`
  plus a false `added`). `finalize` now validates the verdicts and surfaces
  `unmatchedIntentIds` / `mismatchedAsBuiltIds` (plus a stderr warning); `/stz:run`
  re-spawns the documenter with the exact id list rather than trusting the diff.
  Malformed claim objects are parsed defensively and cannot crash `finalize`.

### Added
- Documentation reorganized for operators: `docs/development/` (local-and-testing,
  bridge-cli), `src/README.md` (module map), and a `CONTRIBUTING.md`. The README
  keeps a slim Documentation pointer section.

## [0.3.0]

### Added
- **Batched elicitation.** `/stz:new` now asks grouped questions per area
  (multi-question AskUserQuestion calls, up to 4 per call) instead of one at a
  time, cutting round-trips. Area D (done-conditions) stays sequential — the
  predicate kind, then the exact expression — because that drill-down depends on
  the previous answer.
- **Run-configuration choices during elicitation.** A new area E in `/stz:new`
  captures, up front:
  - **Slicing granularity** (`coarse` / `balanced` / `fine`) — how finely
    `/stz:slice` breaks the work into slices.
  - **Specimen fan-out** (N, clamped to 2–16, the published RTV+PDR cloud
    optimum) — the number of specimens each slice's tournament runs.
  - **Model combination per role** — planning, research, execution, testing,
    validation, judging. Offered as suggested combos (Balanced / Thrifty / Max
    quality) each with a one-line rationale, plus free-form "Other" — any spawn
    alias (`opus`/`sonnet`/`haiku`/`fable`) or model id, the get-shit-done
    pattern. Model values are never validated, so a custom id always passes.
  - **Strictness** (`relaxed` / `standard` / `strict`) — the bar for conventions
    and testing, expanded to a coverage target, mutation policy, and convention
    strictness.
- **Persisted run config, consumed downstream.** The choices are stored as
  `.stz/00-intent/run-config.json` (plus a readable `run-config.md`) via the new
  `stz bridge project-set-config` command, validated and clamped by
  `normalizeRunConfig`. `project-status` now carries the resolved `runConfig`
  (defaults when unset) so every downstream command reads it in one call:
  granularity → `/stz:slice`, fan-out → `/stz:run`'s N, the model map → each
  per-role subagent's `model` override, and strictness → `/stz:standards` and
  `/stz:tests`. A read-only `stz bridge project-config` is also exposed.

### Changed
- Moved `JOURNAL.md` to `docs/JOURNAL.md` and ran a light humanizing pass over it.
- `package.json`, plugin, and marketplace versions are at 0.3.0 (the bump opened
  this cycle; plugin/marketplace manifests are unchanged — no new commands were
  registered).

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
