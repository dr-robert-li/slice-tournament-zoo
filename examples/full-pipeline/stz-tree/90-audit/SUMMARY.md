---
summary: "Run summary for the zero-dep TS slugify library. Intent: one deterministic pure slugify(input: string): string, TS strict + ESM, zero runtime deps, 3 machine-checkable done-predicates (lower-hyphen, strip-punct, empty). Research (14 claims ground-truth-validated, 13 confirmed via node, 1 confirmed-with-caveat) fixes the converged core pipeline: NFKD diacritic strip, lowercase, collapse non-[a-z0-9] runs to one hyphen, trim edge hyphens; non-Latin transliteration out of scope (dropped). Standards: ADR-001 hand-rolled zero-dep pipeline, single named export across src/slugify.ts + src/index.ts, no-throws via nullish-then-String(input) coercion (load-bearing). Tests: 100% line+branch, mutant survival <=5%, verbatim predicate examples + pitfall cases + one idempotence property (hand-written generator, no PBT lib); sealed vitest harness emits {passed,total,passRate}, gate requires passed===total. DAG: slice-01 core-slugify owns lower-hyphen+empty (no deps); slice-02 punctuation-stripping owns strip-punct, dependsOn slice-01; both still pending tournament. Open items: tournament unrun, no source/tests/winners yet, no git tree."
generated_by: stz-summarizer
generated_at: 2026-06-21
---

# Run Summary — slugify

## Intent

Build one deterministic slugify so teams stop hand-writing URL slugs inconsistently.
Consumers are app developers calling a library function.

- Surface: a single named export `slugify(input: string): string`.
- Constraints: TypeScript, zero runtime dependencies, pure function, no I/O.
- Three machine-checkable done-predicates (no prose acceptance):
  - `lower-hyphen`: `slugify('Hello World') === 'hello-world'`
  - `strip-punct`: `slugify('A, B & C!') === 'a-b-c'`
  - `empty`: `slugify('') === ''`

## Research (validated findings)

External prior art (sindresorhus/slugify, github-slugger, the slugify npm package,
Django, Rails) converges on one core algorithm:

1. Lowercase.
2. NFKD-normalize and strip combining marks, turning `café` into `cafe`.
3. Replace each run of non-alphanumeric characters with a single hyphen (`[^a-z0-9]+`), which is what prevents double hyphens.
4. Trim leading and trailing hyphens, and this trim must run after the collapse step.

Ground-truth validation checked 14 claims by running `node` and by inspecting the repo.
13 confirmed (the three predicates, the NFKD diacritic idiom, and the double-hyphen,
edge-trim, all-punctuation, digit-survival, underscore-separator, and idempotence
pitfalls; plus greenfield repo, `git status` exit 128, exactly 3 done-predicates in
intent.json). 1 confirmed-with-caveat, 0 refuted, 0 unverifiable.

Caveats:
- The internal codebase scan understated the `.stz/` scaffolding it enumerated, but the
  load-bearing claim (greenfield, no source/tests/build to integrate) holds.
- Non-Latin scripts (Cyrillic, CJK, Greek) are not transliterated. Under the ASCII-only
  `[^a-z0-9]+` filter they are dropped, by design, not transliterated. This is a
  documented limitation because transliteration needs a character map, which would be a
  runtime dependency.

## Standards (load-bearing decisions)

- ADR-001 (accepted): pure function, zero runtime dependencies. The NFKD pipeline is
  hand-rolled from `String.prototype.normalize` plus regexes; no slug or transliteration
  library is pulled. `dependencies` stays empty; only `typescript` and `vitest` as dev
  tooling.
- TypeScript strict and ESM only (`"type": "module"`, explicit return types on exports).
- Layout: `src/slugify.ts` holds the single named export `slugify`; `src/index.ts`
  re-exports it with the `.js` ESM specifier and adds no logic. No default export; the
  name `slugify` is the contract and must not be renamed or aliased. Internal helpers
  stay module-private.
- No throws. Non-string input is handled by coercion: map nullish to empty first, then
  `String(input)` (`input == null ? '' : String(input)`). This coercion is load-bearing,
  not polish, because `.normalize()` / `.toLowerCase()` throw a TypeError on
  null/undefined. Result: `slugify(undefined)` and `slugify(null)` give `''`,
  `slugify(123)` gives `'123'`, and the function stays total.
- v1 has no options surface: single string argument, fixed `-` separator, lowercase.

## Test strategy

- Coverage target 100% line and branch (the surface is one pure function, so anything
  uncovered is dead code).
- Mutation policy: mutant survival rate at most 5%, target 0; mutation runs only on
  eval-gate passers for cost control.
- Example tests cover the 3 done-predicates verbatim plus the documented pitfalls
  (double-hyphen collapse, edge trim, all-punctuation, diacritics, digit survival,
  underscore separator, nullish coercion). Exactly one property test asserts idempotence
  `slugify(slugify(x)) === slugify(x)` using a hand-written varied-string generator. No
  PBT library, by convention (zero-dep).
- Eval harness: a sealed vitest suite, written by the per-slice test-author at tournament
  time and never seen by implementers, parameterized by specimen module path. It imports
  only the public `slugify`, runs every example case and the idempotence property, and
  emits `{ passed, total, passRate }` with `passRate = passed / total`. The gate
  eliminates any specimen where `passed !== total` before the judge runs; `total === 0`
  is a harness error, not a pass.

## Slices (the DAG)

Two contract-bounded vertical slices over the same surface
`slugify(input: string): string`. Each of the 3 intent predicates is owned by exactly
one slice. Trace tier minimal; judge votesPerPair 2.

- slice-01 core-slugify: owns `lower-hyphen` and `empty`. dependsOn nothing.
  Complexity 2. Establishes the core pipeline (lowercase, whitespace to hyphen, edge
  trim, empty/nullish-coercion path) that later behavior builds on.
- slice-02 punctuation-stripping: owns `strip-punct`. dependsOn slice-01.
  Complexity 2. Extends the pipeline so punctuation and diacritics collapse (strip
  non-`[a-z0-9]`, NFKD diacritics, collapse repeated hyphens) without changing the
  contract surface.

Dependency edge: slice-01 to slice-02.

Both slices are still pending; neither tournament has run.

## Open items

- Tournament unrun for both slices: no specimens, no eval-gate results, no judge
  rankings, no winners, no merges, no as-built spec or spec-diff yet.
- No application source or tests exist; the repo is greenfield and the first specimen
  must author `package.json`, `tsconfig.json`, `src/`, and the tests from scratch.
- No git working tree yet (`git status` returned exit 128 during validation).
- Completion report: 0 done, 0 halted, 2 pending of 2 slices.
