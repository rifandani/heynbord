import type { Accessor, Document } from "@gltf-transform/core";

import REGIONS from "./regions.json";

/** The glTF name of the `_region` attribute that `unit_model_kit.py` writes. */
export const REGION_ATTRIBUTE = "_REGION";

/**
 * The glTF name of the `_part` attribute of `unit_model_kit.py`. An id is a
 * position in the `PARTS_EXTRA` list + 1.
 */
export const PART_ATTRIBUTE = "_PART";

/** The attributes that only the review reads. A Published Model must not have them. */
export const REVIEW_ATTRIBUTES = [REGION_ATTRIBUTE, PART_ATTRIBUTE] as const;

/** The extra of the mesh node that has the part names, as a JSON array. */
export const PARTS_EXTRA = "unitParts";

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

/**
 * Removes the data that only the review reads. The game does not read it, so it
 * must not ship.
 */
export const stripReviewData = (document: Document): Document => {
  const accessors = new Set<Accessor>();
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      for (const name of REVIEW_ATTRIBUTES) {
        const accessor = primitive.getAttribute(name);
        if (accessor) {
          accessors.add(accessor);
          primitive.setAttribute(name, null);
        }
      }
    }
  }
  for (const accessor of accessors) {
    accessor.dispose();
  }
  for (const node of document.getRoot().listNodes()) {
    const { [PARTS_EXTRA]: _parts, ...extras } = node.getExtras();
    node.setExtras(extras);
  }
  return document;
};
