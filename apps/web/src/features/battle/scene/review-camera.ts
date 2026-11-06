import {
  CAMERA_PITCH,
  cameraFrame,
  toRadians,
  UNIT_TURN,
} from "@/features/battle/scene/layout";

/**
 * The fixed canvas of the Review Scene. It has the aspect of the Unit Model
 * stage, and the output PNG is 1920 × 1080.
 */
export const REVIEW_CANVAS = {
  width: 960,
  height: 540,
  devicePixelRatio: 2,
} as const;

/** The fixed lens of the Review Scene. It is the lens of the Battle camera. */
export const REVIEW_LENS = { fovDegrees: 30, near: 0.5, far: 160 } as const;

/** The point that every view looks at. It is about the middle of the tallest Unit Model. */
const REVIEW_TARGET = [0, 0.7, 0] as const;

/** The distance of the four side views. The tallest Unit Model fills less than 70% of the height. */
const SIDE_DISTANCE = 4.2;

/** The distance of the close-up view. */
const CLOSE_UP_DISTANCE = 2.6;

const LANES = 3;

const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** A camera of the Review Scene. It has the fields of the render bridge camera. */
export interface ReviewCamera {
  /**
   * Degrees around the Unit Model, from its front. 90 is the Blender right
   * view: the camera is on the right side of the viewer, so it sees the left
   * side of the model.
   */
  readonly azimuthDegrees: number;
  readonly elevationDegrees: number;
  readonly target: readonly [number, number, number];
  readonly distance: number;
  readonly fovDegrees: number;
  readonly near: number;
  readonly far: number;
}

/** The 6 views of the Review Scene, in capture order. */
export const REVIEW_VIEWS = [
  "front",
  "right",
  "back",
  "left",
  "battle",
  "close-up",
] as const;
type ReviewView = (typeof REVIEW_VIEWS)[number];

/** The distance of the Battle camera from the Board, on the Review canvas. */
const battleDistance = (): number => {
  const frame = cameraFrame(REVIEW_CANVAS.width / REVIEW_CANVAS.height, LANES);
  return Math.hypot(frame.position[1], frame.position[2] - frame.target[2]);
};

/** The azimuth of the Battle camera: it looks along -Z, and a player Unit turns away from +Z. */
const BATTLE_AZIMUTH = 360 - toDegrees(UNIT_TURN);

const camera = (
  azimuthDegrees: number,
  elevationDegrees: number,
  distance: number
): ReviewCamera => ({
  azimuthDegrees,
  elevationDegrees,
  target: REVIEW_TARGET,
  distance,
  ...REVIEW_LENS,
});

/** The Battle camera of the Review Scene. It does not change with the Unit Model. */
export const REVIEW_BATTLE_CAMERA = camera(
  BATTLE_AZIMUTH,
  CAMERA_PITCH,
  battleDistance()
);

/**
 * The 6 fixed cameras of the Review Scene. The only input is the azimuth of
 * the identity feature from the Unit Spec. The cameras never read the bounds
 * of a model.
 */
export const reviewCameras = (
  identityAzimuth: number
): Readonly<Record<ReviewView, ReviewCamera>> => ({
  front: camera(0, 0, SIDE_DISTANCE),
  right: camera(90, 0, SIDE_DISTANCE),
  back: camera(180, 0, SIDE_DISTANCE),
  left: camera(270, 0, SIDE_DISTANCE),
  battle: REVIEW_BATTLE_CAMERA,
  "close-up": camera(identityAzimuth, CAMERA_PITCH, CLOSE_UP_DISTANCE),
});

/** The world position of a Review camera around a player Unit at the origin. */
export const cameraPosition = ({
  azimuthDegrees,
  distance,
  elevationDegrees,
  target,
}: ReviewCamera): readonly [number, number, number] => {
  const azimuth = toRadians(azimuthDegrees) + UNIT_TURN;
  const elevation = toRadians(elevationDegrees);
  const ground = Math.cos(elevation) * distance;
  return [
    target[0] + Math.sin(azimuth) * ground,
    target[1] + Math.sin(elevation) * distance,
    target[2] + Math.cos(azimuth) * ground,
  ];
};
