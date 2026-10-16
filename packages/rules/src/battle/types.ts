import { Data } from "effect";

import type { ActivatedKeyword } from "../content/keywords";
import type {
  ClassId,
  ClosedLane,
  DamageType,
  DungeonDefinition,
  FloorDefinition,
  RankId,
  StageDefinition,
  TokenId,
} from "../content/schema";

export type Side = "player" | "enemy";

export const otherSide = (side: Side): Side =>
  side === "player" ? "enemy" : "player";

/** The number of Squares in each Lane (GDD 4.1). */
export const LANE_LENGTH = 12;

/**
 * The number of Columns in a Summon Zone (GDD 4.1, ADR-0011). It is the same
 * for all Sides and Heroes: content data cannot change it.
 */
export const SUMMON_ZONE_DEPTH = 3;

/**
 * The number of Columns from its Hero where a Unit with Wall can be summoned
 * (ADR-0023). Columns past the Summon Zone are not part of it.
 */
export const WALL_SUMMON_DEPTH = 5;

/**
 * The number of Lanes in a Stage (GDD 4.1, ADR-0010). The type of Battle sets
 * it: content data cannot. A Stage makes the Board smaller only with Closed Lanes.
 */
export const STAGE_LANES = 3;

/**
 * The number of Lanes in a Dungeon (GDD 8.4, ADR-0010). A Dungeon makes the
 * Board smaller only with Closed Lanes.
 */
export const DUNGEON_LANES = 4;

/**
 * The number of Lanes in a Heynspire Floor (GDD 8.2, ADR-0010). A Floor has
 * no Closed Lanes.
 */
export const FLOOR_LANES = 4;

/** The maximum number of cards in a Hand. A side does not draw when its Hand is full. */
export const HAND_LIMIT = 8;

/** Sudden Death starts at this Turn number (GDD 4.10). */
export const SUDDEN_DEATH_TURN = 20;

/** Sudden Death damage goes to 2 at this Turn number. */
export const SUDDEN_DEATH_DOUBLE_TURN = 40;

/** The defender wins when no Hero has 0 HP at the end of this Turn number. */
export const TURN_LIMIT = 60;

/** One Card copy in a Deck or a Graveyard. `instanceId` is unique in the Battle. */
export interface CardInstance {
  readonly instanceId: number;
  readonly cardId: string;
  readonly rank: RankId;
}

/** One Card copy in a Hand, with its current Countdown. */
export interface HandCard extends CardInstance {
  countdown: number;
}

/**
 * The effect of a Boss Rule in a Battle (ADR-0040). A Summon has its Card copy
 * from the Battle setup, so the activation needs no new instance ID.
 */
export type BossRuleEffect =
  | {
      readonly type: "countdown";
      readonly amount: number;
      readonly cards: number;
    }
  | {
      readonly type: "summon";
      readonly card: CardInstance;
      readonly lane: number;
      readonly position: number;
    }
  | { readonly type: "draw"; readonly cards: number };

/** A Boss Rule of a Hero in a Battle (ADR-0040). */
export interface BossRuleState {
  /** A percentage of the maximum HP of the Hero: 1 to 99. */
  readonly threshold: number;
  readonly effect: BossRuleEffect;
  /** A Boss Rule activates at most one time in a Battle. */
  activated: boolean;
}

/**
 * One Hero of a Side (ADR-0009). A Hero at 0 HP is Defeated: it is out of the
 * Battle, and its Front is empty.
 */
export interface HeroState {
  hp: number;
  maxHp: number;
  readonly classId: ClassId;
  /** Unit Crit chance from the Weapon, in basis points. */
  readonly unitCrit: number;
  /** Skill Card Crit chance from the Trinket, in basis points. */
  readonly skillCrit: number;
  /** Unit Block chance from the Banner, in basis points. */
  readonly unitBlock: number;
  /** The Lanes that the Hero stands behind, from the lowest Lane. */
  front: number[];
  hand: HandCard[];
  deck: CardInstance[];
  graveyard: CardInstance[];
  /** The Boss Rules of a Boss, in content order (ADR-0040). Other Heroes have none. */
  bossRules: BossRuleState[];
}

