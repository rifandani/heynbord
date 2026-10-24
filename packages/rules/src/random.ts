/**
 * Seeded random numbers for the Battle (ADR-0006). The state is one 32-bit
 * integer (mulberry32). All math is integer math, so every browser and a
 * server get the same sequence from the same Battle seed.
 */

/* oxlint-disable eslint/no-bitwise unicorn/prefer-math-trunc -- mulberry32 needs 32-bit integer ops; `| 0` wraps to int32, which `Math.trunc` does not, and ADR-0006 needs the exact sequence */
/** Returns the next unsigned 32-bit value and the next state. */
export const nextRandom = (state: number): readonly [number, number] => {
  const next = (state + 0x6d_2b_79_f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [(t ^ (t >>> 14)) >>> 0, next] as const;
};

/** A Battle seed as a 32-bit random state. */
export const seedState = (seed: number): number => seed | 0;
/* oxlint-enable eslint/no-bitwise unicorn/prefer-math-trunc */

/** A mutable cursor over a random state. The battle engine owns one per `step`. */
export interface RandomCursor {
  state: number;
}

/** An integer in `[0, max)`. `max` must be a positive integer. */
export const randomInt = (cursor: RandomCursor, max: number): number => {
  const [value, next] = nextRandom(cursor.state);
  cursor.state = next;
  return value % max;
};

/**
 * Rolls a chance in basis points (1% = 100). A chance of 0 or less never
 * succeeds and does not use a random value, so Gear at level 0 does not shift
 * the sequence.
 */
export const rollBasisPoints = (
  cursor: RandomCursor,
  chance: number
): boolean => {
  if (chance <= 0) {
    return false;
  }
  return randomInt(cursor, 10_000) < chance;
};

/** A new array with the items in a seeded random order (Fisher-Yates). */
export const shuffle = <A>(cursor: RandomCursor, items: readonly A[]): A[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInt(cursor, index + 1);
    // SAFETY: `index` is in `[1, length)` and `other` is in `[0, index]`, so
    // both read existing items; `noUncheckedIndexedAccess` cannot see that.
    const current = result[index] as A;
    // SAFETY: as above, `other` reads an existing item.
    result[index] = result[other] as A;
    result[other] = current;
  }
  return result;
};
