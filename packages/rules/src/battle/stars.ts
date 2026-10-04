import type { BattleState } from "./types";

/** ★★★ needs a win before this Turn number (GDD 4.11). */
const FAST_WIN_TURN = 15;

/** The Stars of a finished Battle for the player: 0 for a loss, else 1 to 3 (GDD 4.11). */
export const starsFor = (state: BattleState): number => {
  if (state.result?.winner !== "player") {
    return 0;
  }
  const { hero } = state.sides.player;
  if (hero.hp * 2 < hero.maxHp) {
    return 1;
  }
  return state.turnNumber < FAST_WIN_TURN ? 3 : 2;
};
