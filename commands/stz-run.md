---
description: Run one STZ slice as an in-session tournament — spawn N specimens in parallel, eval-gate, judge, select a winner, and write the audit tree.
argument-hint: "[slice-id] (a manifest at .stz/40-slices/<slice-id>/manifest.json, or answer the prompts)"
---

## Setup: locate the bridge

This plugin is not on your PATH. A plugin install does not register a global
`stz` command, so resolve the bridge CLI once at the start and use `$STZ` for
every bridge call below:

```bash
if command -v stz >/dev/null 2>&1; then STZ='stz';
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs" ]; then STZ="node ${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs";
else STZ="node $(ls -d ~/.claude/plugins/cache/*/stz/*/bin/stz.mjs 2>/dev/null | sort -V | tail -1)"; fi
echo "using bridge: $STZ"
```

# /stz-run — in-session slice tournament

You are the STZ **orchestrator**. STZ runs *inside* this Claude Code session:
you spawn the model-side work as **Task subagents** (the Agent tool) and call
the deterministic **bridge CLI** (`$STZ bridge …`) for every exact decision
(eval gate, hack detection, GRPO, selection, audit). You own spawn-and-collect;
the bridge owns compute. Never tally, rank, or judge in your own head — call the
bridge.

Invoke the bridge as `$STZ bridge <subcommand> --flag value` (the `$STZ` resolver
above handles plugin, linked-CLI, and repo cases). Each call prints one JSON
object on stdout; read it and act on it.

## Inputs

`$1` = slice id (default `slice-01`). The manifest is JSON describing the
contract, done-predicates, complexity, and judge config. If
`.stz/40-slices/$1/manifest.json` is missing, run a short **elicitation**: ask
the user (via AskUserQuestion) for the contract and at least one
machine-checkable done-predicate, then write the manifest JSON. Do not proceed
on prose-only acceptance (F2).

## Procedure

0. **Read the run config.** `$STZ bridge project-status --root .` and read its
   `runConfig` plus the hoisted `darkFactory` flag (if `true`, this is an
   autonomous run — skip the human winner-approval gate at step 8b below).
   `fanout` is N for step 4, and `models` is the per-role model map
   — pass `model: models.testing` to the `stz-test-author` spawn,
   `model: models.execution` to each `stz-specimen`, and `model: models.judging`
   to each `stz-judge`. If there is no project (a bare single-slice run), fall
   back to N=4 and the agents' own default models. (Each role's value is a spawn
   alias like `opus`/`sonnet`/`haiku`, or a free-form model id.)

1. **Begin.** `$STZ bridge begin --root . --manifest .stz/40-slices/$1/manifest.json`.
   Note `votesPerPair` and the prototype dir root from the JSON.

