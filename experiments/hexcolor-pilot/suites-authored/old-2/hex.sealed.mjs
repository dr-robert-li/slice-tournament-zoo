// SEALED held-out suite for slice `parseHexColor`. Not visible to implementers.
//
// Harness contract: node hex.sealed.mjs <impl-path>
// - dynamically import the named export `parseHexColor` from <impl-path>
// - run all checks
// - print EXACTLY one JSON line {"passed":int,"total":int,"passRate":float}
// - exit 0 iff passRate===1
// Node built-ins only. Property loops are deterministic (seeded LCG / enumeration).
//
// Done-predicates encoded:
//   (P1) standard six-digit `#rrggbb` parses to the correct {r,g,b}
//   (P2) channels are INTEGERS in 0..255, object has numeric r,g,b
//   (P3) malformed input THROWS (we count any throw; never assert error type/message)
//
// Deliberately NOT counted (correct strict vs. lenient impls legitimately diverge):
//   uppercase / mixed-case acceptance, leading/trailing surrounding whitespace.

import { pathToFileURL } from "node:url";
import { isAbsolute, resolve } from "node:path";

let passed = 0, total = 0;
const results = [];
function check(name, cond) {
  total += 1;
  if (cond) passed += 1;
  results.push([name, !!cond]);
}

// ---- Deterministic PRNG: 32-bit LCG (Numerical Recipes constants) ----
function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state; // 0 .. 2^32-1
  };
}

const HEXD = "0123456789abcdef";
function byteToHex(n) {
  return HEXD[(n >> 4) & 0xf] + HEXD[n & 0xf];
}
// Independent oracle: expected channel value from a 2-char hex pair.
function oracleByte(hi, lo) {
  return HEXD.indexOf(hi) * 16 + HEXD.indexOf(lo);
}

