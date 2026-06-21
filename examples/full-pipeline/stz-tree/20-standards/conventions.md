---
summary: "House style for the zero-dep TS slugify library. TS strict + ESM, no runtime deps, pure functions. Single named export `slugify(input: string): string` in src/slugify.ts re-exported from src/index.ts. camelCase functions. No throws: non-string input is coerced via String(input) before the pipeline (so null/undefined/number degrade gracefully, never crash). Testing idiom: vitest, each module gets example-based tests for the 3 done-predicates plus the documented pitfalls, and at least one property test (idempotence). Non-Latin transliteration is out of scope and dropped, by design."
version: 1
ratified_by: stz-conventions
ratified_at: 2026-06-21
---

# House Style & Architecture — slugify

A greenfield, zero-dependency, pure-function TypeScript slugify library. The repo is
greenfield (no legacy to honor), so these conventions are set from scratch and chosen
to be simple, conventional, and machine-checkable against the three intent predicates.

## Style

- **TypeScript strict.** `tsconfig.json` enables `"strict": true`. No implicit `any`,
  explicit return types on exported functions.
- **ESM only.** `package.json` declares `"type": "module"`; `"exports"` points at the
  built entry. No CommonJS interop shims.
- **Zero runtime dependencies.** `dependencies` is empty. Only dev-time tooling
  (`typescript`, `vitest`) is permitted under `devDependencies`. The NFKD diacritic
  pipeline is hand-rolled with `String.prototype.normalize` + regex (see ADR-001).
- **Pure functions.** No I/O, no time, no randomness, no global mutation. Same input
  always yields the same output. Deterministic and side-effect-free.

## Naming

- Functions are **camelCase**.
- The public API is exactly one **named export**: `slugify`.

  ```ts
  export function slugify(input: string): string
  ```

  No default export. The name `slugify` is the contract surface; do not rename or alias.

## File layout

- `src/slugify.ts` — the implementation. **Single named export** `slugify`.
- `src/index.ts` — re-exports the public API: `export { slugify } from './slugify.js';`
  (ESM extension in the specifier). `index.ts` adds no logic; it is the package entry.
- `package.json`, `tsconfig.json` at the repo root.
- Tests colocated or under `test/` (see Testing idiom). Internal helpers stay
  module-private in `slugify.ts`; only `slugify` is exported.

## Error handling

- **No throws.** The function never raises; there is no failure mode worth surfacing as
  an exception for a string-shaping helper. Note this makes the coercion step below
  **load-bearing, not optional polish**: the raw pipeline calls `.normalize()` /
  `.toLowerCase()`, which throw a `TypeError` on `null`/`undefined`. Coercing first is
  exactly what makes "no throws" true — do not remove it.
- **Non-string input handling — decision: coerce, do not throw.** The typed contract is
  `input: string`, but at runtime untyped callers may pass `null`, `undefined`, or a
  number. The first step of the pipeline coerces defensively: convert the argument with
  `String(input)` before normalization. Consequences:
  - `slugify(undefined)` → `''` is acceptable behavior **only after explicitly mapping
    nullish input to the empty string first** (`input == null ? '' : String(input)`), so
    that `null`/`undefined` produce `''` rather than the slugs `'null'`/`'undefined'`.
  - `slugify(123)` → `'123'` (numbers stringify and flow through normally).
  This keeps the function total (defined for every input) and crash-free while preserving
  the three typed predicates exactly.

## Testing idiom

- **Runner: vitest.** One runner, run via `npm test`. No mixed frameworks.
- **Example tests are mandatory and cover the 3 done-predicates verbatim:**
  - `slugify('Hello World') === 'hello-world'`
  - `slugify('A, B & C!') === 'a-b-c'`
  - `slugify('') === ''`
- **Plus the documented pitfalls as example cases:** double-hyphen collapse (`'a, b'` →
  `'a-b'`), edge trim (`'!hello!'` → `'hello'`), all-punctuation (`'!!!'` → `''`),
  diacritics (`'café'` → `'cafe'`), digits survive (`'Top 10'` → `'top-10'`), underscore
  as separator (`'a_b'` → `'a-b'`), and the nullish-coercion cases.
- **At least one property test: idempotence.** `slugify(slugify(x)) === slugify(x)` for
  arbitrary strings. A hand-written generator (sample of varied strings) is sufficient
  for v1 given zero runtime deps; vitest's built-in assertions suffice — no PBT library
  is required in this package.

## Scope / documented limitations

- Non-Latin scripts (Cyrillic, CJK, Greek) are **not transliterated**; under the
  ASCII-only `[^a-z0-9]+` filter they are simply dropped. This is a deliberate, documented
  limitation of the zero-dep core, not a bug. Transliteration would require a character
  map (a dependency) and is out of scope for v1.
- Single string argument, fixed `-` separator, lowercase output. No options surface in v1.
