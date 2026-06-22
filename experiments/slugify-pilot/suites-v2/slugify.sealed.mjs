// SEALED held-out suite (Suite 2 / STZ) for slice `slugify`.
// Authored blind from slice/CONTRACT-VAGUE.md only. Specimens never see this file.
//
// Harness contract: node slugify.sealed.mjs <impl-path>
//   imports `slugify` export, runs checks, prints EXACTLY ONE final JSON line
//   {"passed":int,"total":int,"passRate":float}; exits 0 iff passRate===1 else 1.
//   Node built-ins only, no deps.
//
// Design principle (critical): the suite gates at passRate===1 and SELECTS specimens.
// The dominant failure mode is over-specifying an AMBIGUOUS case so a *correct*
// implementation fails. So:
//   - exact-assert ONLY what the contract truly pins;
//   - everything contested (compatibility chars, transliteration direction, etc.) is
//     checked with INVARIANTS (output charset/shape + idempotence) that any compliant
//     implementation satisfies regardless of which defensible branch it took.

let passed = 0;
let total = 0;

// Slug shape: empty, OR runs of [a-z0-9] joined by single hyphens, no leading/
// trailing/doubled hyphen, no uppercase, no non-ASCII. Digit-only segments allowed.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function isValidSlug(s) {
  return typeof s === "string" && (s === "" || SLUG_RE.test(s));
}

// ---- assertion primitives (a throw counts as a failed assertion, never an abort) ----
function check(label, fn) {
  total += 1;
  try {
    if (fn() === true) passed += 1;
    // else: silent failure (sealed; we don't leak which inputs failed)
  } catch {
    /* throwing impl => failed assertion, run continues */
  }
}

function eq(slugify, input, want) {
  check("eq", () => slugify(input) === want);
}

function invariant(slugify, input) {
  // Shape invariant: holds for EVERY input under the contract.
  check("shape", () => isValidSlug(slugify(input)));
}

function idempotent(slugify, input) {
  check("idempotent", () => {
    const once = slugify(input);
    return slugify(once) === once;
  });
}

// Deterministic PRNG (mulberry32) so every specimen faces the identical battery.
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

