import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Packs screen (Economy 3.1, issue #42): the Card shop in the Town opens
 * it, the first Peddler Pack is free, and the opened cards go into the
 * Collection, which the Deck dialog shows.
 */

const openPacks = async (page: Page) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("building-cardShop").click();
  await expect(page.getByTestId("packs")).toBeVisible();
  await expect(page.getByTestId("town-shortcut-packs")).toHaveAttribute(
    "aria-current",
    "page"
  );
};

/** The `pool-<cardId>-<rank>` test IDs of the revealed cards. */
const revealedCards = (page: Page) =>
  page
    .getByTestId("reveal-cards")
    .locator("[data-card]")
    .evaluateAll((cards: HTMLElement[]) =>
      cards.map((card) => `pool-${card.dataset.card}-${card.dataset.rank}`)
    );

test.describe("Packs", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("opens the free Peddler Pack, reveals all 5 cards and puts them in the Collection", async ({
    page,
  }) => {
    await openPacks(page);
    const free = page.getByTestId("pack-open-peddler");
    await expect(free).toHaveText("Free");
    await expect(page.getByTestId("hint")).toHaveAttribute(
      "data-hint",
      "freePack"
    );
    // With 0 Coin, the other Packs say how much Coin they need.
    await expect(page.getByTestId("pack-open-merchant")).toBeDisabled();
    await expect(page.getByTestId("pack-open-merchant")).toContainText(
      "Need 5s"
    );

    await free.click();
    const reveal = page.getByTestId("pack-reveal");
    await expect(reveal).toBeVisible();
    await page.getByTestId("reveal-all").click();
    await expect(
      reveal.getByTestId("reveal-cards").locator("[data-flipped]")
    ).toHaveCount(5);
    const cards = await revealedCards(page);
    expect(cards).toHaveLength(5);
    await page.getByTestId("reveal-done").click();
    await expect(reveal).toBeHidden();

    // The free Pack is used: the Peddler Pack now has its price.
    await expect(page.getByTestId("pack-open-peddler")).toHaveText(/Open/u);
    await expect(page.getByTestId("pack-guarantee-peddler")).toHaveAttribute(
      "data-left",
      /^[78]$/u
    );

    await page.getByTestId("town-shortcut-deck").click();
    const dialog = page.getByTestId("deck-dialog");
    await expect(dialog).toBeVisible();
    await Promise.all(
      cards.map((card) => expect(dialog.getByTestId(card)).toBeAttached())
    );
  });

  test("the Drop Rates dialog shows the table, the rules and New Card First; Esc closes it, then Esc goes to the Town", async ({
    page,
  }) => {
    await openPacks(page);
    await page.getByTestId("drop-rates-button").click();
    const dialog = page.getByTestId("drop-rates-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("drop-rates-table")).toContainText("80%");
    await expect(dialog.getByTestId("new-card-first-rule")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("packs")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town")).toBeVisible();
  });
});

test.describe("Packs with reduced motion", () => {
  test("shows the cards at once, with no flip", async ({ page }) => {
    await openPacks(page);
    await page.getByTestId("pack-open-peddler").click();
    await expect(
      page.getByTestId("reveal-cards").locator("[data-flipped]")
    ).toHaveCount(5);
    await expect(page.getByTestId("reveal-all")).toHaveCount(0);
    await expect(page.getByTestId("pack-glow")).toHaveCount(0);

    // Hover on a revealed card shows its Card Details; the pointer away hides them.
    const card = page.getByTestId("reveal-card-0");
    const [name = ""] = ((await card.getAttribute("aria-label")) ?? "").split(
      ", "
    );
    await card.hover();
    const peek = page.getByTestId("reveal-peek");
    await expect(peek).toBeVisible();
    await expect(peek.getByTestId("card-details-name")).toContainText(name);
    await page.getByTestId("reveal-done").hover();
    await expect(peek).toBeHidden();
  });
});
