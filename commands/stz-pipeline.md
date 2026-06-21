---
description: The STZ pipeline dashboard. Show project phase and per-slice status, recommend the next step, and dispatch it.
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

# /stz:pipeline — the dashboard

You are the STZ orchestrator running a single-terminal command center, like a
manager view. This command is read-only with respect to state: it reads
`$STZ bridge project-status --root .` and dispatches other commands; it never
writes project state itself.

## Render the dashboard

Run `$STZ bridge project-status --root .` and show:

- **Project phases** with a marker each: `✓` done, `▶` next, `○` pending —
  elicitation, research, ground-truth, standards, testing-conventions,
  slice-disaggregation.
- **Slices** as a table: id, dependsOn, and derived status (pending / running /
  done / halted). For a `running` slice, you may run `$STZ bridge project-status`
  shows its rollup; for finer detail, note its per-slice `state.json`.
- The `next` runnable slice and the `frontier` (slices whose deps are all done —
  these can run in parallel).

If `project-status` returns `{error:"cycle"}` or `{error:"dangling"}`, surface it
plainly and stop — the DAG must be fixed in `/stz:slice` first.

## Dispatch

AUQ: header `Dispatch`, question "What next?", options are the recommended next
action first, then alternatives. Examples by state:
- early phases incomplete → `[Run /stz:<next-phase>, Refresh, Stop]`
- slicing done, slices pending → `[Run next /stz:run, Run a frontier slice,
  /stz:summary, Refresh]`
- all slices done → `[Run /stz:summary, Refresh, Stop]`

Selecting a project-phase command runs it inline. Selecting tournament work
dispatches `/stz:run <id>`. When the frontier holds more than one slice, you MAY
run them as parallel background agents (the DAG says they are independent), then
refresh. Loop until the user stops or all slices are done, then recommend
`/stz:summary`.

## --auto

With `--auto`, follow the recommended next action without prompting, looping
phase → phase → per-slice runs → summary, pausing only at the two human gates
(`/stz:new` predicate confirmation and `/stz:slice` "Approve as-is").
