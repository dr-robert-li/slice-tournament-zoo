# swebench-pilot — Python/pytest eval substrate for the STZ-vs-frontier benchmark

This pilot supplies the missing piece the decision chain identified: a way to grade
SWE-Bench tasks **faithfully to the field's norms** so STZ's "absolute better outcomes
demonstrable on SWE-Bench" claim can actually be tested. See `../HANDOFF.md` ▶ NEXT STEP.

> **Scope discipline:** everything here lives under `experiments/` and conforms to the
> production bridge contract *without modifying `src/`*. The adapter is a pilot instrument,
> exactly as the cron/ipv4/hexcolor pilots carry their own.

## The adapter — `eval-adapter.mjs`

A sibling **producer** of the bridge's sealed-harness contract. The bridge grades a JS
specimen by spawning `node <sealed.mjs> <impl>`, which prints a final JSON line
`{passed,total,passRate}` and exits 0 iff `passRate===1`
(see `../../src/eval-runner.ts` `runSealed`). For a Python task there is no JS sealed file —
the oracle is a repo-native pytest suite — so this adapter emits the **same final JSON line**
and the **same exit-code contract**, drop-in where a scorer would call the sealed harness.

It intentionally does **not** go through `fullEval`: V8 coverage and the JS source mutators
there are meaningless for a Python patch, and `detectHacks` matches JS patterns only. Coverage
and mutation are simply not part of the SWE-Bench oracle.

### Oracle (faithful SWE-Bench `resolved`)

```
resolved  ==  ALL FAIL_TO_PASS pass  AND  ALL PASS_TO_PASS still pass
```

running **only those named tests** (the full suite drags in unrelated flakiness).
`resolved → passRate===1`, so the existing gate semantics carry over unchanged. A non-empty
FAIL_TO_PASS is required (an empty oracle can never be a real "fix"). Partial credit
(`passRate<1`) is reported for diagnostics but **never** counts as resolved.

### Two modes

| mode | role | subprocess | when |
|------|------|------------|------|
| `report` | **authoritative** | parse official `swebench` harness `report.json` | the field-norm path — Docker per instance handles provisioning/deps |
| `pytest` | **fallback** | run named tests in an already-provisioned cwd, grade via JUnit XML | only when a faithful env is already in place |

**`report` is preferred whenever available.** Rolling our own grading is rejected by the
decision chain: it reintroduces the spec-gap-assisted-win confound the cron/hexcolor pilots
fought. The official harness (Docker per instance, per-repo log parsers) is the ground truth.

```bash
# authoritative: grade from the official harness output
node eval-adapter.mjs report --report path/to/report.json --instance django__django-12345

# fallback: grade a provisioned checkout directly (deps installed,
# base_commit + test_patch + candidate patch already applied)
node eval-adapter.mjs pytest \
  --cwd /path/to/repo \
  --f2p '["tests/test_x.py::TestC::test_fix"]' \
  --p2p '["tests/test_x.py::test_keep1","tests/test_x.py::test_keep2"]' \
  --cmd "python -m pytest" --timeout 1800000
```

Final stdout line (both modes), e.g.:
```json
{"resolved":true,"passRate":1,"passed":3,"total":3,"fail_to_pass":{"passed":1,"total":1},"pass_to_pass":{"passed":2,"total":2},"failing":[],"status":"ran"}
```
`status` is `"ran"` | `"DNF"` (timeout / no JUnit) | `"ERROR"`. DNF and ERROR are
contract-shaped (`resolved:false, passRate:0`) so a scorer never crashes on the adapter.

### Tests

```bash
node --test eval-adapter.test.mjs   # 16 tests, dep-free, no Docker/network
```
Covers the verdict rule (resolved requires all-of-both; a regressed PASS_TO_PASS breaks it;
empty FAIL_TO_PASS is never resolved), report.json parsing (keyed / single-instance /
unresolved), JUnit parse + node-id matching (pass/fail/skip, duplicate leaf names,
`path::Class::method`), and the CLI contract end-to-end via a stub `pytest`.

## Pre-registered pilot (do NOT run until criteria are committed)

Three conditions, metric = **instance resolved-rate** over a small Verified/Lite subset
(report n explicitly). Decision table is pre-registered in `../HANDOFF.md` — copy it here when
the run starts; do not re-derive criteria after seeing numbers.

| condition | what | selection signal |
|-----------|------|------------------|
| **A** STZ best-of-N | N specimens per instance | highest **sealed/held-out** signal (the STZ oracle) |
| **B** naive best-of-N | N specimens per instance | highest **public** signal (issue text only) |
| **C** frontier best-of-1 | 1 strong-model attempt | — (or a published frontier baseline) |

**Blindness (non-negotiable, carried from the sealed-suite pilots):** specimens NEVER see the
FAIL_TO_PASS set (it is the held-out oracle) or PASS_TO_PASS internals — they receive the issue
text only. The repo's existing suite is the closest analog to a "public" suite for condition B,
but FAIL_TO_PASS stays held out for all conditions. **No judge "accuracy rate" claim:** report
selection wins, not an oracle-accuracy number (any probe built from a judge's own cited bugs is
circular). Separate genuine correctness from spec-gap-assisted wins.

### Status

- [x] eval adapter (`eval-adapter.mjs`) — dual mode, 16/16 tests green.
- [x] **substrate validated on real data** — `swebench 4.1.0` installed, `SWE-bench_Lite`
      loads; adapter matched all 15 named tests of `astropy__astropy-12907` (incl. real
      parametrized ids like `test_separable[compound_model6-result6]`) → `resolved=true` with
      the gold patch; negative control (1 FAIL_TO_PASS failing) → `resolved=false`. Real
      instance schema (`FAIL_TO_PASS`/`PASS_TO_PASS`/`patch`/`test_patch`) maps cleanly to
      adapter inputs.
- [x] official `swebench` harness invoked (gold patch, `pallets__flask-4045`) — **two host-level
      env blockers found, see `ENV-FINDINGS.md`**: (1) official images are x86_64, this host is
      aarch64 → `exec format error`; (2) native ARM provisioning needs the instance's pinned
      Python 3.9/3.10 + deps, unsatisfiable on the host's Python 3.13. Adapter behaved correctly
      throughout (clean DNF/ERROR with cause). **Recommendation: run the pilot on an x86_64 host**
      where report-mode is faithful with zero hand-pinning. report-mode parser is already
      unit-tested against the official `report.json` shape.
- [x] **report-mode wired to Epoch arm64 + 5-instance dry-run** (`run_epoch_arm64.py`,
      `DRYRUN-RESULTS.md`): official harness → real `report.json` → `eval-adapter.mjs report`,
      native on aarch64. 3/5 gold-resolved; the 2 failures are network-dependent (`httpbin` 503)
      instances, not arch/adapter/wiring. Confirms the authoritative path runs on this host.
- [ ] instance set chosen (Verified subset; **filter network-dependent instances**).
- [ ] conditions A/B/C produced under blindness discipline.
- [ ] scored, decision table applied → 0.8.0 go/no-go.
