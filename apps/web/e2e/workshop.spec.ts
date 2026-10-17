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
    readonly setEssence: (essence: number) => void;
    readonly setXp: (xp: number) => void;
    readonly giveCopies: (cardId: string, rank: string, count: number) => void;
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

/** Selects a station tab: its panel shows for the selected card. */
const openStation = async (
  page: Page,
  station: "combine" | "craft" | "extract"
) => {
  await page.getByTestId(`workshop-station-${station}`).click();
  await expect(page.getByTestId("workshop-panel")).toHaveAttribute(
    "data-station",
    station
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

  test("hover on a tile shows its Card Details; the pointer away hides them", async ({
    page,
  }) => {
    await openWorkshop(page, 0);
    const peek = page.getByTestId("workshop-peek");
    await page.getByTestId(`workshop-tile-${RECRUIT}`).hover();
    await expect(peek).toBeVisible();
    await expect(peek.getByTestId("card-details-name")).toContainText(
      "Militia Recruit"
    );
    await page.getByTestId("pool-filter").hover();
    await expect(peek).toBeHidden();
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

  test("the stations: Combine first, each tab with its number, and the Craft lock below level 6", async ({
    page,
  }) => {
    await openWorkshop(page, 0);
    await expect(page.getByTestId("workshop")).toHaveAttribute(
      "data-station",
      "combine"
    );
    await expect(page.getByRole("tab", { selected: true })).toContainText(
      "Combine"
    );
    // The Starter Collection: a Common pair of the recruit, in Human Vanguard.
    await expect(page.getByTestId("workshop-station-combine")).toHaveAttribute(
      "data-count",
      /^[1-9]/u
    );
    await expect(page.getByTestId("workshop-station-craft")).toHaveAttribute(
      "data-locked",
      "true"
    );
    await expect(page.getByTestId("workshop-station-craft")).toContainText(
      "Level 6"
    );
    // The Combine panel has no Extract and no Craft.
    await expect(page.getByTestId("workshop-extract-common")).toHaveCount(0);
    // The lit edge of the panel faces the station in the painting: the smith
    // at the left.
    const edge = page
      .getByTestId("workshop-panel")
      .locator("[data-station-edge]");
    await expect(edge).toHaveAttribute("data-station-edge", "left");

    await openStation(page, "craft");
    await expect(page.getByTestId("workshop-craft-locked")).toHaveText(
      "Opens at level 6"
    );
    await expect(page.getByTestId("workshop-craft")).toHaveCount(0);

    // The arrow keys move between the stations; the card stays selected.
    await page.getByTestId("workshop-station-craft").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("workshop-panel")).toHaveAttribute(
      "data-station",
      "extract"
    );
    await expect(page.getByTestId("workshop-panel")).toHaveAttribute(
      "data-card",
      RECRUIT
    );
    // The cart of the goblin tinker is at the right.
    await expect(edge).toHaveAttribute("data-station-edge", "right");
  });

  test("the ready filter keeps only the cards that the station can act on", async ({
    page,
  }) => {
    await openWorkshop(page, 0);
    const tiles = page.locator('[data-testid^="workshop-tile-"]');
    const all = await tiles.count();
    await page.getByTestId("workshop-ready").click();
    await expect(page.getByTestId("workshop-ready")).toContainText(
      "Pairs only"
    );
    await expect(tiles).not.toHaveCount(all);
    await expect(page.getByTestId(`workshop-tile-${RECRUIT}`)).toHaveAttribute(
      "data-ready",
      "true"
    );
    // Each station keeps its own filter.
    await openStation(page, "extract");
    await expect(page.getByTestId("workshop-ready")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    await expect(tiles).toHaveCount(all);
  });

  test("a Craft makes Essence into a Base Rank copy that forms out of the drops", async ({
    page,
  }) => {
    // The config asks for reduced motion; this test needs the motion.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openWorkshop(page, 0);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
      hooks?.setXp(800);
      hooks?.setEssence(100);
    });
    await openStation(page, "craft");
    await expect(
      page.getByTestId("workshop-craft-recipe")
    ).toHaveAccessibleName(
      "40 Essence makes 1 Common copy of Militia Recruit."
    );
    await expect(page.getByTestId("workshop-craft-balance")).toHaveText(
      "Your Essence: 100 → 60"
    );
    await expect(page.getByTestId("workshop-copies-craft")).toHaveText("×2");

    await page.getByTestId("workshop-craft").click();
    await expect(page.getByTestId("essence-flight")).toHaveAttribute(
      "data-direction",
      "in"
    );
    await expect(page.getByTestId("workshop-craft-ghost")).toHaveAttribute(
      "data-rank",
      "common"
    );
    await expect(page.getByTestId("workshop-copies-craft")).toHaveText("×3");
    await expect(page.getByTestId("workshop-said")).toHaveText(
      "Crafted: 1 Common copy of Militia Recruit."
    );
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 60"
    );
    await expect(page.getByTestId("essence-flight")).toHaveCount(0);
  });

  test("an Extract of a copy in a saved Deck names the Deck, and Keep changes nothing", async ({
    page,
  }) => {
    await openWorkshop(page, 0);
    await openStation(page, "extract");
    // Human Vanguard uses both Common copies: no spare copy.

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

  test("an Extract melts the copy into Essence drops that fly to the Essence balance", async ({
    page,
  }) => {
    // The config asks for reduced motion; this test needs the motion.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openWorkshop(page, 0);
    await page.evaluate((cardId) => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.giveCopies(
        cardId,
        "rare",
        1
      );
    }, RECRUIT);
    await openStation(page, "extract");

    // A Rare copy in no Deck: no dialog. The copy melts with the Rare light,
    // and 6 drops fly, then the flight goes away.
    await page.getByTestId("workshop-extract-rare").click();
    await expect(page.getByTestId("workshop-extract-ghost")).toHaveAttribute(
      "data-rank",
      "rare"
    );
    await expect(page.getByTestId("essence-flight")).toHaveAttribute(
      "data-drops",
      "6"
    );
    await expect(page.getByTestId("essence-flight")).toHaveCount(0);
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 50"
    );
  });

  // The config asks for reduced motion.
  test("with reduced motion, an Extract changes the Essence at once with no drops", async ({
    page,
  }) => {
    await openWorkshop(page, 0);
    await page.evaluate((cardId) => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.giveCopies(
        cardId,
        "rare",
        1
      );
    }, RECRUIT);
    await openStation(page, "extract");

    await page.getByTestId("workshop-extract-rare").click();
    await expect(page.getByTestId("balance-essence")).toHaveAccessibleName(
      "Essence: 50"
    );
    await expect(page.getByTestId("workshop-extract-ghost")).toBeHidden();
    await expect(page.getByTestId("essence-flight")).toHaveCount(0);
  });
});
