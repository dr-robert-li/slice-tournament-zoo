/**
 * Sealed held-out suite integrity (L1/F10).
 *
 * The held-out suite (and the test-author's reference implementation that proves
 * it is satisfiable) is frozen BEFORE the tournament and must not change while
 * specimens compete — otherwise the grader could be tuned to favour one. This
 * module is the deterministic record of that freeze:
 *
 *   - `seal`        — hash every file under `30-tests/held-out/` into SEAL.json.
 *   - `verifySeal`  — re-hash and report any drift (the gate before judging).
 *   - `amendSeal`   — the ONLY sanctioned way to change a sealed file: records
 *                     per-file from→to hashes + a reason into the manifest.
 *
 * The manifest is timestamp-free (N6 replayability); amendment append-order is
 * the audit sequence. SEAL.json lives inside the directory it hashes and is
 * excluded from its own manifest. File keys are POSIX-relative and sorted, so
 * the manifest is byte-stable across runs and machines.
 *
 * Language-specific compile/run (the smoke gate that proves the suite is green
 * against the reference before sealing) is the orchestrator's job, not this
 * module's — the bridge owns only the deterministic hashing/verify/amend.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { stzPath } from "./taxonomy.js";

const HELD_OUT_REL = join("30-tests", "held-out");
export const SEAL_NAME = "SEAL.json";

export interface SealAmendment {
  reason: string;
  changed: { file: string; from: string | null; to: string | null }[];
}

export interface SealManifest {
  schemaVersion: 1;
  /** POSIX-relative path → sha256 of the file's bytes, for every held-out file. */
  files: Record<string, string>;
  /** Audit log of sanctioned post-freeze changes, in application order. */
  amendments: SealAmendment[];
}

export function heldOutDir(root: string): string {
  return stzPath(root, HELD_OUT_REL);
}
export function sealPath(root: string): string {
  return join(heldOutDir(root), SEAL_NAME);
}

const toPosix = (p: string): string => p.split(sep).join("/");
const fromPosix = (p: string): string => p.split("/").join(sep);
const sha256 = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex");

/** Every file under held-out (recursive), POSIX-relative, sorted, sans SEAL.json. */
export function heldOutFiles(root: string): string[] {
  const base = heldOutDir(root);
  if (!existsSync(base)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const ent of entries) {
      const abs = join(dir, ent.name);
      if (ent.isDirectory()) walk(abs);
      else {
        const rel = toPosix(relative(base, abs));
        if (rel !== SEAL_NAME) out.push(rel);
      }
    }
  };
  walk(base);
  return out.sort();
}

/** Current on-disk hashes, keyed by POSIX-relative path (sorted insertion). */
export function computeHashes(root: string): Record<string, string> {
  const base = heldOutDir(root);
  const files: Record<string, string> = {};
  for (const rel of heldOutFiles(root)) {
    files[rel] = sha256(readFileSync(join(base, fromPosix(rel))));
  }
  return files;
}

export function readSeal(root: string): SealManifest | null {
  if (!existsSync(sealPath(root))) return null;
  return JSON.parse(readFileSync(sealPath(root), "utf8")) as SealManifest;
}

export async function writeSeal(root: string, manifest: SealManifest): Promise<void> {
  await writeFile(sealPath(root), JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

export type SealResult = {
  sealed: boolean;
  added: string[];
  /** Already-sealed files whose bytes changed — NOT re-blessed; use amend. */
  drifted: string[];
  removed: string[];
  total: number;
};

/**
 * Freeze the held-out suite. On first run, hashes everything. On a later run
 * (e.g. a new slice's suite was added) it ADDS the new files' hashes but
 * refuses to silently re-bless an already-sealed file whose bytes changed —
 * that is `amendSeal`'s job. Returns `sealed:false` when such drift blocks it.
 */
export async function seal(root: string): Promise<SealResult> {
  const current = computeHashes(root);
  const prior = readSeal(root);
  if (!prior) {
    await writeSeal(root, { schemaVersion: 1, files: current, amendments: [] });
    return { sealed: true, added: Object.keys(current), drifted: [], removed: [], total: Object.keys(current).length };
  }
  const added: string[] = [];
  const drifted: string[] = [];
  for (const [f, h] of Object.entries(current)) {
    if (!(f in prior.files)) added.push(f);
    else if (prior.files[f] !== h) drifted.push(f);
  }
  const removed = Object.keys(prior.files).filter((f) => !(f in current));
  if (drifted.length || removed.length) {
    // A sealed file changed/vanished — refuse to launder it through `seal`.
    return { sealed: false, added, drifted, removed, total: Object.keys(prior.files).length };
  }
  const files = { ...prior.files };
  for (const f of added) files[f] = current[f]!;
  await writeSeal(root, { schemaVersion: 1, files, amendments: prior.amendments });
  return { sealed: true, added, drifted: [], removed: [], total: Object.keys(files).length };
}

export type DriftEntry = { file: string; status: "modified" | "added" | "removed" };
export type VerifyResult = { sealed: boolean; ok: boolean; drift: DriftEntry[] };

/** Re-hash the held-out dir against SEAL.json. `ok:false` on any drift. */
export function verifySeal(root: string): VerifyResult {
  const prior = readSeal(root);
  if (!prior) return { sealed: false, ok: false, drift: [] };
  const current = computeHashes(root);
  const drift: DriftEntry[] = [];
  for (const [f, h] of Object.entries(current)) {
    if (!(f in prior.files)) drift.push({ file: f, status: "added" });
    else if (prior.files[f] !== h) drift.push({ file: f, status: "modified" });
  }
  for (const f of Object.keys(prior.files)) {
    if (!(f in current)) drift.push({ file: f, status: "removed" });
  }
  drift.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  return { sealed: true, ok: drift.length === 0, drift };
}

/**
 * The sanctioned post-freeze change: re-hash, record per-file from→to (null on
 * add/remove) plus the reason into the manifest's amendment log, and re-freeze
 * to the new hashes. After this, `verifySeal` passes again — so a silent edit
 * (one that skipped amend) is exactly what `verifySeal` is left to catch.
 */
export async function amendSeal(root: string, reason: string): Promise<{ amended: boolean; changed: SealAmendment["changed"] }> {
  const prior = readSeal(root);
  if (!prior) return { amended: false, changed: [] };
  const current = computeHashes(root);
  const changed: SealAmendment["changed"] = [];
  for (const [f, h] of Object.entries(current)) {
    const from = prior.files[f] ?? null;
    if (from !== h) changed.push({ file: f, from, to: h });
  }
  for (const f of Object.keys(prior.files)) {
    if (!(f in current)) changed.push({ file: f, from: prior.files[f]!, to: null });
  }
  if (changed.length === 0) return { amended: false, changed: [] };
  changed.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  await writeSeal(root, {
    schemaVersion: 1,
    files: current,
    amendments: [...prior.amendments, { reason, changed }],
  });
  return { amended: true, changed };
}
