import type { BattleState, HandCard } from "@workspace/rules";

/** The Player's Side always has 1 Hero (ADR-0009), at this index. */
export const PLAYER_HERO = 0;

/** The Hand of the Player's Hero. */
export const playerHand = (state: BattleState): readonly HandCard[] =>
  state.sides.player.heroes[PLAYER_HERO]?.hand ?? [];
