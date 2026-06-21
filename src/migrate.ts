/**
 * Project-scaffold migration (F19, the "B" half of the update pathway).
 *
 * Updating the *engine* (npm CLI / plugin) does not touch a project's on-disk
 * `.stz/` tree. When a new STZ release changes the taxonomy (adds a tier, a
 * manifest field), existing projects silently fall behind. This module stamps
 * every scaffold with a manifest carrying `{stzVersion, schemaVersion}` and
 * provides an **additive, backed-up** migration so an old tree can be brought
 * current without losing anything.
 *
 * Safety contract: migration only ever *creates* missing tiers (it reuses the
 * idempotent `scaffold`, which never deletes) and always copies the prior tree
 * to a sibling backup first. A destructive change (renamed/removed tier) is out
 * of scope by construction — there is no code path here that removes a file.
 */
import { writeFile, readFile, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { STZ_DIR, TIERS, scaffold } from "./taxonomy.js";
import { STZ_VERSION, SCHEMA_VERSION } from "./version.js";

/** The on-disk manifest stamped at the root of a `.stz/` tree. */
export interface StzManifest {
  stzVersion: string;
  schemaVersion: number;
  tiers: string[];
}

const MANIFEST_REL = "manifest.json";

/** Absolute path to a project's `.stz/manifest.json`. */
export function manifestPath(root: string): string {
  return join(root, STZ_DIR, MANIFEST_REL);
}

/** Write (or overwrite) the manifest for the current STZ + schema version. */
export async function writeManifest(root: string): Promise<StzManifest> {
  const manifest: StzManifest = {
    stzVersion: STZ_VERSION,
    schemaVersion: SCHEMA_VERSION,
    tiers: [...TIERS],
  };
  await writeFile(manifestPath(root), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return manifest;
}

/**
 * Read the manifest if present. Returns null for a pre-manifest project (an
 * `.stz/` tree scaffolded before F19) so callers can treat it as schema 0.
 */
export async function readManifest(root: string): Promise<StzManifest | null> {
  const p = manifestPath(root);
  if (!existsSync(p)) return null;
  const parsed = JSON.parse(await readFile(p, "utf8")) as Partial<StzManifest>;
  return {
    stzVersion: typeof parsed.stzVersion === "string" ? parsed.stzVersion : "0.0.0",
    schemaVersion: typeof parsed.schemaVersion === "number" ? parsed.schemaVersion : 0,
    tiers: Array.isArray(parsed.tiers) ? parsed.tiers : [],
  };
}

/** What `migrate` did, for the CLI to report and `--check` to emit as JSON. */
export interface MigrateReport {
  root: string;
  fromSchema: number;
  toSchema: number;
  /** True when nothing needed doing (already current, all tiers present). */
  upToDate: boolean;
  /** Tiers created by this migration (additive only). */
  created: string[];
  /** Sibling path the prior tree was copied to, or null when no change. */
  backedUpTo: string | null;
}

/** True when every current tier directory already exists under `.stz/`. */
function allTiersPresent(root: string): boolean {
  return TIERS.every((t) => existsSync(join(root, STZ_DIR, t)));
}

/**
 * Bring an existing `.stz/` tree up to the current schema. Idempotent: a second
 * run on an already-current tree is a no-op (`upToDate: true`, no backup).
 *
 * @throws if there is no `.stz/` tree to migrate (use `stz init` first).
 */
export async function migrate(
  root: string,
  opts: { backup?: boolean } = {},
): Promise<MigrateReport> {
  const backup = opts.backup ?? true;
  if (!existsSync(join(root, STZ_DIR))) {
    throw new Error(`no ${STZ_DIR}/ tree at ${root} — run \`stz init\` first`);
  }
  const current = await readManifest(root);
  const fromSchema = current?.schemaVersion ?? 0;

  // Already current AND structurally complete -> nothing to do. (We still
  // rewrite a missing manifest below if the schema matched but the stamp was
  // absent, so a pre-manifest tree at the same layout still gets stamped.)
  if (fromSchema === SCHEMA_VERSION && current !== null && allTiersPresent(root)) {
    return {
      root,
      fromSchema,
      toSchema: SCHEMA_VERSION,
      upToDate: true,
      created: [],
      backedUpTo: null,
    };
  }

  // Back up the prior tree before any additive change.
  let backedUpTo: string | null = null;
  if (backup) {
    backedUpTo = join(root, `${STZ_DIR}.bak-schema${fromSchema}`);
    await cp(join(root, STZ_DIR), backedUpTo, { recursive: true });
  }

  // Additive only: scaffold creates missing tiers, never removes.
  const created = await scaffold(root);
  await writeManifest(root);

  return {
    root,
    fromSchema,
    toSchema: SCHEMA_VERSION,
    upToDate: false,
    created,
    backedUpTo,
  };
}
