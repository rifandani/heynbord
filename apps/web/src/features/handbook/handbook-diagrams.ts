import type { UnitIcon } from "@/features/battle/glyphs";

/**
 * The Lane strip diagrams of the Handbook (issue #25): a small, static part of
 * the Board, drawn in code. A strip has no text, so it works in each Locale.
 * The Entry text explains it.
 */
export type DiagramId =
  | "summonZone"
  | "front"
  | "movement"
  | "flying"
  | "knockback"
  | "trample"
  | "pivot"
  | "wall"
  | "ranged"
  | "firstStrike"
  | "dungeon";

export type DiagramSide = "player" | "enemy";

/** A Unit on the strip, drawn with the icon of its card (ADR-0029). */
export interface DiagramUnit {
  readonly lane: number;
  readonly column: number;
  readonly side: DiagramSide;
  readonly icon: UnitIcon;
  /** A Unit that dies in the diagram, for example to Trample. */
  readonly falls?: boolean;
}

/**
 * An arrow along a Lane, from the center of one Square to another. Column 0
 * is the player Hero, and the column after the last one is the enemy Hero.
 * `move`: Movement. `fly`: Flying, in an arc over the Units. `attack`: a melee
 * or a ranged hit. `push`: Knockback. `spill`: the second hit of Trample.
 * `summon`: a card from the Hero into a Square. `blocked`: a Movement that
 * stops before a Unit.
 */
export interface DiagramArrow {
  readonly lane: number;
  readonly from: number;
  readonly to: number;
  readonly kind:
    | "move"
    | "fly"
    | "attack"
    | "push"
    | "spill"
    | "summon"
    | "blocked";
  readonly side: DiagramSide;
  /** An arrow of an action that does not occur, for example an attack that First Strike stops. */
  readonly faint?: boolean;
}

/** Squares with a tint: a Summon Zone, or the Range of a Ranged Unit. */
export interface DiagramZone {
  readonly from: number;
  readonly to: number;
  readonly side: DiagramSide;
  /** `extra`: Columns that only a Unit with Wall can use. */
  readonly kind: "zone" | "extra" | "range";
}

export interface Diagram {
  readonly lanes: number;
  readonly columns: number;
  /**
   * The Fronts of the enemy Heroes, from Lane 0, one block of Lanes each. With
   * none, the enemy Hero stands behind all the Lanes (a Stage).
   */
  readonly enemyFronts?: readonly (readonly number[])[];
  readonly zones: readonly DiagramZone[];
  readonly units: readonly DiagramUnit[];
  readonly arrows: readonly DiagramArrow[];
}

/** One strip of 8 Squares: enough to show an action, small enough for one page. */
const SHORT = 8;

