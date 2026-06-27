export function evaluate(expr) {
  let pos = 0;

  function skipWhitespace() {
    while (pos < expr.length && /\s/.test(expr[pos])) {
      pos++;
    }
  }

  function peek() {
    skipWhitespace();
    return expr[pos];
  }

  function consume(ch) {
    skipWhitespace();
    if (expr[pos] === ch) {
      pos++;
      return true;
    }
    return false;
  }

  function parseNumber() {
    skipWhitespace();
    let num = '';
    while (pos < expr.length && /\d/.test(expr[pos])) {
      num += expr[pos];
      pos++;
    }
    return parseInt(num, 10);
  }

  // Precedence levels (lowest to highest):
  // 1. Binary +/- (left-associative)
  // 2. Binary * (left-associative)
  // 3. Unary -/+ (prefix)
  // 4. ** (right-associative)
  // 5. Primary (numbers and parenthesized expressions)

  function parseAddSub() {
    let left = parseMul();

    while (true) {
      skipWhitespace();
      if (expr[pos] === '+' && expr[pos + 1] !== '+') {
        pos++;
        let right = parseMul();
        left = left + right;
      } else if (expr[pos] === '-' && expr[pos + 1] !== '-') {
        pos++;
        let right = parseMul();
        left = left - right;
      } else {
        break;
      }
    }

    return left;
  }

  function parseMul() {
    let left = parseExponent();

    while (true) {
      skipWhitespace();
      if (expr[pos] === '*' && expr[pos + 1] !== '*') {
        pos++;
        let right = parseExponent();
        left = left * right;
      } else {
        break;
      }
    }

    return left;
  }

  function parseExponent() {
    let base = parseUnary();

    // ** is right-associative, so we recursively parse the right side
    skipWhitespace();
    if (expr[pos] === '*' && expr[pos + 1] === '*') {
      pos += 2;
      let exponent = parseExponent(); // Right-associative recursion
      return Math.pow(base, exponent);
    }

    return base;
  }

  function parseUnary() {
    skipWhitespace();

    if (expr[pos] === '+') {
      pos++;
      return parseUnary(); // Unary + just returns the value
    } else if (expr[pos] === '-') {
      pos++;
      return -parseUnary(); // Unary - negates the value
    }

    return parsePrimary();
  }

  function parsePrimary() {
    skipWhitespace();

    if (expr[pos] === '(') {
      pos++;
      let value = parseAddSub();
      skipWhitespace();
      if (expr[pos] === ')') {
        pos++;
      }
      return value;
    }

    return parseNumber();
  }

  let result = parseAddSub();
  return result;
}
