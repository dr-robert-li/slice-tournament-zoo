// SEALED selection suite (Suite 2) for slice `slugify`. Conditions A (tournament) and
// C (best-of-N) select on this; specimens never see it. It is the test-author's strong
// best-effort: full contract including Unicode folding, emoji-as-separator, collapse,
// all-separator/empty -> "", and non-Latin drop. It deliberately does NOT encode the
// deepest adversarial dimensions (composed/decomposed equivalence, the idempotence and
// charset PROPERTIES, control/zero-width chars, very-long runs) — those live only in the
// held-out TRUTH suite, so a winner can clear selection yet still be graded on residual.
//
// Harness contract: node slugify.sealed.mjs <impl-path>
// Prints exactly one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
// Node built-ins only.

let passed = 0;
let total = 0;
function eq(got, want, _label) {
  total += 1;
  try {
    if (got === want) passed += 1;
  } catch {
    /* throwing counts as failure */
  }
}

const CASES = [
  // ASCII contract (shared with public)
  ["Hello, World!", "hello-world"],
  ["  spaced  out  ", "spaced-out"],
  ["Multiple   Spaces", "multiple-spaces"],
  ["Top 10 Songs", "top-10-songs"],
  ["a---b", "a-b"],
  ["Trailing!!!", "trailing"],
  ["!!!Leading", "leading"],
  ["foo_bar baz", "foo-bar-baz"],
  ["", ""],
  // Unicode folding (NFKD + strip combining marks), composed input form
  ["café", "cafe"],
  ["Crème Brûlée", "creme-brulee"],
  ["naïve", "naive"],
  ["Über Cool", "uber-cool"],
  ["jalapeño poppers", "jalapeno-poppers"],
  // Emoji / symbols act as separators
  ["hello 👋 world", "hello-world"],
  ["100% pure", "100-pure"],
  ["C++ rocks", "c-rocks"],
  ["tab\tseparated\nlines", "tab-separated-lines"],
  // Drop-to-empty
  ["👋👋👋", ""],
  ["---", ""],
  ["  ...  ", ""],
  // Non-Latin scripts have no ASCII fold -> dropped
  ["Москва", ""],
  ["日本語のテキスト", ""],
];

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
  for (const [input, want] of CASES) {
    let got;
    try {
      got = slugify(input);
    } catch {
      got = "<<threw>>";
    }
    eq(got, want);
  }
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
