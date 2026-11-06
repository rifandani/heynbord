/**
 * The record of one Review Scene capture, and the Review Gate that reads it.
 * The fields follow the manifest of the img2threejs render bridge
 * (`forge/stage4_review/render_bridge.py`), so its `validate` command can read
 * this file too.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import {
  REVIEW_CANVAS,
  REVIEW_VIEWS,
  reviewCameras,
} from "../../../apps/web/src/features/battle/scene/review-camera.ts";
import type { ReviewCamera } from "../../../apps/web/src/features/battle/scene/review-camera.ts";
import type { UnitClipName } from "../../../apps/web/src/features/battle/scene/unit-clips.ts";

const REVIEW_CLIPS = [
  "idle",
  "attack",
  "death",
] as const satisfies readonly UnitClipName[];
const CLIP_PERCENTS = [0, 50, 100] as const;

interface ClipFrame {
  readonly name: (typeof REVIEW_CLIPS)[number];
  readonly percent: (typeof CLIP_PERCENTS)[number];
}

export interface ReviewCapture {
  readonly id: string;
  readonly role: "view" | "clip-frame";
  readonly camera: ReviewCamera;
  readonly clip?: ClipFrame;
}

/**
 * Every capture of the Review Scene, in capture order. The clip frames use the
 * front camera, because a full figure stays in the frame there for every pose.
 */
export const reviewCaptures = (
  identityAzimuth: number
): readonly ReviewCapture[] => {
  const cameras = reviewCameras(identityAzimuth);
  return [
    ...REVIEW_VIEWS.map((view): ReviewCapture => ({
      id: view,
      role: "view",
      camera: cameras[view],
    })),
    ...REVIEW_CLIPS.flatMap((name) =>
      CLIP_PERCENTS.map((percent): ReviewCapture => ({
        id: `${name}-${percent}`,
        role: "clip-frame",
        camera: cameras.front,
        clip: { name, percent },
      }))
    ),
  ];
};

/** The azimuth of the identity feature changes a camera, not the list of captures. */
const REQUIRED_CAPTURES = reviewCaptures(0);

export interface ReviewRecord {
  readonly runtime: {
    readonly url: string;
    readonly threeVersion: string;
  };
  /** The path of the card painting. */
  readonly reference: string;
  readonly model: {
    readonly name: string;
    /** The path of the published GLB. */
    readonly file: string;
    readonly identity: {
      readonly feature: string;
      readonly azimuthDegrees: number;
    };
  };
  readonly captures: readonly (ReviewCapture & {
    readonly consoleErrors: readonly string[];
  })[];
}

interface ReviewReport {
  readonly passed: boolean;
  readonly errors: readonly string[];
  readonly recordedCaptures: number;
}

const imageWidth = REVIEW_CANVAS.width * REVIEW_CANVAS.devicePixelRatio;
const imageHeight = REVIEW_CANVAS.height * REVIEW_CANVAS.devicePixelRatio;

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const hashOf = async (file: string): Promise<string> =>
  sha256(await readFile(file));

export const imageFile = (id: string): string => `${id}.png`;

const recordCapture = async (
  directory: string,
  { camera, clip, consoleErrors, id, role }: ReviewRecord["captures"][number]
) => {
  const file = imageFile(id);
  const bytes = await readFile(path.join(directory, file));
  const { format, height, width } = await sharp(bytes).metadata();
  const image = { type: format, width, height };
  const screenshotSha256 = sha256(bytes);
  return {
    id,
    role,
    ...camera,
    clip,
    path: file,
    status: "recorded",
    screenshotSha256,
    consoleErrors,
    passes: {
      beauty: {
        path: file,
        status: "recorded",
        image,
        sha256: screenshotSha256,
      },
    },
  };
};

