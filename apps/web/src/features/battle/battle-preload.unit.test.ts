import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadBattleImage,
  makeImageCache,
  preloadStageBattle,
  stagePreloadUrls,
} from "@/features/battle/battle-preload";
import { FX_ATLAS_URL } from "@/features/battle/scene/fx-slots";

/** A browser image that decodes everything except one broken painting. */
class FakeImage {
  public decoding = "";
  public src = "";
  public naturalWidth = 1536;
  public naturalHeight = 1024;

  public decode(): Promise<void> {
    return this.src === "/battle/hearthvale.webp"
      ? Promise.reject(new Error("offline"))
      : Promise.resolve();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Battle image preload", () => {
  it("preloads the selected Region painting and the shared FX atlas", () => {
    expect(stagePreloadUrls(5)).toEqual([
      "/battle/hollow-marches.webp",
      FX_ATLAS_URL,
    ]);
    expect(stagePreloadUrls(1)).toEqual([
      "/battle/hearthvale.webp",
      FX_ATLAS_URL,
    ]);
  });

  it("reuses in-flight and decoded images and retries a failed request", async () => {
    const requested: string[] = [];
    let fails = true;
    const load = makeImageCache((url: string) => {
      requested.push(url);
      return fails
        ? Promise.reject(new Error("network"))
        : Promise.resolve({ url });
    });
    const first = load("/fx.webp");
    expect(load("/fx.webp")).toBe(first);
    await expect(first).rejects.toThrow("network");
    fails = false;
    const second = load("/fx.webp");
    await expect(second).resolves.toEqual({ url: "/fx.webp" });
    expect(load("/fx.webp")).toBe(second);
    expect(requested).toEqual(["/fx.webp", "/fx.webp"]);
  });

  it("decodes the image URL and keeps a failed preload silent", async () => {
    vi.stubGlobal("Image", FakeImage);
    preloadStageBattle(1);
    // The atlas loads, and the broken painting can be requested again.
    await expect(loadBattleImage(FX_ATLAS_URL)).resolves.toBeInstanceOf(
      FakeImage
    );
    await expect(loadBattleImage("/battle/hearthvale.webp")).rejects.toThrow(
      "offline"
    );
  });
});
