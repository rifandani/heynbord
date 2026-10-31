import { battlePaintingFor } from "@/features/battle/battle-painting";
import { FX_ATLAS_URL } from "@/features/battle/scene/fx-slots";

/** Failed requests are removed so Fight can try again. */
export const makeImageCache = <Image>(
  load: (url: string) => Promise<Image>
) => {
  const images = new Map<string, Promise<Image>>();
  const request = async (url: string): Promise<Image> => {
    // Register the pending promise before a loader can fail synchronously.
    await Promise.resolve();
    try {
      return await load(url);
    } catch (error) {
      images.delete(url);
      throw error;
    }
  };
  return (url: string): Promise<Image> => {
    const existing = images.get(url);
    if (existing) {
      return existing;
    }
    const pending = request(url);
    images.set(url, pending);
    return pending;
  };
};

/** Shared by Stage Panel preload and the effects renderer. */
export const loadBattleImage = makeImageCache(async (url: string) => {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return image;
});

export const stagePreloadUrls = (region: number): readonly string[] => {
  const painting = battlePaintingFor(region);
  /* v8 ignore next -- @preserve -- Region 1 always has a painting, so the fallback keeps the preload list total */
  return painting ? [painting, FX_ATLAS_URL] : [FX_ATLAS_URL];
};

const preloadBattleImage = async (url: string): Promise<void> => {
  try {
    await loadBattleImage(url);
  } catch {
    // A failed preload is silent: Fight asks again and the Stage Panel stays usable.
  }
};

/** Starts both requests without delaying the Stage Panel or Fight. */
export const preloadStageBattle = (region: number): void => {
  for (const url of stagePreloadUrls(region)) {
    void preloadBattleImage(url);
  }
};
