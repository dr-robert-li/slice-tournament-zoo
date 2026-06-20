import { describe, it, expect } from "vitest";
import { diffSpecs, renderSpecDiff, isFaithful } from "../src/specdiff.js";

describe("F13 intent vs as-built spec diff (canonical audit record)", () => {
  it("classifies kept / missing / added claims", () => {
    const intent = { claims: ["does A", "does B", "does C"] };
    const asBuilt = { claims: ["does A", "does C", "does D"] };
    const d = diffSpecs(intent, asBuilt);
    expect(d.kept.sort()).toEqual(["does A", "does C"]);
    expect(d.missing).toEqual(["does B"]);
    expect(d.added).toEqual(["does D"]);
  });

  it("is whitespace/case-insensitive on claim matching", () => {
    const d = diffSpecs({ claims: ["Does  A"] }, { claims: ["does a"] });
    expect(d.kept).toHaveLength(1);
    expect(d.missing).toHaveLength(0);
  });

  it("isFaithful is true iff nothing planned is missing", () => {
    expect(isFaithful(diffSpecs({ claims: ["A"] }, { claims: ["A", "B"] }))).toBe(true);
    expect(isFaithful(diffSpecs({ claims: ["A", "B"] }, { claims: ["A"] }))).toBe(false);
  });

  it("renders all three sections with counts", () => {
    const md = renderSpecDiff("slice-01", diffSpecs({ claims: ["A", "B"] }, { claims: ["A", "C"] }));
    expect(md).toMatch(/Delivered as planned \(1\)/);
    expect(md).toMatch(/Planned but missing \(1\)/);
    expect(md).toMatch(/Built beyond plan \(1\)/);
  });
});
