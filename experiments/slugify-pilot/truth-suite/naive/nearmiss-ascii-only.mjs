// NEAR-MISS fixture (the discrimination carrier): fully correct on ASCII — collapse, trim,
// punctuation, case, numbers, empty — but does NO Unicode normalization, so accented input
// loses letters ("café" -> "caf") and composed/decomposed forms disagree. It PASSES the
// public suite (ASCII happy-path) yet FAILS the sealed + truth suites (unicode dimension).
// This proves the truth suite discriminates a winner the weak public signal would accept.
export function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
