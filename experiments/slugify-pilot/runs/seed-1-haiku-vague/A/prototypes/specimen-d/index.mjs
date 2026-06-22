export function slugify(input) {
  // Non-string input returns empty string
  if (typeof input !== 'string') {
    return '';
  }

  // Normalize to NFD (decompose accents), convert to lowercase
  const normalized = input.normalize('NFD').toLowerCase();

  // Spread into code points, filter out combining marks, map to safe chars or separator
  const words = [...normalized]
    .filter(ch => !/\p{M}/u.test(ch))  // Remove combining diacritical marks
    .map(ch => {
      // Keep ASCII letters and digits, convert everything else to separator (space)
      const code = ch.charCodeAt(0);
      if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57)) {
        return ch;  // a-z or 0-9
      }
      return ' ';  // Use space as word separator
    })
    .join('')
    .trim()
    .split(/\s+/)  // Split on one or more spaces
    .filter(Boolean);  // Remove empty strings

  return words.join('-');
}
