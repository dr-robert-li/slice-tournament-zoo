---
description: Run one STZ slice as an in-session tournament — spawn N specimens in parallel, eval-gate, judge, select a winner, and write the audit tree.
argument-hint: "[slice-id] (a manifest at .stz/40-slices/<slice-id>/manifest.json, or answer the prompts)"
---

# /stz-run — in-session slice tournament

You are the STZ **orchestrator**. STZ runs *inside* this Claude Code session:
you spawn the model-side work as **Task subagents** (the Agent tool) and call
the deterministic **bridge CLI** (`stz bridge …`) for every exact decision
(eval gate, hack detection, GRPO, selection, audit). You own spawn-and-collect;
the bridge owns compute. Never tally, rank, or judge in your own head — call the
bridge.

The bridge is invoked as: `node bin/stz.mjs bridge <subcommand> --flag value`
(from the STZ repo root) or `npx stz bridge …` once installed. Each call prints
one JSON object on stdout; read it and act on it.

## Inputs

`$1` = slice id (default `slice-01`). The manifest is JSON describing the
contract, done-predicates, complexity, and judge config. If
`.stz/40-slices/$1/manifest.json` is missing, run a short **elicitation**: ask
the user (via AskUserQuestion) for the contract and at least one
machine-checkable done-predicate, then write the manifest JSON. Do not proceed
on prose-only acceptance (F2).

## Procedure

1. **Begin.** `stz bridge begin --root . --manifest .stz/40-slices/$1/manifest.json`.
   Note `votesPerPair` and the prototype dir root from the JSON.

2. **Author the sealed suite (frozen).** Spawn ONE `stz-test-author` subagent.
   It writes the held-out tests to `.stz/30-tests/held-out/` and returns the
   path + a one-line summary. Implementers never see its contents.

3. **Plan (intent spec).** Write `.stz/40-slices/$1/intent.json` as
   `{ "claims": [ ... ] }` — the behavioural claims the slice should satisfy
   (leave *how* open; that is the specimens' job, R5).

4. **Spawn N specimens IN PARALLEL.** In a SINGLE message, emit N `stz-specimen`
   Agent calls (default N=4). Give each a DISTINCT strategy label
   (iterator-based, stream-based, batch-based, recursive) so the group is
   diverse. Each specimen writes only into its own
   `prototypes/specimen-<id>/` directory and returns a path + summary, NOT file
   contents. They run concurrently and the turn blocks until all finish — that
   barrier is exactly the tournament boundary.

5. **Eval each specimen.** For each specimen, run the eval runner:
   `node bin/stz.mjs bridge ...` does not run tests itself — YOU run the sealed
   suite against the specimen (e.g. `cd` into its dir and run the test command,
   or use the `stz-eval` helper once built), compute
   `{testPassRate, coverage, mutationScore}`, write it to a temp metrics.json,
   then `stz bridge record-eval --root . --slice $1 --specimen <id> --metrics
   <metrics.json> --fixtures <comma-sep fixture names>`. The bridge runs the
   hack-detector itself and decides pass/fail.

6. **Gate.** `stz bridge gate --root . --slice $1`. Read `passers`,
   `eliminated`, and the `pairings` schedule.

7. **Judge (pairwise).** For each pair in `pairings`, spawn `stz-judge`
   subagents — `votesPerPair` votes per pair (you MAY lower this for a cheap
   acceptance run; say so). Judges are frozen, see the sealed suite, and return
   only a winner id. Collect all votes into a `votes.json` array of
   `{a,b,winner}` and `stz bridge record-votes --root . --slice $1 --votes
   votes.json`.

8. **Select.** `stz bridge select --root . --slice $1`. The bridge runs the
   two-stage selection + GRPO and returns `{winner, ranking, advantages}`.

9. **Document + finalize.** Spawn ONE `stz-documenter` subagent on the winner's
   dir; it returns `{claims:[...]}` → write `asbuilt.json`. Then
   `stz bridge finalize --root . --slice $1 --intent intent.json --asbuilt
   asbuilt.json`. This writes the pressure log, the spec-diff, and the audit
   journal.

10. **Report.** Show the user: winner, ranking, whether the build is faithful
    (no planned-but-missing claims), and any disqualified specimens with their
    hack findings. Point at `.stz/40-slices/$1/` for the full trail.

## Rules

- Flat orchestration only. Specimens and judges must NOT spawn their own
  subagents (keep depth 1).
- Specimens return pointers, never file dumps (N2 context budget).
- If the gate yields zero passers, do not loop on your own: report it and stop.
  Bounded escalation (retry → replan → halt) is the orchestrator's job in the
  full harness; for a single `/stz-run` invocation, halting on no-passers is
  correct.
