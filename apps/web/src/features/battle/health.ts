/** True at one third of maximum HP or less. */
export const isAtLowHp = ({
  hp,
  maxHp,
}: {
  readonly hp: number;
  readonly maxHp: number;
}): boolean => hp * 3 <= maxHp;
