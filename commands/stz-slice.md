---
description: Collaboratively break the project into vertical slices (a DAG), then seed them so the per-slice tournaments can run.
argument-hint: "[--auto]"
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

# /stz:slice — slice disaggregation (phase 6)

You are the STZ orchestrator. Read state first: `$STZ bridge project-status
--root .`. Require testing-conventions `done`; else point at `/stz:tests`. Note
`runConfig.granularity` from the same output — it tunes how finely to slice. Also
read the hoisted `darkFactory` flag: when `true`, the co-design gate below is
auto-approved (see Dark-factory).

This phase is collaborative: a subagent proposes the slice DAG, then you and the
user shape it together before committing.

## Procedure

1. **Spawn one `stz-slicer` subagent** (model: `runConfig.models.planning`).
   Pass it the `runConfig.granularity` from project-status: `coarse` → prefer
   fewer, larger slices; `balanced` → the default; `fine` → prefer more, smaller
   single-responsibility slices. It reads all prior tiers and proposes a DAG,
   writing `.stz/40-slices/proposed-dag.md` and a machine `slices.json` (an array
   of full slice manifests with `dependsOn` and the per-slice subset of
   done-predicates), returning the DAG and `## SLICE PROPOSAL COMPLETE`.

   ORCHESTRATOR RULE: spawn, then stop and wait for the marker.

2. **Co-design loop (interactive, not just approve/reject).** Present the DAG:
   the slices, their contracts, and the dependency edges. AUQ: header `Slices`,
   question "Adjust the breakdown?", options `[Approve as-is, Merge two, Split
   one, Reorder/deps]`.
   - **Merge / Split / Reorder** → ask the targeted follow-up (which two? where
     does it split? which edge?), in plain text for freeform edits. When the
     change is structural, re-spawn `stz-slicer` with the instruction and show
     the revised DAG. Loop.
   - Every project done-predicate must end up owned by exactly one slice; if the
     proposal leaves one unassigned, raise it before approval.
   - Loop until the user picks **Approve as-is**.

3. On approve: `$STZ bridge project-seed-slices --root . --dag <slices.json>`.
   This writes each `40-slices/<id>/manifest.{json,md}` and seeds each slice's
   `state.json` with the four early phases already `done` (they were settled at
   the project level). Then `$STZ bridge project-phase --root . --phase
   slice-disaggregation`.

4. Run `$STZ bridge project-status --root .` and report the first runnable slice.
   Hand off: **▶ Next up: `/stz:run <first-slice-id>`** (then `/stz:pipeline` to
   drive the rest).

## --auto

Even with `--auto`, the final "Approve as-is" stays a human gate — the slice
breakdown is too consequential to auto-accept. After approval, chain to
`/stz:run <first>` (or hand to `/stz:pipeline`).

## Dark-factory

When `darkFactory` is `true` (read at the top), skip the co-design AUQ entirely:
take the `stz-slicer` proposal as-is, still enforcing the one structural
invariant (every project done-predicate owned by exactly one slice — if the
proposal violates it, re-spawn the slicer with that instruction rather than
prompting). Then seed and hand off automatically. This is the deliberate
trade-off of an autonomous run: the DAG is accepted without human review, but it
is fully recorded in `proposed-dag.md` + the manifests for after-the-fact audit.
