import { BAZAAR_COSMETICS } from "@workspace/rules";
import { describe, expect, it, vi } from "vitest";

import {
  heroModelUrl,
  makeAppearanceCache,
} from "@/features/hero/hero-model-assets";

describe("heroModelUrl", () => {
  it("gives each of the 56 catalog combinations a distinct path", () => {
    const people = [
      null,
      ...BAZAAR_COSMETICS.filter((item) => item.family === "heroPortrait").map(
        (item) => item.id
      ),
    ];
    const gear = [
      null,
      ...BAZAAR_COSMETICS.filter((item) => item.family === "gearLook").map(
        (item) => item.id
      ),
    ];
    const urls = people.flatMap((portrait) =>
      gear.map((gearLook) => heroModelUrl({ portrait, gearLook }))
    );
    expect(people).toHaveLength(8);
    expect(gear).toHaveLength(7);
    expect(new Set(urls).size).toBe(56);
  });
  it("keeps the two families separate and uses Standard for a wrong family", () => {
    expect(
      heroModelUrl({
        portrait: "heroPortrait.tentRings",
        gearLook: "gearLook.goldInlay",
      })
    ).toBe("/models/heroes/tent-rings-gold-inlay.glb");
    expect(
      heroModelUrl({
        portrait: "gearLook.goldInlay",
        gearLook: "heroPortrait.tentRings",
      })
    ).toBe("/models/heroes/standard-standard.glb");
  });
});

describe("makeAppearanceCache", () => {
  it("shares concurrent and successful loads, and retries a failure", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue("model");
    const get = makeAppearanceCache(load);
    const failed = get("one");
    expect(get("one")).toBe(failed);
    await expect(failed).rejects.toThrow("offline");
    await expect(get("one")).resolves.toBe("model");
    await expect(get("one")).resolves.toBe("model");
    expect(load).toHaveBeenCalledTimes(2);
    await get("two");
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("keeps the eight most recently used appearances", async () => {
    const load = vi.fn().mockResolvedValue("model");
    const get = makeAppearanceCache(load);
    await Promise.all(
      Array.from({ length: 8 }, (_, index) => get(`model-${index}`))
    );
    await get("model-0");
    expect(load).toHaveBeenCalledTimes(8);
    await get("model-8");
    await get("model-1");
    expect(load).toHaveBeenCalledTimes(10);
  });
});
