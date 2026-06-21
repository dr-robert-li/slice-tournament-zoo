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
- **Batch questions per area.** AskUserQuestion takes up to 4 questions in one
  call — ask a whole area as ONE grouped AUQ call (≤4 questions) instead of one
  at a time, to cut round-trips. The one exception is area D (done-conditions),
  which is inherently sequential: ask the predicate *kind* first, then the exact
  expression conditioned on that kind.
- If the user picks "Other" and types freeform, reply in plain text and WAIT for
  their next message. Do NOT immediately fire another AUQ.
- Options should be concrete and, where relevant, carry context (e.g. an option
  that names an existing module or a real library choice).

## The area loop

Work through these areas in order. Announce each area in one plain line, then
fire ONE grouped AUQ (≤4 questions) for the area, then a continuation checkpoint.

- **(A) Problem & intent** — what breaks today, who feels it, what "better" means.
- **(B) Users & usage** — who runs this, how often, in what environment.
- **(C) Constraints** — performance, dependencies, platform, deadlines, things
  that are off the table.
- **(D) Done-conditions** — this is the one that cannot be skipped, and the one
  area kept sequential. Drive every success criterion to a machine-checkable
  predicate. For each: ask its kind (`Sealed test passes` / `Metric threshold` /
  `Schema/shape match` / `You write it`) then ask for the exact expression (offer
  concrete templates like `p95_latency_ms < 200`, `coverage >= 0.9`, `returns []
  on empty input`).

After each area, checkpoint with AUQ: header `Continue`, question "More on
<area>, or next? Remaining: <list>", options `[Next area, More on <area>, Skip
remaining, You decide]`. Record the resolved area:
`$STZ bridge project-record-area --root . --phase elicitation --area <A|B|C|D>
--resolution "<one line>"`.

After the last area, run the gray-areas loop: header `Gaps?`, question "Which
gray areas remain?", options built from anything still fuzzy plus "Nothing —
proceed". Loop until the user proceeds.

## Run configuration (area E — sets how the rest of the pipeline runs)

Before the predicate gate, capture the run config the downstream commands
consume. Fire ONE grouped AUQ (≤4 questions) covering granularity, fan-out, and
strictness, then a second focused AUQ for the model combination. Every choice has
a sensible default — the user may "You decide" any of them.

- **Slicing granularity** (header `Slicing`) — how finely `/stz:slice` breaks the
  work: `[coarse, balanced, fine, You decide]`. → `granularity`.
- **Specimen fan-out** (header `Fan-out`) — how many specimens N each slice's
  tournament runs: `[3, 4, 6, You decide]` (clamped to 2–16; 4 is the workstation
  default, up to 16 for cloud/CI). → `fanout`.
- **Strictness** (header `Strictness`) — the conventions/testing bar:
  `[relaxed, standard, strict, You decide]`. Map the pick to `strictness`:
  relaxed → `{coverageTarget:0.7, mutationPolicy:lenient, conventions:relaxed}`,
  standard → `{0.9, standard, standard}`, strict → `{0.95, strict, strict}`. If
  the user wants finer control, ask for coverage target / mutation policy
  (`off|lenient|standard|strict`) / conventions (`relaxed|standard|strict`)
  individually in plain text.
- **Model combination per role** (header `Models`) — which model handles each of
  planning, research, execution, testing, validation, judging. Offer a few
  suggested combos as options, each with a one-line rationale, plus free-form
  "Other" (the get-shit-done pattern — the user can type any combo or model id):
  - **Balanced** (default) — `research=haiku` (cheap, high-volume), everything
    else `sonnet`, `judging=opus` (strong where the verdict matters).
  - **Thrifty** — `haiku` for research + execution, `sonnet` for the rest.
  - **Max quality** — `opus` for judging + planning + testing, `sonnet` for the
    rest.
  - **Other** — let the user type a per-role map or override single roles.

  Use spawn aliases (`opus` / `sonnet` / `haiku` / `fable`) so the values drop
  straight into an Agent `model` override; a free-form model id is also accepted.

Assemble a config file `{granularity, fanout, models:{planning,research,
execution,testing,validation,judging}, strictness:{coverageTarget,mutationPolicy,
conventions}}` (omit any field to keep its default) and persist it:
`$STZ bridge project-set-config --root . --config <that file>`. Echo back the
resolved config the command prints (fan-out may have been clamped). With
`--auto`, default the whole config and skip the questions.

## Exit (mandatory predicate gate, F2)

You may not finish elicitation with zero machine-checkable predicates. If the
user gave only prose, push once more for at least one predicate.

Assemble an intent file `{problem, users, constraints[], donePredicates[{id,expr,
kind}], areas[]}` and run:
- `$STZ bridge project-write-intent --root . --intent <that file>`
- `$STZ bridge project-phase --root . --phase elicitation`

## Dark-factory mode (ask AFTER the predicate gate)

Once — and only once — the done-predicates are locked (the F2 gate is the one
human checkpoint that can never be skipped), offer the autonomous end-to-end run.
Fire ONE AUQ: header `Dark mode`, question "Run the rest of the pipeline as a
dark factory — fully autonomous, no human in the loop, just a completion summary
at the end? (You can flip this any time.)", options:
- **Stay hands-on** (default) — keep the human gates (`/stz:slice` approval and
  the `/stz:run` winner approval). Recommended for the first run on a project.
- **Engage dark factory** — skip every downstream human gate and drive
  research → … → slicing → every per-slice tournament → summary autonomously.
  The done-predicates you just confirmed are the contract it runs against.
- **You decide** — keep it off.

If the user engages it, run `$STZ bridge project-dark-factory --root . --on`
(persists `darkFactory:true` into run-config.json without disturbing the run
config you just set). With `--auto`, default to **off** unless the idea-doc or the
user explicitly asked for an unattended run.

Then show the user the captured intent and the predicates (and whether dark-factory
is engaged), and hand off: **▶ Next up: `/stz:research`** (or, if dark-factory is
on, immediately chain into `/stz:pipeline --auto` yourself and do not stop until
the completion report — see that command's dark-factory behaviour).

## The `--dark` flag (engage at any point)

Dark-factory is not only an elicitation-time question — it is a flag any STZ
command accepts and that you may flip mid-run. Engage it with
`$STZ bridge project-dark-factory --root . --on` (disengage with `--off`); every
command reads the resolved state from `project-status` (`darkFactory` is hoisted
to the top level) at the start of each phase, so turning it on between phases
takes effect immediately. The bridge command is the single source of truth — do
not hand-edit run-config.json.

## --auto

With `--auto` (optionally `@idea-doc`), ask only the questions whose answers are
genuinely ambiguous, default the rest (including the whole run config — call
`project-set-config` with an empty `{}` to persist the defaults), but STILL
confirm at least one done-predicate with the user (never auto-invent acceptance),
then chain to `/stz:research --auto`.
