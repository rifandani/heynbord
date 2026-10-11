import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Packs screen (Economy 3.1, issues #42 and #52): the Card shop in the
 * Town opens it, an Unopened Pack opens for free, and the opened cards go into
 * the Collection, which the Deck dialog shows and the Profile keeps.
 */

const openPacks = async (page: Page) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  // The Packs open at Player level 2 (160 XP).
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate(() => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(160);
  });
  await page.getByTestId("building-cardShop").click();
  await expect(page.getByTestId("packs")).toBeVisible();
  await expect(page.getByTestId("town-shortcut-packs")).toHaveAttribute(
    "aria-current",
    "page"
  );
};

/** The part of `window` that the test hooks (test-hooks.ts) add. */
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

const setCoin = (page: Page, copper: number) =>
  page.evaluate((value) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setCoin(value);
  }, copper);

const giveUnopenedPack = (
  page: Page,
  pack: "peddler" | "merchant" | "royal",
  version: "all" | "race"
) =>
  page.evaluate(
    (unopened) => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.giveUnopenedPack(
        unopened
      );
    },
    { pack, version }
  );

/** Waits until the Profile is in IndexedDB, then reloads the page. */
const reloadAfterSave = async (page: Page) => {
  await page.evaluate(async () => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
  });
  await page.reload();
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

  test("a new Player has no Unopened Pack, and no Pack is free", async ({
    page,
  }) => {
    await openPacks(page);
    await expect(page.getByTestId("unopened-shelf")).toHaveCount(0);
    // With 0 Coin, each Pack says how much Coin it needs.
    await expect(page.getByTestId("pack-open-peddler")).toBeDisabled();
    await expect(page.getByTestId("pack-open-peddler")).toContainText(
      "Need 3s 50c"
    );
    await expect(page.getByTestId("pack-open-merchant")).toContainText(
      "Need 5s"
    );
  });

  test("opens an Unopened Pack for free, reveals all 5 cards and puts them in the Collection", async ({
    page,
  }) => {
    await openPacks(page);
    await giveUnopenedPack(page, "peddler", "all");
    const open = page.getByTestId("unopened-open-peddler-all");
    await expect(open).toHaveAccessibleName("Open one Peddler Pack, free");
    await expect(page.getByTestId("hint")).toHaveAttribute(
      "data-hint",
      "unopenedPack"
    );

    await open.click();
    const reveal = page.getByTestId("pack-reveal");
    await expect(reveal).toBeVisible();
    await page.getByTestId("reveal-all").click();
    await expect(
      reveal.getByTestId("reveal-cards").locator("[data-flipped]")
    ).toHaveCount(5);
    const cards = await revealedCards(page);
    expect(cards).toHaveLength(5);
    // An Unopened Pack has no Open another.
    await expect(page.getByTestId("reveal-again")).toHaveCount(0);
    await page.getByTestId("reveal-done").click();
    await expect(reveal).toBeHidden();

    // The Pack is open: the shelf goes, and the Coin did not change.
    await expect(page.getByTestId("unopened-shelf")).toHaveCount(0);
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

  test("a Race version Unopened Pack asks for the Race, then gives cards of that Race", async ({
    page,
  }) => {
    await openPacks(page);
    await giveUnopenedPack(page, "merchant", "race");
    await giveUnopenedPack(page, "merchant", "race");
    const open = page.getByTestId("unopened-open-merchant-race");
    await expect(open).toHaveAttribute("data-count", "2");
    await open.click();
    const races = page.getByTestId("unopened-race-dialog");
    await expect(races).toBeVisible();
    await races.getByTestId("unopened-race-orc").click();
    await expect(races).toBeHidden();
    const reveal = page.getByTestId("pack-reveal");
    await expect(reveal.getByTestId("race-stamp").first()).toBeAttached();
    await page.getByTestId("reveal-all").click();
    const cards = await revealedCards(page);
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card).toMatch(/^pool-orc\./u);
    }
    await page.getByTestId("reveal-done").click();
    await expect(open).toHaveAttribute("data-count", "1");
  });

  test("a bought Pack stays in the Collection after a reload", async ({
    page,
  }) => {
    await openPacks(page);
    await setCoin(page, 350);
    await page.getByTestId("pack-open-peddler").click();
    await page.getByTestId("reveal-all").click();
    const cards = await revealedCards(page);
    await page.getByTestId("reveal-done").click();
    await expect(page.getByTestId("balance-coin")).toHaveAccessibleName(
      "Coin: 0 Copper"
    );

    await reloadAfterSave(page);
    await expect(page.getByTestId("town")).toBeVisible();
    await page.getByTestId("town-shortcut-deck").click();
    const dialog = page.getByTestId("deck-dialog");
    await expect(dialog).toBeVisible();
    await Promise.all(
      cards.map((card) => expect(dialog.getByTestId(card)).toBeAttached())
    );
  });

  test("Skill Cards selects a Class Pack of the active Deck Class, with its price and Class Stamp; All cards closes the Class group", async ({
    page,
  }) => {
    await openPacks(page);
    const group = page.getByTestId("pack-pool-group");
    await expect(group).not.toHaveAttribute("data-open");
    // With 0 Coin, the Open button names the price that is missing.
    await expect(page.getByTestId("pack-open-merchant")).toContainText(
      "Need 5s"
    );

    await page.getByTestId("pack-kind-skill").click();
    await expect(group).toHaveAttribute("data-open", "true");
    // The first Starter Deck is a Warrior Deck.
    await expect(page.getByTestId("pack-pool-warrior")).toHaveAttribute(
      "data-selected",
      "true"
    );
    await expect(page.getByTestId("pack-pool-human")).toHaveCount(0);
    // A Class Pack costs 1.4 × the price (Economy 3.1).
    await expect(page.getByTestId("pack-open-merchant")).toContainText(
      "Need 7s"
    );
    await expect(
      page.getByTestId("pack-merchant").getByTestId("class-stamp")
    ).toBeVisible();
    await expect(page.getByTestId("race-stamp")).toHaveCount(0);

    // Arrow keys move in the Class group.
    await page.getByTestId("pack-pool-warrior").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("pack-pool-ranger")).toHaveAttribute(
      "data-selected",
      "true"
    );

    await setCoin(page, 700);
    await page.getByTestId("pack-open-merchant").click();
    const reveal = page.getByTestId("pack-reveal");
    await expect(reveal).toBeVisible();
    await expect(reveal.getByTestId("class-stamp").first()).toBeAttached();
    await page.getByTestId("reveal-all").click();
    const cards = await revealedCards(page);
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card).toMatch(/^pool-ranger\./u);
    }
    await page.getByTestId("reveal-done").click();
    await expect(reveal).toBeHidden();

    // A switch of the kind and back keeps the Class.
    await page.getByTestId("pack-kind-creature").click();
    await expect(page.getByTestId("pack-pool-human")).toHaveAttribute(
      "data-selected",
      "true"
    );
    await page.getByTestId("pack-kind-skill").click();
    await expect(page.getByTestId("pack-pool-ranger")).toHaveAttribute(
      "data-selected",
      "true"
    );

    await page.getByTestId("pack-kind-all").click();
    await expect(group).not.toHaveAttribute("data-open");
    await expect(page.getByTestId("class-stamp")).toHaveCount(0);
    await expect(page.getByTestId("pack-open-merchant")).toContainText(
      "Need 5s"
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
    await setCoin(page, 350);
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
