/**
 * Update pathway (F19): tell the operator whether their STZ is current, and
 * print the exact command(s) to fix it. Two distribution channels mean two
 * things can be stale independently:
 *
 *   - the **npm CLI** (`slice-tournament-zoo` on PATH), and
 *   - the **Claude Code plugin** (the bundled `stz bridge` the `/stz:*`
 *     commands call via `${CLAUDE_PLUGIN_ROOT}`).
 *
 * A "sustainable" pathway therefore does three things: detect a newer npm
 * release, detect *drift* between the two channels, and emit deterministic
 * remediation commands. The registry fetch is **injectable** so the pure verdict
 * logic is unit-tested offline (STZ's no-network test ethos) while the real CLI
 * uses global `fetch`.
 */
import { PACKAGE_NAME, registryLatestUrl } from "./version.js";

/** Result of an npm latest-version check. Structured, never prose-parsed. */
export interface LatestResult {
  ok: boolean;
  version: string | null;
  /** Machine-readable reason on failure (network, parse, http, …). */
  reason: string;
}

/** The verdict the CLI renders and `--check` emits as JSON. */
export interface UpdateVerdict {
  packageName: string;
  installed: string;
  latest: string | null;
  /** A newer npm release exists. */
  stale: boolean;
  /** Installed is ahead of npm latest (local/dev build). */
  ahead: boolean;
  /** Plugin bundled engine differs from the installed CLI, when known. */
  drift: boolean;
  /** Plugin engine version if discoverable, else null. */
  pluginVersion: string | null;
  /** Exact remediation commands, in order. Empty when fully up to date. */
  commands: string[];
  /** Why the check could not complete, if `latest` is null. */
  reason?: string;
}

// ── semver compare (the subset STZ versions actually use) ────────────────────

interface Semver {
  major: number;
  minor: number;
  patch: number;
  /** Pre-release identifiers (e.g. `rc.1` -> ["rc", 1]); empty for releases. */
  pre: Array<string | number>;
}

/** Parse `MAJOR.MINOR.PATCH[-pre]`. Throws on a non-semver string. */
export function parseSemver(v: string): Semver {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(v.trim());
  if (!m) throw new Error(`not a semver: ${v}`);
  const pre = m[4]
    ? m[4].split(".").map((id) => (/^\d+$/.test(id) ? Number(id) : id))
    : [];
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre };
}

/**
 * Compare two semvers. Returns -1 if a<b, 0 if equal, 1 if a>b. Implements the
 * precedence rule that a pre-release is *lower* than its release (1.0.0-rc < 1.0.0).
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (const k of ["major", "minor", "patch"] as const) {
    if (pa[k] !== pb[k]) return pa[k] < pb[k] ? -1 : 1;
  }
  // Equal core. A release outranks any pre-release of the same core.
  if (pa.pre.length === 0 && pb.pre.length === 0) return 0;
  if (pa.pre.length === 0) return 1; // a is release, b is pre
  if (pb.pre.length === 0) return -1; // a is pre, b is release
  const n = Math.min(pa.pre.length, pb.pre.length);
  for (let i = 0; i < n; i++) {
    const x = pa.pre[i];
    const y = pb.pre[i];
    if (x === y) continue;
    // Numeric identifiers rank lower than alphanumeric; otherwise compare in kind.
    const xn = typeof x === "number";
    const yn = typeof y === "number";
    if (xn && yn) return (x as number) < (y as number) ? -1 : 1;
    if (xn !== yn) return xn ? -1 : 1;
    return (x as string) < (y as string) ? -1 : 1;
  }
  if (pa.pre.length === pb.pre.length) return 0;
  return pa.pre.length < pb.pre.length ? -1 : 1;
}

// ── verdict ──────────────────────────────────────────────────────────────────

/** Inputs to {@link buildVerdict}; all version strings, no I/O. */
export interface VerdictInput {
  installed: string;
  latest: string | null;
  pluginVersion?: string | null;
  reason?: string;
}

/**
 * Pure: turn (installed, latest, pluginVersion) into a verdict + remediation
 * commands. No network, no filesystem — this is the unit under test.
 */
export function buildVerdict(input: VerdictInput): UpdateVerdict {
  const { installed, latest } = input;
  const pluginVersion = input.pluginVersion ?? null;

  const stale = latest != null && compareSemver(installed, latest) < 0;
  const ahead = latest != null && compareSemver(installed, latest) > 0;
  const drift = pluginVersion != null && compareSemver(installed, pluginVersion) !== 0;

  const commands: string[] = [];
  if (stale) commands.push(`npm i -g ${PACKAGE_NAME}@latest`);
  // The plugin updates through Claude Code's plugin manager, not npm. Surface it
  // whenever a newer release exists OR the two channels have drifted apart.
  if (stale || drift) commands.push("/plugin update stz");

  return {
    packageName: PACKAGE_NAME,
    installed,
    latest,
    stale,
    ahead,
    drift,
    pluginVersion,
    commands,
    ...(input.reason ? { reason: input.reason } : {}),
  };
}

// ── registry check (injectable fetch) ────────────────────────────────────────

/** A minimal fetch signature so tests inject a fake without a network. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

/**
 * Query npm for the latest published version. Network failures, non-200s, and
 * malformed bodies all collapse to `{ok:false, reason}` rather than throwing,
 * so the CLI degrades to "couldn't check" instead of crashing.
 */
export async function checkLatest(
  fetchImpl: FetchLike = globalThis.fetch as unknown as FetchLike,
): Promise<LatestResult> {
  if (typeof fetchImpl !== "function") {
    return { ok: false, version: null, reason: "no_fetch_available" };
  }
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(registryLatestUrl());
  } catch {
    return { ok: false, version: null, reason: "network_error" };
  }
  if (!res.ok) {
    return { ok: false, version: null, reason: `http_${res.status}` };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, version: null, reason: "invalid_json" };
  }
  const version = (body as { version?: unknown })?.version;
  if (typeof version !== "string") {
    return { ok: false, version: null, reason: "missing_version_field" };
  }
  try {
    parseSemver(version);
  } catch {
    return { ok: false, version: null, reason: "unparseable_version" };
  }
  return { ok: true, version, reason: "ok" };
}

/** Human-readable summary for the `stz update` (non-`--check`) path. */
export function formatVerdict(v: UpdateVerdict): string {
  const lines: string[] = [];
  lines.push(`STZ ${v.installed} (${v.packageName})`);
  if (v.latest == null) {
    lines.push(`Couldn't check npm for updates (reason: ${v.reason ?? "unknown"}).`);
    lines.push(`To update manually: npm i -g ${v.packageName}@latest`);
    return lines.join("\n");
  }
  if (v.stale) lines.push(`Update available: ${v.latest} (you have ${v.installed}).`);
  else if (v.ahead) lines.push(`You're ahead of npm latest (${v.latest}) — local/dev build.`);
  else lines.push(`Up to date with npm latest (${v.latest}).`);
  if (v.drift) {
    lines.push(
      `⚠ Channel drift: plugin engine ${v.pluginVersion} ≠ CLI ${v.installed}. ` +
        `The /stz:* commands may use a different version than the CLI.`,
    );
  }
  if (v.commands.length) {
    lines.push("");
    lines.push("Run:");
    for (const c of v.commands) lines.push(`  ${c}`);
  }
  return lines.join("\n");
}
