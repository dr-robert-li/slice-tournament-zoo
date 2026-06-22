// Post-hoc strictness probe. NEVER shown to specimen or suite authors. Labels ground truth.
const R = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/hexcolor-pilot/runs/specimens";
const ids = ["a", "b", "c", "d", "e", "f", "g"];

// SHOULD-THROW forms (contract: not a well-formed six-digit hex color).
// idx 0 = the DISCRIMINATING subtle soft spot: trailing non-hex in last byte; parseInt("cg",16)=12 leaks.
const mustThrow = [
  "#aabbcg",   // 0  subtle: parseInt-slicer leaks (reads c, drops g), regex rejects
  "#aagbcc",   // 1  leading non-hex in a byte: parseInt("gb"..)? actually "ag"->parseInt NaN-ish; mostly rejected
  "#gggggg",   // 2  all non-hex (obvious)
  "#12",       // 3  too short (obvious)
  "#1234567",  // 4  too long (obvious)
  "123456",    // 5  missing # (obvious-ish; spec implies leading #)
  "#12345",    // 6  five digits
  "#xyzxyz",   // 7  non-hex letters (obvious)
  "",          // 8  empty
  "#ffgg00",   // 9  middle byte non-hex trailing: parseInt("gg")=NaN -> rejected by all
];

// SPEC-SILENT forms (contract says nothing) — accepting OR rejecting is defensible. Reported, not scored.
const silent = [
  "#abc",        // shorthand 3-digit
  "#aabbccdd",   // 8-digit (alpha)
  "  #ffffff  ", // surrounding whitespace
  "#FFFFFF",     // uppercase (examples are lowercase; case-insensitive is a reasonable reading)
];

const fmt = (x) => {
  if (x === "THREW") return "·";        // threw = strict here
  if (x === "ERR") return "E";
  return "A";                            // accepted (returned a value)
};

async function call(fn, s) {
  try { const v = fn(s); return (v && typeof v === "object") ? "ACCEPT" : "THREW"; }
  catch { return "THREW"; }
}

async function run(id) {
  let fn;
  try { ({ parseHexColor: fn } = await import(`${R}/specimen-${id}/index.mjs`)); }
  catch { return null; }
  const mt = []; for (const s of mustThrow) mt.push(await call(fn, s));
  const sl = []; for (const s of silent) sl.push(await call(fn, s));
  return { id, mt, sl };
}

console.log("MUST-THROW (· = threw=correct, A = ACCEPTED=BUG). idx0 = subtle soft-spot '#aabbcg'");
console.log("        " + mustThrow.map((_, i) => String(i).padStart(2)).join(" "));
const rows = [];
for (const id of ids) {
  const r = await run(id);
  if (!r) { console.log("spec-" + id + "  IMPORTFAIL"); continue; }
  rows.push(r);
  console.log("spec-" + id + "  " + r.mt.map(x => fmt(x === "ACCEPT" ? "A" : "THREW")).map(s => s.padStart(2)).join(" "));
}
console.log("\nforms: " + mustThrow.map((m, i) => i + "=" + JSON.stringify(m)).join("  "));

console.log("\nSPEC-SILENT (A = accepts, · = rejects — both defensible, reported only)");
console.log("        " + silent.map((_, i) => String(i).padStart(2)).join(" "));
for (const r of rows) {
  console.log("spec-" + r.id + "  " + r.sl.map(x => (x === "ACCEPT" ? "A" : "·")).map(s => s.padStart(2)).join(" "));
}
console.log("\nsilent forms: " + silent.map((m, i) => i + "=" + JSON.stringify(m)).join("  "));

// Gate check: at least one specimen strict on obvious (idx 2,3,4,7) but leaky on idx0.
console.log("\n=== GATE: strict-on-obvious + leaky-on-subtle('#aabbcg') ? ===");
for (const r of rows) {
  const leaksSubtle = r.mt[0] === "ACCEPT";
  const strictObvious = [2, 3, 4, 7].every(i => r.mt[i] === "THREW");
  console.log(`spec-${r.id}: leaky-on-subtle=${leaksSubtle}  strict-on-obvious=${strictObvious}  ${leaksSubtle && strictObvious ? "<<< TARGET" : ""}`);
}
