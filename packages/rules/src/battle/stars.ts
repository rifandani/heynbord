import type { StageDefinition } from "../content/schema";
import type { BattleState } from "./types";

/**
 * The Stars of a finished Stage Battle for the player: 0 for a loss, else 1
 * to 3. 3 Stars need a win before the Star Turn of the Stage (GDD 4.11,
 * ADR-0045).
 */
export const starsFor = (
  state: BattleState,
  stage: Pick<StageDefinition, "starTurn">
): number => {
  if (state.result?.winner !== "player") {
    return 0;
  }
  // The Player's Side always has 1 Hero.
  const [hero] = state.sides.player.heroes;
  if (!hero) {
    return 0;
  }
  if (hero.hp * 2 < hero.maxHp) {
    return 1;
  }
  return state.turnNumber < stage.starTurn ? 3 : 2;
};
