import { afterEach, describe, expect, it, vi } from "vitest";

import {
  qaEnabled,
  qaSeed,
  seedFromSearch,
  stateFromSearch,
} from "@/features/battle/qa";

/** Sets `location.search`, or removes `location` (Node has none). */
const setLocation = (search: string | null) => {
  if (search === null) {
    Reflect.deleteProperty(globalThis, "location");
    return;
  }
  Object.defineProperty(globalThis, "location", {
    value: { search },
    configurable: true,
    writable: true,
  });
};

afterEach(() => {
  setLocation(null);
  vi.unstubAllEnvs();
});

/** A production build that is not an E2E build. */
const production = () => {
  vi.stubEnv("DEV", false);
  vi.stubEnv("VITE_E2E", "false");
};

describe("seedFromSearch", () => {
  it("reads a positive whole seed", () => {
    expect(seedFromSearch("?seed=42")).toBe(42);
    expect(seedFromSearch("?qa&seed=7")).toBe(7);
  });

  it("ignores a missing, zero, negative or broken seed", () => {
    expect(seedFromSearch("")).toBeNull();
    expect(seedFromSearch("?seed=0")).toBeNull();
    expect(seedFromSearch("?seed=-3")).toBeNull();
    expect(seedFromSearch("?seed=1.5")).toBeNull();
    expect(seedFromSearch("?seed=abc")).toBeNull();
  });
});

describe("qaEnabled and qaSeed", () => {
  it("are on in development", () => {
    vi.stubEnv("DEV", true);
    setLocation("?seed=9");
    expect(qaEnabled()).toBe(true);
    expect(qaSeed()).toBe(9);
  });

  it("are on in an E2E build", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_E2E", "true");
    expect(qaEnabled()).toBe(true);
  });

  it("are on in production only with ?qa", () => {
    production();
    setLocation("?qa&seed=3");
    expect(qaEnabled()).toBe(true);
    expect(qaSeed()).toBe(3);
    setLocation("?seed=3");
    expect(qaEnabled()).toBe(false);
    expect(qaSeed()).toBeNull();
  });

  it("are off with no location", () => {
    production();
    setLocation(null);
    expect(qaEnabled()).toBe(false);
    expect(qaSeed()).toBeNull();
  });

  it("give no seed without a location, even in development", () => {
    vi.stubEnv("DEV", true);
    setLocation(null);
    expect(qaSeed()).toBeNull();
  });
});

describe("stateFromSearch", () => {
  it("reads the QA state to open from the URL query", () => {
    expect(stateFromSearch("?qa&state=victory")).toBe("victory");
    expect(stateFromSearch("?qa")).toBeNull();
  });
});
