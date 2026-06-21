import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { scaffold, STZ_DIR, TIERS } from "../src/taxonomy.js";
import {
  writeManifest,
  readManifest,
  migrate,
  manifestPath,
} from "../src/migrate.js";
import { STZ_VERSION, SCHEMA_VERSION } from "../src/version.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-mig-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("manifest stamp (F19)", () => {
  it("round-trips the current version + schema", async () => {
    await scaffold(root);
    const written = await writeManifest(root);
    expect(written).toMatchObject({ stzVersion: STZ_VERSION, schemaVersion: SCHEMA_VERSION });
    const read = await readManifest(root);
    expect(read).toMatchObject({ stzVersion: STZ_VERSION, schemaVersion: SCHEMA_VERSION });
    expect(read!.tiers).toEqual([...TIERS]);
  });

  it("returns null for a pre-manifest tree (treated as schema 0)", async () => {
    await scaffold(root); // no manifest written
    expect(await readManifest(root)).toBeNull();
  });
});

describe("migrate — additive, backed-up, idempotent", () => {
  it("throws when there is no .stz/ tree", async () => {
    await expect(migrate(root)).rejects.toThrow(/stz init/);
  });

  it("upgrades a pre-manifest tree: backup + stamp, additive", async () => {
    await scaffold(root);
    // A user artifact that must survive migration and appear in the backup.
    const userFile = join(root, STZ_DIR, "90-audit", "state.json");
    await writeFile(userFile, '{"keep":true}', "utf8");

    const report = await migrate(root);
    expect(report.upToDate).toBe(false);
    expect(report.fromSchema).toBe(0);
    expect(report.toSchema).toBe(SCHEMA_VERSION);
    expect(report.backedUpTo).toBe(join(root, `${STZ_DIR}.bak-schema0`));

    // Manifest now current.
    const read = await readManifest(root);
    expect(read).toMatchObject({ schemaVersion: SCHEMA_VERSION });

    // User file preserved in place AND in the backup (nothing destroyed).
    expect(await readFile(userFile, "utf8")).toBe('{"keep":true}');
    expect(
      await readFile(join(report.backedUpTo!, "90-audit", "state.json"), "utf8"),
    ).toBe('{"keep":true}');
  });

  it("creates missing tiers additively", async () => {
    // Hand-build a partial tree (only one tier) with no manifest.
    await mkdir(join(root, STZ_DIR, "00-intent"), { recursive: true });
    const report = await migrate(root);
    expect(report.upToDate).toBe(false);
    // Every current tier exists after migration.
    for (const t of TIERS) expect(existsSync(join(root, STZ_DIR, t))).toBe(true);
    // It created the tiers that were missing (all but the one we pre-made).
    expect(report.created).toContain("90-audit");
    expect(report.created).not.toContain("00-intent");
  });

  it("is a no-op on an already-current tree (no second backup)", async () => {
    await scaffold(root);
    await writeManifest(root);
    const report = await migrate(root);
    expect(report.upToDate).toBe(true);
    expect(report.backedUpTo).toBeNull();
    expect(report.created).toEqual([]);
  });

  it("honors --no-backup (backup:false) while still stamping", async () => {
    await scaffold(root); // pre-manifest
    const report = await migrate(root, { backup: false });
    expect(report.upToDate).toBe(false);
    expect(report.backedUpTo).toBeNull();
    expect(existsSync(manifestPath(root))).toBe(true);
  });
});
