// slugify — character-by-character state-machine strategy.
//
// Pipeline (per the normative contract):
//   1. Non-string input  -> ""
//   2. NFKD normalize
//   3. Strip combining marks (U+0300..U+036F)
//   4. Lowercase
//   5. Iterate code points: classify each as KEEP ([a-z0-9]) or SEPARATOR;
//      emit kept chars, collapse separator runs into a single "-" by tracking
//      whether the previously emitted char was a hyphen.
//   6. Trim leading/trailing "-".
//
// No transliteration table: anything that does not fold to [a-z0-9] is a
// separator and ultimately dropped.

export function slugify(input) {
  // Step 1: non-string -> ""
  if (typeof input !== "string") return "";

  // Steps 2-4: NFKD, strip combining marks, lowercase.
  // Strip marks BEFORE lowercasing is fine; lowercasing combining marks is a
  // no-op, but doing it after the strip avoids any locale surprises.
  const prepared = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  // Steps 5-6: state machine over code points.
  const out = [];
  let prevWasHyphen = true; // seeded true so leading separators emit nothing (auto-trims start)

  for (const ch of prepared) {
    const cp = ch.codePointAt(0);
    // KEEP class: lowercase ascii letters and digits.
    const isDigit = cp >= 0x30 && cp <= 0x39; // 0-9
    const isLower = cp >= 0x61 && cp <= 0x7a; // a-z

    if (isDigit || isLower) {
      out.push(ch);
      prevWasHyphen = false;
    } else {
      // Separator: emit a single hyphen only if the previous emitted char was
      // a real (kept) character. This collapses runs and suppresses leading
      // separators.
      if (!prevWasHyphen) {
        out.push("-");
        prevWasHyphen = true;
      }
    }
  }

  // Trailing separator: if the last emitted char is a hyphen, drop it.
  if (out.length > 0 && out[out.length - 1] === "-") {
    out.pop();
  }

  return out.join("");
}
