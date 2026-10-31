import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "./_base";

const reference = path.resolve("public/models/heroes/standard-standard.glb");
const evidence = path.resolve("art/heroes/raw/evidence");

test.describe("Hero Model draft", () => {
  test.skip(
    process.env.VITE_HERO_MODEL_PREVIEW !== "1" || !existsSync(reference),
    "Publish the Hero Models and enable the local draft to run this check."
  );

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 844, height: 390 },
  ]) {
    test(`loads, retries and rotates at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize(viewport);
      let requests = 0;
      let fail = true;
      await page.route(
        "**/models/heroes/standard-standard.glb",
        async (route) => {
          requests += 1;
          if (fail) {
            await route.abort();
            return;
          }
          await route.fulfill({
            path: reference,
            contentType: "model/gltf-binary",
          });
        }
      );
      await page.goto("/play");
      await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
      await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
      await page.evaluate(() => {
        // SAFETY: the E2E build installs the hook before this call.
        (
          window as Window & {
            __THREE_GAME_TEST_HOOKS__?: { setXp: (xp: number) => void };
          }
        ).__THREE_GAME_TEST_HOOKS__?.setXp(640);
      });
      await page.getByTestId("town-shortcut-hero").click();
      await expect(page.getByText("The Hero could not load.")).toBeVisible({
        timeout: 30_000,
      });
      await expect(
        page.locator('[data-hero-portrait="standard"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-hero-portrait="standard"] img')
      ).toHaveAttribute("src", "/hero-portraits/standard.webp");
      fail = false;
      await page
        .getByRole("button", { name: "Retry" })
        .click({ timeout: 8000 });
      const left = page.getByRole("button", { name: "Rotate Hero left" });
      await expect(left).toBeVisible();
      await expect(page.getByTestId("hero").locator("canvas")).toBeVisible();
      await left.focus();
      await expect(left).toBeFocused();
      await page.keyboard.press("Enter");
      await page.getByRole("button", { name: "Reset View" }).click();
      await expect(page.getByTestId("gear-rack")).toBeVisible();
      await expect(page.getByTestId("gear-upgrade-banner")).toBeInViewport();
      const rackBox = await page.getByTestId("gear-rack").boundingBox();
      const buttonBox = await page
        .getByTestId("gear-upgrade-banner")
        .boundingBox();
      expect(rackBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();
      if (!rackBox || !buttonBox) {
        throw new Error("The Gear rack is not visible");
      }
      expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(
        rackBox.y + rackBox.height + 1
      );
      await expect(left).toBeInViewport();
      mkdirSync(evidence, { recursive: true });
      await page.screenshot({
        path: path.join(
          evidence,
          `hero-${viewport.width}x${viewport.height}.png`
        ),
      });
      expect(requests).toBe(2);
      await page.context().setOffline(true);
      await page.getByTestId("town-shortcut-town").click();
      await page.getByTestId("town-shortcut-hero").click();
      await expect(
        page.getByRole("button", { name: "Rotate Hero left" })
      ).toBeVisible();
      expect(requests).toBe(2);
    });
  }

  test("a failed Battle model keeps the Battle playable and can be retried", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    let requests = 0;
    let fail = true;
    await page.route(
      "**/models/heroes/standard-standard.glb",
      async (route) => {
        requests += 1;
        if (fail) {
          await route.abort();
          return;
        }
        await route.fulfill({
          path: reference,
          contentType: "model/gltf-binary",
        });
      }
    );
    await page.goto("/play?state=active-play&seed=7");
    await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
      timeout: 30_000,
    });
    const retry = page.getByRole("button", { name: "Retry" });
    await expect(retry).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("hero-player-hp")).toBeVisible();
    fail = false;
    await retry.click();
    await expect(retry).toHaveCount(0);
    expect(requests).toBe(2);
    mkdirSync(evidence, { recursive: true });
    await page.screenshot({
      path: path.join(evidence, "battle-model-draft.png"),
    });
  });

  test("Bazaar previews change only the candidate family", async ({ page }) => {
    test.setTimeout(90_000);
    const requested: string[] = [];
    await page.route("**/models/heroes/*.glb", async (route) => {
      requested.push(new URL(route.request().url()).pathname);
      await route.fulfill({
        path: reference,
        contentType: "model/gltf-binary",
      });
    });
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("town-shortcut-bazaar").click();
    const portrait = page.locator(
      '[data-cosmetic-id="heroPortrait.tentRings"]'
    );
    await portrait.getByTestId("bazaar-preview").click();
    await expect
      .poll(() => requested)
      .toContain("/models/heroes/tent-rings-standard.glb");
    const gear = page.locator('[data-cosmetic-id="gearLook.goldInlay"]');
    await gear.getByTestId("bazaar-preview").click();
    await expect
      .poll(() => requested)
      .toContain("/models/heroes/standard-gold-inlay.glb");
    await expect(
      page.locator(
        '[data-testid="cosmetic-standard"][data-family="heroPortrait"]'
      )
    ).toHaveAttribute("data-active", "true");
    await expect(
      page.locator('[data-testid="cosmetic-standard"][data-family="gearLook"]')
    ).toHaveAttribute("data-active", "true");
    await expect(portrait).not.toHaveAttribute("data-active", "true");
    await expect(gear).not.toHaveAttribute("data-active", "true");
  });
});
