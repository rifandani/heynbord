import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";

import { REVIEW_CANVAS } from "../../../apps/web/src/features/battle/scene/review-camera.ts";
import { reviewCaptures, validateManifest, writeManifest } from "./manifest.ts";
import type { ReviewRecord } from "./manifest.ts";

const WIDTH = REVIEW_CANVAS.width * REVIEW_CANVAS.devicePixelRatio;
const HEIGHT = REVIEW_CANVAS.height * REVIEW_CANVAS.devicePixelRatio;

const png = (width = WIDTH, height = HEIGHT): Promise<Buffer> =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 40, g: 90, b: 60 },
    },
  })
    .png()
    .toBuffer();

let directory = "";
let manifestPath = "";

const recordFor = (): ReviewRecord => ({
  runtime: {
    url: "http://localhost:4100/master-design?review=warden-saelith",
    threeVersion: "0",
  },
  reference: path.join(directory, "painting.webp"),
  model: {
    name: "warden-saelith",
    file: path.join(directory, "warden-saelith.glb"),
    identity: { feature: "recurved longbow", azimuthDegrees: 45 },
  },
  captures: reviewCaptures(45).map((capture) => ({
    ...capture,
    consoleErrors: [],
  })),
});

const imagePath = (id: string): string => path.join(directory, `${id}.png`);

const replaceImage = async (id: string, bytes: Buffer): Promise<void> => {
  await writeFile(imagePath(id), bytes);
};

const errorsOf = async (): Promise<readonly string[]> => {
  const { errors } = await validateManifest(manifestPath);
  return errors;
};

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "unit-model-review-"));
  manifestPath = path.join(directory, "manifest.json");
  await writeFile(path.join(directory, "painting.webp"), "painting");
  await writeFile(path.join(directory, "warden-saelith.glb"), "model");
  const image = await png();
  await Promise.all(
    reviewCaptures(45).map(({ id }) => writeFile(imagePath(id), image))
  );
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("reviewCaptures", () => {
  test("plans 6 views, 3 frames of 3 clips and 4 cutouts", () => {
    expect(reviewCaptures(45).map(({ id }) => id)).toEqual([
      "front",
      "right",
      "back",
      "left",
      "battle",
      "close-up",
      "idle-0",
      "idle-50",
      "idle-100",
      "attack-0",
      "attack-50",
      "attack-100",
      "death-0",
      "death-50",
      "death-100",
      "front-cutout",
      "right-cutout",
      "back-cutout",
      "left-cutout",
    ]);
  });

  test("gives a cutout the camera of its view", () => {
    const captures = reviewCaptures(45);
    const cameraOf = (id: string) =>
      captures.find((capture) => capture.id === id)?.camera;
    expect(cameraOf("left-cutout")).toEqual(cameraOf("left"));
  });

  test("uses the cutout pass only for a cutout", () => {
    const cutouts = reviewCaptures(45).filter(
      (capture) => capture.pass === "cutout"
    );
    expect(cutouts).toHaveLength(4);
    expect(cutouts.every(({ id }) => id.endsWith("-cutout"))).toBe(true);
  });
});

describe("validateManifest", () => {
  test("passes a complete set of images", async () => {
    await writeManifest(manifestPath, recordFor());

    await expect(validateManifest(manifestPath)).resolves.toEqual({
      passed: true,
      errors: [],
      recordedCaptures: 19,
    });
  });

  test("names a required view that the manifest does not have", async () => {
    const record = recordFor();
    await writeManifest(manifestPath, {
      ...record,
      captures: record.captures.filter(({ id }) => id !== "back"),
    });

    await expect(errorsOf()).resolves.toEqual(["missing capture: back"]);
  });

  test("names a required cutout that the manifest does not have", async () => {
    const record = recordFor();
    await writeManifest(manifestPath, {
      ...record,
      captures: record.captures.filter(({ id }) => id !== "left-cutout"),
    });

    await expect(errorsOf()).resolves.toEqual(["missing capture: left-cutout"]);
  });

  test("names an image that has no file", async () => {
    await writeManifest(manifestPath, recordFor());
    await rm(imagePath("death-50"));

    await expect(errorsOf()).resolves.toEqual([
      "death-50: the file is missing: death-50.png",
    ]);
  });

  test("names an image that cannot decode", async () => {
    await writeManifest(manifestPath, recordFor());
    await truncate(imagePath("front"), 40);
    const hash = createHash("sha256")
      .update(await readFile(imagePath("front")))
      .digest("hex");
    const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
    manifest.captures[0].screenshotSha256 = hash;
    await writeFile(manifestPath, JSON.stringify(manifest));

    await expect(errorsOf()).resolves.toEqual([
      "front: the image is not readable: front.png",
    ]);
  });

  test("names an image of the wrong size", async () => {
    await replaceImage("right", await png(100, 100));
    await writeManifest(manifestPath, recordFor());

    await expect(errorsOf()).resolves.toEqual([
      `right: the image is 100 × 100, not ${WIDTH} × ${HEIGHT}`,
    ]);
  });

  test("names an image that changed after the capture", async () => {
    await writeManifest(manifestPath, recordFor());
    const image = await png();
    await replaceImage("battle", Buffer.concat([image, Buffer.from([0])]));

    await expect(errorsOf()).resolves.toEqual([
      "battle: the hash does not match the file",
    ]);
  });

  test("names a capture that had a browser console error", async () => {
    const record = recordFor();
    await writeManifest(manifestPath, {
      ...record,
      captures: record.captures.map((capture) =>
        capture.id === "left"
          ? { ...capture, consoleErrors: ["WebGL context lost"] }
          : capture
      ),
    });

    await expect(errorsOf()).resolves.toEqual([
      "left: browser console error: WebGL context lost",
    ]);
  });

  test("names a reference or a model that changed after the capture", async () => {
    await writeManifest(manifestPath, recordFor());
    await writeFile(path.join(directory, "painting.webp"), "another painting");
    await writeFile(
      path.join(directory, "warden-saelith.glb"),
      "another model"
    );

    await expect(errorsOf()).resolves.toEqual([
      "the reference hash does not match the file",
      "the model hash does not match the file",
    ]);
  });
});
