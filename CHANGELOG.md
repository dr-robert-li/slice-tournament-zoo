# Changelog

All notable changes to slice-tournament-zoo (STZ) are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.9.6] — Contract Plane (bounded project-local RSI, earned-capability)

Adds a **Contract Plane**: a typed, human-gated correctness object the arena
competes against, wired into live selection **behind a default-off flag**
(`RunConfig.contract.enabled`). Flag off ⇒ the tournament is byte-identical to
0.9.5 (zero regression, proven by an integration test). Every capability was
**earned** on a substrate before wiring — see `experiments/0.9.6-progression/`.

### Added
- **Contract kernel** (`src/contract/`): typed `requirement`/`predicate`/
  `contract_delta` with a state machine (`draft→proposed→accepted→…`), a pure
  vacuity-safe predicate evaluator, traceability, and the **human 7th gate**
  (`humanAccept` rejects agent-role approvers — the α>0 exogenous signal).
- **Separation gate** (`src/contract/separation-gate.ts`): the Phase-1 go/no-go —
  a naive impl must pass the sealed suite yet fail ≥1 predicate, else the contract
  adds no signal and the line stops (guards against re-deriving STZ's earned null).
- **Contract verifier + contract-aware selection** (`src/verifiers/`): a specimen
  that hard-fails a high-severity predicate is eliminated at the gate — the
  contract as *definition of winner*, not a post-hoc oracle. Wired into
  `select()`/`evalGate` via an optional `ContractGate` (absent ⇒ 0.9.5).
- **Promotion ledger** (`src/ledger/`): append-only JSONL + a 7-gate decision
  engine (the six existing gates + `humanAccepted`) preserving the halt-on-tie
  guard and quarantining test-only "wins" (the proven test-sharpening negative).
- **Selective retrieval** (`src/knowledge/retrieval.ts`): deterministic, capped,
  explained; `repo_note` disabled by default (CTIM-Rover). No FAISS.
- **Phase-0 measurement** (`src/eval/`): chronological (never-shuffled) splits,
  reviewer-outcome capture, per-repo baseline `RepoMetrics`.
- **G7 gene**: `HarnessGenome.crystallizationHeuristicId?` — the edge→predicate
  crystallizer; a harness-altitude axis not derived from the sealed suite.
- New bridge subcommands `separation-gate`, `contract-accept`, `eval-baseline`;
  agents `stz-contract-architect`/`clarifier`/`contract-verifier`; commands
  `/stz:contract`, `/stz:eval`; `contractSliceId` on the slice manifest.

### Notes
- **Earned mechanisms, honest scope.** Phases 0/1/3/5/6 earned; 2/4/7
  mechanism-earned; 8 deferred by design. Live earns (rubric, retrieval) ran on
  the **subscription** path (in-session Agent subagents), $0 marginal API. What is
  NOT yet shown: field-scale outcomes on a real held-out issue stream. All earns
  span two hand-picked toy axes (dependency, file-scope) — not a distribution.
- 245 tests; flag-off preserves 0.9.5 exactly.

## [0.9.5]

Calibrated-verifier gating + a Well-Architected authoring gene — both **earned**
from `experiments/META-RSI-SURVEY.md` (the post-Opus-4.8 RSI survey), and a
pre-registered post-merge-grounding experiment that is **designed, not shipped**.
The survey's verdict held: there is no validated *continuous*-competency win, so
this release ships the two things that *are* earned (a degradation-safety gate and
one-time authoring) and gates the speculative third behind a probe.

### Added

- **`judge-calibration` bridge command + persisted `60-harness/judge-reliability.json`.**
  The judge's **target-task accuracy** is measured on a blind, pre-registered
  ground-truth battery (`--verdicts` vs `--labels`) and persisted as a per-slice-type
  `blindAccuracyBucket`. `judge-stress` now persists `consistency` into the same
  profile; the two **merge** (neither clobbers the other), so the promotion gate
  finally has a complete machine-readable profile to read. Motivated by
  [arXiv:2606.14629](https://arxiv.org/abs/2606.14629) (*When Good Verifiers Go
  Bad*): an exogenous verifier is necessary but **not sufficient** — above-threshold
  on one slice-type can be sub-threshold on another, and a confident-but-wrong
  verifier silently regresses the result. Calibrate **before** it steers.
- **Sixth promotion gate `rubricCalibrated` (fail-closed).** `promotionGate` now
  refuses a variant whose selection judge is not target-task calibrated
  (failure string `judge-rubric-not-calibrated`). Deliberately stricter than the
  runtime `trustGate`, which default-*trusts* a missing profile so the live
  pipeline is never blocked: `calibrationGate` default-*distrusts* (a missing
  `--slice-type` or an un-run battery reads as uncalibrated). This buys
  **bounded-safe** improvement — it stops the loop going *negative*; it does **not**
  promise continuity (above-threshold still hits diminishing returns).
- **WAF authoring heuristic `waf-playbook-autogen-v0` (gene G1).** A `heuristicId`
  branch in `agents/stz-test-author.md`: the test author may consult the AWS
  Well-Architected Agentic AI Lens playbooks to sharpen negative/edge cases for
  reliability/observability/guardrail behaviour **the contract already specifies** —
  one-time amortized authoring. **Goodhart guard (load-bearing):** WAF practices
  never add a requirement the contract is silent on, and **no LLM-judged
  WAF-conformance score is ever a fitness/reward signal** (the `weights` tuple is
  untouched; promotion stays on held-out functional fitness only). WAF adherence is
  an *authoring* gain, never a loop.

### Experiments

- **`experiments/postmerge-grounding/PREREG.md`** — pre-registered, **not shipped**.
  Tests door A (delayed post-merge reality as the only true exogenous α>0 signal) on
  **real SWE repos** via the existing swebench adapter, contamination-controlled by
  blind per-instance sealed suites, **gated through** the new calibration gate.
  Symmetric-error null; a null/plateau stops the line. A live prod-telemetry plane
  is a **v2 item gated on this probe** returning a non-null, non-degrading result.

## [0.9.0]

(Recorded retroactively — the manifest version had advanced to 0.9.0 without a
matching CHANGELOG section; reconciled here.) Bounded **harness-level recursive
self-improvement** meta-loop (opt-in, default-off): a DGM-style content-addressed
archive of harness variants (`.stz/60-harness/`, parent-sampling P ∝
fitness/(1+children)) selected by GRPO group-relative advantage on held-out,
recall-free pilot fitness, guarded by a variance-collapse floor (`src/diversity.ts`)
and a **five-gate** promotion check (beats-incumbent · hack-clean-on-own-outputs ·
seal-integrity · interface-parity `src/harness-hash.ts` · diverse-generation). Flagship
gene: automated suite-sharpening (`harness-mine` twice-verifies a blind-spot bug
class, `harness-promote-mutator` bakes it into the battery). Judge-reliability layer
(`src/judge-reliability.ts`, consistency + per-slice-type trust gating, no naive
ensembles). The competency claim was tested and is an **earned negative**
(`docs/PAPER.md`): the mechanism works; a broad continuous-competency lift does not
follow. Every kill-switch halts and surfaces.

## [0.7.3]

Release automation. First release published through CI with **provenance** (the
0.7.2 release was hand-published; this is the live test of the tag-driven
pipeline). No harness change.

### CI

- **`.github/workflows/release.yml`** — push a `v*` tag and CI gates (typecheck +
  tests), publishes to npm with **`--provenance`** (a Sigstore attestation linking
  the npm version back to the exact GitHub commit + workflow run), then opens the
  GitHub release from the matching `CHANGELOG` section. Auth is npm **Trusted
  Publishing** (OIDC) — the package is set to *require 2FA and disallow tokens*, so
  there is no stored credential to leak, expire, or revoke. Ends the manual-OTP
  publish path for future releases.

## [0.7.2]

Harness-quality fix to the test-author **guide**, plus a distribution fix. Hardens
the sealed-suite authoring against the *permissive-suite* class — a suite that does
not fail correct code but does not catch incorrect code either, so a spec-violating
specimen ties a correct one. Surfaced by dogfood: a sealed `nextRun` (cron) suite
scored an implementation that silently accepts malformed input at a full 1.000.

### Changed

- **`stz-test-author` guide hardened (the symmetric guide).** The agent prompt now
  requires, alongside the existing invariant rules:
  - **contract-mandated rejection cases** — every "throw/reject on X" clause gets a
    negative assertion; the author's reference must satisfy them too;
  - **discriminating** inputs (a case a degenerate impl also passes proves nothing);
  - a **property-based generator over the negative space** (mutate valid inputs into
    invalid ones and assert each throws), because hand-picked negatives cover only
    the obvious malformed forms an implementation already rejects;
  - **stay within the contract** — do not test behaviour the contract is silent on,
    which would fail a correct implementation of a defensible alternate reading.
- **`docs/development/sealed-suite.md`** documents the permissive-suite class as a
  third guide-class (alongside fragile-invariant and superseded-invariant), with the
  matching error-handling split and an audited `seal-amend` remedy.

### Distribution

- **npm package now ships `agents/` and `docs/development/`** (was `src` + `bin`
  only), so the agent fix and its guide-class contract reach `npm` consumers, not
  only the Claude Code plugin/marketplace channel. Plugin + npm versions bumped
  together (0.7.2).

### Validation (honest scope)

- Validated on two pilots under `experiments/` (cron, IPv4): the hardened guidance is
  **followed reliably** (every blind author added rejection + negative-space-generator
  coverage), is **non-regressive** (still catches lenient specimens), and **prevents
  over-strict false-fails** — NEW suites stay neutral on spec-silent inputs and pass
  both strict and lenient correct references, where the old guidance committed to one
  reading and failed a correct lenient reference (0.915–0.950).
- **Not claimed:** that the permissive-suite gap is empirically *closed*. It is
  addressed by construction; a fresh-task demonstration that the negative-space
  generator catches a *subtle* parser soft spot the old guide missed is future work
  (cron's soft spot was too subtle for hand-picked negatives and its specimens are now
  contaminated; IPv4's negatives were too obvious to differentiate the two arms).

## [0.7.1]

Docs-only. Reframes the as-built note as a **living roadmap** and records the
near-term direction. No harness change.

### Changed

- **`docs/AS-BUILT.md` → `docs/ROADMAP.md`.** Same built/deferred record, now a
  continuously-updated document: shipped features move from *Planned* into *What
  was built* each cycle. README, `src/README`, `TESTPLAN`, and the mock
  orchestrator comment point at the new path; the README "Documentation" entry is
  relabelled "Roadmap — what is built, deferred, and planned next".

### Docs

- **Roadmap direction added.** Additional agentic-coding **runtimes** (OpenAI
  Codex CLI — also closing the cross-family specimen/judge gap — plus Pi and
  OpenCode), and a **distinct STZ-native harness** that runs the tournament on
  **BYO LLM**: a generic OpenAI/Anthropic-compatible API, LiteLLM routing, and
  local servers (vLLM, Ollama) for no-egress runs.
- **`docs/JOURNAL.md` brought current** (0.3.1 → 0.7.1) in the author's
  working-log voice (humanizer pass, no em dashes).
- **Staleness sweep.** `TESTPLAN.md` test count corrected (131 → 163) with rows
  added for the F19 update pathway and the F14 command-driven escalation; lingering
  `AS-BUILT` path references updated across README, `src/README`, and `TESTPLAN`.

## [0.7.0]

Resolves the AS-BUILT gap: **cross-round escalation is now driven by the real
`/stz:run` command**, not just the mock orchestrator. On a gate that produces no
passers, the command consulted nothing and halted — the bounded retry→replan→halt
loop (F14) lived only in the mock. This wires the existing escalation FSM into the
deterministic bridge and the command markdown, so a real in-session run retries
and replans within the hard ceiling before halting. Minor: new bridge subcommand
+ command-loop behaviour.

### Added

- **`stz bridge escalate --root . --slice <id>`** — the deterministic owner of
  bounded cross-round failure handling. Call once after a no-passers gate: it
  advances the retry→replan→halt FSM over `state.json` (ceiling ≤1 retry, ≤1
  replan), persists the counts, and on retry/replan writes the PDR
  `50-pressure/<slice>/refinement.md` (GRPO advantages over the eval rewards, the
  same computation the mock uses) that the next round's specimens consume. On
  halt it writes `failure-report.md` and sets `judgment: failed`. `gate` stays a
  pure read and never advances escalation, so the two can't double-advance; the
  FSM ceiling makes even a stray double-call fail-safe (halts early, never loops).

### Changed

- **`/stz:run` command** — adds step 6b: on zero passers it calls `escalate` and
  follows the returned `action` — `retry` re-enters specimen spawning with the
  refinement context, `replan` rewrites the intent first, `halt` stops with the
  failure report. The sealed suite stays **frozen** across all rounds (never
  re-authored/re-sealed; `seal-verify` still gates each round).

### Docs

- AS-BUILT: the cross-round-escalation gap bullet moves into the built section.
  bridge-cli gains the `escalate` contract.

## [0.6.0]

A sustainable **update/upgrade pathway** (F19). STZ ships through two channels
that drift independently — the npm CLI and the Claude Code plugin — and a
scaffolded project's `.stz/` tree never moved when the engine did. This release
gives operators a way to see staleness, detect channel drift, and migrate an old
project tree safely. Minor (not patch): `stz update`/`stz migrate` are new
surface, and the `.stz/` tree now carries a versioned manifest.

> The 0.5.6→0.5.7 split had already left `package.json` and the plugin manifests
> on different versions — the exact drift this release makes detectable. All three
> version sources (`package.json`, `.claude-plugin/plugin.json`,
> `.claude-plugin/marketplace.json`) are unified at 0.6.0 and guarded by a test.

### Added

- **`stz --version`** — prints the installed version (sourced from
  `package.json`, never a hardcoded literal).
- **`stz update [--check]`** — checks the npm registry for a newer release,
  compares against the installed version, and prints the exact remediation
  commands. Does not self-install. When a plugin manifest is reachable
  (`CLAUDE_PLUGIN_ROOT` set, as in a Claude Code session, or run from a repo
  checkout) it also reports **drift** between the CLI and the plugin's bundled
  engine. `--check` emits JSON and exits non-zero when action is needed. The
  registry fetch is injectable, so the verdict logic is unit-tested offline.
- **`stz migrate [dir] [--no-backup]`** — brings an existing `.stz/` tree up to
  the current taxonomy schema. Additive only (creates missing tiers, never
  deletes/renames) and backs the prior tree up to `.stz.bak-schema<N>/` first.
  Idempotent: a no-op when already current.
- **`stz bridge version`** — reports `{version, schemaVersion, packageName}` as
  JSON so the plugin / a SessionStart hook can detect drift deterministically.
- **`.stz/manifest.json`** — every scaffold is now stamped with the STZ version
  and schema version. A new `src/version.ts` is the single version-identity seam
  (package name as a code constant; version read from `package.json`).

### Changed

- Unified all three version sources to 0.6.0; a `version.test.ts` drift guard
  fails CI if they diverge again.

### Docs

- README gains an **Updating** section and a **token-cost** note recommending
  token-efficiency companion plugins (Caveman, RTK, Headroom, CodeSight) for the
  inherently token-intensive tournament/GRPO runs.

## [0.5.7]

Fix npm README rendering. Relative links (`./docs/...`, `../docs/...`, `./LICENSE`)
resolve against the npmjs.com package page, not the repo, so every doc/source link
in `README.md` and `src/README.md` was broken on npm. Rewrote them to absolute
`github.com/.../blob/main/...` URLs (anchor links left intact). Added `repository`,
`homepage`, and `bugs` to `package.json` so the npm page links back to GitHub. No
harness behaviour change.

### Fixed

- **npm doc links** — relative markdown links in `README.md` and `src/README.md`
  now point at absolute GitHub URLs; they were dead on the npm registry page.

### Changed

- **`package.json`** — added `repository`, `homepage`, `bugs` metadata.

## [0.5.6]

Documentation staleness sweep + the **first npm publish** (`npx stz init`, the F17
distribution path). No harness behaviour change.

### Changed
- **Docs brought current with the 0.4–0.5 feature set.** `AS-BUILT.md` had drifted
  to ~0.3.0: corrected the subagent count (ten → eleven, adding `stz-cross-reference`),
  the command surface (added `/stz:merge`), the bridge subcommand list (added the
  seal-integrity set, `project-dark-factory`, and the merge-integrity set), the
  test count (93 → 131), and added the four shipped features it was missing
  (dark-factory, cross-family reference, cross-slice merge integrity, the tabulated
  dashboard) plus the npm CLI; clarified that the cross-family *reference* is built
  while cross-family *specimens/judge* remain deferred. `README.md` command and
  subagent lists gained `/stz:merge` and `stz-cross-reference`. `TESTPLAN.md`
  test count corrected (66 → 131) with rows added for the run-config/dark-factory,
  sealed-suite, cross-family, merge-integrity, and dashboard suites.

## [0.5.5]

npm packaging readiness (rolled into the 0.5.6 publish). No harness behaviour
change.

### Changed
- Dropped a stale `template` entry from `files` (no such dir, unused by the CLI)
  and added a `prepublishOnly: typecheck && test` guard so a broken build cannot
  be published. Verified the packed tarball installs clean and `stz init` /
  `stz bridge` run end to end from the installed bin.

## [0.5.4]

A tabulated `/stz:pipeline` dashboard — at-a-glance progress instead of ad-hoc,
run-to-run-varying prose.

### Added
- **`project-status` now emits a computed `progress` rollup and dashboard-ready
  `slices` rows.** `progress` is `{phases:{done,total}, slices:{total,done,
  running,halted,pending}}` — totals computed by the bridge, not eyeballed by the
  orchestrator. Each `slices` row carries `{id, dependsOn, status, winner,
  faithful}`, with winner/faithful pulled the same way `summary` does so the
  dashboard and the completion report never disagree. The legacy `sliceStatus`
  map is unchanged (back-compat).

### Changed
- **`/stz:pipeline` renders a fixed layout every tick:** a progress line
  (`phases 6/6 · slices 1/3 done · 1 running · …`), a **phases table**, a
  **slices table** with pinned columns (`slice · deps · status · winner ·
  faithful`), a frontier line, and a one-line run-config — plus a worked example
  of the exact rendered output, so every run looks the same and is consumable at a
  glance. Status glyphs standardized: `✓ done · ▶ running/next · ○ pending ·
  ✗ halted`.

### Fixed
- **`merge-validate` no longer reports a never-run replacement suite as "did not
  pass".** When a matched compat entry's replacement invariant was simply absent
  from the reported results (the operator forgot to run/report it), the verdict
  classified it as `invalid` with reason "replacement invariant … did not pass" —
  telling the operator the superseding behaviour was broken when in truth it was
  never measured. It still blocked (fails closed), but a misleading verdict is the
  exact sin this feature exists to replace. The reason now distinguishes "ran and
  failed" from "was not in the reported results — run and report it". Docs-only
  behaviour otherwise unchanged.

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
