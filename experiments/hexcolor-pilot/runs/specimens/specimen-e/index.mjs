export function parseHexColor(s) {
  // Normalize: trim and lowercase
  const normalized = String(s).trim().toLowerCase();

  // Validate format: must start with # and have exactly 6 hex digits after
  if (!normalized.startsWith('#') || normalized.length !== 7) {
    throw new Error('Invalid hex color format');
  }

  // Extract and validate hex digits
  const hex = normalized.slice(1);
  if (!/^[0-9a-f]{6}$/.test(hex)) {
    throw new Error('Invalid hex color: must contain 6 hexadecimal digits');
  }

  // Parse each channel (2 hex digits = 1 byte)
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
}
