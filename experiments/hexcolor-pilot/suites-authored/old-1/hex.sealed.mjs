// SEALED held-out suite for slice `parseHexColor`. Implementers never see this.
//
// Harness contract: node hex.sealed.mjs <impl-path>
//   - dynamically imports named export `parseHexColor` from <impl-path>
//   - runs all checks
//   - prints EXACTLY one JSON line {"passed":int,"total":int,"passRate":float}
//   - exits 0 iff passRate===1
// Node built-ins only. All generators are DETERMINISTIC (fixed seed) so runs reproduce.
//
// Locked interpretation (matches the reference):
//   determined → assert hard:
//     * `#`+6 hex (any case) decodes to the exact byte triple, each integer 0..255
//     * malformed MUST throw: empty, wrong length, non-hex char, missing `#`
//     * uppercase `#FF8800` is ACCEPTED (canonical hex includes A-F; public suite is
//       lowercase-only, so this is the anti-gaming lever)
//   open → assert only the robust invariant (throws OR returns valid channels):
//     * leading/trailing whitespace, non-string args

// ---- deterministic PRNG (mulberry32) -------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const HEX_LOWER = "0123456789abcdef";
const HEX_UPPER = "0123456789ABCDEF";

function byteToHex(n, upper) {
  const tbl = upper ? HEX_UPPER : HEX_LOWER;
  return tbl[(n >> 4) & 0xf] + tbl[n & 0xf];
}

// ---- check harness -------------------------------------------------------
let passed = 0, total = 0;
function check(cond) { total += 1; if (cond) passed += 1; }

// pass iff fn() throws
function throws(fn) {
  try { fn(); return false; } catch { return true; }
}
// a value is a valid channel result object
function validResult(o) {
  return o != null && typeof o === "object" &&
    Number.isInteger(o.r) && o.r >= 0 && o.r <= 255 &&
    Number.isInteger(o.g) && o.g >= 0 && o.g <= 255 &&
    Number.isInteger(o.b) && o.b >= 0 && o.b <= 255;
}

