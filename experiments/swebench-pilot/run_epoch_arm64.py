#!/usr/bin/env python3
"""
Wire the official SWE-Bench harness to Epoch AI's prebuilt **arm64** eval images,
so report-mode works natively on an aarch64 host (no x86 emulation, no local
image build). Then hand each per-instance report.json to the JS eval-adapter's
`report` mode for grading.

WHY a wrapper is needed (swebench 4.1.0):
  * `make_test_spec()` hardcodes `arch="x86_64"` and never reads the host, so the
    harness always wants x86 images (image key = `sweb.eval.{arch}.{id}`). On
    aarch64 those images can't exec ("exec format error").
  * the only path that uses a clean LOCAL image name (`namespace=None`) also
    triggers `build_env_images()`, whose pipeline hardcodes x86_64 Miniconda URLs
    and fails to build on ARM.

WHAT this does (no edits to site-packages):
  1. pull Epoch arm64 images (`ghcr.io/epoch-research/swe-bench.eval.arm64.<id>`)
     and RE-TAG them to the local name the harness expects with arch forced to
     arm64: `sweb.eval.arm64.<id>:latest`. (Epoch's all-500 Verified arm64
     coverage means these exist.)
  2. monkeypatch `make_test_spec` -> arch="arm64" and `build_env_images` -> no-op
     (Epoch images are complete; nothing to build).
  3. run the REAL harness with `namespace=None`, `cache_level=instance`,
     `predictions_path=gold` -> it finds the pre-tagged image, skips build, runs
     the official eval, and writes the official per-instance report.json.
  4. grade each report.json with `eval-adapter.mjs report` -> {passed,total,passRate}.

This keeps grading authoritative (official harness, official report schema); only
the image SOURCE and arch are swapped. Faithful to the field norm, native on ARM.

Usage:
  python run_epoch_arm64.py <run_id> <instance_id> [<instance_id> ...]
"""
import json
import os
import subprocess
import sys
from pathlib import Path

DATASET = "princeton-nlp/SWE-bench_Verified"
SPLIT = "test"
EPOCH_FMT = "ghcr.io/epoch-research/swe-bench.eval.arm64.{id}"
LOCAL_FMT = "sweb.eval.arm64.{id_lower}:latest"
HERE = Path(__file__).resolve().parent
ADAPTER = HERE / "eval-adapter.mjs"


def sh(*cmd, check=True):
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def image_present(tag):
    return sh("docker", "image", "inspect", tag, check=False).returncode == 0


def env_image_keys(instance_ids):
    """Compute each instance's arm64 env_image_key (needed only to satisfy the
    harness's env-image existence guard — see pull_and_tag)."""
    from datasets import load_dataset
    from swebench.harness.test_spec.test_spec import make_test_spec
    ds = load_dataset(DATASET, split=SPLIT)
    by_id = {r["instance_id"]: r for r in ds}
    return {iid: make_test_spec(by_id[iid], arch="arm64").env_image_key
            for iid in instance_ids if iid in by_id}


def pull_and_tag(instance_ids, env_keys):
    """Pull each Epoch arm64 image and re-tag to the harness's local arm64 name.

    Also alias it to the instance's env_image_key: `build_instance_image` checks
    that the env image EXISTS before it checks whether the instance image exists,
    and Epoch ships only instance images. Since the instance image is present the
    env image is never actually used to build — the alias just passes the guard.
    """
    for iid in instance_ids:
        local = LOCAL_FMT.format(id_lower=iid.lower())
        env_key = env_keys.get(iid)
        if image_present(local):
            print(f"[image] {local} already present", flush=True)
        else:
            remote = EPOCH_FMT.format(id=iid)
            print(f"[pull ] {remote}", flush=True)
            p = sh("docker", "pull", remote, check=False)
            if p.returncode != 0:
                print(f"[ERROR] pull failed for {iid}:\n{p.stderr[-500:]}", flush=True)
                continue
            sh("docker", "tag", remote, local)
            print(f"[tag  ] {remote} -> {local}", flush=True)
        if env_key and not image_present(env_key):
            sh("docker", "tag", local, env_key)
            print(f"[alias] {local} -> {env_key} (env-guard)", flush=True)


