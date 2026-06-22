// HELD-OUT TRUTH suite (Suite 3) for slice `slugify`. The independent oracle: used ONLY to
// grade frozen winners after the fact. No condition ever sees it; it is never a selection
// signal. It is a strict adversarial SUPERSET of the sealed suite — it adds the dimensions
// selection deliberately omits: composed/decomposed Unicode equivalence, lone/leading
// combining marks, zero-width & control chars, very-long separator runs, and the two
// PROPERTIES that catch whole bug classes generically (charset/shape invariant and
// idempotence). A winner can clear the sealed selection suite and still be discriminated here.
//
// Non-ASCII / invisible inputs are built from \u escapes (NOT literal bytes), so the test
// exercises exactly the code points intended regardless of how the file was transported.
//
// Harness contract: node slugify.truth.mjs <impl-path>
// Prints exactly one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
// Node built-ins only.

let passed = 0;
let total = 0;
function check(cond) {
  total += 1;
  try {
    if (cond === true) passed += 1;
  } catch {
    /* throwing predicate = failure, not abort */
  }
}

// Output shape invariant: empty, or [a-z0-9] groups joined by single hyphens; never a
// leading/trailing hyphen, never "--".
const SHAPE = /^$|^[a-z0-9]+(-[a-z0-9]+)*$/;

// Code points built explicitly (never relying on literal multibyte bytes in this file).
const ACUTE = String.fromCodePoint(0x0301); // combining mark U+0301
const CIRCUM = String.fromCodePoint(0x0302); // combining mark U+0302
const TILDE = String.fromCodePoint(0x0303); // combining mark U+0303
const DIAERESIS = String.fromCodePoint(0x0308); // combining mark U+0308
const ZWSP = String.fromCodePoint(0x200B); // zero-width space
const NUL = String.fromCodePoint(0x0000); // NUL control char
const CAFE_COMPOSED = "café"; // é as single code point U+00E9
const CAFE_DECOMPOSED = "cafe" + ACUTE; // e + combining acute
const UBER_DECOMPOSED = "u" + DIAERESIS + "ber cool"; // u + combining diaeresis + ...
const FAMILY_ZWJ = "\u{1F468}‍\u{1F469}‍\u{1F467}"; // family emoji ZWJ sequence
const TOKYO = "日本語"; // CJK
const MOSCOW = "Москва"; // Cyrillic
const LIGATURE_FI = "ﬁ"; // ﬁ -> NFKD "fi"
const ROMAN_12 = "Ⅻ"; // Ⅻ -> NFKD "XII" -> "xii"
const CIRCLED = "①②③"; // ①②③ -> NFKD "123"
const SHARP_S = "ß"; // ß: no ASCII fold -> dropped

// --- Explicit expected-output cases (input -> want) ---
const CASES = [
  // contract basics (re-pinned so a regression here is unambiguous)
  ["Hello, World!", "hello-world"],
  ["  spaced  out  ", "spaced-out"],
  ["a---b", "a-b"],
  ["Top 10 Songs", "top-10-songs"],
  ["", ""],
  // Unicode folding, COMPOSED form
  [CAFE_COMPOSED, "cafe"],
  // Unicode folding, DECOMPOSED form (base letter + combining mark)
  [CAFE_DECOMPOSED, "cafe"],
  [UBER_DECOMPOSED, "uber-cool"],
  // lone / leading combining marks
  [ACUTE + "abc", "abc"],
  [ACUTE + CIRCUM + TILDE, ""],
  // zero-width & control characters act as separators
  ["a" + ZWSP + "b", "a-b"],
  ["a" + NUL + "b", "a-b"],
  // emoji (incl. ZWJ sequence) drop to empty / separate
  ["hello \u{1F44B} world", "hello-world"],
  [FAMILY_ZWJ, ""],
  // non-Latin scripts -> empty
  [TOKYO, ""],
  [MOSCOW, ""],
  // NFKD compatibility folds
  [LIGATURE_FI + "le", "file"],
  [ROMAN_12, "xii"],
  [CIRCLED, "123"],
  // separators / punctuation
  ["C++ & C#", "c-c"],
  ["3.14159", "3-14159"],
  ["  ...  ", ""],
  // very long runs: collapse, and long alnum preserved
  ["a" + "-".repeat(1000) + "b", "a-b"],
  ["x".repeat(500), "x".repeat(500)],
];

// Corpus for the property checks (charset invariant + idempotence): the case inputs plus
// extra adversarial strings. Properties must hold for EVERY entry regardless of expected text.
const CORPUS = [
  ...CASES.map(([i]) => i),
  "MiXeD CaSe 123",
  "trailing-hyphen-",
  "-leading-hyphen",
  "--double--inside--",
  "\t\n\r whitespace \t\n",
  SHARP_S + " sharp s",
  "normal text here",
  "",
];

// COMPOSED vs DECOMPOSED equivalence: NFC and NFD variants must slug identically.
const EQUIV = [CAFE_COMPOSED + " resume", "Cre" + ACUTE + "me Bru" + CIRCUM + "le" + ACUTE + "e", "naive facade", "Zurich Koln"];

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
  const call = (x) => {
    try {
      return slugify(x);
    } catch {
      return "<<threw>>";
    }
  };

  // 1) Explicit expected outputs
  for (const [input, want] of CASES) check(call(input) === want);

  // 2) P0 never throws on any corpus input
  for (const s of CORPUS) {
    let threw = false;
    try {
      slugify(s);
    } catch {
      threw = true;
    }
    check(threw === false);
  }

  // 3) Charset/shape invariant on every corpus entry
  for (const s of CORPUS) check(SHAPE.test(call(s)));

  // 4) Idempotence: slug of a slug is itself
  for (const s of CORPUS) {
    const once = call(s);
    check(call(once) === once);
  }

  // 5) Composed/decomposed equivalence (NFC === NFD slug)
  for (const s of EQUIV) {
    check(call(s.normalize("NFC")) === call(s.normalize("NFD")));
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
