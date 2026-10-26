import type { DamageType, RaceId, RankId, Side } from "@workspace/rules";

/**
 * The Heynbord Design System game palette (DESIGN.md, Game colors).
 *
 * This module is the source of truth for the colors that come from game data
 * (Race, Rank, Damage Type, Side, Status and stat deltas) and for the one
 * canvas color that a browser tag needs. The Tailwind names in
 * `globals.css` mirror the fixed ones, so a component outside the Battle can
 * use `text-rank-rare` or `bg-damage-fire` without importing this file. The
 * 3D scene needs the raw strings, so it reads them here.
 *
 * Race colors (art direction 4.1). `light` and `dark` are shades of `main`.
 */
export const RACE_COLORS: Readonly<
  Record<
    RaceId,
    {
      readonly main: string;
      readonly second: string;
      readonly light: string;
      readonly dark: string;
    }
  >
> = {
  human: {
    main: "#2f5bd3",
    second: "#e3b341",
    light: "#6f93ee",
    dark: "#1a3277",
  },
  elf: {
    main: "#4c9a3b",
    second: "#7a4e2a",
    light: "#86c86f",
    dark: "#285520",
  },
  undead: {
    main: "#5fb3a8",
    second: "#ece4d0",
    light: "#9ad9cf",
    dark: "#2c6660",
  },
  orc: {
    main: "#d9661f",
    second: "#8e1f1f",
    light: "#f39a55",
    dark: "#7d3209",
  },
  goblin: {
    main: "#b8893a",
    second: "#8fc93a",
    light: "#dbb46e",
    dark: "#4a4a48",
  },
  feral: {
    main: "#6b5e93",
    second: "#eaf2f8",
    light: "#9d92c4",
    dark: "#372f54",
  },
};

/** Rank gem colors (art direction 4.2). The UI also shows pips, never only the color. */
export const RANK_COLORS: Readonly<Record<RankId, string>> = {
  common: "#a3a8ae",
  uncommon: "#34c27a",
  rare: "#3d7df0",
  epic: "#a45ee5",
  legendary: "#f59331",
};

/** Damage Type colors (art direction 4.3). The UI also shows an icon. */
export const DAMAGE_COLORS: Readonly<Record<DamageType, string>> = {
  physical: "#ffffff",
  fire: "#ff6a33",
  frost: "#8fd8ff",
  holy: "#ffd75a",
  // Electric cyan: not the gold of Holy, not the pale blue of Frost and not
  // the purple of the Epic gem (#66).
  lightning: "#3ff2e0",
};

/**
 * The neutral color of a Skill Card cast: the Wind-up of all Classes, and an
 * effect that has no color of its own. Gold is only for Holy damage.
 */
export const CAST_COLOR = "#fff6df";

/** A heal: its number and its effect. */
export const HEAL_COLOR = "#7ef29a";

/** The sparks of a Blocked hit: grey, because the Block took the damage. */
export const BLOCKED_HIT = "#a3a8ae";

/** Attack and HP on a Unit. White when equal to the summon value, red when lower, green when higher. */
export const STAT_DELTA: Readonly<Record<"same" | "down" | "up", string>> = {
  same: "#ffffff",
  down: "#ff7a6b",
  up: "#4ade80",
};

/** The bar between Attack and HP on a Unit. */
export const STAT_PIPE = "#fff6df";

/** The Side color of a Hero: the panel border and the ground ring. */
export const SIDE_COLORS: Readonly<
  Record<
    Side,
    { readonly main: string; readonly light: string; readonly dark: string }
  >
> = {
  player: { main: "#f2c14e", light: "#ffe29a", dark: "#8a5a12" },
  enemy: { main: "#d9463b", light: "#f08a80", dark: "#6b1610" },
};

/**
 * The color anchors of the effects atlas (web ADR-0008). A `fixed` atlas
 * image has its middle tone on its anchor. The icon anchors are lighter than
 * the slot colors of the same Status, because the icons are on a dark plate.
 */
export const FX_ANCHORS = {
  holy: "#ffd75a",
  fire: "#ff6a33",
  vine: "#4c9a3b",
  chain: "#4a4a48",
  shield: "#9cc8ff",
  frost: "#8fd8ff",
  poison: "#9ccf3a",
  blood: "#8e1f1f",
  dust: "#b39a76",
  iconBurn: "#ff6a33",
  iconFreeze: "#8fd8ff",
  iconPoison: "#9ccf3a",
  iconEntangle: "#6fbf55",
  iconHobble: "#a3a8ae",
  iconBleed: "#d0453a",
  iconWard: "#ffe08a",
  iconSteadfast: "#f2b552",
  iconExposed: "#ff6fa0",
  iconParalyze: "#3ff2e0",
  iconGrounded: "#d9a066",
} as const;

/**
 * Ward (GDD 4.7) is Holy protection: its badge ring, its "−N" and its shield
 * flash use the Holy gold.
 */
export const WARD_COLOR = "#ffd75a";

/** The metal of each Coin denomination: face, rim and mark (light from the upper left). */
export const COIN_METALS: Readonly<
  Record<
    "gold" | "silver" | "copper",
    { readonly face: string; readonly rim: string; readonly mark: string }
  >
> = {
  gold: { face: "#f2c14e", rim: "#8a5a20", mark: "#fff1b8" },
  silver: { face: "#d9dee6", rim: "#5e6672", mark: "#ffffff" },
  copper: { face: "#d9844a", rim: "#7a3a17", mark: "#f8c49c" },
};

/** The Essence drop and the Heynstone gem, in the same face/rim/mark metals. */
export const ESSENCE_METAL = {
  face: "#ff8fb8",
  rim: "#8f2a55",
  mark: "#fff6df",
} as const;

export const HEYNSTONE_METAL = {
  face: "#8c8cff",
  rim: "#2f2f8f",
  mark: "#fff6df",
} as const;

/** The surface under a denomination letter. */
export type CoinTone = "dark" | "light";

/**
 * The text color of each denomination letter (AA contrast): the bright metal
 * on a dark surface (a wood button, a Night Plate, the engraved plate of an
 * upgrade that is off), and the dark metal of the coin on a light surface (a
 * gold button, parchment).
 */
export const DENOMINATION_TEXT: Readonly<
  Record<CoinTone, Readonly<Record<"gold" | "silver" | "copper", string>>>
> = {
  dark: { gold: "#ffd75a", silver: "#d9dee6", copper: "#f8c49c" },
  light: { gold: "#7a5310", silver: "#3f454f", copper: "#7a3a17" },
};

/**
 * The application canvas (`night-plate`). The HTML meta tags of the document
 * need a literal color, so they read it here.
 */
export const CANVAS_COLOR = "#1c140e";
