/**
 * The focus of the Town with a controller. The Town is a painting, so the DOM
 * order is not the order on the screen. A Building is a rectangle in painting
 * coordinates (`SELECTABLE_BUILDINGS`), and the pressed direction picks the
 * nearest rectangle in that direction (web ADR-0015).
 */

/** A target of the Town focus, in painting coordinates. */
export interface FocusRect {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A direction of the D-pad or of the left stick. */
export type FocusDirection = "up" | "down" | "left" | "right";

interface Point {
  readonly x: number;
  readonly y: number;
}

const center = (rect: FocusRect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

/**
 * The cost of a target in a direction, or `null` when the target is not in that
 * direction. The forward distance comes first, and a sideways target costs
 * twice as much, so the focus stays in the cone that the Player points at.
 */
const cost = (
  from: Point,
  to: Point,
  direction: FocusDirection
): number | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const forward =
    direction === "left"
      ? -dx
      : direction === "right"
        ? dx
        : direction === "up"
          ? -dy
          : dy;
  if (forward <= 0) {
    return null;
  }
  const sideways =
    direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
  return forward + sideways * 2;
};

/**
 * The nearest rectangle in the pressed direction. With no current rectangle,
 * the first one is the start. At the edge, the result is `null`.
 */
export const nextFocusId = (
  rects: readonly FocusRect[],
  current: string | null,
  direction: FocusDirection
): string | null => {
  const from = rects.find((rect) => rect.id === current);
  if (!from) {
    return rects[0]?.id ?? null;
  }
  const origin = center(from);
  let best: { readonly id: string; readonly cost: number } | null = null;
  for (const rect of rects) {
    if (rect.id === from.id) {
      continue;
    }
    const value = cost(origin, center(rect), direction);
    if (value === null) {
      continue;
    }
    if (!best || value < best.cost) {
      best = { id: rect.id, cost: value };
    }
  }
  return best?.id ?? null;
};
