/**
 * The `.stz/` markdown taxonomy (§3 Data & Vector Store) — primary data store.
 *
 * Tiered tree:
 *   00-intent/    10-research/   20-standards/   30-tests/
 *   40-slices/    50-pressure/   90-audit/
 *
 * Every file carries YAML frontmatter with a ~200-token `summary` field for
 * progressive disclosure (N2): phase agents load summaries by default and fetch
 * full bodies only on named-anchor reference.
 *
 * Dependency-light by design (N10 "minimal toolchain"): a tiny hand-rolled
 * frontmatter (de)serializer rather than a YAML lib. The supported subset is
 * scalars + string arrays, which is all the schema uses.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export const STZ_DIR = ".stz";

export const TIERS = [
  "00-intent",
  "10-research",
  "10-research/external",
  "10-research/internal",
  "10-research/spikes",
  "20-standards",
  "20-standards/architecture-decisions",
  "30-tests",
  "30-tests/held-out",
  "40-slices",
  "50-pressure",
  "60-harness",
  "60-harness/variants",
  "60-harness/battery",
  "90-audit",
  "90-audit/calls",
] as const;

export interface Frontmatter {
  summary: string;
  [key: string]: unknown;
}

export interface MarkdownDoc {
  frontmatter: Frontmatter;
  body: string;
}

// ── frontmatter (de)serialization ─────────────────────────────────────────

function serializeValue(v: unknown): string {
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return "\n" + v.map((x) => `  - ${scalar(x)}`).join("\n");
  }
  return ` ${scalar(v)}`;
}

function scalar(v: unknown): string {
  if (typeof v === "string") {
    // Quote strings containing characters that would break the simple parser.
    if (/[:#\n]|^\s|\s$/.test(v) || v === "") return JSON.stringify(v);
    return v;
  }
  return String(v);
}

export function serializeFrontmatter(fm: Frontmatter): string {
  const lines: string[] = ["---"];
  for (const [k, v] of Object.entries(fm)) {
    if (Array.isArray(v)) {
      lines.push(`${k}:${serializeValue(v)}`);
    } else {
      lines.push(`${k}:${serializeValue(v)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

export function serializeDoc(doc: MarkdownDoc): string {
  return `${serializeFrontmatter(doc.frontmatter)}\n\n${doc.body.trimEnd()}\n`;
}

export function parseDoc(raw: string): MarkdownDoc {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: { summary: "" }, body: raw };
  const [, fmBlock, body] = m;
  const fm: Frontmatter = { summary: "" };
  const lines = (fmBlock ?? "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1]!;
    const rest = kv[2]!;
    if (rest === "" && lines[i + 1]?.match(/^\s*-\s+/)) {
      // string array
      const arr: string[] = [];
      while (lines[i + 1]?.match(/^\s*-\s+/)) {
        arr.push(String(unscalar(lines[++i]!.replace(/^\s*-\s+/, ""))));
      }
      fm[key] = arr;
    } else if (rest === "[]") {
      fm[key] = [];
    } else {
      fm[key] = unscalar(rest);
    }
  }
  return { frontmatter: fm, body: (body ?? "").replace(/^\n+/, "") };
}

function unscalar(s: string): string | number | boolean {
  if (s.startsWith('"')) {
    try {
      return JSON.parse(s) as string;
    } catch {
      return s;
    }
  }
  if (s === "true") return true;
  if (s === "false") return false;
  if (s !== "" && !Number.isNaN(Number(s))) return Number(s);
  return s;
}

// ── filesystem operations ─────────────────────────────────────────────────

/** Create the full `.stz/` tier tree under `root`. Idempotent. */
export async function scaffold(root: string): Promise<string[]> {
  const base = join(root, STZ_DIR);
  const created: string[] = [];
  for (const tier of TIERS) {
    const dir = join(base, tier);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      created.push(tier);
    }
  }
  return created;
}

/** Write a markdown doc (creating parent dirs) under `.stz/<relPath>`. */
export async function writeDoc(
  root: string,
  relPath: string,
  doc: MarkdownDoc,
): Promise<void> {
  const full = join(root, STZ_DIR, relPath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, serializeDoc(doc), "utf8");
}

export async function readDoc(root: string, relPath: string): Promise<MarkdownDoc> {
  const full = join(root, STZ_DIR, relPath);
  const raw = await readFile(full, "utf8");
  return parseDoc(raw);
}

export function stzPath(root: string, relPath: string): string {
  return join(root, STZ_DIR, relPath);
}
