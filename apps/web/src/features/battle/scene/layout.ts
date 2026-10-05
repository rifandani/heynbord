import type { Side } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";

/** The size of one Square in world units. */
const SQUARE_SIZE = 1;

/** The distance between the centers of two Lanes. */
const LANE_SPACING = 1.45;

/** The Lanes go from left (player) to right (enemy) along x (art direction 3). */
export const squareX = (position: number): number =>
  (position - (LANE_LENGTH - 1) / 2) * SQUARE_SIZE;

/** Lane 1 is the far Lane (top of the screen). */
export const laneZ = (lane: number, lanes: number): number =>
  (lane - (lanes - 1) / 2) * LANE_SPACING;

/** Each Hero stands 1 Square past the last Column of the other side. */
export const heroX = (side: Side): number =>
  side === "player" ? squareX(-1) - 0.35 : squareX(LANE_LENGTH) + 0.35;

/** The height of the center of a Hero figure. The Hero stands on the ground, with no pedestal (web ADR-0007). */
export const HERO_FIGURE_Y = 1.2;

/** The half width of what the camera must always show: both Heroes and a margin. */
const HALF_WIDTH = heroX("enemy") + 0.9;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** The camera looks down at this angle (art direction 3: 35° to 45°). 45° gives the Lanes the most depth. */
export const CAMERA_PITCH = 45;

export interface CameraFrame {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
}

/**
 * A camera that shows every Square and both Heroes for a viewport aspect
 * (art direction 3: "The camera never hides any Square"). The HUD covers the
 * top and the bottom of the screen, so the target moves toward the camera and
 * the Board shows a little above the center.
 */
export const cameraFrame = (aspect: number, lanes: number): CameraFrame => {
  const fov = 30;
  const halfVertical = toRadians(fov / 2);
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const halfDepth = (lanes * LANE_SPACING) / 2 + 1.4;
  const fitWidth = HALF_WIDTH / Math.tan(halfHorizontal);
  const fitDepth =
    halfDepth / Math.tan(halfVertical) / Math.sin(toRadians(CAMERA_PITCH));
  // The HUD takes about 40% of the height, so the Board gets a larger margin.
  const distance = Math.max(fitWidth, fitDepth) * 1.08;
  const pitch = toRadians(CAMERA_PITCH);
  const targetZ = 0.35 + lanes * 0.1;
  return {
    fov,
    position: [
      0,
      Math.sin(pitch) * distance,
      targetZ + Math.cos(pitch) * distance,
    ],
    target: [0, 0, targetZ],
  };
};
