export function parseIp(s) {
  const parts = s.split('.');
  const o0 = Number(parts[0]);
  const o1 = Number(parts[1]);
  const o2 = Number(parts[2]);
  const o3 = Number(parts[3]);
  return ((o0 * 256 + o1) * 256 + o2) * 256 + o3;
}