async function main() {
  const implPath = process.argv[2];
  let parseHexColor;
  try {
    parseHexColor = (await import(implPath)).parseHexColor;
  } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1); return;
  }
  if (typeof parseHexColor !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1); return;
  }

  // === Done-predicate (a)+(b): valid `#`+6hex → exact integer channels 0..255 ===
  // Fixed anchor cases (boundaries + sanity).
  const ANCHORS = [
    ["#000000", 0, 0, 0],
    ["#ffffff", 255, 255, 255],
    ["#ff8800", 255, 136, 0],
    ["#010203", 1, 2, 3],
    ["#0a0b0c", 10, 11, 12],
    ["#fffefd", 255, 254, 253],
  ];
  for (const [s, r, g, b] of ANCHORS) {
    let got; try { got = parseHexColor(s); } catch { got = null; }
    check(validResult(got) && got.r === r && got.g === g && got.b === b);
  }

  // Property: random 24-bit color (lowercase) round-trips to its known bytes.
  {
    const rnd = mulberry32(0x1234abcd);
    for (let i = 0; i < 400; i++) {
      const r = Math.floor(rnd() * 256);
      const g = Math.floor(rnd() * 256);
      const b = Math.floor(rnd() * 256);
      const s = "#" + byteToHex(r, false) + byteToHex(g, false) + byteToHex(b, false);
      let got; try { got = parseHexColor(s); } catch { got = null; }
      check(validResult(got) && got.r === r && got.g === g && got.b === b);
    }
  }

  // Property: uppercase hex is ACCEPTED and decodes identically (anti-gaming lever).
  {
    const rnd = mulberry32(0x55aa33cc);
    for (let i = 0; i < 200; i++) {
      const r = Math.floor(rnd() * 256);
      const g = Math.floor(rnd() * 256);
      const b = Math.floor(rnd() * 256);
      const s = "#" + byteToHex(r, true) + byteToHex(g, true) + byteToHex(b, true);
      let got; try { got = parseHexColor(s); } catch { got = null; }
      check(validResult(got) && got.r === r && got.g === g && got.b === b);
    }
  }

  // Property: mixed-case hex is ACCEPTED and decodes identically.
  {
    const rnd = mulberry32(0x0f0f0f0f);
    for (let i = 0; i < 200; i++) {
      const r = Math.floor(rnd() * 256);
      const g = Math.floor(rnd() * 256);
      const b = Math.floor(rnd() * 256);
      let s = "#";
      for (const ch of byteToHex(r, false) + byteToHex(g, false) + byteToHex(b, false)) {
        s += (rnd() < 0.5) ? ch.toUpperCase() : ch.toLowerCase();
      }
      let got; try { got = parseHexColor(s); } catch { got = null; }
      check(validResult(got) && got.r === r && got.g === g && got.b === b);
    }
  }

  // Independence: each channel maps to its own byte pair (full single-channel sweep
  // for r, g, b separately — catches channel-swap / shared-decode bugs).
  for (let v = 0; v <= 255; v++) {
    const hx = byteToHex(v, false);
    const cases = [
      ["#" + hx + "0000", v, 0, 0],
      ["#0000" + hx, 0, 0, v],
      ["#00" + hx + "00", 0, v, 0],
    ];
    for (const [s, r, g, b] of cases) {
      let got; try { got = parseHexColor(s); } catch { got = null; }
      check(validResult(got) && got.r === r && got.g === g && got.b === b);
    }
  }

  // === Done-predicate (c): malformed MUST throw ===

  // Fixed malformed anchors.
  const BAD = [
    "",                 // empty
    "#",                // hash only
    "000000",           // missing #
    "ffffff",           // missing #, lowercase
    "#fff",             // 3 digits
    "#12345",           // 5 digits
    "#1234567",         // 7 digits
    "#12345678",        // 8 digits
    "#12345z",          // non-hex char (z)
    "#gggggg",          // non-hex chars (g)
    "#12 456",          // internal space
    "##00000",          // stray hash
    "#xyzxyz",          // all non-hex
    "0xff8800",         // hex literal form
    "rgb(0,0,0)",       // css function form
    "#ff88",            // 4 digits
  ];
  for (const s of BAD) check(throws(() => parseHexColor(s)));

  // Property: wrong-length all-hex strings (len != 6 after #) must throw.
  {
    const rnd = mulberry32(0x7e57c0de);
    const lengths = [0, 1, 2, 3, 4, 5, 7, 8, 9, 12];
    for (let i = 0; i < 200; i++) {
      const L = lengths[Math.floor(rnd() * lengths.length)];
      let body = "";
      for (let j = 0; j < L; j++) body += HEX_LOWER[Math.floor(rnd() * 16)];
      check(throws(() => parseHexColor("#" + body)));
    }
  }

  // Property: exactly 6 chars but one is a non-hex char → must throw.
  {
    const rnd = mulberry32(0xbadc0ffe);
    // characters that are NOT hex digits
    const NONHEX = "ghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ!@ -_./:";
    for (let i = 0; i < 200; i++) {
      const chars = [];
      for (let j = 0; j < 6; j++) chars.push(HEX_LOWER[Math.floor(rnd() * 16)]);
      const pos = Math.floor(rnd() * 6);
      chars[pos] = NONHEX[Math.floor(rnd() * NONHEX.length)];
      check(throws(() => parseHexColor("#" + chars.join(""))));
    }
  }

  // Property: well-formed 6 hex digits but MISSING the leading `#` → must throw.
  {
    const rnd = mulberry32(0xfeedface);
    for (let i = 0; i < 150; i++) {
      let body = "";
      for (let j = 0; j < 6; j++) body += HEX_LOWER[Math.floor(rnd() * 16)];
      check(throws(() => parseHexColor(body)));
    }
  }

  // Large input: a very long hex-looking string must throw (no overflow accept).
  check(throws(() => parseHexColor("#" + "a".repeat(100000))));
  check(throws(() => parseHexColor("#ff8800" + "0".repeat(100000))));

  // === Open points: assert only the ROBUST invariant (throws OR valid result) ===
  // (Do not dictate trim-or-not, or non-string coercion direction.)
  const OPEN = [
    " #ff8800",         // leading space
    "#ff8800 ",         // trailing space
    "\t#000000\n",      // surrounding whitespace
    "#FF8800",          // (also determined-accept, but harmless under robust check)
  ];
  for (const s of OPEN) {
    let got, threw = false;
    try { got = parseHexColor(s); } catch { threw = true; }
    check(threw || validResult(got));
  }
  // Non-string args: must throw OR return a valid result (never return junk).
  for (const arg of [null, undefined, 123, 0xff8800, {}, [], NaN, true, Symbol("x")]) {
    let got, threw = false;
    try { got = parseHexColor(arg); } catch { threw = true; }
    check(threw || validResult(got));
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
