import { LANE_LENGTH, Target } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { BattleView, HeroView } from "@/features/battle/battle-view";
import { heroX, laneZ, squareX } from "@/features/battle/scene/layout";
import {
  markerPaint,
  markerRing,
  markerSpot,
  targetAt,
  toDevice,
  toScreen,
} from "@/features/battle/scene/markers";

/** The smallest and the largest value of a ring on one axis of the Board. */
const axisSpan = (
  points: ArrayLike<number>,
  axis: 0 | 1
): readonly [number, number] => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let index = axis; index < points.length; index += 3) {
    const value = points[index] ?? 0;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return [min, max];
};

/** If a ring has a vertex in the middle of the Square, it is a solid plate. */
const hasMiddleVertex = (points: ArrayLike<number>): boolean => {
  for (let index = 0; index < points.length; index += 3) {
    if (
      Math.abs(points[index] ?? 0) < 1e-9 &&
      Math.abs(points[index + 1] ?? 0) < 1e-9
    ) {
      return true;
    }
  }
  return false;
};

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

describe("markerPaint", () => {
  it("gives the focused target a cream rim at full strength and more gold", () => {
    expect(markerPaint(1, 1, 3)).toEqual({ fill: 0.32, rim: 1 });
  });

  it("keeps the gold weak, and pulses the rim from 55% to 95%", () => {
    expect(markerPaint(0, 1, 0)).toEqual({ fill: 0.22, rim: 0.75 });
    expect(markerPaint(0, 1, Math.PI / 12).rim).toBeCloseTo(0.95);
    expect(markerPaint(0, 1, -Math.PI / 12).rim).toBeCloseTo(0.55);
  });

  it("holds the rim still with reduced motion", () => {
    expect(markerPaint(0, 1, Math.PI / 12, { reducedMotion: true })).toEqual({
      fill: 0.22,
      rim: 0.75,
    });
  });

  it("clears the focused marker when a focus ring marks it", () => {
    expect(markerPaint(1, 1, 3, { ringed: true })).toEqual({ fill: 0, rim: 0 });
    expect(markerPaint(0, 1, 0, { ringed: true })).toEqual({
      fill: 0.22,
      rim: 0.75,
    });
  });
});

describe("markerRing", () => {
  it("draws a rim of the given thickness around an open middle", () => {
    const points = markerRing(0.96, 0.98, 0.05).getAttribute("position").array;
    expect(points).toHaveLength(24 * 3);
    expect(axisSpan(points, 0)[0]).toBeCloseTo(-0.48);
    expect(axisSpan(points, 0)[1]).toBeCloseTo(0.48);
    expect(axisSpan(points, 1)[0]).toBeCloseTo(-0.49);
    expect(axisSpan(points, 1)[1]).toBeCloseTo(0.49);
    expect(hasMiddleVertex(points)).toBe(false);
  });

  it("is a solid plate when the rim is thicker than the Square", () => {
    const points = markerRing(1, 1, 0.6).getAttribute("position").array;
    expect(hasMiddleVertex(points)).toBe(true);
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
