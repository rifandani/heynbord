/**
 * The share of the loss reward that a loss gives (Economy 2.1, ADR-0041). A
 * loss gives its Coin, XP and Essence only for the HP that the enemy Heroes
 * lost. Thus a Player who only ends the Turns until a loss gets about nothing.
 */

/** The HP that the enemy Heroes of a Battle lost, of their total maximum HP. */
export interface EnemyHeroDamage {
  /** 0 to `total`. */
  readonly lost: number;
  readonly total: number;
}

/**
 * The part of `lossReward` that a loss gives (ADR-0041): `lossReward` × the
 * share of the enemy Hero HP that was lost, rounded down. Stages and Dungeons
 * use it for Coin, XP and Essence.
 */
export const lossShare = (
  lossReward: number,
  { lost, total }: EnemyHeroDamage
): number => {
  if (total <= 0) {
    return 0;
  }
  const clamped = Math.min(Math.max(lost, 0), total);
  return Math.floor((lossReward * clamped) / total);
};
