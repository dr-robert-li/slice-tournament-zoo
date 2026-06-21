---
description: Assemble multiple slice winners into one integrated crate and validate it against every slice's sealed suite — with an audited, deterministic rule for invariants a later slice legitimately supersedes.
argument-hint: "[slice-ids... e.g. slice-02 slice-03 slice-04 slice-05 slice-06]"
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

# /stz:merge — assemble winners + validate the integration

You are the STZ **orchestrator**. When several slices branch off a common
ancestor (e.g. GameOver + waves + powerups each off the base game), a downstream
slice needs them combined into one crate that no single winner holds. This
command assembles them and proves the integration is faithful against every
contributing slice's **sealed** suite.

The hard part is honest: an EARLIER slice's sealed suite can legitimately FAIL on
the integrated crate because a LATER slice supersedes one of its invariants
(slice-03 "aliens never respawn" vs slice-05 wave-clear). That is NOT a merge
defect — but you must not *hand-wave* the distinction. The bridge adjudicates it
deterministically against an audited compat manifest; you never eyeball a panic
and decide "looks expected" on your own.

## 1. Assemble (in an ephemeral scratch copy — never mutate a winner)

Spawn ONE `stz-specimen` (or merge) subagent to assemble the named winners into a
single crate at `.stz/40-slices/_assembled/`. It composes the winning modules,
resolves the shared interfaces, and builds. It returns a path + summary, not file
dumps.

## 2. Run every contributing slice's sealed suite — in scratch, not in place

**Validation copies, it never edits the canonical crate.** For each contributing
slice, copy its sealed suite into a *throwaway* copy of `_assembled` (e.g.
`mktemp -d`), run it there, and record `{slice, passed, failure}` where `failure`
is the exact panic/assert text on a fail. Discard the scratch dir. Do NOT inject
tests into `.stz/40-slices/_assembled/` itself — a left-behind test target or a
mutated crate corrupts the audit and the next probe.

Collect the per-suite results into a JSON array
`[{ "slice": "slice-03", "passed": false, "failure": "…alien_count() rose…" }, …]`.

## 3. Adjudicate — let the bridge decide, deterministically

`$STZ bridge merge-validate --root . --results <results.json>`. It classifies
each FAILING suite against the compat manifest and **exits non-zero unless every
failure is sanctioned**. Read the verdict:

- **sanctioned** — a signature-matched, approved entry whose replacement
  invariant also passes. A legitimate supersession; proceed.
- **unsanctioned** — no entry matches the failure signature. Treat as a **real
  merge defect** until proven otherwise: re-spawn the merge agent with the panic,
  or fix the assembly. Do not invent a compat entry to silence a real bug.
- **invalid** — an entry matched but its replacement invariant did NOT pass on the
  crate. The supersession is unproven (the new behaviour isn't even there); block
  and fix the assembly, not the manifest.
- **pendingApproval** — a matched entry whose replacement passes but which is not
  yet approved. Resolve via step 4.

## 4. Compat entries — propose (agent) vs approve (you)

When a failure is a genuine supersession, record it as audited debt — never a
silent pass:

- The **merge agent may PROPOSE** (it cannot self-approve):
  `$STZ bridge merge-compat-propose --root . --entry <entry.json>` where the entry
  pins the exact `panicSubstring` (not the test name), names `supersededBy` and a
  `replacement` slice whose passing proves the new invariant, and a
  `pendingAmendment` pointer. It always lands unapproved.
- **You APPROVE**, with a reason, after confirming the superseding invariant is
  real: `$STZ bridge merge-compat-approve --root . --id <id> --by "<who/why>"`.
  The approval is recorded; a self-approval by the agent would be an auditable
  anomaly in `90-audit/merge-compat.md`, not a silent one.

Then re-run `merge-validate`. Pin the signature **tightly to the assertion
message** — a loose substring could launder a future real bug whose panic happens
to contain it while its superseding suite also passes.

## 5. Retire the debt — amend the superseded suite

A compat entry is transitional. The end state is a **wave-aware amended suite**,
not a permanent exception. Once you `$STZ bridge seal-amend --root . --reason
"<make slice-03 suite wave-aware>"` so the superseded suite encodes the new
composed invariant, retire the entry:
`$STZ bridge merge-compat-retire --root . --id <id> --amendment "<that reason>"`.
After retirement the amended suite passes outright and no exception is needed.

## Dark-factory

When `darkFactory` is true (from `project-status`), there is no human to approve a
compat entry or adjudicate an `unsanctioned`/`invalid` failure. Do NOT
auto-approve — that would defeat the gate. Instead **halt the slice** (record the
`merge-validate` verdict; it is already in `90-audit/merge-validation.md`), let
the DAG continue, and surface the blocked merge in the final `/stz:summary` for
after-the-fact review. This is the same deferral policy as a `seal-crosscheck`
divergence (0.5.1): the factory defers a human-only decision, it does not guess.

## Rules

- Flat orchestration; the merge agent returns pointers, never file dumps.
- The bridge owns the verdict. Never decide "expected interaction" in your own
  head — that is exactly the unaudited call `merge-validate` exists to replace.
- Validation runs in scratch; the canonical `_assembled` crate is never mutated by
  test injection.
