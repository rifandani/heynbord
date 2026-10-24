import type { EnemyHeroDamage } from "../content/loss-reward";
import type { BattleState } from "./types";

/**
 * The HP that the enemy Heroes lost in a Battle, of their total maximum HP
 * (ADR-0041). A Defeated Hero lost all its HP. All damage counts: from the
 * Player, Burn, Poison and Sudden Death.
 */
export const enemyHeroDamage = (state: BattleState): EnemyHeroDamage => {
  let lost = 0;
  let total = 0;
  for (const hero of state.sides.enemy.heroes) {
    lost += hero.maxHp - Math.max(hero.hp, 0);
    total += hero.maxHp;
  }
  return { lost, total };
};
