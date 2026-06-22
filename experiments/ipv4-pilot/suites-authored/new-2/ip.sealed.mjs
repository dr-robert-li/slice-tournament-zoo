// Sealed held-out suite for parseIp(s).
// Harness: node ip.sealed.mjs <impl-path>
//   - dynamically imports parseIp from the impl path
//   - runs all checks
//   - prints EXACTLY one JSON line {"passed":<int>,"total":<int>,"passRate":<float>}
//   - exits 0 iff passRate === 1
// Node built-ins only. Each check wrapped in try/catch:
//   throw where a throw is expected => pass
//   throw where a value is expected => fail
//
// Derived done-predicates from the contract:
//   P1: valid dotted-quad (4 decimal octets each 0..255) returns
//       o0*2^24 + o1*2^16 + o2*2^8 + o3 as a Number.
//   P2: the result is an unsigned 32-bit integer Number in [0, 4294967295].
//   P3: malformed / out-of-range strings throw.
// The contract is silent on leading-zero octet convention, so neither
// the valid nor invalid generators ever emit a leading-zero octet.

const implPath = process.argv[2];
if (!implPath) {
  console.error("usage: node ip.sealed.mjs <impl-path>");
  process.exit(2);
}

const mod = await import(implPath);
const parseIp = mod.parseIp ?? (mod.default && mod.default.parseIp);

let passed = 0;
let total = 0;

// expectValue: fn() must return a value deeply-equal (===) to `want`.
function expectValue(label, fn, want) {
  total++;
  try {
    const got = fn();
    if (Object.is(got, want)) {
      passed++;
    }
  } catch (_e) {
    // throw where a value is expected => fail (no increment)
  }
}

// expectPred: fn() must return a value for which pred(value) is true.
function expectPred(label, fn, pred) {
  total++;
  try {
    const got = fn();
    if (pred(got)) passed++;
  } catch (_e) {
    // fail
  }
}

// expectThrow: fn() must throw.
function expectThrow(label, fn) {
  total++;
  try {
    fn();
    // returned a value where a throw was expected => fail
  } catch (_e) {
    passed++;
  }
}

