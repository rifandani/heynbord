import { createHash } from "node:crypto";

import { Box3, SkinnedMesh } from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** The published properties that a compressed model must keep from its raw export. */
export interface ModelContract {
  readonly min: readonly number[];
  readonly max: readonly number[];
  readonly bones: readonly number[];
  readonly clips: readonly {
    readonly name: string;
    readonly duration: number;
    readonly keyframes: string;
  }[];
}

/** Metadata needs geometry and animation, without browser image decoding. */
const withoutMaterialImages = (data: Uint8Array): ArrayBuffer => {
  const source = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const jsonLength = source.readUInt32LE(12);
  // SAFETY: this is the validated GLB passed by the packer.
  const gltf = JSON.parse(source.toString("utf-8", 20, 20 + jsonLength)) as {
    meshes?: { primitives: { material?: number }[] }[];
  };
  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives) {
      delete primitive.material;
    }
  }
  const json = Buffer.from(JSON.stringify(gltf));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const header = Buffer.from(source.subarray(0, 20));
  const tail = source.subarray(20 + jsonLength);
  header.writeUInt32LE(20 + padded.byteLength + tail.byteLength, 8);
  header.writeUInt32LE(padded.byteLength, 12);
  return new Uint8Array(Buffer.concat([header, padded, tail])).buffer;
};

/** Capture source properties once, so CI does not need the private Blender exports. */
export const modelContract = async (
  data: Uint8Array
): Promise<ModelContract> => {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const model = await loader.parseAsync(withoutMaterialImages(data), "");
  const bounds = new Box3().setFromObject(model.scene);
  const bones: number[] = [];
  model.scene.traverse((node) => {
    if (node instanceof SkinnedMesh) {
      bones.push(node.skeleton.bones.length);
    }
  });
  return {
    min: bounds.min.toArray(),
    max: bounds.max.toArray(),
    bones,
    clips: model.animations.map((clip) => {
      const hash = createHash("sha256");
      for (const track of clip.tracks) {
        hash.update(track.name);
        hash.update(String(track.getInterpolation()));
        hash.update(
          new Uint8Array(
            track.times.buffer,
            track.times.byteOffset,
            track.times.byteLength
          )
        );
        hash.update(
          new Uint8Array(
            track.values.buffer,
            track.values.byteOffset,
            track.values.byteLength
          )
        );
      }
      return {
        name: clip.name,
        duration: clip.duration,
        keyframes: hash.digest("hex"),
      };
    }),
  };
};