/** The Heroes of a Side, in Lane order of their Fronts at the start (ADR-0009). */
export interface SideState {
  heroes: HeroState[];
}

/**
 * Where a Unit comes from: a Card copy, or a Token with no Card (GDD 4.9).
 * When a Card Unit dies, its Card goes to the Graveyard. A Token Unit just
 * disappears. Only Card Units count for Unique.
 */
export type UnitSource =
  | { readonly _tag: "Card"; readonly card: CardInstance }
  | {
      readonly _tag: "Token";
      readonly tokenId: TokenId;
      /** The Rank of the Card or effect that made the Token. */
      readonly rank: RankId;
    };

/** The Rank of a Unit: the Rank of its Card copy, or of its Token. */
export const unitRank = (source: UnitSource): RankId =>
  source._tag === "Card" ? source.card.rank : source.rank;

/**
 * A Unit on the Board. `position` is the Square index from the player's Hero:
 * 0 is the player's Column 1 and 11 is the enemy's Column 1.
 */
export interface UnitState {
  readonly id: number;
  readonly owner: Side;
  /** The index of the Hero of `owner` that summoned the Unit (ADR-0009). */
  readonly hero: number;
  readonly source: UnitSource;
  lane: number;
  position: number;
  attack: number;
  hp: number;
  maxHp: number;
  readonly speed: number;
  /** 1 is a Melee Unit. 2 or more is a Ranged Unit (ADR-0030). */
  readonly range: number;
  readonly damageType: DamageType;
  readonly bulwark: number;
  /** Charge for the Rank of this Unit: +N Speed in the Turn of the summon. 0 is none. */
  readonly charge: number;
  /** After attack damage above 0, the enemy Unit becomes Entangled. */
  readonly entangle: boolean;
  /** Deals its damage first when an enemy melee Unit attacks it (GDD 4.7). */
  readonly firstStrike: boolean;
  readonly flying: boolean;
  readonly heroic: number;
  /** Damage to the nearest enemy Unit ahead when this Unit leaves. 0 is none. */
  readonly lastBreath: number;
  readonly pivot: boolean;
  poison: boolean;
  /** Hobble for the Rank of this Unit. 0 is none. */
  hobble: number;
  /** Bleed for the Rank of this Unit. 0 is none. */
  bleed: number;
  /** Knockback for the Rank of this Unit. 0 is none. */
  knockback: number;
  /** Rally for the Rank of this Unit. 0 is none. */
  readonly rally: number;
  /** True until the Unit dies the first time, then it comes back (GDD 4.9). */
  rebirth: boolean;
  readonly regenerate: number;
  readonly retaliate: boolean;
  /**
   * Swarm for the Rank of this Unit. 0 is none. The bonus is not stored:
   * each hit calculates it (GDD 5.4).
   */
  readonly swarm: number;
  /** Melee only: a kill lets the damage that is left hit the next enemy Unit. */
  readonly trample: boolean;
  /**
   * A Unit with Wall has no Movement, does not attack and is never Pushed.
   */
  wall: boolean;
  /** The Turn number of the summon, also of a Token. Charge uses it. */
  readonly summonedTurn: number;
  /** End Phases of Burn that are left. */
  burn: number;
  /** Poison stacks. Each End Phase of the owner deals 1 damage per stack, then removes 1. */
  poisoned: number;
  /** Hobbled count. 0 is not Hobbled. Above 0, Speed is at most 1. */
  hobbled: number;
  /** Bleeding count. 0 is not Bleeding. Above 0, each heal is half, rounded down. */
  bleeding: number;
  /**
   * Grounded count (GDD 4.7). 0 is not Grounded. Above 0, a Flying Unit does
   * not have Flying, for all rules. Only a Flying Unit becomes Grounded.
   */
  grounded: number;
  /**
   * Exposed N (GDD 4.7): each Physical hit on the Unit deals this much more
   * damage, after Bulwark. 0 is not Exposed.
   */
  exposed: number;
  /** End Phases of the owner that are left for Exposed. It ends at 0. */
  exposedTurns: number;
  frozen: boolean;
  /**
   * Paralyzed (GDD 4.4, ADR-0029): no attack in the next action, but the Unit
   * can move. The action then ends it. Until then, no Retaliate and no First
   * Strike.
   */
  paralyzed: boolean;
  /** Speed 0 in the next action. The action then ends it (GDD 4.4). */
  entangled: boolean;
  /**
   * Ward N (GDD 4.7): a Buff that absorbs damage after Block. It goes down by
   * the absorbed damage and ends at 0. 0 is no Ward. It has no time limit.
   */
  ward: number;
  /**
   * Steadfast (GDD 4.7): a Buff. When damage would bring the Unit to 0 HP, it
   * stays at 1 HP and Steadfast ends. It has no time limit.
   */
  steadfast: boolean;
  /** Attack from Rally until the end of the Turn of the owner. */
  rallied: number;
  bonusBulwark: number;
  bonusBulwarkTurns: number;
  /** Bonus Attack from a Skill Card (*Call to Arms*, GDD 4.8). */
  bonusAttack: number;
  /** End Phases of the owner that are left for the bonus Attack. */
  bonusAttackTurns: number;
  /**
   * Bonus Range from a Skill Card (*Hunter's Focus*, GDD 4.8). Above 0, a
   * Melee Unit is a Ranged Unit. It has its own count, so a new bonus Attack
   * from another card does not change it.
   */
  bonusRange: number;
  /** End Phases of the owner that are left for the bonus Range. */
  bonusRangeTurns: number;
}

