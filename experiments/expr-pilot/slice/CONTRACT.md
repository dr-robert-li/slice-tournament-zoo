# Slice contract — `evaluate`

A fresh, **competence-frontier** contract for the harness-evolve experiment. Correctness
is **non-enumerable** (the space of expressions is infinite) and the operator-precedence
semantics are a notorious blind-spot surface where a capable implementer genuinely errs —
not by missing recall, but because the precise rules below are counter-intuitive.

## Function

```js
export function evaluate(expr) { ... }
```

Evaluate a string arithmetic expression and return its numeric value.

### Grammar
- Non-negative integer literals (one or more digits), e.g. `0`, `7`, `42`.
- Binary operators: `+`, `-`, `*`, `**` (exponentiation).
- Unary prefix `-` and `+` (may stack, e.g. `--3`).
- Parentheses `(` ... `)`.
- Arbitrary whitespace between tokens is ignored.

### Semantics — follow these EXACTLY (Python semantics)
1. Precedence, lowest to highest: `+`/`-` (binary) < `*` < unary `-`/`+` < `**`.
   - Consequence: `**` binds **tighter than unary minus**, so `-2**2` == `-(2**2)` == `-4`
     (NOT `(-2)**2` == 4).
2. `+`, `-`, `*` are **left-associative**: `8-3-2` == `3`, `2*3*4` == `24`.
3. `**` is **right-associative**: `2**3**2` == `2**(3**2)` == `512` (NOT `(2**3)**2` == 64).
4. The right operand of `**` may carry a unary sign: `2**-1` == `0.5`.
5. Parentheses override precedence as usual.

### Input / output
- `expr`: a string containing a well-formed expression per the grammar (you may assume
  it is well-formed).
- Returns: a JS number — the value, using JS arithmetic (`**`, `*`, `+`, `-`).

### Examples (illustrative, NOT exhaustive)
- `"2+3*4"` → `14`
- `"(2+3)*4"` → `20`
- `"2**3**2"` → `512`
- `"-2**2"` → `-4`
- `"--3"` → `3`

The grader compares your value against a reference evaluator over many expressions.
