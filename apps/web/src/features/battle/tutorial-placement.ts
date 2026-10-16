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
  /**
   * Boxes that the panel must not cover, for example the labels of other
   * things. Of the sides with space, the panel takes the first side where it
   * covers none of them, or else the side where it covers the least area.
   */
  readonly avoid?: readonly ScreenBox[];
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

/** Where the panel goes on `side`, in the bounds. */
const positionOn = (
  side: PanelSide,
  { anchor, width, height, bounds, align = "center", gap = 14 }: PlacementInput
) => {
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
  return {
    left: clamp(wantLeft, bounds.left, bounds.right - width),
    top: clamp(wantTop, bounds.top, bounds.bottom - height),
  };
};

/** The area of the `avoid` boxes that the panel covers on `side`. */
const coveredArea = (side: PanelSide, input: PlacementInput): number => {
  const { left, top } = positionOn(side, input);
  const right = left + input.width;
  const bottom = top + input.height;
  return (input.avoid ?? []).reduce((area, box) => {
    const width = Math.min(right, box.right) - Math.max(left, box.left);
    const height = Math.min(bottom, box.bottom) - Math.max(top, box.top);
    return width > 0 && height > 0 ? area + width * height : area;
  }, 0);
};

/**
 * The first side with space for the panel, or else the side with the most
 * space. With `avoid`, the side with space where the panel covers the least
 * area of the `avoid` boxes. A strict placement has no side when no side has
 * space.
 */
const chooseSide = (input: PlacementInput): PanelSide | null => {
  const withSpace = input.sides.filter(
    (side) => spare(side, input) >= -SPACE_TOLERANCE
  );
  // `toSorted` is stable: of the sides that cover the same area, the first
  // side in the order of preference wins.
  const [fits] = input.avoid
    ? withSpace.toSorted(
        (a, b) => coveredArea(a, input) - coveredArea(b, input)
      )
    : withSpace;
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
  const { anchor, width, height } = input;
  const side = chooseSide(input);
  if (!side) {
    return null;
  }
  const middleX = (anchor.left + anchor.right) / 2;
  const middleY = (anchor.top + anchor.bottom) / 2;
  const vertical = side === "above" || side === "below";
  const { left, top } = positionOn(side, input);
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
