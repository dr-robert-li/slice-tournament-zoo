// Naive impl #2: handles punctuation but no Unicode normalization and no trim.
// Accented input loses letters ("crème" -> "cr-me"); leading/trailing hyphens survive.
// Should FAIL the truth suite.
export function slugify(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
