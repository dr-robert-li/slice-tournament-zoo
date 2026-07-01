---
description: STZ 0.9.6 Contract Plane — co-build a typed contract (draft → refine → human-accept), then verify it separates from the functional suite before it can bound an arena run.
argument-hint: "[draft|refine|verify|separation-gate|accept] ..."
---

## Setup: locate the bridge

This plugin is not on your PATH. Resolve the bridge CLI once and use `$STZ`:

```bash
if command -v stz >/dev/null 2>&1; then STZ='stz';
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs" ]; then STZ="node ${CLAUDE_PLUGIN_ROOT}/bin/stz.mjs";
else STZ="node $(ls -d ~/.claude/plugins/cache/*/stz/*/bin/stz.mjs 2>/dev/null | sort -V | tail -1)"; fi
echo "using bridge: $STZ"
```

# /stz:contract — the Contract Plane (Phase 1)

The contract is the net-new bounded correctness object: typed `requirement` +
`predicate` artifacts that the arena competes against, with an explicit state
machine `draft → proposed → accepted → active`. Agents **propose**; a human
**alone accepts** (the 7th gate). This asymmetry is the exogenous signal that
makes STZ's self-improvement bounded and defensible.

## Subcommands

### `draft` — author a contract from intent
Spawn **stz-contract-architect** on `.stz/00-intent/`. It writes proposed
requirements under `.stz/contract/requirements/` and predicates under
`.stz/contract/predicates/`. Prefer boundary/compatibility cases the functional
suite is likely to miss.

### `refine` — clarify before accepting
Spawn **stz-clarifier** to surface ambiguity and ask the human targeted
questions, then have **stz-contract-architect** revise. Loop until crisp.

### `verify` — static gate
Spawn **stz-contract-verifier** to check schema, symbol-anchoring, non-vacuity,
and traceability. Well-formed ≠ separating — proceed to `separation-gate` next.

### `separation-gate` — the Phase-1 go/no-go (REQUIRED before build-out)
Confirm the contract carries a signal the functional suite does not: a naive
impl must pass the suite yet fail ≥1 predicate.

```bash
$STZ bridge separation-gate --root . \
  --contract .stz/contract/predicates.json \
  --impl <naive-impl.mjs> --suite <sealed-suite.mjs>
```

Exit 0 + `"separated": true` → the contract is real; proceed. Exit 1 +
`"separated": false` → **STOP**: the contract is redundant with the suite. Record
the negative (symmetric-error rule); do not build the contract into runs.

### `accept` — the human 7th gate
Only a human runs this. `--approver` must be a real human identity; an agent role
is rejected.

```bash
$STZ bridge contract-accept --artifact <artifact.json> --approver "<your-name>" --at <YYYY-MM-DD>
```

## Boundedness rules (do not violate)

- Agents may only produce `proposed` artifacts; only `contract-accept` crosses
  into trusted state.
- No implementation agent authors a contract used to judge its own work.
- A contract that does not pass the separation gate never bounds a run.
