/** A rectangle on the screen, in CSS pixels. */
export interface ScreenBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** The side of the anchor where the Tutorial text shows. */
export type PanelSide = "above" | "below" | "left" | "right";

export interface PanelPlacement {
  readonly left: number;
  readonly top: number;
  readonly side: PanelSide;
  /** Where the pointer on the panel edge is, in pixels from the panel's left or top edge. */
  readonly pointer: number;
}

interface PlacementInput {
  /** The screen area that the Step text tells about. */
  readonly anchor: ScreenBox;
  readonly width: number;
  readonly height: number;
  /** The panel stays in this area: the screen without the HUD bars. */
  readonly bounds: ScreenBox;
  /** The sides to try, in order of preference. */
  readonly sides: readonly PanelSide[];
  /** "start" lines up the panel with the left edge of the anchor, above or below it. */
  readonly align?: "center" | "start";
  /** The space between the anchor and the panel, for the pointer. */
  readonly gap?: number;
  /**
   * True when the panel must not cover the anchor: with no side that has
   * space, there is no placement.
   */
  readonly strict?: boolean;
}

/** The pointer stays this far from a panel corner, clear of the rounded corner. */
const POINTER_INSET = 24;

/** A side has space when the panel needs at most this much more: the gap becomes smaller. */
const SPACE_TOLERANCE = 12;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, Math.max(min, max)));

/** The free space on a side of the anchor, less the space that the panel needs. */
const spare = (
  side: PanelSide,
  { anchor, width, height, bounds, gap = 14 }: PlacementInput
): number => {
  switch (side) {
    case "above": {
      return anchor.top - gap - bounds.top - height;
    }
    case "below": {
      return bounds.bottom - anchor.bottom - gap - height;
    }
    case "left": {
      return anchor.left - gap - bounds.left - width;
    }
    case "right": {
      return bounds.right - anchor.right - gap - width;
    }
    default: {
      return side satisfies never;
    }
  }
};

/**
 * The first side with space for the panel, or else the side with the most
 * space. A strict placement has no side when no side has space.
 */
const chooseSide = (input: PlacementInput): PanelSide | null => {
  const fits = input.sides.find(
    (side) => spare(side, input) >= -SPACE_TOLERANCE
  );
  if (fits || input.strict) {
    return fits ?? null;
  }
  const [best] = input.sides.toSorted(
    (a, b) => spare(b, input) - spare(a, input)
  );
  return best ?? null;
};

/**
 * Puts the Tutorial text next to the thing that it tells about, on the first
 * side that has space for it. The panel always stays in the bounds, and its
 * pointer points to the middle of the anchor.
 */
export const placePanel = (input: PlacementInput): PanelPlacement | null => {
  const { anchor, width, height, bounds, align = "center", gap = 14 } = input;
  const side = chooseSide(input);
  if (!side) {
    return null;
  }
  const middleX = (anchor.left + anchor.right) / 2;
  const middleY = (anchor.top + anchor.bottom) / 2;
  const vertical = side === "above" || side === "below";
  const wantLeft = vertical
    ? align === "start"
      ? anchor.left
      : middleX - width / 2
    : side === "left"
      ? anchor.left - gap - width
      : anchor.right + gap;
  const wantTop = vertical
    ? side === "above"
      ? anchor.top - gap - height
      : anchor.bottom + gap
    : middleY - height / 2;
  const left = clamp(wantLeft, bounds.left, bounds.right - width);
  const top = clamp(wantTop, bounds.top, bounds.bottom - height);
  const pointer = vertical
    ? clamp(middleX - left, POINTER_INSET, width - POINTER_INSET)
    : clamp(middleY - top, POINTER_INSET, height - POINTER_INSET);
  return { left, top, side, pointer };
};

/** The smallest box around some screen points. */
export const boxAround = (
  points: readonly { readonly x: number; readonly y: number }[]
): ScreenBox | null =>
  points.length === 0
    ? null
    : {
        left: Math.min(...points.map((point) => point.x)),
        top: Math.min(...points.map((point) => point.y)),
        right: Math.max(...points.map((point) => point.x)),
        bottom: Math.max(...points.map((point) => point.y)),
      };
