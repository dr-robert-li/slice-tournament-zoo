# ENV-FINDINGS — running the SWE-Bench substrate on this host (2026-06-25)

Validating the eval adapter against a real instance (`pallets__flask-4045`, gold patch)
surfaced **two independent environment blockers on this host**. Both are provisioning issues —
the "hard 80%" the advisor flagged — **not** adapter defects. On every failure the adapter did
the right thing: it emitted a contract-shaped `DNF`/`ERROR` line with the precise cause, never a
false `0` scored as a real result.

## Host

- arch: **aarch64** (ARM — Grace/GH200-class DGX), `docker arch: aarch64`, default runtime `runc`.
- Python: **3.13.12** (system/conda), pytest 9 available.
- Docker 29.2.1, daemon healthy; plain `busybox sleep` container stays up fine.
- Shared host: a `dgx-vllm` (`wp-v4-judge-vllm`) container is live — do NOT mutate the daemon.

## Blocker 1 — official `report` mode: x86_64 images can't exec on ARM

`python -m swebench.harness.run_evaluation --predictions_path gold --instance_ids
pallets__flask-4045` built/pulled `swebench/sweb.eval.**x86_64**.pallets_1776_flask-4045` and the
container exited ~100 ms after start:

```
exec /bin/bash: exec format error
```

SWE-Bench's published eval images are x86_64; this host is aarch64 and **no qemu-x86 binfmt is
registered**, so the container dies before `copy_to_container` → harness reports `error_instances:
1`. Registering qemu-user-static (host-wide) or building arm64 images locally is heavy and
partial (not all instances have arm64 recipes), and mutating a shared production daemon is out of
scope. **The authoritative report-mode path needs an x86_64 host.**

> Note: the adapter's report-mode parser is independently unit-tested against the official
> `report.json` schema (`tests_status.{FAIL_TO_PASS,PASS_TO_PASS}`, `resolved`) — it is ready to
> consume a real report the moment one is produced on an x86 box.

## Blocker 2 — native `pytest` mode: needs the instance's exact pinned toolchain

Provisioning flask natively on ARM (clone @ base_commit, apply test+gold patches, venv) and
grading via the adapter's `pytest` mode peeled back **three** version pins in sequence — each one
exactly what the official env image encodes:

1. `ImportError: cannot import name 'url_quote' from 'werkzeug.urls'` → modern werkzeug; flask
   2.0-era needs `werkzeug<2.1`. (adapter → DNF, cause shown)
2. `AttributeError: module '_pytest.monkeypatch' has no attribute 'notset'` → modern pytest;
   the era conftest needs an old pytest. (adapter → all-fail via JUnit `<error>` children)
3. `DeprecationWarning: ast.Str is deprecated ... removed in Python 3.14` → **Python 3.13** breaks
   pytest-7.1's assertion rewriter; the instance's pinned interpreter is Python 3.9/3.10.

Chasing pins by hand is the precise fragility the official harness exists to remove; on Python
3.13 the era interpreter can't even be satisfied. **Native provisioning here would require a
per-instance conda env at the pinned Python + deps — i.e. reimplementing the harness.**

## What this means for the pilot (actionable)

- **Adapter is done and proven on real data** — verdict rule, report.json schema, JUnit node-id
  matching (incl. real parametrized ids), and DNF/ERROR surfacing all validated.
- **Run the pilot on an x86_64 host.** There the official `swebench` harness builds/pulls the
  pinned per-instance images and emits `report.json`; feed it to `eval-adapter.mjs report` —
  zero hand-pinning, fully faithful. This is the recommended path.
- If ARM is unavoidable: stand up per-instance conda envs at the instance's pinned Python+deps
  (heavy), then use `eval-adapter.mjs pytest --cwd <provisioned-checkout>`. The adapter supports
  it; the provisioning is the cost.
- Either way the substrate is ready; the remaining work is **host/provisioning**, not code.

## Reproduction (for the record)

```
pip install swebench            # 4.1.0
# Blocker 1:
python -m swebench.harness.run_evaluation --dataset_name princeton-nlp/SWE-bench_Lite \
  --predictions_path gold --max_workers 1 --run_id probe --instance_ids pallets__flask-4045
# -> error_instances: 1 ; image swebench/sweb.eval.x86_64...flask-4045 ; "exec format error"
# Blocker 2: native clone+patch+venv on Python 3.13 -> werkzeug/pytest/ast.Str pins cascade
```
