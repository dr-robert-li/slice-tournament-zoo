// PUBLIC suite for slice `parseIp`. NOT sealed — readable by all conditions. Deliberately
// happy-path: only well-formed addresses, NO rejection cases (mirrors cron.public). That omission
// is intentional — it is the implementer-visible signal; the sealed suite is where rejection lives.
//
// Harness contract: node ip.public.mjs <impl-path>
// Imports `parseIp`; prints exactly one JSON line {"passed":int,"total":int,"passRate":float};
// exits 0 iff passRate===1. Node built-ins only.

let passed = 0, total = 0;
const V = (o0, o1, o2, o3) => ((o0 * 256 + o1) * 256 + o2) * 256 + o3;
const CASES = [
  ["0.0.0.0", V(0, 0, 0, 0)],
  ["1.2.3.4", V(1, 2, 3, 4)],
  ["255.255.255.255", V(255, 255, 255, 255)],
  ["192.168.1.1", V(192, 168, 1, 1)],
  ["10.0.0.1", V(10, 0, 0, 1)],
  ["8.8.8.8", V(8, 8, 8, 8)],
  ["172.16.254.1", V(172, 16, 254, 1)],
  ["127.0.0.1", V(127, 0, 0, 1)],
];

async function main() {
  const implPath = process.argv[2];
  let parseIp;
  try { parseIp = (await import(implPath)).parseIp; } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1); return;
  }
  if (typeof parseIp !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1); return;
  }
  for (const [s, want] of CASES) {
    total += 1;
    let got;
    try { got = parseIp(s); } catch { got = null; }
    if (got === want) passed += 1;
  }
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
