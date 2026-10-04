import { describe, expect, it } from "vitest";

import { nextRandom, randomInt, rollBasisPoints, shuffle } from "./random";

const run = (seed: number) => {
  let state = seed;
  const values: number[] = [];
  for (let index = 0; index < 5; index += 1) {
    const [value, next] = nextRandom(state);
    values.push(value);
    state = next;
  }
  return values;
};

describe("nextRandom", () => {
  it("gives the same sequence from the same seed", () => {
    expect(run(42)).toEqual(run(42));
    expect(run(42)).not.toEqual(run(43));
  });

  it("gives unsigned 32-bit integers", () => {
    const [value] = nextRandom(-7);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(2 ** 32);
  });
});

describe("randomInt", () => {
  it("stays in [0, max) and moves the cursor", () => {
    const cursor = { state: 1 };
    for (let index = 0; index < 200; index += 1) {
      const value = randomInt(cursor, 6);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
    expect(cursor.state).not.toBe(1);
  });
});

describe("rollBasisPoints", () => {
  it("never succeeds at 0 and does not use a value", () => {
    const cursor = { state: 9 };
    expect(rollBasisPoints(cursor, 0)).toBe(false);
    expect(cursor.state).toBe(9);
  });

  it("always succeeds at 10000", () => {
    const cursor = { state: 9 };
    for (let index = 0; index < 50; index += 1) {
      expect(rollBasisPoints(cursor, 10_000)).toBe(true);
    }
  });

  it("succeeds about as often as the chance", () => {
    const cursor = { state: 123 };
    let hits = 0;
    for (let index = 0; index < 10_000; index += 1) {
      if (rollBasisPoints(cursor, 2500)) {
        hits += 1;
      }
    }
    expect(hits).toBeGreaterThan(2300);
    expect(hits).toBeLessThan(2700);
  });
});

describe("shuffle", () => {
  it("keeps all items and does not change the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const output = shuffle({ state: 5 }, input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(output.toSorted((a, b) => a - b)).toEqual(input);
  });

  it("is deterministic for a seed", () => {
    const input = ["a", "b", "c", "d", "e"];
    expect(shuffle({ state: 77 }, input)).toEqual(
      shuffle({ state: 77 }, input)
    );
  });
});
