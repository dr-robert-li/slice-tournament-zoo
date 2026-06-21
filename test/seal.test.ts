import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seal, verifySeal, amendSeal, readSeal, heldOutFiles, SEAL_NAME } from "../src/seal.js";
import { STZ_DIR } from "../src/taxonomy.js";

let root: string;
let held: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-seal-"));
  held = join(root, STZ_DIR, "30-tests", "held-out");
  await mkdir(held, { recursive: true });
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const write = (rel: string, body: string) =>
  writeFile(join(held, rel), body, "utf8");

describe("sealed held-out suite integrity (L1/F10)", () => {
  it("seals every held-out file and verifies green right after", async () => {
    await write("suite.rs", "fn t() {}");
    await write("reference.rs", "fn ref_impl() {}");
    const res = await seal(root);
    expect(res.sealed).toBe(true);
    expect(res.added.sort()).toEqual(["reference.rs", "suite.rs"]);
    const v = verifySeal(root);
    expect(v.ok).toBe(true);
    expect(v.drift).toEqual([]);
  });

  it("SEAL.json is never part of its own manifest (no self-drift)", async () => {
    await write("suite.rs", "fn t() {}");
    await seal(root);
    const m = readSeal(root)!;
    expect(Object.keys(m.files)).not.toContain(SEAL_NAME);
    expect(heldOutFiles(root)).not.toContain(SEAL_NAME);
    // a second verify after sealing stays green — SEAL.json itself isn't tracked
    expect(verifySeal(root).ok).toBe(true);
  });

  it("a silent edit to a sealed file fails verify; amend records it and restores green", async () => {
    await write("suite.rs", "fn t() { assert!(true); }");
    await seal(root);
    expect(verifySeal(root).ok).toBe(true);

    // tamper with the frozen file
    await write("suite.rs", "fn t() { assert!(false); }");
    const drifted = verifySeal(root);
    expect(drifted.ok).toBe(false);
    expect(drifted.drift).toEqual([{ file: "suite.rs", status: "modified" }]);

    // the sanctioned fix path records from→to + reason and re-freezes
    const amend = await amendSeal(root, "fix unsatisfiable assertion");
    expect(amend.amended).toBe(true);
    expect(amend.changed[0]!.file).toBe("suite.rs");
    expect(amend.changed[0]!.from).not.toBe(amend.changed[0]!.to);
    expect(verifySeal(root).ok).toBe(true);

    const m = readSeal(root)!;
    expect(m.amendments).toHaveLength(1);
    expect(m.amendments[0]!.reason).toBe("fix unsatisfiable assertion");
  });

  it("verify reports added and removed files as drift", async () => {
    await write("suite.rs", "fn t() {}");
    await seal(root);
    await write("sneaked.rs", "fn extra() {}"); // added after freeze
    const v = verifySeal(root);
    expect(v.ok).toBe(false);
    expect(v.drift).toContainEqual({ file: "sneaked.rs", status: "added" });
  });

  it("re-sealing adds NEW files but refuses to launder a changed sealed file", async () => {
    await write("slice-01.rs", "a");
    await seal(root);
    // a new slice's suite arrives → seal should fold it in
    await write("slice-02.rs", "b");
    const ok = await seal(root);
    expect(ok.sealed).toBe(true);
    expect(ok.added).toEqual(["slice-02.rs"]);

    // but if an already-sealed file changed, plain `seal` must refuse
    await write("slice-01.rs", "a-tampered");
    const blocked = await seal(root);
    expect(blocked.sealed).toBe(false);
    expect(blocked.drifted).toEqual(["slice-01.rs"]);
  });

  it("verify on a never-sealed dir is not sealed", async () => {
    await write("suite.rs", "fn t() {}");
    const v = verifySeal(root);
    expect(v.sealed).toBe(false);
    expect(v.ok).toBe(false);
  });

  it("manifest file ordering is stable (sorted) regardless of write order", async () => {
    await write("z.rs", "z");
    await write("a.rs", "a");
    await write("m.rs", "m");
    await seal(root);
    expect(Object.keys(readSeal(root)!.files)).toEqual(["a.rs", "m.rs", "z.rs"]);
  });
});
