export function parseIp(s) {
  const octets = [];
  let current = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (ch === '.') {
      octets.push(current);
      current = 0;
    } else {
      const digit = ch.charCodeAt(0) - 48; // '0' is 48
      current = current * 10 + digit;
    }
  }

  // Push the final octet
  octets.push(current);

  // Convert to 32-bit number using the formula from the test
  const [o0, o1, o2, o3] = octets;
  return ((o0 * 256 + o1) * 256 + o2) * 256 + o3;
}
