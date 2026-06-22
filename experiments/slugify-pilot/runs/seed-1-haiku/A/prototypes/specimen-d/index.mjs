export function slugify(input) {
  // P0: Non-string input → return ""
  if (typeof input !== "string") {
    return "";
  }

  // P2: Unicode NFKD normalize the input
  const normalized = input.normalize("NFKD");

  // Spread into code-point array and map each to:
  // - lowercase letter/digit → keep as-is
  // - combining mark U+0300–U+036F → remove entirely
  // - everything else → separator marker
  const codePoints = [...normalized];

  const mapped = codePoints
    .map((char) => {
      const code = char.charCodeAt(0);

      // Combining marks: U+0300–U+036F → remove (return empty string)
      if (code >= 0x0300 && code <= 0x036F) {
        return "";
      }

      // Lowercase everything
      const lower = char.toLowerCase();

      // Check if it's alphanumeric [a-z0-9]
      if (/^[a-z0-9]$/.test(lower)) {
        return lower;
      }

      // Everything else → separator marker
      return "-";
    })
    .join("");

  // P3, P4: Collapse maximal runs of separators, trim leading/trailing
  // Split by separator, filter out empty chunks, join with single separator
  const slug = mapped
    .split("-")
    .filter((chunk) => chunk.length > 0)
    .join("-");

  return slug;
}
