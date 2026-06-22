// Naive impl #3: normalizes and folds, but trims only ONE hyphen on ONE side (no /g, no +,
// alternation picks the first match), so any padded input keeps a stray hyphen.
// Should FAIL the truth suite.
export function slugify(input) {
  return String(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/, ""); // BUG: not global, not +; strips one hyphen on one side only
}
