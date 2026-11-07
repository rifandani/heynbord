import { describe, expect, test } from "bun:test";

import type { ModelContract } from "../../apps/web/scripts/model-contract.ts";
import { contractProblems } from "./source-contract.ts";

const recorded: ModelContract = {
  min: [-0.3, 0, -0.2],
  max: [0.3, 0.985, 0.2],
  bones: [28],
  clips: [
    { name: "idle", duration: 2, keyframes: "aaa" },
    { name: "walk", duration: 1, keyframes: "bbb" },
  ],
};

describe("contractProblems", () => {
  test("an export that repeats the record has no problem", () => {
    expect(contractProblems(recorded, structuredClone(recorded))).toEqual([]);
  });

  test("the smallest change to a bound is a problem", () => {
    const current = { ...recorded, max: [0.3, 0.9850001, 0.2] };

    expect(contractProblems(recorded, current)).toEqual([
      "max: recorded 0.3,0.985,0.2, now 0.3,0.9850001,0.2",
    ]);
  });

  test("a different bone count is a problem", () => {
    const current = { ...recorded, bones: [29] };

    expect(contractProblems(recorded, current)).toEqual([
      "bones: recorded 28, now 29",
    ]);
  });

  test("a clip with a different duration is a problem", () => {
    const current = {
      ...recorded,
      clips: [
        { name: "idle", duration: 3, keyframes: "aaa" },
        { name: "walk", duration: 1, keyframes: "bbb" },
      ],
    };

    expect(contractProblems(recorded, current)).toEqual([
      "clips.idle.duration: recorded 2, now 3",
    ]);
  });

  test("a clip with different keyframes is a problem", () => {
    const current = {
      ...recorded,
      clips: [
        { name: "idle", duration: 2, keyframes: "aaa" },
        { name: "walk", duration: 1, keyframes: "ccc" },
      ],
    };

    expect(contractProblems(recorded, current)).toEqual([
      "clips.walk.keyframes: recorded bbb, now ccc",
    ]);
  });

  test("a missing clip is a problem", () => {
    const current = { ...recorded, clips: recorded.clips.slice(0, 1) };

    expect(contractProblems(recorded, current)).toEqual([
      "clips: recorded idle,walk, now idle",
    ]);
  });

  test("a different clip order is a problem", () => {
    const current = { ...recorded, clips: recorded.clips.toReversed() };

    expect(contractProblems(recorded, current)).toEqual([
      "clips: recorded idle,walk, now walk,idle",
    ]);
  });
});
