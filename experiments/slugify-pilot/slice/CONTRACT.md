# Slice contract: `slugify`

```
export function slugify(input: string): string
```

Turn an arbitrary string into a URL-safe ASCII slug. **Deterministic, pure, no
dependencies.** This contract is the single source of truth all three suites encode (at
different depths). The behaviour is the "ASCII slug" contract — anything that cannot be
folded to `[a-z0-9]` is treated as a separator and ultimately dropped. There is no
transliteration table (ß does **not** become `ss`); that ambiguity is deliberately excluded
so the oracle stays deterministic.

## Algorithm (normative)

1. **Non-string input** → return `""`.
2. **Unicode NFKD normalize** the input.
3. **Strip combining marks** (Unicode range U+0300–U+036F). After steps 2–3, `é` (whether
   pre-composed U+00E9 or decomposed `e`+U+0301) becomes `e`.
4. **Lowercase**.
5. Replace every **maximal run of characters not in `[a-z0-9]`** with a single `-`.
6. **Trim** all leading and trailing `-`.
7. The result MAY be the empty string (empty input, all-separator input, or input that drops
   to nothing).

## Output invariants (must hold for every input)

- Output matches `^$|^[a-z0-9]+(-[a-z0-9]+)*$` — only `[a-z0-9]` and single internal `-`,
  no leading/trailing `-`, never `--`.
- **Idempotent:** `slugify(slugify(x)) === slugify(x)`.
- **Composed/decomposed equivalence:** a string and its NFC/NFD variant slug identically.

## Worked examples

| input | output |
|-------|--------|
| `"Hello, World!"` | `"hello-world"` |
| `"  Crème Brûlée  "` | `"creme-brulee"` |
| `"Top 10 Songs"` | `"top-10-songs"` |
| `"a---b"` | `"a-b"` |
| `"héllo"` (composed **or** decomposed) | `"hello"` |
| `"hello 👋 world"` | `"hello-world"` |
| `"👋👋👋"` | `""` |
| `"日本語"` | `""` |
| `"C++"` | `"c"` |
| `""` / `"---"` | `""` |

## Deliberate non-standard choices (read before implementing)

This contract is intentionally simpler than popular slug libraries. Do **not** add behaviour
beyond it:
- **No transliteration.** `ß` does NOT become `ss`; `ø`, `æ`, etc. that don't decompose under
  NFKD are simply dropped. Only NFKD decomposition + combining-mark stripping is performed.
- **Everything non-`[a-z0-9]` is a separator**, including zero-width and control characters:
  `"a​b"` → `"a-b"` (not `"ab"`).
- **Non-Latin scripts drop to `""`** (no romanization).

## Done-predicates

- `P0` returns a string for any input (never throws).
- `P1` output satisfies the charset/shape invariant above.
- `P2` accents fold (NFKD + strip-marks), composed and decomposed inputs agree.
- `P3` separator runs collapse to one `-` and are trimmed at both ends.
- `P4` empty / all-separator / all-dropped input → `""`.
- `P5` idempotent.
