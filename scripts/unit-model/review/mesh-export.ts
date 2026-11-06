/**
 * The adapter between a Raw Export and the Review Gates. The kit joins each
 * Unit Model into one mesh, and a gate must name a part of it. This file splits
 * the mesh again with the `_PART` and `_REGION` attributes.
 *
 * A mesh of the export is one island: a connected shape of one part. The parts
 * of a figure push into each other, and a ray test of the joined mesh reports
 * this overlap as a defect. The test is correct only for one closed shape.
 */
import type { Document, Node, Primitive } from "@gltf-transform/core";

import { PART_ATTRIBUTE, PARTS_EXTRA, REGION_ATTRIBUTE } from "../region.ts";
import REGIONS from "../regions.json";

type Vector3 = readonly [number, number, number];
type Triangle = readonly [number, number, number];

export interface ExportedMesh {
  readonly id: string;
  readonly part: string;
  readonly region: string;
  /** False: an edge has only one triangle, so a ray test cannot find the inside. */
  readonly closed: boolean;
  readonly vertices: readonly Vector3[];
  readonly normals: readonly Vector3[];
  /** Linear RGB, as the vertex colors of the Raw Export. */
  readonly colors: readonly Vector3[];
  readonly indices: readonly Triangle[];
  /** The bones that move this island, the one with the most weight first. */
  readonly bones: readonly string[];
}

export interface ExportedBone {
  readonly id: string;
  readonly parent: string | null;
  readonly jointPos: Vector3;
}

export interface MeshExport {
  readonly meshes: readonly ExportedMesh[];
  readonly bones: readonly ExportedBone[];
}

/** The same rounding as the vertex identity of `self_intersection.py`. */
const WELD_PRECISION = 6;

const weldKey = ([x, y, z]: Vector3): string =>
  [x, y, z].map((value) => value.toFixed(WELD_PRECISION)).join(",");

const worldPoint = (node: Node, [x, y, z]: Vector3): Vector3 => {
  const m = node.getWorldMatrix();
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
};

const partNames = (node: Node): readonly string[] => {
  const names = node.getExtras()[PARTS_EXTRA];
  if (names === undefined) {
    throw new TypeError(
      `no ${PARTS_EXTRA} extra: run the build script in Blender again`
    );
  }
  // SAFETY: `join_parts` of the kit writes a JSON array of strings here.
  return JSON.parse(String(names)) as readonly string[];
};

const vectorsOf = (
  values: ArrayLike<number> | null | undefined,
  count: number
): readonly Vector3[] =>
  Array.from({ length: count }, (_, index): Vector3 => [
    values?.[index * 3] ?? 0,
    values?.[index * 3 + 1] ?? 0,
    values?.[index * 3 + 2] ?? 0,
  ]);

/** Groups the items that a key connects: a small union-find. */
const connectedGroups = (
  count: number,
  links: readonly (readonly [number, number])[]
): readonly number[] => {
  const parents = Array.from({ length: count }, (_, index) => index);
  const find = (start: number): number => {
    let item = start;
    while (parents[item] !== item) {
      const parent = parents[item] ?? item;
      parents[item] = parents[parent] ?? parent;
      item = parent;
    }
    return item;
  };
  for (const [one, other] of links) {
    parents[find(one)] = find(other);
  }
  return parents.map((_, index) => find(index));
};

const edgesOf = ([a, b, c]: readonly [string, string, string]) =>
  [
    [a, b],
    [b, c],
    [c, a],
  ].map((edge) => edge.toSorted().join("|"));

/** True when each edge has exactly 2 triangles, at the welded positions. */
const isClosed = (keys: readonly (readonly [string, string, string])[]) => {
  const uses = new Map<string, number>();
  for (const edge of keys.flatMap(edgesOf)) {
    uses.set(edge, (uses.get(edge) ?? 0) + 1);
  }
  return [...uses.values()].every((count) => count === 2);
};

interface PrimitiveData {
  readonly vertices: readonly Vector3[];
  readonly normals: readonly Vector3[];
  readonly colors: readonly Vector3[];
  readonly parts: ArrayLike<number>;
  readonly regions: ArrayLike<number>;
  readonly triangles: readonly Triangle[];
  /** The bone name and the weight of each influence of each vertex. */
  readonly weights: readonly (readonly (readonly [string, number])[])[];
}

/** Splits the triangles of one part into its connected shapes. */
const islandsOf = (
  data: PrimitiveData,
  triangles: readonly Triangle[]
): readonly (readonly Triangle[])[] => {
  const firstAt = new Map<string, number>();
  const links: (readonly [number, number])[] = [];
  for (const [index, triangle] of triangles.entries()) {
    for (const corner of triangle) {
      const key = weldKey(data.vertices[corner] ?? [0, 0, 0]);
      const first = firstAt.get(key);
      if (first === undefined) {
        firstAt.set(key, index);
      } else {
        links.push([first, index]);
      }
    }
  }
  const groups = connectedGroups(triangles.length, links);
  const islands = new Map<number, Triangle[]>();
  for (const [index, group] of groups.entries()) {
    const triangle = triangles[index];
    if (triangle) {
      islands.set(group, [...(islands.get(group) ?? []), triangle]);
    }
  }
  return [...islands.values()];
};