/**
 * A Field Effect on the Board (GDD 4.8). The area is `lanes` Lanes from
 * `lane` down, and `columns` Squares from `position` toward the enemy Hero of
 * `owner`. In each End Phase of `owner`, it deals `amount` damage to each
 * enemy Unit in the area, then `turns` goes down by 1. It ends at 0.
 */
export interface FieldEffect {
  readonly id: number;
  readonly owner: Side;
  /** The index of the Hero of `owner` that played the card. */
  readonly hero: number;
  /** The Skill Card that made it. */
  readonly card: CardInstance;
  readonly lane: number;
  readonly position: number;
  readonly lanes: number;
  readonly columns: number;
  /** The damage of each hit, at the Rank of the card. */
  readonly amount: number;
  readonly damageType: DamageType;
  /** The End Phases of the owner that are left. */
  turns: number;
}

export interface BattleResult {
  readonly winner: Side;
  /** `routed`: a Side with no Units and no Cards lost at the end of a Turn (ADR-0012). */
  readonly reason: "heroDefeated" | "turnLimit" | "routed";
}

/**
 * The full state of one Battle. It is plain data: it can be saved, sent to a
 * server and compared. `random` is the seeded random state (ADR-0006).
 */
export interface BattleState {
  /** The ID of the Stage or of the Dungeon. */
  readonly stageId: string;
  readonly seed: number;
  random: number;
  readonly lanes: number;
  /** Lanes where no Side can summon and no Skill Card can target (GDD 4.1). */
  closedLanes: ClosedLane[];
  turnNumber: number;
  activeSide: Side;
  status: "ongoing" | "finished";
  sides: Record<Side, SideState>;
  units: UnitState[];
  /** The Field Effects on the Board, in the order of play. */
  fieldEffects: FieldEffect[];
  /** The next ID of a Unit or a Field Effect. */
  nextId: number;
  result: BattleResult | null;
}

/** What a Card targets when it is played. A Hero target names the Side and the index of the Hero. */
export type Target = Data.TaggedEnum<{
  Lane: { readonly lane: number };
  Square: { readonly lane: number; readonly position: number };
  Hero: { readonly side: Side; readonly hero: number };
  NoTarget: Record<never, never>;
}>;
export const Target = Data.taggedEnum<Target>();

