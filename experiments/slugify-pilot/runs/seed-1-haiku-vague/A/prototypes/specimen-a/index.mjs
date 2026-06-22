export function slugify(input) {
  // Non-string input returns empty string
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Step 1: Normalize accented characters to ASCII base forms
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Step 2: Convert to lowercase
    .toLowerCase()
    // Step 3: Replace non-alphanumeric characters (except hyphens) with hyphens
    .replace(/[^a-z0-9-]/g, '-')
    // Step 4: Collapse multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Step 5: Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}
