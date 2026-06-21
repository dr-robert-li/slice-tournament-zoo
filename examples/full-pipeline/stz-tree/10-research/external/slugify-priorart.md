---
summary: "Prior art and standard patterns for slugify: lowercase, NFKD + diacritic strip, collapse non-alphanumeric runs to single hyphen, trim leading/trailing hyphens. Documents pitfalls (double hyphens, leading/trailing dashes, Unicode, empty string) seen across github-slugger, slugify (sindresorhus), and Django/Rails slug helpers."
---

# External Research: Slugify Prior Art and Patterns

## What a slug is

A URL slug is the human-readable, URL-safe portion of a path derived from a title
(e.g. `"Hello World"` -> `hello-world`). Established libraries that implement this:
sindresorhus/slugify, github-slugger, the `slugify` npm package, Django's
`django.utils.text.slugify`, and Rails' `parameterize`. They converge on a common
core algorithm even though they differ in option surface.

## Standard core algorithm (converged across implementations)

1. **Lowercase** the input (most slug functions default to lowercase output).
2. **Unicode-normalize and strip diacritics**: normalize to NFKD, then remove
   combining marks (Unicode category `Mn`). In JS this is the well-known idiom
   `str.normalize('NFKD').replace(/[̀-ͯ]/g, '')`, which turns
   `café` -> `cafe` and `naïve` -> `naive`. NFKD + combining-mark removal is the
   standard, checkable approach to diacritic stripping.
3. **Replace any run of non-alphanumeric characters with a single hyphen.** A run
   of whitespace and/or punctuation collapses to ONE `-`. Collapsing runs (rather
   than replacing each char individually) is what avoids double hyphens like `a--b`.
4. **Trim leading and trailing hyphens** so the slug never starts or ends with `-`.

A minimal, checkable JS reference of the core:
```js
title
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')   // strip diacritics
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')        // non-alnum runs -> single hyphen
  .replace(/^-+|-+$/g, '');           // trim edge hyphens
```
This single pipeline satisfies the three done-predicates in the intent:
- `slugify('Hello World') === 'hello-world'` (space -> single hyphen, lowercased)
- `slugify('A, B & C!') === 'a-b-c'` (`, `, ` & `, `!` collapse; trailing `!` trimmed)
- `slugify('') === ''` (empty in, empty out — no leading/trailing hyphen introduced)

## Well-known pitfalls (each checkable)

- **Double hyphens.** Replacing each separator char independently yields `a--b` for
  `"a, b"`. Fix: collapse contiguous separator runs with the `+` quantifier so
  `[^a-z0-9]+` matches the whole run.
- **Leading / trailing hyphens.** Input like `"!hello!"` or `" hello "` produces a
  slug bracketed by hyphens unless explicitly trimmed (`^-+|-+$`). Edge trim must
  run AFTER the run-collapse step, not before.
- **Empty / all-punctuation input.** `""` and `"!!!"` must both return `""`, not
  `"-"`. The edge-trim step handles `"!!!"` -> `""`; verify this case explicitly.
- **Case folding order.** Strip diacritics BEFORE lowercasing only matters for some
  scripts; for Latin it is order-independent, but doing `toLowerCase()` is required
  for the `hello-world` predicate regardless.
- **Unicode beyond Latin.** NFKD + `Mn` removal handles accented Latin but does NOT
  transliterate non-Latin scripts (Cyrillic, CJK, Greek). Libraries like `slugify`
  ship a character map for transliteration; that is OUT OF SCOPE for a zero-dep core
  but should be a documented limitation, not a silent surprise. With the ASCII-only
  `[^a-z0-9]+` filter, non-Latin characters are simply dropped.
- **Numbers and digits.** Digits are kept (`a-z0-9`); a title like `"Top 10"` ->
  `top-10`. Verify digits survive.
- **Idempotence.** `slugify(slugify(x))` should equal `slugify(x)`. The trim +
  collapse design is naturally idempotent; worth a property test.
- **Underscores / mixed separators.** Decide whether `_` is a separator. The strict
  `[^a-z0-9]+` rule treats `_` as a separator (`"a_b"` -> `a-b`). github-slugger
  keeps some characters; document the chosen policy.

## Design notes relevant to the intent

- A **pure function** (no I/O, deterministic, no global state) is the universal shape
  of these helpers — matches the intent constraint directly.
- **Zero runtime dependencies** is achievable: `String.prototype.normalize` and a few
  regexes are all that is required for the Latin/ASCII core. No library is needed.
- Keep the option surface minimal for v1 (single string arg, fixed `-` separator,
  lowercase) — matches the done-predicates exactly and avoids over-engineering.
