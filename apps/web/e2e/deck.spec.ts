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
      "4"
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
    await expect(
      dialog.getByTestId("deck-row-human.crossbowGuard-common")
    ).toContainText("×2");
    // The two owned copies are in the Deck now.
    await expect(
      dialog.getByTestId("pool-human.crossbowGuard-common")
    ).toHaveAttribute("data-blocked", "none");
    await expect(dialog.getByTestId("deck-problems")).toContainText(
      "at least 5 cards"
    );

    await dialog.getByTestId("deck-row-human.crossbowGuard-common").click();
    await expect(
      dialog.getByTestId("deck-row-human.crossbowGuard-common")
    ).toContainText("×1");

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
      dialog.getByTestId("pool-mage.frostBolt-common")
    ).toHaveAttribute("data-blocked", "class");
  });
});
