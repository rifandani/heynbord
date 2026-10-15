import { Schema } from "effect";

/**
 * Schemas for content data (ADR-0006, amendment): cards, Decks and Stages.
 * The content files are typed TypeScript, and a content test decodes them
 * with these schemas, so a bad value fails the test suite.
 */

export const RankId = Schema.Literals([
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

/**
 * Lightning gives Paralyzed (ADR-0029). It is open to each Race and Class. A
 * Ranged Creature Card with Lightning needs a lock check before it goes into
 * the content, the same as Frost (ADR-0025): a content test stops it.
 */
const DamageType = Schema.Literals([
  "physical",
  "fire",
  "frost",
  "holy",
  "lightning",
]);
export type DamageType = typeof DamageType.Type;

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
  bulwark: Schema.optionalKey(KeywordAmount),
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
  /**
   * The Speed Keywords (ADR-0030): +1, +2 or −1 Speed from the Base Speed 2,
   * the same at each Rank. A content test checks that a card has at most 1.
   */
  swift: Schema.optionalKey(Schema.Literal(true)),
  fleet: Schema.optionalKey(Schema.Literal(true)),
  heavy: Schema.optionalKey(Schema.Literal(true)),
  /**
   * The Range Keywords (ADR-0030): +1, +2 or +3 Range from the Base Range 1,
   * the same at each Rank. A content test checks that a card has at most 1,
   * and that Extreme-range is only at Base Rank Epic or higher.
   */
  midRange: Schema.optionalKey(Schema.Literal(true)),
  longRange: Schema.optionalKey(Schema.Literal(true)),
  extremeRange: Schema.optionalKey(Schema.Literal(true)),
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
  baseRank: RankId,
  countdown: between(1, 6),
  attack: between(0, 12),
  hp: between(1, 30),
  damageType: DamageType,
  keywords: Keywords,
});
export type CreatureCardDefinition = typeof CreatureCardDefinition.Type;

const Amount = between(1, 30);

/**
 * A Skill Card value: one Common value that scales with the Stat scale (GDD
 * 5.3), or an exact value for each Rank.
 */
const SkillAmount = Schema.Union([
  Amount,
  Schema.Struct({
    common: Amount,
    uncommon: Amount,
    rare: Amount,
    epic: Amount,
    legendary: Amount,
  }),
]);
export type SkillAmount = typeof SkillAmount.Type;

/** The number of random Cards that a Skill Card can affect. */
const SkillCount = Schema.Union([
  between(1, 8),
  Schema.Struct({
    common: between(1, 8),
    uncommon: between(1, 8),
    rare: between(1, 8),
    epic: between(1, 8),
    legendary: between(1, 8),
  }),
]);
export type SkillCount = typeof SkillCount.Type;

/** The number of Squares that a Skill Card can Push: fixed or set by Rank. */
const SkillSquares = Schema.Union([
  between(1, 3),
  Schema.Struct({
    common: between(1, 3),
    uncommon: between(1, 3),
    rare: between(1, 3),
    epic: between(1, 3),
    legendary: between(1, 3),
  }),
]);
export type SkillSquares = typeof SkillSquares.Type;

/** The Countdown reduction from a Skill Card. */
const SkillReduction = Schema.Union([
  between(1, 3),
  Schema.Struct({
    common: between(1, 3),
    uncommon: between(1, 3),
    rare: between(1, 3),
    epic: between(1, 3),
    legendary: between(1, 3),
  }),
]);
export type SkillReduction = typeof SkillReduction.Type;

/** Bonus Bulwark is 1 to 5, including when its value changes with the Rank. */
const SkillBulwark = Schema.Union([
  between(1, 5),
  Schema.Struct({
    common: between(1, 5),
    uncommon: between(1, 5),
    rare: between(1, 5),
    epic: between(1, 5),
    legendary: between(1, 5),
  }),
]);

