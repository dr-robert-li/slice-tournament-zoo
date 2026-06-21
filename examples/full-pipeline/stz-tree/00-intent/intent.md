---
summary: "Intent: 3 done-predicate(s); 4 area(s)."
---

# Intent

## Problem
Teams hand-write URL slugs from titles inconsistently; need one deterministic slugify.

## Users
App developers calling a library function.

## Constraints
- TypeScript, zero runtime deps
- pure function, no I/O

## Done predicates (machine-checkable)
- `slugify('Hello World') === 'hello-world'` (test)
- `slugify('A, B & C!') === 'a-b-c'` (test)
- `slugify('') === ''` (test)
