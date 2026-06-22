export function parseHexColor(s) {
  // Guard: must start with # and have exactly 7 characters (# + 6 hex digits)
  if (typeof s !== 'string' || s.length !== 7 || s[0] !== '#') {
    throw new Error('Invalid hex color format');
  }

  // Extract the 6-character hex portion
  const hex = s.slice(1);

  // Guard: all characters must be valid hex digits
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error('Invalid hex color format');
  }

  // Parse each channel as a 2-character hex value
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
}
