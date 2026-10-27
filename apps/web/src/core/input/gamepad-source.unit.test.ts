import { describe, expect, it } from "vitest";

import type { BrowserPad } from "@/core/input/gamepad-source";
import { standardPad } from "@/core/input/gamepad-source";

const pad = (overrides: Partial<BrowserPad> = {}): BrowserPad => ({
  index: 0,
  id: "Xbox Wireless Controller",
  mapping: "standard",
  buttons: [
    { pressed: true, value: 1 },
    { pressed: false, value: 0 },
  ],
  axes: [0.5, -0.25],
  ...overrides,
});

describe("standardPad", () => {
  it("takes the first pad in standard mapping", () => {
    const first = pad({ index: 0, id: "First" });
    const second = pad({ index: 1, id: "Second" });
    expect(standardPad([first, second])?.id).toBe("First");
    expect(standardPad([null, second])?.id).toBe("Second");
  });

  it("ignores a pad that the browser did not map to standard", () => {
    expect(standardPad([pad({ mapping: "" })])).toBeNull();
    expect(standardPad([])).toBeNull();
    expect(standardPad([null])).toBeNull();
  });

  it("copies the buttons and the axes, so a later frame does not change them", () => {
    const buttons = [{ pressed: true, value: 1 }];
    const axes = [0.5, -0.25, 0, 0];
    const snapshot = standardPad([pad({ buttons, axes })]);
    expect(snapshot).toMatchObject({
      index: 0,
      id: "Xbox Wireless Controller",
      mapping: "standard",
      buttons: [{ pressed: true, value: 1 }],
      axes: [0.5, -0.25, 0, 0],
    });
    expect(snapshot?.buttons[0]).not.toBe(buttons[0]);
    expect(snapshot?.axes).not.toBe(axes);
  });
});
