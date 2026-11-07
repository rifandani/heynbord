import { describe, expect, test } from "bun:test";

import type { ExportedBone, ExportedMesh } from "./review/mesh-export.ts";
import { paletteOf, propsOf, regionBoxes } from "./spec-draft.ts";

const mesh = (
  region: string,
  vertices: readonly (readonly [number, number, number])[]
) => ({ region, vertices });

describe("regionBoxes", () => {
  test("measures each Body Region in the frame of the whole model", () => {
    const boxes = regionBoxes([
      mesh("torso", [
        [-0.5, 0, 0],
        [0.5, 2, 0],
      ]),
      mesh("head", [
        [0, 1.5, 0],
        [0.25, 2, 0],
      ]),
    ]);

    expect(boxes).toEqual({
      head: { x0: 0.5, x1: 0.75, y0: 0, y1: 0.25 },
      torso: { x0: 0, x1: 1, y0: 0, y1: 1 },
    });
  });

  test("rounds to 2 places, as the Unit Specs do", () => {
    const boxes = regionBoxes([
      mesh("torso", [
        [0, 0, 0],
        [3, 3, 0],
      ]),
      mesh("prop", [
        [1, 1, 0],
        [2, 2, 0],
      ]),
    ]);

    expect(boxes.prop).toEqual({ x0: 0.33, x1: 0.67, y0: 0.33, y1: 0.67 });
  });
});

const island = (
  part: string,
  region: string,
  bones: readonly string[]
): ExportedMesh => ({
  id: part,
  part,
  region,
  closed: true,
  vertices: [],
  normals: [],
  colors: [],
  indices: [],
  bones,
});
const bone = (id: string, parent: string | null): ExportedBone => ({
  id,
  parent,
  jointPos: [0, 0, 0],
});
const BONES = [
  bone("hips", null),
  bone("hand.R", "hips"),
  bone("hand.L", "hips"),
  bone("shield", "hand.L"),
];

describe("propsOf", () => {
  test("gives a prop the hand above its own bone", () => {
    expect(propsOf([island("shield", "prop", ["shield"])], BONES)).toEqual([
      { id: "shield", hand: "left", cameraSide: false, bone: "hand.L" },
    ]);
  });

  test("puts a prop in the right hand on the camera side", () => {
    expect(propsOf([island("sword", "prop", ["hand.R"])], BONES)).toEqual([
      { id: "sword", hand: "right", cameraSide: true, bone: "hand.R" },
    ]);
  });

  test("keeps the bone of a worn prop, and reads only the prop region", () => {
    const meshes = [
      island("quiver", "prop", ["hips"]),
      island("sleeve", "arm.L", ["hand.L"]),
    ];
    expect(propsOf(meshes, BONES)).toEqual([
      { id: "quiver", hand: "none", cameraSide: false, bone: "hips" },
    ]);
  });
});

describe("paletteOf", () => {
  test("reads the named colors of a build script", () => {
    expect(
      paletteOf(
        'SKIN = hex_color("#D9A17F")\nHAIR_LIGHT = hex_color("#55361f")\n'
      )
    ).toEqual({ hair_light: "#55361f", skin: "#d9a17f" });
  });

  test("ignores a color that is not at the top level of the script", () => {
    expect(paletteOf('    face.paint(x, hex_color("#9a4a3c"))\n')).toEqual({});
  });
});
