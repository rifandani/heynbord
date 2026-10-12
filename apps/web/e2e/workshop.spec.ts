import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Workshop screen (GDD 7.4, issue #72): the Workshop Building opens it at
 * Player level 3, a Combine makes 1 copy of the next Rank from a pair, an
 * Extract of a copy in a saved Deck asks first, and the Profile keeps each
 * action.
 */

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setCoin: (copper: number) => void;
    readonly setXp: (xp: number) => void;
    readonly profileSaved: () => Promise<void>;
  };
}

/** The Starter Collection has 2 Common copies of it, both in Human Vanguard. */
const RECRUIT = "human.militiaRecruit";

/** Opens the Workshop from its Building at Player level 3 (320 XP), with `coin` Copper. */
const openWorkshop = async (page: Page, coin: number) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate((copper) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
    hooks?.setXp(320);
    hooks?.setCoin(copper);
  }, coin);
  await page.getByTestId("building-workshop").click();
  await expect(page.getByTestId("workshop")).toBeVisible();
  await expect(page.getByTestId("town-shortcut-workshop")).toHaveAttribute(
    "aria-current",
    "page"
  );
  await page.getByTestId(`workshop-tile-${RECRUIT}`).click();
  await expect(page.getByTestId("workshop-panel")).toHaveAttribute(
    "data-card",
    RECRUIT
  );
};

test.describe("Workshop", () => {
  test("locks the Workshop below level 3", async ({ page }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await expect(page.getByTestId("building-workshop")).toHaveAttribute(
      "data-locked",
      "true"
    );
    await expect(page.getByTestId("building-workshop")).toHaveAccessibleName(
      "Workshop, opens at level 3"
    );
  });

  test("level 3 shows the Workshop Hint after the Packs Hint, and Read more opens the Workshop Entry", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(320);
    });
    const hint = page.getByTestId("hint");
    await expect(hint).toHaveAttribute("data-hint", "packs");
    await page.getByTestId("hint-close").click();
    await expect(hint).toHaveAttribute("data-hint", "workshop");
    await expect(hint).toContainText("The Workshop is open.");
    await page.getByTestId("hint-read-more").click();
    await expect(page.getByTestId("handbook-entry")).toHaveAttribute(
      "data-entry",
      "workshop"
    );
  });

  test("Combine a pair: 2 Common copies become 1 Uncommon copy, for 50 Copper, and the Profile keeps it", async ({
    page,
  }) => {
    await openWorkshop(page, 50);
    const combine = page.getByTestId("workshop-combine-common");
    await expect(combine).toHaveAccessibleName(
      "Combine 2 Common copies into 1 Uncommon copy, for 50 Copper"
    );
    await expect(page.getByTestId("workshop-copies-common")).toHaveText("×2");
    // The next rung needs 2 copies.
    await expect(page.getByTestId("workshop-combine-uncommon")).toBeDisabled();
    await expect(page.getByTestId("workshop-combine-uncommon")).toContainText(
      "Need 2 copies"
    );

    await combine.click();
    await expect(page.getByTestId("workshop-copies-common")).toHaveText("×0");
    await expect(page.getByTestId("workshop-copies-uncommon")).toHaveText("×1");
    await expect(page.getByTestId("workshop-preview")).toHaveAttribute(
      "data-burst",
      "uncommon"
    );
    await expect(page.getByTestId("workshop-said")).toHaveText(
      "Combined: Militia Recruit is now Uncommon."
    );
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 0 Copper"
    );
    await expect(combine).toBeDisabled();
    // Both copies count on the path to Legendary.
    await expect(page.getByTestId("workshop-path")).toHaveAttribute(
      "data-value",
      "2"
    );

    await page.evaluate(async () => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    });
    await page.reload();
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("building-workshop").click();
    await expect(page.getByTestId(`workshop-tile-${RECRUIT}`)).toHaveAttribute(
      "data-rank",
      "uncommon"
    );
    // The Deck follows the Combine: Human Vanguard uses the Uncommon copy.
    await page.getByTestId("town-shortcut-deck").click();
    await expect(
      page
        .getByTestId("deck-dialog")
        .getByTestId(`deck-row-${RECRUIT}-uncommon`)
    ).toBeVisible();
  });

  test("an Extract of a copy in a saved Deck names the Deck, and Keep changes nothing", async ({
    page,
  }) => {
    await openWorkshop(page, 0);
    await expect(page.getByTestId("workshop-craft-locked")).toHaveText(
      "Opens at level 6"
    );

    const extract = page.getByTestId("workshop-extract-common");
    await extract.click();
    const dialog = page.getByTestId("extract-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("extract-dialog-decks")).toContainText(
      "Human Vanguard"
    );
    // Keep takes the focus: an Extract cannot be undone.
    await expect(dialog.getByTestId("extract-dialog-keep")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("workshop-copies-common")).toHaveText("×2");

    await extract.click();
    await page.getByTestId("extract-dialog-confirm").click();
    await expect(page.getByTestId("workshop-copies-common")).toHaveText("×1");
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 5"
    );
  });
});
