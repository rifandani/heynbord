/* oxlint-disable eslint/no-await-in-loop -- one browser page captures the Review Scene in sequence */
/**
 * Captures the Review Scene of each named Unit Model through the real Battle
 * stage, then writes and checks its manifest.
 *
 * Usage:
 *   bun scripts/unit-model/review/capture.ts warden-saelith [name...] [--date 2026-11-06]
 *
 * The dev server must be running, because `/master-design` is only in a
 * development build:
 *   cd apps/web && bunx vite --port 4100 --strictPort
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

import { REVIEW_CANVAS } from "../../../apps/web/src/features/battle/scene/review-camera.ts";
import type { ReviewCaptureApi } from "../../../apps/web/src/master-design/showcases/unit-model-stage.tsx";
import {
  imageFile,
  reviewCaptures,
  validateManifest,
  writeManifest,
} from "./manifest.ts";
import type { ReviewCapture, ReviewRecord } from "./manifest.ts";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const CREATURES = "apps/web/public/creature";
const READY_TIMEOUT = 60_000;

const { positionals: names, values: options } = parseArgs({
  allowPositionals: true,
  options: {
    "base-url": { type: "string", default: "http://localhost:4100" },
    date: { type: "string", default: new Date().toISOString().slice(0, 10) },
  },
});

interface ReviewSubject {
  readonly identity: ReviewRecord["model"]["identity"];
}

const readSubject = async (name: string): Promise<ReviewSubject> => {
  const file = path.join(ROOT, "scripts/unit-model/specs", `${name}.json`);
  // SAFETY: `unit-model:spec:check` validates each spec against the schema that requires `identity`.
  return JSON.parse(await readFile(file, "utf-8")) as ReviewSubject;
};

const findPainting = async (name: string): Promise<string> => {
  const races = await readdir(path.join(ROOT, CREATURES));
  const paintings = races.map((race) =>
    path.join(ROOT, CREATURES, race, `${name}.webp`)
  );
  const painting = paintings.find((file) => existsSync(file));
  if (painting === undefined) {
    throw new Error(`${name} has no card painting in ${CREATURES}`);
  }
  return painting;
};

const openStage = async (
  browser: Browser,
  url: string
): Promise<{ readonly page: Page; readonly errors: string[] }> => {
  const page = await browser.newPage({
    viewport: { width: REVIEW_CANVAS.width, height: REVIEW_CANVAS.height },
    deviceScaleFactor: REVIEW_CANVAS.devicePixelRatio,
    reducedMotion: "reduce",
  });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => window.__IMG2THREEJS_READY__ === true,
    null,
    {
      timeout: READY_TIMEOUT,
    }
  );
  return { page, errors };
};

const captureOne = async (
  page: Page,
  capture: ReviewCapture,
  file: string
): Promise<void> => {
  const { selector } = await page.evaluate(
    async ({ camera, clip, passId }) => {
      // SAFETY: `openStage` waited for the ready signal, and the stage installs the API before it sets that signal.
      const api = window.__IMG2THREEJS_CAPTURE__ as ReviewCaptureApi;
      await api.setCamera(camera);
      return api.capturePass({
        passId,
        clip: clip && { name: clip.name, phase: clip.percent / 100 },
      });
    },
    { camera: capture.camera, clip: capture.clip, passId: capture.pass }
  );
  if (capture.pass === "beauty") {
    await page.locator(selector).screenshot({ path: file });
    return;
  }
  // A screenshot also shows the page behind the canvas. The canvas pixels do not.
  const dataUrl = await page
    .locator(selector)
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL("image/png"));
  const [, base64 = ""] = dataUrl.split(",");
  await writeFile(file, Buffer.from(base64, "base64"));
};

const captureModel = async (
  browser: Browser,
  name: string,
  date: string
): Promise<void> => {
  const directory = path.join(ROOT, "artifacts/unit-model-review", name, date);
  await mkdir(directory, { recursive: true });
  const { identity } = await readSubject(name);
  const url = `${options["base-url"]}/master-design?review=${name}`;
  const { errors, page } = await openStage(browser, url);
  const captures: ReviewRecord["captures"][number][] = [];
  for (const capture of reviewCaptures(identity.azimuthDegrees)) {
    await captureOne(
      page,
      capture,
      path.join(directory, imageFile(capture.id))
    );
    // The first capture also records the errors of the page load.
    captures.push({ ...capture, consoleErrors: errors.splice(0) });
  }
  const threeVersion = await page.evaluate(() => {
    // SAFETY: Three.js writes its version here when it loads.
    const scope = window as Window & { readonly __THREE__?: string };
    return scope.__THREE__ ?? "unknown";
  });
  await page.close();
  const manifestPath = path.join(directory, "manifest.json");
  await writeManifest(manifestPath, {
    runtime: { url, threeVersion },
    reference: await findPainting(name),
    model: {
      name,
      file: path.join(ROOT, "apps/web/public/models/units", `${name}.glb`),
      identity,
    },
    captures,
  });
  const report = await validateManifest(manifestPath);
  const gateRecord = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(path.join(directory, "review-gate.json"), gateRecord);
  console.log(`${manifestPath}\n${gateRecord}`);
  if (!report.passed) {
    process.exitCode = 1;
  }
};

if (names.length === 0) {
  console.error("Give one or more Unit Model names.");
  process.exit(1);
}

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  for (const name of names) {
    await captureModel(browser, name, options.date);
  }
} finally {
  await browser.close();
}
