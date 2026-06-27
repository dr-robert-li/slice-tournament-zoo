// Reference CORRECT evaluator — recursive descent with exact Python precedence:
//   add  := mul (('+'|'-') mul)*           left-assoc
//   mul  := unary ('*' unary)*             left-assoc
//   unary:= ('-'|'+')* power               unary BELOW ** in precedence
//   power:= atom ('**' unary)?             ** RIGHT-assoc; right operand is unary (so -2**2 = -(2**2))
//   atom := integer | '(' add ')'
// Validated against known values. Used ONLY for the separation gate / oracle. NEVER
// shown to specimens.
export function evaluate(expr) {
  let i = 0;
  const s = expr;
  function ws() { while (i < s.length && /\s/.test(s[i])) i++; }
  function peek() { ws(); return s[i]; }
  function eat(tok) { ws(); if (s.startsWith(tok, i)) { i += tok.length; return true; } return false; }

  function add() {
    let v = mul();
    for (;;) {
      ws();
      if (s.startsWith("**", i)) break; // never an add operator
      if (eat("+")) v = v + mul();
      else if (eat("-")) v = v - mul();
      else break;
    }
    return v;
  }
  function mul() {
    let v = unary();
    for (;;) {
      ws();
      if (s.startsWith("**", i)) break;
      if (eat("*")) v = v * unary();
      else break;
    }
    return v;
  }
  function unary() {
    ws();
    if (eat("-")) return -unary();
    if (eat("+")) return +unary();
    return power();
  }
  function power() {
    const base = atom();
    ws();
    if (s.startsWith("**", i)) { i += 2; return base ** unary(); } // right-assoc via unary->power
    return base;
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