/** Writes the manifest for images that are already next to it. */
export const writeManifest = async (
  manifestPath: string,
  { captures, model, reference, runtime }: ReviewRecord
): Promise<void> => {
  const directory = path.dirname(manifestPath);
  const relative = (file: string): string =>
    path.relative(directory, file).split(path.sep).join("/");
  const manifest = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    runtime: {
      url: runtime.url,
      route: new URL(runtime.url).pathname,
      viewport: [REVIEW_CANVAS.width, REVIEW_CANVAS.height],
      devicePixelRatio: REVIEW_CANVAS.devicePixelRatio,
      renderer: "WebGLRenderer",
      threeVersion: runtime.threeVersion,
      readySignal: "window.__IMG2THREEJS_READY__",
      captureContract: "window.__IMG2THREEJS_CAPTURE__",
    },
    reference: {
      kind: "image",
      path: relative(reference),
      sha256: await hashOf(reference),
      comparisonBasis: "source-image",
      renderRequired: false,
    },
    model: {
      name: model.name,
      path: relative(model.file),
      sha256: await hashOf(model.file),
      identity: model.identity,
    },
    captures: await Promise.all(
      captures.map((capture) => recordCapture(directory, capture))
    ),
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

interface CaptureEntry {
  readonly id: string;
  readonly path: string;
  readonly screenshotSha256: string;
  readonly consoleErrors: readonly string[];
}

interface HashedFile {
  readonly path: string;
  readonly sha256: string;
}

interface ManifestFile {
  readonly reference: HashedFile;
  readonly model: HashedFile;
  readonly captures: readonly CaptureEntry[];
}

const readBytes = async (file: string): Promise<Buffer | null> => {
  try {
    return await readFile(file);
  } catch {
    return null;
  }
};

const sourceErrors = async (
  directory: string,
  label: string,
  source: HashedFile
): Promise<readonly string[]> => {
  const bytes = await readBytes(path.join(directory, source.path));
  return bytes && sha256(bytes) === source.sha256
    ? []
    : [`the ${label} hash does not match the file`];
};

/** The size of an image, or null if it does not decode completely. */
const decodedSize = async (
  bytes: Buffer
): Promise<{ readonly width: number; readonly height: number } | null> => {
  try {
    const { info } = await sharp(bytes)
      .raw()
      .toBuffer({ resolveWithObject: true });
    return info;
  } catch {
    return null;
  }
};

const imageErrors = async (
  bytes: Buffer,
  capture: CaptureEntry
): Promise<readonly string[]> => {
  const size = await decodedSize(bytes);
  if (!size) {
    return [`${capture.id}: the image is not readable: ${capture.path}`];
  }
  return size.width === imageWidth && size.height === imageHeight
    ? []
    : [
        `${capture.id}: the image is ${size.width} × ${size.height}, not ${imageWidth} × ${imageHeight}`,
      ];
};

const captureErrors = async (
  directory: string,
  capture: CaptureEntry
): Promise<readonly string[]> => {
  const consoleLines = capture.consoleErrors.map(
    (message) => `${capture.id}: browser console error: ${message}`
  );
  const bytes = await readBytes(path.join(directory, capture.path));
  if (!bytes) {
    return [
      ...consoleLines,
      `${capture.id}: the file is missing: ${capture.path}`,
    ];
  }
  if (sha256(bytes) !== capture.screenshotSha256) {
    return [...consoleLines, `${capture.id}: the hash does not match the file`];
  }
  return [...consoleLines, ...(await imageErrors(bytes, capture))];
};

/**
 * The Review Gate of the Review Scene. Every required capture exists, every
 * image decodes at the size of the Review canvas, and every hash matches its
 * file.
 */
export const validateManifest = async (
  manifestPath: string
): Promise<ReviewReport> => {
  const directory = path.dirname(manifestPath);
  // SAFETY: `writeManifest` writes this shape. A hand edit that breaks it makes this Review Gate throw, and a throw blocks the model too.
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf-8")
  ) as ManifestFile;
  const ids = new Set(manifest.captures.map(({ id }) => id));
  const missing = REQUIRED_CAPTURES.filter(({ id }) => !ids.has(id)).map(
    ({ id }) => `missing capture: ${id}`
  );
  const perCapture = await Promise.all(
    manifest.captures.map((capture) => captureErrors(directory, capture))
  );
  const errors = [
    ...missing,
    ...(await sourceErrors(directory, "reference", manifest.reference)),
    ...(await sourceErrors(directory, "model", manifest.model)),
    ...perCapture.flat(),
  ];
  return {
    passed: errors.length === 0,
    errors,
    recordedCaptures: manifest.captures.length,
  };
};
