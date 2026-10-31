import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";

/**
 * Every published model uses Meshopt. A model with images also needs KTX2.
 * Keep one configuration so the Unit and Hero loaders cannot drift.
 */
export const configureModelLoader = (
  loader: GLTFLoader,
  textures?: KTX2Loader
): void => {
  loader.setMeshoptDecoder(MeshoptDecoder);
  if (textures !== undefined) {
    loader.setKTX2Loader(textures);
  }
};

export const createModelLoader = (textures?: KTX2Loader): GLTFLoader => {
  const loader = new GLTFLoader();
  configureModelLoader(loader, textures);
  return loader;
};