export const DIAGRAMS: Readonly<Record<DiagramId, Diagram>> = {
  // The two Summon Zones of a full Lane, and a summon from the Hero.
  summonZone: {
    lanes: 1,
    columns: 12,
    zones: [
      { from: 1, to: 3, side: "player", kind: "zone" },
      { from: 10, to: 12, side: "enemy", kind: "zone" },
    ],
    units: [
      { lane: 0, column: 2, side: "player", icon: "melee" },
      { lane: 0, column: 11, side: "enemy", icon: "melee" },
    ],
    arrows: [{ lane: 0, from: 0, to: 2, kind: "summon", side: "player" }],
  },
  // All Lanes are the Front of the enemy Hero: a Unit at the end of a Lane hits it.
  front: {
    lanes: 3,
    columns: 12,
    zones: [],
    units: [
      { lane: 0, column: 6, side: "player", icon: "melee" },
      { lane: 1, column: 12, side: "player", icon: "melee" },
      { lane: 2, column: 9, side: "enemy", icon: "melee" },
    ],
    arrows: [{ lane: 1, from: 12, to: 13, kind: "attack", side: "player" }],
  },
  // Speed 3: through a friendly Unit, and it stops before the enemy Unit.
  movement: {
    lanes: 1,
    columns: SHORT,
    zones: [],
    units: [
      { lane: 0, column: 2, side: "player", icon: "melee" },
      { lane: 0, column: 3, side: "player", icon: "melee" },
      { lane: 0, column: 6, side: "enemy", icon: "melee" },
    ],
    arrows: [
      { lane: 0, from: 2, to: 5, kind: "move", side: "player" },
      { lane: 0, from: 5, to: 6, kind: "attack", side: "player" },
    ],
  },
  // Over the enemy Unit, into an empty Square.
  flying: {
    lanes: 1,
    columns: SHORT,
    zones: [],
    units: [
      { lane: 0, column: 2, side: "player", icon: "flying" },
      { lane: 0, column: 3, side: "enemy", icon: "melee" },
    ],
    arrows: [{ lane: 0, from: 2, to: 5, kind: "fly", side: "player" }],
  },
  // A hit, then the enemy Unit goes back toward its own Hero.
  knockback: {
    lanes: 1,
    columns: SHORT,
    zones: [],
    units: [
      { lane: 0, column: 4, side: "player", icon: "melee" },
      { lane: 0, column: 5, side: "enemy", icon: "melee" },
    ],
    arrows: [
      { lane: 0, from: 4, to: 5, kind: "attack", side: "player" },
      { lane: 0, from: 5, to: 7, kind: "push", side: "player" },
    ],
  },
  // The first enemy Unit dies, and the damage that is left hits the next one.
  trample: {
    lanes: 1,
    columns: SHORT,
    zones: [],
    units: [
      { lane: 0, column: 3, side: "player", icon: "melee" },
      { lane: 0, column: 4, side: "enemy", icon: "melee", falls: true },
      { lane: 0, column: 5, side: "enemy", icon: "melee" },
    ],
    arrows: [
      { lane: 0, from: 3, to: 4, kind: "attack", side: "player" },
      { lane: 0, from: 4, to: 5, kind: "spill", side: "player" },
    ],
  },
  // It attacks the enemy Unit behind it before the Unit in front.
  pivot: {
    lanes: 1,
    columns: SHORT,
    zones: [],
    units: [
      { lane: 0, column: 3, side: "enemy", icon: "melee" },
      { lane: 0, column: 4, side: "player", icon: "melee" },
      { lane: 0, column: 5, side: "enemy", icon: "melee" },
    ],
    arrows: [{ lane: 0, from: 4, to: 3, kind: "attack", side: "player" }],
  },
  // A Wall in Column 5 stops an enemy Unit. Columns 4 and 5 are only for a Wall.
  wall: {
    lanes: 1,
    columns: SHORT,
    zones: [
      { from: 1, to: 3, side: "player", kind: "zone" },
      { from: 4, to: 5, side: "player", kind: "extra" },
    ],
    units: [
      { lane: 0, column: 5, side: "player", icon: "wall" },
      { lane: 0, column: 8, side: "enemy", icon: "melee" },
    ],
    arrows: [{ lane: 0, from: 8, to: 6, kind: "blocked", side: "enemy" }],
  },
  // Range 3: the nearest enemy Unit in Range, and no Movement.
  ranged: {
    lanes: 1,
    columns: SHORT,
    zones: [{ from: 3, to: 5, side: "player", kind: "range" }],
    units: [
      { lane: 0, column: 2, side: "player", icon: "ranged" },
      { lane: 0, column: 5, side: "enemy", icon: "melee" },
      { lane: 0, column: 7, side: "enemy", icon: "melee" },
    ],
    arrows: [{ lane: 0, from: 2, to: 5, kind: "attack", side: "player" }],
  },
  // The attacked Unit hits first. The attack of the enemy does not occur if the enemy dies.
  firstStrike: {
    lanes: 1,
    columns: SHORT,
    zones: [],
    units: [
      { lane: 0, column: 4, side: "player", icon: "melee" },
      { lane: 0, column: 5, side: "enemy", icon: "melee", falls: true },
    ],
    arrows: [
      { lane: 0, from: 4, to: 5, kind: "attack", side: "player" },
      { lane: 0, from: 5, to: 4, kind: "attack", side: "enemy", faint: true },
    ],
  },
  // Dungeon 1: 2 Bosses on 4 Lanes, each with a Front of 2 Lanes. A Unit at
  // the end of Lane 3 hits the Boss of the lower Front.
  dungeon: {
    lanes: 4,
    columns: SHORT,
    enemyFronts: [
      [0, 1],
      [2, 3],
    ],
    zones: [],
    units: [
      { lane: 0, column: 3, side: "player", icon: "melee" },
      { lane: 2, column: SHORT, side: "player", icon: "melee" },
      { lane: 1, column: 6, side: "enemy", icon: "melee" },
    ],
    arrows: [
      { lane: 2, from: SHORT, to: SHORT + 1, kind: "attack", side: "player" },
    ],
  },
};
