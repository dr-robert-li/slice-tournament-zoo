export function parseIp(s) {
  const match = s.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;

  const o0 = parseInt(match[1], 10);
  const o1 = parseInt(match[2], 10);
  const o2 = parseInt(match[3], 10);
  const o3 = parseInt(match[4], 10);

  return ((o0 * 256 + o1) * 256 + o2) * 256 + o3;
}
