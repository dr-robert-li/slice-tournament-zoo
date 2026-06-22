// SEALED held-out suite for slice `parseHexColor`.
// Harness contract: node hex.sealed.mjs <impl-path>
//   - dynamically import named export `parseHexColor` from impl path
//   - run all checks
//   - print EXACTLY one JSON line {"passed":int,"total":int,"passRate":float}
//   - exit 0 iff passRate === 1
// Node built-ins only. All generators are deterministic (fixed-seed LCG / enumeration).
//
// Contract under test:
//   parseHexColor(s) -> { r, g, b } integers 0-255.
//   Well-formed = `#` followed by exactly six hexadecimal digits (two per channel).
//   Hex digit = [0-9a-fA-F] (standard definition).
//   Throw on anything that is not a well-formed six-digit hex color.
//   Pure & deterministic.

let passed = 0,
  total = 0;
const failures = [];
const CHECKS = [];

// Register a check; it runs later, after the impl is imported.
function check(name, fn) {
  CHECKS.push({ name, fn });
}

// ---- assertion helpers --------------------------------------------------
function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}
function assertEqualRGB(got, want, ctx) {
  assert(got !== null && got !== undefined && typeof got === "object",
    `${ctx}: expected an object, got ${typeof got}`);
  // numeric channels
  for (const k of ["r", "g", "b"]) {
    assert(typeof got[k] === "number", `${ctx}: channel ${k} not a number (got ${typeof got[k]})`);
    assert(Number.isInteger(got[k]), `${ctx}: channel ${k} not an integer (got ${got[k]})`);
    assert(got[k] >= 0 && got[k] <= 255, `${ctx}: channel ${k} out of 0-255 (got ${got[k]})`);
  }
  assert(got.r === want.r && got.g === want.g && got.b === want.b,
    `${ctx}: expected {r:${want.r},g:${want.g},b:${want.b}} got {r:${got.r},g:${got.g},b:${got.b}}`);
}

// Independent oracle parser. Deliberately written digit-by-digit (NOT a regex,
// NOT parseInt on slices) so it shares no structure with a plausible impl.
const HEXVAL = (() => {
  const m = Object.create(null);
  "0123456789".split("").forEach((c, i) => (m[c] = i));
  "abcdef".split("").forEach((c, i) => (m[c] = 10 + i));
  "ABCDEF".split("").forEach((c, i) => (m[c] = 10 + i));
  return m;
})();
function oracle(s) {
  // returns {r,g,b} for a well-formed string, else throws.
  if (typeof s !== "string") throw new Error("oracle: not a string");
  if (s.length !== 7) throw new Error("oracle: bad length");
  if (s[0] !== "#") throw new Error("oracle: no hash");
  const v = [];
  for (let i = 1; i < 7; i++) {
    const d = HEXVAL[s[i]];
    if (d === undefined) throw new Error("oracle: bad digit");
    v.push(d);
  }
  return { r: v[0] * 16 + v[1], g: v[2] * 16 + v[3], b: v[4] * 16 + v[5] };
}

function expectThrow(parse, input, ctx) {
  let threw = false;
  try {
    parse(input);
  } catch (_) {
    threw = true;
  }
  assert(threw, `${ctx}: expected parseHexColor(${JSON.stringify(input)}) to throw, but it did not`);
}

// ---- deterministic PRNG (mulberry32) ------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const HEXLOWER = "0123456789abcdef";
const HEXUPPER = "0123456789ABCDEF";
function randInt(rnd, n) {
  return Math.floor(rnd() * n);
}

// ============================================================
// 1. HAPPY PATH — fixed sanity examples from the contract.
// ============================================================
const SANITY = [
  ["#000000", { r: 0, g: 0, b: 0 }],
  ["#ffffff", { r: 255, g: 255, b: 255 }],
  ["#ff8800", { r: 255, g: 136, b: 0 }],
  ["#123456", { r: 18, g: 52, b: 86 }],
];
for (const [s, want] of SANITY) {
  check(`sanity ${s}`, () => {
    const got = main_parse(s);
    assertEqualRGB(got, want, `sanity ${s}`);
  });
}

