import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Seaport screen (Economy 2.8, ADR-0053, issue #113): the Player
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
 * Player level 24, which opens the Grand Expedition, 1 XP before level 25
 * (13,880 XP): the XP of a full Grand Expedition gives a Player level.
 */
const NEAR_LEVEL_25_XP = 13_879;
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

  test("a full Grand Expedition gives the Coin, the XP, the Essence and 1 Epic Forge Stone", async ({
    page,
  }) => {
    // The test visits the Hero screen two times, and each Town Hint goes first.
    test.slow();
    await openTown(page, NEAR_LEVEL_25_XP);
    const stonesBefore = await epicStones(page);
    await openSeaport(page);

    // The longest open Expedition is selected first.
    const grand = page.getByTestId("destination-grandExpedition");
    await expect(grand).toHaveAttribute("data-open", "true");
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
    await expect(grand.getByRole("radio")).toBeChecked();
    await expect(grand.getByTestId("reward-coin")).toHaveAttribute(
      "data-copper",
      "2880"
    );
    await expect(grand.getByTestId("reward-stones")).toContainText(
      "+1 Epic Forge Stone"
    );

    const berth = page.getByTestId("berth-plate");
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await page.getByTestId("seaport-dispatch").click();
    await expect(berth).toHaveAttribute("data-state", "away");
    await expect(grand).toHaveAttribute("data-at-sea", "true");
    // The berth plate title says why the Dispatch is off.
    await expect(page.getByTestId("seaport-dispatch")).toBeDisabled();
    await expect(
      page.getByTestId("seaport-dispatch")
    ).toHaveAccessibleDescription("At sea: Grand Expedition");
    await expect(berth.getByTestId("berth-time-left")).toContainText(
      /4[78]:\d{2}:\d{2}$/u
    );
    // While the ship is away, the Forge Stone comes only when it is back.
    await expect(berth.getByTestId("reward-stones")).toContainText(
      "when the ship is back"
    );

    // 48 hours go by on the device clock.
    await page.clock.fastForward("48:00:01");
    await expect(berth).toHaveAttribute("data-state", "back");
    await expect(berth.getByTestId("reward-coin")).toHaveAttribute(
      "data-copper",
      "2880"
    );
    const shortcut = page.getByTestId("town-shortcut-seaport");
    await expect(shortcut.getByTestId("seaport-badge")).toHaveText("1");
    await expect(shortcut).toHaveAccessibleName("Seaport, the ship is back");

    await page.getByTestId("seaport-collect").click();
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await expect(berth.getByTestId("berth-level-up")).toHaveText(
      "Level up! Level 25"
    );
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 28 Silver, 80 Copper"
    );
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 144"
    );
    await expect(shortcut.getByTestId("seaport-badge")).toHaveCount(0);
    await expect(page.getByTestId("seaport-dispatch")).toBeEnabled();
    expect(await epicStones(page)).toBe(stonesBefore + 1);
  });

  test("an early Collect gives the share of the time away and no Forge Stone", async ({
    page,
  }) => {
    // The test visits the Hero screen two times, and each Town Hint goes first.
    test.slow();
    await openTown(page, LEVEL_24_XP);
    const stonesBefore = await epicStones(page);
    await openSeaport(page);
    await page.getByTestId("seaport-dispatch").click();
    const berth = page.getByTestId("berth-plate");
    await expect(berth).toHaveAttribute("data-state", "away");

    // 12 of the 48 hours: a quarter of the reward.
    await page.clock.fastForward("12:00:00");
    await expect(berth.getByTestId("reward-coin")).toHaveAttribute(
      "data-copper",
      "720"
    );
    await page.getByTestId("seaport-collect").click();
    await expect(berth).toHaveAttribute("data-state", "atBerth");
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 7 Silver, 20 Copper"
    );
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 36"
    );
    await expect(berth.getByTestId("berth-level-up")).toHaveCount(0);
    expect(await epicStones(page)).toBe(stonesBefore);
  });

  test("a locked Expedition shows its level, and its Dispatch is off", async ({
    page,
  }) => {
    await openTown(page, LEVEL_8_XP);
    await openSeaport(page);
    const trade = page.getByTestId("destination-tradeRoute");
    await expect(trade).toHaveAttribute("data-open", "false");
    await expect(trade.getByTestId("destination-lock")).toHaveText(
      "Opens at level 12"
    );
    await trade.click();
    await expect(page.getByTestId("seaport-dispatch")).toBeDisabled();
    await expect(page.getByTestId("dispatch-note")).toHaveText(
      "Opens at level 12"
    );
    // The arrow keys go back to the Coastal Run, which level 8 opens.
    await page.keyboard.press("ArrowUp");
    await expect(
      page.getByTestId("destination-coastalRun").getByRole("radio")
    ).toBeChecked();
    await expect(page.getByTestId("seaport-dispatch")).toBeEnabled();
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
