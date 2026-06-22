# Task: `parseHexColor(s)`

Write `export function parseHexColor(s: string): { r: number, g: number, b: number }` — given a
hex color string, return its red, green, and blue components as integers in `0`–`255`. Node
built-ins only; deterministic and pure.

This is the **under-specified** brief: it states what's needed but does not hand you the edge
cases. Robustness to malformed input is the point.

## What we need

- Standard six-digit hex color: a `#` followed by six hexadecimal digits, two per channel
  (e.g. `#ff8800` → red `ff`, green `88`, blue `00`).
- Each channel is a hex byte in the range `00`–`ff` (decimal `0`–`255`).
- Return an object `{ r, g, b }` with the three integer channel values.
- **Throw on a malformed color** — anything that is not a well-formed six-digit hex color.
- Return an object with numeric `r`, `g`, `b`.

## A couple of sanity examples

```
"#000000"  → { r: 0,   g: 0,   b: 0   }
"#ffffff"  → { r: 255, g: 255, b: 255 }
"#ff8800"  → { r: 255, g: 136, b: 0   }
```

We test against a broad hidden suite of real-world and adversarial color strings.
