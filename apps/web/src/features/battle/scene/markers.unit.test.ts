import { LANE_LENGTH, Target } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { BattleView, HeroView } from "@/features/battle/battle-view";
import { heroX, laneZ, squareX } from "@/features/battle/scene/layout";
import {
  markerOpacity,
  markerSpot,
  targetAt,
  toDevice,
  toScreen,
} from "@/features/battle/scene/markers";

const hero = (front: readonly number[]): HeroView => ({
  hp: 20,
  maxHp: 20,
  classId: "warrior",
  front,
  bossRules: [],
  hand: [],
  deck: 0,
  graveyard: [],
});

/** A Board of `lanes` Lanes, with the enemy Heroes of `fronts`. */
const board = (
  lanes: number,
  fronts: readonly (readonly number[])[] = [
    Array.from({ length: lanes }, (_, lane) => lane),
  ]
): Pick<BattleView, "lanes" | "sides"> => ({
  lanes,
  sides: {
    player: { heroes: [hero(fronts.flat())] },
    enemy: { heroes: fronts.map(hero) },
  },
});

describe("markerSpot", () => {
  it("marks a Square, or a whole Lane", () => {
    expect(
      markerSpot(Target.Square({ lane: 1, position: 3 }), board(2))
    ).toEqual({
      x: squareX(3),
      z: laneZ(1, 2),
      width: 0.96,
      depth: 0.98,
    });
    expect(markerSpot(Target.Lane({ lane: 0 }), board(2))).toEqual({
      x: 0,
      z: laneZ(0, 2),
      width: LANE_LENGTH,
      depth: 0.98,
    });
    expect(markerSpot(Target.NoTarget(), board(2))).toBeNull();
  });

  it("marks the ground under a Stage Hero, across all Lanes", () => {
    expect(
      markerSpot(Target.Hero({ side: "enemy", hero: 0 }), board(3))
    ).toEqual({
      x: heroX("enemy"),
      z: 0,
      width: 1.3,
      depth: laneZ(2, 3) - laneZ(0, 3) + 0.98,
    });
  });

  it("marks only the Front of a Boss in a Dungeon (GDD 11.2)", () => {
    const dungeon = board(4, [[0], [1, 2], [3]]);
    expect(
      markerSpot(Target.Hero({ side: "enemy", hero: 1 }), dungeon)
    ).toEqual({
      x: heroX("enemy"),
      z: (laneZ(1, 4) + laneZ(2, 4)) / 2,
      width: 1.3,
      depth: laneZ(2, 4) - laneZ(1, 4) + 0.98,
    });
    expect(
      markerSpot(Target.Hero({ side: "enemy", hero: 2 }), dungeon)
    ).toMatchObject({ z: laneZ(3, 4), depth: 0.98 });
  });

  it("marks all Lanes for a Hero with no Front, or a Hero that is not on the Board", () => {
    const allLanes = {
      x: heroX("enemy"),
      z: 0,
      width: 1.3,
      depth: laneZ(3, 4) - laneZ(0, 4) + 0.98,
    };
    const defeated = board(4, [[], [0, 1, 2, 3]]);
    expect(
      markerSpot(Target.Hero({ side: "enemy", hero: 0 }), defeated)
    ).toEqual(allLanes);
    expect(
      markerSpot(Target.Hero({ side: "enemy", hero: 5 }), defeated)
    ).toEqual(allLanes);
  });
});

describe("targetAt", () => {
  const targets = [Target.Lane({ lane: 0 }), Target.Lane({ lane: 1 })];

  it("reads the target index from the marker", () => {
    expect(targetAt(targets, { targetIndex: 1 })).toEqual(targets[1]);
    expect(targetAt(targets, { targetIndex: 5 })).toBeNull();
    expect(targetAt(targets, { targetIndex: "1" })).toBeNull();
    expect(targetAt(targets, {})).toBeNull();
    expect(targetAt(targets)).toBeNull();
  });
});

describe("markerOpacity", () => {
  it("shines on the focused marker and pulses on the others", () => {
    expect(markerOpacity(1, 1, 3)).toBe(0.95);
    expect(markerOpacity(0, 1, 0)).toBe(0.45);
    expect(markerOpacity(0, 1, Math.PI / 12)).toBeCloseTo(0.65);
  });

  it("clears the focused marker when a focus ring marks it", () => {
    expect(markerOpacity(1, 1, 3, true)).toBe(0);
    expect(markerOpacity(0, 1, 0, true)).toBe(0.45);
  });
});

describe("toDevice and toScreen", () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };

  it("converts between screen points and device coordinates", () => {
    expect(toDevice(100, 50, rect)).toEqual({ x: -1, y: 1 });
    expect(toDevice(300, 150, rect)).toEqual({ x: 1, y: -1 });
    expect(toScreen({ x: 0, y: 0 }, rect)).toEqual({ x: 200, y: 100 });
    expect(toScreen(toDevice(150, 75, rect), rect)).toEqual({ x: 150, y: 75 });
  });
});
