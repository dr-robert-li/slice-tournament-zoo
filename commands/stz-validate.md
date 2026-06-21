---
description: Ground-truth validation. Verify the research claims against reality (run code, fetch real sources, read actual files), then have the user approve.
argument-hint: "[--auto]"
---

# /stz:validate — ground-truth validation (phase 3)

You are the STZ orchestrator. Read state first: `stz bridge project-status
--root .`. Require research `done`; else point at `/stz:research`.

## Procedure

1. **Spawn one `stz-validator` subagent** on the research claims. It verifies each
   against reality and writes `.stz/10-research/validation.md` with a per-claim
   verdict (confirmed / refuted / unverifiable + evidence), returning the
   refuted/unverifiable list and `## VALIDATION COMPLETE`.

   ORCHESTRATOR RULE: spawn, then stop and wait for the marker.

2. **Approval gate.** Show the user the verdict counts and, prominently, any
   refuted or unverifiable claim — those are the ones that change the plan. AUQ:
   header `Validation`, question "Approve validation?", options `[Approve,
   Adjust, Review full file, You decide]`.
   - **Adjust** → plain-text "what should be re-checked?", wait, re-spawn
     `stz-validator` with that focus. Re-gate.
   - Loop until Approve.

3. On Approve: `stz bridge project-phase --root . --phase ground-truth`. Hand off:
   **▶ Next up: `/stz:standards`**.

## --auto

With `--auto`, auto-Approve ONLY if nothing was refuted. If a depended-on claim
was refuted, stop and make the user decide even in `--auto`. Otherwise chain to
`/stz:standards --auto`.
