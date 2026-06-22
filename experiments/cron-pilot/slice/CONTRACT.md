# Slice contract: `nextRun`

```
export function nextRun(expr: string, after: Date): Date
```

Given a standard 5-field cron expression and a reference `Date`, return the **next** UTC time
the schedule fires, strictly after `after`. Deterministic, pure, no dependencies. Operates
entirely in **UTC** (no local timezone, no DST).

## Cron syntax (5 space-separated fields)

```
┌── minute        0–59
│ ┌── hour        0–23
│ │ ┌── day-of-month 1–31
│ │ │ ┌── month    1–12
│ │ │ │ ┌── day-of-week 0–6  (0 = Sunday; 7 also accepted as Sunday)
│ │ │ │ │
* * * * *
```

Each field supports:
- `*` — every value in range.
- `a` — a single value.
- `a-b` — an inclusive range.
- `a,b,c` — a list (any combination of the above forms).
- `*/s` — every `s`th value across the whole range.
- `a-b/s` — every `s`th value within `a..b`.
- `a/s` — every `s`th value from `a` to the field maximum.

## Semantics (normative)

1. **Minute granularity.** The schedule fires at the start of a matching minute (seconds and
   milliseconds = 0).
2. **Strictly after.** Return the earliest firing time `> after`. If `after` lands exactly on a
   matching minute, return the *next* match, not `after` itself.
3. **UTC only.** All field comparisons use UTC components of the candidate time.
4. **day-of-month / day-of-week union (the cron gotcha).** If BOTH the dom and dow fields are
   restricted (neither is `*`), a day matches when **either** the dom OR the dow field matches.
   If only one of them is restricted, only that one constrains the day. If both are `*`, every
   day matches.
5. **Errors.** Throw on a malformed expression: not exactly 5 fields, a value outside its field
   range, an inverted range (`a-b` with `a>b`), or a step `≤ 0`. Throw if `after` is not a valid
   `Date`.
6. Return a `Date`.

## Worked examples (after = `2024-01-01T00:00:00Z`, a Monday)

| expr | meaning | → next |
|------|---------|--------|
| `* * * * *` | every minute | `2024-01-01T00:01:00Z` |
| `0 0 * * *` | daily midnight | `2024-01-02T00:00:00Z` |
| `*/15 * * * *` | every 15 min | `2024-01-01T00:15:00Z` |
| `0 9 * * 1` | 09:00 every Monday | `2024-01-08T09:00:00Z` |
| `0 0 13 * 5` | midnight on the 13th OR any Friday (union) | `2024-01-05T00:00:00Z` (Fri 5th) |
| `0 0 29 2 *` | midnight Feb 29 (leap) | `2024-02-29T00:00:00Z` |
| `0 0 31 * *` | midnight on the 31st (month rollover) | `2024-01-31T00:00:00Z` |

## Done-predicates

- `P0` valid expr + valid Date → returns a `Date` strictly after `after`.
- `P1` returned time matches every field (minute/hour/month + dom/dow union rule).
- `P2` dom/dow **union** semantics when both are restricted.
- `P3` step and range syntax (`*/s`, `a-b/s`, `a/s`, lists) parse correctly.
- `P4` month/year rollover and leap-year Feb 29 handled.
- `P5` malformed expr / invalid Date → throws.
