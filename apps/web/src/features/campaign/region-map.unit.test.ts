import { STAGES } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { Box, RegionMap, Viewport } from "@/features/campaign/region-map";
import {
  boxesOverlap,
  MAP,
  mapFrame,
  markerBoxes,
  recordWin,
  regionMap,
  resultCoin,
  regionStars,
  smoothPath,
  trailStages,
  walkedLegs,
} from "@/features/campaign/region-map";

const hearthvaleMap = (): RegionMap => {
  const map = regionMap(1);
  if (!map) {
    throw new Error("Hearthvale has no Region Map");
  }
  return map;
};

const hearthvale = hearthvaleMap();

/** A box without the 6 px margin of `markerBoxes`. */
const inner = (box: Box): Box => ({
  left: box.left + 6,
  right: box.right - 6,
  top: box.top + 6,
  bottom: box.bottom - 6,
});

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe("regionMap", () => {
  it("has one stop and one leg for each Stage of Hearthvale", () => {
    const stages = STAGES.filter((stage) => stage.region === 1);
    expect(hearthvale.stops).toHaveLength(stages.length);
    expect(hearthvale.legs).toHaveLength(stages.length);
  });

  it("starts at the left edge and joins each leg to its stop", () => {
    expect(hearthvale.legs[0]?.[0]?.x).toBe(0);
    for (const [index, leg] of hearthvale.legs.entries()) {
      expect(leg.at(-1)).toEqual(hearthvale.stops[index]);
      if (index > 0) {
        expect(leg[0]).toEqual(hearthvale.stops[index - 1]);
      }
    }
  });

  it("keeps two clearings far apart: the painting has 144 units at the closest", () => {
    const { stops } = hearthvale;
    for (const [index, stop] of stops.entries()) {
      for (const other of stops.slice(index + 1)) {
        expect(distance(stop, other)).toBeGreaterThanOrEqual(140);
      }
    }
  });
});

describe("trailStages", () => {
  it("opens only the first Stage for a new Player", () => {
    const trail = trailStages(STAGES, 1, {});
    expect(trail.map((stop) => stop.state)).toEqual([
      "open",
      ...Array.from({ length: trail.length - 1 }, () => "locked"),
    ]);
    expect(trail[1]?.after?.id).toBe("1-1");
  });

  it("marks won Stages done with their Stars and opens the next one", () => {
    const trail = trailStages(STAGES, 1, { "1-1": 3, "1-2": 1 });
    expect(trail.slice(0, 4).map((stop) => stop.state)).toEqual([
      "done",
      "done",
      "open",
      "locked",
    ]);
    expect(regionStars(trail)).toEqual({ count: 4, total: 30 });
    expect(walkedLegs(trail)).toBe(2);
  });
});

describe("recordWin", () => {
  it("keeps the best Stars of a Stage", () => {
    const first = recordWin({}, "1-1", 2);
    expect(first).toEqual({ "1-1": 2 });
    expect(recordWin(first, "1-1", 1)).toBe(first);
    expect(recordWin(first, "1-1", 3)).toEqual({ "1-1": 3 });
  });
});

describe("resultCoin", () => {
  it("gives the Coin of the first win, a repeat win and a loss (Economy 2.1)", () => {
    expect(resultCoin(STAGES, {}, "1-1", true)).toBe(180);
    expect(resultCoin(STAGES, { "1-1": 2 }, "1-1", true)).toBe(60);
    expect(resultCoin(STAGES, { "1-1": 2 }, "1-1", false)).toBe(6);
    expect(resultCoin(STAGES, {}, "1-1", false)).toBe(6);
  });

  it("gives no Coin for a Stage that is not in the Campaign", () => {
    expect(resultCoin(STAGES, {}, "qa-stage", true)).toBe(0);
  });
});

describe("smoothPath", () => {
  it("goes through each point", () => {
    const path = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ]);
    expect(path.startsWith("M0 0")).toBe(true);
    expect(path).toContain(" 10 5 C");
    expect(path.endsWith(" 20 0")).toBe(true);
    expect(smoothPath([])).toBe("");
  });
});

/** A Region banner at the top left and a Star chest plate at the top right. */
const hud = (width: number, short: boolean): readonly Box[] => {
  const height = short ? 40 : 64;
  return [
    { left: 8, top: 8, right: 8 + (short ? 180 : 240), bottom: 8 + height },
    {
      left: width - 8 - (short ? 190 : 300),
      top: 8,
      right: width - 8,
      bottom: 8 + height,
    },
  ];
};

const SCREENS: readonly (readonly [string, number, number])[] = [
  ["4:3 laptop", 1024, 768],
  ["16:10 laptop", 1440, 900],
  ["16:9 desktop", 1920, 1080],
  ["21:9 monitor", 2560, 1080],
  ["phone in landscape", 844, 390],
  ["small phone in landscape", 667, 375],
];

describe("mapFrame", () => {
  it.each(SCREENS)(
    "keeps each Stage Marker on a %s screen, above the Town Bar and clear of the HUD",
    (_, width, height) => {
      const short = height <= 500;
      const viewport: Viewport = {
        width,
        height,
        top: 8,
        bottom: short ? 56 : 80,
        obstacles: hud(width, short),
      };
      const frame = mapFrame(hearthvale, viewport);
      const boxes = markerBoxes(hearthvale.stops, frame.scale).map((box) => ({
        left: box.left + frame.x,
        right: box.right + frame.x,
        top: box.top + frame.y,
        bottom: box.bottom + frame.y,
      }));
      // Two Stage Markers do not touch (the boxes include a 6 px margin).
      for (const [index, box] of boxes.entries()) {
        for (const other of boxes.slice(index + 1)) {
          expect(boxesOverlap(inner(box), inner(other))).toBe(false);
        }
      }
      // At least half of the Boss landmark stays in view, so the Player sees where the Trail goes.
      const hall = hearthvale.bossLandmark;
      expect(
        ((hall.top + hall.bottom) / 2) * frame.scale + frame.y
      ).toBeGreaterThanOrEqual(0);
      expect(hall.left * frame.scale + frame.x).toBeGreaterThanOrEqual(-0.5);
      expect(hall.right * frame.scale + frame.x).toBeLessThanOrEqual(
        width + 0.5
      );
      for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(-0.5);
        expect(box.right).toBeLessThanOrEqual(width + 0.5);
        expect(box.top).toBeGreaterThanOrEqual(7.5);
        expect(box.bottom).toBeLessThanOrEqual(height - viewport.bottom + 0.5);
        for (const piece of viewport.obstacles) {
          expect(boxesOverlap(box, piece)).toBe(false);
        }
      }
    }
  );

  it("covers a 21:9 screen with the painting", () => {
    const frame = mapFrame(hearthvale, {
      width: 2560,
      height: 1080,
      top: 8,
      bottom: 80,
      obstacles: hud(2560, false),
    });
    expect(frame.x).toBeLessThanOrEqual(0);
    expect(frame.x + MAP.width * frame.scale).toBeGreaterThanOrEqual(2560);
  });

  it("covers a 16:9 screen with the painting", () => {
    const frame = mapFrame(hearthvale, {
      width: 1920,
      height: 1080,
      top: 8,
      bottom: 80,
      obstacles: hud(1920, false),
    });
    expect(frame.x).toBeLessThanOrEqual(0);
    expect(frame.y).toBeLessThanOrEqual(0);
    expect(frame.x + MAP.width * frame.scale).toBeGreaterThanOrEqual(1920);
    expect(frame.y + MAP.height * frame.scale).toBeGreaterThanOrEqual(1080);
  });
});
