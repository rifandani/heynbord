/**
 * The label style of a controller, from the `id` string that the browser gives.
 * The labels follow the position of a button, so the game logic never reads a
 * letter (web ADR-0015).
 */

/** The label style of a pad. */
export type PadFamily = "playstation" | "xbox" | "generic";

const PLAYSTATION = /dualsense|dualshock|playstation|054c|ps[45]/iu;
const XBOX = /xbox|xinput|045e/iu;

/**
 * The family of a pad. A Switch Pro Controller is not a family: the game does
 * not support it, so its id gets the generic labels.
 */
export const padFamily = (id: string): PadFamily => {
  if (PLAYSTATION.test(id)) {
    return "playstation";
  }
  if (XBOX.test(id)) {
    return "xbox";
  }
  return "generic";
};

/** The label of each position, for the Controls Guide. */
export interface PadLabels {
  readonly south: string;
  readonly east: string;
  readonly west: string;
  readonly north: string;
  readonly l1: string;
  readonly r1: string;
  readonly l2: string;
  readonly r2: string;
  readonly select: string;
  readonly start: string;
  readonly dpad: string;
  readonly stick: string;
}

const LABELS: Readonly<Record<PadFamily, PadLabels>> = {
  playstation: {
    south: "×",
    east: "○",
    west: "□",
    north: "△",
    l1: "L1",
    r1: "R1",
    l2: "L2",
    r2: "R2",
    select: "Create",
    start: "Options",
    dpad: "D-pad",
    stick: "Left stick",
  },
  xbox: {
    south: "A",
    east: "B",
    west: "X",
    north: "Y",
    l1: "LB",
    r1: "RB",
    l2: "LT",
    r2: "RT",
    select: "View",
    start: "Menu",
    dpad: "D-pad",
    stick: "Left stick",
  },
  generic: {
    south: "A",
    east: "B",
    west: "X",
    north: "Y",
    l1: "L1",
    r1: "R1",
    l2: "L2",
    r2: "R2",
    select: "Select",
    start: "Start",
    dpad: "D-pad",
    stick: "Left stick",
  },
};

/** The labels of a family. */
export const padLabels = (family: PadFamily): PadLabels => LABELS[family];
