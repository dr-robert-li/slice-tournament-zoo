// Minimal correct reference for `parseHexColor`.
// Interpretation (locked, shared with the sealed suite):
//   - Accept `#` followed by exactly six hex digits (case-insensitive: 0-9 a-f A-F).
//   - Return { r, g, b } as integers in 0..255.
//   - Throw on anything else: non-string, empty, missing `#`, wrong length,
//     non-hex characters, internal/leading/trailing whitespace.
// Node built-ins only; deterministic and pure.

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function parseHexColor(s) {
  if (typeof s !== "string" || !HEX6.test(s)) {
    throw new Error("malformed hex color: " + String(s));
  }
  const r = parseInt(s.slice(1, 3), 16);
  const g = parseInt(s.slice(3, 5), 16);
  const b = parseInt(s.slice(5, 7), 16);
  return { r, g, b };
}
