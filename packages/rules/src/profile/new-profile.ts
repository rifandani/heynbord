import { starterCollection } from "../collection/deck-building";
import { NO_FORGE_STONES } from "../content/forge-stones";
import { nextRandom, seedState } from "../random";
import { INITIAL_DECK_SLOTS } from "./deck-slots";
import { newPackState } from "./packs";
import { PROFILE_SCHEMA_VERSION } from "./schema";
import type { Profile } from "./schema";

/**
 * The Profile of a new Player: XP 0, no balances, the Starter Collection and
 * the Starter Decks, Gear 0, and no Forge Stones, Stage results, Star
 * chests, Unopened Packs or Sweep Tickets. Both random states come from the
 * seed, so the same seed gives the same Profile.
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
  claimedStarChests: {},
  packState: newPackState(seed),
  unopenedPacks: [],
  sweepTickets: 0,
  // The first value of the seed, so that the two random states differ.
  rewardRandomState: seedState(nextRandom(seedState(seed))[0]),
  seenHints: [],
});
