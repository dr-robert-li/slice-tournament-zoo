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
```
