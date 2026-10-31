import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { describe, expect, it, vi } from "vitest";

import {
  configureModelLoader,
  createModelLoader,
} from "@/features/battle/scene/gltf-loader";

describe("configureModelLoader", () => {
  it("always attaches the Meshopt decoder", () => {
    const loader = new GLTFLoader();
    const meshopt = vi.spyOn(loader, "setMeshoptDecoder");
    configureModelLoader(loader);
    expect(meshopt).toHaveBeenCalledWith(MeshoptDecoder);
  });

  it("attaches the KTX2 decoder when the caller supplies one", () => {
    const loader = new GLTFLoader();
    const textures = new KTX2Loader();
    const ktx2 = vi.spyOn(loader, "setKTX2Loader");
    configureModelLoader(loader, textures);
    expect(ktx2).toHaveBeenCalledWith(textures);
  });

  it("leaves the KTX2 decoder off by default", () => {
    const loader = new GLTFLoader();
    const ktx2 = vi.spyOn(loader, "setKTX2Loader");
    configureModelLoader(loader);
    expect(ktx2).not.toHaveBeenCalled();
  });
});

describe("createModelLoader", () => {
  it("returns a configured glTF loader", () => {
    expect(createModelLoader()).toBeInstanceOf(GLTFLoader);
  });
});
