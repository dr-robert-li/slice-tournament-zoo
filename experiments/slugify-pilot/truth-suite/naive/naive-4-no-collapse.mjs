// Naive impl #4 (the SUBTLE one): normalizes, folds, trims globally — looks complete and
// clears simple single-separator inputs — but replaces non-alphanumerics one-at-a-time
// (no `+`), so it never COLLAPSES runs: "Hello,  World" -> "hello---world". Violates the
// charset/shape invariant (contains "--"). Designed to pass naive happy-path checks yet
// FAIL the truth suite's collapse + invariant cases. Carrier for "passes public, fails truth".
export function slugify(input) {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-") // BUG: no `+`, so consecutive separators are NOT collapsed
    .replace(/^-+|-+$/g, "");
}
