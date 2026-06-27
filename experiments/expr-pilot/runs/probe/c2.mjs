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
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/\d/.test(ch)) {
      let num = '';
      while (i < expr.length && /\d/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: BigInt(num) });
    } else if (ch === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
    } else if (ch === '+') {
      tokens.push({ type: 'PLUS' });
      i++;
    } else if (ch === '-') {
      tokens.push({ type: 'MINUS' });
      i++;
    } else if (ch === '*') {
      if (i + 1 < expr.length && expr[i + 1] === '*') {
        tokens.push({ type: 'POW' });
        i += 2;
      } else {
        tokens.push({ type: 'MUL' });
        i++;
      }
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
    return this.tokens[this.pos];
  }

  consume() {
    return this.tokens[this.pos++];
  }

  parseExpression() {
    return this.parseAdditive();
  }

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

  parseMultiplicative() {
    let left = this.parseExponentiation();
    while (this.peek() && this.peek().type === 'MUL') {
      const op = this.consume();
      const right = this.parseExponentiation();
      left = left * right;
    }
    return left;
  }

  parseExponentiation() {
    let left = this.parseUnary();
    if (this.peek() && this.peek().type === 'POW') {
      const op = this.consume();
      const right = this.parseExponentiation();
      return Math.pow(left, right);
    }
    return left;
  }

  parseUnary() {
    if (this.peek() && (this.peek().type === 'PLUS' || this.peek().type === 'MINUS')) {
      const op = this.consume();
      const operand = this.parseUnary();
      if (op.type === 'PLUS') {
        return operand;
      } else {
        return -operand;
      }
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (token.type === 'NUMBER') {
      this.consume();
      return Number(token.value);
    } else if (token.type === 'LPAREN') {
      this.consume();
      const result = this.parseExpression();
      this.consume();
      return result;
    }
    throw new Error('Unexpected token');
  }
}
