import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Seaport screen (Economy 2.8, ADR-0051, issue #113): the Player
 * Dispatches the ship, the device clock goes forward, and a Collect adds the
 * reward to the Profile. The clock of the page is a fake clock, so the test
 * does not wait 48 hours.
 */

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setXp: (xp: number) => void;
    readonly setCoin: (copper: number) => void;
    readonly setEssence: (essence: number) => void;
  };
}

/** The total XP of Player level 8, which opens the Seaport (Economy 1.2). */
const LEVEL_8_XP = 1500;
/**
 * Player level 24, which opens all the Cargoes and durations, 1 XP before
 * level 25 (13,880 XP): the XP of a full XP voyage gives a Player level.
 */
const NEAR_LEVEL_25_XP = 13_879;
/** The total XP of Player level 18, which opens 24 hours (Economy 1.2). */
const LEVEL_18_XP = 6200;
/** The total XP of Player level 24 (Economy 1.2). */
const LEVEL_24_XP = 12_280;

/** A morning on the device clock. */
const START = new Date("2026-10-18T08:00:00");

/** Opens the Town with `xp`, no Coin and no Essence. */
const openTown = async (page: Page, xp: number) => {
  await page.clock.install({ time: START });
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate((total) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
    hooks?.setXp(total);
    hooks?.setCoin(0);
    hooks?.setEssence(0);
  }, xp);
};

/** Closes the Hint that shows now, and waits until it is gone. */
const closeHint = async (page: Page) => {
  const id = await page.getByTestId("hint").getAttribute("data-hint");
  await page
    .getByTestId("hint-close")
    .click({ timeout: 3000 })
    .catch(() => false);
  await expect(
    page.locator(`[data-testid='hint'][data-hint='${id}']`)
  ).toHaveCount(0);
};

/**
 * Closes each Hint that shows, one after the other, so that no Hint covers a
 * control. The next Hint can show in the next frame.
 */
const closeHints = async (page: Page, tries = 8): Promise<void> => {
  await page.waitForTimeout(300);
  if (tries === 0 || (await page.getByTestId("hint").count()) === 0) {
    return;
  }
  await closeHint(page);
  await closeHints(page, tries - 1);
};

/** The Epic Forge Stones on the Hero screen. */
const epicStones = async (page: Page): Promise<number> => {
  await closeHints(page);
  await page.getByTestId("town-shortcut-hero").click();
  const stone = page.getByTestId("hero-forge-stone-epic");
  await expect(stone).toBeVisible();
  return Number(await stone.getAttribute("data-count"));
};

/** Opens the Seaport screen from its shortcut. */
const openSeaport = async (page: Page) => {
  await closeHints(page);
  await page.getByTestId("town-shortcut-seaport").click();
  await expect(page.getByTestId("seaport")).toBeVisible();
};

