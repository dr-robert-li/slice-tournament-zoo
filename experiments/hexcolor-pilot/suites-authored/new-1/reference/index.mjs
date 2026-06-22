// Minimal correct reference for parseHexColor.
// Faithful reading of "six hexadecimal digits": case-insensitive 0-9a-fA-F.
// Anchored at both ends — exactly "#" + 6 hex digits, nothing else.

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function parseHexColor(s) {
  if (typeof s !== "string" || !HEX6.test(s)) {
    throw new Error(`malformed hex color: ${JSON.stringify(s)}`);
  }
  return {
    r: parseInt(s.slice(1, 3), 16),
    g: parseInt(s.slice(3, 5), 16),
    b: parseInt(s.slice(5, 7), 16),
  };
}
