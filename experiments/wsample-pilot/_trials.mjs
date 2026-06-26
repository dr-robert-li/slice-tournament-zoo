// Shared helpers for the weightedSample suites: a seeded PRNG and a monkeypatch that
// installs it as globalThis.Math.random BEFORE the specimen is imported, so every impl
// is graded on the SAME deterministic stream (fair + N6-replayable). Built-ins only.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Install a seeded stream as Math.random, then import the specimen (so even a top-level
// `const rand = Math.random` capture binds to the seeded stream).
export async function loadWithSeed(implPath, seed) {
  globalThis.Math.random = mulberry32(seed);
  const mod = await import(implPath);
  return mod.weightedSample;
}

export function relCloseAbs(got, exp, tol) {
  return typeof got === "number" && Number.isFinite(got) && Math.abs(got - exp) <= tol;
}
