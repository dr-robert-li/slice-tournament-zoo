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
- **Run config** (one line) from `runConfig`: granularity, fan-out N, strictness
  (coverage/mutation/conventions), and the per-role model map. Flag whether it is
  user-set (`runConfigSet`) or still the defaults.
- **Dark-factory** — read the hoisted `darkFactory` field. If `true`, show a
  banner (`🏭 dark-factory: ON — autonomous, no human gates`) and switch to the
  autonomous behaviour below instead of prompting.

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

## Dark-factory mode (autonomous, no human in the loop)

When `project-status` reports `darkFactory:true` (or the run was invoked
`/stz:pipeline --dark`, which first runs `$STZ bridge project-dark-factory
--root . --on` then proceeds), drive the whole pipeline to completion with NO
prompts:

- Skip the dispatch AUQ entirely. At each tick, run the recommended next action
  directly, then refresh — exactly the `--auto` loop, but the two human gates are
  *also* skipped: do NOT pause at `/stz:slice` "Approve as-is" (auto-approve the
  proposed DAG) or at the `/stz:run` winner-approval gate (auto-accept the
  selected winner). Each downstream command sees `darkFactory:true` and skips its
  own gate; you do not re-ask.
- The ONE gate that still holds is the F2 predicate gate in `/stz:new` — if
  elicitation never produced a machine-checkable predicate, stop and say so
  rather than inventing acceptance. (In practice elicitation is already done
  before dark-factory drives anything.)
- When the frontier holds independent slices, run them as parallel background
  agents (the DAG says they are independent), then refresh. Loop until every
  slice is `done` or `halted`.
- **The one decision the factory defers, never guesses:** a `seal-crosscheck`
  divergence (`/stz:run` step 2) needs human adjudication and must not
  auto-rewrite. With no human present, `/stz:run` halts that slice rather than
  sealing on an unresolved blind-spot signal. That is the normal halted-slice
  path: the DAG keeps going and the divergence is surfaced in the summary below.
  Do not hand-resolve it mid-run; that is what the after-the-fact review is for.
- **End with the summary, not a prompt.** Run `/stz:summary` and present the
  completion report (per-slice winner, faithful?, culled count, any halted
  slices with their failure reports) as the final artifact. A halted slice does
  not stall the factory — report it and continue the rest of the DAG; surface all
  halts in the final summary.

Disengage at any time with `$STZ bridge project-dark-factory --root . --off`
(e.g. if a halt needs human eyes).
