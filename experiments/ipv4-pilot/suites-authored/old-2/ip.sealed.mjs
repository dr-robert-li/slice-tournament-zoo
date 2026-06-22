// Sealed held-out test suite for parseIp(s).
//
// Harness contract:
//   node ip.sealed.mjs <impl-path>
//   - dynamically imports `parseIp` from <impl-path> (ESM await import)
//   - runs all checks
//   - prints EXACTLY one JSON line: {"passed":N,"total":M,"passRate":F}
//   - exits 0 iff passRate === 1
//   - Node built-ins only
//   - each check wrapped in try/catch:
//       expected-value check: a throw => FAIL
//       expected-throw  check: a throw => PASS
//
// "fast-check style" is approximated with hand-rolled randomized generators
// (Math.random) since fast-check is not a Node built-in. Valid-input cases use
// an independent oracle (never the impl) to compute the expected integer.

const implPath = process.argv[2];

let passed = 0;
let total = 0;

// ---- check helpers ---------------------------------------------------------

// Expect parseIp(input) === expected (strict). Throwing is a failure.
function expectValue(parseIp, input, expected) {
  total++;
  try {
    const got = parseIp(input);
    if (typeof got === "number" && Object.is(got, expected)) {
      passed++;
    }
  } catch {
    // throw where a value is expected => fail (no increment)
  }
}

// Expect parseIp(input) to be a Number that is a valid uint32 (no exact value).
function expectUint32(parseIp, input) {
  total++;
  try {
    const got = parseIp(input);
    if (
      typeof got === "number" &&
      Number.isInteger(got) &&
      got >= 0 &&
      got <= 0xffffffff
    ) {
      passed++;
    }
  } catch {
    // fail
  }
}

// Expect parseIp(input) to throw. A throw => pass; a return => fail.
function expectThrow(parseIp, input) {
  total++;
  try {
    parseIp(input);
    // returned a value where a throw was expected => fail
  } catch {
    passed++;
  }
}

// Independent oracle for a valid dotted-quad of four in-range octets.
function oracle(o0, o1, o2, o3) {
  return ((o0 * 256 + o1) * 256 + o2) * 256 + o3;
}

