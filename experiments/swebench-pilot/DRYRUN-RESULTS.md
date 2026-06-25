# DRYRUN-RESULTS — report-mode wired to Epoch arm64, 5 Verified instances (2026-06-25)

Proves the **authoritative** path end-to-end on this aarch64 host: official `swebench` harness →
real per-instance `report.json` → `eval-adapter.mjs report`. All grading is the official oracle;
only the image SOURCE (Epoch arm64) and `arch` are swapped. Driver: `run_epoch_arm64.py`.

## Result (gold predictions, `STZ_TIMEOUT=300`)

| instance | resolved | passRate | F2P | P2P | note |
|----------|----------|----------|-----|-----|------|
| psf__requests-1142  | ✅ true  | 1.000 | 1/1 | 5/5  | local test |
| pallets__flask-5014 | ✅ true  | 1.000 | 1/1 | 59/59 | local tests |
| psf__requests-2931  | ✅ true  | 1.000 | 1/1 | 84/84 | local test |
| psf__requests-1724  | ❌ false | 0.647 | 0/6 | 55/79 | **network** |
| psf__requests-1766  | ❌ false | 0.671 | 0/6 | 57/79 | **network** |

**3/5 gold-resolved.** Every instance produced a real `report.json` (`source: swebench-report`)
and the adapter graded each correctly — the **wiring + report-mode are validated**.

### The two failures are NOT arch / adapter / wiring bugs

`requests-1724` and `requests-1766` are ~2013-era instances whose oracle tests call a live
`httpbin(...)` service (`test_HTTP_200_OK_*`, `DIGEST_AUTH`, `POSTBIN`, cookie-on-redirect). The
container has no network egress → httpbin returns **503** → ALL 6 F2P fail *even with the gold
patch* (0/6). A gold patch that can't make its own F2P pass = an environment dependency, not a
code/grade problem. Orthogonal to aarch64.

**Pilot implication:** either (a) filter network-dependent instances (most of SWE-bench Verified
is hermetic), or (b) grant the eval container network egress for those instances. SWE-bench
Verified was curated to reduce this, but a few network-bound instances remain — select around them.

## How the wiring works (`run_epoch_arm64.py`)

swebench 4.1.0 hardcodes `arch="x86_64"` in `make_test_spec` and its build pipeline hardcodes
x86 Miniconda URLs, so the harness neither requests nor can build arm64 images. The driver, with
**no edits to site-packages**:

1. pulls Epoch arm64 images (`ghcr.io/epoch-research/swe-bench.eval.arm64.<id>`, all 500 Verified)
   and re-tags each to the harness's local name `sweb.eval.arm64.<id>:latest`;
2. also aliases each to its `env_image_key` — `build_instance_image` checks the env image EXISTS
   before checking the instance image exists, and Epoch ships only instance images; the alias
   passes the guard (the env image is never used once the instance image is present);
3. monkeypatches `make_test_spec` → `arch="arm64"` and `build_env_images` → no-op;
4. runs the real harness (`namespace=None`, `cache_level=instance`, gold) → it reuses the tagged
   images, skips all builds, runs the official eval, writes `report.json`;
5. grades each `report.json` with `eval-adapter.mjs report`.

Reproduce:
```bash
export STZ_RUN_DIR=/path/out STZ_TIMEOUT=300
python run_epoch_arm64.py <run_id> psf__requests-1142 pallets__flask-5014 psf__requests-2931 ...
```
(`runs/`, `logs/`, `gold.*.json` are gitignored — heavy harness artifacts stay out of the repo.)
