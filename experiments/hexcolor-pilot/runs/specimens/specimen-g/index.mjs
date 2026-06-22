export function parseHexColor(s) {
  if (typeof s !== 'string' || !s.startsWith('#')) {
    throw new Error('Invalid hex color: must start with #');
  }

  const body = s.slice(1);

  if (body.length !== 6) {
    throw new Error('Invalid hex color: must have exactly 6 hex digits');
  }

  const groups = body.match(/../g);

  if (!groups || groups.length !== 3) {
    throw new Error('Invalid hex color: failed to parse');
  }

  const [rHex, gHex, bHex] = groups;
  const r = parseInt(rHex, 16);
  const g = parseInt(gHex, 16);
  const b = parseInt(bHex, 16);

  // Validate that parsing succeeded (NaN check)
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error('Invalid hex color: non-hexadecimal characters');
  }

  return { r, g, b };
}
