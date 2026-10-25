import { describe, expect, it } from "vitest";

import {
  clearSheetOrigin,
  placeSheetOrigin,
  SHEET_INK_MOTION,
  SHEET_MOTION,
  SHEET_PATH_MOTION,
} from "@/features/town/sheet-motion";

/** An overlay of `width` × `height` that keeps its CSS properties in a map. */
const fakeOverlay = (width: number, height: number) => {
  const properties = new Map<string, string>();
  const overlay = {
    clientWidth: width,
    clientHeight: height,
    style: {
      setProperty: (name: string, value: string) => {
        properties.set(name, value);
      },
      removeProperty: (name: string) => {
        properties.delete(name);
        return "";
      },
    },
  };
  // SAFETY: `placeSheetOrigin` and `clearSheetOrigin` read only these members.
  return { overlay: overlay as HTMLElement, properties };
};

/** A control whose box is at `left`, `top` with the size `width` × `height`. */
const fakeSource = (left: number, top: number, width: number, height: number) =>
  // SAFETY: `placeSheetOrigin` reads only `getBoundingClientRect`.
  ({
    getBoundingClientRect: () => ({ left, top, width, height }),
  }) as Element;

describe("placeSheetOrigin", () => {
  it("starts the sheet small on a control at the left, tilted toward the center", () => {
    const { overlay, properties } = fakeOverlay(1000, 800);
    // The center of the control is at (50, 100): 450 px left of and 300 px
    // above the center of the overlay.
    placeSheetOrigin(overlay, fakeSource(30, 80, 40, 40));
    expect(Object.fromEntries(properties)).toEqual({
      "--sheet-from-x": "-450px",
      "--sheet-from-y": "-300px",
      "--sheet-from-scale": "0.16",
      "--sheet-from-rotate": "6deg",
    });
  });

  it("tilts the other way for a control at the right", () => {
    const { overlay, properties } = fakeOverlay(1000, 800);
    placeSheetOrigin(overlay, fakeSource(900, 700, 50, 50));
    expect(properties.get("--sheet-from-x")).toBe("425px");
    expect(properties.get("--sheet-from-y")).toBe("325px");
    expect(properties.get("--sheet-from-rotate")).toBe("-6deg");
  });

  it("does nothing with no overlay or no source", () => {
    const { overlay, properties } = fakeOverlay(1000, 800);
    placeSheetOrigin(overlay, null);
    expect(properties.size).toBe(0);
    expect(() =>
      placeSheetOrigin(null, fakeSource(0, 0, 10, 10))
    ).not.toThrow();
  });
});

describe("clearSheetOrigin", () => {
  it("removes the start of the sheet, so it zooms in at the center", () => {
    const { overlay, properties } = fakeOverlay(1000, 800);
    placeSheetOrigin(overlay, fakeSource(30, 80, 40, 40));
    properties.set("--other", "1");
    clearSheetOrigin(overlay);
    expect(Object.fromEntries(properties)).toEqual({ "--other": "1" });
    expect(() => clearSheetOrigin(null)).not.toThrow();
  });
});

describe("sheet motion classes", () => {
  it("play the open and the reverse close of the sheet only with motion", () => {
    for (const classes of [SHEET_PATH_MOTION, SHEET_MOTION, SHEET_INK_MOTION]) {
      const parts = classes.split(" ");
      expect(parts).toHaveLength(2);
      expect(parts.every((part) => part.startsWith("motion-safe:"))).toBe(true);
      expect(parts[1]).toContain("reverse_both");
    }
  });
});
