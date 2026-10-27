export type MusicTrack =
  | "town"
  | "region-1"
  | "region-2"
  | "region-3"
  | "region-4"
  | "region-5"
  | "boss"
  | "heynspire"
  | "dungeons"
  | "workshop"
  | "packs"
  | "bazaar"
  | "seaport"
  | "hero"
  | "achievements";

export type MusicFeature =
  | "heynspire"
  | "dungeons"
  | "workshop"
  | "packs"
  | "bazaar"
  | "seaport"
  | "hero"
  | "achievements";

/** Selects the looping music for the current screen or Battle. */
export const musicTrackFor = (
  stage: { readonly region: number; readonly boss: boolean } | null,
  inBattle: boolean,
  feature: MusicFeature | null = null
): MusicTrack => {
  if (feature) {
    return feature;
  }
  if (!inBattle) {
    return "town";
  }
  if (!stage || stage.boss) {
    return "boss";
  }
  const region = Math.min(Math.max(stage.region, 1), 5);
  // SAFETY: region is clamped to 1..5, so the id is one of the region tracks.
  return `region-${region}` as MusicTrack;
};
