// Minimal, correct reference implementation of `parseHexColor`.
// Contract: a `#` followed by exactly six hexadecimal digits -> { r, g, b } as
// integers in 0..255. Throw on anything malformed. Pure, Node built-ins only.

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function parseHexColor(s) {
  if (typeof s !== "string" || !HEX6.test(s)) {
    throw new Error(`malformed hex color: ${String(s)}`);
  }
  return {
    r: parseInt(s.slice(1, 3), 16),
    g: parseInt(s.slice(3, 5), 16),
    b: parseInt(s.slice(5, 7), 16),
  };
}
