import type { StageDefinition } from "@workspace/rules";
import { CAMPAIGN_REGIONS, STAGES } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { Box, RegionMap, Viewport } from "@/features/campaign/region-map";
import {
  boxesOverlap,
  chestState,
  MAP,
  FIT_STRETCH,
  MAX_STRETCH,
  mapFrame,
  markerBoxes,
  regionMap,
  regionStarTotal,
  regionStatus,
  shownRegionMap,
  smoothPath,
  trailStages,
  wakeUpStage,
  walkedLegs,
} from "@/features/campaign/region-map";

const paintedMap = (region: number): RegionMap => {
  const map = regionMap(region);
  if (!map) {
    throw new Error(`Region ${region} has no Region Map`);
  }
  return map;
};

const hearthvale = paintedMap(1);

/** Each Region Map, with the name of its Region for the test names. */
const MAPS = Array.from({ length: CAMPAIGN_REGIONS }, (_, index) => {
  const map = paintedMap(index + 1);
  return [`Region ${map.region}`, map] as const;
});

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
  it.each(MAPS)("has one stop and one leg for each Stage of %s", (_, map) => {
    const stages = STAGES.filter((stage) => stage.region === map.region);
    // A Region with no Stages yet gets the 10 Stages of each Region.
    const count = stages.length > 0 ? stages.length : 10;
    expect(map.stops).toHaveLength(count);
    expect(map.legs).toHaveLength(count);
  });

  it.each(MAPS)(
    "starts %s at the left edge and joins each leg to its stop",
    (_, map) => {
      expect(map.legs[0]?.[0]?.x).toBe(0);
      for (const [index, leg] of map.legs.entries()) {
        expect(leg.at(-1)).toEqual(map.stops[index]);
        if (index > 0) {
          expect(leg[0]).toEqual(map.stops[index - 1]);
        }
      }
    }
  );

  it.each(MAPS)(
    "keeps two clearings of %s far apart: Hearthvale has 144 units at the closest",
    (_, map) => {
      const { stops } = map;
      for (const [index, stop] of stops.entries()) {
        for (const other of stops.slice(index + 1)) {
          expect(distance(stop, other)).toBeGreaterThanOrEqual(140);
        }
      }
    }
  );
});

describe("shownRegionMap", () => {
  it("has a Region Map or a placeholder for each Region", () => {
    for (let region = 1; region <= CAMPAIGN_REGIONS; region += 1) {
      expect(shownRegionMap(region).region).toBe(region);
    }
  });

  it("puts the Trail of Hearthvale on a plain ground for a Region with no painting", () => {
    const maps = { 1: hearthvale, 2: null };
    const placeholder = shownRegionMap(2, maps);
    expect(regionMap(2, maps)).toBeNull();
    expect(placeholder.region).toBe(2);
    expect(placeholder.image).toBeNull();
    expect(placeholder.stops).toEqual(hearthvale.stops);
    expect(placeholder.legs).toEqual(hearthvale.legs);
  });
});

/** Region 1 and Region 2 with 2 Stages each, the second a Boss Stage. */
const twoRegions = [1, 2].flatMap((region) =>
  [1, 2].map((number) => {
    const stage = STAGES.find((item) => item.region === 1);
    if (!stage) {
      throw new Error("No Stage in Region 1");
    }
    return {
      ...stage,
      id: `${region}-${number}`,
      region,
      number,
      boss: number === 2,
    } satisfies StageDefinition;
  })
);

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
    expect(regionStarTotal(trail)).toBe(30);
    expect(walkedLegs(trail)).toBe(2);
  });

  it("keeps all the Stages of a locked Region locked, after the Boss Stage before it", () => {
    const trail = trailStages(twoRegions, 2, { "1-1": 3 });
    expect(trail.map((stop) => stop.state)).toEqual(["locked", "locked"]);
    expect(trail.map((stop) => stop.after?.id)).toEqual(["1-2", "2-1"]);
  });

  it("opens the first Stage of a Region after the win of the Boss Stage before it", () => {
    const trail = trailStages(twoRegions, 2, { "1-1": 3, "1-2": 1 });
    expect(trail.map((stop) => stop.state)).toEqual(["open", "locked"]);
    expect(trail[0]?.after).toBeNull();
  });
});