async function main() {
  const implPath = process.argv[2];
  let slugify;
  try {
    slugify = (await import(implPath)).slugify;
  } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  if (typeof slugify !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }

  // =========================================================================
  // 1. EXACT ASSERTIONS — only what the contract pins unambiguously.
  // =========================================================================

  // --- Happy path: case, whitespace, punctuation, collapse, trim ---
  const EXACT = [
    ["Hello, World!", "hello-world"],
    ["Hello World", "hello-world"],
    ["UPPERCASE", "uppercase"],
    ["MiXeD CaSe", "mixed-case"],
    ["  spaced  out  ", "spaced-out"],
    ["Multiple   Spaces", "multiple-spaces"],
    ["\t\n leading and trailing ws \n\t", "leading-and-trailing-ws"],
    ["Top 10 Songs", "top-10-songs"],
    ["100", "100"],
    ["a-b-c", "a-b-c"],
    ["already-a-slug", "already-a-slug"],
    ["Trailing!!!", "trailing"],
    ["!!!Leading", "leading"],
    ["foo_bar baz", "foo-bar-baz"],
    ["a---b", "a-b"],
    ["a___b", "a-b"],
    // --- separator-run collapsing: "and otherwise disappears", collapse to single ---
    ["a_._b", "a-b"],
    ["a . _ - b", "a-b"],
    ["...dots...everywhere...", "dots-everywhere"],
    ["----", ""],
    ["___", ""],
    ["   ", ""],
    [".", ""],
    ["-", ""],
    // --- punctuation is a separator (every punct char breaks a word, consistently) ---
    ["don't", "don-t"],
    ["rock&roll", "rock-roll"],
    ["a.b.c", "a-b-c"],
    ["c++", "c"],
    ["one/two/three", "one-two-three"],
    ["a, b, c", "a-b-c"],
    ["foo (bar) baz", "foo-bar-baz"],

    // --- accent folding (canonical, explicitly pinned by contract) ---
    ["café", "cafe"],
    ["Café", "cafe"],
    ["Über", "uber"],
    ["Münchën", "munchen"],
    ["  Café  Münchën  ", "cafe-munchen"],
    ["naïve", "naive"],
    ["résumé", "resume"],
    ["àáâãäåèéêëìíîïòóôõöùúûü", "aaaaaaeeeeiiiiooooouuuu"],
    ["ÀÁÂÃÄÅ", "aaaaaa"],
    ["çÇ", "cc"],
    ["ñÑ", "nn"],
    ["ýÿ", "yy"],

    // --- empty / no usable letters -> "" ---
    ["", ""],
    ["!!!", ""],
    ["@#$%^&*()", ""],
    ["    \t\n   ", ""],
  ];
  for (const [input, want] of EXACT) eq(slugify, input, want);

  // --- All-non-Latin scripts -> "" (no romanizing other scripts) ---
  const NON_LATIN_EMPTY = [
    "你好世界",          // CJK
    "こんにちは",         // Hiragana
    "안녕하세요",         // Hangul
    "Привет",            // Cyrillic
    "Ελληνικά",          // Greek
    "العربية",           // Arabic
    "שלום",              // Hebrew
    "हिन्दी",             // Devanagari
    "ไทย",               // Thai
    "😀😀😀",            // emoji
    "🎉🚀✨",            // emoji
    "👨‍👩‍👧‍👦",            // ZWJ emoji sequence
    "→←↑↓",              // arrows (no NFKD ASCII expansion)
  ];
  // NOTE: trademark/circled-number/symbol compatibility chars (™, ①) are NOT here:
  // they are CONTESTED (NFKD may expand ™->tm, ①->1). They live in AMBIGUOUS below.
  for (const s of NON_LATIN_EMPTY) eq(slugify, s, "");

  // --- combining-mark-only input -> "" (no base letters/digits) ---
  // U+0301 COMBINING ACUTE ACCENT alone, repeated.
  eq(slugify, "́́́", "");
  eq(slugify, " ̀ ", "");

  // --- Non-string input -> "" ---
  const NON_STRING = [null, undefined, 0, 1, 42, -1, 3.14, NaN, Infinity,
    true, false, {}, [], [1, 2], { a: 1 }, () => {}, Symbol.iterator,
    new Date(0), 123n];
  for (const v of NON_STRING) {
    check("nonstring", () => slugify(v) === "");
  }

  // =========================================================================
  // 2. NFC vs NFD AGREEMENT — same abstract string typed two ways must agree,
  //    and both must fold to the plain ASCII base.
  // =========================================================================
  const PAIRS = [
    // café: precomposed é (U+00E9) vs e + combining acute (U+0065 U+0301)
    ["café", "café", "cafe"],
    // Über -> uber: Ü precomposed (U+00DC) vs U + combining diaeresis
    ["Über", "Über", "uber"],
    // Ångström: Å precomposed vs A + ring; ö precomposed vs o + diaeresis
    ["Ångström", "Ångström", "angstrom"],
    // ñ precomposed vs n + tilde
    ["mañana", "mañana", "manana"],
  ];
  for (const [nfc, nfd, want] of PAIRS) {
    eq(slugify, nfc, want);
    eq(slugify, nfd, want);
    // explicit AGREEMENT assertion: the two encodings produce the same slug
    check("nfc-nfd-agree", () => slugify(nfc) === slugify(nfd));
  }
  // Also: feeding an already-NFC string vs its NFD form for the SAME literal must agree,
  // generated programmatically to avoid relying on hand-typed code points.
  const AGREE_SAMPLES = ["Café Münchën", "naïve résumé", "Ångström Über"];
  for (const base of AGREE_SAMPLES) {
    check("normalize-agree", () =>
      slugify(base.normalize("NFC")) === slugify(base.normalize("NFD"))
    );
  }

  // =========================================================================
  // 3. INVARIANT-ONLY for AMBIGUOUS / CONTESTED inputs.
  //    Contract: "do not transliterate beyond plain accent-folding." Whether an
  //    impl drops (canonical NFD) or expands (compatibility NFKD) ligatures,
  //    full-width forms, circled/roman/superscript numerals is DEFENSIBLE either
  //    way. We do NOT pin the result; we only require a valid slug + idempotence.
  // =========================================================================
  const AMBIGUOUS = [
    "ﬁle ﬂag",            // ligatures fi/fl
    "Ａ Ｂ Ｃ",            // full-width Latin letters
    "１２３",              // full-width digits
    "Ⅻ Ⅷ",               // roman numerals
    "①②③④⑤",            // circled numbers
    "²³ x⁴",              // superscripts
    "½ ¼ ¾",              // vulgar fractions
    "ß straße",           // sharp s (we check no-"ss" separately below)
    "ﬀ ﬃ ﬄ",            // more ligatures
    "Ⓐⓑⓒ",              // circled letters
    "ø Ø æ Æ œ Œ",        // letters w/o canonical decomposition
    "ł Ł đ Đ",            // stroked letters (no NFD decomposition)
    "İstanbul ı",         // Turkish dotted/dotless i
    "ＨＥＬＬＯ ｗｏｒｌｄ",  // full-width hello world
    "①②③④⑤",            // circled numbers (NFKD may expand)
    "™®©",                // trademark/registered/copyright (™ NFKD->tm)
    "ⅠⅡⅢⅳ",              // roman numerals upper/lower
  ];
  for (const s of AMBIGUOUS) {
    invariant(slugify, s);
    idempotent(slugify, s);
  }

  // The ONE explicit rule about ß: result must not contain "ss" (no ß->ss expansion).
  check("no-ss-expansion", () => {
    const out = slugify("straße");
    return typeof out === "string" && !out.includes("ss") && isValidSlug(out);
  });
  check("no-ss-expansion-2", () => {
    const out = slugify("ßßß");
    return typeof out === "string" && !out.includes("ss") && isValidSlug(out);
  });

  // =========================================================================
  // 4. IDEMPOTENCE on the exact happy-path corpus (slug of a slug is itself).
  // =========================================================================
  for (const [input] of EXACT) idempotent(slugify, input);
  for (const s of NON_LATIN_EMPTY) idempotent(slugify, s);
  // A produced slug fed back in must be unchanged AND already a valid slug.
  for (const [input] of EXACT) {
    check("slug-stable", () => {
      const out = slugify(input);
      return isValidSlug(out) && slugify(out) === out;
    });
  }

  // =========================================================================
  // 5. SHAPE INVARIANT on a broad hostile battery (no expected values guessed).
  // =========================================================================
  const HOSTILE = [
    "-leading-hyphen", "trailing-hyphen-", "--double--leading", "mid--double",
    "a-1-b-2", "123-abc-456", "UPPER-lower-123",
    "​‌zero width‍ joiners﻿",   // zero-width chars + BOM
    "tab\tand\nnewline\rreturn",
    "mixed: Café, 你好, 😀, 123!",                    // mixed scripts + latin + digits
    "a".repeat(1000) + " " + "b".repeat(1000),       // large input
    ("word-").repeat(500),                            // many separators, large
    " null byte ",
    "controlchars",
    "emoji😀between😀words",
    "数字123混合abc",                                  // CJK + digits + latin
    "ﬁ café 你好 😀 ① Ⅻ ²",                          // every contested class at once
    "   ",
    "...---___",
    "a",
    "1",
    "Z",
  ];
  for (const s of HOSTILE) {
    invariant(slugify, s);
    idempotent(slugify, s);
  }

  // =========================================================================
  // 6. RANDOMIZED PROPERTY BATTERY (seeded; invariants only, never exact values).
  //    Inputs are unknowable in advance to a specimen yet identical across specimens.
  // =========================================================================
  const rand = mulberry32(0x5eed1234);
  // Character pools spanning every dimension the contract cares about.
  const POOL = [];
  for (let c = 0x20; c <= 0x7e; c++) POOL.push(String.fromCharCode(c));   // ASCII printable
  for (let c = 0x00c0; c <= 0x017f; c++) POOL.push(String.fromCharCode(c)); // Latin-1 + Ext-A
  POOL.push("́", "̀", "̈", "̊", "̃");            // combining marks
  POOL.push("你", "好", "Я", "Ω", "あ", "한");                            // non-Latin scripts
  POOL.push("😀", "🎉", "🚀");                                            // emoji
  POOL.push("ﬁ", "Ａ", "①", "Ⅻ", "²", "ß", "½");                        // compatibility chars
  POOL.push(" ", "\t", "\n", "-", "_", ".", ",", "!");                    // separators
  POOL.push("", "");

  for (let i = 0; i < 400; i++) {
    const len = Math.floor(rand() * 40);
    let s = "";
    for (let j = 0; j < len; j++) {
      s += POOL[Math.floor(rand() * POOL.length)];
    }
    // Property A: output is always a valid slug.
    invariant(slugify, s);
    // Property B: idempotence.
    idempotent(slugify, s);
    // Property C: NFC and NFD encodings of the same string slug identically.
    check("rand-normalize-agree", () => {
      let nfc, nfd;
      try {
        nfc = s.normalize("NFC");
        nfd = s.normalize("NFD");
      } catch {
        return true; // pathological normalize failure: skip, not a slugify defect
      }
      return slugify(nfc) === slugify(nfd);
    });
  }

  // Property D: appending/prepending pure-separator junk does not change the slug
  // of the meaningful core (separators "otherwise disappear" + trim).
  const CORES = ["hello", "café", "top 10", "a b c", "Mixed Case Words"];
  const JUNK = ["   ", "!!!", "---", "___", "...", " - _ . ", "\t\n"];
  for (const core of CORES) {
    const want = slugify(core);
    for (const j of JUNK) {
      check("junk-invariant", () => slugify(j + core + j) === want);
    }
  }

  // =========================================================================
  // FINAL: exactly one JSON line; exit 0 iff passRate === 1.
  // =========================================================================
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}

main();