// ---- Deterministic but non-obvious PRNG (mulberry32) ----
// Seeded so the suite is reproducible yet the exact generated inputs
// are not something an implementer could hand-enumerate.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(0x1f2e3d4c);
function randInt(lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// Reference numeric computation (independent of the impl under test).
function expected(o0, o1, o2, o3) {
  return ((o0 * 16777216) + (o1 * 65536) + (o2 * 256) + o3) >>> 0;
}
function fmt(o0, o1, o2, o3) {
  return `${o0}.${o1}.${o2}.${o3}`;
}

// =====================================================================
// 1. Contract sanity anchors (exact expected values).
// =====================================================================
expectValue("anchor 0.0.0.0", () => parseIp("0.0.0.0"), 0);
expectValue("anchor 1.2.3.4", () => parseIp("1.2.3.4"), 16909060);
expectValue("anchor 255.255.255.255", () => parseIp("255.255.255.255"), 4294967295);

// =====================================================================
// 2. Boundary octet values — discriminating: a wrong shift/order or an
//    off-by-one range check yields a different number here.
// =====================================================================
expectValue("low boundary 0.0.0.1", () => parseIp("0.0.0.1"), 1);
expectValue("byte3 boundary 0.0.1.0", () => parseIp("0.0.1.0"), 256);
expectValue("byte2 boundary 0.1.0.0", () => parseIp("0.1.0.0"), 65536);
expectValue("byte1 boundary 1.0.0.0", () => parseIp("1.0.0.0"), 16777216);
expectValue("max single octet 255.0.0.0", () => parseIp("255.0.0.0"), 4278190080);
expectValue("byte ordering 8.8.4.4", () => parseIp("8.8.4.4"), expected(8, 8, 4, 4));
expectValue("asymmetric 192.168.1.1", () => parseIp("192.168.1.1"), expected(192, 168, 1, 1));
expectValue("asymmetric 10.0.0.255", () => parseIp("10.0.0.255"), expected(10, 0, 0, 255));
expectValue("high bit set 128.0.0.0", () => parseIp("128.0.0.0"), 2147483648);

// The result must be a Number type (contract: "Return a Number").
expectPred("returns a Number type", () => parseIp("172.16.254.1"),
  (v) => typeof v === "number");
// And specifically an unsigned 32-bit value (within range, integer).
expectPred("result is uint32 in range", () => parseIp("255.255.255.255"),
  (v) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 4294967295);

// =====================================================================
// 3. Property: randomly generated VALID dotted-quads parse to the
//    independently-computed integer. Distinct octets per address so a
//    swapped-byte impl is caught. No leading zeros (contract silent).
// =====================================================================
const N_VALID = 220;
for (let i = 0; i < N_VALID; i++) {
  const o0 = randInt(0, 255);
  const o1 = randInt(0, 255);
  const o2 = randInt(0, 255);
  const o3 = randInt(0, 255);
  const s = fmt(o0, o1, o2, o3);
  const want = expected(o0, o1, o2, o3);
  expectValue(`valid#${i} ${s}`, () => parseIp(s), want);
}

// A few addresses chosen so each octet differs from the others, to
// specifically discriminate byte-order / shift mistakes.
for (let i = 0; i < 40; i++) {
  // pick four distinct values
  let a = randInt(0, 255), b, c, d;
  do { b = randInt(0, 255); } while (b === a);
  do { c = randInt(0, 255); } while (c === a || c === b);
  do { d = randInt(0, 255); } while (d === a || d === b || d === c);
  const s = fmt(a, b, c, d);
  const want = expected(a, b, c, d);
  expectValue(`distinct#${i} ${s}`, () => parseIp(s), want);
}

// =====================================================================
// 4. Hand-picked malformed negatives — obvious classes that any
//    validating impl must reject (contract: "Throw on a malformed
//    address — anything that is not a well-formed dotted-quad in range").
// =====================================================================
const handNegatives = [
  "",                       // empty string
  ".",                      // lone dot
  "...",                    // only dots
  "1.2.3",                  // too few octets
  "1.2.3.4.5",              // too many octets
  "1.2.3.",                 // trailing dot / empty 4th octet
  ".1.2.3",                 // leading dot / empty 1st octet
  "1..2.3",                 // empty middle octet
  "256.0.0.0",             // octet just out of range
  "0.0.0.256",             // last octet out of range
  "300.1.1.1",             // clearly out of range
  "999.999.999.999",       // all out of range
  "1.2.3.4 ",              // trailing whitespace
  " 1.2.3.4",              // leading whitespace
  "1.2.3.4\n",             // trailing newline
  "1. 2.3.4",              // embedded space in octet
  "a.b.c.d",               // non-numeric octets
  "1.2.3.x",               // one non-numeric octet
  "0x1.2.3.4",             // hex prefix
  "1.2.3.0x4",             // hex in octet
  "-1.2.3.4",              // negative octet
  "1.2.3.-4",              // negative last octet
  "+1.2.3.4",              // plus sign
  "1.2.3.4.",              // dangling dot after full quad
  "1,2,3,4",               // wrong separator
  "1.2.3.4e0",             // exponent notation
  "1.2.3.4.5.6.7.8",       // doubled
  "192.168.1",             // 3 octets
  "1.2.3.4\t",             // trailing tab
  "1.2.3.04abc",           // numeric then garbage
  "255.255.255.255 ",      // valid-looking with trailing space
  "1.2.3.4.0",             // five parts last zero
  "1e2.3.4.5",             // exponent in first octet
  "0.0.0.0x0",             // hex zero
  "256.256.256.256",       // all out of range
  "\t",                    // whitespace only
  " ",                     // single space
  "1.2.3.4 5",             // trailing token
];
for (const bad of handNegatives) {
  expectThrow(`reject ${JSON.stringify(bad)}`, () => parseIp(bad));
}

// =====================================================================
// 5. Property-based NEGATIVE generators — mutate VALID dotted-quads into
//    invalid forms and assert each throws. This explores parser soft
//    spots a fixed list misses. None of these produce a valid in-range
//    dotted-quad. Leading-zero mutations are deliberately excluded
//    (contract is silent on that convention).
// =====================================================================

// 5a. Octet out of range (256..999) at a random position.
const N_OOR = 70;
for (let i = 0; i < N_OOR; i++) {
  const oct = [randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)];
  const pos = randInt(0, 3);
  oct[pos] = randInt(256, 999); // never a leading-zero string; out of range
  const s = oct.join(".");
  expectThrow(`oor#${i} ${s}`, () => parseIp(s));
}

