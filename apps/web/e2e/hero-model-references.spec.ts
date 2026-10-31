/* oxlint-disable promise/avoid-new -- IndexedDB uses event callbacks. */
import { mkdirSync } from "node:fs";
import path from "node:path";

import { newProfile } from "@workspace/rules";

import { expect, test } from "./_base";

const raw = path.resolve("public/models/heroes");
const evidence = path.resolve("art/heroes/raw/evidence");

// Route the published GLB fixtures through Playwright after the profile reload.
test.use({ serviceWorkers: "block" });

test("the first four appearances load in the shared Bazaar preview", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.route("**/models/heroes/*.glb", async (route) => {
    const name = path.basename(new URL(route.request().url()).pathname);
    await route.fulfill({
      path: path.join(raw, name),
      contentType: "model/gltf-binary",
    });
  });
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate(async () => {
    // SAFETY: the E2E build installs this hook before the wait above.
    await (
      window as Window & {
        __THREE_GAME_TEST_HOOKS__?: { profileSaved: () => Promise<void> };
      }
    ).__THREE_GAME_TEST_HOOKS__?.profileSaved();
  });
  const profile = newProfile(42);
  await page.evaluate(
    async (value) => {
      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("heynbord", 1);
        open.addEventListener("error", () => reject(open.error));
        open.addEventListener("success", () => {
          const db = open.result;
          const transaction = db.transaction("entries", "readwrite");
          transaction
            .objectStore("entries")
            .put({ key: "profile", value: JSON.stringify(value) });
          transaction.addEventListener("complete", () => {
            db.close();
            resolve();
          });
          transaction.addEventListener("error", () =>
            reject(transaction.error)
          );
        });
      });
    },
    { ...profile, cosmetics: ["heroPortrait.tentRings", "gearLook.goldInlay"] }
  );
  await page.reload();
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("town-shortcut-bazaar").click();
  const preview = page.getByTestId("hero-model-preview");
  mkdirSync(evidence, { recursive: true });
  const capture = async (name: string) => {
    await expect(preview).toHaveAttribute(
      "data-model",
      `/models/heroes/${name}.glb`,
      { timeout: 30_000 }
    );
    await expect(preview.locator("canvas")).toBeVisible();
    await preview.screenshot({
      path: path.join(evidence, `${name}-bazaar.png`),
    });
  };
  await capture("standard-standard");
  const gear = page.locator('[data-cosmetic-id="gearLook.goldInlay"]');
  await gear.getByTestId("bazaar-preview").click();
  await capture("standard-gold-inlay");
  const portrait = page.locator('[data-cosmetic-id="heroPortrait.tentRings"]');
  await portrait.getByRole("button", { name: "Use Tent Rings" }).click();
  await portrait.getByTestId("bazaar-preview").click();
  await capture("tent-rings-standard");
  await gear.getByTestId("bazaar-preview").click();
  await capture("tent-rings-gold-inlay");
  await expect(gear).not.toHaveAttribute("data-active", "true");
});
