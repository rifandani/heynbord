import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import {
  heroModelFailureAtom,
  heroModelRetryAtom,
} from "@/features/hero/hero-model.atoms";

describe("Hero Model atoms", () => {
  it("starts at the first attempt with no recorded failure", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(heroModelRetryAtom)).toBe(0);
    expect(registry.get(heroModelFailureAtom)).toBeNull();
  });
});
