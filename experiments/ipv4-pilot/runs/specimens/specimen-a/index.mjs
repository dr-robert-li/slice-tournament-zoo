export function parseIp(s) {
  const parts = s.split(".");
  const o0 = parseInt(parts[0], 10);
  const o1 = parseInt(parts[1], 10);
  const o2 = parseInt(parts[2], 10);
  const o3 = parseInt(parts[3], 10);
  return ((o0 * 256 + o1) * 256 + o2) * 256 + o3;
}
