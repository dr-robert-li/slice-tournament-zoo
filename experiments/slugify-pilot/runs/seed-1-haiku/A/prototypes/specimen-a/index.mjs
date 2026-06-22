export function slugify(input) {
  // P0: Non-string input → return ""
  if (typeof input !== 'string') {
    return '';
  }

  // P2: NFKD normalize
  const normalized = input.normalize('NFKD');

  // P2: Strip combining marks (U+0300–U+036F) and lowercase
  // Using regex to remove combining diacritical marks, then lowercase
  const stripped = normalized.replace(/[̀-ͯ]/g, '').toLowerCase();

  // P3 & P5: Replace maximal runs of non-[a-z0-9] with single hyphen
  const collapsed = stripped.replace(/[^a-z0-9]+/g, '-');

  // P3: Trim leading and trailing hyphens
  const trimmed = collapsed.replace(/^-+|-+$/g, '');

  // P4: Result may be empty string
  return trimmed;
}
