import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Deck dialog (GDD 6): the Town Bar Deck shortcut opens it over the
 * Town. The Deck slots are saved in the browser, so each test starts with a
 * clean storage.
 */

const openDecks = async (page: Page) => {
  await page.goto("/play");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId("town-shortcut-deck").click();
  const dialog = page.getByTestId("deck-dialog");
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe("Deck dialog", () => {
  test("opens on the active Deck, and Esc closes it", async ({ page }) => {
    const dialog = await openDecks(page);
    await expect(page.getByTestId("deck-slot-vanguard")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(dialog.getByTestId("deck-size")).toHaveText("10 / 10 cards");
    await expect(dialog.getByTestId("deck-active")).toBeVisible();
    await expect(dialog.getByTestId("curve-2")).toHaveAttribute(
      "data-count",
      "3"
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // The Town Bar stays: Esc closes the dialog only.
    await expect(page.getByTestId("town-bar")).toBeVisible();
  });

  test("builds a Deck in an empty slot and makes it the active Deck", async ({
    page,
  }) => {
    const dialog = await openDecks(page);
    await page.getByTestId("deck-slot-slot-3").click();
    await expect(dialog.getByTestId("deck-size")).toHaveText("0 / 10 cards");
    await expect(dialog.getByTestId("deck-use")).toBeDisabled();

    await dialog.getByTestId("pool-human.crossbowGuard-common").click();
    await dialog.getByTestId("pool-human.crossbowGuard-common").click();
    await dialog.getByTestId("pool-human.crossbowGuard-common").click();
    await expect(
      dialog.getByTestId("deck-row-human.crossbowGuard-common")
    ).toContainText("×3");
    // The three owned copies are in the Deck now.
    await expect(
      dialog.getByTestId("pool-human.crossbowGuard-common")
    ).toHaveAttribute("data-blocked", "none");
    await expect(dialog.getByTestId("deck-problems")).toContainText(
      "at least 5 cards"
    );

    await dialog.getByTestId("deck-row-human.crossbowGuard-common").click();
    await expect(
      dialog.getByTestId("deck-row-human.crossbowGuard-common")
    ).toContainText("×2");

    await dialog.getByTestId("deck-autofill").click();
    await expect(dialog.getByTestId("deck-size")).toHaveText("10 / 10 cards");
    await expect(dialog.getByTestId("deck-problems")).toHaveCount(0);

    await dialog.getByTestId("deck-name").fill("Crossbow Line");
    // The keyboard, so that a toast at the bottom right cannot take the click.
    await dialog.getByTestId("deck-use").press("Enter");
    await expect(dialog.getByTestId("deck-active")).toBeVisible();

    // The slots and the active Deck stay after a reload.
    await page.reload();
    await page.getByTestId("town-shortcut-deck").click();
    await expect(page.getByTestId("deck-slot-slot-3")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByTestId("deck-slot-slot-3")).toContainText(
      "Crossbow Line"
    );
  });

  test("offers the next Deck Slot for Coin, and cannot buy it with no Coin", async ({
    page,
  }) => {
    const dialog = await openDecks(page);
    await expect(dialog.getByRole("tab")).toHaveCount(3);
    const locked = dialog.getByTestId("deck-buy-slot");
    await expect(locked).toHaveAccessibleName("Buy Deck Slot 4 for 5 Silver");

    await locked.click();
    const buy = page.getByTestId("buy-slot-dialog");
    await expect(buy).toContainText("Buy Deck Slot 4?");
    await expect(buy.getByTestId("buy-slot-short")).toHaveText(
      "You need 5 Silver more."
    );
    await expect(buy.getByTestId("buy-slot-confirm")).toBeDisabled();

    // Esc closes the confirm dialog only, and the Deck dialog stays.
    await page.keyboard.press("Escape");
    await expect(buy).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("tab")).toHaveCount(3);
  });

  test("shows why a Skill Card of another Class is not valid", async ({
    page,
  }) => {
    const dialog = await openDecks(page);
    await page.getByTestId("deck-slot-raiders").click();
    await dialog.getByTestId("deck-class-warrior").click();
    await expect(dialog.getByTestId("deck-problems")).toContainText(
      "Fireball is a Mage card"
    );
    await expect(
      dialog.getByTestId("pool-mage.fireball-common")
    ).toHaveAttribute("data-blocked", "class");
  });

  test("shows all the cards, and filters them by Ownership, Race and Class", async ({
    page,
  }) => {
    const dialog = await openDecks(page);
    await expect(dialog.getByTestId("pool-count")).toHaveText(/ \/ 66 owned$/u);
    // A card that the Player does not own is in the pool, but a press does not add it.
    const snatcher = dialog.getByTestId("pool-goblin.ankleSnatcher-common");
    await expect(snatcher).toHaveAttribute("data-blocked", "notOwned");
    await page.getByTestId("deck-slot-slot-3").click();
    // The button is aria-disabled, so the click must be forced.
    await snatcher.click({ force: true });
    await expect(dialog.getByTestId("deck-size")).toHaveText("0 / 10 cards");

    await dialog.getByTestId("pool-own-owned").click();
    await expect(dialog.getByTestId("pool-not-owned")).toHaveCount(0);
    await dialog.getByTestId("pool-filter-creature").click();
    await dialog.getByTestId("pool-race-goblin").click();
    await expect(dialog.getByTestId("pool-count")).toHaveText("0 / 15 owned");
    await expect(dialog.getByTestId("pool-empty")).toContainText(
      "You own no Goblin Creature Cards yet."
    );
    await dialog.getByTestId("pool-show-all").click();
    await expect(dialog.getByTestId("pool-empty")).toHaveCount(0);
    await expect(dialog.getByTestId("pool-count")).toHaveText(/ \/ 66 owned$/u);

    // The Class filter starts on the Hero Class of the Deck, and follows the slot.
    await dialog.getByTestId("pool-filter-skill").click();
    await expect(dialog.getByTestId("pool-class-warrior")).toHaveAttribute(
      "data-selected",
      "true"
    );
    await page.getByTestId("deck-slot-raiders").click();
    await expect(dialog.getByTestId("pool-class-mage")).toHaveAttribute(
      "data-selected",
      "true"
    );
    await expect(dialog.getByTestId("pool-count")).toHaveText("1 / 3 owned");
  });
});
