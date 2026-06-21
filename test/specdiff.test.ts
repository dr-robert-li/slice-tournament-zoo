import { describe, it, expect } from "vitest";
import {
  diffSpecs,
  renderSpecDiff,
  isFaithful,
  unmatchedIntentIds,
  mismatchedAsBuiltIds,
} from "../src/specdiff.js";

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

describe("F13 id-keyed claims (wording-independent matching)", () => {
  it("(a) matches by id even when the wording differs entirely", () => {
    const intent = { claims: [{ id: "c1", text: "player rests on row 19" }] };
    const asBuilt = { claims: [{ id: "c1", satisfied: true, text: "PLAYER_ROW const equals 19" }] };
    const d = diffSpecs(intent, asBuilt);
    expect(d.kept).toEqual(["player rests on row 19"]); // intent text shown, matched by id
    expect(d.missing).toHaveLength(0);
    expect(d.added).toHaveLength(0);
    expect(isFaithful(d)).toBe(true);
  });

  it("(b) satisfied:false is a real miss — missing, never added", () => {
    const intent = { claims: [{ id: "c1", text: "despawns bullets off-screen" }] };
    const asBuilt = { claims: [{ id: "c1", satisfied: false, evidence: "bullets persist forever" }] };
    const d = diffSpecs(intent, asBuilt);
    expect(d.missing).toEqual(["despawns bullets off-screen"]);
    expect(d.kept).toHaveLength(0);
    expect(d.added).toHaveLength(0); // matched an intent id, so not double-counted as added
    expect(isFaithful(d)).toBe(false);
  });

  it("(c) a mis-keyed verdict surfaces as missing + added, and is flagged", () => {
    const intent = { claims: [{ id: "c1", text: "exposes run()" }] };
    // documenter fumbled the id: meant c1 but wrote c9
    const asBuilt = { claims: [{ id: "c9", satisfied: true, text: "exposes run()" }] };
    const d = diffSpecs(intent, asBuilt);
    expect(d.missing).toEqual(["exposes run()"]); // c1 unaccounted for
    expect(d.added).toEqual(["exposes run()"]); // c9 matches no intent id
    expect(unmatchedIntentIds(intent, asBuilt)).toEqual(["c1"]);
    expect(mismatchedAsBuiltIds(intent, asBuilt)).toEqual(["c9"]);
  });

  it("extras (x* ids, no satisfied) are 'added', not flagged as mis-keys", () => {
    const intent = { claims: [{ id: "c1", text: "implements the contract" }] };
    const asBuilt = {
      claims: [
        { id: "c1", satisfied: true, evidence: "fn run() present" },
        { id: "x1", text: "fixed-capacity store, no heap alloc" },
      ],
    };
    const d = diffSpecs(intent, asBuilt);
    expect(d.kept).toEqual(["implements the contract"]);
    expect(d.added).toEqual(["fixed-capacity store, no heap alloc"]);
    expect(mismatchedAsBuiltIds(intent, asBuilt)).toHaveLength(0); // x1 has no `satisfied`, so not a mis-key
  });

  it("a malformed claim object (neither id nor text) does not crash the diff", () => {
    const intent = { claims: [{ id: "c1", text: "does A" }] };
    const asBuilt = { claims: [{} as { id?: string }, { id: "c1", satisfied: true }] };
    expect(() => diffSpecs(intent, asBuilt)).not.toThrow();
    const d = diffSpecs(intent, asBuilt);
    expect(d.kept).toEqual(["does A"]);
  });
});
