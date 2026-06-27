export function evaluate(expr) {
  let pos = 0;

  function skipWhitespace() {
    while (pos < expr.length && /\s/.test(expr[pos])) {
      pos++;
    }
  }

  function parseExpression() {
    return parseAddSubtract();
  }

  function parseAddSubtract() {
    let left = parseMultiply();
    while (true) {
      skipWhitespace();
      if (pos < expr.length && (expr[pos] === '+' || expr[pos] === '-')) {
        const op = expr[pos];
        pos++;
        const right = parseMultiply();
        left = op === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseMultiply() {
    let left = parseExponentiation();
    while (true) {
      skipWhitespace();
      if (pos < expr.length && expr[pos] === '*' && expr[pos + 1] !== '*') {
        pos++;
        const right = parseExponentiation();
        left = left * right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseExponentiation() {
    let base = parseUnary();
    skipWhitespace();
    if (pos < expr.length && expr[pos] === '*' && expr[pos + 1] === '*') {
      pos += 2;
      // Right-associative: parse the rest as another exponentiation
      const exponent = parseExponentiation();
      return Math.pow(base, exponent);
    }
    return base;
  }

  function parseUnary() {
    skipWhitespace();
    let sign = 1;
    while (pos < expr.length && (expr[pos] === '+' || expr[pos] === '-')) {
      if (expr[pos] === '-') {
        sign = -sign;
      }
      pos++;
      skipWhitespace();
    }
    const value = parsePrimary();
    return sign * value;
  }

  function parsePrimary() {
    skipWhitespace();
    if (pos < expr.length && expr[pos] === '(') {
      pos++;
      const value = parseExpression();
      skipWhitespace();
      if (pos < expr.length && expr[pos] === ')') {
        pos++;
      }
      return value;
    }
    return parseNumber();
  }

  function parseNumber() {
    skipWhitespace();
    let numStr = '';
    while (pos < expr.length && /\d/.test(expr[pos])) {
      numStr += expr[pos];
      pos++;
    }
    return parseFloat(numStr);
  }

  return parseExpression();
}
