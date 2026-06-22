// Sealed held-out suite for parseIp(s).
//
// Harness contract:
//   node ip.sealed.mjs <impl-path>
//   - dynamically imports named `parseIp` from <impl-path> (ESM await import)
//   - runs all checks; each wrapped in try/catch
//       (a throw where a throw is expected = pass;
//        a throw where a value is expected = fail)
//   - prints EXACTLY one JSON line {"passed":<int>,"total":<int>,"passRate":<float>}
//   - exits 0 iff passRate === 1
//   - Node built-ins only.
//
// Design: contract-forced cases are hard-asserted. Genuinely-ambiguous forms
// (leading zeros, surrounding whitespace, +/- signs, hex/octal, non-string
// input) are asserted in the THROW direction only — defensible from the
// contract's "well-formed dotted-quad", "decimal octets in 0-255", and explicit
// "throw on a malformed address / robustness to malformed input is the point".
// Property checks use unseeded Math.random so exact inputs are not knowable in
// advance; each property is ONE check with an internal trial loop, keeping the
// total count stable across runs.

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const MAX = 4294967295; // 2^32 - 1

// Independent oracle: compute the expected value WITHOUT mirroring any impl trick.
function expected(o0, o1, o2, o3) {
  return o0 * 16777216 + o1 * 65536 + o2 * 256 + o3;
}

function isUnsignedU32(v) {
  return (
    typeof v === "number" &&
    Number.isFinite(v) &&
    !Number.isNaN(v) &&
    Number.isInteger(v) &&
    v >= 0 &&
    v <= MAX
  );
}

