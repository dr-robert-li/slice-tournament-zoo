import { describe, it, expect } from "vitest";
import { detectHacks, remediationContext } from "../src/hack-detector.js";

describe("F10/L3 hack-pattern detector", () => {
  it("flags test-skip", () => {
    const f = detectHacks("a", { "x.test.ts": "it.skip('c', () => {})" });
    expect(f.map((x) => x.pattern)).toContain("test-skip");
  });

  it("flags assertion mutation (tautology)", () => {
    const f = detectHacks("a", { "x.test.ts": "expect(true).toBe(true);" });
    expect(f.map((x) => x.pattern)).toContain("assertion-mutation");
  });

  it("flags pytest skip", () => {
    const f = detectHacks("a", { "t.py": "@pytest.mark.skip\ndef test_x(): pass" });
    expect(f.map((x) => x.pattern)).toContain("test-skip");
  });

  it("flags live network egress not using fixtures", () => {
    const f = detectHacks("a", { "s.ts": "const r = await fetch('https://api.example.com');" });
    expect(f.map((x) => x.pattern)).toContain("network-bypass");
  });

  it("does NOT flag fetch against localhost/mock", () => {
    const f = detectHacks("a", { "s.ts": "await fetch('http://localhost/x'); // mock" });
    expect(f).toHaveLength(0);
  });

  it("flags fixture-keyed branching only when fixture names provided", () => {
    const code = { "s.ts": "if (input === FIXTURE_GOLDEN) return cached;" };
    expect(detectHacks("a", code, { fixtureNames: ["FIXTURE_GOLDEN"] }).length).toBeGreaterThan(0);
    expect(detectHacks("a", code, { fixtureNames: [] })).toHaveLength(0);
  });

  it("flags hardcoded expected output keyed on a sentinel", () => {
    const f = detectHacks("a", { "s.ts": "return 'EXPECTED_OUTPUT';" });
    expect(f.map((x) => x.pattern)).toContain("hardcoded-test-input");
  });

  it("clean implementation yields no findings (no false positives)", () => {
    const clean = {
      "s.ts": "export function run(x: number) {\n  return x * 2;\n}\n",
      "s.test.ts": "expect(run(2)).toBe(4);\n",
    };
    expect(detectHacks("a", clean)).toHaveLength(0);
  });

  it("ignores full-line comments (commented-out code is not a hack)", () => {
    const f = detectHacks("a", { "s.ts": "// it.skip('old', () => {})" });
    expect(f).toHaveLength(0);
  });

  it("reports precise file:line locations", () => {
    const f = detectHacks("a", { "s.ts": "ok();\nexpect(true).toBe(true);" });
    expect(f[0]!.location).toBe("s.ts:2");
  });

  it("remediationContext dedupes patterns into a prompt block", () => {
    const f = detectHacks("a", {
      "x.ts": "it.skip('a',()=>{})\nit.skip('b',()=>{})",
    });
    const ctx = remediationContext(f);
    expect((ctx.match(/test-skip/g) ?? []).length).toBe(1);
    expect(ctx).toMatch(/Do not skip/);
  });
});
