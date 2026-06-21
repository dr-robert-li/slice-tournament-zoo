/**
 * Intent-spec / as-built-spec diff (F13) — the canonical audit artifact.
 *
 * The planner produces an upfront intent spec; the documenter produces an
 * as-built spec from the winning merged code + traces. Their diff is committed
 * as `slice-NN/spec-diff.md`.
 *
 * Claims are matched by a stable KEY, not by wording. A claim's key is its
 * explicit `id` when present, else its normalized text. This makes the legacy
 * string-claim path a special case (key derived from text → content matching,
 * case/whitespace-insensitive) while the id-keyed path lets the documenter
 * reword a claim freely and still match the intent claim it adjudicates. An
 * id-keyed as-built claim carries a `satisfied` verdict; `satisfied: false`
 * means the intent claim was genuinely NOT delivered (it lands in `missing`,
 * never silently in `kept`).
 */

/** One claim: a bare string (legacy/positional) or a keyed, adjudicated claim. */
export type Claim =
  | string
  | { id?: string; text?: string; evidence?: string; satisfied?: boolean };

export interface Spec {
  claims: Claim[];
}

export interface SpecDiff {
  /** In intent but not as-built — promised, not delivered (or not documented). */
  missing: string[];
  /** In as-built but not intent — delivered beyond the plan (scope creep / extras). */
  added: string[];
  /** Present in both — delivered as planned. */
  kept: string[];
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Display text for a claim — what shows in the spec-diff markdown. */
function claimText(c: Claim): string {
  if (typeof c === "string") return c;
  return c.text ?? c.evidence ?? c.id ?? "(unspecified claim)";
}

/** Stable match key: explicit id if given, else the normalized display text. */
function claimKey(c: Claim): string {
  if (typeof c !== "string" && typeof c.id === "string" && c.id.trim() !== "") {
    return `id:${c.id.trim()}`;
  }
  return `t:${norm(claimText(c))}`;
}

/** An as-built claim counts as delivering its intent claim unless it explicitly says otherwise. */
function isSatisfied(c: Claim): boolean {
  return typeof c === "string" ? true : c.satisfied !== false;
}

export function diffSpecs(intent: Spec, asBuilt: Spec): SpecDiff {
  const builtByKey = new Map<string, Claim>();
  for (const c of asBuilt.claims) builtByKey.set(claimKey(c), c);
  const intendedKeys = new Set(intent.claims.map(claimKey));

  const missing: string[] = [];
  const kept: string[] = [];
  for (const c of intent.claims) {
    const b = builtByKey.get(claimKey(c));
    if (b && isSatisfied(b)) kept.push(claimText(c));
    else missing.push(claimText(c));
  }
  // An as-built claim whose key matches an intent claim is never "added" — even
  // if satisfied:false (then it's a genuine miss counted above), so the same
  // claim is never double-counted as both missing and added.
  const added = asBuilt.claims
    .filter((c) => !intendedKeys.has(claimKey(c)))
    .map(claimText);

  return { missing, added, kept };
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

/**
 * Intent claim ids that the as-built spec failed to account for cleanly — used
 * by `finalize` to warn when the documenter mis-keyed a verdict (a mis-keyed id
 * shows up as a false `missing` here). Returns intent ids with no satisfied
 * as-built claim at their key; an empty array means every intent claim was
 * adjudicated. Only meaningful for id-keyed specs.
 */
export function unmatchedIntentIds(intent: Spec, asBuilt: Spec): string[] {
  const builtByKey = new Map<string, Claim>();
  for (const c of asBuilt.claims) builtByKey.set(claimKey(c), c);
  const ids: string[] = [];
  for (const c of intent.claims) {
    if (typeof c === "string" || !c.id) continue;
    const b = builtByKey.get(claimKey(c));
    if (!b || !isSatisfied(b)) ids.push(c.id);
  }
  return ids;
}

/**
 * As-built claim ids that claim to satisfy an intent claim but reference an id
 * not present in the intent spec — a documenter mis-key. Extras (ids the
 * documenter coined for behaviour beyond intent) are expected and excluded by
 * convention: an id is treated as an extra when it is absent from intent AND
 * the claim does not assert `satisfied`. Anything else absent-from-intent but
 * asserting satisfied is a likely mis-key and is surfaced.
 */
export function mismatchedAsBuiltIds(intent: Spec, asBuilt: Spec): string[] {
  const intendedKeys = new Set(intent.claims.map(claimKey));
  const out: string[] = [];
  for (const c of asBuilt.claims) {
    if (typeof c === "string" || !c.id) continue;
    if (intendedKeys.has(claimKey(c))) continue; // matched an intent claim
    if (c.satisfied === true) out.push(c.id); // asserts it satisfied something, but matches no intent id
  }
  return out;
}
