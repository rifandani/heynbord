/**
 * The focus decisions of the Town with a controller (web ADR-0015). The Town
 * is a painting, so the Building targets use the painting rectangles. The
 * Town Bar is a row of DOM controls, so it uses the screen centers that the
 * browser gives. The module is pure; `use-town-pad.ts` focuses the result.
 */

import type { FocusDirection, FocusRect } from "@/core/input/town-focus";
import { nextFocusId } from "@/core/input/town-focus";

/** A Building target with its painting rectangle and its screen center. */
export interface TownPadBuilding {
  readonly rect: FocusRect;
  /** The horizontal center of the Building button on the screen. */
  readonly centerX: number;
}

/** Where the Town focus is now. */
export type TownPadCurrent =
  | { readonly zone: "building"; readonly id: string }
  | { readonly zone: "bar"; readonly index: number };

/** Where a direction moves the Town focus. */
export type TownPadTarget =
  | { readonly zone: "building"; readonly id: string }
  | { readonly zone: "bar"; readonly index: number };

/** The Buildings and the Town Bar of the screen. */
export interface TownPadLayout {
  readonly buildings: readonly TownPadBuilding[];
  /** The horizontal center of each Town Bar shortcut on the screen. */
  readonly bar: readonly number[];
  readonly current: TownPadCurrent | null;
}

/** The index of the value nearest to `x`, or `null` for an empty list. */
export const nearestX = (
  values: readonly number[],
  x: number
): number | null => {
  let best: number | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const [index, value] of values.entries()) {
    const next = Math.abs(value - x);
    if (next < distance) {
      best = index;
      distance = next;
    }
  }
  return best;
};

/** The next index in a row, with a wrap at both ends. */
export const stepIndex = (
  count: number,
  current: number,
  step: -1 | 1
): number => (current + step + count) % count;

/** The Building that `x` is nearest to, or `null` when there is no Building. */
const nearestBuilding = (
  buildings: readonly TownPadBuilding[],
  x: number
): TownPadTarget | null => {
  const index = nearestX(
    buildings.map((building) => building.centerX),
    x
  );
  const building = index === null ? undefined : buildings[index];
  return building ? { zone: "building", id: building.rect.id } : null;
};

/** The target of a direction on a Town Bar shortcut. */
const barTarget = (
  layout: TownPadLayout,
  current: { readonly index: number },
  direction: FocusDirection
): TownPadTarget | null => {
  const { bar, buildings } = layout;
  if (bar.length === 0) {
    return null;
  }
  if (direction === "up") {
    const x = bar[current.index];
    return x === undefined ? null : nearestBuilding(buildings, x);
  }
  if (direction === "left" || direction === "right") {
    return {
      zone: "bar",
      index: stepIndex(
        bar.length,
        current.index,
        direction === "left" ? -1 : 1
      ),
    };
  }
  return null;
};

/** The target of a direction on a Building, or the Town Bar below the last one. */
const buildingTarget = (
  layout: TownPadLayout,
  direction: FocusDirection
): TownPadTarget | null => {
  const { bar, buildings, current } = layout;
  const id = nextFocusId(
    buildings.map((building) => building.rect),
    current?.zone === "building" ? current.id : null,
    direction
  );
  if (id !== null) {
    return { zone: "building", id };
  }
  if (direction !== "down" || bar.length === 0) {
    return null;
  }
  const building =
    current?.zone === "building"
      ? buildings.find((item) => item.rect.id === current.id)
      : undefined;
  const index = nearestX(bar, building?.centerX ?? bar[0] ?? 0);
  return index === null ? null : { zone: "bar", index };
};

/**
 * The target of one direction. The Building keeps the painting geometry of
 * `nextFocusId`; down from a Building with no Building below goes to the Town
 * Bar, and up from the Bar goes back to the nearest Building. Left and right
 * on the Bar move along its shortcuts.
 */
export const townPadTarget = (
  layout: TownPadLayout,
  direction: FocusDirection
): TownPadTarget | null => {
  const { current } = layout;
  if (current?.zone === "bar") {
    return barTarget(layout, current, direction);
  }
  return buildingTarget(layout, direction);
};