// ============================================================
// 2. BOUNDARIES — channel min/max and per-channel isolation.
//    Discriminating: catches impls that swap/duplicate channels,
//    use signed math, or truncate a digit.
// ============================================================
const BOUNDARY = [
  ["#ff0000", { r: 255, g: 0, b: 0 }], // red only
  ["#00ff00", { r: 0, g: 255, b: 0 }], // green only
  ["#0000ff", { r: 0, g: 0, b: 255 }], // blue only
  ["#010203", { r: 1, g: 2, b: 3 }], // distinct small values, order-sensitive
  ["#0f0f0f", { r: 15, g: 15, b: 15 }], // low nibble
  ["#f0f0f0", { r: 240, g: 240, b: 240 }], // high nibble
  ["#80402a", { r: 128, g: 64, b: 42 }], // mid values
];
for (const [s, want] of BOUNDARY) {
  check(`boundary ${s}`, () => {
    const got = main_parse(s);
    assertEqualRGB(got, want, `boundary ${s}`);
  });
}

// Channel-order discrimination: a value where r,g,b are all different and
// none is symmetric, so a transposed/mirrored parse gives a wrong answer.
check("channel order #1a2b3c", () => {
  const got = main_parse("#1a2b3c");
  assertEqualRGB(got, { r: 26, g: 43, b: 60 }, "channel order");
});

// ============================================================
// 3. UPPERCASE / MIXED CASE — hex digits include A-F.
//    "six hexadecimal digits" => uppercase A-F are valid hex digits.
// ============================================================
const CASE_CASES = [
  ["#FFFFFF", { r: 255, g: 255, b: 255 }],
  ["#ABCDEF", { r: 171, g: 205, b: 239 }],
  ["#Ff8800", { r: 255, g: 136, b: 0 }],
  ["#aAbBcC", { r: 170, g: 187, b: 204 }],
];
for (const [s, want] of CASE_CASES) {
  check(`case ${s}`, () => {
    const got = main_parse(s);
    assertEqualRGB(got, want, `case ${s}`);
  });
}

// ============================================================
// 4. PROPERTY: positive round-trip over generated valid colors.
//    Deterministic LCG; oracle computes the expected RGB independently.
//    Mix of lower / upper / mixed case.
// ============================================================
check("property: 400 random valid colors round-trip", () => {
  const rnd = rng(0x1234abcd);
  for (let i = 0; i < 400; i++) {
    // choose case mode per char to exercise mixed case
    let s = "#";
    for (let d = 0; d < 6; d++) {
      const mode = randInt(rnd, 3); // 0 lower, 1 upper, 2 digit-leaning
      if (mode === 1) s += HEXUPPER[randInt(rnd, 16)];
      else s += HEXLOWER[randInt(rnd, 16)];
    }
    const want = oracle(s);
    const got = main_parse(s);
    assertEqualRGB(got, want, `property valid #${i} (${s})`);
  }
});

// Exhaustive-ish: every value for one channel while others fixed, to catch
// off-by-one / truncation in the byte math. Enumerate all 256 red values.
check("enumerate all 256 red byte values", () => {
  for (let n = 0; n < 256; n++) {
    const hh = n.toString(16).padStart(2, "0");
    const s = "#" + hh + "abcd"; // g=ab, b=cd fixed
    const got = main_parse(s);
    assertEqualRGB(got, { r: n, g: 171, b: 205 }, `red=${n} (${s})`);
  }
});

// ============================================================
// 5. PURITY / DETERMINISM — same input twice gives equal result,
//    and parsing one input does not perturb another.
// ============================================================
check("determinism: repeated calls equal", () => {
  const a = main_parse("#13579b");
  const b = main_parse("#13579b");
  assertEqualRGB(a, { r: 19, g: 87, b: 155 }, "determinism a");
  assertEqualRGB(b, { r: 19, g: 87, b: 155 }, "determinism b");
});
check("no cross-call state leakage", () => {
  main_parse("#ffffff");
  const got = main_parse("#000000");
  assertEqualRGB(got, { r: 0, g: 0, b: 0 }, "leakage");
});

