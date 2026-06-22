// slugify — single chained regex pipeline strategy.
//
// Pipeline (per CONTRACT.md normative algorithm):
//   non-string -> ""
//   NFKD normalize  ->  strip U+0300..U+036F combining marks  ->  lowercase
//   collapse maximal runs of non-[a-z0-9] to "-"  ->  trim edge "-"
//
// Deterministic, pure, Node built-ins only, no transliteration.

export function slugify(input) {
  // 1. Non-string input -> "".
  if (typeof input !== "string") return "";

  return input
    // 2. Unicode NFKD normalize (decomposes accented chars into base + combining marks).
    .normalize("NFKD")
    // 3. Strip combining diacritical marks (U+0300..U+036F).
    .replace(/[̀-ͯ]/g, "")
    // 4. Lowercase.
    .toLowerCase()
    // 5. Replace every maximal run of chars not in [a-z0-9] with a single "-".
    .replace(/[^a-z0-9]+/g, "-")
    // 6. Trim all leading/trailing "-".
    .replace(/^-+|-+$/g, "");
}
