import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Hero screen (GDD 7.3, issue #77): the Barracks and the Hero shortcut
 * open it at Player level 5, a Gear upgrade adds 1 level for Coin and the
 * Profile keeps it, and "Change Deck" changes the Class of the Hero
 * (ADR-0033).
 */

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setCoin: (copper: number) => void;
    readonly setXp: (xp: number) => void;
    readonly profileSaved: () => Promise<void>;
  };
}

/** The total XP of Player level 5 (Economy 1.2). */
const LEVEL_5_XP = 640;

/** Opens the Town with `xp` and `coin` Copper. */
const openTown = async (page: Page, xp: number, coin: number) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate(
    ([total, copper]) => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
      hooks?.setXp(total);
      hooks?.setCoin(copper);
    },
    [xp, coin] as const
  );
};

test.describe("Hero screen", () => {
  test("locks the Barracks and the Hero shortcut below level 5", async ({
    page,
  }) => {
    await openTown(page, 480, 0);
    const barracks = page.getByTestId("building-barracks");
    await expect(barracks).toHaveAttribute("data-locked", "true");
    await expect(barracks).toHaveAccessibleName("Hero, opens at level 5");
    await expect(barracks.getByTestId("building-lock-plate")).toHaveText(
      "Level 5"
    );
    const shortcut = page.getByTestId("town-shortcut-hero");
    await expect(shortcut).toHaveAttribute("data-locked", "true");
    await expect(shortcut).toHaveAccessibleName("Hero, opens at level 5");
    await shortcut.click();
    await expect(page.getByTestId("town")).toBeVisible();
    await expect(page.getByTestId("hero")).toHaveCount(0);
  });

  test("level 5: the Barracks opens the Hero screen, and the Gear Hint shows one time", async ({
    page,
  }) => {
    await openTown(page, LEVEL_5_XP, 0);
    await page.getByTestId("building-barracks").click();
    await expect(page.getByTestId("hero")).toBeVisible();
    await expect(page.getByTestId("town-shortcut-hero")).toHaveAttribute(
      "aria-current",
      "page"
    );
    // A new Player: the Class of the Active Deck, Human Vanguard.
    await expect(page.getByTestId("hero-class")).toHaveAttribute(
      "data-class",
      "warrior"
    );
    await expect(page.getByTestId("hero-hp-sum")).toHaveText(
      "= 30 base + 5 level + 0 × 1 Armor"
    );

    const hint = page.getByTestId("hint");
    await expect(hint).toHaveAttribute("data-hint", "gear");
    await expect(hint).toContainText("A level never goes down.");
    await page.getByTestId("hint-read-more").click();
    await expect(page.getByTestId("handbook-entry")).toHaveAttribute(
      "data-entry",
      "gear"
    );
    await expect(page.getByTestId("handbook-gear-guide")).toBeVisible();
    await page.keyboard.press("Escape");

    // The Hint was seen: it does not show again.
    await page.getByTestId("town-shortcut-town").click();
    await page.getByTestId("town-shortcut-hero").click();
    await expect(page.getByTestId("hero")).toBeVisible();
    await expect(page.getByTestId("gear-rack")).toBeVisible();
    await expect(page.getByTestId("hint")).toHaveCount(0);
  });

  test("a Gear upgrade takes its Coin, and the Profile keeps the new level", async ({
    page,
  }) => {
    await openTown(page, LEVEL_5_XP, 1000);
    await page.getByTestId("town-shortcut-hero").click();
    await expect(page.getByTestId("hero")).toBeVisible();

    const weapon = page.getByTestId("gear-weapon");
    const upgrade = page.getByTestId("gear-upgrade-weapon");
    await expect(weapon).toHaveAttribute("data-level", "0");
    await expect(weapon.getByTestId("gear-stat")).toHaveText("0%→0.5%");
    await expect(upgrade).toHaveAccessibleName(
      "Upgrade Weapon to level 1, for 10 Copper"
    );

    await upgrade.click();
    await expect(weapon).toHaveAttribute("data-level", "1");
    await expect(weapon.getByTestId("gear-stat")).toHaveText("0.5%→1%");
    await expect(page.getByTestId("hero-said")).toHaveText(
      "Weapon is now level 1. Unit Crit: 0.5%."
    );
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 9 Silver, 90 Copper"
    );
    // The focus stays on the upgrade, so Enter upgrades again.
    await expect(upgrade).toBeFocused();

    // An Armor upgrade adds 1 to the Hero HP.
    await page.getByTestId("gear-upgrade-armor").click();
    await expect(page.getByTestId("hero-hp")).toHaveAttribute(
      "data-total",
      "36"
    );
    await expect(page.getByTestId("hero-hp-sum")).toHaveText(
      "= 30 base + 5 level + 1 × 1 Armor"
    );

    // Level 2 costs 30 Copper. With 20, the button is off and says what is missing.
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setCoin(20);
    });
    await expect(upgrade).toBeDisabled();
    await expect(upgrade).toHaveText("Need10c");
    await expect(upgrade).toHaveAccessibleName(
      "Upgrade Weapon: you need 10 Copper more"
    );

    await page.evaluate(async () => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    });
    await page.reload();
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("town-shortcut-hero").click();
    await expect(page.getByTestId("gear-weapon")).toHaveAttribute(
      "data-level",
      "1"
    );
    await expect(page.getByTestId("gear-armor")).toHaveAttribute(
      "data-level",
      "1"
    );
  });

  test("Change Deck opens the Deck dialog, and a Deck of another Class changes the Class", async ({
    page,
  }) => {
    await openTown(page, LEVEL_5_XP, 0);
    await page.getByTestId("town-shortcut-hero").click();
    await expect(page.getByTestId("hero-class")).toHaveAttribute(
      "data-class",
      "warrior"
    );

    await page.getByTestId("hero-change-deck").click();
    const dialog = page.getByTestId("deck-dialog");
    await expect(dialog).toBeVisible();
    await page.getByTestId("deck-slot-raiders").click();
    // The offline toast can cover the footer of the book, so the key presses it.
    await dialog.getByTestId("deck-use").press("Enter");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await expect(page.getByTestId("hero-class")).toHaveAttribute(
      "data-class",
      "mage"
    );
    await expect(page.getByTestId("hero-change-deck")).toBeFocused();
  });
});
