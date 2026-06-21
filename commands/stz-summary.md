---
description: Produce the project completion report — aggregate every phase's documents into one summary.
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

# /stz:summary — completion & summary (phase 12)

You are the STZ orchestrator. Read state first: `$STZ bridge project-status
--root .`. This is best run once the slices you care about are `done`, but it
works at any point and reports what exists.

## Procedure

1. **Aggregate the deterministic rollup.** Run `$STZ bridge summary --root .`. It
   harvests each slice's winner (`judgment.json`), faithfulness (`spec-diff.md`
   frontmatter), and cull count (`pressure.md` frontmatter), writes
   `.stz/90-audit/completion-report.md`, and prints per-slice counts.

2. **Spawn one `stz-summarizer` subagent.** It reads the frontmatter summaries
   across every tier (intent, research, validation, standards, tests, per-slice
   spec-diffs, pressure logs, journal) and writes the narrative
   `.stz/90-audit/SUMMARY.md`, returning `## SUMMARY COMPLETE`.

   ORCHESTRATOR RULE: spawn, then stop and wait for the marker.

3. Show the user the rollup table and the narrative recap. Optional final AUQ:
   header `Summary`, question "Approve the summary?", options `[Approve, Adjust]`.
   On Adjust, plain-text feedback, re-spawn, re-show.

Point the user at `.stz/90-audit/SUMMARY.md` and `completion-report.md`.

## --auto

With `--auto`, skip the final approval AUQ and just produce both files.
