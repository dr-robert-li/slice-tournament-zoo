---
description: Start an STZ project. Interrogate the user to extract intent, constraints, and machine-checkable done-conditions, then write the intent tier.
argument-hint: "[project title] [--auto @idea-doc]"
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

# /stz:new — elicitation (phase 1)

You are the STZ **orchestrator** beginning a project. This phase is interactive:
you interrogate the user with AskUserQuestion (AUQ) to extract intent. No
subagent does the asking — you do.

Read state first: `$STZ bridge project-status --root .` (if it errors with no
project, this is a fresh start). If a project exists and elicitation is already
`done`, tell the user and point at the next phase.

## Setup

If no project state exists, initialize one. Write a minimal manifest JSON
(`{schemaVersion:1, projectId, name, summary, slices:[]}`) and run
`$STZ bridge project-init --root . --manifest <that file>`.

## AUQ rules (hold to these)

- Headers ≤12 chars. 2–4 options per question. Always include a "You decide" or
  "Let me explain" option.
- Ask ONE focused question at a time; each answer shapes the next.
- If the user picks "Other" and types freeform, reply in plain text and WAIT for
  their next message. Do NOT immediately fire another AUQ.
- Options should be concrete and, where relevant, carry context (e.g. an option
  that names an existing module or a real library choice).

## The area loop

Work through these areas in order. Announce each area in one plain line, then ask
~4 questions, then a continuation checkpoint.

- **(A) Problem & intent** — what breaks today, who feels it, what "better" means.
- **(B) Users & usage** — who runs this, how often, in what environment.
- **(C) Constraints** — performance, dependencies, platform, deadlines, things
  that are off the table.
- **(D) Done-conditions** — this is the one that cannot be skipped. Drive every
  success criterion to a machine-checkable predicate. For each: ask its kind
  (`Sealed test passes` / `Metric threshold` / `Schema/shape match` / `You write
  it`) then ask for the exact expression (offer concrete templates like
  `p95_latency_ms < 200`, `coverage >= 0.9`, `returns [] on empty input`).

After each area, checkpoint with AUQ: header `Continue`, question "More on
<area>, or next? Remaining: <list>", options `[Next area, More on <area>, Skip
remaining, You decide]`. Record the resolved area:
`$STZ bridge project-record-area --root . --phase elicitation --area <A|B|C|D>
--resolution "<one line>"`.

After the last area, run the gray-areas loop: header `Gaps?`, question "Which
gray areas remain?", options built from anything still fuzzy plus "Nothing —
proceed". Loop until the user proceeds.

## Exit (mandatory predicate gate, F2)

You may not finish elicitation with zero machine-checkable predicates. If the
user gave only prose, push once more for at least one predicate.

Assemble an intent file `{problem, users, constraints[], donePredicates[{id,expr,
kind}], areas[]}` and run:
- `$STZ bridge project-write-intent --root . --intent <that file>`
- `$STZ bridge project-phase --root . --phase elicitation`

Then show the user the captured intent and the predicates, and hand off:
**▶ Next up: `/stz:research`**.

## --auto

With `--auto` (optionally `@idea-doc`), ask only the questions whose answers are
genuinely ambiguous, default the rest, but STILL confirm at least one
done-predicate with the user (never auto-invent acceptance), then chain to
`/stz:research --auto`.