async function main() {
  const implPath = process.argv[2];
  let parseHexColor;
  try {
    const abs = isAbsolute(implPath) ? implPath : resolve(process.cwd(), implPath);
    parseHexColor = (await import(pathToFileURL(abs).href)).parseHexColor;
  } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  if (typeof parseHexColor !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }

  const callOk = (s) => {
    try {
      return { ok: true, val: parseHexColor(s) };
    } catch {
      return { ok: false };
    }
  };
  const throws = (s) => {
    try { parseHexColor(s); return false; } catch { return true; }
  };
  const shapeOk = (o, r, g, b) =>
    o != null && typeof o === "object" &&
    Number.isInteger(o.r) && Number.isInteger(o.g) && Number.isInteger(o.b) &&
    o.r >= 0 && o.r <= 255 && o.g >= 0 && o.g <= 255 && o.b >= 0 && o.b <= 255 &&
    o.r === r && o.g === g && o.b === b;

  // ===== Bucket 1: happy path, exact known values (P1, P2) =====
  const KNOWN = [
    ["#000000", 0, 0, 0],
    ["#ffffff", 255, 255, 255],
    ["#ff8800", 255, 136, 0],
    ["#123456", 18, 52, 86],
    ["#0a0b0c", 10, 11, 12],
    ["#abcdef", 171, 205, 239],
    ["#010203", 1, 2, 3],
    ["#fedcba", 254, 220, 186],
    ["#808080", 128, 128, 128],
    ["#00ff00", 0, 255, 0],
    ["#0000ff", 0, 0, 255],
    ["#f0f0f0", 240, 240, 240],
  ];
  for (const [s, r, g, b] of KNOWN) {
    const res = callOk(s);
    check(`known ${s}`, res.ok && shapeOk(res.val, r, g, b));
  }

  // ===== Bucket 2: property-based acceptance (P1, P2) =====
  // Generate random lowercase #rrggbb, verify against independent oracle.
  // Seeded => reproducible, but the exact inputs are not knowable from the brief.
  {
    const rng = makeRng(0x9e3779b1);
    const N = 400;
    let allGood = true;
    let boundary255 = false, boundary0 = false;
    for (let i = 0; i < N; i++) {
      const r = rng() % 256, g = rng() % 256, b = rng() % 256;
      const s = "#" + byteToHex(r) + byteToHex(g) + byteToHex(b);
      // cross-check oracle agrees with our byte construction
      const er = oracleByte(s[1], s[2]);
      const eg = oracleByte(s[3], s[4]);
      const eb = oracleByte(s[5], s[6]);
      const res = callOk(s);
      if (!(res.ok && shapeOk(res.val, er, eg, eb))) allGood = false;
      if (r === 255 || g === 255 || b === 255) boundary255 = true;
      if (r === 0 || g === 0 || b === 0) boundary0 = true;
    }
    check("property: random lowercase #rrggbb parse exactly (oracle)", allGood);
    check("property: sample hit a 255 boundary channel", boundary255);
    check("property: sample hit a 0 boundary channel", boundary0);
  }

  // Explicit per-channel isolation: vary one channel, others fixed (P1).
  {
    let good = true;
    const rng = makeRng(0x1234abcd);
    for (let i = 0; i < 64; i++) {
      const v = rng() % 256;
      const sR = "#" + byteToHex(v) + "0000";
      const sG = "#00" + byteToHex(v) + "00";
      const sB = "#0000" + byteToHex(v);
      const a = callOk(sR), c = callOk(sG), d = callOk(sB);
      if (!(a.ok && shapeOk(a.val, v, 0, 0))) good = false;
      if (!(c.ok && shapeOk(c.val, 0, v, 0))) good = false;
      if (!(d.ok && shapeOk(d.val, 0, 0, v))) good = false;
    }
    check("property: per-channel isolation maps to correct slot", good);
  }

  // ===== Bucket 3: rejection, enumerated unambiguously-invalid (P3) =====
  // Every entry is malformed under ANY reasonable strict reading; a regex/slice
  // impl throws on all. We assert throwing only — never error type/message.
  const REJECT = [
    "",                 // empty
    "ffffff",           // missing '#'
    "#",                // hash only
    "#fff",             // 3 digits
    "#fffff",           // 5 digits
    "#fffffff",         // 7 digits
    "#ffffffff",        // 8 digits
    "#gggggg",          // non-hex letters
    "#12345z",          // trailing non-hex
    "#12g456",          // internal non-hex
    "#ff ff ff",        // internal spaces
    "##ffffff",         // double hash
    "#ffffff#",         // trailing hash
    "0xffffff",         // wrong prefix
    "#ffff",            // 4 digits
    "#ff_f00",          // underscore
    "#ff.f00",          // dot
    "rgb(1,2,3)",       // not hex at all
    "#-12345",          // sign char
    "#fffff ",          // 5 digits + trailing space (length 7, still malformed)
  ];
  for (const s of REJECT) {
    check(`reject ${JSON.stringify(s)}`, throws(s));
  }

  // Non-string inputs: regex/.test/.slice impls throw on all of these (P3).
  const NONSTRING = [null, undefined, 123, 0xffffff, {}, [], true, NaN, () => {}, Symbol("x")];
  for (const v of NONSTRING) {
    check(`reject non-string ${String(typeof v)}:${String(v).slice(0, 12)}`, throws(v));
  }

  // ===== Bucket 4: property-based rejection (P3) =====
  // Wrong-length all-hex strings (length != 6 after '#') must throw.
  {
    const rng = makeRng(0x0badf00d);
    let good = true;
    for (let i = 0; i < 200; i++) {
      let len = rng() % 12; // 0..11, deliberately excluding 6
      if (len === 6) len = 7;
      let body = "";
      for (let j = 0; j < len; j++) body += HEXD[rng() % 16];
      good = good && throws("#" + body);
    }
    check("property: wrong-length hex bodies throw", good);
  }

  // Strings containing exactly one non-hex character in an otherwise valid #rrggbb
  // must throw (mutate one position to a guaranteed non-hex char).
  {
    const rng = makeRng(0xfeedface);
    const badChars = "ghijklmnopqrstuvwxyz!@$%^&*()_+-= ";
    let good = true;
    for (let i = 0; i < 200; i++) {
      const r = rng() % 256, g = rng() % 256, b = rng() % 256;
      const base = "#" + byteToHex(r) + byteToHex(g) + byteToHex(b); // 7 chars
      const pos = 1 + (rng() % 6); // index 1..6 (a hex digit position)
      const bad = badChars[rng() % badChars.length];
      const mutated = base.slice(0, pos) + bad + base.slice(pos + 1);
      good = good && throws(mutated);
    }
    check("property: single non-hex char anywhere throws", good);
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}

main();
