# The bridge CLI directly

STZ's deterministic half is exposed as `stz bridge <subcommand>` — JSON in,
JSON out, over the `.stz/` tree. The `/stz:*` commands call it between subagent
spawns, but it is scriptable on its own. Each subcommand prints one JSON object
and writes its artifacts under `.stz/`.

```bash
stz bridge begin        --root . --manifest .stz/40-slices/slice-01/manifest.json
stz bridge eval         --root . --slice slice-01 --specimen a \
                        --sealed .stz/30-tests/held-out/<file> \
                        --impl   .stz/40-slices/slice-01/prototypes/specimen-a/<file>
stz bridge gate         --root . --slice slice-01
stz bridge record-votes --root . --slice slice-01 --votes votes.json
stz bridge select       --root . --slice slice-01
stz bridge finalize     --root . --slice slice-01 --intent intent.json --asbuilt asbuilt.json

# project-level driver (multi-slice)
stz bridge project-set-config --root . --config run-config.json  # persist run config (validated, clamped)
stz bridge project-config     --root .                           # read it back (defaults if unset)
stz bridge project-status     --root .                           # DAG + phase status + runConfig

# sealed held-out suite integrity (L1/F10) — freeze before the tournament
stz bridge seal        --root .                       # sha256 the held-out suite into SEAL.json
stz bridge seal-verify --root .                       # re-hash vs SEAL.json; exit 1 on drift (gate before judging)
stz bridge seal-amend  --root . --reason "<why>"      # sanctioned post-freeze change: records from→to + reason
```

The sealed-suite trio backs the anti-hacking freeze: `seal` after the test-author's
suite passes the smoke gate against its reference; `seal-verify` immediately before
the eval/gate so a frozen-suite edit can't slip in mid-tournament; `seal-amend` as
the only audited way to change a sealed file once frozen. The guide-vs-sensor
contract behind it (what the smoke gate does and does NOT catch, where the
reference lives, how failures are classified) is in
[`sealed-suite.md`](./sealed-suite.md).
