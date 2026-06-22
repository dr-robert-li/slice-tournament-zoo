// Minimal correct reference implementation of parseIp(s).
// Contract: dotted-quad IPv4 string -> unsigned 32-bit Number.
// Throws on any malformed / out-of-range input.

export function parseIp(s) {
  if (typeof s !== "string") {
    throw new TypeError("parseIp: input must be a string");
  }
  const parts = s.split(".");
  if (parts.length !== 4) {
    throw new Error(`parseIp: expected 4 octets, got ${parts.length}`);
  }
  let value = 0;
  for (const part of parts) {
    // Must be a non-empty run of ASCII decimal digits only.
    if (part.length === 0 || !/^[0-9]+$/.test(part)) {
      throw new Error(`parseIp: malformed octet ${JSON.stringify(part)}`);
    }
    const n = Number(part);
    if (n > 255) {
      throw new Error(`parseIp: octet out of range ${part}`);
    }
    value = value * 256 + n;
  }
  // Ensure unsigned 32-bit Number.
  return value >>> 0;
}
