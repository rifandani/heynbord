import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { getDungeon } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  DUNGEON_ART_FILE,
  dungeonArt,
  LIFT_ART,
  LIFT_BOX,
  LIFT_ROPE_FILE,
  STOP,
  stopArtId,
  stopBosses,
  UNPAINTED_DUNGEON_ART,
} from "@/features/dungeons/dungeon-art";
import type { DungeonArt } from "@/features/dungeons/dungeon-art";

const publicFile = (path: string) =>
  existsSync(fileURLToPath(new URL(`../../../public${path}`, import.meta.url)));

/** The height of the lift, in percent of the height of a stop (the lift is 2:3). */
const LIFT_HEIGHT = LIFT_BOX.width * 1.5 * STOP.ratio;

/** The outer edge of the cage of the lift, in percent of the width of a stop. */
const cageEdge = (side: "left" | "right") =>
  LIFT_BOX.left + (LIFT_ART.cage[side] / 100) * LIFT_BOX.width;

describe("dungeonArt", () => {
  it("uses each painting whose WebP file exists, and the code fallback for the others", () => {
    // SAFETY: the keys of `DUNGEON_ART_FILE` are exactly the `DungeonArt` ids (its Record type).
    for (const art of Object.keys(DUNGEON_ART_FILE) as DungeonArt[]) {
      expect(dungeonArt(art) === null, art).toBe(
        UNPAINTED_DUNGEON_ART.has(art)
      );
      expect(publicFile(DUNGEON_ART_FILE[art]), art).toBe(
        !UNPAINTED_DUNGEON_ART.has(art)
      );
    }
  });

  it("shows the fallback for an art that is marked unpainted", () => {
    // SAFETY: the set is a `Set` at run time. The test removes its entry again.
    const unpainted = UNPAINTED_DUNGEON_ART as Set<DungeonArt>;
    unpainted.add("stop-1");
    try {
      expect(dungeonArt("stop-1")).toBeNull();
    } finally {
      unpainted.delete("stop-1");
    }
    expect(dungeonArt("stop-1")).toBe(DUNGEON_ART_FILE["stop-1"]);
  });
});

describe("LIFT_ROPE_FILE", () => {
  it("uses a tile of the rope of the lift cut-out over the well", () => {
    expect(publicFile(LIFT_ROPE_FILE)).toBe(true);
  });
});

describe("LIFT_BOX", () => {
  it("fills the well of a stop between its 2 guide rails", () => {
    expect(cageEdge("left")).toBeCloseTo(STOP.rails.left, 6);
    expect(cageEdge("right")).toBeCloseTo(STOP.rails.right, 6);
  });

  it("stands the plank floor of the lift on the floor line of the stop", () => {
    expect(LIFT_BOX.top + (LIFT_ART.floor / 100) * LIFT_HEIGHT).toBeCloseTo(
      STOP.floor,
      6
    );
  });

  it("hangs the rope of the stop in line with the rope of the lift image", () => {
    // The rope that the game draws over the well must continue the rope of
    // the cut-out, which is not exactly over the middle of the cage.
    expect(LIFT_BOX.rope).toBeCloseTo(
      LIFT_BOX.left + (LIFT_ART.rope / 100) * LIFT_BOX.width,
      6
    );
    expect(LIFT_BOX.rope).toBeGreaterThan(STOP.rails.left);
    expect(LIFT_BOX.rope).toBeLessThan(STOP.rails.right);
  });
});

describe("stopBosses", () => {
  it("gives one mark for each Boss of each painted stop, from the left", () => {
    for (const number of [1, 2, 3]) {
      const marks = stopBosses(number);
      expect(marks, `Dungeon ${number}`).toHaveLength(
        getDungeon(`dungeon-${number}`).bosses.length
      );
      for (const mark of marks) {
        // The Boss stands in the lair (x 30 to 62, 13.2), on the floor line.
        expect(mark.x).toBeGreaterThan(30);
        expect(mark.x).toBeLessThan(62);
        expect(mark.top).toBeLessThan(mark.bottom);
        expect(mark.bottom).toBeLessThanOrEqual(STOP.floor + 2);
      }
      // Boss 1 stands at the left of Boss 2 (13.3).
      expect([...marks].map((mark) => mark.x)).toEqual(
        [...marks].map((mark) => mark.x).toSorted((a, b) => a - b)
      );
    }
  });

  it("gives no mark to a Dungeon whose stop is not painted", () => {
    expect(stopArtId(4)).toBeNull();
    expect(stopBosses(4)).toEqual([]);
  });
});
