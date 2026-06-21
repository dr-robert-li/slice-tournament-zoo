# Changelog

All notable changes to slice-tournament-zoo (STZ) are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.5.2]

Cross-slice merge integrity — a deterministic, audited rule for the one place
merging legitimately fails an earlier slice's sealed suite: when a later slice
**supersedes** an invariant that was correct in isolation. The canonical case
from the dogfood run is slice-03's "aliens never respawn" against slice-05's
wave-clear. Previously the orchestrator hand-waved that distinction ("looks like
the expected interaction, moving on") — exactly the unaudited, gameable judgment
STZ exists to eliminate. Now the bridge adjudicates it.

### Added
- **`src/merge.ts` + `stz bridge merge-validate`** — adjudicates *reported*
  sealed-suite results (`{slice, passed, failure}`) against an audited compat
  manifest. A failing suite is sanctioned only when (1) a **signature-pinned**
  entry matches the exact panic substring (never the test name alone), (2) the
  **superseding invariant also passes** on the assembled crate, and (3) the entry
  is **approved**. The verdict has four buckets — `sanctioned`, `pendingApproval`,
  `invalid` (replacement unproven — blocks even if approved), `unsanctioned`
  (no match — suspect a real defect) — and exits non-zero unless every failure is
  sanctioned. It does NOT run the suites (the assembled crate may be Rust); the
  deterministic part is the rule application, the same trust split as `eval` vs
  `record-eval`.
- **`merge-compat-propose` / `-approve` / `-retire` / `-list`** — the lifecycle.
  The merge agent may *propose* (entries always land unapproved — it cannot
  self-approve); an approver *blesses* with a recorded who/why (a self-approval is
  then an auditable anomaly, not a silent one); entries are *retired* once the
  superseded suite is `seal-amend`ed wave-aware. An empty `panicSubstring` (would
  match everything) and a missing `pendingAmendment` (compat entries are
  transitional debt) are rejected at propose time. Manifest + append-only history
  live at `90-audit/merge-compat.json` (+ `.md` mirror).
- **`/stz:merge` command** — assemble winners into `_assembled/`, run each
  contributing slice's sealed suite **in an ephemeral scratch copy** (never the
  canonical crate), feed the reported results to `merge-validate`, and handle each
  verdict bucket. Documented in `docs/development/sealed-suite.md` (the cross-slice
  section) and `bridge-cli.md`.

### Changed
- `docs/development/dark-factory.md` extends the deferral policy to a blocked
  `merge-validate`: in dark-factory mode an `unsanctioned`/`invalid`/`pendingApproval`
  merge failure halts the slice (never auto-approved), the DAG continues, and it
  surfaces in `/stz:summary` — identical to the `seal-crosscheck` divergence seam.

## [0.5.1]

### Fixed
- **Resolved the dark-factory × cross-family seam.** A `seal-crosscheck`
  divergence (0.5.0) is a blocking, human-adjudication gate, while dark-factory
  mode (0.4.0) promises an unattended run — so the autonomous path could reach a
  divergence with no documented, non-contradictory exit. Defined the policy in
  one place, matching the existing "a halted slice does not stall the factory"
  rule: in dark-factory mode a divergent cross-check is recorded, the slice is
  **halted** (never sealed/judged on an unresolved blind-spot signal, and never
  auto-rewritten), the DAG continues, and the divergence surfaces in the final
  `/stz:summary` for after-the-fact review. Documented in `/stz:run` step 2,
  `/stz:pipeline`'s dark-factory loop, and `docs/development/dark-factory.md`.
  Docs-only; no code change.

## [0.5.0]

Cross-family reference — a second, independently-authored reference run against
the sealed suite to catch blind spots the single test-author reference shares
with the suite. The smoke gate's reference is written by the same agent as the
suite, so a wrong assumption baked into both (a fragile invariant, a boundary
off-by-one) goes green anyway. An independent reference, from a different family
or a human, makes that divergence observable. This is the R2 "cross-family
quorum" idea applied to the reference rather than the judge.

### Added
- **`crossReference()` in the eval runner** — runs the sealed suite against two
  references and reports `both-pass` / `divergent` / `both-fail`. It only reports;
  it deliberately does not verdict, because a B-fails/A-passes split is ambiguous
  (suite over-fits A, or B is wrong) and aggregate pass counts can't tell them
  apart.
- **`stz bridge seal-crosscheck --sealed --reference-a --reference-b`** — gates
  the seal like `seal-verify` gates the tournament: exits non-zero on anything but
  both-pass so the pipeline pauses for human adjudication, and writes a durable
  audit doc at `30-tests/cross-reference.md` (outside `held-out/`, so it is not
  sealed).
- **`stz-cross-reference` agent** — independently authors the second reference
  into `.stz/30-tests/held-out/reference-b/`, seeing only the contract +
  done-predicates (never the suite or the primary reference), and deliberately
  reaching for a different implementation strategy/model. Sealed with the suite,
  never specimen-visible.

### Changed
- `/stz:run` step 2 now spawns `stz-cross-reference` and runs `seal-crosscheck`
  after the smoke gate and before sealing; a divergence is classified as a
  GUIDE-class signal for adjudication (strengthen author guidance + `seal-amend`,
  or discard a buggy cross reference), never an automatic rewrite. `seal` now
  freezes both references.
- `docs/development/sealed-suite.md` gains the cross-family reference section (the
  one control class a single author + smoke gate cannot cover); `bridge-cli.md`
  documents `seal-crosscheck`.

## [0.4.0]

Dark-factory mode — an optional, fully autonomous end-to-end run. With it
engaged, elicitation hands off and the orchestrator drives every phase →
per-slice tournament → summary with no human in the loop, surfacing only the
final completion report. This is the "software engineering dark factory" from the
project's executive summary, made a real flag.

### Added
- **`darkFactory` on the run config.** Off by default (human-in-the-loop). When
  on, the pipeline skips every *downstream* human gate it can legitimately skip —
  the `/stz:slice` "Approve as-is" gate and the `/stz:run` winner-approval gate —
  and runs autonomously to a `/stz:summary` completion report. The full ranking,
  GRPO advantages, and any disqualified specimens still land in the audit tree;
  nothing is hidden, only un-prompted.
- **`stz bridge project-dark-factory --root . --on|--off`** — the invoke-anytime
  toggle. It is a deliberate **load-modify-save** on the persisted config: it
  flips only `darkFactory` and is NOT routed through `project-set-config`, whose
  normalize-over-defaults merge would silently reset fan-out/models/strictness
  mid-run. `project-status` hoists the resolved value to a top-level `darkFactory`
  field so each command reads it once per phase; engaging it between phases takes
  effect immediately.
- **End-of-elicitation prompt.** `/stz:new` offers dark-factory once — and only
  *after* the F2 done-predicate gate, the one human checkpoint that can never be
  skipped. Acceptance criteria are never auto-invented; the predicates are the
  contract the autonomous run executes against.
- `docs/development/dark-factory.md` — the autonomous-run contract: the one gate
  that never closes, which gates are skipped, why the toggle is a dedicated
  load-modify-save command, and what is (plumbing) and isn't (the agent loop)
  unit-tested. Linked from the bridge-CLI doc.

### Changed
- `/stz:pipeline`, `/stz:run`, and `/stz:slice` now read the hoisted `darkFactory`
  flag and skip their respective human gates when it is on; `/stz:pipeline`
  documents the autonomous loop (auto-approve DAG, auto-accept winners, continue
  past halted slices, end on the summary). `run-config.md` and `project-status`
  surface the dark-factory state.

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
