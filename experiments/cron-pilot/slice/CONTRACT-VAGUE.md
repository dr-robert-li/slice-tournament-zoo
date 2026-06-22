# Task: `nextRun(expr, after)`

Write `export function nextRun(expr: string, after: Date): Date` — given a standard 5-field cron
expression and a reference time, return the next time the schedule fires, after that reference.
Node built-ins only; deterministic and pure.

This is the **under-specified** brief: it states what's needed but does not hand you the edge
cases or the algorithm. Work in **UTC**. Robustness to the awkward parts of cron is the point.

## What we need

- Standard 5 fields: `minute hour day-of-month month day-of-week`, with the usual `*`, lists
  (`,`), ranges (`a-b`), and steps (`*/n`, `a-b/n`). Day-of-week 0–6 with 0 = Sunday.
- Return the earliest firing time strictly later than `after` (cron fires at the top of the
  minute — seconds zeroed).
- Handle the messy realities of real cron schedules correctly, including how day-of-month and
  day-of-week interact, month and year boundaries, and leap years.
- Throw on a malformed expression or an invalid date.
- Return a `Date`.

## A couple of sanity examples (after = `2024-01-01T00:00:00Z`)

```
"* * * * *"     → 2024-01-01T00:01:00Z
"0 0 * * *"     → 2024-01-02T00:00:00Z
"*/15 * * * *"  → 2024-01-01T00:15:00Z
```

We test against a broad hidden suite of real-world cron expressions.