// ============================================================
// 6. CONTRACT-MANDATED REJECTION — explicit malformed inputs.
//    Each is "not a well-formed six-digit hex color" => must throw.
// ============================================================
const REJECT = [
  "", // empty
  "#", // hash only
  "#fff", // 3 digits (shorthand NOT in contract)
  "#ffff", // 4 digits
  "#fffff", // 5 digits
  "#fffffff", // 7 digits
  "#ffffffff", // 8 digits (alpha NOT in contract)
  "ffffff", // missing hash
  "000000", // missing hash, all-digit
  "#gggggg", // non-hex letters
  "#12345z", // single trailing non-hex
  "#z12345", // single leading non-hex
  "#12 456", // internal space
  " #123456", // leading whitespace
  "#123456 ", // trailing whitespace
  "#123456\n", // trailing newline
  "##12345", // double hash
  "#12345 ", // 5 digits + space (length 7 but invalid)
  "0x123456", // 0x prefix
  "#1234 6", // space inside
  "#-12345", // sign char
  "#+12345", // sign char
  "#1234.6", // dot
  "rgb(0,0,0)", // css function form
  "#ffffff#ffffff", // doubled
  "#  ", // hash + spaces
  "blue", // color name
  "#½23456", // non-ascii digit-like
  "#𝟙23456", // unicode mathematical digit
];
for (const bad of REJECT) {
  check(`reject ${JSON.stringify(bad)}`, () => {
    expectThrow(main_parse, bad, "reject");
  });
}

// Non-string inputs are not a well-formed hex color string => must throw.
const NON_STRING = [null, undefined, 123, 0xffffff, true, {}, [], ["#ffffff"], NaN, Symbol ? Symbol("#ffffff") : "x"];
for (let i = 0; i < NON_STRING.length; i++) {
  const bad = NON_STRING[i];
  check(`reject non-string idx ${i}`, () => {
    expectThrow(main_parse, bad, "reject non-string");
  });
}

// ============================================================
// 7. PROPERTY: negative space via mutation of valid colors.
//    Mutate a valid string into an invalid one and assert throw.
//    Explores parser soft spots a fixed list misses.
// ============================================================
const NONHEX = "ghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ!@$%^&*()_+=[]{};:'\",<.>/?\\| \t~`";

check("property: 300 mutated-invalid colors throw", () => {
  const rnd = rng(0x0badf00d);
  for (let i = 0; i < 300; i++) {
    // build a valid base
    let base = "#";
    for (let d = 0; d < 6; d++) base += HEXLOWER[randInt(rnd, 16)];

    const kind = randInt(rnd, 6);
    let bad;
    if (kind === 0) {
      // replace one hex digit (pos 1..6) with a non-hex char
      const pos = 1 + randInt(rnd, 6);
      const ch = NONHEX[randInt(rnd, NONHEX.length)];
      bad = base.slice(0, pos) + ch + base.slice(pos + 1);
    } else if (kind === 1) {
      // drop the leading '#'
      bad = base.slice(1);
    } else if (kind === 2) {
      // remove one character -> length 6 (too short)
      const pos = randInt(rnd, base.length);
      bad = base.slice(0, pos) + base.slice(pos + 1);
    } else if (kind === 3) {
      // insert an extra hex digit -> length 8 (too long)
      const pos = 1 + randInt(rnd, 6);
      bad = base.slice(0, pos) + HEXLOWER[randInt(rnd, 16)] + base.slice(pos);
    } else if (kind === 4) {
      // replace '#' with some other char
      const ch = NONHEX[randInt(rnd, NONHEX.length)];
      bad = ch + base.slice(1);
    } else {
      // append a stray non-hex char
      bad = base + NONHEX[randInt(rnd, NONHEX.length)];
    }
    // Guard: if mutation accidentally produced a still-valid color, skip.
    let stillValid = false;
    try {
      oracle(bad);
      stillValid = true;
    } catch (_) {}
    if (stillValid) continue;
    expectThrow(main_parse, bad, `mutated #${i} (${JSON.stringify(bad)})`);
  }
});

// ============================================================
// runner
// ============================================================
let main_parse;
async function main() {
  const implPath = process.argv[2];
  try {
    const mod = await import(implPath);
    main_parse = mod.parseHexColor;
  } catch (e) {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  if (typeof main_parse !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  // run all registered checks (they were defined to call main_parse at run time)
  for (const c of CHECKS) {
    total += 1;
    try {
      c.fn();
      passed += 1;
    } catch (e) {
      failures.push(c.name + ": " + (e && e.message ? e.message : String(e)));
    }
  }
  const passRate = total === 0 ? 0 : passed / total;
  if (process.env.HEX_SUITE_DEBUG && failures.length) {
    process.stderr.write(failures.join("\n") + "\n");
  }
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
