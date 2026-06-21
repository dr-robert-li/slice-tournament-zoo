import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  STZ_VERSION,
  PACKAGE_NAME,
  SCHEMA_VERSION,
  registryLatestUrl,
} from "../src/version.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
function readJson(rel: string): any {
  return JSON.parse(readFileSync(join(repoRoot, rel), "utf8"));
}

describe("version identity seam (F19)", () => {
  it("reports the version from package.json, never a hardcoded literal", () => {
    expect(STZ_VERSION).toBe(readJson("package.json").version);
  });

  it("pins the package name as a code constant", () => {
    expect(PACKAGE_NAME).toBe("slice-tournament-zoo");
    expect(readJson("package.json").name).toBe(PACKAGE_NAME);
  });

  it("exposes a positive-integer schema version", () => {
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });

  it("builds the registry endpoint from the package name", () => {
    expect(registryLatestUrl()).toBe(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
    );
  });
});

describe("version drift guard — all manifests agree (the bug F19 fixes)", () => {
  // The 0.5.6/0.5.7 drift between package.json and the plugin manifests is
  // exactly the failure this guard prevents from recurring.
  it("package.json, plugin.json, and marketplace.json share one version", () => {
    const pkg = readJson("package.json").version;
    const plugin = readJson(".claude-plugin/plugin.json").version;
    const market = readJson(".claude-plugin/marketplace.json");
    expect(plugin).toBe(pkg);
    expect(market.metadata.version).toBe(pkg);
    const stzEntry = market.plugins.find((p: any) => p.name === "stz");
    expect(stzEntry.version).toBe(pkg);
  });
});
