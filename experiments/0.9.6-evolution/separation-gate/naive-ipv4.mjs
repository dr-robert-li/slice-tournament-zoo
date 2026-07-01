// Naive-but-plausible IPv4 validator — the "passes the suite but is wrong" impl
// for the Phase-1 separation-gate pre-registration.
//
// It is regex-shape-only: four dot-separated 1–3 digit groups. It passes the
// DELIBERATELY WEAK sealed suite in sealed-suite.mjs (common cases only) at
// 1.000 — yet it accepts out-of-range octets (999.1.1.1) and leading zeros
// (01.1.1.1), which a typed boundary predicate catches.
//
// HONESTY NOTE: a good-faith IPv4 suite WOULD include the octet-range test, so
// this is a MECHANISM existence proof (predicates can express the condition and
// the gate detects a suite that misses it), NOT proof a realistic suite misses
// it. See separation-gate.md and Phase 3's outcome-separation gate.
//
// Usage: node naive-ipv4.mjs "<candidate>"  → prints "true" | "false"
const NAIVE = /^\d{1,3}(\.\d{1,3}){3}$/;
const input = process.argv[2] ?? "";
process.stdout.write(NAIVE.test(input) ? "true" : "false");