const meshOf = (
  data: PrimitiveData,
  id: string,
  part: string,
  triangles: readonly Triangle[]
): ExportedMesh => {
  const corners = [...new Set(triangles.flat())].toSorted((a, b) => a - b);
  const local = new Map(corners.map((corner, index) => [corner, index]));
  const pick = (values: readonly Vector3[]): readonly Vector3[] =>
    corners.map((corner) => values[corner] ?? [0, 0, 0]);
  const [first = 0] = corners;
  const weightOf = new Map<string, number>();
  for (const [bone, weight] of corners.flatMap(
    (corner) => data.weights[corner] ?? []
  )) {
    weightOf.set(bone, (weightOf.get(bone) ?? 0) + weight);
  }
  return {
    id,
    part,
    region: REGIONS[(data.regions[first] ?? 0) - 1] ?? "none",
    closed: isClosed(
      triangles.map(([a, b, c]) => [
        weldKey(data.vertices[a] ?? [0, 0, 0]),
        weldKey(data.vertices[b] ?? [0, 0, 0]),
        weldKey(data.vertices[c] ?? [0, 0, 0]),
      ])
    ),
    vertices: pick(data.vertices),
    normals: pick(data.normals),
    colors: pick(data.colors),
    indices: triangles.map(([a, b, c]) => [
      local.get(a) ?? 0,
      local.get(b) ?? 0,
      local.get(c) ?? 0,
    ]),
    bones: [...weightOf.entries()]
      .toSorted(([, one], [, other]) => other - one)
      .map(([bone]) => bone),
  };
};

const trianglesOf = (
  indices: ArrayLike<number> | null | undefined,
  count: number
): readonly Triangle[] =>
  Array.from({ length: Math.floor((indices?.length ?? count) / 3) }, (_, t) => [
    indices?.[t * 3] ?? t * 3,
    indices?.[t * 3 + 1] ?? t * 3 + 1,
    indices?.[t * 3 + 2] ?? t * 3 + 2,
  ]);

/** The weights of each vertex, with bone names and no zero weights. */
const weightsOf = (
  node: Node,
  primitive: Primitive,
  count: number
): PrimitiveData["weights"] => {
  const joints = primitive.getAttribute("JOINTS_0")?.getArray();
  const weights = primitive.getAttribute("WEIGHTS_0")?.getArray();
  const names = node.getSkin()?.listJoints() ?? [];
  return Array.from({ length: count }, (_, vertex) =>
    [0, 1, 2, 3].flatMap((slot): (readonly [string, number])[] => {
      const weight = weights?.[vertex * 4 + slot] ?? 0;
      const bone = names[joints?.[vertex * 4 + slot] ?? 0];
      return weight > 0 && bone ? [[bone.getName(), weight]] : [];
    })
  );
};

const primitiveMeshes = (
  node: Node,
  names: readonly string[]
): readonly ExportedMesh[] =>
  (node.getMesh()?.listPrimitives() ?? []).flatMap((primitive) => {
    const position = primitive.getAttribute("POSITION");
    const count = position?.getCount() ?? 0;
    const parts = primitive.getAttribute(PART_ATTRIBUTE)?.getArray();
    if (!parts) {
      throw new Error(
        `no ${PART_ATTRIBUTE} attribute: run the build script in Blender again`
      );
    }
    const invalid = Array.from({ length: count }, (_, index) =>
      Boolean(names[(parts[index] ?? 0) - 1])
    ).filter((valid) => !valid).length;
    if (invalid > 0) {
      throw new Error(`${invalid} vertices have no valid part`);
    }
    const data: PrimitiveData = {
      vertices: vectorsOf(position?.getArray(), count).map((point) =>
        worldPoint(node, point)
      ),
      normals: vectorsOf(primitive.getAttribute("NORMAL")?.getArray(), count),
      colors: vectorsOf(primitive.getAttribute("COLOR_0")?.getArray(), count),
      parts,
      regions: primitive.getAttribute(REGION_ATTRIBUTE)?.getArray() ?? [],
      triangles: trianglesOf(primitive.getIndices()?.getArray(), count),
      weights: weightsOf(node, primitive, count),
    };
    return names.flatMap((name, index) => {
      const triangles = data.triangles.filter(
        ([corner]) => parts[corner] === index + 1
      );
      const islands = islandsOf(data, triangles);
      return islands.map((island, number) =>
        meshOf(
          data,
          islands.length > 1 ? `${name}#${number}` : name,
          name,
          island
        )
      );
    });
  });

const bonesOf = (document: Document): readonly ExportedBone[] => {
  const joints = document
    .getRoot()
    .listSkins()
    .flatMap((skin) => skin.listJoints());
  return joints.map((joint) => {
    const parent = joint.getParentNode();
    const [x = 0, y = 0, z = 0] = joint.getWorldTranslation();
    return {
      id: joint.getName(),
      parent: parent && joints.includes(parent) ? parent.getName() : null,
      jointPos: [x, y, z],
    };
  });
};

/** The parts of a Raw Export as closed or open islands, and its rest-pose bones. */
export const exportMeshes = (document: Document): MeshExport => {
  const nodes = document
    .getRoot()
    .listNodes()
    .filter((node) => node.getMesh());
  return {
    meshes: nodes.flatMap((node) => primitiveMeshes(node, partNames(node))),
    bones: bonesOf(document),
  };
};