describe("wakeUpStage", () => {
  it("wakes up nothing at the first show, and knows the Open Stages of all Regions", () => {
    const wake = wakeUpStage(twoRegions, 1, { "1-1": 3, "1-2": 1 }, null);
    expect(wake.awaken).toBeNull();
    expect([...wake.seen]).toEqual(["2-1"]);
  });

  it("wakes up the Stage that a win opened, one time", () => {
    const before = wakeUpStage(twoRegions, 1, {}, null);
    const won = { "1-1": 3 };
    const wake = wakeUpStage(twoRegions, 1, won, before.seen);
    expect(wake.awaken).toBe("1-2");
    expect(wakeUpStage(twoRegions, 1, won, wake.seen).awaken).toBeNull();
  });

  it("wakes up Stage 1 of a Region that the Boss win unlocked, after a change of Region", () => {
    const before = wakeUpStage(twoRegions, 1, { "1-1": 3 }, null);
    const won = { "1-1": 3, "1-2": 1 };
    // Back to the Campaign: the Region of the Boss has no Open Stage now.
    const region1 = wakeUpStage(twoRegions, 1, won, before.seen);
    expect(region1.awaken).toBeNull();
    const region2 = wakeUpStage(twoRegions, 2, won, region1.seen);
    expect(region2.awaken).toBe("2-1");
    // Back to Region 2 again: it does not wake up again.
    const again = wakeUpStage(twoRegions, 1, won, region2.seen);
    expect(wakeUpStage(twoRegions, 2, won, again.seen).awaken).toBeNull();
  });

  it("does not wake up a seen Stage when the Player moves between Regions", () => {
    const results = { "1-1": 3, "1-2": 1, "2-1": 2 };
    const first = wakeUpStage(twoRegions, 1, results, null);
    const region2 = wakeUpStage(twoRegions, 2, results, first.seen);
    expect(region2.awaken).toBeNull();
    const region1 = wakeUpStage(twoRegions, 1, results, region2.seen);
    expect(region1.awaken).toBeNull();
  });

  it("does not wake up a Stage in a Region with no Open Stage", () => {
    const seen = new Set<string>();
    const wake = wakeUpStage(twoRegions, 2, { "1-1": 3 }, seen);
    expect(wake.awaken).toBeNull();
    expect(wake.seen).toBe(seen);
  });
});

describe("regionStatus", () => {
  it("is open for Region 1 and for a Region after a won Boss Stage", () => {
    expect(regionStatus(twoRegions, 1, {})).toEqual({ kind: "open" });
    expect(regionStatus(twoRegions, 2, { "1-2": 1 })).toEqual({
      kind: "open",
    });
  });

  it("is locked with the Boss Stage to win before that", () => {
    const status = regionStatus(twoRegions, 2, { "1-1": 3 });
    expect(status.kind === "locked" && status.boss.id).toBe("1-2");
  });

  it("is later for a Region with no Stages yet", () => {
    expect(regionStatus(twoRegions, 3, { "1-2": 1, "2-2": 1 })).toEqual({
      kind: "later",
    });
  });
});

