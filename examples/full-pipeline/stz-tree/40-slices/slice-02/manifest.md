---
summary: "Punctuation stripping: extends slice-01 so punctuation and diacritics collapse correctly (strip non-[a-z0-9], NFKD diacritics, collapse repeated hyphens) without changing the contract surface. Owns predicate strip-punct. dependsOn slice-01."
contract: "export function slugify(input: string): string"
complexity: 2
---

# slice-02 — punctuation-stripping

## Contract

`export function slugify(input: string): string`

## Depends on
slice-01
