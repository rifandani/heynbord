import { describe, expect, it } from "vitest";

import type { FieldEffectView } from "@/features/battle/battle-view";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import {
  fieldAreas,
  fieldLabels,
  fieldParticles,
  fieldTiles,
} from "@/features/battle/scene/field-tiles";
import { laneZ, squareX } from "@/features/battle/scene/layout";

const blizzard: FieldEffectView = {
  id: 3,
  owner: "enemy",
  cardId: "mage.blizzard",
  lane: 0,
  position: 7,
  lanes: 3,
  columns: 2,
  damageType: "frost",
  turns: 2,
};

describe("fieldTiles", () => {
  it("tints each Square of the area in the Damage Type color, toward the player's Hero for the enemy", () => {
    const tiles = fieldTiles([blizzard], 3);
    expect(tiles).toHaveLength(6);
    expect(tiles.map((tile) => [tile.x, tile.z])).toContainEqual([
      squareX(6),
      laneZ(2, 3),
    ]);
    expect(tiles.every((tile) => tile.color === DAMAGE_COLORS.frost)).toBe(
      true
    );
  });

  it("gives a weaker tint with fewer hits left, and a tile for each of two Field Effects on one Square", () => {
    const [two] = fieldTiles([blizzard], 3);
    const [one] = fieldTiles([{ ...blizzard, turns: 1 }], 3);
    expect(one?.opacity).toBeLessThan(two?.opacity ?? 0);
    expect(fieldTiles([blizzard, { ...blizzard, id: 4 }], 3)).toHaveLength(12);
  });
});

describe("fieldAreas", () => {
  it("covers the full area to the edges of its Squares, also the gaps between Lanes, in the Damage Type color", () => {
    const [area] = fieldAreas([blizzard], 3);
    expect(area).toMatchObject({
      fieldId: 3,
      x: (squareX(7) + squareX(6)) / 2,
      z: laneZ(1, 3),
      width: 2,
      depth: laneZ(2, 3) - laneZ(0, 3) + 1,
      color: DAMAGE_COLORS.frost,
    });
  });

  it("is softer than the tiles, so the Units stay readable, and stronger with more hits left", () => {
    const [two] = fieldAreas([blizzard], 3);
    const [one] = fieldAreas([{ ...blizzard, turns: 1 }], 3);
    const [tile] = fieldTiles([blizzard], 3);
    expect(two?.opacity).toBeLessThan(tile?.opacity ?? 0);
    expect(one?.opacity).toBeLessThan(two?.opacity ?? 0);
    expect(tile?.opacity).toBeGreaterThanOrEqual(0.5);
  });
});

describe("fieldLabels", () => {
  it("puts the hits that are left in front of the area, where no Unit of the area stands", () => {
    const [label] = fieldLabels([blizzard], 3);
    expect(label).toMatchObject({
      fieldId: 3,
      text: "2",
      damageType: "frost",
      x: (squareX(7) + squareX(6)) / 2,
    });
    expect(label?.z).toBeGreaterThan(laneZ(2, 3) + 0.5);
  });
});

describe("fieldParticles", () => {
  const wildfire: FieldEffectView = {
    ...blizzard,
    id: 5,
    cardId: "mage.wildfire",
    lanes: 2,
    damageType: "fire",
  };

  it("lays the painted snow flat on each Square of a Blizzard, with snow over it", () => {
    const quads = fieldParticles([blizzard], 3, 1.2);
    const ground = quads.filter((quad) => quad.ground);
    expect(ground).toHaveLength(6);
    expect(ground.every((quad) => quad.slot === "field-snow")).toBe(true);
    expect(ground.map((quad) => [quad.x, quad.z])).toContainEqual([
      squareX(6),
      laneZ(2, 3),
    ]);
    const motes = quads.filter((quad) => !quad.ground);
    expect(motes.length).toBeGreaterThan(0);
    expect(motes.every((quad) => quad.slot === "frost-mote")).toBe(true);
  });

  it("gives a Wildfire burning ground and embers", () => {
    const quads = fieldParticles([wildfire], 3, 0.4);
    expect(quads.filter((quad) => quad.ground)).toHaveLength(4);
    expect(new Set(quads.map((quad) => quad.slot))).toEqual(
      new Set(["field-fire", "ember"])
    );
  });

  it("shows a weaker ground with fewer hits left", () => {
    const [two] = fieldParticles([blizzard], 3, 0, true);
    const [one] = fieldParticles([{ ...blizzard, turns: 1 }], 3, 0, true);
    expect(one?.opacity).toBeLessThan(two?.opacity ?? 0);
  });

  it("shows only the still ground with reduced motion", () => {
    const quads = fieldParticles([blizzard, wildfire], 3, 0.7, true);
    expect(quads).toHaveLength(10);
    expect(quads.every((quad) => quad.ground)).toBe(true);
    expect(fieldParticles([wildfire], 3, 0.1, true)).toEqual(
      fieldParticles([wildfire], 3, 0.9, true)
    );
  });

  it("shows nothing for a Damage Type with no Field Effect look", () => {
    expect(
      fieldParticles([{ ...blizzard, damageType: "lightning" }], 3, 0)
    ).toEqual([]);
  });
});
