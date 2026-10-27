/** A new Battle or Profile seed. The seed is input to the rules, so this is not a rule. */
export const randomSeed = (): number =>
  Math.floor(Math.random() * 2_147_483_647);
