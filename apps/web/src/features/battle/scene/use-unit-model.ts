import { useLoader, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import type { WebGLRenderer } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";

import { configureModelLoader } from "@/features/battle/scene/gltf-loader";

const textureLoaders = new WeakMap<WebGLRenderer, KTX2Loader>();

/** Unit models use the same mesh and texture decoders in every Battle. */
export const useUnitModel = (url: string) => {
  const renderer = useThree((state) => state.gl);
  const configure = useMemo(() => {
    let textures = textureLoaders.get(renderer);
    if (!textures) {
      textures = new KTX2Loader()
        .setTranscoderPath(`${import.meta.env.BASE_URL}decoders/basis/`)
        .detectSupport(renderer);
      textureLoaders.set(renderer, textures);
    }
    return (loader: GLTFLoader) => {
      configureModelLoader(loader, textures);
    };
  }, [renderer]);
  return useLoader(GLTFLoader, url, configure);
};
