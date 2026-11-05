import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadBattleImage,
  makeImageCache,
  preloadStageBattle,
  stagePreloadUrls,
  waitForImage,
} from "@/features/battle/battle-preload";
import { FX_ATLAS_URL } from "@/features/battle/scene/fx-slots";

/** A browser image that decodes everything except one broken painting. */
const decodeFile = (src: string): Promise<void> =>
  src === "/battle/hearthvale.webp"
    ? Promise.reject(new Error("offline"))
    : Promise.resolve();

/** How the file load of a `FakeImage` ends, and how its decode ends. */
let fileEnd: "load" | "error" = "load";
let decodeImage = vi.fn(decodeFile);

class FakeImage {
  public decoding = "";
  public naturalWidth = 1536;
  public naturalHeight = 1024;
  private file = "";
  private readonly listeners = new Map<string, () => void>();

  public addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, listener);
  }

  public get src(): string {
    return this.file;
  }

  public set src(url: string) {
    this.file = url;
    this.listeners.get(fileEnd)?.();
  }

  public decode(): Promise<void> {
    return decodeImage(this.src);
  }
}

afterEach(() => {
  fileEnd = "load";
  decodeImage = vi.fn(decodeFile);
  vi.useRealTimers();
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

describe("waitForImage", () => {
  const URL = "/battle/hollow-marches.webp";

  it("decodes the image after its file loads", async () => {
    vi.stubGlobal("Image", FakeImage);
    await waitForImage(URL, 1000);
    expect(decodeImage).toHaveBeenCalledExactlyOnceWith(URL);
  });

  it("resolves with no decode when the file fails", async () => {
    vi.stubGlobal("Image", FakeImage);
    fileEnd = "error";
    await expect(waitForImage(URL, 1000)).resolves.toBeUndefined();
    expect(decodeImage).not.toHaveBeenCalled();
  });

  it("resolves when the decode fails", async () => {
    vi.stubGlobal("Image", FakeImage);
    decodeImage = vi.fn(() => Promise.reject(new Error("corrupt")));
    await expect(waitForImage(URL, 1000)).resolves.toBeUndefined();
    expect(decodeImage).toHaveBeenCalledOnce();
  });

  it("stops at the time limit when a hidden page holds the decode back", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Image", FakeImage);
    decodeImage = vi.fn(() => Promise.withResolvers<undefined>().promise);
    const ended = vi.fn();
    const wait = waitForImage(URL, 500).then(ended);
    await vi.advanceTimersByTimeAsync(499);
    expect(ended).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await wait;
    expect(ended).toHaveBeenCalledOnce();
  });
});
