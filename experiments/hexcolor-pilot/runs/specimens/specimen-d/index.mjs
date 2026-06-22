export function parseHexColor(s) {
  // Validate input is a string
  if (typeof s !== 'string') {
    throw new TypeError('Color must be a string');
  }

  // Check format: must start with # and have exactly 6 hex digits
  if (s.length !== 7 || s[0] !== '#') {
    throw new Error('Invalid hex color format');
  }

  const hexDigits = s.slice(1);

  // Validate that all characters are valid hex digits
  if (!/^[0-9a-fA-F]{6}$/.test(hexDigits)) {
    throw new Error('Invalid hex color format');
  }

  // Parse as a single number using 0x prefix
  const colorNum = Number('0x' + hexDigits);

  // Extract channels using bit shifts and masks
  const r = (colorNum >> 16) & 0xFF;
  const g = (colorNum >> 8) & 0xFF;
  const b = colorNum & 0xFF;

  return { r, g, b };
}
