import { Schema } from "effect";

/**
 * Schemas for content data (ADR-0006, amendment): cards, Decks and Stages.
 * The content files are typed TypeScript, and a content test decodes them
 * with these schemas, so a bad value fails the test suite.
 */

const RankId = Schema.Literals([
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
]);
export type RankId = typeof RankId.Type;

const RaceId = Schema.Literals(["human", "elf", "undead", "orc"]);
export type RaceId = typeof RaceId.Type;

const ClassId = Schema.Literals(["warrior", "ranger", "mage", "priest"]);
export type ClassId = typeof ClassId.Type;

const DamageType = Schema.Literals(["physical", "fire", "frost", "holy"]);
export type DamageType = typeof DamageType.Type;

const UnitRole = Schema.Literals([
  "frontliner",
  "striker",
  "runner",
  "shooter",
  "support",
  "wall",
]);
export type UnitRole = typeof UnitRole.Type;

const between = (minimum: number, maximum: number) =>
  Schema.Int.check(Schema.isBetween({ minimum, maximum }));

const KeywordValue = between(1, 10);

/** The v1 Keywords of the Battle slice (GDD 5.4, roadmap M1). */
const Keywords = Schema.Struct({
  armor: Schema.optionalKey(KeywordValue),
  charge: Schema.optionalKey(Schema.Literal(true)),
  flying: Schema.optionalKey(Schema.Literal(true)),
  heroic: Schema.optionalKey(KeywordValue),
  /** Deals this much damage to the nearest enemy Unit ahead when this Unit leaves. */
  lastBreath: Schema.optionalKey(KeywordValue),
  /** Melee only (GDD 4.6). A content test checks it. */
  pivot: Schema.optionalKey(Schema.Literal(true)),
  poison: Schema.optionalKey(Schema.Literal(true)),
  regeneration: Schema.optionalKey(KeywordValue),
  retaliation: Schema.optionalKey(Schema.Literal(true)),
});
export type Keywords = typeof Keywords.Type;

const CreatureCardDefinition = Schema.Struct({
  kind: Schema.Literal("creature"),
  id: Schema.NonEmptyString,
  race: RaceId,
  role: UnitRole,
  baseRank: RankId,
  countdown: between(1, 6),
  attack: between(0, 12),
  hp: between(1, 30),
  speed: between(0, 4),
  /** 0 is a melee Unit. 2 to 5 is a ranged Unit with that Range. */
  range: between(0, 5),
  damageType: DamageType,
  keywords: Keywords,
});
export type CreatureCardDefinition = typeof CreatureCardDefinition.Type;

const Amount = between(1, 30);

/** Effect templates (technical design 3.5). The UI makes the card text from the same data. */
const SkillEffect = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("damageUnit"),
    amount: Amount,
    damageType: DamageType,
  }),
  Schema.Struct({
    type: Schema.Literal("damageArea"),
    amount: Amount,
    damageType: DamageType,
    /** The area starts at the target Square and goes this many Squares toward the enemy Hero. */
    length: between(1, 4),
  }),
  Schema.Struct({
    type: Schema.Literal("damageLane"),
    amount: Amount,
    damageType: DamageType,
  }),
  Schema.Struct({
    type: Schema.Literal("laneArmor"),
    armor: between(1, 5),
    turns: between(1, 5),
  }),
  Schema.Struct({
    /** Lowers the Countdown of random cards in the caster's Hand that are not Ready. */
    type: Schema.Literal("lowerCountdown"),
    cards: between(1, 8),
    amount: between(1, 3),
  }),
]);
export type SkillEffect = typeof SkillEffect.Type;

const SkillTarget = Schema.Literals([
  "enemyUnit",
  "enemyLane",
  "friendlyLane",
  "none",
]);
export type SkillTarget = typeof SkillTarget.Type;

const SkillCardDefinition = Schema.Struct({
  kind: Schema.Literal("skill"),
  id: Schema.NonEmptyString,
  class: ClassId,
  baseRank: RankId,
  countdown: between(1, 6),
  target: SkillTarget,
  effect: SkillEffect,
});
export type SkillCardDefinition = typeof SkillCardDefinition.Type;

export const CardDefinition = Schema.Union([
  CreatureCardDefinition,
  SkillCardDefinition,
]);
export type CardDefinition = typeof CardDefinition.Type;

/** One Card copy in a Deck. */
const DeckEntry = Schema.Struct({
  cardId: Schema.NonEmptyString,
  rank: RankId,
});
export type DeckEntry = typeof DeckEntry.Type;

/** Gear levels 0 to 10 for the 4 slots (GDD 7.3). */
const GearLevels = Schema.Struct({
  weapon: between(0, 10),
  armor: between(0, 10),
  trinket: between(0, 10),
  banner: between(0, 10),
});
export type GearLevels = typeof GearLevels.Type;

/** A Lane index of a Stage: 0 to 2 (ADR-0010). */
const StageLane = between(0, 2);

const StartUnit = Schema.Struct({
  cardId: Schema.NonEmptyString,
  rank: RankId,
  lane: StageLane,
  /** Square index from the player's Hero: 0 is the player's Column 1. */
  position: between(0, 11),
});

/**
 * A Closed Lane (GDD 4.1). It opens in the Start Step of the first Turn of
 * `opensOnTurn`. Without `opensOnTurn`, it stays closed for the full Battle.
 */
const ClosedLane = Schema.Struct({
  lane: StageLane,
  opensOnTurn: Schema.optionalKey(between(2, 60)),
});
export type ClosedLane = typeof ClosedLane.Type;

export const StageDefinition = Schema.Struct({
  id: Schema.NonEmptyString,
  region: between(1, 3),
  number: between(1, 10),
  boss: Schema.Boolean,
  /**
   * The Recommended level: the Player level on the First-try Path before this
   * Stage (Economy 1.2, docs/game/14-campaign-stages.md). A content test checks
   * it. The Player sees it. No Battle rule reads it. The maximum player level in
   * v1 is 30 (GDD 7.1).
   */
  recommendedLevel: between(1, 30),
  /**
   * The card that the first win gives: a card of the enemy Deck, in its Base
   * Rank (docs/game/14-campaign-stages.md). A content test checks it.
   */
  firstWinCard: DeckEntry,
  closedLanes: Schema.Array(ClosedLane),
  enemy: Schema.Struct({
    heroHp: between(1, 200),
    classId: ClassId,
    gear: GearLevels,
    deck: Schema.Array(DeckEntry).check(Schema.isMinLength(5)),
    startUnits: Schema.Array(StartUnit),
  }),
});
export type StageDefinition = typeof StageDefinition.Type;

/** A starter Deck that the Player can take into a Battle in the slice. */
export const StarterDeck = Schema.Struct({
  id: Schema.NonEmptyString,
  classId: ClassId,
  deck: Schema.Array(DeckEntry).check(Schema.isMinLength(5)),
});
export type StarterDeck = typeof StarterDeck.Type;

/**
 * An Archetype: a named reference Deck for one style of play. The team uses
 * Archetypes to measure balance (GDD 13). It has the same data as a starter Deck.
 */
export const Archetype = StarterDeck;
export type Archetype = typeof Archetype.Type;
