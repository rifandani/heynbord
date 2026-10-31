import {
  AnimationClip,
  Bone,
  BoxGeometry,
  Group,
  MeshBasicMaterial,
  Skeleton,
  SkinnedMesh,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { describe, expect, it, vi } from "vitest";

import type { HeroAppearance } from "@/features/battle/battle-session";
import { HERO_CLIP_NAMES } from "@/features/battle/scene/hero-clips";
import { loadHeroAppearance } from "@/features/hero/hero-model-loader";

const loadAsync = vi.hoisted(() => vi.fn());

// The loader imports Three's GLTFLoader lazily; the project test runner has no
// WebGL. Replace only that module boundary with a loader that returns figures.
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    public loadAsync = loadAsync;

    public setMeshoptDecoder(): this {
      return this;
    }
  },
}));

const heroModel = ({
  clips = HERO_CLIP_NAMES,
  skinned = true,
  bones = 1,
}: {
  readonly clips?: readonly string[];
  readonly skinned?: boolean;
  readonly bones?: number;
} = {}): GLTF => {
  const scene = new Group();
  if (skinned) {
    const skeleton = new Skeleton(
      Array.from({ length: bones }, () => new Bone())
    );
    const mesh = new SkinnedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial()
    );
    mesh.bind(skeleton);
    scene.add(mesh);
  }
  // SAFETY: the loader reads only the scene and animation fields of a GLTF.
  return {
    scene,
    animations: clips.map((name) => new AnimationClip(name, 1, [])),
  } as GLTF;
};

const appearance = (portrait: HeroAppearance["portrait"]): HeroAppearance => ({
  portrait,
  gearLook: null,
});

describe("loadHeroAppearance", () => {
  it("loads the one complete GLB and shares the in-flight request", async () => {
    loadAsync.mockResolvedValueOnce(heroModel());
    const first = loadHeroAppearance(appearance(null));
    expect(loadHeroAppearance(appearance(null))).toBe(first);
    await expect(first).resolves.toBeDefined();
    expect(loadAsync).toHaveBeenCalledWith(
      "/models/heroes/standard-standard.glb"
    );
  });

  it("rejects a model with a missing animation clip", async () => {
    loadAsync.mockResolvedValueOnce(
      heroModel({ clips: HERO_CLIP_NAMES.filter((name) => name !== "hurt") })
    );
    await expect(
      loadHeroAppearance(appearance("heroPortrait.dawnGaze"))
    ).rejects.toThrow("missing animation clips");
  });

  it("rejects a model with no SkinnedMesh and a model with no bones", async () => {
    loadAsync.mockResolvedValueOnce(heroModel({ skinned: false }));
    await expect(
      loadHeroAppearance(appearance("heroPortrait.verdantCrest"))
    ).rejects.toThrow("no skeleton");
    loadAsync.mockResolvedValueOnce(heroModel({ bones: 0 }));
    await expect(
      loadHeroAppearance(appearance("heroPortrait.mesaShade"))
    ).rejects.toThrow("no skeleton");
  });
});
