// slugify — split-and-join strategy.
//
// Pipeline: NFKD normalize -> strip combining marks (U+0300–U+036F) ->
// lowercase -> split on runs of non-[a-z0-9] into tokens -> drop empties ->
// join surviving tokens with a single "-".
//
// Splitting on separator runs and dropping empty tokens collapses separator
// runs to one hyphen and trims leading/trailing separators implicitly, so no
// explicit trim/collapse logic is required.

export function slugify(input) {
  // P0: non-string input returns "".
  if (typeof input !== "string") return "";

  const folded = input
    .normalize("NFKD")
    // Strip combining marks so accents fold (é -> e, etc.).
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  // Split on every maximal run of characters NOT in [a-z0-9].
  // Empty tokens (from leading/trailing/adjacent separators) are dropped,
  // which collapses runs and trims edges in one step.
  const tokens = folded.split(/[^a-z0-9]+/).filter((t) => t.length > 0);

  return tokens.join("-");
}
