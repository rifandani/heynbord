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
