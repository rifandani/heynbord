import { describe, expect, it } from "vitest";

import { padFamily, padLabels } from "@/core/input/pad-family";

describe("padFamily", () => {
  it("reads an Xbox pad", () => {
    expect(
      padFamily(
        "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)"
      )
    ).toBe("xbox");
    expect(padFamily("Xbox Series X Controller")).toBe("xbox");
  });

  it("reads a PlayStation pad", () => {
    expect(
      padFamily(
        "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)"
      )
    ).toBe("playstation");
    expect(padFamily("DualSense Wireless Controller")).toBe("playstation");
    expect(padFamily("DualShock 4")).toBe("playstation");
  });

  it("gives the generic family to an unknown pad", () => {
    expect(padFamily("8BitDo Pro 2")).toBe("generic");
    expect(padFamily("")).toBe("generic");
  });

  it("does not give a family to a Switch Pro Controller", () => {
    expect(padFamily("Pro Controller")).toBe("generic");
    expect(padFamily("Nintendo Switch Pro Controller")).toBe("generic");
  });
});

describe("padLabels", () => {
  it("names the Xbox buttons", () => {
    expect(padLabels("xbox")).toMatchObject({
      south: "A",
      east: "B",
      west: "X",
      north: "Y",
      l1: "LB",
      r1: "RB",
      l2: "LT",
      r2: "RT",
      start: "Menu",
      select: "View",
    });
  });

  it("names the PlayStation buttons by their symbols", () => {
    expect(padLabels("playstation")).toMatchObject({
      south: "×",
      east: "○",
      west: "□",
      north: "△",
      l1: "L1",
      r1: "R1",
      l2: "L2",
      r2: "R2",
      start: "Options",
      select: "Create",
    });
  });

  it("gives the generic labels to an unknown pad", () => {
    expect(padLabels("generic")).toMatchObject({
      south: "A",
      start: "Start",
      select: "Select",
      dpad: "D-pad",
      stick: "Left stick",
    });
  });
});
