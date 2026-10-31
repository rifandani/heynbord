import { constants, copyFileSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";

import { expect, test } from "./_base";

const reference = path.resolve("public/models/heroes/standard-standard.glb");
const publicFolder = path.resolve("public/models/heroes");
const fixture = path.join(publicFolder, "offline-check.glb");
const fixtureUrl = "/models/heroes/offline-check.glb";

test("the service worker keeps a visited Hero model across reloads", async ({
  page,
}) => {
  test.setTimeout(90_000);
  mkdirSync(publicFolder, { recursive: true });
  // Never overwrite a file in the public model directory.
  copyFileSync(reference, fixture, constants.COPYFILE_EXCL);
  try {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    const initial = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const body = await response.arrayBuffer();
      return {
        ok: response.ok,
        bytes: body.byteLength,
      };
    }, fixtureUrl);
    expect(initial.ok).toBe(true);
    expect(initial.bytes).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(async (url) => {
          const cache = await caches.open("web-art-v1");
          return Boolean(await cache.match(url));
        }, fixtureUrl)
      )
      .toBe(true);
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await page.context().setOffline(true);
    const cached = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const body = await response.arrayBuffer();
      return {
        ok: response.ok,
        bytes: body.byteLength,
      };
    }, fixtureUrl);
    expect(cached).toEqual(initial);
  } finally {
    await page.context().setOffline(false);
    unlinkSync(fixture);
  }
});
