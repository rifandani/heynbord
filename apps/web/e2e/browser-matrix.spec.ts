/* oxlint-disable eslint/no-await-in-loop -- each Battle step reads the state that the previous step made */
import { readFile } from "node:fs/promises";

import type { Locator } from "@playwright/test";

import { expect, test } from "./_base";
import type { Page } from "./_base";
import type { Diagnostics } from "./_diagnostics";

/**
 * The browser matrix. These are the main flows that every supported
 * browser must pass: first load, Town, Campaign, Deck builder, Battle,
 * Workshop, Packs and save export/import.
 *
 * The projects in playwright.config.ts run only this file. The full suite
 * stays on the `chromium` project.
 */

interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setCoin: (copper: number) => void;
    readonly setXp: (xp: number) => void;
    readonly giveUnopenedPack: (pack: {
      readonly pack: "peddler" | "merchant" | "royal";
      readonly version: "all" | "race";
    }) => void;
    readonly profileSaved: () => Promise<void>;
  };
}

const isTouch = (hasTouch: boolean | undefined) => hasTouch === true;

/** Clicks with a mouse, or taps with a finger, as the project asks. */
const press = (locator: Locator, hasTouch: boolean | undefined) =>
  isTouch(hasTouch) ? locator.tap() : locator.click();

/** Clicks or taps a point in the 3D scene. */
const pressPoint = (
  page: Page,
  point: { readonly x: number; readonly y: number },
  hasTouch: boolean | undefined
) =>
  isTouch(hasTouch)
    ? page.touchscreen.tap(point.x, point.y)
    : page.mouse.click(point.x, point.y);

/** Closes the "ready to use offline" notice when it covers a control. */
const dismissToast = async (page: Page) => {
  const close = page.getByRole("button", { name: "Close toast" });
  if (await close.isVisible()) {
    await close.click();
  }
};

/** Opens the Town and waits until the Profile and the QA hooks are ready. */
const openTown = async (page: Page) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await expect(page.getByTestId("building-townGate")).toBeEnabled({
    timeout: 60_000,
  });
  await dismissToast(page);
};

const setCoin = (page: Page, copper: number) =>
  page.evaluate((value) => {
    // SAFETY: the E2E build installs the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setCoin(value);
  }, copper);

const setXp = (page: Page, xp: number) =>
  page.evaluate((value) => {
    // SAFETY: the E2E build installs the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(value);
  }, xp);

/** Opens the Settings dialog from the Town Bar. */
const openSettings = async (page: Page) => {
  await page.getByTestId("town-settings").press("Enter");
  await expect(page.getByTestId("settings-dialog")).toBeVisible();
};

const battleState = (page: Page) =>
  page.evaluate(
    (): Diagnostics["state"] | undefined =>
      window.__THREE_GAME_DIAGNOSTICS__?.state
  );

const targetPoints = (page: Page) =>
  page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.targetPoints() ?? []);

