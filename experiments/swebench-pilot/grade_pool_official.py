#!/usr/bin/env python3
"""
Grade a POOL of candidate patches per instance through the OFFICIAL swebench
harness on Epoch arm64 images (the faithful, repo-general path — handles pytest,
sympy `bin/test`, etc. via the harness's per-repo log parsers, which the quick
JUnit grader cannot). Reuses the arm64 wiring from run_epoch_arm64.py.

Input JSON (pool_patches.json): { "<instance_id>": ["<diff slot0>", "<diff slot1>", ...], ... }
An empty diff is a valid candidate (counts as unresolved: empty patch).

For each slot s in 0..N-1, runs the harness once with predictions mapping every
instance -> its slot-s patch, then reads each official report.json -> resolved.

Output: pool-graded.json = { "<iid>": [ {slot, resolved, ...}, ... ] }

Usage: python grade_pool_official.py <pool_patches.json> <out_dir>
"""
import json
import os
import sys
from pathlib import Path

import run_epoch_arm64 as R  # reuse DATASET/SPLIT + arm64 setup helpers


def grade_pool(pool, out_dir):
    instance_ids = list(pool.keys())
    n = max(len(v) for v in pool.values())
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    env_keys = R.env_image_keys(instance_ids)
    R.pull_and_tag(instance_ids, env_keys)
    R.patch_harness_for_arm64()
    from swebench.harness.run_evaluation import main

    timeout = int(os.environ.get("STZ_TIMEOUT", "400"))
    graded = {iid: [None] * n for iid in instance_ids}

    for slot in range(n):
        model = f"cand{slot}"
        run_id = f"pool_slot{slot}"
        slot_dir = out_dir / run_id
        slot_dir.mkdir(parents=True, exist_ok=True)
        preds = [
            {"instance_id": iid, "model_name_or_path": model, "model_patch": pool[iid][slot]}
            for iid in instance_ids if slot < len(pool[iid])
        ]
        pf = slot_dir / "preds.json"
        pf.write_text(json.dumps(preds))
        os.chdir(slot_dir)  # harness writes logs to CWD/logs
        try:
            main(
                dataset_name=R.DATASET, split=R.SPLIT, instance_ids=instance_ids,
                predictions_path=str(pf), max_workers=2, force_rebuild=False,
                cache_level="instance", clean=False, open_file_limit=4096,
                run_id=run_id, timeout=timeout, namespace=None, rewrite_reports=False,
                modal=False, report_dir=str(slot_dir),
            )
        except Exception as e:  # one bad slot must not sink the pool
            print(f"[slot {slot}] harness error: {e}", flush=True)
        base = slot_dir / "logs" / "run_evaluation" / run_id / model
        for iid in instance_ids:
            rpt = base / iid / "report.json"
            rec = {"slot": slot, "resolved": False, "status": "NO_REPORT"}
            if rpt.exists():
                d = json.loads(rpt.read_text())
                inst = d.get(iid, d)
                ts = inst.get("tests_status", {})
                f2p = ts.get("FAIL_TO_PASS", {})
                p2p = ts.get("PASS_TO_PASS", {})
                rec = {
                    "slot": slot,
                    "resolved": bool(inst.get("resolved", False)),
                    "status": "ran",
                    "f2p_pass": len(f2p.get("success", [])),
                    "f2p_total": len(f2p.get("success", [])) + len(f2p.get("failure", [])),
                    "p2p_pass": len(p2p.get("success", [])),
                    "p2p_total": len(p2p.get("success", [])) + len(p2p.get("failure", [])),
                }
            graded[iid][slot] = rec
            print(f"  slot{slot} {iid:32s} resolved={rec['resolved']} status={rec['status']}", flush=True)

    (out_dir / "pool-graded.json").write_text(json.dumps(graded, indent=2))
    # mixed-pool summary
    print("\n=== POOL SUMMARY (resolved count per instance) ===")
    mixed = 0
    for iid in instance_ids:
        rs = [g["resolved"] for g in graded[iid] if g]
        nres = sum(rs)
        kind = "MIXED" if 0 < nres < len(rs) else ("all-pass" if nres == len(rs) else "all-fail")
        if kind == "MIXED":
            mixed += 1
        print(f"  {iid:32s} {nres}/{len(rs)} resolved  -> {kind}")
    print(f"MIXED POOLS: {mixed}/{len(instance_ids)}  (only mixed pools carry selection signal)")
    return graded


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    pool = json.loads(Path(sys.argv[1]).read_text())
    grade_pool(pool, sys.argv[2])
