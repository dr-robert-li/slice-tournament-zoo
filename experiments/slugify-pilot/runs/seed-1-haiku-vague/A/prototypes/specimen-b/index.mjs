export function slugify(input) {
  // Validation: non-string input returns empty string
  if (typeof input !== 'string') {
    return '';
  }

  // State machine that processes code points
  let result = [];
  let lastWasSeparator = true; // Start as true to skip leading hyphens

  // Iterate through each character/code point
  for (const char of input) {
    const code = char.charCodeAt(0);
    let isLetter = false;
    let isDigit = false;
    let baseChar = null;

    // Check if it's a lowercase ASCII letter
    if (code >= 0x61 && code <= 0x7a) {
      isLetter = true;
      baseChar = char;
    }
    // Check if it's an uppercase ASCII letter
    else if (code >= 0x41 && code <= 0x5a) {
      isLetter = true;
      baseChar = char.toLowerCase();
    }
    // Check if it's a digit
    else if (code >= 0x30 && code <= 0x39) {
      isDigit = true;
      baseChar = char;
    }
    // Handle accented Latin letters using Unicode decomposition
    else if (code > 0x7f) {
      // Use String.prototype.normalize to decompose accents
      const normalized = char.normalize('NFD');
      if (normalized.length > 0) {
        const firstChar = normalized.charCodeAt(0);
        // Check if base character (after decomposition) is a Latin letter
        if ((firstChar >= 0x61 && firstChar <= 0x7a) ||
            (firstChar >= 0x41 && firstChar <= 0x5a)) {
          isLetter = true;
          baseChar = String.fromCharCode(firstChar).toLowerCase();
        }
      }
    }

    // Process the character
    if (isLetter || isDigit) {
      // If we just ended a word/separator, add a hyphen before starting new word
      if (lastWasSeparator && result.length > 0) {
        result.push('-');
      }
      result.push(baseChar);
      lastWasSeparator = false;
    } else {
      // Any other character is a separator
      lastWasSeparator = true;
    }
  }

  return result.join('');
}
