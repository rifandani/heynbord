import type { DamageType, RaceId, RankId, Side } from "@workspace/rules";

/** Race colors (art direction 4.1). `light` and `dark` are shades of `main`. */
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
};

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
 * The color anchors of the effects atlas (web ADR-0009). A `fixed` atlas
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
} as const;