test.describe("@browser-matrix main flows", () => {
  test.describe.configure({ timeout: 120_000 });
  test.use({ actionTimeout: 20_000, navigationTimeout: 60_000 });

  test("first load shows the Home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  });

  test("Town opens, and the Town Gate opens the Campaign", async ({ page }) => {
    await openTown(page);
    await expect(page.getByTestId("town-bar")).toBeVisible();
    await page.getByTestId("building-townGate").click();
    await expect(page.getByTestId("campaign")).toBeVisible();
    await expect(page.getByTestId("region-banner")).toContainText("Hearthvale");
    await expect(page.getByTestId("stage-1-1")).toHaveAttribute(
      "data-state",
      "open"
    );
  });

  test("the Deck builder removes a card and keeps the Deck valid", async ({
    page,
    hasTouch,
  }) => {
    await openTown(page);
    await press(page.getByTestId("town-shortcut-deck"), hasTouch);
    const dialog = page.getByTestId("deck-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("deck-size")).toHaveText("10 / 10 cards");
    await press(
      dialog.getByTestId("deck-remove-human.militiaRecruit-common"),
      hasTouch
    );
    await expect(dialog.getByTestId("deck-size")).toHaveText("9 / 10 cards");
  });

  test("a Battle starts and a card is played", async ({ page, hasTouch }) => {
    test.setTimeout(180_000);
    await page.goto("/play?seed=3&state=campaign-progress");
    await expect(page.getByTestId("campaign")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("stage-1-2").click();
    await page.getByTestId("deck-vanguard").click();
    // Enter, because the offline notice can cover the button on a phone.
    await page.getByTestId("start-battle").press("Enter");
    await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
      timeout: 60_000,
    });
    await expect
      .poll(
        async () => {
          const current = await battleState(page);
          return current?.mode;
        },
        { timeout: 60_000 }
      )
      .toBe("battle");

    const ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    for (let turn = 0; turn < 6 && (await ready.count()) === 0; turn += 1) {
      await press(page.getByTestId("end-turn"), hasTouch);
      await expect
        .poll(
          async () => {
            const current = await battleState(page);
            return current?.mode;
          },
          { timeout: 60_000 }
        )
        .not.toBe("loading");
    }
    await expect(ready.first()).toBeVisible({ timeout: 60_000 });

    const current = await battleState(page);
    const before = current?.eventsPlayed ?? 0;
    await press(ready.first(), hasTouch);
    // The Tutorial text can hold the playback until it closes.
    const gotIt = page.getByTestId("tutorial-got-it");
    for (let count = 0; count < 6 && (await gotIt.isVisible()); count += 1) {
      await gotIt.click();
    }
    const [point] = await targetPoints(page);
    expect(point).toBeDefined();
    await pressPoint(page, point ?? { x: 0, y: 0 }, hasTouch);
    await expect
      .poll(
        async () => {
          const next = await battleState(page);
          return next?.eventsPlayed ?? 0;
        },
        { timeout: 30_000 }
      )
      .toBeGreaterThan(before);
  });

  test("the Workshop combines a pair of copies", async ({ page, hasTouch }) => {
    await openTown(page);
    await setXp(page, 320);
    await setCoin(page, 50);
    await press(page.getByTestId("building-workshop"), hasTouch);
    await expect(page.getByTestId("workshop")).toBeVisible();
    await press(
      page.getByTestId("workshop-tile-human.militiaRecruit"),
      hasTouch
    );
    await expect(page.getByTestId("workshop-panel")).toHaveAttribute(
      "data-card",
      "human.militiaRecruit"
    );
    await press(page.getByTestId("workshop-combine-common"), hasTouch);
    await expect(page.getByTestId("workshop-copies-uncommon")).toHaveText("×1");
  });

  test("Packs opens an Unopened Pack and reveals its cards", async ({
    page,
    hasTouch,
  }) => {
    await openTown(page);
    await setXp(page, 160);
    await press(page.getByTestId("building-cardShop"), hasTouch);
    await expect(page.getByTestId("packs")).toBeVisible();
    await page.evaluate(() => {
      // SAFETY: the E2E build installs the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.giveUnopenedPack({
        pack: "peddler",
        version: "all",
      });
    });
    await press(page.getByTestId("unopened-open-peddler-all"), hasTouch);
    const reveal = page.getByTestId("pack-reveal");
    await expect(reveal).toBeVisible();
    // Reduced motion shows the cards at once, so Reveal all is already gone.
    const revealAll = page.getByTestId("reveal-all");
    if (await revealAll.isVisible()) {
      await press(revealAll, hasTouch);
    }
    await expect(
      reveal.getByTestId("reveal-cards").locator("[data-flipped]")
    ).toHaveCount(5);
    await press(page.getByTestId("reveal-done"), hasTouch);
    await expect(reveal).toBeHidden();
  });

  test("save export then import gives the same Coin", async ({
    page,
    hasTouch,
  }) => {
    await openTown(page);
    await setCoin(page, 12_345);
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 1 Gold, 23 Silver, 45 Copper"
    );

    await openSettings(page);
    const downloading = page.waitForEvent("download");
    await press(page.getByTestId("settings-export"), hasTouch);
    const download = await downloading;
    const exported = {
      name: download.suggestedFilename(),
      path: await download.path(),
    };
    expect(exported.name).toMatch(
      /^heynbord-profile-\d{4}-\d{2}-\d{2}\.json$/u
    );
    await press(page.getByTestId("settings-close"), hasTouch);
    await expect(page.getByTestId("settings-dialog")).toBeHidden();

    // Spend the Coin, then import the file and get the Coin back.
    await setCoin(page, 0);
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 0 Copper"
    );
    await openSettings(page);
    const choosing = page.waitForEvent("filechooser");
    // Enter, because the offline notice can cover the button on a phone.
    await page.getByTestId("settings-import").press("Enter");
    const chooser = await choosing;
    await chooser.setFiles({
      name: exported.name,
      mimeType: "application/json",
      buffer: await readFile(exported.path ?? ""),
    });
    await expect(page.getByTestId("import-confirm-dialog")).toBeVisible();
    await press(page.getByTestId("import-confirm"), hasTouch);
    await expect(page.getByTestId("settings-dialog")).toBeHidden();
    await expect(page.getByTestId("town")).toBeVisible();
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 1 Gold, 23 Silver, 45 Copper"
    );
  });
});
