import { describe, expect, it } from "vitest";

import { cameraFrame } from "@/features/battle/scene/layout";
import {
  cameraPosition,
  reviewCameras,
} from "@/features/battle/scene/review-camera";

const IDENTITY_AZIMUTH = 45;

describe("reviewCameras", () => {
  it("puts the four side views at the azimuths of the Review Scene, level", () => {
    const { back, front, left, right } = reviewCameras(IDENTITY_AZIMUTH);

    expect(
      [front, right, back, left].map(({ azimuthDegrees, elevationDegrees }) => [
        azimuthDegrees,
        elevationDegrees,
      ])
    ).toEqual([
      [0, 0],
      [90, 0],
      [180, 0],
      [270, 0],
    ]);
  });

  it("uses the lens of the Battle camera for every view", () => {
    const cameras = Object.values(reviewCameras(IDENTITY_AZIMUTH));

    expect(
      new Set(
        cameras.map(
          ({ fovDegrees, near, far }) => `${fovDegrees}/${near}/${far}`
        )
      )
    ).toEqual(new Set(["30/0.5/160"]));
  });

  it("changes only the close-up azimuth for a different identity feature", () => {
    const bow = reviewCameras(45);
    const shield = reviewCameras(200);

    expect({ ...shield, "close-up": bow["close-up"] }).toEqual(bow);
    expect(shield["close-up"]).toEqual({
      ...bow["close-up"],
      azimuthDegrees: 200,
    });
  });

  it("looks at the identity feature from the elevation of the Battle camera", () => {
    expect(reviewCameras(IDENTITY_AZIMUTH)["close-up"]).toMatchObject({
      azimuthDegrees: 45,
      elevationDegrees: 45,
    });
  });
});

describe("cameraPosition", () => {
  it("puts the battle view on the axis of the Battle camera, at its distance", () => {
    const { battle } = reviewCameras(IDENTITY_AZIMUTH);
    const [x, y, z] = cameraPosition(battle);
    const frame = cameraFrame(16 / 9, 3);
    const battleDistance = Math.hypot(
      frame.position[1],
      frame.position[2] - frame.target[2]
    );

    expect(x).toBeCloseTo(0, 6);
    expect(y - battle.target[1]).toBeCloseTo(z, 6);
    expect(Math.hypot(y - battle.target[1], z)).toBeCloseTo(battleDistance, 6);
  });

  it("puts the front view in the direction that a player Unit faces", () => {
    const { front } = reviewCameras(IDENTITY_AZIMUTH);
    const [x, y, z] = cameraPosition(front);

    // A player Unit turns from +Z by 90° - 0.4 rad toward +X (unit-rig).
    expect(x).toBeCloseTo(Math.cos(0.4) * front.distance, 6);
    expect(y).toBeCloseTo(front.target[1], 6);
    expect(z).toBeCloseTo(Math.sin(0.4) * front.distance, 6);
  });

  it("puts the right view a quarter turn around the Unit from the front view", () => {
    const { front, right } = reviewCameras(IDENTITY_AZIMUTH);
    const [frontX, , frontZ] = cameraPosition(front);
    const [rightX, , rightZ] = cameraPosition(right);

    expect(rightX).toBeCloseTo(frontZ, 6);
    expect(rightZ).toBeCloseTo(-frontX, 6);
  });
});
