import { describe, it, expect } from "vitest";
import {
  parseSemver,
  compareSemver,
  buildVerdict,
  checkLatest,
  formatVerdict,
  type FetchLike,
} from "../src/update.js";
import { PACKAGE_NAME } from "../src/version.js";

describe("semver compare (the subset STZ uses)", () => {
  it("parses and rejects", () => {
    expect(parseSemver("1.2.3")).toMatchObject({ major: 1, minor: 2, patch: 3 });
    expect(() => parseSemver("not-a-version")).toThrow();
    expect(() => parseSemver("1.2")).toThrow();
  });

  it("orders by major/minor/patch", () => {
    expect(compareSemver("0.5.7", "0.6.0")).toBe(-1);
    expect(compareSemver("0.6.0", "0.5.7")).toBe(1);
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
    expect(compareSemver("0.5.10", "0.5.9")).toBe(1); // numeric, not lexical
  });

  it("ranks a pre-release below its release", () => {
    expect(compareSemver("1.0.0-rc.1", "1.0.0")).toBe(-1);
    expect(compareSemver("1.0.0", "1.0.0-rc.1")).toBe(1);
    expect(compareSemver("1.0.0-rc.1", "1.0.0-rc.2")).toBe(-1);
    expect(compareSemver("1.0.0-rc.2", "1.0.0-rc.10")).toBe(-1); // numeric pre ids
  });
});

describe("buildVerdict — pure remediation logic", () => {
  it("flags a stale install and prescribes both channels", () => {
    const v = buildVerdict({ installed: "0.5.7", latest: "0.6.0" });
    expect(v.stale).toBe(true);
    expect(v.ahead).toBe(false);
    expect(v.commands).toEqual([
      `npm i -g ${PACKAGE_NAME}@latest`,
      "/plugin update stz",
    ]);
  });

  it("is silent when up to date", () => {
    const v = buildVerdict({ installed: "0.6.0", latest: "0.6.0" });
    expect(v.stale).toBe(false);
    expect(v.commands).toEqual([]);
  });

  it("recognizes a local build ahead of npm latest", () => {
    const v = buildVerdict({ installed: "0.7.0", latest: "0.6.0" });
    expect(v.ahead).toBe(true);
    expect(v.stale).toBe(false);
    expect(v.commands).toEqual([]);
  });

  it("detects plugin/CLI drift even when not stale", () => {
    const v = buildVerdict({ installed: "0.6.0", latest: "0.6.0", pluginVersion: "0.5.6" });
    expect(v.drift).toBe(true);
    expect(v.commands).toEqual(["/plugin update stz"]);
  });

  it("passes a check failure reason through with null latest", () => {
    const v = buildVerdict({ installed: "0.6.0", latest: null, reason: "network_error" });
    expect(v.latest).toBeNull();
    expect(v.stale).toBe(false);
    expect(v.reason).toBe("network_error");
    expect(v.commands).toEqual([]);
  });
});

// A tiny fake registry response matching the injectable FetchLike shape.
function fakeFetch(body: unknown, init: { ok?: boolean; status?: number; throwErr?: boolean; badJson?: boolean } = {}): FetchLike {
  return async () => {
    if (init.throwErr) throw new Error("offline");
    return {
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => {
        if (init.badJson) throw new Error("bad json");
        return body;
      },
    };
  };
}

describe("checkLatest — injectable fetch, never crashes", () => {
  it("returns the published version on success", async () => {
    const r = await checkLatest(fakeFetch({ version: "0.6.0" }));
    expect(r).toEqual({ ok: true, version: "0.6.0", reason: "ok" });
  });

  it("reports an http error reason on non-200", async () => {
    const r = await checkLatest(fakeFetch({}, { ok: false, status: 503 }));
    expect(r).toEqual({ ok: false, version: null, reason: "http_503" });
  });

  it("reports network_error when fetch throws", async () => {
    const r = await checkLatest(fakeFetch({}, { throwErr: true }));
    expect(r).toMatchObject({ ok: false, reason: "network_error" });
  });

  it("reports invalid_json on a malformed body", async () => {
    const r = await checkLatest(fakeFetch({}, { badJson: true }));
    expect(r).toMatchObject({ ok: false, reason: "invalid_json" });
  });

  it("reports missing_version_field when the field is absent", async () => {
    const r = await checkLatest(fakeFetch({ name: "x" }));
    expect(r).toMatchObject({ ok: false, reason: "missing_version_field" });
  });

  it("reports unparseable_version on a non-semver value", async () => {
    const r = await checkLatest(fakeFetch({ version: "latest" }));
    expect(r).toMatchObject({ ok: false, reason: "unparseable_version" });
  });

  it("degrades to no_fetch_available without a fetch impl", async () => {
    const r = await checkLatest(null as unknown as FetchLike);
    expect(r).toMatchObject({ ok: false, reason: "no_fetch_available" });
  });
});

describe("formatVerdict — human output", () => {
  it("renders an update-available block with commands", () => {
    const text = formatVerdict(buildVerdict({ installed: "0.5.7", latest: "0.6.0" }));
    expect(text).toContain("Update available: 0.6.0");
    expect(text).toContain(`npm i -g ${PACKAGE_NAME}@latest`);
  });

  it("renders a couldn't-check block when latest is null", () => {
    const text = formatVerdict(buildVerdict({ installed: "0.6.0", latest: null, reason: "network_error" }));
    expect(text).toContain("Couldn't check");
    expect(text).toContain("network_error");
  });

  it("warns on drift", () => {
    const text = formatVerdict(buildVerdict({ installed: "0.6.0", latest: "0.6.0", pluginVersion: "0.5.6" }));
    expect(text).toContain("Channel drift");
  });
});
