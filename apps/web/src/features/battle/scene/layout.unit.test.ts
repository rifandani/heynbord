import { LANE_LENGTH } from "@workspace/rules";
import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import {
  CAMERA_PITCH,
  cameraFrame,
  heroX,
  laneZ,
  squareX,
} from "@/features/battle/scene/layout";

describe("layout", () => {
  it("centers the 12 Squares on x and puts the Heroes outside them", () => {
    expect(squareX(0)).toBe(-5.5);
    expect(squareX(11)).toBe(5.5);
    expect(heroX("player")).toBeLessThan(squareX(0) - 1);
    expect(heroX("enemy")).toBeGreaterThan(squareX(11) + 1);
  });

  it("centers the Lanes on z with Lane 1 farthest from the camera", () => {
    expect(laneZ(0, 1)).toBe(0);
    expect(laneZ(0, 2)).toBeLessThan(laneZ(1, 2));
    expect(laneZ(0, 3) + laneZ(2, 3)).toBe(0);
  });

  it("shows every Square of a 3-Lane and a 4-Lane Board on a phone in landscape (ADR-0010)", () => {
    for (const aspect of [844 / 390, 667 / 375]) {
      for (const lanes of [3, 4]) {
        const frame = cameraFrame(aspect, lanes);
        const camera = new PerspectiveCamera(frame.fov, aspect, 0.5, 160);
        camera.position.set(...frame.position);
        camera.lookAt(...frame.target);
        camera.updateMatrixWorld();
        for (const x of [squareX(0) - 0.5, squareX(LANE_LENGTH - 1) + 0.5]) {
          for (const z of [
            laneZ(0, lanes) - 0.5,
            laneZ(lanes - 1, lanes) + 0.5,
          ]) {
            const ndc = new Vector3(x, 0, z).project(camera);
            expect(Math.abs(ndc.x), `${aspect} ${lanes}`).toBeLessThan(1);
            expect(Math.abs(ndc.y), `${aspect} ${lanes}`).toBeLessThan(1);
          }
        }
      }
    }
  });

  it("moves the camera back for narrow viewports so both Heroes stay visible", () => {
    const wide = cameraFrame(16 / 9, 2);
    const narrow = cameraFrame(4 / 3, 2);
    const distance = (frame: typeof wide) =>
      Math.hypot(...frame.position.map((v, i) => v - (frame.target[i] ?? 0)));
    expect(distance(narrow)).toBeGreaterThan(distance(wide));
    for (const frame of [wide, narrow]) {
      const [, y, z] = frame.position;
      const pitch = (Math.atan2(y, z - frame.target[2]) * 180) / Math.PI;
      expect(pitch).toBeCloseTo(CAMERA_PITCH, 5);
    }
  });
});
