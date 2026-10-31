/** The glTF fields used by model publication checks, without a renderer. */
export interface ModelPrimitive {
  readonly indices?: number;
  readonly mode?: number;
  readonly attributes: Readonly<Record<string, number>>;
  readonly extensions?: {
    readonly KHR_draco_mesh_compression?: { readonly bufferView: number };
  };
}

/** A published glTF document, read straight from its GLB bytes. */
export interface ModelGltf {
  readonly extensionsUsed?: readonly string[];
  readonly extensionsRequired?: readonly string[];
  readonly materials?: readonly { readonly name?: string }[];
  readonly animations?: readonly { readonly name?: string }[];
  readonly skins?: readonly { readonly joints: readonly number[] }[];
  readonly images?: readonly {
    readonly bufferView?: number;
    readonly mimeType?: string;
    readonly uri?: string;
  }[];
  readonly textures?: readonly {
    readonly source?: number;
    readonly extensions?: {
      readonly KHR_texture_basisu?: { readonly source: number };
    };
  }[];
  readonly accessors: readonly {
    readonly count: number;
    readonly bufferView?: number;
  }[];
  readonly bufferViews?: readonly {
    readonly byteOffset?: number;
    readonly byteLength?: number;
    readonly extensions?: {
      readonly EXT_meshopt_compression?: {
        readonly byteLength: number;
        readonly count: number;
      };
    };
  }[];
  readonly meshes: readonly {
    readonly primitives: readonly ModelPrimitive[];
  }[];
}

const GLB_MAGIC = 0x46_54_6c_67;
const JSON_CHUNK = 0x4e_4f_53_4a;

export const readModelGltf = (data: Uint8Array): ModelGltf => {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (
    buffer.byteLength < 20 ||
    buffer.readUInt32LE(0) !== GLB_MAGIC ||
    buffer.readUInt32LE(4) !== 2 ||
    buffer.readUInt32LE(8) !== buffer.byteLength ||
    buffer.readUInt32LE(16) !== JSON_CHUNK
  ) {
    throw new Error("Invalid GLB version 2 header or JSON chunk");
  }
  const length = buffer.readUInt32LE(12);
  if (length === 0 || length % 4 !== 0 || length > buffer.byteLength - 20) {
    throw new Error("Invalid GLB JSON length");
  }
  // SAFETY: the authoring input is glTF; the callers validate its contract.
  return JSON.parse(buffer.toString("utf-8", 20, 20 + length)) as ModelGltf;
};

/** True when Meshopt stores this accessor's bytes in a compressed view. */
const meshoptAccessor = (gltf: ModelGltf, index: number): boolean => {
  const view = gltf.accessors[index]?.bufferView;
  const compression =
    view === undefined
      ? undefined
      : gltf.bufferViews?.[view]?.extensions?.EXT_meshopt_compression;
  return Boolean(
    compression && compression.byteLength > 0 && compression.count > 0
  );
};

/** A primitive passes only when every attribute and the index buffer compress. */
export const compressedPrimitive = (
  gltf: ModelGltf,
  primitive: ModelPrimitive
): boolean => {
  if (primitive.extensions?.KHR_draco_mesh_compression) {
    return true;
  }
  return (
    Object.values(primitive.attributes).every((index) =>
      meshoptAccessor(gltf, index)
    ) &&
    (primitive.indices === undefined ||
      meshoptAccessor(gltf, primitive.indices))
  );
};

/** One problem for each primitive that stores uncompressed geometry. */
export const compressionProblems = (gltf: ModelGltf): readonly string[] => {
  const problems: string[] = [];
  for (const [meshIndex, mesh] of gltf.meshes.entries()) {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      if (!compressedPrimitive(gltf, primitive)) {
        problems.push(
          `mesh ${meshIndex} primitive ${primitiveIndex} has no Draco or Meshopt compression`
        );
      }
    }
  }
  return problems;
};
