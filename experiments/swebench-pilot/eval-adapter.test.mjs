/**
 * Tests for the SWE-Bench eval adapter — dep-free (node:test), no Docker/network.
 * Run: node --test experiments/swebench-pilot/eval-adapter.test.mjs
 *
 * Covers the pure grading core (verdict / report parse / JUnit parse+match) plus
 * an end-to-end CLI pytest run using a stub `pytest` that emits a fixed JUnit XML,
 * so the resolved->passRate===1 contract and the exit code are exercised without
 * a real Python environment.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, chmodSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTestList, verdict, fromReport, parseJUnit, matchOutcomes } from "./eval-adapter.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ADAPTER = join(HERE, "eval-adapter.mjs");

test("parseTestList: json array, csv, and empty", () => {
  assert.deepEqual(parseTestList('["a::x", "b::y"]'), ["a::x", "b::y"]);
  assert.deepEqual(parseTestList("a::x, b::y"), ["a::x", "b::y"]);
  assert.deepEqual(parseTestList(""), []);
  assert.deepEqual(parseTestList("true"), []);
});

test("verdict: resolved requires ALL f2p AND ALL p2p green", () => {
  const f2p = ["t.py::test_fix"];
  const p2p = ["t.py::test_keep1", "t.py::test_keep2"];
  const allPass = new Map([
    ["t.py::test_fix", "pass"],
    ["t.py::test_keep1", "pass"],
    ["t.py::test_keep2", "pass"],
  ]);
  const v = verdict(allPass, f2p, p2p);
  assert.equal(v.resolved, true);
  assert.equal(v.passRate, 1);
  assert.equal(v.passed, 3);
  assert.equal(v.total, 3);
});

test("verdict: a regressed PASS_TO_PASS breaks resolved even if f2p passes", () => {
  const f2p = ["t.py::test_fix"];
  const p2p = ["t.py::test_keep1", "t.py::test_keep2"];
  const m = new Map([
    ["t.py::test_fix", "pass"],
    ["t.py::test_keep1", "pass"],
    ["t.py::test_keep2", "fail"], // regression
  ]);
  const v = verdict(m, f2p, p2p);
  assert.equal(v.resolved, false);
  assert.ok(v.passRate < 1 && v.passRate > 0); // partial credit reported
  assert.deepEqual(v.failing, ["t.py::test_keep2"]);
});

test("verdict: missing outcome counts as fail (test never ran)", () => {
  const v = verdict(new Map(), ["t.py::test_fix"], []);
  assert.equal(v.resolved, false);
  assert.equal(v.passRate, 0);
  assert.equal(v.fail_to_pass.passed, 0);
});

test("verdict: empty f2p is never resolved (guards a vacuous pass)", () => {
  const v = verdict(new Map(), [], ["t.py::keep"]);
  assert.equal(v.resolved, false);
});

test("fromReport: keyed-by-instance, trusts harness resolved", () => {
  const report = {
    "django__django-12345": {
      resolved: true,
      tests_status: {
        FAIL_TO_PASS: { success: ["t::a"], failure: [] },
        PASS_TO_PASS: { success: ["t::b", "t::c"], failure: [] },
      },
    },
  };
  const r = fromReport(report, "django__django-12345");
  assert.equal(r.resolved, true);
  assert.equal(r.passRate, 1);
  assert.equal(r.fail_to_pass.passed, 1);
  assert.equal(r.pass_to_pass.total, 2);
  assert.equal(r.source, "swebench-report");
});

test("fromReport: unresolved with failures yields partial passRate + failing list", () => {
  const report = {
    inst1: {
      resolved: false,
      tests_status: {
        FAIL_TO_PASS: { success: [], failure: ["t::a"] },
        PASS_TO_PASS: { success: ["t::b"], failure: [] },
      },
    },
  };
  const r = fromReport(report, "inst1");
  assert.equal(r.resolved, false);
  assert.equal(r.passed, 1);
  assert.equal(r.total, 2);
  assert.deepEqual(r.failing, ["t::a"]);
});

test("fromReport: single-instance object without key, no instanceId", () => {
  const report = { resolved: true, tests_status: { FAIL_TO_PASS: { success: ["x"], failure: [] }, PASS_TO_PASS: { success: [], failure: [] } } };
  const r = fromReport(report);
  assert.equal(r.resolved, true);
});

test("parseJUnit + matchOutcomes: pass/fail/skip and leaf matching", () => {
  const xml = `<?xml version="1.0"?>
  <testsuites><testsuite name="pytest" tests="3">
    <testcase classname="tests.test_mod" name="test_fix" file="tests/test_mod.py" time="0.01"/>
    <testcase classname="tests.test_mod" name="test_keep" file="tests/test_mod.py"><failure message="boom">trace</failure></testcase>
    <testcase classname="tests.test_mod" name="test_skip" file="tests/test_mod.py"><skipped/></testcase>
  </testsuite></testsuites>`;
  const cases = parseJUnit(xml);
  assert.equal(cases.length, 3);
  const ids = ["tests/test_mod.py::test_fix", "tests/test_mod.py::test_keep", "tests/test_mod.py::test_skip"];
  const out = matchOutcomes(cases, ids);
  assert.equal(out.get(ids[0]), "pass");
  assert.equal(out.get(ids[1]), "fail");
  assert.equal(out.get(ids[2]), "fail"); // skip is not a pass for SWE-Bench semantics
});

test("matchOutcomes: duplicate leaf names disambiguated by file/class", () => {
  const xml = `<testsuites><testsuite>
    <testcase classname="tests.test_a" name="test_x" file="tests/test_a.py"/>
    <testcase classname="tests.test_b" name="test_x" file="tests/test_b.py"><failure/></testcase>
  </testsuite></testsuites>`;
  const cases = parseJUnit(xml);
  const out = matchOutcomes(cases, ["tests/test_a.py::test_x", "tests/test_b.py::test_x"]);
  assert.equal(out.get("tests/test_a.py::test_x"), "pass");
  assert.equal(out.get("tests/test_b.py::test_x"), "fail");
});

test("matchOutcomes: class-method nodeid (path::Class::method)", () => {
  const xml = `<testsuites><testsuite>
    <testcase classname="tests.test_mod.TestThing" name="test_method" file="tests/test_mod.py"/>
  </testsuite></testsuites>`;
  const cases = parseJUnit(xml);
  const out = matchOutcomes(cases, ["tests/test_mod.py::TestThing::test_method"]);
  assert.equal(out.get("tests/test_mod.py::TestThing::test_method"), "pass");
});

// ---- CLI end-to-end: report mode + pytest mode (stub pytest) ----

test("CLI report mode: resolved -> exit 0 and final JSON line passRate 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "swe-cli-"));
  const report = join(dir, "report.json");
  writeFileSync(report, JSON.stringify({ inst9: { resolved: true, tests_status: { FAIL_TO_PASS: { success: ["a"], failure: [] }, PASS_TO_PASS: { success: [], failure: [] } } } }));
  const r = spawnSync("node", [ADAPTER, "report", "--report", report, "--instance", "inst9"], { encoding: "utf8" });
  assert.equal(r.status, 0);
  const last = r.stdout.trim().split("\n").pop();
  const parsed = JSON.parse(last);
  assert.equal(parsed.resolved, true);
  assert.equal(parsed.passRate, 1);
});

test("CLI report mode: unresolved -> exit 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "swe-cli-"));
  const report = join(dir, "report.json");
  writeFileSync(report, JSON.stringify({ inst: { resolved: false, tests_status: { FAIL_TO_PASS: { success: [], failure: ["a"] }, PASS_TO_PASS: { success: [], failure: [] } } } }));
  const r = spawnSync("node", [ADAPTER, "report", "--report", report], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout.trim().split("\n").pop()).resolved, false);
});

test("CLI pytest mode: stub pytest emitting JUnit -> resolved contract", () => {
  const dir = mkdtempSync(join(tmpdir(), "swe-pyt-"));
  const repo = join(dir, "repo");
  mkdirSync(repo, { recursive: true });
  // Stub `pytest`: ignores args except --junitxml=PATH, writes an all-pass XML there.
  const stub = join(dir, "pytest");
  writeFileSync(
    stub,
    `#!/usr/bin/env node
const fs = require("fs");
const out = process.argv.find(a => a.startsWith("--junitxml="));
const path = out.split("=")[1];
fs.writeFileSync(path, '<testsuites><testsuite>' +
  '<testcase classname="tests.test_mod" name="test_fix" file="tests/test_mod.py"/>' +
  '<testcase classname="tests.test_mod" name="test_keep" file="tests/test_mod.py"/>' +
  '</testsuite></testsuites>');
process.exit(0);
`,
  );
  chmodSync(stub, 0o755);
  const r = spawnSync(
    "node",
    [
      ADAPTER, "pytest",
      "--cwd", repo,
      "--cmd", `${stub} run`,
      "--f2p", '["tests/test_mod.py::test_fix"]',
      "--p2p", '["tests/test_mod.py::test_keep"]',
    ],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  const parsed = JSON.parse(r.stdout.trim().split("\n").pop());
  assert.equal(parsed.resolved, true);
  assert.equal(parsed.passRate, 1);
  assert.equal(parsed.source, "pytest");
});

test("CLI pytest mode: no JUnit produced -> DNF, exit 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "swe-dnf-"));
  const repo = join(dir, "repo");
  mkdirSync(repo, { recursive: true });
  const stub = join(dir, "noop");
  writeFileSync(stub, "#!/usr/bin/env node\nprocess.exit(2);\n");
  chmodSync(stub, 0o755);
  const r = spawnSync("node", [ADAPTER, "pytest", "--cwd", repo, "--cmd", `${stub} run`, "--f2p", "t.py::a"], { encoding: "utf8" });
  assert.equal(r.status, 1);
  const parsed = JSON.parse(r.stdout.trim().split("\n").pop());
  assert.equal(parsed.status, "DNF");
  assert.equal(parsed.resolved, false);
});

test("CLI: bad mode -> exit 2", () => {
  const r = spawnSync("node", [ADAPTER, "bogus"], { encoding: "utf8" });
  assert.equal(r.status, 2);
});
