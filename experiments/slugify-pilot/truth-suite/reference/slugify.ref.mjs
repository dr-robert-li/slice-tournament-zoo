// Correct reference implementation of the `slugify` contract.
// Authored independently of the public/sealed suites (cross-family posture, relocated
// to the grading layer) — its sole job is to prove the TRUTH suite is satisfiable.
// Node built-ins only.

export function slugify(input) {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric runs -> single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