async function main() {
  const implArg = process.argv[2];
  let parseIp;
  try {
    const url = pathToFileURL(resolve(implArg)).href;
    const mod = await import(url);
    parseIp = mod.parseIp;
    if (typeof parseIp !== "function") throw new Error("parseIp not a function");
  } catch (e) {
    // Cannot load impl: every check fails.
    const total = TOTAL_CHECKS;
    process.stdout.write(
      JSON.stringify({ passed: 0, total, passRate: 0 }) + "\n"
    );
    process.exit(1);
    return;
  }

  let passed = 0;
  let total = 0;

  // A check that expects a returned value satisfying `pred`.
  function expectValue(fn, pred) {
    total++;
    try {
      const v = fn();
      if (pred(v)) passed++;
    } catch {
      // throw where a value was expected => fail
    }
  }

  // A check that expects the call to throw.
  function expectThrow(fn) {
    total++;
    try {
      fn();
      // returned where a throw was expected => fail
    } catch {
      passed++;
    }
  }

  // ---- Contract-forced: the three documented examples + boundaries ----
  expectValue(() => parseIp("0.0.0.0"), (v) => v === 0);
  expectValue(() => parseIp("1.2.3.4"), (v) => v === 16909060);
  expectValue(
    () => parseIp("255.255.255.255"),
    (v) => v === 4294967295
  );

  // 255.255.255.255 must be a NON-NEGATIVE unsigned value (catches signed <<).
  expectValue(
    () => parseIp("255.255.255.255"),
    (v) => v === 4294967295 && v >= 0 && Object.is(v, 4294967295)
  );

  // Return type discipline on a happy-path input.
  expectValue(() => parseIp("192.168.1.1"), (v) => isUnsignedU32(v));
  expectValue(
    () => parseIp("192.168.1.1"),
    (v) => v === expected(192, 168, 1, 1)
  );

  // High-bit-set address: classic signed-shift bug yields a negative number.
  expectValue(() => parseIp("128.0.0.0"), (v) => v === 2147483648 && v >= 0);
  expectValue(
    () => parseIp("255.0.0.1"),
    (v) => v === expected(255, 0, 0, 1) && v >= 0
  );

  // A few hand-picked exact values.
  expectValue(() => parseIp("10.0.0.1"), (v) => v === expected(10, 0, 0, 1));
  expectValue(
    () => parseIp("172.16.254.1"),
    (v) => v === expected(172, 16, 254, 1)
  );
  expectValue(
    () => parseIp("8.8.8.8"),
    (v) => v === expected(8, 8, 8, 8)
  );

  // Boundary octet values inside a quad.
  expectValue(() => parseIp("0.255.0.255"), (v) => v === expected(0, 255, 0, 255));
  expectValue(() => parseIp("255.255.255.0"), (v) => v === expected(255, 255, 255, 0));

  // ---- Contract-forced: octet out of range => throw ----
  expectThrow(() => parseIp("256.0.0.0"));
  expectThrow(() => parseIp("0.0.0.256"));
  expectThrow(() => parseIp("999.0.0.1"));
  expectThrow(() => parseIp("300.300.300.300"));
  expectThrow(() => parseIp("1.2.3.4000"));

  // ---- Contract-forced: wrong octet count => throw ----
  expectThrow(() => parseIp("1.2.3"));
  expectThrow(() => parseIp("1.2.3.4.5"));
  expectThrow(() => parseIp("1.2"));
  expectThrow(() => parseIp("1"));
  expectThrow(() => parseIp("1.2.3.4.5.6.7.8"));

  // ---- Contract-forced: empty octets / stray dots => throw ----
  expectThrow(() => parseIp("1.2.3."));
  expectThrow(() => parseIp(".1.2.3"));
  expectThrow(() => parseIp("1..2.3"));
  expectThrow(() => parseIp("1.2..3"));
  expectThrow(() => parseIp("...."));
  expectThrow(() => parseIp("..."));

  // ---- Contract-forced: empty / non-decimal octets => throw ----
  expectThrow(() => parseIp(""));
  expectThrow(() => parseIp("a.b.c.d"));
  expectThrow(() => parseIp("1.2.3.x"));
  expectThrow(() => parseIp("foo"));
  expectThrow(() => parseIp("1.2.3.four"));
  expectThrow(() => parseIp("0x1.0x2.0x3.0x4"));

  // ---- Author's judgment (throw direction): ambiguous-but-malformed forms ----
  // Leading zeros: contract says "decimal octets" and stresses malformed-robustness.
  expectThrow(() => parseIp("010.0.0.1"));
  expectThrow(() => parseIp("192.168.001.001"));
  expectThrow(() => parseIp("00.0.0.0"));
  // Surrounding / internal whitespace.
  expectThrow(() => parseIp(" 1.2.3.4"));
  expectThrow(() => parseIp("1.2.3.4 "));
  expectThrow(() => parseIp("1.2.3. 4"));
  expectThrow(() => parseIp("1 .2.3.4"));
  // Signs.
  expectThrow(() => parseIp("+1.2.3.4"));
  expectThrow(() => parseIp("1.-2.3.4"));
  expectThrow(() => parseIp("-1.2.3.4"));
  // Other numeric forms.
  expectThrow(() => parseIp("1.2.3.4e0"));
  expectThrow(() => parseIp("1.2.3.0x4"));
  expectThrow(() => parseIp("1.2.3.4.0"));
  // Non-string input (out of scope as a value; throw direction only).
  expectThrow(() => parseIp(null));
  expectThrow(() => parseIp(undefined));
  expectThrow(() => parseIp(1234));
  expectThrow(() => parseIp(["1", "2", "3", "4"]));

  // ---- Property: random valid quads round-trip to the oracle value ----
  // ONE check, internal trial loop; fails if any trial misbehaves.
  expectValue(
    () => {
      const N = 2000;
      for (let i = 0; i < N; i++) {
        const a = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const c = Math.floor(Math.random() * 256);
        const d = Math.floor(Math.random() * 256);
        const s = `${a}.${b}.${c}.${d}`;
        const got = parseIp(s);
        if (!isUnsignedU32(got)) return "bad-type";
        if (got !== expected(a, b, c, d)) return "bad-value";
        if (got < 0) return "negative";
      }
      return "ok";
    },
    (v) => v === "ok"
  );

  // ---- Property: random out-of-range octet (256..999) in a random slot => throw ----
  expectValue(
    () => {
      const N = 1000;
      for (let i = 0; i < N; i++) {
        const slot = Math.floor(Math.random() * 4);
        const bad = 256 + Math.floor(Math.random() * 744); // 256..999
        const oct = [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
        ];
        oct[slot] = bad;
        const s = oct.join(".");
        let threw = false;
        try {
          parseIp(s);
        } catch {
          threw = true;
        }
        if (!threw) return "did-not-throw";
      }
      return "ok";
    },
    (v) => v === "ok"
  );

  // ---- Property: random wrong octet count (1,2,3,5,6) => throw ----
  expectValue(
    () => {
      const N = 1000;
      const counts = [1, 2, 3, 5, 6, 7];
      for (let i = 0; i < N; i++) {
        const n = counts[Math.floor(Math.random() * counts.length)];
        const parts = [];
        for (let k = 0; k < n; k++) parts.push(Math.floor(Math.random() * 256));
        const s = parts.join(".");
        let threw = false;
        try {
          parseIp(s);
        } catch {
          threw = true;
        }
        if (!threw) return "did-not-throw";
      }
      return "ok";
    },
    (v) => v === "ok"
  );

  // ---- Property: random junk-character octet => throw ----
  expectValue(
    () => {
      const N = 1000;
      const junk = "abcdefABCDEF!@#$%^&*()_=+/\\,;: gh-x";
      for (let i = 0; i < N; i++) {
        const slot = Math.floor(Math.random() * 4);
        const len = 1 + Math.floor(Math.random() * 3);
        let bad = "";
        for (let k = 0; k < len; k++) {
          bad += junk[Math.floor(Math.random() * junk.length)];
        }
        const oct = [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
        ].map(String);
        oct[slot] = bad;
        const s = oct.join(".");
        let threw = false;
        try {
          parseIp(s);
        } catch {
          threw = true;
        }
        if (!threw) return "did-not-throw";
      }
      return "ok";
    },
    (v) => v === "ok"
  );

  // ---- Large / extreme inputs => throw (no crash, no hang) ----
  expectThrow(() => parseIp("9".repeat(1000)));
  expectThrow(() => parseIp(("255." .repeat(1000)).slice(0, -1)));
  expectThrow(() => parseIp("4294967295")); // the integer value, not dotted-quad
  expectThrow(() => parseIp("18446744073709551616.0.0.0"));

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(
    JSON.stringify({ passed, total, passRate }) + "\n"
  );
  process.exit(passRate === 1 ? 0 : 1);
}

// Number of checks declared above; used only on the import-failure path so that
// a non-loadable impl reports a non-zero total. Kept in sync manually.
const TOTAL_CHECKS = 60;

main();
