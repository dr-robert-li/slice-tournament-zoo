// SEALED held-out suite for slice `parseHexColor`.
// Harness: node hex.sealed.mjs <impl-path>
// Imports named export `parseHexColor`; prints exactly one JSON line
// {"passed":int,"total":int,"passRate":float}; exits 0 iff passRate===1.
// Node built-ins only. All generators are deterministic (fixed-seed PRNG +
// enumeration) so runs are reproducible.

let passed = 0, total = 0;
function check(cond) { total += 1; if (cond) passed += 1; }

// --- deterministic PRNG (mulberry32) -------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOWER = "0123456789abcdef";
const UPPER = "0123456789ABCDEF";
// Chars that are NOT hex digits under any case reading (excludes 0-9a-fA-F):
const NON_HEX = "ghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-= []{}|;:,.<>?/~`'\"\\";

function eqRGB(got, r, g, b) {
  return got && typeof got === "object" &&
    got.r === r && got.g === g && got.b === b;
}
function isValidShape(got) {
  if (!got || typeof got !== "object") return false;
  for (const k of ["r", "g", "b"]) {
    const v = got[k];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 255) return false;
  }
  return true;
}
function throws(fn) {
  try { fn(); return false; } catch { return true; }
}

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

  // ---- POSITIVE: fixed sanity / boundary cases ----
  // Boundaries and per-channel extremes catch channel-order swaps.
  const FIXED = [
    ["#000000", 0, 0, 0],
    ["#ffffff", 255, 255, 255],
    ["#ff8800", 255, 136, 0],
    ["#ff0000", 255, 0, 0],
    ["#00ff00", 0, 255, 0],
    ["#0000ff", 0, 0, 255],
    ["#010203", 1, 2, 3],
    ["#102030", 16, 32, 48],
    ["#abcdef", 171, 205, 239],
    ["#7f00ff", 127, 0, 255],
  ];
  for (const [s, r, g, b] of FIXED) {
    let got; try { got = parseHexColor(s); } catch { got = null; }
    check(eqRGB(got, r, g, b));
  }

  // ---- POSITIVE property: random well-formed lowercase 6-hex strings ----
  // Expected computed independently by slicing two-digit pairs.
  {
    const rnd = mulberry32(0x1234abcd);
    for (let i = 0; i < 400; i++) {
      let body = "";
      for (let k = 0; k < 6; k++) body += LOWER[Math.floor(rnd() * 16)];
      const s = "#" + body;
      const r = parseInt(body.slice(0, 2), 16);
      const g = parseInt(body.slice(2, 4), 16);
      const b = parseInt(body.slice(4, 6), 16);
      let got; try { got = parseHexColor(s); } catch { got = null; }
      // value correctness
      check(eqRGB(got, r, g, b));
      // shape invariants: integer numbers in 0..255
      check(isValidShape(got));
      // determinism / purity: same input twice -> deep equal
      let got2; try { got2 = parseHexColor(s); } catch { got2 = null; }
      check(got && got2 && got2.r === got.r && got2.g === got.g && got2.b === got.b);
    }
  }

  // ---- POSITIVE property: every single byte value 0..255 appears correctly ----
  // Sweep one channel through all 256 values (other channels fixed) to ensure
  // full-byte coverage and exact per-channel placement.
  {
    for (let v = 0; v <= 255; v++) {
      const hh = v.toString(16).padStart(2, "0");
      const s = "#" + hh + "5a" + "c3";
      let got; try { got = parseHexColor(s); } catch { got = null; }
      check(eqRGB(got, v, 0x5a, 0xc3));
    }
  }

  // ---- NEGATIVE: fixed malformed cases ----
  const BAD = [
    "",                 // empty
    "#",                // hash only
    "000000",           // missing #
    "#00000",           // 5 digits
    "#0000000",         // 7 digits
    "#ffffffff",        // 8 digits — must NOT silently take first 3 bytes
    "#fff",             // 3-digit shorthand: contract specifies SIX digits
    "#fffffg",          // invalid hex char
    "#gggggg",          // all invalid
    " #ffffff",         // leading whitespace (contract silent on trimming)
    "#ffffff ",         // trailing whitespace
    "#ff ffff",         // internal whitespace
    "prefix#ffffff",    // leading junk (unanchored start)
    "#ffffff extra",    // trailing junk (unanchored end)
    "##fffff",          // double hash
    "0xffffff",         // 0x prefix, no #
    "#12345",           // 5 digits
    "#1234567",         // 7 digits
    "rgb(0,0,0)",       // not hex at all
    "#-12345",          // sign char
  ];
  for (const s of BAD) {
    check(throws(() => parseHexColor(s)));
  }

  // ---- NEGATIVE property: mutate valid -> invalid, assert throws ----
  // (a) replace one position with a non-hex char (excludes 0-9a-fA-F entirely,
  //     so it is invalid under any case reading).
  {
    const rnd = mulberry32(0x9e3779b9);
    for (let i = 0; i < 300; i++) {
      let body = "";
      for (let k = 0; k < 6; k++) body += LOWER[Math.floor(rnd() * 16)];
      const pos = Math.floor(rnd() * 6);
      const bad = NON_HEX[Math.floor(rnd() * NON_HEX.length)];
      const mutated = "#" + body.slice(0, pos) + bad + body.slice(pos + 1);
      check(throws(() => parseHexColor(mutated)));
    }
  }
  // (b) wrong length: insert/remove hex digits (3,4,5,7,8,9,10 digit bodies).
  {
    const rnd = mulberry32(0x5bd1e995);
    const lengths = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 12];
    for (let i = 0; i < 250; i++) {
      const len = lengths[Math.floor(rnd() * lengths.length)];
      let body = "";
      for (let k = 0; k < len; k++) body += LOWER[Math.floor(rnd() * 16)];
      check(throws(() => parseHexColor("#" + body)));
    }
  }
  // (c) append trailing hex digits to an otherwise-valid 6-hex (the 8-digit
  //     family): catches start-anchored-only regex / parseInt-slice impls.
  {
    const rnd = mulberry32(0xdeadbeef);
    for (let i = 0; i < 200; i++) {
      let body = "";
      for (let k = 0; k < 6; k++) body += LOWER[Math.floor(rnd() * 16)];
      const extra = 1 + Math.floor(rnd() * 4);
      let tail = "";
      for (let k = 0; k < extra; k++) tail += LOWER[Math.floor(rnd() * 16)];
      check(throws(() => parseHexColor("#" + body + tail)));
    }
  }
  // (d) prepend/append junk around a valid color: catches unanchored matches.
  {
    const rnd = mulberry32(0x0badf00d);
    for (let i = 0; i < 150; i++) {
      let body = "";
      for (let k = 0; k < 6; k++) body += LOWER[Math.floor(rnd() * 16)];
      const valid = "#" + body;
      const junk = NON_HEX[Math.floor(rnd() * NON_HEX.length)];
      const variant = (rnd() < 0.5) ? junk + valid : valid + junk;
      check(throws(() => parseHexColor(variant)));
    }
  }

  // ---- NEGATIVE: non-string inputs (covered by "anything not well-formed") ----
  for (const x of [null, undefined, 123, 0xffffff, ["#ffffff"], { s: "#ffffff" }]) {
    check(throws(() => parseHexColor(x)));
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
