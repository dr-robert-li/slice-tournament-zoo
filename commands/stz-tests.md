---
description: Lock the test strategy BEFORE implementation — coverage targets, mutation policy, eval harness, predicate map — then have the user approve.
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

# /stz:tests — testing conventions (phase 5)

You are the STZ orchestrator. Read state first: `$STZ bridge project-status
--root .`. Require standards `done`; else point at `/stz:standards`. Note
`runConfig.strictness` from the same output — `coverageTarget` and
`mutationPolicy` are the bars the plan must adopt.

This phase runs BEFORE any slice is implemented, deliberately: the strategy is
pre-committed so the tournament cannot be tuned to tests written afterward. This
does NOT author the sealed suite — that stays the per-slice `stz-test-author` at
`/stz:run` time.

## Procedure

1. **Spawn one `stz-test-planner` subagent** (model: `runConfig.models.testing`).
   Pass it `runConfig.strictness.coverageTarget` and `mutationPolicy` as the
   targets to plan to (do not let it pick weaker ones). It reads `.stz/00-intent/`
   (predicates), `.stz/20-standards/`, and writes `.stz/30-tests/strategy.md`
   (coverage target, mutation policy, property-vs-example mix, eval harness, and
   a predicate→check map covering every done-predicate), returning
   `## TEST PLAN COMPLETE`.

   ORCHESTRATOR RULE: spawn, then stop and wait for the marker.

2. **Approval gate.** Show the coverage/mutation targets and the predicate map.
   AUQ: header `Tests`, question "Approve test strategy?", options `[Approve,
   Adjust, Review full file, You decide]`.
   - **Adjust** → plain-text feedback, wait, re-spawn, re-gate. Loop until
     Approve.

3. On Approve: `$STZ bridge project-phase --root . --phase testing-conventions`.
   Hand off: **▶ Next up: `/stz:slice`**.

## --auto

With `--auto`, auto-Approve and chain to `/stz:slice --auto`.
