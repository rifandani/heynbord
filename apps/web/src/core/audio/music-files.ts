import type { MusicTrack } from "@/core/audio/music-catalog";

export const TRACK_FILES: Readonly<Record<MusicTrack, string>> = {
  town: "town.ogg",
  "region-1": "region-1.ogg",
  "region-2": "region-2.ogg",
  "region-3": "region-3.ogg",
  "region-4": "region-4.mp3",
  "region-5": "region-5.mp3",
  boss: "boss.ogg",
  heynspire: "heynspire.ogg",
  dungeons: "dungeons.ogg",
  workshop: "workshop.mp3",
  packs: "packs.ogg",
  bazaar: "bazaar.mp3",
  seaport: "seaport.ogg",
  hero: "hero.mp3",
  achievements: "achievements.mp3",
};

export const STING_FILES = {
  victory: "victory.ogg",
  defeat: "defeat.ogg",
} as const;

/** The URL of one music file, under the Vite base path. */
export const musicUrl = (baseUrl: string, file: string): string =>
  `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}music/${file}`;
