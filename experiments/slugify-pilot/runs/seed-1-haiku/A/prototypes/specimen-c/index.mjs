export function slugify(input) {
  // P0: Non-string input → return ""
  if (typeof input !== 'string') {
    return '';
  }

  // P2: Unicode NFKD normalize
  const normalized = input.normalize('NFKD');

  // P2: Strip combining marks (U+0300–U+036F)
  const stripped = normalized.replace(/[̀-ͯ]/g, '');

  // P3: Lowercase
  const lowercased = stripped.toLowerCase();

  // P3: Replace every maximal run of characters not in [a-z0-9] with a single -
  const withSeparators = lowercased.replace(/[^a-z0-9]+/g, '-');

  // P3: Trim leading and trailing -
  const trimmed = withSeparators.replace(/^-+|-+$/g, '');

  return trimmed;
}
