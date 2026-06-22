// Standalone sealer for the slugify pilot — mirrors the SHA256 + sorted-manifest shape of
// src/seal.ts but is fully self-contained under experiments/ so production code is untouched.
// SEAL.json lives inside the directory it hashes and is excluded from its own manifest.
// File keys are POSIX-relative and sorted -> byte-stable, timestamp-free.
//
//   node seal.mjs seal   <dir>   # freeze: write/extend SEAL.json (refuses to re-bless drift)
//   node seal.mjs verify <dir>   # re-hash and report drift; exit 1 on any drift
//
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SEAL_NAME = "SEAL.json";
const toPosix = (p) => p.split(sep).join("/");
const fromPosix = (p) => p.split("/").join(sep);
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function files(base) {
  const out = [];
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
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

function hashes(base) {
  const h = {};
  for (const rel of files(base)) h[rel] = sha256(readFileSync(join(base, fromPosix(rel))));
  return h;
}

function readSeal(base) {
  const p = join(base, SEAL_NAME);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

function seal(base) {
  const current = hashes(base);
  const prior = readSeal(base);
  if (!prior) {
    writeFileSync(join(base, SEAL_NAME), JSON.stringify({ schemaVersion: 1, files: current, amendments: [] }, null, 2) + "\n");
    return { sealed: true, added: Object.keys(current).length, drifted: [], removed: [] };
  }
  const drifted = [],
    removed = [];
  for (const [f, hh] of Object.entries(current)) if (f in prior.files && prior.files[f] !== hh) drifted.push(f);
  for (const f of Object.keys(prior.files)) if (!(f in current)) removed.push(f);
  if (drifted.length || removed.length) return { sealed: false, drifted, removed };
  writeFileSync(join(base, SEAL_NAME), JSON.stringify({ schemaVersion: 1, files: current, amendments: prior.amendments }, null, 2) + "\n");
  return { sealed: true, added: Object.keys(current).length, drifted: [], removed: [] };
}

function verify(base) {
  const prior = readSeal(base);
  if (!prior) return { ok: false, reason: "no SEAL.json" };
  const current = hashes(base);
  const drift = [];
  for (const [f, hh] of Object.entries(current)) {
    if (!(f in prior.files)) drift.push({ file: f, status: "added" });
    else if (prior.files[f] !== hh) drift.push({ file: f, status: "modified" });
  }
  for (const f of Object.keys(prior.files)) if (!(f in current)) drift.push({ file: f, status: "removed" });
  return { ok: drift.length === 0, drift };
}

const [, , cmd, dir] = process.argv;
if (!cmd || !dir) {
  console.error("usage: node seal.mjs <seal|verify> <dir>");
  process.exit(2);
}
if (cmd === "seal") {
  const r = seal(dir);
  console.log(JSON.stringify(r));
  process.exit(r.sealed ? 0 : 1);
} else if (cmd === "verify") {
  const r = verify(dir);
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
} else {
  console.error("unknown command: " + cmd);
  process.exit(2);
}
