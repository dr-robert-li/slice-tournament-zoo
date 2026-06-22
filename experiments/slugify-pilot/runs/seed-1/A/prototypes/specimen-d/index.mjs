// slugify — functional code-point strategy.
//
// Pipeline (per the normative algorithm in CONTRACT.md):
//   non-string -> ""        (P0)
//   NFKD normalize          (P2)
//   strip combining marks U+0300..U+036F  (P2)
//   lowercase               (step 4)
//   spread into code points, map each to either a lowercase ASCII
//   [a-z0-9] character or a separator marker (null), then reduce the
//   array to collapse runs of separators into single '-' and trim ends.
//
// We favour array methods (map/filter/reduce) over a single mega-regex.

const SEP = null; // marker for "not [a-z0-9]" — a separator

export function slugify(input) {
  // P0: anything that is not a string folds to the empty slug.
  if (typeof input !== "string") return "";

  // Steps 2 & 3: NFKD then drop combining diacritical marks.
  // Stripping is done functionally over the code-point array so that
  // both composed (U+00E9) and decomposed (e + U+0301) forms agree.
  const decomposed = input.normalize("NFKD");

  const tokens = [...decomposed]
    // Step 3: remove combining marks (U+0300..U+036F).
    .filter((ch) => {
      const cp = ch.codePointAt(0);
      return cp < 0x0300 || cp > 0x036f;
    })
    // Step 4 + step 5 mapping: lowercase, then classify each code point
    // as a kept [a-z0-9] char or a separator marker.
    .map((ch) => {
      const lower = ch.toLowerCase();
      // toLowerCase on a single code point can in principle yield more
      // than one code unit; only a bare ASCII [a-z0-9] is a kept char.
      if (lower.length === 1) {
        const c = lower.charCodeAt(0);
        const isDigit = c >= 0x30 && c <= 0x39; // 0-9
        const isAlpha = c >= 0x61 && c <= 0x7a; // a-z
        if (isDigit || isAlpha) return lower;
      }
      return SEP;
    });

  // Steps 5 & 6: reduce the token array, collapsing maximal separator
  // runs into a single '-' and trimming leading/trailing separators.
  const out = tokens.reduce((acc, tok) => {
    if (tok === SEP) {
      // Only emit a separator if we already have kept content and the
      // previous emitted char was not already a separator (collapse).
      if (acc.length > 0 && acc[acc.length - 1] !== "-") acc.push("-");
    } else {
      acc.push(tok);
    }
    return acc;
  }, []);

  // Trim a possible trailing separator left by the reduce (the leading
  // one can never appear because we guard on acc.length > 0).
  if (out.length > 0 && out[out.length - 1] === "-") out.pop();

  return out.join("");
}
