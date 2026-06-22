// Sealed held-out suite for parseIp(s).
// Invoked as: node ip.sealed.mjs <impl-path>
// Dynamically imports `parseIp` from the impl path, runs all checks, and
// prints EXACTLY one JSON line: {"passed":<int>,"total":<int>,"passRate":<float>}.
// Exits 0 iff passRate === 1. Node built-ins only.
//
// Design notes (blind authoring, derived from the contract):
//  - The contract is SILENT on leading zeros ("01", "007") and on surrounding
//    whitespace. To avoid failing a defensibly-correct impl, the suite NEVER
//    asserts behaviour on those cases: positive octets are formatted
//    canonically (String(n), no padding) and the negative generator never
//    produces a string whose ONLY defect is a leading zero or whitespace.
//  - Expected values are computed with arithmetic / BigInt only (never bitwise),
//    so the unsigned 32-bit requirement is the discriminator: a bitwise impl
//    that yields a signed int for high-bit addresses fails.

import process from "node:process";
import path from "node:path";
import { pathToFileURL } from "node:url";

let passed = 0;
let total = 0;

// value-expected: parseIp returning the right value = pass; throwing = fail.
function expectValue(impl, input, expected) {
  total += 1;
  try {
    const got = impl(input);
    if (typeof got === "number" && Object.is(got, expected)) {
      passed += 1;
    }
  } catch {
    // throw where a value was expected -> fail (no increment)
  }
}

// value-expected, predicate form (for typeof / structural invariants).
function expectValueSatisfies(impl, input, predicate) {
  total += 1;
  try {
    const got = impl(input);
    if (predicate(got)) passed += 1;
  } catch {
    // fail
  }
}

// throw-expected: parseIp throwing = pass; returning any value = fail.
function expectThrow(impl, input) {
  total += 1;
  try {
    impl(input);
    // returned where a throw was expected -> fail (no increment)
  } catch {
    passed += 1;
  }
}

// Seeded PRNG (mulberry32). Sealed suite, so a fixed seed is fine.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Expected unsigned 32-bit value from four octets, arithmetic only.
function expectedFromOctets(o0, o1, o2, o3) {
  return o0 * 16777216 + o1 * 65536 + o2 * 256 + o3;
}

function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    process.stderr.write("usage: node ip.sealed.mjs <impl-path>\n");
    process.exit(1);
  }
  const url = pathToFileURL(path.resolve(argPath)).href;

  import(url)
    .then((mod) => {
      const parseIp = mod.parseIp;
      if (typeof parseIp !== "function") {
        // No usable export: everything fails.
        process.stdout.write(
          JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n"
        );
        process.exit(1);
        return;
      }

      runChecks(parseIp);

      const passRate = total > 0 ? passed / total : 0;
      process.stdout.write(
        JSON.stringify({ passed, total, passRate }) + "\n"
      );
      process.exit(passRate === 1 ? 0 : 1);
    })
    .catch(() => {
      process.stdout.write(
        JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n"
      );
      process.exit(1);
    });
}

