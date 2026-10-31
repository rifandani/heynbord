import { AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import {
  HERO_MODELS_ENABLED,
  heroModelsEnabled,
} from "@/features/hero/hero-model-feature";
import {
  heroModelFailureAtom,
  heroModelRetryAtom,
} from "@/features/hero/hero-model.atoms";

describe("Hero Model feature", () => {
  it("stays off unless the release flag or the development preview turns it on", () => {
    expect(HERO_MODELS_ENABLED).toBe(
      heroModelsEnabled({
        release: import.meta.env.VITE_HERO_MODELS,
        dev: import.meta.env.DEV,
        preview: import.meta.env.VITE_HERO_MODEL_PREVIEW,
      })
    );
    expect(HERO_MODELS_ENABLED).toBe(false);
  });

  it("enables the reviewed release and the local draft only", () => {
    expect(
      heroModelsEnabled({ release: "1", dev: false, preview: undefined })
    ).toBe(true);
    expect(
      heroModelsEnabled({ release: undefined, dev: true, preview: "1" })
    ).toBe(true);
    expect(
      heroModelsEnabled({ release: undefined, dev: false, preview: "1" })
    ).toBe(false);
    expect(
      heroModelsEnabled({ release: undefined, dev: true, preview: undefined })
    ).toBe(false);
  });

  it("starts at the first attempt with no recorded failure", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(heroModelRetryAtom)).toBe(0);
    expect(registry.get(heroModelFailureAtom)).toBeNull();
  });
});