export type Command = Data.TaggedEnum<{
  /** `hero` is the index of the Hero of the active Side that plays the card from its Hand. */
  PlayCard: {
    readonly hero: number;
    readonly handIndex: number;
    readonly target: Target;
  };
  EndTurn: Record<never, never>;
}>;
export const Command = Data.taggedEnum<Command>();

export type TargetRef =
  | { readonly _tag: "Unit"; readonly unitId: number }
  | { readonly _tag: "Hero"; readonly side: Side; readonly hero: number };

/**
 * One Hero of a Battle: its Side and its index in that Side (ADR-0009). The
 * Player's Side always has 1 Hero, so its index is 0.
 */
export interface HeroRef {
  readonly side: Side;
  readonly hero: number;
}

/**
 * Who dealt a damage: a Unit, or a Hero for the damage of a Skill Card or a
 * Field Effect. `hero` of a Unit is the Hero that owns it.
 */
export type DamageDealer =
  | {
      readonly _tag: "Unit";
      readonly unitId: number;
      readonly hero: HeroRef;
    }
  | { readonly _tag: "Hero"; readonly hero: HeroRef };

export type DamageSource =
  | "attack"
  | "retaliate"
  /** The damage of a defender with First Strike, before the melee attack. */
  | "firstStrike"
  | "skill"
  | "burn"
  | "poison"
  | "lastBreath"
  | "suddenDeath"
  /** The hit of a Field Effect in the End Phase of its owner (GDD 4.8). */
  | "field"
  /** The damage that is left after a Trample kill. It is not an attack. */
  | "trample";

/** A snapshot of a Unit for the renderer. */
export type UnitSnapshot = Readonly<UnitState>;

/**
 * Everything that happens in a Battle, in order. `apps/web` plays these as
 * animations. The rules never wait for an animation.
 */
