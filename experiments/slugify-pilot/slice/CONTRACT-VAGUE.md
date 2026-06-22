# Task: `slugify(input)`

Write `export function slugify(input: string): string` — turn an arbitrary user-supplied string
into a URL-safe slug. Node built-ins only; deterministic and pure (no dependencies).

This is the **under-specified** brief used for the discrimination runs: it pins the *output
behaviour* we grade on but deliberately does NOT hand you the implementation recipe or the tricky
inputs. Figure those out yourself — robustness to messy real-world input is the whole point.

## What we need

- Output uses only `a–z`, `0–9`, and the hyphen `-`. Nothing else may appear in the result.
- Words are separated by a single hyphen. No leading, trailing, or doubled hyphens.
- Accented Latin letters fold to their plain ASCII base (e.g. `café → cafe`, `Über → uber`).
- Anything that is not a Latin letter or digit — punctuation, symbols, emoji, whitespace, other
  writing systems — acts as a word separator and otherwise disappears.
- Input with no usable letters or digits (empty, all punctuation, all emoji, non-Latin scripts)
  produces the empty string `""`.
- Do **not** transliterate beyond plain accent-folding (no `ß → ss`, no romanizing other scripts).
- Non-string input returns `""`.

## A couple of sanity examples (not the full picture)

```
"Hello, World!"        → "hello-world"
"  Café  Münchën  "    → "cafe-munchen"
""                     → ""
```

Make it robust. We test against a broad hidden suite of messy inputs.
