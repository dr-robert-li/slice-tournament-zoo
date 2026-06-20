import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  scaffold,
  writeDoc,
  readDoc,
  serializeDoc,
  parseDoc,
  TIERS,
  STZ_DIR,
} from "../src/taxonomy.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-tax-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("taxonomy scaffold (§3 data store)", () => {
  it("creates the full tier tree and is idempotent", async () => {
    const created = await scaffold(root);
    expect(created.length).toBe(TIERS.length);
    for (const tier of TIERS) {
      expect(existsSync(join(root, STZ_DIR, tier))).toBe(true);
    }
    const again = await scaffold(root);
    expect(again.length).toBe(0); // nothing new created
  });
});

describe("N2 frontmatter (de)serialization round-trip", () => {
  it("round-trips scalars, arrays, and a body", () => {
    const doc = {
      frontmatter: {
        summary: "a slice summary",
        version: 3,
        sealed: true,
        dependsOn: ["slice-01", "slice-02"],
      },
      body: "# Heading\n\nbody text.",
    };
    const round = parseDoc(serializeDoc(doc));
    expect(round.frontmatter.summary).toBe("a slice summary");
    expect(round.frontmatter.version).toBe(3);
    expect(round.frontmatter.sealed).toBe(true);
    expect(round.frontmatter.dependsOn).toEqual(["slice-01", "slice-02"]);
    expect(round.body.trim()).toBe("# Heading\n\nbody text.");
  });

  it("round-trips strings with colons via quoting", () => {
    const doc = { frontmatter: { summary: "key: value with: colons" }, body: "x" };
    expect(parseDoc(serializeDoc(doc)).frontmatter.summary).toBe("key: value with: colons");
  });

  it("handles empty arrays", () => {
    const doc = { frontmatter: { summary: "s", dependsOn: [] as string[] }, body: "x" };
    expect(parseDoc(serializeDoc(doc)).frontmatter.dependsOn).toEqual([]);
  });

  it("writeDoc/readDoc persist and reload through the filesystem", async () => {
    await scaffold(root);
    await writeDoc(root, join("00-intent", "q.md"), {
      frontmatter: { summary: "elicitation summary" },
      body: "# Q\n\ncontent",
    });
    const back = await readDoc(root, join("00-intent", "q.md"));
    expect(back.frontmatter.summary).toBe("elicitation summary");
    expect(back.body).toMatch(/content/);
  });

  it("every written doc carries a non-empty summary field (N2 invariant)", async () => {
    await scaffold(root);
    await writeDoc(root, "00-intent/x.md", { frontmatter: { summary: "non-empty" }, body: "b" });
    const raw = await readFile(join(root, STZ_DIR, "00-intent/x.md"), "utf8");
    expect(raw).toMatch(/^---\nsummary:/);
  });
});
