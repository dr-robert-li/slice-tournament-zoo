// Naive impl #1: only replaces spaces; no normalization, punctuation, trim, or empty-guard.
// Should FAIL the truth suite (and the sealed suite).
export function slugify(input) {
  return String(input).toLowerCase().replace(/ /g, "-");
}
