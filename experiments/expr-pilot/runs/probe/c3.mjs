export function evaluate(expr) {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens);
  return parser.parseExpression();
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    // Skip whitespace
    if (/\s/.test(expr[i])) {
      i++;
      continue;
    }

    // Numbers
    if (/\d/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /\d/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: Number(num) });
      continue;
    }

    // Operators and parentheses
    if (expr[i] === '+') {
      tokens.push({ type: 'PLUS', value: '+' });
      i++;
    } else if (expr[i] === '-') {
      tokens.push({ type: 'MINUS', value: '-' });
      i++;
    } else if (expr[i] === '*') {
      if (i + 1 < expr.length && expr[i + 1] === '*') {
        tokens.push({ type: 'POWER', value: '**' });
        i += 2;
      } else {
        tokens.push({ type: 'MULT', value: '*' });
        i++;
      }
    } else if (expr[i] === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
    } else if (expr[i] === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
    } else {
      i++;
    }
  }

  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }
    return null;
  }

  consume() {
    const token = this.peek();
    this.pos++;
    return token;
  }

  parseExpression() {
    return this.parseAdditive();
  }

  // Lowest precedence: +/- (left-associative)
  parseAdditive() {
    let left = this.parseMultiplicative();

    while (this.peek() && (this.peek().type === 'PLUS' || this.peek().type === 'MINUS')) {
      const op = this.consume();
      const right = this.parseMultiplicative();

      if (op.type === 'PLUS') {
        left = left + right;
      } else {
        left = left - right;
      }
    }

    return left;
  }

  // Next precedence: * (left-associative)
  parseMultiplicative() {
    let left = this.parsePower();

    while (this.peek() && this.peek().type === 'MULT') {
      const op = this.consume();
      const right = this.parsePower();
      left = left * right;
    }

    return left;
  }

  // Next precedence: ** (right-associative)
  parsePower() {
    let left = this.parseUnary();

    // Right-associative: build the right side first
    if (this.peek() && this.peek().type === 'POWER') {
      this.consume(); // consume **
      const right = this.parsePower(); // recursive call for right-associativity
      return Math.pow(left, right);
    }

    return left;
  }

  // Highest precedence: unary +/- (may stack)
  parseUnary() {
    if (this.peek() && (this.peek().type === 'PLUS' || this.peek().type === 'MINUS')) {
      const op = this.consume();
      const operand = this.parseUnary(); // recursive to allow stacking

      if (op.type === 'PLUS') {
        return +operand;
      } else {
        return -operand;
      }
    }

    return this.parsePrimary();
  }

  // Primary: numbers and parenthesized expressions
  parsePrimary() {
    const token = this.peek();

    if (token && token.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token && token.type === 'LPAREN') {
      this.consume(); // consume (
      const value = this.parseExpression();
      this.consume(); // consume )
      return value;
    }

    throw new Error('Unexpected token: ' + (token ? token.value : 'EOF'));
  }
}
