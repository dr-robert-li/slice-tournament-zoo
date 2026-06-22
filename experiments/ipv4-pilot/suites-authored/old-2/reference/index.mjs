// Minimal correct reference implementation of parseIp(s).
// Contract: dotted-quad IPv4 -> unsigned 32-bit integer (Number); throw on malformed.
//
// Rulings derived from CONTRACT-VAGUE.md:
//  - Exactly four decimal octets separated by single dots.
//  - Each octet 0..255, decimal digits only, no leading zeros (e.g. "01" rejected),
//    no sign, no whitespace, no hex/octal prefixes.
//  - Result computed via multiplication / unsigned coercion to avoid the signed
//    `<<24` overflow that breaks "255.255.255.255".

export function parseIp(s) {
  if (typeof s !== "string") {
    throw new TypeError("parseIp: input must be a string");
  }
  const parts = s.split(".");
  if (parts.length !== 4) {
    throw new Error("parseIp: not a dotted-quad");
  }
  let acc = 0;
  for (const part of parts) {
    // Decimal digits only: rejects "", "+1", "-1", " 1", "1 ", "0x1", "1e2", "0b1", etc.
    if (!/^[0-9]+$/.test(part)) {
      throw new Error("parseIp: octet not a non-negative decimal integer");
    }
    // No leading zeros (octal ambiguity); "0" itself is allowed.
    if (part.length > 1 && part[0] === "0") {
      throw new Error("parseIp: octet has leading zero");
    }
    const n = Number(part);
    if (n < 0 || n > 255 || !Number.isInteger(n)) {
      throw new RangeError("parseIp: octet out of range 0..255");
    }
    acc = acc * 256 + n;
  }
  // Unsigned 32-bit Number.
  return acc >>> 0;
}
