import { starterCollection } from "../collection/deck-building";
import { NO_FORGE_STONES } from "../content/forge-stones";
import { nextRandom, seedState } from "../random";
import { INITIAL_DECK_SLOTS } from "./deck-slots";
import { newPackState } from "./packs";
import { PROFILE_SCHEMA_VERSION } from "./schema";
import type { Profile, Tallies } from "./schema";
import { AT_BERTH } from "./seaport";

/** The Tallies of a new Player: all 0. */
export const NO_TALLIES: Tallies = {
  packsOpened: 0,
  combines: 0,
  crafts: 0,
  fuses: 0,
};

/**
 * The Profile of a new Player: XP 0, no balances, the Starter Collection and
 * the Starter Decks, Gear 0, and no Forge Stones, Stage results, Dungeon
 * results, won Floors, Star chests, Unopened Packs, Sweep Tickets of the 2
 * types or Achievements, all Tallies at 0, and the Seaport ship at its
 * berth. Both
 * random states come from the seed, so the same seed gives the same Profile.
 */
export const newProfile = (seed: number): Profile => ({
  schemaVersion: PROFILE_SCHEMA_VERSION,
  xp: 0,
  coin: 0,
  essence: 0,
  heynstones: 0,
  collection: starterCollection(),
  deckSlots: INITIAL_DECK_SLOTS,
  activeDeckId: INITIAL_DECK_SLOTS[0].id,
  gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
  forgeStones: NO_FORGE_STONES,
  stageResults: {},
  dungeonResults: {},
  heynspireFloorsWon: 0,
  claimedStarChests: {},
  packState: newPackState(seed),
  unopenedPacks: [],
  campaignSweepTickets: 0,
  dungeonSweepTickets: 0,
  // The first value of the seed, so that the two random states differ.
  rewardRandomState: seedState(nextRandom(seedState(seed))[0]),
  seenHints: [],
  seenStoryScenes: [],
  completedAchievements: [],
  claimedAchievements: [],
  cosmetics: [],
  activeCosmetics: {},
  tallies: NO_TALLIES,
  seaport: AT_BERTH,
});
