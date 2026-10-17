import { Schema } from "effect";

import { CollectionEntry } from "../collection/deck-building";
import { CosmeticId } from "../content/cosmetics";
import { MAX_DECK_SLOTS, STARTING_DECK_SLOTS } from "../content/deck-slots";
import { ForgeStones } from "../content/forge-stones";
import { HEYNSPIRE_FLOORS } from "../content/heynspire";
import { PackId } from "../content/packs";
import { ClassId, DeckEntry, GearLevels } from "../content/schema";
import { STAR_CHESTS } from "../content/star-chests";

/**
 * The shape version of the Profile (technical design 5). A change to the
 * shape, or to the meaning of a saved value, adds 1 and a migration step from
 * the old version.
 */
export const PROFILE_SCHEMA_VERSION = 10;

/** The longest name that the Player can give a Deck. */
export const DECK_NAME_MAX = 24;

/**
 * One saved Deck, with its Hero Class (GDD 5.5). The Player's Hero has the
 * Class of the Active Deck: the Class stays on the slot (ADR-0033).
 */
const DeckSlot = Schema.Struct({
  id: Schema.NonEmptyString,
  /** The name that the Player gave. Empty: the default name. */
  name: Schema.String.check(Schema.isMaxLength(DECK_NAME_MAX)),
  classId: ClassId,
  deck: Schema.Array(DeckEntry),
});
export type DeckSlot = typeof DeckSlot.Type;

export const DeckSlots = Schema.Array(DeckSlot);

/** A random state: one 32-bit integer, as in the Battle (ADR-0006). */
const RandomState = Schema.Number.check(Schema.isInt32());

/** The Pack state of the Player (Economy 3.1). */
const PackState = Schema.Struct({
  /**
   * The Pack Guarantee counter of each Pack: the Packs in a row without a card
   * of the Guarantee Rank or higher. All versions of a Pack share one.
   */
  guaranteeCounters: Schema.Struct({
    peddler: Schema.Natural,
    merchant: Schema.Natural,
    royal: Schema.Natural,
  }),
  /** The random state of the Pack rolls. It moves forward after each Pack. */
  randomState: RandomState,
});
export type PackState = typeof PackState.Type;

/**
 * A Pack that the Player got as a reward and has not opened yet. For the
 * `race` version, the Player selects the Race when the Pack opens.
 */
const UnopenedPack = Schema.Struct({
  pack: PackId,
  version: Schema.Literals(["all", "race"]),
});
export type UnopenedPack = typeof UnopenedPack.Type;

/** The best Stars of a won Stage (GDD 4.11). */
const Stars = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 3 }));

/** The wins of a won Dungeon: 1 or more. */
const DungeonWins = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1));

/**
 * The Heynspire Floors that the Player won: 0 to 50. The Player wins the
 * Floors in order, so this count gives each won Floor.
 */
const FloorsWon = Schema.Int.check(
  Schema.isBetween({ minimum: 0, maximum: HEYNSPIRE_FLOORS })
);

/** The Stars that open a Star chest: the key of a chest in each Region. */
const StarChestStars = Schema.Natural.check(
  Schema.makeFilter((stars: number) =>
    STAR_CHESTS.some((chest) => chest.stars === stars)
  )
);

/** The Tallies of the Player (Achievements 1.5). Each one only goes up. */
const Tallies = Schema.Struct({
  packsOpened: Schema.Natural,
  combines: Schema.Natural,
  crafts: Schema.Natural,
});
export type Tallies = typeof Tallies.Type;

/**
 * All the saved progress of one Player (technical design 5). Settings are not
 * in it: they belong to the device. The Player level is not in it: it comes
 * from the XP (`playerLevelForXp`).
 */
export const Profile = Schema.Struct({
  schemaVersion: Schema.Literal(PROFILE_SCHEMA_VERSION),
  xp: Schema.Natural,
  /** In Copper. */
  coin: Schema.Natural,
  essence: Schema.Natural,
  heynstones: Schema.Natural,
  collection: Schema.Array(CollectionEntry),
  deckSlots: DeckSlots.check(
    Schema.isBetweenLength(STARTING_DECK_SLOTS, MAX_DECK_SLOTS)
  ),
  /** The ID of the Deck Slot that the Stage Panel selects first. */
  activeDeckId: Schema.NonEmptyString,
  gear: GearLevels,
  /** The Forge Stones of each tier that the Player has (ADR-0038). They are earn-only. */
  forgeStones: ForgeStones,
  /** The best Stars of each won Stage, by Stage ID. Stage 1-1 here: the Tutorial is won. */
  stageResults: Schema.Record(Schema.String, Stars),
  /** The win count of each won Dungeon, by Dungeon ID. A Dungeon gives no Stars. */
  dungeonResults: Schema.Record(Schema.String, DungeonWins),
  /**
   * The Heynspire Floors that the Player won, from Floor 1. The Current Floor
   * is the next Floor (`currentFloor`).
   */
  heynspireFloorsWon: FloorsWon,
  /** The Star chests that the Player claimed: their Stars, by Region number. */
  claimedStarChests: Schema.Record(Schema.String, Schema.Array(StarChestStars)),
  packState: PackState,
  unopenedPacks: Schema.Array(UnopenedPack),
  /** The Campaign Sweep Tickets that the Player has (ADR-0035). They are earn-only. */
  campaignSweepTickets: Schema.Natural,
  /** The Dungeon Sweep Tickets that the Player has (ADR-0041). They are earn-only. */
  dungeonSweepTickets: Schema.Natural,
  /**
   * The random state of the reward rolls, for example the repeat-win card. It
   * is not the Pack random state, so a Pack does not change a reward.
   */
  rewardRandomState: RandomState,
  /** The IDs of the Hints that the Player has seen. Hints are a web term. */
  seenHints: Schema.Array(Schema.String),
  /**
   * The IDs of the Completed Achievements, in the order that the Player
   * completed them (Achievements 1.1). An ID stays, also when the goal is no
   * longer met.
   */
  completedAchievements: Schema.Array(Schema.String),
  /**
   * The IDs of the Claimed Achievements. A Claimed Achievement with an
   * earn-only Cosmetic is a Cosmetic that the Player is owed until Cosmetics
   * exist (Achievements 1.6).
   */
  claimedAchievements: Schema.Array(Schema.String),
  /**
   * The IDs of the Cosmetics that the Player owns, bought in the Bazaar or
   * earned from play (Economy 3.5, ADR-0008). A Cosmetic is permanent: the
   * Player never sells or loses one.
   */
  cosmetics: Schema.Array(CosmeticId),
  tallies: Tallies,
});
export type Profile = typeof Profile.Type;
