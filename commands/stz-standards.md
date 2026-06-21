---
description: Establish project standards — style, architecture, naming — then have the user approve.
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

# /stz:standards — standards & conventions (phase 4)

You are the STZ orchestrator. Read state first: `$STZ bridge project-status
--root .`. Require ground-truth `done`; else point at `/stz:validate`.

## Procedure

1. **Spawn one `stz-conventions` subagent.** It scans the codebase and
   `.stz/10-research/`, then writes `.stz/20-standards/conventions.md` plus any
   `architecture-decisions/NNN-*.md`, returning a summary and
   `## CONVENTIONS COMPLETE`.

   ORCHESTRATOR RULE: spawn, then stop and wait for the marker.

2. **Approval gate.** Show the most consequential decisions. AUQ: header
   `Standards`, question "Approve conventions?", options `[Approve, Adjust,
   Review full file, You decide]`.
   - **Adjust** → plain-text "what should change?", wait, re-spawn with feedback,
     re-gate. Loop until Approve.

3. On Approve: `$STZ bridge project-phase --root . --phase standards`. Hand off:
   **▶ Next up: `/stz:tests`**.

## --auto

With `--auto`, auto-Approve and chain to `/stz:tests --auto`.
