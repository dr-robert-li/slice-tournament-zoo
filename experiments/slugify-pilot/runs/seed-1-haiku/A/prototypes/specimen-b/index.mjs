export function slugify(input) {
  // P0: Non-string input returns empty string
  if (typeof input !== "string") return "";

  // NFKD normalize and lowercase
  const normalized = input.normalize("NFKD").toLowerCase();

  // Character-by-character state machine:
  // Classify each code point and build output array
  const output = [];
  let pendingSeparator = false;

  // Iterate by code points (for...of handles astral characters correctly)
  for (const codePoint of normalized) {
    const code = codePoint.charCodeAt(0);

    // Strip combining marks (U+0300–U+036F)
    if (code >= 0x0300 && code <= 0x036F) {
      continue;
    }

    // Keep [a-z0-9]
    if ((code >= 0x0061 && code <= 0x007a) || (code >= 0x0030 && code <= 0x0039)) {
      // If we have a pending separator and output is not empty, emit the hyphen
      if (pendingSeparator && output.length > 0) {
        output.push("-");
      }
      output.push(codePoint);
      pendingSeparator = false;
    } else {
      // Everything else is a separator
      pendingSeparator = true;
    }
  }

  return output.join("");
}