export type BattleEvent = Data.TaggedEnum<{
  TurnStarted: { readonly side: Side; readonly turnNumber: number };
  LaneOpened: { readonly lane: number };
  UnitHealed: {
    readonly unitId: number;
    readonly amount: number;
    readonly hp: number;
  };
  /**
   * Rally N (GDD 5.4): the Rally Unit `unitId` gave its bonus in the Start
   * Phase. `rallied` is the total Rally bonus of each target after this event.
   * No event ends the bonus: it ends at `TurnEnded` of the owner and at
   * `UnitReborn`.
   */
  UnitsRallied: {
    readonly unitId: number;
    readonly targets: readonly {
      readonly unitId: number;
      readonly rallied: number;
    }[];
  };
  CountdownsTicked: {
    readonly side: Side;
    readonly hero: number;
    readonly countdowns: readonly number[];
  };
  CardDrawn: {
    readonly side: Side;
    readonly hero: number;
    readonly card: HandCard;
  };
  CardPlayed: {
    readonly side: Side;
    /** The Hero that played the card. */
    readonly hero: HeroRef;
    readonly handIndex: number;
    readonly card: CardInstance;
    readonly target: Target;
  };
  UnitSummoned: { readonly unit: UnitSnapshot };
  /**
   * Summon X (GDD 5.4): the summon of `sourceUnitId` made the Token Unit
   * `unit` in an empty Square next to it.
   */
  TokenSummoned: {
    readonly unit: UnitSnapshot;
    readonly sourceUnitId: number;
  };
  RecallRolled: {
    readonly side: Side;
    readonly hero: number;
    readonly card: CardInstance;
    readonly success: boolean;
  };
  CountdownChanged: {
    readonly side: Side;
    readonly hero: number;
    readonly instanceId: number;
    readonly countdown: number;
  };
  /**
   * Sabotage (GDD 5.4): the summon of `unitId` made a card in the Hand of the
   * Hero `hero` of `side` later. `countdown` is the new Countdown of that card.
   */
  CardSabotaged: {
    readonly unitId: number;
    readonly side: Side;
    readonly hero: number;
    readonly instanceId: number;
    readonly countdown: number;
  };
  BulwarkGained: {
    readonly unitId: number;
    readonly bulwark: number;
    readonly turns: number;
  };
  BulwarkFaded: { readonly unitId: number };
  /**
   * Bonus Attack from a Skill Card (GDD 4.8). `turns` is the number of End
   * Phases of the owner that it lasts.
   */
  AttackGained: {
    readonly unitId: number;
    readonly attack: number;
    readonly turns: number;
  };
  AttackFaded: { readonly unitId: number };
  RangeGained: {
    readonly unitId: number;
    readonly range: number;
    readonly turns: number;
  };
  RangeFaded: { readonly unitId: number };
  UnitMoved: {
    readonly unitId: number;
    readonly lane: number;
    readonly from: number;
    readonly to: number;
  };
  /** A push, which is not Movement (GDD 4.5, 4.7). */
  UnitPushed: {
    readonly unitId: number;
    readonly lane: number;
    readonly from: number;
    readonly to: number;
  };
  UnitSkipped: { readonly unitId: number };
  /**
   * Paralyzed (GDD 4.4): the Unit did its Movement, but not its attack, and
   * Paralyzed ended. A Unit that is also Frozen gets `UnitSkipped` instead.
   */
  AttackSkipped: { readonly unitId: number };
  /**
   * The action of a Unit that was Entangled when the action started ended its
   * Entangled (GDD 4.4). An Entangle from First Strike or Retaliate during the
   * action stays, so this event does not occur for it. A skipped action gives
   * `UnitSkipped` instead.
   */
  EntangleFaded: { readonly unitId: number };
  UnitAttacked: {
    readonly unitId: number;
    readonly target: TargetRef;
    readonly ranged: boolean;
  };
  DamageDealt: {
    readonly target: TargetRef;
    readonly amount: number;
    readonly damageType: DamageType;
    readonly source: DamageSource;
    /**
     * The Unit or the Hero that dealt the damage. `null` for Burn, Poison and
     * Sudden Death damage: no Unit and no Hero deals it.
     */
    readonly dealer: DamageDealer | null;
    readonly crit: boolean;
    readonly blocked: boolean;
    /** True Damage (GDD 4.7): no Bulwark, Exposed, Crit, Block or Ward. */
    readonly trueDamage: boolean;
    /**
     * The damage that the Ward of the target absorbed (GDD 4.7, step 8).
     * `amount` is the damage after the Ward. A Hero has no Ward: 0.
     */
    readonly absorbed: number;
    /** The Ward value of the target after the damage. 0 is no Ward. */
    readonly ward: number;
    /** The HP of the target after the damage. */
    readonly hp: number;
  };
  StatusApplied: {
    readonly unitId: number;
    readonly status:
      | "burn"
      | "freeze"
      | "paralyze"
      | "poison"
      | "hobble"
      | "bleed"
      | "entangle"
      | "ward"
      | "steadfast"
      | "exposed"
      | "grounded";
    /**
     * The Poisoned, Hobbled, Bleeding or Grounded count after the hit, the new
     * Ward value, or the new Exposed value. The other statuses do not use it.
     */
    readonly count?: number;
  };
  /**
   * Steadfast (GDD 4.7): the damage of the `DamageDealt` event before this one
   * would bring the Unit to 0 HP. The Unit stays at 1 HP, and Steadfast ends.
   * The Unit is not killed.
   */
  SteadfastHeld: { readonly unitId: number };
  /**
   * A Skill Card (*Cleanse*) ended all Debuffs of the Unit: Burn, Freeze,
   * Paralyzed, Entangled, Poisoned, Hobbled, Bleeding, Exposed and Grounded. Its Buffs stay. A Unit with no
   * Debuff gets no event.
   */
  DebuffsRemoved: { readonly unitId: number };
  /** A Skill Card put a Field Effect on the Board (GDD 4.8). */
  FieldEffectPlaced: { readonly field: Readonly<FieldEffect> };
  /**
   * The Field Effect hits in the End Phase of its owner. The `DamageDealt`
   * events of its hits come next. `turns` is the number of hits that are left
   * after this one.
   */
  FieldEffectStruck: { readonly fieldId: number; readonly turns: number };
  /** The Field Effect left the Board: its last hit occurred, or its Hero is Defeated. */
  FieldEffectEnded: { readonly fieldId: number };
  /**
   * The Keyword `keyword` of the Unit `unitId` did something (GDD 5.4). It
   * comes at the moment when the Keyword changes the Battle, before the events
   * of its result: for example before the `DamageDealt` of Retaliate, or before
   * the `UnitPushed` of Knockback. A Keyword that changes nothing does not
   * send it. `hero` is the Hero that owns the Unit. `value` is the value of
   * the Keyword for a value Keyword, for example Heroic N or Swarm N. It is
   * not in the event for a Keyword with no value. The existing events of a
   * Keyword (`UnitsRallied`, `TokenSummoned`, `CardSabotaged`, `UnitReborn`)
   * still come after it. The event never names a Hand card.
   */
  KeywordActivated: {
    readonly unitId: number;
    readonly keyword: ActivatedKeyword;
    readonly hero: HeroRef;
    readonly value?: number;
  };
  UnitDied: { readonly unitId: number };
  /**
   * The Unit left the Board because its Hero is Defeated (ADR-0009). It is not
   * a death: its Card does not go to the Graveyard, and Last Breath and
   * Rebirth do not occur.
   */
  UnitRemoved: { readonly unitId: number };
  /**
   * The Hero is at 0 HP and out of the Battle (ADR-0009). When it was the last
   * Hero of its Side that was not Defeated, `BattleEnded` comes next.
   */
  HeroDefeated: { readonly hero: HeroRef };
  /**
   * The Front of the Defeated Hero `from` went to `to`, the nearest Hero of
   * the same Side that is not Defeated (ADR-0009). `lanes` are the Lanes that
   * moved.
   */
  FrontMoved: {
    readonly from: HeroRef;
    readonly to: HeroRef;
    readonly lanes: readonly number[];
  };
  /**
   * The Boss Rule `rule` (its index in the Boss Rules of `hero`) activated
   * (ADR-0040). The events of its effect come next: `CountdownChanged`,
   * `UnitSummoned` or `CardDrawn`. An effect that changes nothing sends no
   * more events.
   */
  BossRuleActivated: {
    readonly hero: HeroRef;
    readonly rule: number;
    readonly threshold: number;
  };
  /**
   * Rebirth (GDD 4.9): the Unit died and came back in the same Square. It
   * replaces `UnitDied` for that death. `hp` is the new HP.
   */
  UnitReborn: { readonly unitId: number; readonly hp: number };
  TurnEnded: { readonly side: Side };
  BattleEnded: { readonly result: BattleResult };
}>;
export const BattleEvent = Data.taggedEnum<BattleEvent>();

