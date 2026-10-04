import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
} from "three";
import { describe, expect, it } from "vitest";

import { finishInstances } from "@/features/battle/scene/instancing";

const mesh = () =>
  new InstancedMesh(new BoxGeometry(), new MeshBasicMaterial(), 2);

describe("finishInstances", () => {
  it("marks matrices and colors for upload and bounds the instances", () => {
    const colored = mesh();
    colored.setMatrixAt(1, new Matrix4().makeTranslation(10, 0, 0));
    colored.setColorAt(0, new Color("#ff0000"));
    const plain = mesh();
    const matrixVersion = plain.instanceMatrix.version;
    const colorVersion = colored.instanceColor?.version ?? 0;

    finishInstances([colored, null, plain]);

    expect(plain.instanceMatrix.version).toBeGreaterThan(matrixVersion);
    expect(plain.instanceColor).toBeNull();
    expect(colored.instanceColor?.version).toBeGreaterThan(colorVersion);
    expect(colored.boundingSphere?.radius).toBeGreaterThan(5);
  });
});
