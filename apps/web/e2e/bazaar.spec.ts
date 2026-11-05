/* oxlint-disable promise/avoid-new, eslint/no-await-in-loop -- IndexedDB uses event callbacks, and each tab needs its own measurement. */
import { newProfile } from "@workspace/rules";

import { expect, test } from "./_base";
import type { Page } from "./_base";
import { measureTextContrast } from "./_contrast";

/** Saves a Profile with Heynstones and one owned Card Back, then opens the Bazaar. */
const openBazaar = async (page: Page) => {
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
    {
      ...newProfile(42),
      heynstones: 80,
      cosmetics: ["cardBack.goldFleur"],
    }
  );
  await page.reload();
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("town-shortcut-bazaar").press("Enter");
  await expect(page.getByTestId("bazaar")).toBeVisible();
};

test.describe("Bazaar", () => {
  test("a tile shows a look, and the Inspector has the one action", async ({
    page,
  }) => {
    await openBazaar(page);
    const inspector = page.getByTestId("bazaar-inspector");
    await expect(inspector).toHaveAttribute("data-look", "standard");
    await expect(page.getByTestId("bazaar-inspector-in-use")).toBeVisible();
    await expect(
      page.getByTestId("bazaar-tiles").getByRole("button")
    ).toHaveCount(0);

    await page.locator('[data-cosmetic-id="cardBack.vanguard"]').click();
    await expect(inspector).toHaveAttribute("data-look", "cardBack.vanguard");
    await expect(page.getByTestId("bazaar-inspector-premium")).toBeVisible();
    await expect(page.getByTestId("bazaar-inspector-need")).toHaveText(
      "You need 40 more Heynstones."
    );
    await expect(page.getByTestId("bazaar-inspector-action")).toBeDisabled();
    // To show a look never changes the Active look.
    await expect(
      page.locator('[data-testid="cosmetic-standard"][data-family="cardBack"]')
    ).toHaveAttribute("data-active", "true");
  });

  test("Buy keeps the look, then Use makes it Active with the keyboard", async ({
    page,
  }) => {
    await openBazaar(page);
    const seaChart = page.locator('[data-cosmetic-id="cardBack.seaChart"]');
    await seaChart.click();
    const action = page.getByTestId("bazaar-inspector-action");
    await action.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("bazaar-said")).toHaveText(
      "You bought Sea Chart."
    );
    await expect(seaChart).toHaveAttribute("data-owned", "true");
    await expect(seaChart).not.toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("bazaar")).toContainText("20");
    await expect(action).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByTestId("bazaar-said")).toHaveText(
      "You now use Sea Chart."
    );
    await expect(seaChart).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("bazaar-inspector-in-use")).toBeVisible();
    await expect(seaChart).toBeFocused();
  });

  test("each tab keeps its selected look, and the arrow keys show a look", async ({
    page,
  }) => {
    await openBazaar(page);
    const inspector = page.getByTestId("bazaar-inspector");
    await page.locator('[data-cosmetic-id="cardBack.goldFleur"]').click();
    await page.keyboard.press("ArrowLeft");
    await expect(inspector).toHaveAttribute(
      "data-look",
      "cardBack.tentStripes"
    );

    await page.getByTestId("bazaar-family-boardSkin").click();
    await expect(inspector).toHaveAttribute("data-family", "boardSkin");
    await expect(inspector).toHaveAttribute("data-look", "standard");
    await page.getByTestId("bazaar-family-cardBack").click();
    await expect(inspector).toHaveAttribute(
      "data-look",
      "cardBack.tentStripes"
    );
  });

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    test(`the panel stays between the shopkeepers at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openBazaar(page);
      const box = await page.getByTestId("bazaar-panel").boundingBox();
      expect(box).not.toBeNull();
      // The fruit seller ends at 16.5% of the painting, the orc cook starts at 75%.
      expect(box?.x).toBeGreaterThan(viewport.width * 0.165);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThan(
        viewport.width * 0.75
      );
      const split = await page.getByTestId("bazaar-inspector").boundingBox();
      expect((split?.width ?? 0) / (box?.width ?? 1)).toBeCloseTo(0.35, 1);
    });
  }

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
  ]) {
    test(`the text on all tabs has its contrast at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openBazaar(page);
      for (const family of [
        "cardBack",
        "heroPortrait",
        "gearLook",
        "boardSkin",
      ]) {
        const tab = page.getByTestId(`bazaar-family-${family}`);
        await tab.click();
        await expect(tab).toHaveAttribute("aria-selected", "true");
        // Measure the settled paint: no transition, and all the art in place.
        await page.evaluate(async () => {
          if (!document.querySelector("#bazaar-steady-state")) {
            const style = document.createElement("style");
            style.id = "bazaar-steady-state";
            style.textContent =
              "*, *::before, *::after { animation: none !important; transition: none !important; }";
            document.head.append(style);
          }
          await Promise.all(
            [...document.images].map((image) =>
              image.decode().catch(() => null)
            )
          );
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });
        });
        const measured = await measureTextContrast(
          page,
          '[data-testid="bazaar-panel"]'
        );
        expect(
          measured.filter((item) => item.ratio < item.required),
          family
        ).toEqual([]);
      }
    });
  }

  test("the panel fits on a phone in landscape", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openBazaar(page);
    const panel = await page.getByTestId("bazaar-panel").boundingBox();
    const plate = await page.getByTestId("bazaar-inspector-foot").boundingBox();
    expect((panel?.x ?? 0) + (panel?.width ?? 0)).toBeLessThanOrEqual(844);
    await expect(page.getByTestId("bazaar-inspector-foot")).toBeInViewport({
      ratio: 1,
    });
    expect((plate?.y ?? 0) + (plate?.height ?? 0)).toBeLessThan(390);
  });
});
