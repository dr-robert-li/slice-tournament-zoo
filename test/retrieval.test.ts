/**
 * EARN Phase 6 (guards) — selective retrieval: no bulk, per-kind cap, accepted-only,
 * mandatory explanation, repo_note disabled by default, deterministic. Pure core.
 */
import { describe, it, expect } from "vitest";
import {
  retrieve,
  auditRetrieval,
  DEFAULT_CAPS,
  type RetrievableArtifact,
  type RetrievalQuery,
} from "../src/knowledge/retrieval.js";

const art = (
  id: string,
  kind: RetrievableArtifact["kind"],
  symbols: string[],
  text: string,
  trust: RetrievableArtifact["trust"] = "accepted",
): RetrievableArtifact => ({ id, kind, symbols, text, trust });

const pool: RetrievableArtifact[] = [
  art("pred.no-dep", "predicate", ["padLeft", "package.json:dependencies"], "no gratuitous runtime dependency"),
  art("pred.ipv4-range", "predicate", ["isIPv4"], "octet range 0..255"),
  art("pred.candidate", "predicate", ["padLeft"], "unpromoted", "candidate"), // not accepted
  art("note.messy", "repo_note", ["padLeft"], "some free-form note about padding"),
  art("rubric.arch", "rubric", ["padLeft"], "architecture rubric for padding"),
];

const query: RetrievalQuery = {
  symbols: ["padLeft", "package.json:dependencies"],
  keywords: ["dependency", "padding"],
  requestedKinds: ["predicate", "repo_note", "rubric"],
  stepId: "step-1",
};

describe("Phase 6 — selective retrieval guards", () => {
  const hits = retrieve(pool, query);

  it("retrieves only relevant, ACCEPTED artifacts — never candidate-trust", () => {
    const ids = hits.map((h) => h.artifact.id);
    expect(ids).toContain("pred.no-dep");
    expect(ids).not.toContain("pred.candidate"); // candidate trust excluded
  });

  it("excludes zero-overlap artifacts (no bulk dump)", () => {
    // pred.ipv4-range shares no query symbol and no query keyword → not retrieved
    expect(hits.map((h) => h.artifact.id)).not.toContain("pred.ipv4-range");
  });

  it("disables repo_note by default (CTIM-Rover safety)", () => {
    expect(DEFAULT_CAPS.repo_note).toBe(0);
    expect(hits.map((h) => h.artifact.kind)).not.toContain("repo_note");
  });

  it("every hit carries a mandatory explanation with matched evidence", () => {
    for (const h of hits) {
      expect(h.explanation.whySelected.length).toBeGreaterThan(0);
      expect(h.explanation.score).toBeGreaterThan(0);
      expect(h.explanation.matchedSymbols.length + h.explanation.matchedKeywords.length).toBeGreaterThan(0);
    }
  });

  it("enforces per-kind caps", () => {
    const many: RetrievableArtifact[] = Array.from({ length: 10 }, (_, i) =>
      art(`pred.${i}`, "predicate", ["padLeft"], "padding dependency"),
    );
    const capped = retrieve(many, { ...query, requestedKinds: ["predicate"] });
    expect(capped.length).toBeLessThanOrEqual(DEFAULT_CAPS.predicate); // 3
  });

  it("is deterministic — same pool+query yields identical hits", () => {
    expect(retrieve(pool, query)).toEqual(retrieve(pool, query));
  });

  it("audits retrieval utility from a logged used-set (not guessed)", () => {
    const a = auditRetrieval(query, hits, ["pred.no-dep"]);
    expect(a.retrieved).toContain("pred.no-dep");
    expect(a.used).toEqual(["pred.no-dep"]);
    expect(a.utility).toBeGreaterThan(0);
  });
});
