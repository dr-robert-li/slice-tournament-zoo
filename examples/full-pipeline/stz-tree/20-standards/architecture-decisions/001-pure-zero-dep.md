---
summary: "ADR-001: slugify is a pure, zero-runtime-dependency TypeScript function. Accepted. Consequence: the NFKD diacritic-stripping pipeline must be hand-rolled from String.prototype.normalize('NFKD') + a combining-mark regex rather than pulling a slug/transliteration library; non-Latin transliteration is therefore out of scope and dropped."
status: accepted
date: 2026-06-21
---

# ADR-001: Pure function, zero runtime dependencies

## Status

Accepted.

## Context

The intent constrains the library to TypeScript, **zero runtime dependencies**, and a
**pure function** with no I/O. Established slug libraries (sindresorhus/slugify,
github-slugger, Django/Rails helpers) converge on the same core algorithm — lowercase,
NFKD-normalize and strip combining marks, collapse non-alphanumeric runs to a single
hyphen, trim edge hyphens. The diacritic-stripping and (optionally) transliteration steps
are the only parts that some libraries delegate to a dependency (a character map).

Ground-truth validation confirmed that `String.prototype.normalize('NFKD')` plus a
combining-mark regex (`/[̀-ͯ]/g`) reproduces `café → cafe` and `naïve → naive`
in plain `node` with no imports, and that the full pipeline satisfies all three intent
predicates.

## Decision

`slugify` is implemented as a single **pure function** with **no runtime dependencies**.
The Latin/ASCII normalization pipeline is **hand-rolled** entirely from
`String.prototype.normalize` and regular expressions. `dependencies` in `package.json`
stays empty; only dev tooling (TypeScript, vitest) is permitted.

## Consequences

- **The NFKD pipeline must be hand-rolled.** We cannot pull a slug or transliteration
  library to handle diacritics. The implementation owns the
  `normalize('NFKD').replace(/[̀-ͯ]/g, '')` idiom and the subsequent
  `toLowerCase()` → `replace(/[^a-z0-9]+/g, '-')` → `replace(/^-+|-+$/g, '')` steps.
- **Non-Latin transliteration is out of scope.** Without a character map (which would be a
  dependency), Cyrillic/CJK/Greek characters are dropped by the ASCII-only filter rather
  than transliterated. This is a documented limitation (see `conventions.md`), not a defect.
- **Purity is testable and the function is total.** No I/O, time, or randomness means
  deterministic outputs and trivially reproducible tests, including an idempotence property
  test. Defensive input coercion (per conventions) keeps it crash-free without a dependency.
- **Smallest possible footprint.** No transitive dependency risk, no supply-chain surface,
  instant install — appropriate for a single-function utility.
