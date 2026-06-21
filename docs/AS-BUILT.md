# STZ — As-Built Note (intent vs. as-built, applied to this kernel)

In the spirit of F13, this note states what the CLAUDE.md design intends vs.
what this commit actually delivers, so "to the best of my ability" is auditable.

## What this is

A **slice-00 kernel** (per F18 / R7: the hand-written minimal kernel STZ would
then dogfood from). It implements the **deterministic, auditable spine** of the
design for real and fully tested, and puts the non-deterministic model layer
behind thin interfaces with a deterministic mock so the entire pipeline runs
end-to-end without a network call.

Scope was chosen deliberately: the full roadmap (§6) is ~30 days. Depth on the
spine that every other component depends on beats a broad layer of hollow stubs.

## Real and fully tested (the spine)

- **Data model + taxonomy** (F4/F5/N2): `state.json` schema, the 13-tier `.stz/`
  markdown tree, frontmatter (de)serializer with summary-field progressive
  disclosure. Round-trip + scaffold tested.
- **GRPO advantage** (F8): exact `(rᵢ−μ)/(σ+ε)`, ε-guard on the all-equal edge.
- **Two-stage selection** (F7): eval-gate elimination → pairwise win-count
  ranking (the plain deterministic aggregation, V votes/pair). GRPO advantage is
  computed over the **whole specimen group** (incl. gate-eliminated specimens)
  so the pressure log can weight losers' diffs (F8/F9). Tie-breaks deterministic.
- **Hack-pattern detector** (F10/L3): line-scan for test-skip, assertion
  mutation, network-bypass, fixture-keyed branching, hardcoded sentinels — with
  remediation strings re-injected on replan. No-false-positive tested.
- **Bounded escalation FSM** (F14, the R1 headline mitigation): 1 retry → 1
  replan → halt. The ceiling is proven to hold and halt is absorbing.
- **Complexity→budget allocator + calibration** (F15/N5): monotonic, pool-capped.
  The hard per-slice cap is **enforced** at the one metering point (`charge()`):
  a would-be overrun throws `BudgetExceededError` (R3 kill-switch), not merely
  tracked. Tested by running a slice against a deliberately tiny pool.
- **Cost/call ledger** (N5/N6): JSONL, replay round-trip.
- **State checkpoint + crash recovery** (F16): resume the interrupted phase.
- **Pressure log + PDR top-K refinement** (F9).
- **Spec-diff** (F13): structural intent vs as-built, faithfulness check.
- **Orchestrator** (F1): sequences all 8 phases, checkpoints at every boundary,
  charges the budget per call, runs the tournament, and materializes the full
  audit tree. E2E tested on both the **success path** and the **failure path**
  (no passers → retry → replan → halt + structured failure report).
- **CLI** (F17): `stz init` / `stz run`.

## Now real: the in-session Claude Code harness (steps 1–5)

The model layer is no longer only a mock. STZ runs inside a Claude Code session:

- **Orchestration bridge** (`src/bridge.ts`, `stz bridge`): the deterministic
  half as a JSON-in/out CLI the command calls between subagent spawns
  (begin → record-eval/eval → gate → record-votes → select → finalize).
- **Invocation surface**: `/stz:run` command + four subagent definitions
  (`agents/stz-{specimen,judge,test-author,documenter}.md`) carrying frozen
  prompts and inoculation framing (F10/L4).
- **Real parallel subagents**: specimens are spawned as concurrent Task/Agent
  calls (the canonical programmatic primitive; multiple calls in one message =
  parallel batch with a blocking barrier = the tournament boundary). Proven by
  an executed run in `examples/clamp-tournament/`.
- **Real eval runner** (`src/eval-runner.ts`): testPassRate (executed sealed
  suite), coverage (V8 `NODE_V8_COVERAGE`), and mutation survival (source
  mutators re-run against the suite) — all genuinely executed, no test library
  dependency. This is what makes GRPO advantage non-flat.
- **Packaging + activation**: `.claude-plugin/{plugin,marketplace}.json` and a
  SessionStart hook (`hooks/`).

## Still behind interfaces / deferred (honest gaps)

- **Codex CLI / OpenAI specimens** for cross-family heterogeneity — the seam
  takes any subagent; only Claude Code subagents are wired so far.
- **Python eval drivers** specifically (Hypothesis generators, mutmut/Stryker):
  the eval runner is real but JS-only. Coverage and mutation are executed via
  V8 + source mutators, not the named Python libraries. Property-based test
  *authoring* happens in the sealed suite when the test-author chooses it.
- **git worktrees** per specimen (F6) → still stood in by `prototypes/specimen-X/`
  directories (distinct paths, no collision). Per-worktree **ephemeral
  observability stacks** — not spun up.
- **Local embeddings / cross-slice RAG** (N2/R4) — not built. Consequence seen
  in the live run: the spec-diff matches claims literally, so intent (the *what*)
  and as-built (the *how*) read as divergent and the diff over-flags for human
  review. Conservative, not wrong; semantic matching is the fix.
- **L1/L2 enforcement** via git read-only attributes + pre-commit hook — the
  sealed suite is written to `30-tests/held-out/` and only the judge is told to
  read it, but OS-level read-only attribution is not applied.
- **Plugin install**: now installs. The manifest declares only the fields the
  validator accepts (`commands/`, `agents/`, `hooks/hooks.json` auto-discover);
  the earlier `agents: Invalid input` failure came from declaring those as path
  strings. Commands no longer assume a global `stz` on `PATH` (a plugin install
  is not an npm install and creates no `bin` symlink) — each resolves the bundled
  bridge via a linked `stz`, then `${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs`, then a
  plugin-cache glob. Remaining caveat: the bundled bridge runs the TS CLI through
  `tsx` fetched by `npx` on first use, so a fresh environment needs Node 20+ and
  network for that first call. Shipping a prebuilt `dist/` to drop the runtime
  `tsx` dependency is a hardening follow-up. Custom agent defs still load at
  session start, so the build-session acceptance runs spawned general-purpose
  agents carrying the same prompts inline.
- **Bounded escalation in `/stz:run`**: a single command invocation halts on
  no-passers; the retry → replan → halt loop lives in the mock orchestrator and
  is not yet driven by the command across rounds.

## Honest spec-diff for this build

- **Delivered as planned:** the deterministic spine + 8-phase orchestration +
  the in-session harness (bridge, command, agents, real eval runner, packaging,
  gates), proven by an executed tournament and 75 tests.
- **Planned but deferred (documented, not missing-by-accident):** the gaps above
  — cross-family specimens, Python PBT/mutation libraries, worktrees + obs
  stacks, embeddings/RAG, git-attribute sealing, and the end-to-end plugin
  install cycle.
- **Built beyond the literal plan:** the `stz bridge` JSON contract, a real
  dependency-free eval runner (V8 coverage + source-mutation), a deterministic
  mock layer, the worked `examples/clamp-tournament/` run, and this audit note.
