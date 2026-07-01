// diff-constraint observation producer: does the candidate add a runtime
// dependency vs the baseline? Prints "true" (a dep was added) or "false".
// This is a STRUCTURAL/architectural check on the change, not a runtime
// behaviour — no functional test can produce this observation.
//
// Usage: node check-no-new-dep.mjs <baseline-dir> <candidate-dir>  → "true"|"false"
import { readFileSync } from "node:fs";
import { join } from "node:path";

const deps = (dir) => Object.keys(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).dependencies ?? {});
const base = new Set(deps(process.argv[2]));
const added = deps(process.argv[3]).filter((d) => !base.has(d));
process.stdout.write(added.length > 0 ? "true" : "false");
