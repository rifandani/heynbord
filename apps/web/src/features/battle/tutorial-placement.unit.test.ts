import { describe, expect, it } from "vitest";

import { boxAround, placePanel } from "@/features/battle/tutorial-placement";

const bounds = { left: 8, top: 100, right: 1432, bottom: 740 };
const size = { width: 320, height: 200 };

describe("placePanel", () => {
  it("shows the panel above the anchor, centered, when there is space", () => {
    const anchor = { left: 600, top: 500, right: 840, bottom: 560 };
    expect(placePanel({ anchor, ...size, bounds, sides: ["above"] })).toEqual({
      left: 560,
      top: 286,
      side: "above",
      pointer: 160,
    });
  });

  it("lines up the panel with the left edge of the anchor", () => {
    const anchor = { left: 335, top: 760, right: 1100, bottom: 880 };
    const placement = placePanel({
      anchor,
      ...size,
      bounds,
      sides: ["above"],
      align: "start",
    });
    expect(placement?.left).toBe(335);
    // The middle of the anchor is to the right of the panel: the pointer stays near the corner.
    expect(placement?.pointer).toBe(296);
  });

  it("uses the next side when the first side has no space", () => {
    const anchor = { left: 200, top: 120, right: 480, bottom: 400 };
    const placement = placePanel({
      anchor,
      ...size,
      bounds,
      sides: ["above", "right"],
    });
    expect(placement).toEqual({
      left: 494,
      top: 160,
      side: "right",
      pointer: 100,
    });
  });

  it("uses the side with the most space when no side has space, and stays in the bounds", () => {
    const anchor = { left: 100, top: 150, right: 1300, bottom: 600 };
    const placement = placePanel({
      anchor,
      ...size,
      bounds,
      sides: ["above", "below"],
    });
    expect(placement?.side).toBe("below");
    expect(placement?.top).toBe(bounds.bottom - size.height);
  });

  it("uses a side that needs only a few more pixels", () => {
    // 6 pixels short below: the gap becomes smaller.
    const anchor = { left: 200, top: 300, right: 480, bottom: 532 };
    const placement = placePanel({
      anchor,
      ...size,
      bounds,
      sides: ["below", "right"],
    });
    expect(placement?.side).toBe("below");
    expect(placement?.top).toBe(bounds.bottom - size.height);
  });

  it("has no placement when a strict panel has no space", () => {
    const anchor = { left: 100, top: 150, right: 1300, bottom: 600 };
    expect(
      placePanel({
        anchor,
        ...size,
        bounds,
        sides: ["above", "below"],
        strict: true,
      })
    ).toBeNull();
  });

  it("keeps the panel in the screen at an edge", () => {
    const anchor = { left: 0, top: 400, right: 40, bottom: 440 };
    const placement = placePanel({ anchor, ...size, bounds, sides: ["above"] });
    expect(placement?.left).toBe(bounds.left);
    expect(placement?.pointer).toBe(24);
  });
});

describe("boxAround", () => {
  it("finds the smallest box around the points", () => {
    expect(
      boxAround([
        { x: 10, y: 50 },
        { x: 30, y: 20 },
      ])
    ).toEqual({ left: 10, top: 20, right: 30, bottom: 50 });
  });

  it("finds nothing with no points", () => {
    expect(boxAround([])).toBeNull();
  });
});
