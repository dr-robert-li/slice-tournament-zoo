export function slugify(input) {
  // Non-string returns empty string
  if (typeof input !== 'string') {
    return '';
  }

  // Normalize accents by decomposing, then removing diacritical marks
  const normalized = input.normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Convert to lowercase
  const lower = normalized.toLowerCase();

  // Replace non-alphanumeric with hyphens, collapse sequences of hyphens
  const replaced = lower.replace(/[^a-z0-9]+/g, '-');

  // Remove leading and trailing hyphens
  const trimmed = replaced.replace(/^-+|-+$/g, '');

  return trimmed;
}
