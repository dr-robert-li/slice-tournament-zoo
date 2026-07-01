---
description: STZ 0.9.6 Phase-0 measurement — lock a chronological held-out issue stream and produce baseline RepoMetrics before any self-improvement is claimed.
argument-hint: "[--repo <id>] [--records <records.json>]"
---

## Setup: locate the bridge

```bash
if command -v stz >/dev/null 2>&1; then STZ='stz';
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs" ]; then STZ="node ${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs";
else STZ="node $(ls -d ~/.claude/plugins/cache/*/stz/*/bin/stz.mjs 2>/dev/null | sort -V | tail -1)"; fi
echo "using bridge: $STZ"
```

# /stz:eval — Phase-0 baseline measurement

You cannot claim "better SWE outcomes" without a stable, held-out, **repo-local**
baseline. This command produces one. Evaluation is chronological — never shuffle
issues, which leaks future data and inflates scores.

## What it does

Given a records file mapping each baseline condition to its resolved-issue
records, compute per-repo `RepoMetrics` (issue-resolution rate, regression-free
success rate, human acceptance rate, accepted-with-edits rate, time-to-first-
correct-patch, cost per resolved issue) for the three conditions:

- `stz-stateless`  — STZ with no persisted learnings
- `stz-stateful`   — STZ 0.9.5 as shipped
- `human-assisted` — the human-in-the-loop reference

```bash
$STZ bridge eval-baseline --root . --repo <project-id> --records <records.json>
```

Writes `.stz/90-audit/baseline-report.json`.

## Exit criteria for Phase 0 (from PHASED-PLAN)

- ≥8–12 chronological held-out issues locked.
- Baseline report reproducible across two runs.
- **No new adaptive behaviour introduced yet.**

## Kill criterion

If baseline metrics are unstable across two runs, **do not add any learning
feature** — fix measurement first. A stable baseline is the precondition for
every later phase.

## Records file shape

```json
{
  "stz-stateless": [{ "issueId": "...", "outcome": { "issueId": "...", "verdict": "accepted" },
                      "resolved": true, "regressed": false, "timeToFirstCorrectPatchS": 120, "cost": 15 }],
  "stz-stateful": [ ... ],
  "human-assisted": [ ... ]
}
```
