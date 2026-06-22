// Minimal correct reference for parseHexColor.
// Contract: `#` followed by exactly six hexadecimal digits (two per channel),
// returns { r, g, b } as integers 0-255. Throws on anything malformed.
// Hex digits per the standard definition: 0-9, a-f, A-F.

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function parseHexColor(s) {
  if (typeof s !== "string") {
    throw new TypeError("parseHexColor: expected a string");
  }
  if (!HEX6.test(s)) {
    throw new Error("parseHexColor: malformed hex color: " + JSON.stringify(s));
  }
  const r = parseInt(s.slice(1, 3), 16);
  const g = parseInt(s.slice(3, 5), 16);
  const b = parseInt(s.slice(5, 7), 16);
  return { r, g, b };
}
