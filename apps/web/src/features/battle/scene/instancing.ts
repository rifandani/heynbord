import type { InstancedMesh } from "three";

/**
 * Tells three.js that the instance matrices and colors changed, and updates
 * the bounding spheres. Call it after `setMatrixAt` and `setColorAt`.
 */
export const finishInstances = (
  meshes: readonly (InstancedMesh | null)[]
): void => {
  for (const mesh of meshes) {
    if (mesh) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.computeBoundingSphere();
    }
  }
};