// Tiny deterministic-ish PRNG seeding via Math.random; inputs are unknowable
// in advance to a specimen author (no fixed list to special-case).
function randInt(maxInclusive) {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

// ---- main ------------------------------------------------------------------

async function main() {
  let parseIp;
  try {
    const mod = await import(implPath);
    parseIp = mod.parseIp;
  } catch {
    parseIp = undefined;
  }

  // If the import failed or parseIp is not a function, every check fails
  // (calling undefined throws). We still emit a well-formed result line.
  if (typeof parseIp !== "function") {
    // Run nothing; report 0/known-total is not knowable, so report 0/1 fail.
    const result = { passed: 0, total: 1, passRate: 0 };
    process.stdout.write(JSON.stringify(result) + "\n");
    process.exit(1);
    return;
  }

  // === 1. Named sanity examples (exact values) ===
  expectValue(parseIp, "0.0.0.0", 0);
  expectValue(parseIp, "1.2.3.4", 16909060);
  // Catches the signed `<<24` overflow bug (would yield -1).
  expectValue(parseIp, "255.255.255.255", 4294967295);

  // === 2. Boundary / hand-picked valid cases (exact, via oracle) ===
  const validCases = [
    [0, 0, 0, 0],
    [255, 255, 255, 255],
    [192, 168, 1, 1],
    [10, 0, 0, 1],
    [127, 0, 0, 1],
    [8, 8, 8, 8],
    [172, 16, 254, 1],
    [0, 0, 0, 1],
    [255, 0, 0, 0],
    [128, 0, 0, 0], // high bit set -> 2147483648, another signed-shift tripwire
    [1, 0, 0, 0],
    [223, 255, 255, 255],
  ];
  for (const [a, b, c, d] of validCases) {
    expectValue(parseIp, `${a}.${b}.${c}.${d}`, oracle(a, b, c, d));
  }

  // === 3. Property-based valid inputs (randomized, oracle-checked) ===
  for (let i = 0; i < 300; i++) {
    const a = randInt(255);
    const b = randInt(255);
    const c = randInt(255);
    const d = randInt(255);
    expectValue(parseIp, `${a}.${b}.${c}.${d}`, oracle(a, b, c, d));
    // Also assert it's a valid uint32 regardless of exact agreement.
    expectUint32(parseIp, `${a}.${b}.${c}.${d}`);
  }

  // Explicit boundary octets in every position.
  for (const v of [0, 1, 254, 255]) {
    expectValue(parseIp, `${v}.0.0.0`, oracle(v, 0, 0, 0));
    expectValue(parseIp, `0.${v}.0.0`, oracle(0, v, 0, 0));
    expectValue(parseIp, `0.0.${v}.0`, oracle(0, 0, v, 0));
    expectValue(parseIp, `0.0.0.${v}`, oracle(0, 0, 0, v));
  }

  // === 4. Malformed: structural (wrong number of octets) ===
  const structuralBad = [
    "",
    " ",
    ".",
    "...",
    "1",
    "1.2",
    "1.2.3",
    "1.2.3.4.5",
    "1.2.3.4.",
    ".1.2.3.4",
    "1.2.3.",
    ".2.3.4",
    "1..2.3",
    "1.2..3",
    "1.2.3..4",
    "1...4",
    "1.2.3.4.5.6.7.8",
  ];
  for (const s of structuralBad) expectThrow(parseIp, s);

  // === 5. Malformed: out-of-range octets ===
  const rangeBad = [
    "256.0.0.0",
    "0.256.0.0",
    "0.0.256.0",
    "0.0.0.256",
    "255.255.255.256",
    "300.1.1.1",
    "999.999.999.999",
    "1.2.3.1000",
    "4294967296.0.0.0",
    "99999999999999999999.0.0.0",
  ];
  for (const s of rangeBad) expectThrow(parseIp, s);

  // === 6. Malformed: leading zeros (octal-ambiguity rejection) ===
  const leadingZeroBad = [
    "01.2.3.4",
    "1.02.3.4",
    "1.2.03.4",
    "1.2.3.04",
    "010.0.0.1",
    "00.0.0.0",
    "000.0.0.0",
    "192.168.001.1",
    "255.255.255.0255",
  ];
  for (const s of leadingZeroBad) expectThrow(parseIp, s);

  // === 7. Malformed: non-decimal / sign / whitespace / prefixes ===
  const lexicalBad = [
    "a.b.c.d",
    "1.2.3.x",
    "0x1.2.3.4",
    "0xff.0.0.0",
    "1.2.3.0x4",
    "+1.2.3.4",
    "1.+2.3.4",
    "-1.2.3.4",
    "1.2.3.-4",
    "1.2.-3.4",
    " 1.2.3.4",
    "1.2.3.4 ",
    "1.2. 3.4",
    "1.2 .3.4",
    "1.2.3.4\n",
    "\t1.2.3.4",
    "1.2.3.4\t",
    "1e2.0.0.0",
    "1.2.3.4e0",
    "0b1.2.3.4",
    "1.2.3.٤", // non-ASCII digit (Arabic-Indic 4)
    "１.2.3.4", // fullwidth digit
    "1.2.3.4.0/24", // CIDR-ish
    "192.168.1.1:80", // with port
    "0o1.2.3.4",
    "1_0.2.3.4",
    "0.0.0.0xff",
    "nan.0.0.0",
    "Infinity.0.0.0",
  ];
  for (const s of lexicalBad) expectThrow(parseIp, s);

  // === 8. Malformed: non-string inputs ===
  const nonString = [
    undefined,
    null,
    16909060,
    0,
    NaN,
    true,
    false,
    {},
    [],
    [1, 2, 3, 4],
    Symbol("x"),
    () => "1.2.3.4",
    { toString: () => "1.2.3.4" },
  ];
  for (const v of nonString) expectThrow(parseIp, v);

  // === 9. Property-based malformed: random out-of-range octet ===
  for (let i = 0; i < 100; i++) {
    const pos = randInt(3);
    const oct = [randInt(255), randInt(255), randInt(255), randInt(255)];
    oct[pos] = 256 + randInt(10000); // guaranteed > 255
    expectThrow(parseIp, oct.join("."));
  }

  // === 10. Property-based malformed: random leading-zero octet ===
  for (let i = 0; i < 80; i++) {
    const pos = randInt(3);
    const oct = [randInt(255), randInt(255), randInt(255), randInt(255)].map(
      String
    );
    // Prepend zeros to make a multi-char leading-zero token.
    oct[pos] = "0".repeat(1 + randInt(2)) + oct[pos];
    expectThrow(parseIp, oct.join("."));
  }

  // === 11. Property-based malformed: random wrong octet count ===
  for (let i = 0; i < 80; i++) {
    let count = randInt(7); // 0..7
    if (count === 4) count = 5; // avoid the valid length
    const oct = [];
    for (let j = 0; j < count; j++) oct.push(String(randInt(255)));
    expectThrow(parseIp, oct.join("."));
  }

  // === 12. Property-based malformed: inject a non-digit char ===
  const junk = "abcXYZ !?#$%*()/\\,;:'\"";
  for (let i = 0; i < 80; i++) {
    const oct = [randInt(255), randInt(255), randInt(255), randInt(255)].map(
      String
    );
    const pos = randInt(3);
    const ch = junk[randInt(junk.length - 1)];
    const insertAt = randInt(oct[pos].length);
    oct[pos] =
      oct[pos].slice(0, insertAt) + ch + oct[pos].slice(insertAt);
    expectThrow(parseIp, oct.join("."));
  }

  // === 13. Determinism / purity: same input => same output ===
  total++;
  try {
    const a1 = parseIp("192.168.1.100");
    const a2 = parseIp("192.168.1.100");
    const a3 = parseIp("192.168.1.100");
    if (Object.is(a1, a2) && Object.is(a2, a3)) passed++;
  } catch {
    // fail
  }

  // === 14. Return type is a primitive Number for valid input ===
  total++;
  try {
    const got = parseIp("1.2.3.4");
    if (typeof got === "number") passed++;
  } catch {
    // fail
  }

  // ---- emit exactly one JSON line ----
  const passRate = total === 0 ? 0 : passed / total;
  const result = { passed, total, passRate };
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}

main();
