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

/** Feral is the one Race with no people (ADR-0013). No Battle rule reads the Race. */
const RaceId = Schema.Literals([
  "human",
  "elf",
  "undead",
  "orc",
  "goblin",
  "feral",
]);
export type RaceId = typeof RaceId.Type;

export const ClassId = Schema.Literals(["warrior", "ranger", "mage", "priest"]);
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

/** A value for each Rank. A missing Rank uses the nearest lower Rank. */
const rankValues = (value: typeof KeywordValue) =>
  Schema.Struct({
    common: Schema.optionalKey(value),
    uncommon: Schema.optionalKey(value),
    rare: Schema.optionalKey(value),
    epic: Schema.optionalKey(value),
    legendary: Schema.optionalKey(value),
  });

/**
 * A value Keyword (GDD 5.3): one number for every Rank, or a value for each Rank.
 */
const KeywordAmount = Schema.Union([KeywordValue, rankValues(KeywordValue)]);
export type KeywordAmount = typeof KeywordAmount.Type;

/** The v1 Tokens (Card Concepts 8). A Token is a Unit with no Card. */
const TokenId = Schema.Literals(["token.skeleton", "token.restlessWisp"]);
export type TokenId = typeof TokenId.Type;

/**
 * The Keywords that a Token can have. Summon is not one of them, so a Token
 * never makes a Token.
 */
const tokenKeywordFields = {
  armor: Schema.optionalKey(KeywordAmount),
  /**
   * +N Speed in the Turn of the summon (GDD 5.4). N is at most 3. A content
   * test checks the Rank table.
   */
  charge: Schema.optionalKey(
    Schema.Union([between(1, 3), rankValues(between(1, 3))])
  ),
  /**
   * After attack damage above 0, the enemy Unit becomes Entangled: Speed 0 in
   * its next action (GDD 4.4, 4.7).
   */
  entangle: Schema.optionalKey(Schema.Literal(true)),
  /**
   * When an enemy melee Unit attacks this Unit, this Unit deals its damage
   * first. If the attacker dies, its attack does not occur (GDD 4.7).
   */
  firstStrike: Schema.optionalKey(Schema.Literal(true)),
  flying: Schema.optionalKey(Schema.Literal(true)),
  heroic: Schema.optionalKey(KeywordAmount),
  /** Deals this much damage to the nearest enemy Unit ahead when this Unit leaves. */
  lastBreath: Schema.optionalKey(KeywordAmount),
  /** Melee only (GDD 4.6). A content test checks it. */
  pivot: Schema.optionalKey(Schema.Literal(true)),
  poison: Schema.optionalKey(Schema.Literal(true)),
  /**
   * The first time this Unit dies, it comes back in the same Square with 1 HP
   * and without Rebirth (GDD 4.9). A content test checks that no card also
   * has Last Breath (ADR-0015).
   */
  rebirth: Schema.optionalKey(Schema.Literal(true)),
  /**
   * In the owner's Start Phase, the other friendly Units in the same Lane get
   * this much Attack until the end of the Turn (GDD 5.4).
   */
  rally: Schema.optionalKey(KeywordAmount),
  regenerate: Schema.optionalKey(KeywordAmount),
  /**
   * After attack damage above 0, the enemy Unit becomes Hobbled with this
   * count (GDD 4.7). Hobble is the first Keyword that uses a value for each Rank.
   */
  hobble: Schema.optionalKey(KeywordAmount),
  /**
   * After attack damage above 0, the enemy Unit becomes Bleeding with this
   * count: it gets half of each heal, rounded down (GDD 4.7, ADR-0019).
   */
  bleed: Schema.optionalKey(KeywordAmount),
  /**
   * After attack damage above 0, a melee Unit Pushes the enemy Unit this many
   * Squares toward its own Hero (GDD 4.7). A Unit with Wall is never Pushed.
   */
  knockback: Schema.optionalKey(KeywordAmount),
  retaliate: Schema.optionalKey(Schema.Literal(true)),
  /**
   * When this Unit comes from its Creature Card, the enemy card with the
   * lowest Countdown gets this much Countdown (GDD 5.4). One number for all
   * Ranks, at most 2 (ADR-0017): a Rank table is not valid.
   */
  sabotage: Schema.optionalKey(between(1, 2)),
  /**
   * +N Attack while another friendly Unit is in the same Lane (GDD 5.4). More
   * friendly Units do not increase the bonus.
   */
  swarm: Schema.optionalKey(KeywordAmount),
  /**
   * Melee only (GDD 4.7). A kill lets the damage that is left hit the enemy
   * Unit in the next Square behind. A content test checks it.
   */
  trample: Schema.optionalKey(Schema.Literal(true)),
  /**
   * While a Unit from this card is on a Side of the Board, that Side cannot
   * play a copy of it, at any Rank (GDD 5.4). The named Epic of each Race has it.
   */
  unique: Schema.optionalKey(Schema.Literal(true)),
  /** A push never moves this Unit (GDD 4.7, 5.4). */
  wall: Schema.optionalKey(Schema.Literal(true)),
};

