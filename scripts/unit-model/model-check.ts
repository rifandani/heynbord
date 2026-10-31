import type { UnitClipName } from "../../apps/web/src/features/battle/scene/unit-clips.ts";
import {
  BASE_UNIT_CLIPS,
  UNIT_CLIP_NAMES,
} from "../../apps/web/src/features/battle/scene/unit-clips.ts";
import { compressedPrimitive, readModelGltf } from "../model-gltf.ts";
import type { ModelGltf } from "../model-gltf.ts";

/** Individual Unit limits stay separate from the whole-Battle allowance. */
export const UNIT_MODEL_LIMITS = {
  bytes: 1.5 * 1024 * 1024,
  triangles: 8000,
  bones: 30,
  images: 1,
  materials: 1,
  imageSize: 1024,
} as const;

export type UnitGltf = ModelGltf;

/** The Unit checks and the Hero checks read the same GLB header. */
export const readUnitGltf = readModelGltf;

const isClipName = (name: string): name is UnitClipName =>
  UNIT_CLIP_NAMES.some((clip) => clip === name);

export interface UnitModelReport {
  readonly problems: readonly string[];
  readonly clips: readonly string[];
  readonly bones: number;
  readonly triangles: number;
  readonly bytes: number;
}

const checkClips = (gltf: UnitGltf, problems: string[]): readonly string[] => {
  const clips = (gltf.animations ?? []).map((clip) => clip.name ?? "");
  for (const name of clips) {
    if (!isClipName(name)) {
      problems.push(`unknown clip "${name}"`);
    }
  }
  for (const name of BASE_UNIT_CLIPS) {
    if (!clips.includes(name)) {
      problems.push(`no "${name}" clip`);
    }
  }
  return clips;
};

const checkBones = (gltf: UnitGltf, problems: string[]): number => {
  const skins = gltf.skins ?? [];
  const bones = Math.max(0, ...skins.map((skin) => skin.joints.length));
  if (bones === 0) {
    problems.push("no skin");
  }
  if (bones > UNIT_MODEL_LIMITS.bones) {
    problems.push(`${bones} bones, more than ${UNIT_MODEL_LIMITS.bones}`);
  }
  return bones;
};

const checkGeometry = (
  gltf: UnitGltf,
  requireCompression: boolean,
  problems: string[]
): number => {
  let triangles = 0;
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      if ((primitive.mode ?? 4) !== 4) {
        problems.push("non-triangle primitive");
      }
      const index =
        primitive.indices ?? primitive.attributes.POSITION ?? Number.NaN;
      triangles += (gltf.accessors[index]?.count ?? 0) / 3;
      if (requireCompression && !compressedPrimitive(gltf, primitive)) {
        problems.push("primitive has no Draco or Meshopt compression");
      }
    }
  }
  if (triangles === 0 || !Number.isInteger(triangles)) {
    problems.push("invalid triangle count");
  }
  if (triangles > UNIT_MODEL_LIMITS.triangles) {
    problems.push(
      `${triangles} triangles, more than ${UNIT_MODEL_LIMITS.triangles}`
    );
  }
  return triangles;
};

/** Read image dimensions from the GLB itself; JSON size claims do not count. */
const embeddedImageSize = (
  data: Uint8Array,
  gltf: UnitGltf,
  index: number | undefined
): readonly [number, number] | null => {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const binaryHeader = 20 + buffer.readUInt32LE(12);
  const view = index === undefined ? undefined : gltf.bufferViews?.[index];
  if (
    !view ||
    binaryHeader + 8 > buffer.byteLength ||
    buffer.readUInt32LE(binaryHeader + 4) !== 0x00_4e_49_42
  ) {
    return null;
  }
  const offset = binaryHeader + 8 + (view.byteOffset ?? 0);
  const length = view.byteLength ?? 0;
  if (length < 24 || offset + length > buffer.byteLength) {
    return null;
  }
  const image = buffer.subarray(offset, offset + length);
  if (
    image
      .subarray(0, 12)
      .equals(
        Buffer.from([
          0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a,
          0x0a,
        ])
      ) &&
    length >= 28
  ) {
    return [image.readUInt32LE(20), image.readUInt32LE(24)];
  }
  if (
    image
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return [image.readUInt32BE(16), image.readUInt32BE(20)];
  }
  if (image.readUInt16BE(0) === 0xff_d8) {
    let at = 2;
    while (at + 9 <= image.length) {
      const marker = image.readUInt16BE(at);
      if ([0xff_c0, 0xff_c1, 0xff_c2].includes(marker)) {
        return [image.readUInt16BE(at + 7), image.readUInt16BE(at + 5)];
      }
      const segmentLength = image.readUInt16BE(at + 2);
      if (segmentLength < 2) {
        return null;
      }
      at += 2 + segmentLength;
    }
  }
  return null;
};

const checkImages = (
  gltf: UnitGltf,
  requireCompression: boolean,
  problems: string[],
  data: Uint8Array
): void => {
  const images = gltf.images ?? [];
  const materialCount = gltf.materials?.length ?? 0;
  if (materialCount > UNIT_MODEL_LIMITS.materials) {
    problems.push(
      `${materialCount} materials, more than ${UNIT_MODEL_LIMITS.materials}`
    );
  }
  for (const image of images) {
    const size = embeddedImageSize(data, gltf, image.bufferView);
    if (!size || size[0] === 0 || size[1] === 0) {
      problems.push(
        "model images must be valid embedded PNG, JPEG or KTX2 images"
      );
    } else if (
      size[0] > UNIT_MODEL_LIMITS.imageSize ||
      size[1] > UNIT_MODEL_LIMITS.imageSize
    ) {
      problems.push(
        `${size[0]} x ${size[1]} image, more than ${UNIT_MODEL_LIMITS.imageSize} x ${UNIT_MODEL_LIMITS.imageSize}`
      );
    }
  }
  if (images.length > UNIT_MODEL_LIMITS.images) {
    problems.push(
      `${images.length} images, more than ${UNIT_MODEL_LIMITS.images}`
    );
  }
  if (
    requireCompression &&
    images.some((image) => image.mimeType !== "image/ktx2")
  ) {
    problems.push("model images must use KTX2");
  }
  if (
    requireCompression &&
    (gltf.textures ?? []).some(
      (texture) => !texture.extensions?.KHR_texture_basisu
    )
  ) {
    problems.push("model textures must use KHR_texture_basisu");
  }
};

/** Validate the published bytes, not just extension declarations or a raw source. */
export const checkUnitModel = (
  data: Uint8Array,
  requireCompression = true
): UnitModelReport => {
  const gltf = readUnitGltf(data);
  const problems: string[] = [];
  const clips = checkClips(gltf, problems);
  const bones = checkBones(gltf, problems);
  const triangles = checkGeometry(gltf, requireCompression, problems);
  checkImages(gltf, requireCompression, problems, data);
  if (data.byteLength > UNIT_MODEL_LIMITS.bytes) {
    problems.push(
      `${data.byteLength} bytes, more than ${UNIT_MODEL_LIMITS.bytes}`
    );
  }
  return { problems, clips, bones, triangles, bytes: data.byteLength };
};
