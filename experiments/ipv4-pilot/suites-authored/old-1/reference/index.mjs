// Minimal correct reference for parseIp(s).
// Strict dotted-quad: exactly four decimal octets in [0,255], no leading zeros
// (beyond a lone "0"), no whitespace, no signs, no other forms. Throws otherwise.
// Returns an unsigned 32-bit Number via multiplication (never signed bit-shift).

export function parseIp(s) {
  if (typeof s !== "string") throw new TypeError("expected string");
  const parts = s.split(".");
  if (parts.length !== 4) throw new Error("expected four octets");
  let value = 0;
  for (const part of parts) {
    // Only ASCII digits, at least one, no sign, no whitespace, no other chars.
    if (!/^[0-9]+$/.test(part)) throw new Error("octet not a decimal integer");
    // Reject leading zeros (e.g. "01", "001") but allow a single "0".
    if (part.length > 1 && part[0] === "0") throw new Error("leading zero");
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      throw new RangeError("octet out of range");
    }
    value = value * 256 + octet;
  }
  // value is in [0, 4294967295]; ensure unsigned representation.
  return value >>> 0;
}
