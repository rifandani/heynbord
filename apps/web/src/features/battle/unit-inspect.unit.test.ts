import { Target } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  detailsSide,
  HOVER_INTENT_MS,
  hoverStep,
  NO_HOVER,
  nextInspectedUnit,
  unitAtTarget,
} from "@/features/battle/unit-inspect";

describe("hoverStep", () => {
  it("shows a Unit only after the pointer stays on it", () => {
    const waiting = hoverStep(NO_HOVER, 7, 1000);
    expect(waiting.shown).toBeNull();
    expect(hoverStep(waiting, 7, 1000 + HOVER_INTENT_MS - 1).shown).toBeNull();
    expect(hoverStep(waiting, 7, 1000 + HOVER_INTENT_MS).shown).toBe(7);
  });

  it("starts the wait again when the pointer goes to a different Unit first", () => {
    const first = hoverStep(NO_HOVER, 7, 1000);
    const second = hoverStep(first, 8, 1100);
    expect(hoverStep(second, 8, 1000 + HOVER_INTENT_MS).shown).toBeNull();
    expect(hoverStep(second, 8, 1100 + HOVER_INTENT_MS).shown).toBe(8);
  });

  it("goes from Unit to Unit at once while a Unit shows", () => {
    const shown = { shown: 7, candidate: null, since: 0 };
    expect(hoverStep(shown, 8, 10).shown).toBe(8);
  });

  it("closes when no Unit is under the pointer", () => {
    expect(hoverStep({ shown: 7, candidate: null, since: 0 }, null, 10)).toBe(
      NO_HOVER
    );
    expect(hoverStep({ shown: null, candidate: 7, since: 0 }, null, 10)).toBe(
      NO_HOVER
    );
  });

  it("keeps the same object when nothing changes", () => {
    const shown = { shown: 7, candidate: null, since: 0 };
    expect(hoverStep(shown, 7, 500)).toBe(shown);
    expect(hoverStep(NO_HOVER, null, 500)).toBe(NO_HOVER);
  });
});

// Lane 0 is the far Lane. Square 0 is the player's Column 1.
const UNITS = [
  { id: 1, lane: 0, position: 2 },
  { id: 2, lane: 0, position: 9 },
  { id: 3, lane: 1, position: 5 },
  { id: 4, lane: 2, position: 1 },
  { id: 5, lane: 2, position: 8 },
];

describe("nextInspectedUnit", () => {
  it("starts at the first Unit of the far Lane", () => {
    expect(nextInspectedUnit(UNITS, null, "right")).toBe(1);
    expect(nextInspectedUnit(UNITS, 99, "down")).toBe(1);
  });

  it("has no Unit on an empty Board", () => {
    expect(nextInspectedUnit([], null, "right")).toBeNull();
  });

  it("goes along the Lane with Left and Right, and stops at the end", () => {
    expect(nextInspectedUnit(UNITS, 1, "right")).toBe(2);
    expect(nextInspectedUnit(UNITS, 2, "right")).toBe(2);
    expect(nextInspectedUnit(UNITS, 2, "left")).toBe(1);
    expect(nextInspectedUnit(UNITS, 1, "left")).toBe(1);
  });

  it("goes to the nearest Unit in the next Lane with Up and Down", () => {
    expect(nextInspectedUnit(UNITS, 3, "down")).toBe(5);
    expect(nextInspectedUnit(UNITS, 3, "up")).toBe(1);
    expect(nextInspectedUnit(UNITS, 4, "up")).toBe(3);
    expect(nextInspectedUnit(UNITS, 1, "up")).toBe(1);
  });

  it("jumps over a Lane with no Unit", () => {
    const units = [
      { id: 1, lane: 0, position: 4 },
      { id: 2, lane: 2, position: 3 },
    ];
    expect(nextInspectedUnit(units, 1, "down")).toBe(2);
    expect(nextInspectedUnit(units, 2, "up")).toBe(1);
  });
});

describe("unitAtTarget", () => {
  it("finds the Unit on a Square target", () => {
    expect(unitAtTarget(UNITS, Target.Square({ lane: 1, position: 5 }))).toBe(
      3
    );
    expect(
      unitAtTarget(UNITS, Target.Square({ lane: 1, position: 6 }))
    ).toBeNull();
  });

  it("has no Unit for a Lane target or no target", () => {
    expect(unitAtTarget(UNITS, Target.Lane({ lane: 0 }))).toBeNull();
    expect(unitAtTarget(UNITS)).toBeNull();
  });
});

describe("detailsSide", () => {
  it("puts the Card Details on the side of the Unit owner", () => {
    expect(detailsSide("player")).toBe("left");
    expect(detailsSide("enemy")).toBe("right");
  });
});