test.describe("Seaport", () => {
  test("locks the shortcut and the quay below level 8, between the Dungeons and the Deck shortcuts", async ({
    page,
  }) => {
    await openTown(page, LEVEL_8_XP - 1);
    const shortcut = page.getByTestId("town-shortcut-seaport");
    await expect(shortcut).toHaveAttribute("data-locked", "true");
    await expect(shortcut).toHaveAccessibleName("Seaport, opens at level 8");
    const order = await page
      .getByTestId("town-bar")
      .locator("[data-testid^='town-shortcut-']")
      .evaluateAll((items) => items.map((item) => item.dataset.testid));
    const index = order.indexOf("town-shortcut-seaport");
    expect(order.slice(index - 1, index + 2)).toEqual([
      "town-shortcut-dungeons",
      "town-shortcut-seaport",
      "town-shortcut-deck",
    ]);
  });

  test("the Manifest gives the full reward of the Cargo and the duration, and the time when the ship is back", async ({
    page,
  }) => {
    await openTown(page, LEVEL_18_XP);
    await openSeaport(page);

    // The first visit selects Coin on the longest open duration up to 24 hours.
    await expect(
      page.getByTestId("cargo-coin").getByRole("radio")
    ).toBeChecked();
    await expect(
      page.getByTestId("duration-24").getByRole("radio")
    ).toBeChecked();
    const manifest = page.getByTestId("manifest");
    await expect(manifest.locator("[data-copper]")).toHaveAttribute(
      "data-copper",
      "1584"
    );
    // The device clock is Sunday 08:00, so the ship is back on Monday.
    await expect(manifest.getByTestId("manifest-return")).toContainText(
      /Back Mon 0?8:00/u
    );
    await expect(manifest).toContainText("+10% for each hour");

    // Each Cargo gives only its own resource.
    await page.getByTestId("cargo-essence").click();
    await expect(manifest).toHaveAttribute("data-cargo", "essence");
    await expect(manifest.locator("[data-amount]")).toHaveAttribute(
      "data-amount",
      "158"
    );
    await page.getByTestId("duration-6").click();
    await expect(manifest.locator("[data-amount]")).toHaveAttribute(
      "data-amount",
      "36"
    );
    await expect(manifest).not.toContainText("for each hour");
    await expect(page.getByTestId("seaport-dispatch")).toHaveAccessibleName(
      "Dispatch the ship: Essence, 6 h"
    );
  });

  test("a full Forge Stone voyage gives 1 Epic Forge Stone, and nothing else", async ({
    page,
  }) => {
    // The test visits the Hero screen two times, and each Town Hint goes first.
    test.slow();
    await openTown(page, LEVEL_24_XP);
    const stonesBefore = await epicStones(page);
    await openSeaport(page);

    const stones = page.getByTestId("cargo-forgeStones");
    await expect(stones).toHaveAttribute("data-open", "true");
    await stones.click();
    await page.getByTestId("duration-48").click();
    await expect(page.getByTestId("manifest-tier")).toHaveAttribute(
      "data-tier",
      "epic"
    );
    // A shorter voyage gives a lower tier.
    await page.getByTestId("duration-12").click();
    await expect(page.getByTestId("manifest-tier")).toHaveAttribute(
      "data-tier",
      "rare"
    );
    await page.getByTestId("duration-48").click();

    const berth = page.getByTestId("berth-plate");
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await page.getByTestId("seaport-dispatch").click();
    await expect(berth).toHaveAttribute("data-state", "away");
    await expect(stones).toHaveAttribute("data-at-sea", "true");
    // The berth plate leads: its title gives the state, and its chip the voyage.
    await expect(berth).toHaveAccessibleName("At sea Forge Stones, 48 h");
    await expect(berth.getByTestId("berth-voyage")).toHaveText(
      "Forge Stones, 48 h"
    );
    // The chooser folds into the Next voyage strip, with no Dispatch.
    const next = page.getByTestId("next-voyage-trigger");
    await expect(next).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("seaport-dispatch")).toHaveCount(0);
    await next.click();
    await expect(page.getByTestId("seaport-sail-note")).toHaveText(
      "Collect to sail again"
    );
    await expect(stones).toBeVisible();
    await expect(berth.getByTestId("berth-time-left")).toContainText(
      /4[78]:\d{2}:\d{2}$/u
    );
    // While the ship is away, the Forge Stone comes only when it is back.
    await expect(berth.getByTestId("reward-stones")).toContainText(
      "when the ship is back"
    );
    await expect(page.getByTestId("seaport-collect")).toHaveText(
      "Call back early"
    );

    // 48 hours go by on the device clock.
    await page.clock.fastForward("48:00:01");
    await expect(berth).toHaveAttribute("data-state", "back");
    await expect(berth.getByTestId("berth-title")).toHaveText(
      "The ship is back"
    );
    const haul = berth.getByTestId("reward-stones");
    await expect(haul).toHaveAttribute("data-count", "1");
    await expect(haul).toHaveAttribute("data-tier", "epic");
    await expect(haul).toContainText("Epic Forge Stone");
    await expect(berth.getByTestId("reward-coin")).toHaveCount(0);
    const shortcut = page.getByTestId("town-shortcut-seaport");
    await expect(shortcut.getByTestId("seaport-badge")).toHaveText("1");
    await expect(shortcut).toHaveAccessibleName("Seaport, the ship is back");

    await page.getByTestId("seaport-collect").click();
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await expect(berth.getByTestId("berth-title")).toHaveText(
      "Cargo collected"
    );
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 0 Copper"
    );
    await expect(shortcut.getByTestId("seaport-badge")).toHaveCount(0);
    await expect(page.getByTestId("seaport-dispatch")).toBeEnabled();
    expect(await epicStones(page)).toBe(stonesBefore + 1);
  });

  test("an early call-back of a Forge Stone voyage asks again, and gives no Forge Stone", async ({
    page,
  }) => {
    await openTown(page, LEVEL_24_XP);
    await openSeaport(page);
    await page.getByTestId("cargo-forgeStones").click();
    await page.getByTestId("duration-12").click();
    await page.getByTestId("seaport-dispatch").click();
    const berth = page.getByTestId("berth-plate");
    await expect(berth).toHaveAttribute("data-state", "away");

    await page.clock.fastForward("06:00:00");
    const collect = page.getByTestId("seaport-collect");
    await collect.click();
    // The first press only warns: the ship is still away.
    await expect(berth.getByTestId("berth-call-back")).toContainText(
      "you get no Forge Stone"
    );
    await expect(collect).toHaveText("Call back now");
    await expect(berth).toHaveAttribute("data-state", "away");
    await collect.click();
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await expect(
      berth.getByTestId("berth-last-collect").getByTestId("reward-stones")
    ).toHaveCount(0);
    // The screen selects the last voyage again.
    await expect(
      page.getByTestId("cargo-forgeStones").getByRole("radio")
    ).toBeChecked();
    await expect(
      page.getByTestId("duration-12").getByRole("radio")
    ).toBeChecked();
  });

  test("an early Collect gives the share of the time away", async ({
    page,
  }) => {
    await openTown(page, LEVEL_24_XP);
    await openSeaport(page);
    await page.getByTestId("cargo-essence").click();
    await page.getByTestId("duration-48").click();
    await page.getByTestId("seaport-dispatch").click();
    const berth = page.getByTestId("berth-plate");
    await expect(berth).toHaveAttribute("data-state", "away");

    // 12 of the 48 hours: 6 Essence × 115% for each hour.
    await page.clock.fastForward("12:00:00");
    await expect(berth.getByTestId("reward-essence")).toHaveAttribute(
      "data-essence",
      "82"
    );
    await expect(page.getByTestId("seaport-collect")).toHaveText("Collect");
    await page.getByTestId("seaport-collect").click();
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 82"
    );
    // The Essence balance bumps once; the Coin, which did not change, does not.
    await expect(
      page.getByTestId("balance-essence").locator("[data-bump]")
    ).toHaveAttribute("data-bump", "1");
    await expect(
      page.getByTestId("balance-coin").locator("[data-bump]")
    ).toHaveCount(0);
    // The receipt shows the Essence of the Collect.
    await expect(
      berth.getByTestId("berth-last-collect").getByTestId("reward-essence")
    ).toHaveAttribute("data-essence", "82");
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 0 Copper"
    );
    await expect(berth.getByTestId("berth-level-up")).toHaveCount(0);
  });

  test("a full XP voyage can give a Player level", async ({ page }) => {
    await openTown(page, NEAR_LEVEL_25_XP);
    await openSeaport(page);
    await page.getByTestId("cargo-xp").click();
    await page.getByTestId("duration-24").click();
    await expect(
      page.getByTestId("manifest").locator("[data-amount]")
    ).toHaveAttribute("data-amount", "79");
    await page.getByTestId("seaport-dispatch").click();
    await page.clock.fastForward("24:00:01");
    const berth = page.getByTestId("berth-plate");
    await expect(berth).toHaveAttribute("data-state", "back");
    await expect(page.getByTestId("seaport-collect")).toHaveText("Collect");
    await page.getByTestId("seaport-collect").click();
    await expect(berth.getByTestId("berth-level-up")).toHaveText(
      "Level up! Level 25"
    );
  });

  test("a locked Cargo or duration shows its level, and its Dispatch is off", async ({
    page,
  }) => {
    await openTown(page, LEVEL_8_XP);
    await openSeaport(page);
    const xp = page.getByTestId("cargo-xp");
    await expect(xp).toHaveAttribute("data-open", "false");
    await expect(xp.getByTestId("cargo-lock")).toContainText("Lv 12");
    await xp.click();
    await expect(page.getByTestId("seaport-dispatch")).toBeDisabled();
    await expect(page.getByTestId("dispatch-note")).toHaveText(
      "Opens at level 12"
    );
    // The arrow keys go back to Coin, which level 8 opens.
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByTestId("cargo-coin").getByRole("radio")
    ).toBeChecked();
    await expect(page.getByTestId("seaport-dispatch")).toBeEnabled();

    // Level 8 opens only 6 hours.
    const long = page.getByTestId("duration-48");
    await expect(long).toHaveAttribute("data-open", "false");
    await expect(long.getByTestId("duration-lock")).toContainText("Lv 24");
    await long.click();
    await expect(page.getByTestId("seaport-dispatch")).toBeDisabled();
    await expect(page.getByTestId("dispatch-note")).toHaveText(
      "Opens at level 24"
    );
  });
});

