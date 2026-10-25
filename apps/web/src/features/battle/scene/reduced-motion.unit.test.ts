import { afterEach, describe, expect, it } from "vitest";

import {
  prefersReducedMotion,
  setReducedMotionPreference,
} from "@/features/battle/scene/reduced-motion";

/** A `prefers-reduced-motion` query whose answer the test controls. */
const stubSystem = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches }),
  });
};

describe("prefersReducedMotion", () => {
  afterEach(() => {
    setReducedMotionPreference(false);
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("follows the operating system", () => {
    stubSystem(true);
    expect(prefersReducedMotion()).toBe(true);
    stubSystem(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("follows the Player choice", () => {
    stubSystem(false);
    setReducedMotionPreference(true);
    expect(prefersReducedMotion()).toBe(true);
    setReducedMotionPreference(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("is false when there is no media query", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
