# IPv4-pilot — clean fresh-task validation of the test-author hardening

The cron pilot's specimens are "burned" (their leniency location is known), so the PBT-negative
principle could not be honestly re-validated there. This is the **fresh, un-probed task** the HITL
gate required: `parseIp` (dotted-quad → uint32, "throw on malformed"). Natural `parseInt` soft
spots, explicit rejection clause. Specimens probed only AFTER authoring (for ground-truth labels).

## Design (two arms, blind, non-circular)

- **4 naive Haiku specimens** ("make the public happy-suite pass", read only `suites/ip.public.mjs`).
- **OLD-prompt authors (old-1, old-2)** — pre-hardening `stz-test-author` guidance (happy + edge
  incl. "malformed", "prefer property-based generators", invariant rules, reference). Guidance
  **inlined** (agentType `claude`, NOT the `stz-test-author` registry entry) so the control can't be
  contaminated by the now-hardened agent file.
- **NEW-prompt authors (new-1, new-2)** — same + the adversarial-coverage section (mandate
  rejection, discrimination, PBT-negative generator, **stay within the contract**).
- All authors blind to `runs/`, `suites/`, `suites-authored/`, specimens, findings, probes.
- Probe (`../cron-pilot/probe-malformed-battery.mjs` analogue inlined) labels specimen strictness
  AFTER the fact; never shown to authors.

## Ground truth: all 4 specimens are uniformly lenient

None of the 4 specimens throws on ANY malformed input (out-of-range octet, wrong part count,
trailing garbage, empty octet, non-numeric) — they return a wrong Number or `NaN`. So every
specimen violates the contract's "throw on malformed", and any rejection-asserting suite should
catch all four.

## Results (`score-ip-validation.mjs`)

**Specimens — want CAUGHT (<1.000):**

| | old-1 | old-2 | new-1 | new-2 |
|--|-------|-------|-------|-------|
| spec-a..d | 0.30 / 0.27 | 0.62 / 0.61 | 0.577 | 0.396 |

All four suites catch all four lenient specimens. **Discrimination is achieved by BOTH arms** —
on this task even the old guidance's "edge cases (malformed)" + "property-based generators" lines
produced rejection coverage (out-of-range octet is an obvious negative). The pure
"NEW-separates-where-OLD-ties" contrast does **not** isolate here, because OLD already separates.

**Cross-reference — want 1.000 everywhere (off-diagonal <1.000 = over-strict / mirror bug):**

| reference | old-1 | old-2 | new-1 | new-2 |
|-----------|-------|-------|-------|-------|
| ref-old-1 | 1.000 | 1.000 | 1.000 | 1.000 |
| ref-old-2 | 1.000 | 1.000 | 1.000 | 1.000 |
| ref-new-1 | 1.000 | 1.000 | 1.000 | 1.000 |
| **ref-new-2** | **0.950** | **0.915** | 1.000 | 1.000 |

`ref-new-2` is a correct-but-lenient impl (accepts leading-zero octets / surrounding whitespace —
forms the vague contract is **silent** on). This is a 2-2 split on a **spec-silent** point, so the
honest reading (same discipline as the cron `7`=Sunday discount) is NOT "OLD is buggy" — it is:
**OLD made an unforced commitment on a spec-silent case** (its authors asserted rejection of
leading-zeros / whitespace / hex, which the contract never mentions), and so it **rejects one of two
defensible readings** — scoring a correct lenient impl 0.950 / 0.915. **NEW stayed neutral**: its
authors explicitly declined to test leading-zero / whitespace because the contract is silent, so the
NEW suites pass **both** the strict and the lenient correct references (new-1 verified: strict ref
AND lenient ref both 777/777). That **neutrality on spec-silent inputs is the genuine, claimable
win** of the "stay within the contract" guard — it avoids committing the suite to an unstated rule
that would fail a correct implementation of the other reading.

## Conclusion — the hardening's value, validated on a fresh task

The win is real but on a **different axis than first predicted**:

1. **NEW is strictly ≥ OLD.** Same discrimination of the lenient specimens (catches all 4), and
   **neutral on spec-silent inputs** — passes both defensible correct readings, where OLD commits to
   one and so scores a correct lenient reference 0.915–0.950.
2. **The "stay within the contract" guard is empirically load-bearing.** It is the concrete
   difference between the arms here, and it directly prevents the over-strict class (asserting an
   unstated rule) from the rejection side.
3. **Rejection + PBT-negative coverage is reliably produced** (new-1: 330 negative cases incl. a
   300-iter negative generator; new-2: 418 incl. six negative-space generators) — confirming the
   guidance is followed, consistent with cron (3/3 authors added rejection cases).

## Honest limits

- **The original headline ("rejection separates where the old suite tied") was NOT reproduced
  here** — old guidance already discriminates on IPv4's obvious out-of-range negatives. That gap
  appeared on cron only because cron's discriminating leniency (`5abc` parseInt soft spot) is
  subtle; the PBT-negative principle targets exactly such soft spots but its separation power on a
  subtle case remains **unproven on a fresh task** (IPv4's specimens fail the obvious negatives, so
  the subtle-soft-spot scenario didn't arise). Directionally supported, not quantified.
- Small n, two tasks, single specimen tier.
- Net: the hardening ships as **strictly-safe and demonstrably ≥ the old guide** (catches lenient
  code; avoids over-strict false-fails). The stronger "closes subtle parser-soft-spot gaps" claim
  is reasoned (PBT-negative) and partially evidenced, not fully proven — roadmapped.