// 5b. Wrong number of octets (1,2,3,5,6,7) of otherwise-valid values.
const N_COUNT = 60;
for (let i = 0; i < N_COUNT; i++) {
  const count = pick([1, 2, 3, 5, 6, 7]);
  const parts = [];
  for (let k = 0; k < count; k++) parts.push(String(randInt(0, 255)));
  const s = parts.join(".");
  expectThrow(`count#${i}(${count}) ${s}`, () => parseIp(s));
}

// 5c. Inject a non-digit garbage character into one octet of a valid quad.
const garbageChars = ["a", "Z", "x", "g", "$", "#", "!", "?", "%", ":", "/", "-", "+", " ", "_", "*"];
const N_GARBAGE = 70;
for (let i = 0; i < N_GARBAGE; i++) {
  const oct = [randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)].map(String);
  const pos = randInt(0, 3);
  const g = pick(garbageChars);
  const where = randInt(0, oct[pos].length);
  oct[pos] = oct[pos].slice(0, where) + g + oct[pos].slice(where);
  const s = oct.join(".");
  expectThrow(`garbage#${i} ${JSON.stringify(s)}`, () => parseIp(s));
}

// 5d. Empty octet by removing a digit-run (double dots / leading / trailing dot).
const N_EMPTY = 50;
for (let i = 0; i < N_EMPTY; i++) {
  const oct = [randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)].map(String);
  const pos = randInt(0, 3);
  oct[pos] = ""; // empty octet between/around dots
  const s = oct.join(".");
  expectThrow(`empty#${i} ${JSON.stringify(s)}`, () => parseIp(s));
}

// 5e. Wrong separator (replace one or more dots with another char).
const seps = [",", ";", " ", "-", "_", "/", ":", "|", "\\"];
const N_SEP = 50;
for (let i = 0; i < N_SEP; i++) {
  const oct = [randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)].map(String);
  const sep = pick(seps);
  // replace at least one dot; join with the wrong sep entirely
  const s = oct.join(sep);
  expectThrow(`sep#${i} ${JSON.stringify(s)}`, () => parseIp(s));
}

// 5f. Surrounding / embedded whitespace on an otherwise-valid quad.
const ws = [" ", "\t", "\n", "\r", "  ", " \t"];
const N_WS = 40;
for (let i = 0; i < N_WS; i++) {
  const oct = [randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)].map(String);
  const base = oct.join(".");
  const w = pick(ws);
  const mode = randInt(0, 2);
  let s;
  if (mode === 0) s = w + base;        // leading ws
  else if (mode === 1) s = base + w;   // trailing ws
  else {                                // ws inside an octet
    const pos = randInt(0, 3);
    oct[pos] = oct[pos][0] + w + oct[pos].slice(1);
    s = oct.join(".");
  }
  expectThrow(`ws#${i} ${JSON.stringify(s)}`, () => parseIp(s));
}

// 5g. Append trailing garbage after a complete valid quad.
const trailers = [".", "..", ".5", ".0", "x", "/24", ":80", "e0", " ", "\n", ".256"];
const N_TRAIL = 40;
for (let i = 0; i < N_TRAIL; i++) {
  const oct = [randInt(0, 255), randInt(0, 255), randInt(0, 255), randInt(0, 255)].map(String);
  const s = oct.join(".") + pick(trailers);
  expectThrow(`trail#${i} ${JSON.stringify(s)}`, () => parseIp(s));
}

// =====================================================================
// Emit the single result line.
// =====================================================================
const passRate = total === 0 ? 0 : passed / total;
console.log(JSON.stringify({ passed, total, passRate }));
process.exit(passRate === 1 ? 0 : 1);
