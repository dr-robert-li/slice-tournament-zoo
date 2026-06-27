// Reference GOOD-FAITH-NAIVE evaluator — the natural, common mistake on this grammar:
//   ** treated as LEFT-associative, and unary minus bound TIGHTER than ** (handled at
//   the operand level). So -2**2 == (-2)**2 == 4 (wrong; should be -4) and
//   2**3**2 == (2**3)**2 == 64 (wrong; should be 512). It gets simple expressions and
//   +,-,* precedence exactly right — which is why a good-faith fixed-example suite
//   passes it. Used ONLY for the separation gate. NEVER shown to specimens.
export function evaluate(expr) {
  let i = 0;
  const s = expr;
  function ws() { while (i < s.length && /\s/.test(s[i])) i++; }
  function eat(tok) { ws(); if (s.startsWith(tok, i)) { i += tok.length; return true; } return false; }

  function add() {
    let v = mul();
    for (;;) { ws();
      if (s.startsWith("**", i)) break;
      if (eat("+")) v += mul(); else if (eat("-")) v -= mul(); else break;
    }
    return v;
  }
  function mul() {
    let v = pow();
    for (;;) { ws();
      if (s.startsWith("**", i)) break;
      if (eat("*")) v *= pow(); else break;
    }
    return v;
  }
  function pow() {            // BUG: left-associative loop
    let v = unary();
    for (;;) { ws();
      if (s.startsWith("**", i)) { i += 2; v = v ** unary(); } else break;
    }
    return v;
  }
  function unary() {         // BUG: unary applied below ** (binds tighter)
    ws();
    if (eat("-")) return -unary();
    if (eat("+")) return +unary();
    return atom();
  }
  function atom() {
    ws();
    if (eat("(")) { const v = add(); eat(")"); return v; }
    let j = i;
    while (j < s.length && /[0-9]/.test(s[j])) j++;
    const num = Number(s.slice(i, j));
    i = j;
    return num;
  }
  return add();
}