export type RuleViolation = Data.TaggedEnum<{
  BattleFinished: Record<never, never>;
  /** No Hero of the active Side that is not Defeated has this index. */
  InvalidHero: { readonly hero: number };
  InvalidHandIndex: { readonly handIndex: number };
  CardNotReady: { readonly handIndex: number };
  IllegalTarget: { readonly handIndex: number; readonly target: Target };
}>;
export const RuleViolation = Data.taggedEnum<RuleViolation>();

/** The Player's side of a Battle setup. */
export interface PlayerSetup {
  readonly classId: ClassId;
  readonly deck: readonly { readonly cardId: string; readonly rank: RankId }[];
  readonly level: number;
  readonly gear: {
    readonly weapon: number;
    readonly armor: number;
    readonly trinket: number;
    readonly banner: number;
  };
}

/**
 * A Battle setup against the enemy of a Stage, against the Bosses of a
 * Dungeon, or against the enemy of a Heynspire Floor.
 */
export type BattleSetup =
  | {
      readonly seed: number;
      readonly stage: StageDefinition;
      readonly player: PlayerSetup;
    }
  | {
      readonly seed: number;
      readonly dungeon: DungeonDefinition;
      readonly player: PlayerSetup;
    }
  | {
      readonly seed: number;
      readonly floor: FloorDefinition;
      readonly player: PlayerSetup;
    };
