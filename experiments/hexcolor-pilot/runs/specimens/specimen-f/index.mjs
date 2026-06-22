export function parseHexColor(s) {
  if (typeof s !== 'string' || s[0] !== '#' || s.length !== 7) {
    throw new Error('Invalid hex color');
  }

  const r = parseInt(s.slice(1, 3), 16);
  const g = parseInt(s.slice(3, 5), 16);
  const b = parseInt(s.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error('Invalid hex color');
  }

  return { r, g, b };
}
