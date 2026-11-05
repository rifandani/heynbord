import type { Document } from "@gltf-transform/core";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

import { stripRegion } from "./region.ts";

/** The packer's change to a Raw Export: remove the review data, then compress. */
export const compressUnitModel = (document: Document): Promise<void> =>
  stripRegion(document).transform(
    meshopt({ encoder: MeshoptEncoder, level: "medium" })
  );
