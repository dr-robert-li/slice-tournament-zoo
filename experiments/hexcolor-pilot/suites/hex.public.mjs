// PUBLIC suite for slice `parseHexColor`. NOT sealed — readable by all conditions. Deliberately
// happy-path: only well-formed colors, NO rejection cases (mirrors ip.public / cron.public). That
// omission is intentional — it is the implementer-visible signal; the sealed suite is where
// rejection lives.
//
// Harness contract: node hex.public.mjs <impl-path>
// Imports `parseHexColor`; prints exactly one JSON line {"passed":int,"total":int,"passRate":float};
// exits 0 iff passRate===1. Node built-ins only.

let passed = 0, total = 0;
const CASES = [
  ["#000000", { r: 0, g: 0, b: 0 }],
  ["#ffffff", { r: 255, g: 255, b: 255 }],
  ["#ff8800", { r: 255, g: 136, b: 0 }],
  ["#123456", { r: 18, g: 52, b: 86 }],
  ["#0a0b0c", { r: 10, g: 11, b: 12 }],
  ["#abcdef", { r: 171, g: 205, b: 239 }],
  ["#7f7f7f", { r: 127, g: 127, b: 127 }],
  ["#deadbe", { r: 222, g: 173, b: 190 }],
];

async function main() {
  const implPath = process.argv[2];
  let parseHexColor;
  try { parseHexColor = (await import(implPath)).parseHexColor; } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1); return;
  }
  if (typeof parseHexColor !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1); return;
  }
  for (const [s, want] of CASES) {
    total += 1;
    let got;
    try { got = parseHexColor(s); } catch { got = null; }
    if (got && got.r === want.r && got.g === want.g && got.b === want.b) passed += 1;
  }
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