describe("chestState", () => {
  const nineStages = Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [`1-${index + 1}`, 1])
  );

  it("is closed while the Region has fewer Stars than the chest", () => {
    expect(
      chestState({ stageResults: nineStages, claimedStarChests: {} }, 1, 10)
    ).toBe("closed");
  });

  it("is claimable with the Stars of the Region, and only that Region", () => {
    const results = { ...nineStages, "1-10": 1 };
    expect(
      chestState({ stageResults: results, claimedStarChests: {} }, 1, 10)
    ).toBe("claimable");
    expect(
      chestState({ stageResults: results, claimedStarChests: {} }, 1, 20)
    ).toBe("closed");
    expect(
      chestState({ stageResults: results, claimedStarChests: {} }, 2, 10)
    ).toBe("closed");
  });

  it("stays claimed after the claim", () => {
    const profile = {
      stageResults: { ...nineStages, "1-10": 1 },
      claimedStarChests: { "1": [10] },
    };
    expect(chestState(profile, 1, 10)).toBe("claimed");
    expect(chestState(profile, 2, 10)).toBe("closed");
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
  ["wide browser window", 1916, 967],
  ["21:9 monitor", 2560, 1080],
  ["phone in landscape", 844, 390],
  ["small phone in landscape", 667, 375],
];

/** Each Region Map on each screen. */
const MAP_SCREENS = MAPS.flatMap(([name, map]) =>
  SCREENS.map(
    ([screen, width, height]) => [name, screen, map, width, height] as const
  )
);

describe("mapFrame", () => {
  it.each(MAP_SCREENS)(
    "keeps each Stage Marker of %s on a %s screen, above the Town Bar and clear of the HUD",
    (_, __, map, width, height) => {
      const short = height <= 500;
      const viewport: Viewport = {
        width,
        height,
        top: 8,
        bottom: short ? 56 : 80,
        obstacles: hud(width, short),
      };
      const frame = mapFrame(map, viewport);
      const boxes = markerBoxes(map.stops, frame.scale, frame.stretch).map(
        (box) => ({
          left: box.left + frame.x,
          right: box.right + frame.x,
          top: box.top + frame.y,
          bottom: box.bottom + frame.y,
        })
      );
      // Two Stage Markers do not touch (the boxes include a 6 px margin).
      for (const [index, box] of boxes.entries()) {
        for (const other of boxes.slice(index + 1)) {
          expect(boxesOverlap(inner(box), inner(other))).toBe(false);
        }
      }
      // At least half of the Boss landmark stays in view, so the Player sees where the Trail goes.
      const hall = map.bossLandmark;
      expect(
        ((hall.top + hall.bottom) / 2) * frame.scale + frame.y
      ).toBeGreaterThanOrEqual(0);
      expect(
        hall.left * frame.scale * frame.stretch + frame.x
      ).toBeGreaterThanOrEqual(-0.5);
      expect(
        hall.right * frame.scale * frame.stretch + frame.x
      ).toBeLessThanOrEqual(width + 0.5);
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

  it.each(MAP_SCREENS.filter((screen) => screen[4] > 500))(
    "%s: the painting covers a %s screen above the Town Bar, with a small stretch",
    (_, __, map, width, height) => {
      const frame = mapFrame(map, {
        width,
        height,
        top: 8,
        bottom: 80,
        obstacles: hud(width, false),
      });
      expect(frame.x).toBeLessThanOrEqual(0.5);
      expect(frame.y).toBeLessThanOrEqual(0.5);
      expect(
        frame.x + MAP.width * frame.scale * frame.stretch
      ).toBeGreaterThanOrEqual(width - 0.5);
      expect(frame.y + MAP.height * frame.scale).toBeGreaterThanOrEqual(
        height - 80 - 0.5
      );
      expect(frame.stretch).toBeLessThanOrEqual(1 + FIT_STRETCH);
      expect(frame.stretch).toBeGreaterThanOrEqual(1 / (1 + MAX_STRETCH));
    }
  );

  it("stretches the painting no more than 10% on a 16:9 to 2:1 screen", () => {
    for (const [width, height] of [
      [1920, 1080],
      [1916, 967],
      [1440, 900],
    ] as const) {
      const frame = mapFrame(hearthvale, {
        width,
        height,
        top: 8,
        bottom: 80,
        obstacles: hud(width, false),
      });
      expect(frame.stretch).toBeLessThanOrEqual(1 + MAX_STRETCH + 1e-9);
    }
  });

  it("shows all of the painting above the Town Bar of a 16:9 screen", () => {
    const frame = mapFrame(hearthvale, {
      width: 1920,
      height: 1080,
      top: 8,
      bottom: 80,
      obstacles: hud(1920, false),
    });
    expect(frame.x).toBeCloseTo(0);
    expect(frame.y).toBeCloseTo(0);
    expect(MAP.width * frame.scale * frame.stretch).toBeCloseTo(1920);
    expect(MAP.height * frame.scale).toBeCloseTo(1000);
  });
});
