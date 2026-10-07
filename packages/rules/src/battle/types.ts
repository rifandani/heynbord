import { Data } from "effect";

import type {
  ClassId,
  ClosedLane,
  DamageType,
  RankId,
  StageDefinition,
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
 * The number of Lanes in a Stage (GDD 4.1, ADR-0010). The type of Battle sets
 * it: content data cannot. A Stage makes the Board smaller only with Closed Lanes.
 */
export const STAGE_LANES = 3;

/** The maximum number of cards in a Hand. A side does not draw when its Hand is full. */
export const HAND_LIMIT = 8;

/** The number of Ticking Cards: the oldest cards in the Hand that are not Ready (ADR-0021). */
export const TICKING_CARDS = 3;

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
}

export interface SideState {
  hero: HeroState;
  hand: HandCard[];
  deck: CardInstance[];
  graveyard: CardInstance[];
}

/**
 * A Unit on the Board. `position` is the Square index from the player's Hero:
 * 0 is the player's Column 1 and 11 is the enemy's Column 1.
 */
export interface UnitState {
  readonly id: number;
  readonly owner: Side;
  readonly card: CardInstance;
  lane: number;
  position: number;
  attack: number;
  hp: number;
  maxHp: number;
  readonly speed: number;
  /** 0 is melee. */
  readonly range: number;
  readonly damageType: DamageType;
  readonly armor: number;
  readonly charge: boolean;
  /** After attack damage above 0, the enemy Unit becomes Entangled. */
  readonly entangle: boolean;
  readonly flying: boolean;
  readonly heroic: number;
  /** Damage to the nearest enemy Unit ahead when this Unit leaves. 0 is none. */
  readonly lastBreath: number;
  readonly pivot: boolean;
  poison: boolean;
  /** Hobble for the Rank of this card copy. 0 is none. */
  hobble: number;
  /** Bleed for the Rank of this card copy. 0 is none. */
  bleed: number;
  /** Knockback for the Rank of this card copy. 0 is none. */
  knockback: number;
  /** Rally for the Rank of this card copy. 0 is none. */
  readonly rally: number;
  readonly regeneration: number;
  readonly retaliation: boolean;
  /** Melee only: a kill lets the damage that is left hit the next enemy Unit. */
  readonly trample: boolean;
  /** A Unit with Wall is never Pushed. */
  wall: boolean;
  /** The Turn number of the summon. Charge uses it. */
  readonly summonedTurn: number;
  /** End Steps of Burn that are left. */
  burn: number;
  /** Poison stacks. Each End Step of the owner deals 1 damage per stack, then removes 1. */
  poisoned: number;
  /** Hobbled count. 0 is not Hobbled. Above 0, Speed is at most 1. */
  hobbled: number;
  /** Bleeding count. 0 is not Bleeding. Above 0, each heal is half, rounded down. */
  bleeding: number;
  frozen: boolean;
  /** Speed 0 in the next action. The action then ends it (GDD 4.4). */
  entangled: boolean;
  /** Attack from Rally until the end of the Turn of the owner. */
  rallied: number;
  bonusArmor: number;
  bonusArmorTurns: number;
}

export interface BattleResult {
  readonly winner: Side;
  readonly reason: "heroDefeated" | "turnLimit";
}

/**
 * The full state of one Battle. It is plain data: it can be saved, sent to a
 * server and compared. `random` is the seeded random state (ADR-0006).
 */
export interface BattleState {
  readonly stageId: string;
  readonly seed: number;
  random: number;
  readonly lanes: number;
  /** Lanes where no Side can summon and no Skill Card can target (GDD 4.1). */
  closedLanes: ClosedLane[];
  turnNumber: number;
  activeSide: Side;
  phase: "play" | "finished";
  sides: Record<Side, SideState>;
  units: UnitState[];
  nextId: number;
  result: BattleResult | null;
}

/** What a Card targets when it is played. */
export type Target = Data.TaggedEnum<{
  Lane: { readonly lane: number };
  Square: { readonly lane: number; readonly position: number };
  NoTarget: Record<never, never>;
}>;
export const Target = Data.taggedEnum<Target>();

export type Command = Data.TaggedEnum<{
  PlayCard: { readonly handIndex: number; readonly target: Target };
  EndTurn: Record<never, never>;
}>;
export const Command = Data.taggedEnum<Command>();

export type TargetRef =
  | { readonly _tag: "Unit"; readonly unitId: number }
  | { readonly _tag: "Hero"; readonly side: Side };

export type DamageSource =
  | "attack"
  | "retaliation"
  | "skill"
  | "burn"
  | "poison"
  | "lastBreath"
  | "suddenDeath"
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
  CountdownsTicked: {
    readonly side: Side;
    readonly countdowns: readonly number[];
  };
  CardDrawn: { readonly side: Side; readonly card: HandCard };
  CardPlayed: {
    readonly side: Side;
    readonly handIndex: number;
    readonly card: CardInstance;
    readonly target: Target;
  };
  UnitSummoned: { readonly unit: UnitSnapshot };
  RecallRolled: {
    readonly side: Side;
    readonly card: CardInstance;
    readonly success: boolean;
  };
  CountdownChanged: {
    readonly side: Side;
    readonly instanceId: number;
    readonly countdown: number;
  };
  /**
   * Sabotage (GDD 5.4): the summon of `unitId` made a card in the Hand of the
   * Hero of `side` later. `countdown` is the new Countdown of that card.
   */
  CardSabotaged: {
    readonly unitId: number;
    readonly side: Side;
    readonly instanceId: number;
    readonly countdown: number;
  };
  ArmorGained: {
    readonly unitId: number;
    readonly armor: number;
    readonly turns: number;
  };
  ArmorFaded: { readonly unitId: number };
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
    readonly crit: boolean;
    readonly blocked: boolean;
    /** The HP of the target after the damage. */
    readonly hp: number;
  };
  StatusApplied: {
    readonly unitId: number;
    readonly status:
      | "burn"
      | "freeze"
      | "poison"
      | "hobble"
      | "bleed"
      | "entangle";
    /** The Hobbled or Bleeding count after the hit. The other statuses do not use it. */
    readonly count?: number;
  };
  UnitDied: { readonly unitId: number };
  TurnEnded: { readonly side: Side };
  BattleEnded: { readonly result: BattleResult };
}>;
export const BattleEvent = Data.taggedEnum<BattleEvent>();

export type RuleViolation = Data.TaggedEnum<{
  BattleFinished: Record<never, never>;
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

export interface BattleSetup {
  readonly seed: number;
  readonly stage: StageDefinition;
  readonly player: PlayerSetup;
}