2. **Author the sealed suite, smoke-test it, then freeze it (frozen).** Spawn ONE
   `stz-test-author` subagent (model: `runConfig.models.testing`). It writes the
   held-out tests to `.stz/30-tests/held-out/` AND a minimal correct reference
   implementation under `.stz/30-tests/held-out/reference/`. Implementers never
   see either.
   - **Smoke gate (before sealing) — a mechanical SENSOR, nothing more.** In a
     scratch dir (NOT a prototype dir, NOT a specimen-visible path; discard it
     after), copy the suite + the reference, compile (compile-only first where the
     language supports it — `cargo test --no-run` for Rust, `tsc --noEmit` for TS),
     then run the suite against the reference. A green gate means exactly
     **"compiles and is satisfiable against the sealed reference"** — it does NOT
     mean the suite is semantically robust. The fragile-invariant class (identity
     keyed on mutable position, snapshot diffs that break under legitimate change)
     is owned UPSTREAM by the test-author's hard rules (a GUIDE), because the
     reference shares the author's blind spot and the gate cannot see it.
   - **On gate failure** (won't compile / reference fails it): classify as a
     **gate failure** and loop — send the exact compiler/test stderr back to
     `stz-test-author` to rewrite, then re-run the gate. Do not hand-patch the
     suite yourself.
   - **Cross-family reference (before sealing) — an independent GUIDE against
     shared blind spots.** The smoke gate's reference was written by the same
     agent as the suite, so a blind spot they hold (a fragile invariant, a
     boundary off-by-one) is in both and the gate stays green. To catch that,
     spawn ONE `stz-cross-reference` subagent — with a DIFFERENT model from the
     testing role where the run config allows it (e.g. a different family, or at
     least `runConfig.models.execution` vs `runConfig.models.testing`). It sees
     only the contract + done-predicates (NEVER the suite or the primary
     reference) and writes a second complete solution into
     `.stz/30-tests/held-out/reference-b/`. Then run
     `$STZ bridge seal-crosscheck --root . --sealed
     .stz/30-tests/held-out/<sealed-file> --reference-a
     .stz/30-tests/held-out/reference/<entry> --reference-b
     .stz/30-tests/held-out/reference-b/<entry>`.
     - **both-pass** → two independent references satisfy the suite; the
       shared-blind-spot risk is reduced. Proceed to freeze.
     - **divergent** (the command exits non-zero) → exactly one reference passes.
       Do NOT auto-rewrite — this is a GUIDE-class signal for adjudication, same
       class as the fragile-invariant case. Inspect `30-tests/cross-reference.md`:
       either the suite over-fits the primary (fix via stronger `stz-test-author`
       guidance + `seal-amend`) or the cross reference is wrong (discard/redo it).
       Resolve before sealing.
       - **In dark-factory mode** (`darkFactory` true, from step 0) there is no
         human to adjudicate, and divergence must NOT auto-rewrite either — so do
         not seal or judge this slice. Instead **halt it**: record the divergence
         (it is already in `30-tests/cross-reference.md`), mark the slice halted
         with a failure report pointing at the cross-check, and return. Per the
         `/stz:pipeline` dark-factory rule, a halted slice does not stall the
         factory — the DAG continues and the divergence surfaces in the final
         `/stz:summary` for after-the-fact human review. (This is the one place
         the autonomous run defers a decision rather than guessing.)
     - **both-fail** → the suite is unsatisfiable as written; treat it as a gate
       failure and loop the stderr back to `stz-test-author`.
   - **Freeze.** Once green AND the cross-check is both-pass, `$STZ bridge seal
     --root .` — this sha256-hashes every held-out file (suite + both references)
     into `30-tests/held-out/SEAL.json`. The suite is now frozen; do not edit it
     by hand. (`reference-b/` lives under held-out, so it is sealed too and never
     specimen-visible.)

3. **Plan (intent spec).** Write `.stz/40-slices/$1/intent.json` as
   `{ "claims": [ {"id":"c1","text":"…"}, {"id":"c2","text":"…"}, … ] }` — the
   behavioural claims the slice should satisfy, each with a stable `id` (`c1`,
   `c2`, …). Leave *how* open (that is the specimens' job, R5). The ids are what
   the spec-diff matches against, so the documenter (step 9) adjudicates each one
   by id rather than by re-describing the code — that is why wording differences
   no longer read as drift.

4. **Spawn N specimens IN PARALLEL.** In a SINGLE message, emit N `stz-specimen`
   Agent calls — N is `runConfig.fanout` from step 0 (default 4), each with
   `model: runConfig.models.execution`. Give each a DISTINCT strategy label
   (iterator-based, stream-based, batch-based, recursive) so the group is
   diverse. Each specimen writes only into its own
   `prototypes/specimen-<id>/` directory and returns a path + summary, NOT file
   contents. They run concurrently and the turn blocks until all finish — that
   barrier is exactly the tournament boundary.

4b. **Verify the seal (gate the tournament).** Before any eval, run
    `$STZ bridge seal-verify --root .`. It re-hashes the held-out suite against
    SEAL.json and **exits non-zero on any drift** — a frozen-suite change between
    sealing and judging breaks the anti-hacking guarantee. If it reports drift,
    STOP and investigate; do not eval against a tampered suite. If you genuinely
    must change the sealed suite (e.g. a real bug only now surfaced), do it
    through `$STZ bridge seal-amend --root . --reason "<why>"` — never an ad-hoc
    edit — which records the per-file change + reason into SEAL.json's audit log
    and re-freezes, then re-run `seal-verify`.

5. **Eval each specimen (real, executed).** For each specimen, call:
   `$STZ bridge eval --root . --slice $1 --specimen <id> --sealed
   .stz/30-tests/held-out/<sealed-file> --impl
   .stz/40-slices/$1/prototypes/specimen-<id>/<entry-file> --fixtures
   <comma-sep fixture names>`. The bridge runs the sealed suite, measures V8
   coverage and mutation survival, runs the hack-detector, and records the
   gate decision — all in one call. You do not compute metrics by hand.
   (If an external eval runner already produced metrics, the alternate path is
   `$STZ bridge record-eval --root . --slice $1 --specimen <id> --metrics
   <metrics.json> --fixtures <...>`.)

   **If the sealed suite fails identically across ALL specimens** (and the
   specimens look correct), suspect the suite, not the field — this is the
   fragile-invariant class. Classify it as an **authoring (GUIDE) failure, not a
   gate miss**: the smoke gate was never able to catch it (the reference shared
   the blind spot). Fix it through `$STZ bridge seal-amend --root . --reason
   "<why>"` (never an ad-hoc edit), re-run `seal-verify`, and treat it as a signal
   to strengthen the `stz-test-author` guidance — not as a bug in the gate.

6. **Gate.** `$STZ bridge gate --root . --slice $1`. Read `passers`,
   `eliminated`, and the `pairings` schedule.

6b. **No passers → bounded escalation (F14).** If `passers` is empty, do NOT
    decide on your own whether to retry — the bridge owns that bound. Call
    `$STZ bridge escalate --root . --slice $1` exactly once and read its
    `action`:
    - **`retry`** — read `refinementPath` (a `50-pressure/$1/refinement.md` with
      the GRPO-ranked losers as PDR negative context). Re-enter at **step 4**:
      re-spawn N fresh `stz-specimen` agents, passing the refinement file's
      content as "what the prior round got wrong — do not repeat it." Then
      **step 4b** (`seal-verify` — the suite is unchanged but the gate is
      mandatory every round), step 5 (eval), step 6 (gate) again.
    - **`replan`** — the retry budget is spent. Re-enter at **step 3**: rewrite
      `intent.json` using the failure analysis (read `refinementPath` and the
      prior round's pressure log), then proceed to step 4 with the refinement
      context as in `retry`.
    - **`halt`** — both budgets are exhausted. Read `failureReportPath`, show the
      user the structured failure report, and **STOP**. Do not spawn another
      round.

    The suite stays **frozen** across every round: never re-run step 2
    (test-author / seal) on a retry or replan — re-authoring or re-sealing
    mid-slice destroys the anti-hacking guarantee. Only `seal-verify` (4b) runs
    each round. The FSM ceiling is hard (≤1 retry, ≤1 replan), so `escalate`
    returns `halt` after at most two re-rounds — trust its `action`, never loop
    past it.

7. **Judge (pairwise).** For each pair in `pairings`, spawn `stz-judge`
   subagents (model: `runConfig.models.judging`) — `votesPerPair` votes per pair
   (you MAY lower this for a cheap
   acceptance run; say so). Judges are frozen, see the sealed suite, and return
   only a winner id. Collect all votes into a `votes.json` array of
   `{a,b,winner}` and `$STZ bridge record-votes --root . --slice $1 --votes
   votes.json`.

7b. **Contract verify (0.9.6, only when `contract.enabled` in run-config).** If a
    contract slice is bound, spawn ONE `stz-contract-verifier` subagent to score
    each surviving specimen's diff against the bound slice's accepted predicates,
    and write a per-specimen results map to `40-slices/$1/tournament/contract-scores.json`
    (shape: `{ "<specimen>": PredicateResult[] }`). Skip this step entirely when
    the flag is off — the tournament then runs exactly as 0.9.5. (The bound slice
    itself is authored earlier by `stz-contract-architect` before `/stz:slice`,
    proposed-only, and crosses to accepted solely via `$STZ bridge contract-accept`
    — the human 7th gate.)

8. **Select.** `$STZ bridge select --root . --slice $1`. The bridge runs the
   two-stage selection + GRPO and returns `{winner, ranking, advantages}`.
   **0.9.6:** when step 7b produced `contract-scores.json`, add
   `--contract-scores 40-slices/$1/tournament/contract-scores.json` — specimens
   that hard-fail a high-severity contract predicate are eliminated at the gate
   (contract = definition of winner). Omit the flag ⇒ 0.9.5 selection, unchanged.

8b. **Winner approval gate (human-in-the-loop).** Before merging, show the user
    the winner, the ranking, the GRPO advantages, and any disqualified specimens
    with their hack findings. Ask (AskUserQuestion) whether to accept the winner,
    pick a different survivor, or halt. Only proceed once the user accepts.
    **Skip this gate when `darkFactory` is true** (read in step 0) — a dark-factory
    run auto-accepts the selected winner and records it without prompting; the
    full ranking + advantages still land in the audit tree for after-the-fact
    review. (Also skip it for any run explicitly launched non-interactive.)

9. **Document + finalize.** Spawn ONE `stz-documenter` subagent on the winner's
   dir, and **pass it the intent claims from `intent.json` (ids and text)**. It
   adjudicates each intent claim by id and returns
   `{claims:[{id,satisfied,evidence}, …, {id:"x1",text:"…extra"}]}` → write
   `asbuilt.json`. Then `$STZ bridge finalize --root . --slice $1 --intent
   intent.json --asbuilt asbuilt.json`. This writes the pressure log, the
   spec-diff, and the audit journal. The bridge matches as-built verdicts to
   intent claims by id, so `faithful` reflects real coverage, not wording. If
   finalize prints `mismatchedAsBuiltIds` (or warns on stderr), the documenter
   mis-keyed a verdict — re-spawn it with the exact intent id list and re-run
   finalize rather than trusting the diff.

10. **Report.** Show the user: winner, ranking, whether the build is faithful
    (no planned-but-missing claims), and any disqualified specimens with their
    hack findings. Point at `.stz/40-slices/$1/` for the full trail.

## Rules

- Flat orchestration only. Specimens and judges must NOT spawn their own
  subagents (keep depth 1).
- Specimens return pointers, never file dumps (N2 context budget).
- If the gate yields zero passers, do not loop or decide on your own: call
  `$STZ bridge escalate` (step 6b) and follow its `action` (retry → replan →
  halt). The bridge owns the bound — it persists the retry/replan counts to
  `state.json` and halts deterministically after ≤1 retry + ≤1 replan, so the
  escalation is replayable from state, not dependent on you counting rounds.
