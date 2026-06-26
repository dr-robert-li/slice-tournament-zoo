/**
 * Single version-identity seam (F19 update pathway).
 *
 * One place owns "what version am I, what package am I, what npm endpoint do I
 * check". Every other module imports from here rather than re-typing a literal.
 * Two hard-won lessons from prior-art update mechanisms are baked in:
 *
 *  - The **package name is a code constant**, never an LLM/runtime free choice.
 *    A model-driven update path that "decides" the npm name at execution time
 *    mistypes it (`@stz/cli`, `slice-tournament`, a typosquat) and queries the
 *    wrong package. Pinning it here closes that gap.
 *  - The **CLI version is read from package.json**, never hardcoded into a `.ts`
 *    string, so a release bump can never leave the reported version stale.
 *
 * `SCHEMA_VERSION` is independent of the package version: it tracks the shape of
 * the on-disk `.stz/` taxonomy and only bumps when the tier layout changes, so
 * `stz migrate` knows whether an existing project tree needs additive upgrade.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** The npm package name. A code constant — see file header. */
export const PACKAGE_NAME = "slice-tournament-zoo";

/**
 * Schema version of the `.stz/` taxonomy tree. Bump when `TIERS` (or the
 * manifest shape) changes so `stz migrate` can detect an out-of-date project.
 */
export const SCHEMA_VERSION = 2;

/** Read the package version from the shipped package.json (never hardcoded). */
function readPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/version.ts -> ../package.json. npm always ships package.json, and the
  // source-available repo has it at the root, so this resolves in both modes.
  const pkgPath = join(here, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
  if (!pkg.version) throw new Error(`package.json at ${pkgPath} has no version`);
  return pkg.version;
}

/** The installed STZ version, sourced from package.json. */
export const STZ_VERSION = readPackageVersion();

/** The npm registry endpoint that resolves the latest published version. */
export function registryLatestUrl(pkg: string = PACKAGE_NAME): string {
  // The `latest` dist-tag document is small and CORS-free; `.version` is the
  // published latest. Encode the name defensively though it is a constant.
  return `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`;
}
