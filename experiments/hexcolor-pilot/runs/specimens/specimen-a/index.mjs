export function parseHexColor(s) {
  // Validate: # followed by exactly 6 hex digits
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  if (!hexRegex.test(s)) {
    throw new Error(`Invalid hex color: ${s}`);
  }

  // Extract the 6 hex digits after #
  const hex = s.slice(1);

  // Parse each pair of hex digits as a channel
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
}
