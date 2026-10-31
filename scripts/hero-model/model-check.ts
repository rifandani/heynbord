import { HERO_CLIP_NAMES } from "../../apps/web/src/features/battle/scene/hero-clips.ts";
import { compressedPrimitive, readModelGltf } from "../model-gltf.ts";
import type { ModelGltf } from "../model-gltf.ts";

/** Individual Hero limits stay separate from the whole-Battle allowance. */
export const HERO_MODEL_LIMITS = {
  bytes: 10_000_000,
  triangles: 60_000,
  bones: 32,
  images: 0,
} as const;

export interface HeroModelReport {
  readonly problems: readonly string[];
  readonly clips: readonly string[];
  readonly bones: number;
  readonly triangles: number;
  readonly bytes: number;
}

const checkClips = (clips: readonly string[], problems: string[]): void => {
  for (const name of clips) {
    if (!HERO_CLIP_NAMES.some((clip) => clip === name)) {
      problems.push(`unknown clip "${name}"`);
    }
  }
  for (const name of HERO_CLIP_NAMES) {
    if (!clips.includes(name)) {
      problems.push(`no "${name}" clip`);
    }
  }
};

const checkBones = (gltf: ModelGltf): number =>
  Math.max(0, ...(gltf.skins ?? []).map((skin) => skin.joints.length));

const checkGeometry = (
  gltf: ModelGltf,
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
  if (triangles > HERO_MODEL_LIMITS.triangles) {
    problems.push(
      `${triangles} triangles, more than ${HERO_MODEL_LIMITS.triangles}`
    );
  }
  return triangles;
};

/** Validate the published bytes, not just extension declarations or a raw source. */
export const checkHeroModel = (
  data: Uint8Array,
  requireCompression = true
): HeroModelReport => {
  const gltf = readModelGltf(data);
  const problems: string[] = [];
  const clips = (gltf.animations ?? []).map((clip) => clip.name ?? "");
  checkClips(clips, problems);
  const bones = checkBones(gltf);
  if (bones === 0) {
    problems.push("no skin");
  }
  if (bones > HERO_MODEL_LIMITS.bones) {
    problems.push(`${bones} bones, more than ${HERO_MODEL_LIMITS.bones}`);
  }
  const triangles = checkGeometry(gltf, requireCompression, problems);
  const images = gltf.images ?? [];
  if (images.length > HERO_MODEL_LIMITS.images) {
    problems.push(
      `${images.length} images, Hero Models use vertex colors and no images`
    );
  }
  if (data.byteLength > HERO_MODEL_LIMITS.bytes) {
    problems.push(
      `${data.byteLength} bytes, more than ${HERO_MODEL_LIMITS.bytes}`
    );
  }
  return { problems, clips, bones, triangles, bytes: data.byteLength };
};
