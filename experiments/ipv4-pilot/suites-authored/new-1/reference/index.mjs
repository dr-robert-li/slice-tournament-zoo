// Minimal correct reference implementation for parseIp(s).
// Dotted-quad IPv4 -> unsigned 32-bit Number. Throws on malformed input.
// Note: rejects leading zeros (octal ambiguity). The contract is silent on
// leading zeros; this reference takes the strict stance, which is one
// defensible reading. The sealed suite deliberately does not test that case.

export function parseIp(s) {
  if (typeof s !== "string") {
    throw new TypeError("parseIp: expected a string");
  }
  const parts = s.split(".");
  if (parts.length !== 4) {
    throw new Error("parseIp: must have exactly four octets");
  }
  let value = 0;
  for (const part of parts) {
    // Non-empty, digits only.
    if (part.length === 0 || !/^[0-9]+$/.test(part)) {
      throw new Error(`parseIp: invalid octet ${JSON.stringify(part)}`);
    }
    // Reject leading zeros (strict / canonical decimal).
    if (part.length > 1 && part[0] === "0") {
      throw new Error(`parseIp: leading zero in octet ${JSON.stringify(part)}`);
    }
    const n = Number(part);
    if (n < 0 || n > 255) {
      throw new Error(`parseIp: octet out of range ${JSON.stringify(part)}`);
    }
    // Use arithmetic (not bitwise) to stay unsigned and within 32 bits.
    value = value * 256 + n;
  }
  return value;
}
