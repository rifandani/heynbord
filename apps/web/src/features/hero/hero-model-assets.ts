import type { CosmeticId } from "@workspace/rules";

import type { HeroAppearance } from "@/features/battle/battle-session";

const PEOPLE: Partial<Record<CosmeticId, string>> = {
  "heroPortrait.dawnGaze": "dawn-gaze",
  "heroPortrait.verdantCrest": "verdant-crest",
  "heroPortrait.mesaShade": "mesa-shade",
  "heroPortrait.saltWind": "salt-wind",
  "heroPortrait.lanternKeeper": "lantern-keeper",
  "heroPortrait.tentRings": "tent-rings",
  "heroPortrait.goldCrest": "gold-crest",
};

const GEAR: Partial<Record<CosmeticId, string>> = {
  "gearLook.copperRim": "copper-rim",
  "gearLook.ironVine": "iron-vine",
  "gearLook.stagLeather": "stag-leather",
  "gearLook.goldInlay": "gold-inlay",
  "gearLook.moonstone": "moonstone",
  "gearLook.royalPlate": "royal-plate",
};

/** The one complete GLB for this appearance. Unknown IDs use Standard. */
export const heroModelUrl = ({
  portrait,
  gearLook,
}: HeroAppearance): string => {
  const person =
    portrait === null ? "standard" : (PEOPLE[portrait] ?? "standard");
  const gear = gearLook === null ? "standard" : (GEAR[gearLook] ?? "standard");
  return `/models/heroes/${person}-${gear}.glb`;
};

/** Keep enough appearances for the Battle, the Hero screen and Bazaar browsing. */
const MAX_CACHED_APPEARANCES = 8;

/** Cache successful and in-flight loads. A failed load can be retried. */
export const makeAppearanceCache = <Model>(
  load: (url: string) => Promise<Model>
) => {
  const entries = new Map<string, Promise<Model>>();
  return (url: string): Promise<Model> => {
    const cached = entries.get(url);
    if (cached) {
      entries.delete(url);
      entries.set(url, cached);
      return cached;
    }
    const pending = (async () => {
      // Defer the load so even a synchronous failure sees the cache entry.
      await Promise.resolve();
      try {
        return await load(url);
      } catch (error) {
        entries.delete(url);
        throw error;
      }
    })();
    entries.set(url, pending);
    if (entries.size > MAX_CACHED_APPEARANCES) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) {
        entries.delete(oldest);
      }
    }
    return pending;
  };
};
