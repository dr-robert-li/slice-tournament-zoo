export function slugify(input) {
  // P0: Non-string input returns ""
  if (typeof input !== 'string') {
    return '';
  }

  // P2: Unicode NFKD normalize
  let normalized = input.normalize('NFKD');

  // P2: Strip combining marks (U+0300–U+036F)
  let stripped = normalized.replace(/[̀-ͯ]/g, '');

  // P0: Lowercase
  let lowercased = stripped.toLowerCase();

  // P3: Replace maximal runs of non-[a-z0-9] with single "-"
  let collapsed = lowercased.replace(/[^a-z0-9]+/g, '-');

  // P3: Trim leading and trailing "-"
  let trimmed = collapsed.replace(/^-+|-+$/g, '');

  // P4: Result may be empty string
  return trimmed;
}
