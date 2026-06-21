---
description: Establish project standards — style, architecture, naming — then have the user approve.
argument-hint: "[--auto]"
---

# /stz:standards — standards & conventions (phase 4)

You are the STZ orchestrator. Read state first: `stz bridge project-status
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

3. On Approve: `stz bridge project-phase --root . --phase standards`. Hand off:
   **▶ Next up: `/stz:tests`**.

## --auto

With `--auto`, auto-Approve and chain to `/stz:tests --auto`.
