---
summary: "Test strategy for the zero-dep TS slugify slice. Coverage target 100% line+branch (rationale: the surface is one pure function = nullish/coerce branch + a small regex pipeline; anything uncovered is dead code). Mutation policy: max 5% survival (effectively 0 surviving on a function this small). Example tests cover the 3 done-predicates verbatim plus documented pitfalls; one property test asserts idempotence slugify(slugify(x))===slugify(x) via a hand-written varied-string generator (NO PBT library — conventions.md forbids it; zero-dep). Eval harness: a sealed vitest suite imports slugify from a parameterized specimen module path (ESM .js specifier), runs all cases, and emits {passed,total,passRate} with passRate=passed/total. PREDICATE MAP has one row per done-predicate (lower-hyphen, strip-punct, empty)."
version: 1
authored_by: stz-test-planner
authored_at: 2026-06-21
---

# Test Strategy — slugify slice

This is the strategy only. The sealed held-out suite itself is written by the
per-slice test-author at tournament time; implementers never see it. This document
fixes the targets, the example-vs-property mix, the eval harness shape, and the
predicate map so the test-author and the eval-gate are aligned.

## Coverage target

- **Target: 100% line and branch coverage** (measured with vitest/c8).
- **Rationale.** The contract surface is a single pure function with no I/O. Its only
  control flow is (1) the nullish-to-empty / `String(input)` coercion branch and
  (2) a short, linear regex normalization pipeline (NFKD strip, lowercase, replace
  non-`[a-z0-9]` with `-`, collapse repeats, trim edges). The total branch count is
  tiny, so 100% is achievable and any uncovered line/branch is dead code that should
  be deleted rather than tolerated. We hold the bar at 100% precisely because the
  surface is small enough that a lower number would be hiding something.

## Mutation policy

- **Acceptable mutant survival rate: ≤ 5%** (target 0 survivors).
- **Rationale.** On a function this small, mutants — flipped comparisons in the
  coercion guard, altered regex character classes, dropped `.trim()`/collapse step,
  changed separator char — should each be killed by a specific example case. A
  surviving mutant indicates a missing pitfall case, not acceptable noise. Mutation
  testing runs only on eval-gate passers (cost control), per the harness policy.

## Property-vs-example mix

- **Example tests (the spine of the suite).** Mandatory, and they cover the 3
  done-predicates **verbatim** (see PREDICATE MAP). In addition, the documented
  pitfalls from conventions.md are included as example cases so mutants are killed:
  double-hyphen collapse (`'a, b'` → `'a-b'`), edge trim (`'!hello!'` → `'hello'`),
  all-punctuation (`'!!!'` → `''`), diacritics (`'café'` → `'cafe'`), digits survive
  (`'Top 10'` → `'top-10'`), underscore separator (`'a_b'` → `'a-b'`), and the
  nullish-coercion cases (`slugify(undefined)`/`slugify(null)` → `''`, `slugify(123)`
  → `'123'`).
- **Property test (exactly one).** **Idempotence:** `slugify(slugify(x)) === slugify(x)`
  for arbitrary `x`. A normalized slug fed back through `slugify` must be a fixed point.
- **No PBT library.** Per `20-standards/conventions.md`, the idempotence property is
  driven by a **hand-written generator** — a sample of varied strings (mixed case,
  punctuation, diacritics, digits, underscores, leading/trailing junk, empty,
  whitespace runs). This is deliberate: the package is **zero runtime dep**, and the
  conventions explicitly state no PBT library (fast-check / Hypothesis) is required or
  permitted here. vitest's built-in assertions over the generated sample suffice.

## Eval harness shape

The sealed suite is a **vitest** module (ESM, imports via the `.js` specifier to match
house style). It is parameterized by the **specimen module path** so the same suite can
be run against each tournament specimen's prototype:

- **Input:** a specimen module path, e.g. `prototypes/specimen-a/src/index.js`,
  dynamically imported to obtain the named `slugify` export.
- **Execution:** every example case and the idempotence property is run as a discrete
  check; each check contributes 1 to `total` and 1 to `passed` iff it holds.
- **Output:** a single JSON result object:

  ```ts
  { passed: number, total: number, passRate: number }  // passRate = passed / total
  ```

  `passRate` is exactly `passed / total` (a float in `[0,1]`; `total === 0` is treated
  as a harness error, not `passRate = 1`). The eval-gate eliminates any specimen whose
  result is not `passed === total` (passRate < 1.0) before the judge ever sees it.
- **Isolation:** the suite imports only the public named export `slugify`; it must not
  reach into module-private helpers, so the contract surface stays the only thing graded.

## PREDICATE MAP

Every done-predicate in `00-intent/intent.json` has a row. The planned check is the
verbatim example assertion the sealed suite will run.

| predicate id | intent expression | kind | planned check (example assertion) |
|:---|:---|:---|:---|
| `lower-hyphen` | `slugify('Hello World') === 'hello-world'` | test | example case: assert `slugify('Hello World')` equals `'hello-world'` — exercises lowercase + space→hyphen |
| `strip-punct` | `slugify('A, B & C!') === 'a-b-c'` | test | example case: assert `slugify('A, B & C!')` equals `'a-b-c'` — exercises punctuation strip + collapse + edge trim |
| `empty` | `slugify('') === ''` | test | example case: assert `slugify('')` equals `''` — exercises empty/total-input path (and anchors the nullish-coercion cases) |

Self-check: 3 predicate ids in intent.json (`lower-hyphen`, `strip-punct`, `empty`)
→ 3 rows above. Complete.