def patch_harness_for_arm64():
    """Force arch=arm64 and disable the (x86-only) env-image build."""
    import swebench.harness.run_evaluation as re
    import swebench.harness.test_spec.test_spec as ts

    orig = ts.make_test_spec

    def arm64_spec(instance, namespace=None, base_image_tag=ts.LATEST,
                   env_image_tag=ts.LATEST, instance_image_tag=ts.LATEST, arch="arm64"):
        # Force arm64 regardless of caller; keep namespace=None for a clean local key.
        return orig(instance, namespace, base_image_tag, env_image_tag,
                    instance_image_tag, arch="arm64")

    ts.make_test_spec = arm64_spec
    re.make_test_spec = arm64_spec           # run_evaluation imported the symbol directly
    re.build_env_images = lambda *a, **k: None  # Epoch images are complete; never build


def run_harness(run_id, instance_ids, report_dir):
    from swebench.harness.run_evaluation import main
    # The harness writes per-instance logs/reports to CWD/logs — chdir into the
    # run dir so they land there (and grade_with_adapter finds them), not in the
    # repo. Timeout is short so a genuine hang becomes a clean DNF, not a 30-min block.
    timeout = int(os.environ.get("STZ_TIMEOUT", "300"))
    os.chdir(report_dir)
    main(
        dataset_name=DATASET, split=SPLIT, instance_ids=instance_ids,
        predictions_path="gold", max_workers=2, force_rebuild=False,
        cache_level="instance", clean=False, open_file_limit=4096,
        run_id=run_id, timeout=timeout, namespace=None, rewrite_reports=False,
        modal=False, report_dir=str(report_dir),
    )


def grade_with_adapter(run_id, instance_ids, report_dir):
    """Run the JS adapter's report-mode over each per-instance report.json."""
    rows = []
    base = report_dir / "logs" / "run_evaluation" / run_id / "gold"
    for iid in instance_ids:
        rpt = base / iid / "report.json"
        if not rpt.exists():
            rows.append({"instance": iid, "status": "NO_REPORT"})
            continue
        p = sh("node", str(ADAPTER), "report", "--report", str(rpt), "--instance", iid, check=False)
        line = (p.stdout.strip().splitlines() or ["{}"])[-1]
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            d = {"status": "PARSE_ERROR", "raw": line[:200]}
        d["instance"] = iid
        rows.append(d)
    return rows


def main_cli():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    run_id, instance_ids = sys.argv[1], sys.argv[2:]
    # Heavy harness logs go to STZ_RUN_DIR (default: gitignored runs/ in the pilot dir).
    base_runs = Path(os.environ.get("STZ_RUN_DIR", HERE / "runs"))
    report_dir = base_runs / run_id
    report_dir.mkdir(parents=True, exist_ok=True)

    env_keys = env_image_keys(instance_ids)
    pull_and_tag(instance_ids, env_keys)
    patch_harness_for_arm64()
    run_harness(run_id, instance_ids, report_dir)
    rows = grade_with_adapter(run_id, instance_ids, report_dir)

    out = report_dir / "adapter-summary.json"
    out.write_text(json.dumps(rows, indent=2))
    print("\n=== adapter report-mode summary ===")
    for r in rows:
        print(f"  {r['instance']:32s} resolved={r.get('resolved')!s:5s} "
              f"passRate={r.get('passRate')} status={r.get('status')}")
    n_res = sum(1 for r in rows if r.get("resolved") is True)
    print(f"resolved {n_res}/{len(rows)} (all GOLD -> expect all True)  | summary: {out}")


if __name__ == "__main__":
    main_cli()