const TokenKeywords = Schema.Struct(tokenKeywordFields);
export type TokenKeywords = typeof TokenKeywords.Type;

/** The v1 Keywords of the Battle slice (GDD 5.4, roadmap M1). */
const Keywords = Schema.Struct({
  ...tokenKeywordFields,
  /**
   * Summon X (GDD 5.4): when this Unit comes from its Creature Card, a Token
   * X of the same Rank appears in an empty Square next to it. Only a Token ID
   * is valid.
   */
  summon: Schema.optionalKey(TokenId),
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
  /** 0 is a melee Unit. 2 or 3 is a ranged Unit with that Range (ADR-0022). */
  range: between(0, 3),
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
    /**
     * Damage to one enemy Unit. When the damage is above 0 and the Unit
     * survives, it becomes Entangled, as with the Entangle Keyword.
     */
    type: Schema.Literal("damageEntangle"),
    amount: Amount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When the Unit survives, it is Pushed this
     * many Squares, also at 0 damage. Unlike Knockback, the push is the main
     * effect.
     */
    type: Schema.Literal("damagePush"),
    amount: Amount,
    damageType: DamageType,
    squares: between(1, 3),
  }),
  Schema.Struct({
    /** Damage to one enemy Hero. A Hero has no Armor and cannot Block (GDD 4.7). */
    type: Schema.Literal("damageHero"),
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
  "enemyHero",
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

/** The values of a Token at one Rank. */
const TokenRankValues = Schema.Struct({
  attack: between(0, 12),
  hp: between(1, 30),
  speed: between(0, 4),
});

/**
 * A Token (Card Concepts 8). It is not a Card: it is not in the Collection, in
 * a Deck or in Packs. It does not use `scaleForRank`: its Rank table gives the
 * values at each Rank.
 */
export const TokenDefinition = Schema.Struct({
  id: TokenId,
  race: RaceId,
  /** 0 is a melee Unit. */
  range: between(0, 3),
  damageType: DamageType,
  keywords: TokenKeywords,
  ranks: Schema.Struct({
    common: TokenRankValues,
    uncommon: TokenRankValues,
    rare: TokenRankValues,
    epic: TokenRankValues,
    legendary: TokenRankValues,
  }),
});
export type TokenDefinition = typeof TokenDefinition.Type;

export const CardDefinition = Schema.Union([
  CreatureCardDefinition,
  SkillCardDefinition,
]);
export type CardDefinition = typeof CardDefinition.Type;

/** One Card copy in a Deck. */
export const DeckEntry = Schema.Struct({
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
 * A Closed Lane (GDD 4.1). It opens in the Start Phase of the first Turn of
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
 * Archetypes to measure balance (GDD 13). It has the data of a starter Deck
 * and a kind. Only a Matchup of two `main` Archetypes gates release. A
 * `diagnostic` Deck reports its results for review (Archetypes 2.1).
 */
export const Archetype = Schema.Struct({
  ...StarterDeck.fields,
  kind: Schema.Literals(["main", "diagnostic"]),
});
export type Archetype = typeof Archetype.Type;
