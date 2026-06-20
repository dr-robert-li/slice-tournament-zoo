/**
 * Intent-spec / as-built-spec diff (F13) — the canonical audit artifact.
 *
 * The planner produces an upfront intent spec; the documenter produces an
 * as-built spec from the winning merged code + traces. Their diff is committed
 * as `slice-NN/spec-diff.md`. We keep specs as ordered lists of claims so the
 * diff is a deterministic structural comparison (not a noisy text diff).
 */

export interface Spec {
  /** Each claim is one machine-or-human-checkable statement about the slice. */
  claims: string[];
}

export interface SpecDiff {
  /** In intent but not as-built — promised, not delivered (or not documented). */
  missing: string[];
  /** In as-built but not intent — delivered beyond the plan (scope creep / extras). */
  added: string[];
  /** Present in both — delivered as planned. */
  kept: string[];
}

export function diffSpecs(intent: Spec, asBuilt: Spec): SpecDiff {
  const built = new Set(asBuilt.claims.map(norm));
  const intended = new Set(intent.claims.map(norm));
  return {
    missing: intent.claims.filter((c) => !built.has(norm(c))),
    added: asBuilt.claims.filter((c) => !intended.has(norm(c))),
    kept: intent.claims.filter((c) => built.has(norm(c))),
  };
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Render the spec-diff as the markdown body of spec-diff.md (F13). */
export function renderSpecDiff(sliceId: string, diff: SpecDiff): string {
  const section = (title: string, items: string[]) =>
    `## ${title} (${items.length})\n` +
    (items.length ? items.map((i) => `- ${i}`).join("\n") : "_none_");
  return [
    `# Spec diff — ${sliceId}`,
    "",
    "Canonical audit record: intent spec vs. as-built spec.",
    "",
    section("✅ Delivered as planned", diff.kept),
    "",
    section("⚠️ Planned but missing", diff.missing),
    "",
    section("➕ Built beyond plan", diff.added),
    "",
  ].join("\n");
}

/** A slice is faithfully built when nothing planned is missing. */
export function isFaithful(diff: SpecDiff): boolean {
  return diff.missing.length === 0;
}