/** Effect templates (technical design 3.5). The UI makes the card text from the same data. */
const SkillEffect = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("damageUnit"),
    amount: SkillAmount,
    damageType: DamageType,
    /**
     * A Unit that the hit kills does not come back with Rebirth (GDD 4.9).
     * It leaves the Board, as a Unit without Rebirth does.
     */
    noRebirth: Schema.optionalKey(Schema.Literal(true)),
  }),
  Schema.Struct({
    type: Schema.Literal("damageArea"),
    amount: SkillAmount,
    damageType: DamageType,
    /** The area starts at the target Square and goes this many Squares toward the enemy Hero. */
    length: between(1, 4),
  }),
  Schema.Struct({
    type: Schema.Literal("damageLane"),
    amount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When the damage is above 0 and the Unit
     * survives, it becomes Entangled, as with the Entangle Keyword.
     */
    type: Schema.Literal("damageEntangle"),
    amount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When the Unit survives, it is Pushed this
     * many Squares, also at 0 damage. Unlike Knockback, the push is the main
     * effect.
     */
    type: Schema.Literal("damagePush"),
    amount: SkillAmount,
    damageType: DamageType,
    squares: SkillSquares,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When the damage is above 0 and the Unit
     * survives, it is Pushed this many Squares, as with the Knockback Keyword.
     */
    type: Schema.Literal("damageKnockback"),
    amount: SkillAmount,
    damageType: DamageType,
    squares: SkillSquares,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When the damage is above 0 and the Unit
     * survives, it becomes Bleeding with this count, as with the Bleed
     * Keyword. The count does not scale with the Rank.
     */
    type: Schema.Literal("damageBleed"),
    amount: SkillAmount,
    damageType: DamageType,
    bleed: between(1, 5),
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When the Unit survives, it becomes Poisoned
     * with `poison` more stacks, also at 0 damage: the stacks are the main
     * effect. A Unit that the hit kills gets no stacks.
     */
    type: Schema.Literal("damagePoison"),
    amount: SkillAmount,
    damageType: DamageType,
    poison: SkillAmount,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit. When a Flying Unit survives, it becomes
     * Grounded (GDD 4.7), also at 0 damage: Grounded is the main effect. A
     * ground Unit gets only the damage.
     */
    type: Schema.Literal("damageGround"),
    amount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to each enemy Unit in one Lane. Each Unit that survives with
     * damage above 0 becomes Entangled, as with `damageEntangle`.
     */
    type: Schema.Literal("damageLaneEntangle"),
    amount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit equal to its Attack at the moment of the hit,
     * with the Rally and Swarm bonuses. A Unit with Attack 0, and a Wall,
     * take 0 damage. The Rank does not change the damage.
     */
    type: Schema.Literal("damageByAttack"),
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit, then the caster's Units in its Lane get bonus
     * Bulwark, as with `laneBulwark`. The Bulwark comes also when the hit kills.
     */
    type: Schema.Literal("damageLaneBulwark"),
    amount: SkillAmount,
    damageType: DamageType,
    bulwark: SkillBulwark,
    turns: between(1, 5),
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit, then each of the caster's Units in its Lane
     * is healed, as with `healUnit`. The heal comes also when the hit kills.
     */
    type: Schema.Literal("damageLaneHeal"),
    amount: SkillAmount,
    damageType: DamageType,
    heal: SkillAmount,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit, then `heroAmount` damage to the enemy Hero of
     * its Lane (the Hero whose Front holds that Lane). The Hero hit can Crit.
     */
    type: Schema.Literal("damageUnitHero"),
    amount: SkillAmount,
    heroAmount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to one enemy Unit and to the enemy Units in the same Column in
     * the Lanes next to it (*Arc Lightning*). A Closed Lane has no Unit, so
     * with only 1 open Lane it hits only its target.
     */
    type: Schema.Literal("damageArc"),
    amount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Damage to `units` random different enemy Units (*Thunderstorm*). With
     * fewer enemy Units, it hits each one time. It never hits a Hero. The
     * Battle seed sets the choice.
     */
    type: Schema.Literal("damageRandom"),
    amount: SkillAmount,
    damageType: DamageType,
    units: between(1, 8),
  }),
  Schema.Struct({
    /**
     * A Field Effect (GDD 4.8) on an area of `lanes` Lanes × `columns`
     * Columns. In each End Phase of its owner, for `turns` End Phases, it
     * deals the damage to each enemy Unit in the area. The first hit is in the
     * End Phase of the Turn when it is played.
     */
    type: Schema.Literal("fieldEffect"),
    amount: SkillAmount,
    damageType: DamageType,
    lanes: between(1, 3),
    columns: between(1, 4),
    turns: between(1, 5),
  }),
  Schema.Struct({
    /** Damage to one enemy Hero. A Hero has no Bulwark and cannot Block (GDD 4.7). */
    type: Schema.Literal("damageHero"),
    amount: SkillAmount,
    damageType: DamageType,
  }),
  Schema.Struct({
    /**
     * Heals one friendly Unit, up to its maximum HP. A Bleeding Unit gets half
     * of the heal (ADR-0019). Nothing heals a Hero (ADR-0028).
     */
    type: Schema.Literal("healUnit"),
    heal: SkillAmount,
  }),
  Schema.Struct({
    /** Heals each friendly Unit in one Lane, as with `healUnit`. */
    type: Schema.Literal("healLane"),
    heal: SkillAmount,
  }),
  Schema.Struct({
    /**
     * One friendly Unit gets Ward N (GDD 4.7): a Buff that absorbs damage
     * after Block. A Ward keeps the higher value: the values do not add.
     */
    type: Schema.Literal("wardUnit"),
    ward: SkillAmount,
  }),
  Schema.Struct({
    /** Each friendly Unit in one Lane gets Ward N, as with `wardUnit`. */
    type: Schema.Literal("wardLane"),
    ward: SkillAmount,
  }),
  Schema.Struct({
    /**
     * One friendly Unit gets Steadfast (GDD 4.7): when damage would bring it
     * to 0 HP, it stays at 1 HP and Steadfast ends. A new Steadfast on a
     * Steadfast Unit has no effect.
     */
    type: Schema.Literal("steadfastUnit"),
  }),
  Schema.Struct({
    /**
     * All Debuffs of one friendly Unit end, then the Unit is healed, as with
     * `healUnit`. The Debuffs end first, so Bleeding does not halve this heal.
     * Buffs stay.
     */
    type: Schema.Literal("cleanseUnit"),
    heal: SkillAmount,
  }),
  Schema.Struct({
    /**
     * One enemy Unit becomes Exposed N (GDD 4.7): each Physical hit on it
     * deals N more damage, after Bulwark. The count is 2 End Phases of its
     * owner. A new Exposed keeps the higher value.
     */
    type: Schema.Literal("exposeUnit"),
    exposed: SkillAmount,
  }),
  Schema.Struct({
    /**
     * Friendly Units in one Lane with Base Attack above 0 get bonus Attack
     * until the end of the caster's next Turn (GDD 4.8). A new bonus Attack
     * replaces the old one.
     */
    type: Schema.Literal("laneAttack"),
    attack: SkillAmount,
  }),
  Schema.Struct({
    /**
     * One friendly Unit with Base Attack above 0 gets bonus Attack and bonus
     * Range until the end of the caster's next Turn (GDD 4.8). A Melee Unit
     * with bonus Range is a Ranged Unit until the bonus ends. Each bonus has
     * its own duration, and a new one replaces the old one.
     */
    type: Schema.Literal("unitAttackRange"),
    attack: SkillAmount,
    range: between(1, 3),
  }),
  Schema.Struct({
    /**
     * Each friendly Unit in one Lane does one more action now: Movement and
     * attack, from the front Unit to the back Unit (GDD 4.4).
     */
    type: Schema.Literal("laneExtraAction"),
    /** Optional bonus Attack at Legendary Rank, until the end of the next Turn. */
    legendaryAttack: Schema.optionalKey(between(1, 5)),
  }),
  Schema.Struct({
    /**
     * Friendly Units in one Lane get bonus Bulwark for `turns` enemy Turns. The
     * Bulwark can scale with the Skill Card Rank. A Unit keeps the higher bonus.
     * For the same bonus, it keeps the longer duration.
     */
    type: Schema.Literal("laneBulwark"),
    bulwark: SkillBulwark,
    turns: between(1, 5),
  }),
  Schema.Struct({
    /** Lowers the Countdown of random cards in the caster's Hand that are not Ready. */
    type: Schema.Literal("lowerCountdown"),
    cards: SkillCount,
    amount: SkillReduction,
  }),
]);
export type SkillEffect = typeof SkillEffect.Type;

const SkillTarget = Schema.Literals([
  "enemyUnit",
  "enemyHero",
  "enemyLane",
  /** Each Unit of the caster's Side, also a Token, a Wall and a Unit at full HP. Never a Hero. */
  "friendlyUnit",
  "friendlyLane",
  /**
   * The area of a Field Effect: the corner Square nearest to the caster's
   * Hero, in the upper Lane of the area (GDD 4.8). The area stays inside the
   * Board, and no Square of it is in a Closed Lane. Only a `fieldEffect` has it.
   */
  "area",
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
});

/**
 * A Token (Card Concepts 8). It is not a Card: it is not in the Collection, in
 * a Deck or in Packs. It does not use `scaleForRank`: its Rank table gives the
 * values at each Rank.
 */
export const TokenDefinition = Schema.Struct({
  id: TokenId,
  race: RaceId,
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

/** Gear levels 0 to 25 for the 4 slots (GDD 7.3, ADR-0039). */
export const GearLevels = Schema.Struct({
  weapon: between(0, 25),
  armor: between(0, 25),
  trinket: between(0, 25),
  banner: between(0, 25),
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
  region: between(1, 5),
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
