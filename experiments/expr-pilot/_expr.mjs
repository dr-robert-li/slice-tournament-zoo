// Shared generator for the expr suites: a seeded PRNG and a well-formed-expression
// generator that emits MINIMAL-parens strings (so operator precedence / associativity
// actually matters — the whole discriminating axis). The caller evaluates each string
// with a trusted reference to define its truth value and to filter to bounded integers.
// Built-ins only.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate one well-formed expression string. Concatenation only — no disambiguating
// parens are inserted, so a**b**c, -a**b, a-b-c keep their natural (ambiguous-looking)
// form and the precedence/associativity rules decide the value.
export function genExpr(rng, depth) {
  const lit = () => String(1 + Math.floor(rng() * 5)); // 1..5
  const op = () => ["+", "-", "*", "**"][Math.floor(rng() * 4)];
  function atom(d) {
    if (d <= 0 || rng() < 0.45) return lit();
    if (rng() < 0.3) return "(" + expr(d - 1) + ")";
    return lit();
  }
  function expr(d) {
    const r = rng();
    if (d <= 0 || r < 0.4) return lit();
    if (r < 0.58) return "-" + atom(d);            // unary minus
    if (r < 0.93) return expr(d - 1) + op() + expr(d - 1); // binary
    return "(" + expr(d - 1) + ")";
  }
  return expr(depth);
}

// Produce N valid {expr, value} pairs (integer-valued, |value| bounded), using the
// supplied trusted reference. Deterministic given seed.
export function validExpressions(reference, seed, n, depth = 3, bound = 1e9) {
  const rng = mulberry32(seed);
  const out = [];
  let guard = 0;
  while (out.length < n && guard < n * 200) {
    guard++;
    const e = genExpr(rng, depth);
    let v;
    try { v = reference(e); } catch { continue; }
    if (Number.isFinite(v) && Number.isInteger(v) && Math.abs(v) <= bound) out.push({ expr: e, value: v });
  }
  return out;
}