function runChecks(parseIp) {
  // ---- Contract sanity examples (canonical, from the contract) ----
  expectValue(parseIp, "0.0.0.0", 0);
  expectValue(parseIp, "1.2.3.4", 16909060);
  expectValue(parseIp, "255.255.255.255", 4294967295);

  // ---- Boundary / high-bit discriminators (unsigned 32-bit) ----
  // These catch bitwise (signed) implementations: 255.255.255.255 -> -1, etc.
  expectValue(parseIp, "128.0.0.0", 2147483648); // top bit set
  expectValue(parseIp, "255.0.0.0", 4278190080);
  expectValue(parseIp, "0.0.0.255", 255);
  expectValue(parseIp, "255.255.255.254", 4294967294);
  expectValue(parseIp, "200.100.50.25", expectedFromOctets(200, 100, 50, 25));
  expectValue(parseIp, "10.0.0.1", expectedFromOctets(10, 0, 0, 1));
  expectValue(parseIp, "192.168.1.1", expectedFromOctets(192, 168, 1, 1));

  // typeof invariant on a high-bit address.
  expectValueSatisfies(
    parseIp,
    "255.255.255.255",
    (v) => typeof v === "number" && v === 4294967295
  );
  // Result is a non-negative integer for a top-bit address.
  expectValueSatisfies(
    parseIp,
    "128.1.2.3",
    (v) =>
      typeof v === "number" &&
      Number.isInteger(v) &&
      v >= 0 &&
      v === expectedFromOctets(128, 1, 2, 3)
  );

  // ---- Property-based POSITIVE generator (canonical octets only) ----
  // Asymmetric random octets so wrong-endian / wrong-order impls diverge.
  // Octets are emitted with String(n): never zero-padded, so we never touch
  // the leading-zero judgment zone.
  {
    const rand = mulberry32(0x1a2b3c4d);
    for (let i = 0; i < 400; i++) {
      const o0 = Math.floor(rand() * 256);
      const o1 = Math.floor(rand() * 256);
      const o2 = Math.floor(rand() * 256);
      const o3 = Math.floor(rand() * 256);
      const input = `${o0}.${o1}.${o2}.${o3}`;
      const expected = expectedFromOctets(o0, o1, o2, o3);
      expectValue(parseIp, input, expected);
    }
  }

  // Explicitly include the two extreme corners and several boundary octets.
  {
    const boundaryOctets = [0, 1, 127, 128, 254, 255];
    const rand = mulberry32(0x55aa55aa);
    for (const a of boundaryOctets) {
      for (const d of boundaryOctets) {
        const b = Math.floor(rand() * 256);
        const c = Math.floor(rand() * 256);
        const input = `${a}.${b}.${c}.${d}`;
        expectValue(parseIp, input, expectedFromOctets(a, b, c, d));
      }
    }
  }

  // ---- Hand-picked NEGATIVE cases (bulletproof zone) ----
  const handPickedThrows = [
    "", // empty string
    "1.2.3", // too few octets
    "1.2.3.4.5", // too many octets
    "1.2.3.4.", // trailing dot -> empty 5th octet
    ".1.2.3", // leading dot -> empty octet
    "1..3.4", // empty middle octet
    "1.2..4", // empty middle octet
    "256.1.1.1", // octet just out of range
    "1.256.1.1",
    "1.1.256.1",
    "1.1.1.256",
    "300.1.1.1", // octet well out of range
    "999.999.999.999",
    "1.1.1.1000",
    "1.2.3.4 5", // embedded space + wrong shape
    "a.b.c.d", // non-digit octets
    "1.2.3.x", // single non-digit octet
    "1.2.3.-1", // negative
    "-1.2.3.4",
    "1.2.3.+4", // sign prefix
    "1.2.3.4e0", // exponent notation
    "0x1.0x2.0x3.0x4", // hex octets
    "1.2.3.4\n", // trailing newline garbage
    "192168.1.1", // missing dots collapsed
    "1234567890", // bare number, no dots
    "...", // only separators
    "1.2.3.4.5.6.7.8", // way too many
    "  ", // whitespace only
    "1 .2.3.4", // space inside octet shape
  ];
  for (const bad of handPickedThrows) {
    expectThrow(parseIp, bad);
  }

  // ---- Property-based NEGATIVE generator (mutate valid -> invalid) ----
  // Each mutation produces a string whose ONLY defect is in the bulletproof
  // zone (never a lone leading-zero or surrounding-whitespace defect).
  {
    const rand = mulberry32(0x0badf00d);

    const canonicalOctet = () => String(Math.floor(rand() * 256));
    const baseParts = () => [
      canonicalOctet(),
      canonicalOctet(),
      canonicalOctet(),
      canonicalOctet(),
    ];

    for (let i = 0; i < 300; i++) {
      const mut = Math.floor(rand() * 7);
      const parts = baseParts();
      const idx = Math.floor(rand() * 4);
      let bad;

      switch (mut) {
        case 0: {
          // Octet out of range: 256..100255 (never a leading-zero string).
          const big = 256 + Math.floor(rand() * 100000);
          parts[idx] = String(big);
          bad = parts.join(".");
          break;
        }
        case 1: {
          // Drop an octet -> only 3 parts.
          parts.splice(idx, 1);
          bad = parts.join(".");
          break;
        }
        case 2: {
          // Add an octet -> 5 parts.
          parts.splice(idx, 0, canonicalOctet());
          bad = parts.join(".");
          break;
        }
        case 3: {
          // Empty an octet -> adjacent dots / leading / trailing dot.
          parts[idx] = "";
          bad = parts.join(".");
          break;
        }
        case 4: {
          // Inject a non-digit char into one octet (not a digit, not space,
          // not a sign that could read as canonical).
          const letters = "abcdefghxyzZ?#@/";
          const ch = letters[Math.floor(rand() * letters.length)];
          const o = parts[idx];
          const pos = Math.floor(rand() * (o.length + 1));
          parts[idx] = o.slice(0, pos) + ch + o.slice(pos);
          bad = parts.join(".");
          break;
        }
        case 5: {
          // Negative octet.
          parts[idx] = "-" + (1 + Math.floor(rand() * 254));
          bad = parts.join(".");
          break;
        }
        case 6: {
          // Use a wrong separator (comma / dash / slash) somewhere.
          const seps = [",", "-", "/", ";", ":"];
          const sep = seps[Math.floor(rand() * seps.length)];
          // Join with '.' but replace one separator with a bad one.
          const joined = parts.join(".");
          const dotPositions = [];
          for (let k = 0; k < joined.length; k++) {
            if (joined[k] === ".") dotPositions.push(k);
          }
          const dp = dotPositions[Math.floor(rand() * dotPositions.length)];
          bad = joined.slice(0, dp) + sep + joined.slice(dp + 1);
          break;
        }
        default:
          bad = "256.256.256.256";
      }

      // Guard: never emit something that is accidentally a valid canonical
      // dotted-quad. If a mutation collapsed to valid, force an out-of-range.
      if (isCanonicalValid(bad)) {
        bad = "256.1.1.1";
      }
      expectThrow(parseIp, bad);
    }
  }
}

// Local validity oracle (matches the contract's strict reading) used only to
// guard the negative generator from accidentally producing a valid address.
// Mirrors the canonical-decimal-in-range definition; treats leading-zero forms
// as NOT-canonical so the generator never relies on them being rejected.
function isCanonicalValid(s) {
  if (typeof s !== "string") return false;
  const parts = s.split(".");
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (!/^[0-9]+$/.test(p)) return false;
    if (p.length > 1 && p[0] === "0") return false; // not canonical
    const n = Number(p);
    if (n < 0 || n > 255) return false;
  }
  return true;
}

main();
