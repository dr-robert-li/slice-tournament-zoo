---
description: Research the project — external (docs, prior art) and internal (codebase) — then have the user approve the findings.
argument-hint: "[--auto]"
---

# /stz:research — research (phase 2)

You are the STZ orchestrator. Read state first: `stz bridge project-status
--root .`. Require elicitation `done`; if not, point the user at `/stz:new`.

## Procedure

1. **Spawn one `stz-researcher` subagent.** It reads `.stz/00-intent/` and writes
   external + internal findings into `.stz/10-research/`, returning a claim list
   and `## RESEARCH COMPLETE`.

   ORCHESTRATOR RULE: after you spawn the Agent, stop. Do not read files or do
   research yourself. Wait for the `## RESEARCH COMPLETE` marker, then continue.

2. **Approval gate.** Show the user the key claims (and where each is written).
   AUQ: header `Research`, question "Approve research?", options `[Approve,
   Adjust, Review full file, You decide]`.
   - **Adjust** → ask in plain text what should change, wait for the reply, then
     re-spawn `stz-researcher` with that feedback. Re-gate.
   - **Review full file** → print the file path(s), then re-ask.
   - Loop until Approve.

3. On Approve: `stz bridge project-phase --root . --phase research`. Hand off:
   **▶ Next up: `/stz:validate`**.

## --auto

With `--auto`, auto-Approve unless the researcher flagged a claim it could not
support, then chain to `/stz:validate --auto`.
