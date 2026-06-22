# Task: `parseIp(s)`

Write `export function parseIp(s: string): number` — given a dotted-quad IPv4 address string,
return its unsigned 32-bit integer value. Node built-ins only; deterministic and pure.

This is the **under-specified** brief: it states what's needed but does not hand you the edge
cases. Robustness to malformed input is the point.

## What we need

- Standard dotted-quad: four decimal octets separated by `.` (e.g. `192.168.1.1`).
- Each octet is in the range `0`–`255`.
- Return the integer `o0·2^24 + o1·2^16 + o2·2^8 + o3` as a Number.
- **Throw on a malformed address** — anything that is not a well-formed dotted-quad in range.
- Return a Number.

## A couple of sanity examples

```
"0.0.0.0"          → 0
"1.2.3.4"          → 16909060
"255.255.255.255"  → 4294967295
```

We test against a broad hidden suite of real-world and adversarial address strings.
