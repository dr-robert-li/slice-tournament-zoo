export function evaluate(expr) {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens);
  return parser.parseExpression();
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Numbers
    if (/\d/.test(ch)) {
      let num = '';
      while (i < expr.length && /\d/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: Number(num) });
      continue;
    }

    // Operators and parentheses
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' ||
        ch === '(' || ch === ')') {

      // Check for **
      if (ch === '*' && i + 1 < expr.length && expr[i + 1] === '*') {
        tokens.push({ type: 'OPERATOR', value: '**' });
        i += 2;
        continue;
      }

      tokens.push({ type: ch === '(' ? 'LPAREN' : ch === ')' ? 'RPAREN' : 'OPERATOR', value: ch });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume() {
    return this.tokens[this.pos++];
  }

  parseExpression() {
    return this.parseAdditive();
  }

  // Lowest precedence: + and - (left-associative)
  parseAdditive() {
    let left = this.parseMultiplicative();

    while (this.peek() && this.peek().type === 'OPERATOR' &&
           (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = op === '+' ? left + right : left - right;
    }

    return left;
  }

  // Next precedence: * (left-associative)
  parseMultiplicative() {
    let left = this.parseExponentiation();

    while (this.peek() && this.peek().type === 'OPERATOR' && this.peek().value === '*') {
      this.consume(); // consume *
      const right = this.parseExponentiation();
      left = left * right;
    }

    return left;
  }

  // Higher precedence: ** (right-associative)
  parseExponentiation() {
    let left = this.parseUnary();

    if (this.peek() && this.peek().type === 'OPERATOR' && this.peek().value === '**') {
      this.consume(); // consume **
      const right = this.parseExponentiation(); // right-associative recursion
      return Math.pow(left, right);
    }

    return left;
  }

  // Highest precedence: unary - and + (may stack)
  parseUnary() {
    if (this.peek() && this.peek().type === 'OPERATOR' &&
        (this.peek().value === '-' || this.peek().value === '+')) {
      const op = this.consume().value;
      const operand = this.parseUnary(); // recursive for stacking
      return op === '-' ? -operand : operand;
    }

    return this.parsePrimary();
  }

  // Highest level: numbers and parenthesized expressions
  parsePrimary() {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token.type === 'LPAREN') {
      this.consume(); // consume (
      const result = this.parseExpression(); // parse full expression inside
      this.consume(); // consume )
      return result;
    }

    throw new Error(`Unexpected token: ${token}`);
  }
}
