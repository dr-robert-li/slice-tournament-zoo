#!/usr/bin/env python3
"""
Grade ONE candidate patch against a SWE-Bench instance's truth oracle, inside the
Epoch arm64 image (native aarch64, pinned interpreter+deps). Mirrors the official
eval: reset /testbed to base, apply the instance's test_patch (adds the F2P/P2P
tests), apply the CANDIDATE patch, run exactly FAIL_TO_PASS+PASS_TO_PASS, parse
JUnit with the JS adapter core → {resolved,passRate,...}.

A candidate whose diff does NOT `git apply` is a REAL unresolved (apply_failed),
never silently dropped (pre-reg discipline).

Usage:
  python grade_candidate.py <instance_id> <candidate.patch> [--out result.json]
  # special: candidate path "GOLD" grades the instance's own gold patch (sanity).
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ADAPTER = HERE / "eval-adapter.mjs"
DATASET = "princeton-nlp/SWE-bench_Verified"
LOCAL_IMG = "sweb.eval.arm64.{id_lower}:latest"


def load_instance(iid):
    from datasets import load_dataset
    ds = load_dataset(DATASET, split="test")
    return next(r for r in ds if r["instance_id"] == iid)


def grade(iid, candidate_path, out_path=None):
    inst = load_instance(iid)
    img = LOCAL_IMG.format(id_lower=iid.lower())
    f2p = json.loads(inst["FAIL_TO_PASS"]) if isinstance(inst["FAIL_TO_PASS"], str) else inst["FAIL_TO_PASS"]
    p2p = json.loads(inst["PASS_TO_PASS"]) if isinstance(inst["PASS_TO_PASS"], str) else inst["PASS_TO_PASS"]

    work = Path(out_path).parent if out_path else HERE
    work.mkdir(parents=True, exist_ok=True)
    (work / "_test.patch").write_text(inst["test_patch"])
    if str(candidate_path) == "GOLD":
        (work / "_cand.patch").write_text(inst["patch"])
    else:
        (work / "_cand.patch").write_text(Path(candidate_path).read_text())
    (work / "_tests.txt").write_text("\n".join(f2p + p2p))

    # In-container: reset, apply test patch (must succeed), apply candidate (may fail),
    # run named tests -> junit. We mark APPLY_FAIL distinctly so it scores unresolved.
    script = r"""
set -o pipefail
source /opt/miniconda3/etc/profile.d/conda.sh && conda activate testbed
cd /testbed
git reset --hard -q HEAD && git clean -fdq
git apply --whitespace=nowarn /work/_test.patch || { echo "TESTPATCH_FAIL"; exit 3; }
if ! git apply --whitespace=nowarn /work/_cand.patch 2>/work/_apply.err; then
  echo "CAND_APPLY_FAIL"; exit 4
fi
mapfile -t TESTS < /work/_tests.txt
python -m pytest "${TESTS[@]}" -p no:cacheprovider --no-header -q \
  --junitxml=/work/_junit.xml >/work/_pytest.out 2>&1 || true
echo "RAN"
"""
    p = subprocess.run(
        ["docker", "run", "--rm", "-v", f"{work}:/work", img, "bash", "-lc", script],
        capture_output=True, text=True, timeout=900,
    )
    tail = (p.stdout + p.stderr).strip().splitlines()[-3:]
    if "CAND_APPLY_FAIL" in p.stdout:
        res = {"instance": iid, "resolved": False, "passRate": 0, "status": "APPLY_FAIL",
               "fail_to_pass": {"passed": 0, "total": len(f2p)},
               "pass_to_pass": {"passed": 0, "total": len(p2p)}}
    elif "TESTPATCH_FAIL" in p.stdout:
        res = {"instance": iid, "resolved": False, "status": "TESTPATCH_FAIL", "tail": tail}
    elif not (work / "_junit.xml").exists():
        res = {"instance": iid, "resolved": False, "passRate": 0, "status": "DNF",
               "reason": "no junit", "tail": tail}
    else:
        # Grade via the JS adapter core (parseJUnit + verdict) for a single source of truth.
        node = subprocess.run(
            ["node", "--input-type=module", "-e", f"""
import {{ readFileSync }} from "node:fs";
import {{ parseJUnit, matchOutcomes, verdict }} from "{ADAPTER}";
const f2p={json.dumps(f2p)}, p2p={json.dumps(p2p)};
const v=verdict(matchOutcomes(parseJUnit(readFileSync("{work}/_junit.xml","utf8")),[...f2p,...p2p]),f2p,p2p);
console.log(JSON.stringify(v));
"""],
            capture_output=True, text=True,
        )
        v = json.loads(node.stdout.strip().splitlines()[-1])
        v["instance"] = iid
        v["status"] = "ran"
        res = v

    # cleanup scratch
    for f in ["_test.patch", "_cand.patch", "_tests.txt", "_junit.xml", "_pytest.out", "_apply.err"]:
        (work / f).unlink(missing_ok=True)
    if out_path:
        Path(out_path).write_text(json.dumps(res, indent=2))
    print(json.dumps(res))
    return res


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--out"]
    out = None
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
        args = [a for a in args if a != out]
    if len(args) < 2:
        print(__doc__); sys.exit(2)
    grade(args[0], args[1], out)
