import { describe, expect, it } from "vitest";

import type { FocusRect } from "@/core/input/town-focus";
import { nextFocusId } from "@/core/input/town-focus";

const rect = (id: string, x: number, y: number): FocusRect => ({
  id,
  x,
  y,
  width: 80,
  height: 80,
});

const grid: readonly FocusRect[] = [
  rect("a", 0, 0),
  rect("b", 100, 0),
  rect("c", 200, 0),
  rect("d", 0, 100),
  rect("e", 100, 100),
  rect("f", 200, 100),
  rect("g", 0, 200),
  rect("h", 100, 200),
  rect("i", 200, 200),
];

describe("nextFocusId", () => {
  it("moves to the neighbour on each side", () => {
    expect(nextFocusId(grid, "e", "right")).toBe("f");
    expect(nextFocusId(grid, "e", "left")).toBe("d");
    expect(nextFocusId(grid, "e", "up")).toBe("b");
    expect(nextFocusId(grid, "e", "down")).toBe("h");
  });

  it("starts on the first rectangle when nothing is selected", () => {
    expect(nextFocusId(grid, null, "down")).toBe("a");
    expect(nextFocusId(grid, "unknown", "right")).toBe("a");
  });

  it("gives no target at the edge", () => {
    expect(nextFocusId(grid, "a", "up")).toBeNull();
    expect(nextFocusId(grid, "a", "left")).toBeNull();
    expect(nextFocusId(grid, "c", "right")).toBeNull();
    expect(nextFocusId(grid, "i", "down")).toBeNull();
  });

  it("prefers a target in the cone over a near one to the side", () => {
    const from = rect("from", 0, 0);
    const far = rect("far", 300, 20);
    const near = rect("near", 120, 160);

    expect(nextFocusId([from, far, near], "from", "right")).toBe("far");
  });

  it("ignores a target that is not in the pressed direction", () => {
    const from = rect("from", 100, 100);
    const same = rect("same", 100, 100);

    expect(nextFocusId([from, same], "from", "right")).toBeNull();
  });

  it("gives no target for an empty Town", () => {
    expect(nextFocusId([], null, "right")).toBeNull();
  });
});
