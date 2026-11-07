import {
  AnimationClip,
  Bone,
  BufferAttribute,
  BufferGeometry,
  Group,
  InterpolateDiscrete,
  MeshBasicMaterial,
  QuaternionKeyframeTrack,
  Skeleton,
  SkinnedMesh,
  Vector3,
  VectorKeyframeTrack,
} from "three";
import { describe, expect, test } from "vitest";

import { clipChecks } from "../../../../scripts/clip-checks";
import type { ClipCheck } from "../../../../scripts/clip-checks";

const IDENTITY = [0, 0, 0, 1];
const halfTurnOf = (degrees: number): readonly number[] => {
  const half = (degrees * Math.PI) / 360;
  return [Math.sin(half), 0, 0, Math.cos(half)];
};

/** A figure 1 unit high: the root, then the hips at 0.5, with a vertex at the feet and at the head. */
const figure = (clips: readonly AnimationClip[]) => {
  const root = new Bone();
  root.name = "root";
  const hips = new Bone();
  hips.name = "hips";
  hips.position.set(0, 0.5, 0);
  root.add(hips);

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([0, 0, 0, 0, 1, 0, 0.1, 0.5, 0]), 3)
  );
  geometry.setAttribute(
    "skinIndex",
    new BufferAttribute(
      new Uint16Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
      4
    )
  );
  geometry.setAttribute(
    "skinWeight",
    new BufferAttribute(
      new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
      4
    )
  );

  const mesh = new SkinnedMesh(geometry, new MeshBasicMaterial());
  const scene = new Group();
  scene.add(mesh, root);
  scene.updateMatrixWorld(true);
  mesh.bind(new Skeleton([root, hips]));
  return { animations: clips, scene };
};

const hipsTurn = (first: number, last: number) =>
  new QuaternionKeyframeTrack(
    "hips.quaternion",
    [0, 1],
    [...halfTurnOf(first), ...halfTurnOf(last)]
  );

const hipsAt = (first: number, last: number) =>
  new VectorKeyframeTrack("hips.position", [0, 1], [0, first, 0, 0, last, 0]);

const stillRoot = () =>
  new QuaternionKeyframeTrack(
    "root.quaternion",
    [0, 1],
    [...IDENTITY, ...IDENTITY]
  );

const clip = (name: string, ...tracks: AnimationClip["tracks"]) =>
  new AnimationClip(name, 1, tracks);

const findCheck = (
  checks: readonly ClipCheck[],
  check: ClipCheck["check"],
  name: string
): ClipCheck => {
  const found = checks.find(
    (item) => item.check === check && item.clip === name
  );
  if (!found) {
    throw new Error(`no ${check} for ${name}`);
  }
  return found;
};

describe("clipChecks", () => {
  test("a loop that ends at its first pose passes the loop checks", () => {
    const checks = clipChecks(figure([clip("idle", hipsTurn(10, 10))]));

    expect(findCheck(checks, "loopClosure", "idle").pass).toBe(true);
    expect(findCheck(checks, "poseReturn", "idle").pass).toBe(true);
  });

  test("idle and lowHp must close, and the check names the bad track", () => {
    const checks = clipChecks(figure([clip("lowHp", hipsTurn(0, 2))]));

    expect(findCheck(checks, "loopClosure", "lowHp")).toMatchObject({
      pass: false,
      detail: "hips.quaternion",
    });
  });

  test("a walk does not need a loop closure, but it needs a pose return", () => {
    const checks = clipChecks(figure([clip("walk", hipsTurn(0, 2))]));

    expect(checks.some((item) => item.check === "loopClosure")).toBe(false);
    expect(findCheck(checks, "poseReturn", "walk").pass).toBe(false);
  });

  test("the limit of a pose return is 0.5 degrees", () => {
    const under = clipChecks(figure([clip("walk", hipsTurn(0, 0.49))]));
    const over = clipChecks(figure([clip("walk", hipsTurn(0, 0.51))]));

    expect(findCheck(under, "poseReturn", "walk").pass).toBe(true);
    expect(findCheck(over, "poseReturn", "walk").pass).toBe(false);
  });

  test("a loop with hips that end away from their start fails the hip return", () => {
    const checks = clipChecks(figure([clip("idle", hipsAt(0.5, 0.52))]));

    expect(findCheck(checks, "hipReturn", "idle")).toMatchObject({
      limit: 0.01,
      pass: false,
    });
  });

  test("a turn of 360 degrees is the same pose", () => {
    const checks = clipChecks(figure([clip("walk", hipsTurn(0, 360))]));

    expect(findCheck(checks, "poseReturn", "walk").pass).toBe(true);
  });

  test("a clip that keeps the figure on the ground passes the ground check", () => {
    const checks = clipChecks(figure([clip("hurt", hipsAt(0.5, 0.6))]));

    expect(findCheck(checks, "ground", "hurt").pass).toBe(true);
  });

  test("a death or a hit that goes through the ground fails, with the depth and the time", () => {
    const checks = clipChecks(
      figure([clip("death", hipsAt(0.5, 0.4)), clip("hurt", hipsAt(0.4, 0.5))])
    );

    const death = findCheck(checks, "ground", "death");
    expect(death.pass).toBe(false);
    expect(death.value).toBeCloseTo(0.1, 5);
    expect(death.detail).toBe("frame 24");
    expect(findCheck(checks, "ground", "hurt")).toMatchObject({
      pass: false,
      detail: "frame 0",
    });
  });

  test("the limit of the ground check is 0.06 of the height", () => {
    const checks = clipChecks(
      figure([
        clip("hurt", hipsAt(0.5, 0.45)),
        clip("death", hipsAt(0.5, 0.43)),
      ])
    );

    expect(findCheck(checks, "ground", "hurt").pass).toBe(true);
    expect(findCheck(checks, "ground", "death").pass).toBe(false);
  });

  test("the walk has no ground check", () => {
    const checks = clipChecks(figure([clip("walk", hipsAt(0.4, 0.4))]));

    expect(checks.some((item) => item.check === "ground")).toBe(false);
  });

  test("each clip that plays passes the binding check", () => {
    const checks = clipChecks(figure([clip("attack", hipsTurn(0, 40))]));

    expect(findCheck(checks, "binding", "attack")).toMatchObject({
      limit: 2 ** -23,
      pass: true,
    });
  });

  test("a track with stepped keys passes the binding check", () => {
    const stepped = new VectorKeyframeTrack(
      "hips.position",
      [0, 1],
      [0, 0.5, 0, 0, 0.6, 0],
      InterpolateDiscrete
    );

    expect(
      findCheck(
        clipChecks(figure([clip("attack", stepped)])),
        "binding",
        "attack"
      ).pass
    ).toBe(true);
  });

  test("a track that reaches no node fails the binding check", () => {
    const silent = new VectorKeyframeTrack(
      "tail.position",
      [0, 1],
      [0, 0, 0, 0, 1, 0]
    );

    expect(
      findCheck(
        clipChecks(figure([clip("attack", silent)])),
        "binding",
        "attack"
      )
    ).toMatchObject({ detail: "tail.position", pass: false });
  });

  test("the checks leave the figure in its rest pose", () => {
    const model = figure([clip("death", hipsTurn(0, 90), stillRoot())]);

    clipChecks(model);

    const [, hips] = model.scene.children;
    expect(hips?.children[0]?.quaternion.toArray()).toEqual([0, 0, 0, 1]);
    expect(
      hips?.children[0]?.getWorldPosition(new Vector3()).toArray()
    ).toEqual([0, 0.5, 0]);
  });
});
