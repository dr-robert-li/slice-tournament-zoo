// PUBLIC suite (Suite 1) for slice `slugify`. NOT sealed — readable by all conditions;
// only condition B iterates against its failures. Deliberately ASCII happy-path only:
// it covers what a naive author eyeballs (case, spaces, punctuation, collapse, trim,
// numbers, empty) and intentionally omits the Unicode dimension. That omission is a
// pre-registered feature: B's selection signal is weaker than the sealed suite STZ's
// test-author writes, and the experiment measures whether depth-on-a-weak-signal loses
// to tournament diversity.
//
// Harness contract: node slugify.public.mjs <impl-path>
// Imports `slugify` export; prints exactly one JSON line {"passed":int,"total":int,"passRate":float};
// exits 0 iff passRate === 1 else 1. Node built-ins only.

let passed = 0;
let total = 0;
function eq(got, want) {
  total += 1;
  try {
    if (got === want) passed += 1;
  } catch {
    /* throwing counts as failure, not abort */
  }
}

const CASES = [
  ["Hello World", "hello-world"],
  ["Hello, World!", "hello-world"],
  ["UPPERCASE", "uppercase"],
  ["  spaced  out  ", "spaced-out"],
  ["Multiple   Spaces", "multiple-spaces"],
  ["Top 10 Songs", "top-10-songs"],
  ["a-b-c", "a-b-c"],
  ["already-a-slug", "already-a-slug"],
  ["Trailing!!!", "trailing"],
  ["!!!Leading", "leading"],
  ["foo_bar baz", "foo-bar-baz"],
  ["a---b", "a-b"],
  ["", ""],
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
