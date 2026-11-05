import type { Accessor, Document } from "@gltf-transform/core";

import REGIONS from "./regions.json";

/** The glTF name of the `_region` attribute that `unit_model_kit.py` writes. */
export const REGION_ATTRIBUTE = "_REGION";

/** An id is a position in `regions.json` + 1, so a vertex with 0 from the join fails. */
const isRegionId = (value: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= REGIONS.length;

/** One problem for each primitive of a Raw Export with a vertex that has no region. */
export const regionProblems = (document: Document): readonly string[] => {
  const problems: string[] = [];
  for (const [meshIndex, mesh] of document.getRoot().listMeshes().entries()) {
    for (const [index, primitive] of mesh.listPrimitives().entries()) {
      const label = `mesh ${meshIndex} primitive ${index}`;
      const accessor = primitive.getAttribute(REGION_ATTRIBUTE);
      if (accessor) {
        const invalid = [...(accessor.getArray() ?? [])].filter(
          (value) => !isRegionId(value)
        ).length;
        if (invalid > 0) {
          problems.push(
            `${label} has ${invalid} vertices with no valid region`
          );
        }
      } else {
        problems.push(`${label} has no ${REGION_ATTRIBUTE} attribute`);
      }
    }
  }
  return problems;
};

/** Removes the region data. The game does not read it, so it must not ship. */
export const stripRegion = (document: Document): Document => {
  const accessors = new Set<Accessor>();
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const accessor = primitive.getAttribute(REGION_ATTRIBUTE);
      if (accessor) {
        accessors.add(accessor);
        primitive.setAttribute(REGION_ATTRIBUTE, null);
      }
    }
  }
  for (const accessor of accessors) {
    accessor.dispose();
  }
  return document;
};
