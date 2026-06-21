import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSealed, measureCoverage, measureMutation, fullEval, crossReference } from "../src/eval-runner.js";

let dir: string;
let sealed: string;

// A tiny real sealed harness: imports argv[2], checks a step function g(x) that
// must return 0 for x<5 and 1 otherwise. Prints the JSON line the runner parses.
const SEALED = `
import assert from "node:assert";
const mod = await import(process.argv[2]);
const g = mod.g;
let passed = 0, total = 0;
function check(c){ total++; try { assert.ok(c); passed++; } catch {} }
check(g(0) === 0); check(g(4) === 0); check(g(5) === 1); check(g(6) === 1); check(g(100) === 1);
const passRate = passed/total;
console.log(JSON.stringify({passed, total, passRate}));
process.exit(passRate === 1 ? 0 : 1);
`;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "stz-evalrun-"));
  sealed = join(dir, "sealed.mjs");
  await writeFile(sealed, SEALED, "utf8");
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("F7/F11 real eval runner — genuinely executed metrics", () => {
  it("runSealed reports passRate 1 for a correct impl", async () => {
    const impl = join(dir, "good.mjs");
    await writeFile(impl, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    const r = runSealed(sealed, impl);
    expect(r.passRate).toBe(1);
    expect(r.total).toBe(5);
  });

  it("runSealed reports partial passRate for a buggy impl", async () => {
    const impl = join(dir, "bad.mjs");
    await writeFile(impl, "export function g(x){ return x < 6 ? 0 : 1; }\n", "utf8");
    const r = runSealed(sealed, impl);
    expect(r.passRate).toBeLessThan(1);
  });

  it("runSealed survives an impl that throws on import (zeroed, not crash)", async () => {
    const impl = join(dir, "broken.mjs");
    await writeFile(impl, "throw new Error('boom');\n", "utf8");
    const r = runSealed(sealed, impl);
    expect(r.passRate).toBe(0);
  });

  it("measureCoverage returns a real fraction in (0,1]", async () => {
    const impl = join(dir, "good.mjs");
    await writeFile(impl, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    const cov = measureCoverage(sealed, impl);
    expect(cov).toBeGreaterThan(0);
    expect(cov).toBeLessThanOrEqual(1);
  });

  it("measureMutation: a strong suite kills the lt→lte mutant (survival 0)", async () => {
    const impl = join(dir, "good.mjs");
    await writeFile(impl, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    const m = measureMutation(sealed, impl);
    expect(m.mutants).toBeGreaterThan(0);
    expect(m.survivors).toBe(0);
    expect(m.mutationScore).toBe(0);
  });

  it("mutators target code, not comments (no behaviour-identical survivors)", async () => {
    const impl = join(dir, "commented.mjs");
    // The doc comment mentions `<` and `lo`; a naive mutator would corrupt the
    // comment and report a false survivor. Stripping comments prevents that.
    await writeFile(impl, "// returns 0 when x < 5, lo guard\nexport function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    const m = measureMutation(sealed, impl);
    expect(m.survivors).toBe(0);
  });

  it("fullEval bundles all three real measurements", async () => {
    const impl = join(dir, "good.mjs");
    await writeFile(impl, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    const e = fullEval(sealed, impl);
    expect(e.testPassRate).toBe(1);
    expect(e.coverage).toBeGreaterThan(0);
    expect(e.mutationScore).toBe(0);
  });
});

describe("cross-family reference check (0.5.0) — catches shared blind spots", () => {
  it("both-pass when two independent correct references satisfy the suite", async () => {
    const a = join(dir, "refA.mjs");
    const b = join(dir, "refB.mjs");
    // Same behaviour, independently written (ternary vs if/else) — both correct.
    await writeFile(a, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    await writeFile(b, "export function g(x){ if (x < 5) return 0; return 1; }\n", "utf8");
    const r = crossReference(sealed, a, b);
    expect(r.status).toBe("both-pass");
    expect(r.bothPass).toBe(true);
    expect(r.divergent).toBe(false);
  });

  it("divergent when the references disagree (the blind-spot signal)", async () => {
    const a = join(dir, "refA.mjs");
    const b = join(dir, "refB.mjs");
    // A is correct; B keys the boundary one off (g(5) → 0, not 1). The suite
    // asserts g(5)===1, so exactly one reference passes → real divergence.
    await writeFile(a, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    await writeFile(b, "export function g(x){ return x <= 5 ? 0 : 1; }\n", "utf8");
    const r = crossReference(sealed, a, b);
    expect(r.status).toBe("divergent");
    expect(r.divergent).toBe(true);
    expect(r.a.passRate).toBe(1);
    expect(r.b.passRate).toBeLessThan(1);
  });

  it("both-fail when neither reference satisfies the suite (a gate failure, not a cross signal)", async () => {
    const a = join(dir, "refA.mjs");
    const b = join(dir, "refB.mjs");
    await writeFile(a, "export function g(x){ return 0; }\n", "utf8");
    await writeFile(b, "export function g(x){ return 1; }\n", "utf8");
    const r = crossReference(sealed, a, b);
    expect(r.status).toBe("both-fail");
    expect(r.bothFail).toBe(true);
    expect(r.bothPass).toBe(false);
  });
});
