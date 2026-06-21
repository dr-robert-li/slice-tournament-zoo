---
summary: "Vertical-slice DAG for the zero-dep TS slugify library: 2 slices. slice-01 core-slugify owns the lowercased-hyphenated core (predicates lower-hyphen + empty), no deps, complexity 2. slice-02 punctuation-stripping owns punctuation/diacritics collapse (predicate strip-punct), dependsOn slice-01, complexity 2. Each of the 3 intent done-predicates is owned by exactly one slice. Contract surface is the single named export `slugify(input: string): string`. Trace tier minimal; judge votesPerPair 2."
version: 1
authored_by: stz-slicer
authored_at: 2026-06-21
---

# Proposed Vertical-Slice DAG — slugify

The library is small (one pure function, one named export), so the DAG is two
contract-bounded vertical slices over the same surface `slugify(input: string): string`.
slice-02 extends slice-01's pipeline; it does not introduce a new export.

## Slices

### slice-01 — core-slugify
- **Contract:** `export function slugify(input: string): string`
- **Owns predicates:** `lower-hyphen`, `empty`
- **dependsOn:** (none)
- **Complexity:** 2
- **Rationale:** Establishes the core pipeline — lowercase + whitespace→hyphen + edge
  trim + empty/nullish-coercion path — the foundation every later behavior builds on.

### slice-02 — punctuation-stripping
- **Contract:** `export function slugify(input: string): string`
- **Owns predicates:** `strip-punct`
- **dependsOn:** `slice-01`
- **Complexity:** 2
- **Rationale:** Extends the core so punctuation and diacritics collapse correctly
  (strip non-`[a-z0-9]`, NFKD diacritics, collapse repeated hyphens) without changing
  the contract surface slice-01 already owns.

## Dependency edge

```
slice-01 (core-slugify) ──▶ slice-02 (punctuation-stripping)
```

## Predicate ownership (every predicate assigned exactly once)

| predicate id | intent expression | owning slice |
|:---|:---|:---|
| `lower-hyphen` | `slugify('Hello World') === 'hello-world'` | slice-01 |
| `empty` | `slugify('') === ''` | slice-01 |
| `strip-punct` | `slugify('A, B & C!') === 'a-b-c'` | slice-02 |

3 intent predicates → 3 rows, each owned by exactly one slice. Complete.