/** Closes the Hints before the Seaport Hint, and gives the Seaport Hint. */
const seaportHint = async (page: Page, tries = 8) => {
  const hint = page.getByTestId("hint");
  await expect(hint).toBeVisible({ timeout: 5000 });
  if ((await hint.getAttribute("data-hint")) === "seaport") {
    return hint;
  }
  if (tries === 0) {
    throw new Error("The Seaport Hint did not show");
  }
  await closeHint(page);
  return seaportHint(page, tries - 1);
};

test.describe("the Seaport quay and its Hint", () => {
  test.describe("on a 4:3 screen", () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    // The Town shows the full width of its painting on each screen
    // (`FittedPainting`), so the quay is in view, and the Hint points at it.
    // The Hint points at the Seaport shortcut only when the screen crops the
    // quay, as the Dungeons Hint does for the cave.
    test("shows the Seaport Hint at the quay, and Read more opens the Seaport Entry", async ({
      page,
    }) => {
      await openTown(page, LEVEL_8_XP);
      const quay = await page.getByTestId("building-seaport").boundingBox();
      expect(quay && quay.x + quay.width / 2).toBeLessThan(1024);

      const hint = await seaportHint(page);
      await expect(hint).toContainText(
        "The Seaport sends ships on Expeditions."
      );
      const banner = await hint.boundingBox();
      expect(banner && quay).toBeTruthy();
      if (banner && quay) {
        // Next to the quay, not at the Town Bar.
        expect(banner.y).toBeLessThan(quay.y + quay.height);
        expect(banner.x + banner.width).toBeGreaterThan(quay.x - 40);
      }

      await page.getByTestId("hint-read-more").click();
      await expect(page.getByRole("dialog")).toContainText("Seaport");
    });
  });

  test.describe("on a 19.5:9 phone", () => {
    test.use({ viewport: { width: 844, height: 390 }, hasTouch: true });

    test("shows the quay, and the Balance Plate does not cover it", async ({
      page,
    }) => {
      await openTown(page, LEVEL_8_XP);
      await closeHints(page);
      const quay = await page.getByTestId("building-seaport").boundingBox();
      const plate = await page.getByTestId("town-balances").boundingBox();
      expect(quay && plate).toBeTruthy();
      if (quay && plate) {
        expect(quay.x + quay.width).toBeLessThanOrEqual(844 + 1);
        expect(quay.y).toBeGreaterThanOrEqual(plate.y + plate.height);
      }
      await page.getByTestId("building-seaport").tap();
      await expect(page.getByTestId("seaport")).toBeVisible();
      await expect(page.getByTestId("seaport-dispatch")).toBeVisible();
      await expect(page.getByTestId("berth-plate")).toBeVisible();
    });
  });
});
