export function parseHexColor(s) {
  // Validate input type and structure
  if (typeof s !== 'string') {
    throw new TypeError('Expected string');
  }

  if (s.length !== 7 || s[0] !== '#') {
    throw new Error('Invalid hex color format: must be #RRGGBB');
  }

  // Hex digit to value lookup (0-9, a-f, A-F)
  const hexMap = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15,
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
  };

  // Extract and validate each pair of hex digits
  let r = 0, g = 0, b = 0;

  // Red channel (positions 1-2)
  const r1 = hexMap[s[1]];
  const r2 = hexMap[s[2]];
  if (r1 === undefined || r2 === undefined) {
    throw new Error('Invalid hex digit in red channel');
  }
  r = r1 * 16 + r2;

  // Green channel (positions 3-4)
  const g1 = hexMap[s[3]];
  const g2 = hexMap[s[4]];
  if (g1 === undefined || g2 === undefined) {
    throw new Error('Invalid hex digit in green channel');
  }
  g = g1 * 16 + g2;

  // Blue channel (positions 5-6)
  const b1 = hexMap[s[5]];
  const b2 = hexMap[s[6]];
  if (b1 === undefined || b2 === undefined) {
    throw new Error('Invalid hex digit in blue channel');
  }
  b = b1 * 16 + b2;

  return { r, g, b };
}
