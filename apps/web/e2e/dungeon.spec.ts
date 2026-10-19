import { expect, test } from "./_base";
import type { Page } from "./_base";

/** The Battle UI with 2 or more enemy Bosses on a 4-Lane Board (issue #93). */
test.describe("Dungeon Battle", () => {
  test("shows one plate for each Boss, with the Lanes of its Front", async ({
    page,
  }) => {
    await page.goto("/play?state=dungeon&seed=42");
    const plates = page.getByTestId("boss-plates");
    await expect(plates).toBeVisible({ timeout: 30_000 });
    await expect(plates).toHaveAttribute("data-count", "2");
    // The Lane strip of each Boss fills the 2 Lanes of its Front: Lanes 1-2, then 3-4.
    const held = (index: number) =>
      page
        .getByTestId(`boss-${index}`)
        .getByTestId("lane-strip")
        .locator("[data-held]");
    await expect(held(0)).toHaveCount(2);
    await expect(held(1)).toHaveCount(2);
    await expect(page.getByTestId("boss-0")).toHaveAccessibleName(
      /Holds Lanes 1, 2/u
    );
    await expect(page.getByTestId("boss-1")).toHaveAccessibleName(
      /Holds Lanes 3, 4/u
    );
    // Each Boss has a notch at each Boss Rule threshold, and its own Hand.
    await expect(
      page.getByTestId("boss-0").getByTestId("boss-notch")
    ).toHaveCount(1);
    await expect(page.getByTestId("boss-hand")).toHaveCount(2);
  });

  test("shows 3 Bosses with Fronts of 1, 2 and 1 Lanes", async ({ page }) => {
    await page.goto("/play?state=dungeon-three&seed=42");
    await expect(page.getByTestId("boss-plates")).toHaveAttribute(
      "data-count",
      "3",
      { timeout: 30_000 }
    );
    const held = (index: number) =>
      page
        .getByTestId(`boss-${index}`)
        .getByTestId("lane-strip")
        .locator("[data-held]");
    await expect(held(0)).toHaveCount(1);
    await expect(held(1)).toHaveCount(2);
    await expect(held(2)).toHaveCount(1);
  });

  test("Skip jumps over a Defeat and a Front move", async ({ page }) => {
    await page.goto("/play?state=dungeon-defeat&seed=42");
    await expect(page.getByTestId("boss-plates")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Skip" }).click();
    const fallen = page.getByTestId("boss-0");
    await expect(fallen).toHaveAttribute("data-defeated", "true");
    await expect(fallen).toContainText("Defeated");
    // The Front of the Defeated Boss went to the other Boss: it holds all 4 Lanes.
    await expect(
      page
        .getByTestId("boss-1")
        .getByTestId("lane-strip")
        .locator("[data-held]")
    ).toHaveCount(4);
  });
});

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setXp: (xp: number) => void;
    readonly setSweepTickets: (
      kind: "campaign" | "dungeon",
      tickets: number
    ) => void;
    readonly setDungeonResults: (results: Record<string, number>) => void;
    readonly finishBattle: (winner: "player" | "enemy") => void;
    readonly profileSaved: () => Promise<void>;
  };
}

/** The total XP of Player levels 9 and 10 (Economy 1.2). */
const LEVEL_9_XP = 1880;
const LEVEL_10_XP = 2280;
/** The total XP of Player level 20 (Economy 1.2). */
const LEVEL_20_XP = 7380;
/** The total XP of Player level 30, the maximum (Economy 1.2). */
const LEVEL_30_XP = 24_130;

/** Opens the Town with `xp`. */
const openTown = async (page: Page, xp: number) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate((total) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(total);
  }, xp);
};

/**
 * The Dungeon Panel, the battle preparation of the selected Dungeon, is
 * docked at the right of the mine and open at all times (as the Floor Panel).
 * A Hint that shows over it (the Deck Hint, on a phone) goes first.
 */
const openPanel = async (page: Page) => {
  if ((await page.getByTestId("hint").count()) > 0) {
    await page
      .getByTestId("hint-close")
      .click({ force: true, timeout: 3000 })
      .catch(() => false);
    await page.waitForTimeout(200);
  }
  await expect(page.getByTestId("dungeon-panel")).toBeVisible();
};

/**
 * At level 10 a Deck needs 14 cards (15 at level 20), and the starter Decks
 * have 10: "Edit Decks" on the Dungeon Panel opens the Deck book, and
 * Auto-fill makes the Active Deck valid. Then Fight is on.
 */
const fillActiveDeck = async (page: Page, min = 14) => {
  await openPanel(page);
  await expect(page.getByTestId("deck-problem")).toContainText(
    `at least ${min} cards`
  );
  await expect(page.getByTestId("dungeon-fight")).toBeDisabled();
  await page.getByTestId("edit-decks").click();
  // The keyboard, so that a toast at the bottom right cannot take the click.
  await page.getByTestId("deck-autofill").press("Enter");
  await expect(page.getByTestId("deck-problems")).toHaveCount(0);
  await page.getByTestId("deck-close").press("Enter");
  await expect(page.getByTestId("dungeon-fight")).toBeEnabled();
};

/** Ends the Battle that shows now with `winner`, with the test hook. */
const finishBattle = (page: Page, winner: "player" | "enemy") =>
  page.evaluate((side) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.finishBattle(side);
  }, winner);

const profileSaved = (page: Page) =>
  page.evaluate(async () => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
  });

/** The Dungeons screen, the cave Building and the Dungeon Battle flow (issue #94). */
test.describe("Dungeons screen", () => {
  // A wide screen shows the full cave at the right edge of the Town.
  test.use({ viewport: { width: 1600, height: 720 } });

  test("locks the cave and the Dungeons shortcut below level 10", async ({
    page,
  }) => {
    await openTown(page, LEVEL_9_XP);
    const cave = page.getByTestId("building-cave");
    await expect(cave).toHaveAttribute("data-locked", "true");
    await expect(cave).toHaveAccessibleName("Dungeons, opens at level 10");
    await expect(cave.getByTestId("building-lock-plate")).toHaveText(
      "Level 10"
    );
    const shortcut = page.getByTestId("town-shortcut-dungeons");
    await expect(shortcut).toHaveAttribute("data-locked", "true");
    await expect(shortcut).toHaveAccessibleName("Dungeons, opens at level 10");
    await shortcut.click();
    await expect(page.getByTestId("dungeons")).toHaveCount(0);
  });

  test("level 10: the cave opens Dungeon 1, a win gives its first-win rewards, and the Profile keeps the win", async ({
    page,
  }) => {
    await openTown(page, LEVEL_10_XP);
    await page.getByTestId("building-cave").click();
    const screen = page.getByTestId("dungeons");
    await expect(screen).toBeVisible();
    await expect(page.getByTestId("town-shortcut-dungeons")).toHaveAttribute(
      "aria-current",
      "page"
    );
    // The mine opens on the stop of Dungeon 1, with the open lift in its
    // well. Dungeons 2 and 3 are deeper down, with the locked lift.
    const gauge = (number: number) =>
      page.getByTestId(`gauge-dungeon-${number}`);
    const stop = (number: number) => page.getByTestId(`dungeon-stop-${number}`);
    const mine = page.getByTestId("mine-shaft");
    const lift = page.getByTestId("mine-lift");
    await expect(gauge(1)).toHaveAttribute("aria-selected", "true");
    await expect(gauge(1)).toBeFocused();
    await expect(mine).toHaveAttribute("data-stop", "1");
    await expect(lift).not.toHaveAttribute("data-locked");
    await expect(stop(1)).toHaveAttribute("data-state", "open");
    // All 3 stops of the mine are in the shaft, deeper with each number.
    await expect(page.locator("[data-testid^='dungeon-stop-']")).toHaveCount(3);
    await expect(gauge(2)).toHaveAttribute("data-state", "locked");
    await expect(gauge(2)).toHaveAccessibleName(/opens at level 20/u);
    await expect(gauge(3)).toHaveAttribute("data-state", "locked");
    await expect(gauge(3)).toHaveAccessibleName(/opens at level 30/u);

    // A locked Dungeon shows its Bosses in the panel, its level in the place
    // of Fight, and the locked lift over its dim stop.
    await gauge(2).click();
    await expect(page.getByTestId("dungeon-locked")).toContainText(
      "Opens at level 20"
    );
    await expect(page.getByTestId("dungeon-fight")).toHaveCount(0);
    await expect(page.getByTestId("mine-gauge")).toBeVisible();
    await expect(mine).toHaveAttribute("data-stop", "2");
    await expect(lift).toHaveAttribute("data-locked", "true");
    await gauge(1).click();
    await expect(mine).toHaveAttribute("data-stop", "1");
    await expect(lift).not.toHaveAttribute("data-locked");
    await expect(page.getByTestId("dungeon-fight")).toBeVisible();

    // The arrow keys ride up and down the shaft.
    await gauge(1).focus();
    await page.keyboard.press("ArrowDown");
    await expect(gauge(2)).toHaveAttribute("aria-selected", "true");
    await expect(gauge(2)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(gauge(1)).toBeFocused();
    await expect(page.getByTestId("dungeon-fight")).toBeVisible();

    // One dossier for each Boss, with its Lanes, its Boss Rule and the notch.
    await expect(page.locator("article[data-testid^='dossier-']")).toHaveCount(
      2
    );
    await expect(page.getByTestId("dossier-0")).toContainText(
      "Foreman Gritjaw"
    );
    await expect(page.getByTestId("dossier-0")).toContainText(
      "At 50% HP: Summon Mesa Pit-Fighter (Rare) in Lane 2."
    );
    await expect(page.getByTestId("dossier-1")).toContainText(
      "Holds Lanes 3, 4"
    );
    await expect(
      page.getByTestId("dossier-0").getByTestId("dossier-notch")
    ).toHaveCount(1);
    // The dossier of a Boss lights that Boss on the painting, and no other.
    await expect(page.getByTestId("dossier-0")).toHaveAttribute(
      "data-lanes",
      "1,2"
    );
    await page.getByTestId("dossier-1").hover();
    await expect(stop(1).getByTestId("boss-light-1")).toHaveCount(1);
    await expect(stop(1).getByTestId("boss-light-0")).toHaveCount(0);

    // The first-win rewards, from the rules (Economy 2.4), in the Dungeon Panel.
    await openPanel(page);
    await expect(page.getByTestId("dungeon-reward-card")).toHaveText(
      "Grand Gearjammer"
    );
    await expect(page.getByTestId("dungeon-first-win")).toContainText(
      "+3 Uncommon Forge Stone"
    );

    // A Deck that is not valid turns Fight off. With a valid Deck, the stop
    // has the focus when the screen opens, so Enter goes to Fight and
    // Enter starts the Dungeon Battle.
    await fillActiveDeck(page);
    await page.getByTestId("town-shortcut-town").click();
    await page.getByTestId("building-cave").click();
    await expect(gauge(1)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("dungeon-fight")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("boss-plates")).toHaveAttribute(
      "data-count",
      "2",
      { timeout: 30_000 }
    );

    await finishBattle(page, "player");
    const result = page.getByTestId("battle-result");
    await expect(result).toBeVisible();
    await expect(result).toContainText("Victory");
    await expect(result).toContainText("The Rootdeep Mine");
    await expect(result.getByTestId("battle-stars")).toHaveCount(0);
    await expect(result.getByTestId("result-card")).toHaveAttribute(
      "data-card",
      "goblin.grandGearjammer"
    );
    await expect(result.getByTestId("result-coin")).toHaveAttribute(
      "data-copper",
      "600"
    );
    await expect(result.getByTestId("result-forge-stones")).toHaveAttribute(
      "data-count",
      "3"
    );
    // A Dungeon win gives 1 Dungeon Sweep Ticket (ADR-0041).
    const tickets = result.getByTestId("result-sweep-tickets");
    await expect(tickets).toHaveAttribute("data-kind", "dungeon");
    await expect(tickets).toHaveAttribute("data-tickets", "1");
    await expect(tickets).toContainText("+1 Dungeon Sweep Ticket");
    await profileSaved(page);

    await result.getByTestId("back-to-dungeons").click();
    await expect(screen).toBeVisible();
    // The stamps land at the feet of the Bosses of the won Dungeon.
    await expect(stop(1).getByTestId("boss-claimed")).toHaveCount(2);
    // The gauge marks the won Dungeon as cleared, and the deeper ones as not.
    await expect(gauge(1)).toHaveAttribute("data-cleared", "true");
    await expect(gauge(2)).not.toHaveAttribute("data-cleared", "true");
    // The panel keeps the win, the repeat-win rewards and the Dungeon Sweep.
    await openPanel(page);
    await expect(page.getByTestId("dungeon-wins")).toHaveAttribute(
      "data-wins",
      "1"
    );
    await expect(page.getByTestId("dungeon-each-win")).toContainText(
      "25% chance: 1 Uncommon Forge Stone"
    );
    // The won Dungeon has the Dungeon Sweep, with the Ticket of the win.
    await expect(page.getByTestId("sweep-owned")).toHaveAttribute(
      "data-tickets",
      "1"
    );
    await expect(page.getByTestId("dungeon-sweep")).toBeEnabled();

    // The Profile keeps the win after a reload. A reload opens the Town.
    await page.reload();
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("town-shortcut-dungeons").click();
    await openPanel(page);
    await expect(page.getByTestId("dungeon-wins")).toHaveAttribute(
      "data-wins",
      "1"
    );
    await expect(page.getByTestId("gauge-dungeon-1")).toHaveAttribute(
      "data-cleared",
      "true"
    );
  });

  test("the shortcut opens the screen, a loss gives a share of the loss rewards, and an Abandon records nothing", async ({
    page,
  }) => {
    await openTown(page, LEVEL_10_XP);
    await page.getByTestId("town-shortcut-dungeons").click();
    await expect(page.getByTestId("dungeons")).toBeVisible();
    await fillActiveDeck(page);

    // An Abandon records no result.
    await page.getByTestId("dungeon-fight").click();
    await expect(page.getByTestId("boss-plates")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId("leave-battle").click();
    await expect(page.getByTestId("abandon-dialog")).toContainText(
      "You can play the Dungeon again at any time."
    );
    await page.getByTestId("abandon-confirm").click();
    await expect(page.getByTestId("dungeons")).toBeVisible();
    await openPanel(page);
    await expect(page.getByTestId("dungeon-wins")).toHaveCount(0);

    // A loss gives 10% of the Coin and 25% of the XP of a win, but only the
    // share of the HP that the Bosses lost (ADR-0043): up to 20 Copper and 35 XP.
    await page.getByTestId("dungeon-fight").click();
    await expect(page.getByTestId("boss-plates")).toBeVisible({
      timeout: 30_000,
    });
    await finishBattle(page, "enemy");
    const result = page.getByTestId("battle-result");
    await expect(result).toContainText("Defeat");
    const xp = Number(
      await result.getByTestId("result-xp").getAttribute("data-xp")
    );
    expect(xp).toBeGreaterThanOrEqual(0);
    expect(xp).toBeLessThanOrEqual(35);
    const coin = result.getByTestId("result-coin");
    if ((await coin.count()) > 0) {
      const copper = Number(await coin.getAttribute("data-copper"));
      expect(copper).toBeGreaterThan(0);
      expect(copper).toBeLessThanOrEqual(20);
    }
    await expect(result.getByTestId("result-forge-stones")).toHaveCount(0);
    await result.getByTestId("back-to-dungeons").click();
    await expect(page.getByTestId("dungeons")).toBeVisible();
    await openPanel(page);
    await expect(page.getByTestId("dungeon-wins")).toHaveCount(0);
  });

  test("level 10 shows the Dungeons Hint at the cave, and Read more opens the Dungeon Entry", async ({
    page,
  }) => {
    await openTown(page, LEVEL_10_XP);
    const hint = page.getByTestId("hint");
    // The level Hints show one after the other: Packs, Workshop, Craft,
    // Seaport, then Dungeons.
    const closeHint = async (shown: string) => {
      await expect(hint).toHaveAttribute("data-hint", shown, {
        timeout: 10_000,
      });
      await page.getByTestId("hint-close").click();
    };
    await closeHint("packs");
    await closeHint("workshop");
    await closeHint("craft");
    await closeHint("seaport");
    await expect(hint).toHaveAttribute("data-hint", "dungeons");
    await expect(hint).toContainText("The Dungeons are open.");
    await page.getByTestId("hint-read-more").click();
    const entry = page.getByTestId("handbook-entry");
    await expect(entry).toHaveAttribute("data-entry", "dungeon");
    await expect(entry).toContainText("from Player level 10");
    await expect(entry.getByTestId("handbook-diagram")).toBeVisible();
  });

  test.describe("on a phone in landscape", () => {
    test.use({ viewport: { width: 844, height: 390 } });

    test("the stop and the panel share the screen, and Fight and Sweep stay in view after a win", async ({
      page,
    }) => {
      await openTown(page, LEVEL_10_XP);
      await page.getByTestId("town-shortcut-dungeons").click();
      // The stop of the Dungeon and the lift over its well are in view.
      await expect(page.getByTestId("dungeon-stop-1")).toBeInViewport();
      await expect(page.getByTestId("mine-lift")).toBeInViewport();
      await fillActiveDeck(page);
      await page.getByTestId("dungeon-fight").click();
      await expect(page.getByTestId("boss-plates")).toBeVisible({
        timeout: 30_000,
      });
      await finishBattle(page, "player");
      await page.getByTestId("back-to-dungeons").click();
      await openPanel(page);
      await expect(page.getByTestId("dungeon-wins")).toBeVisible();
      await expect(page.getByTestId("dungeon-fight")).toBeInViewport();
      // The win gave 1 Dungeon Sweep Ticket, so Sweep is the gold action: Enter on the stop goes to it.
      await expect(page.getByTestId("dungeon-sweep")).toBeInViewport();
      await page.getByTestId("gauge-dungeon-1").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("dungeon-sweep")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("sweep-result")).toBeVisible();
      await expect(page.getByTestId("sweep-close")).toBeInViewport();
      await expect(page.getByTestId("sweep-close")).toBeFocused();
    });
  });
});

/** Dungeon 2: a wide Boss and a narrow Boss, with Fronts of 3 and 1 Lanes (issue #95). */
test.describe("Dungeon 2", () => {
  test.use({ viewport: { width: 1600, height: 720 } });

  test("level 20: the screen opens on Dungeon 2, and a win gives Old Frostmaw", async ({
    page,
  }) => {
    await openTown(page, LEVEL_20_XP);
    await page.getByTestId("town-shortcut-dungeons").click();
    await expect(page.getByTestId("dungeons")).toBeVisible();
    await expect(page.getByTestId("gauge-dungeon-2")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.getByTestId("dungeon-stop-2")).toHaveAttribute(
      "data-state",
      "open"
    );
    await expect(page.getByTestId("dossier-0")).toContainText("Abbot Knell");
    await expect(page.getByTestId("dossier-0")).toContainText(
      "Holds Lanes 1, 2, 3"
    );
    await expect(page.getByTestId("dossier-1")).toContainText("Seer Vell");
    await expect(page.getByTestId("dossier-1")).toContainText("Holds Lane 4");
    await expect(page.getByTestId("dossier-1")).toHaveAttribute(
      "data-lanes",
      "4"
    );
    await openPanel(page);
    await expect(page.getByTestId("dungeon-reward-card")).toHaveText(
      "Old Frostmaw"
    );

    await fillActiveDeck(page, 15);
    await page.getByTestId("dungeon-fight").click();
    await expect(page.getByTestId("boss-plates")).toHaveAttribute(
      "data-count",
      "2",
      { timeout: 30_000 }
    );
    await finishBattle(page, "player");
    const result = page.getByTestId("battle-result");
    await expect(result).toContainText("Victory");
    await expect(result).toContainText("The Rimebarrow");
    await expect(result.getByTestId("result-card")).toHaveAttribute(
      "data-card",
      "feral.oldFrostmaw"
    );
    await expect(result.getByTestId("result-coin")).toHaveAttribute(
      "data-copper",
      "900"
    );
  });
});

/** Dungeon 3: 3 Campaign Bosses with Fronts of 1, 2 and 1 Lanes (GDD 8.4). */
test.describe("Dungeon 3", () => {
  test.use({ viewport: { width: 1600, height: 720 } });

  test("level 30: the screen opens on Dungeon 3, and a win gives Sir Odo and Essence in place of XP", async ({
    page,
  }) => {
    await openTown(page, LEVEL_30_XP);
    await page.getByTestId("town-shortcut-dungeons").click();
    await expect(page.getByTestId("dungeons")).toBeVisible();
    await expect(page.getByTestId("gauge-dungeon-3")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(page.locator("article[data-testid^='dossier-']")).toHaveCount(
      3
    );
    await expect(page.getByTestId("dossier-0")).toContainText(
      "Baron Brassbelly"
    );
    await expect(page.getByTestId("dossier-1")).toContainText(
      "The Old Bramble"
    );
    await expect(page.getByTestId("dossier-1")).toContainText(
      "Holds Lanes 2, 3"
    );
    await expect(page.getByTestId("dossier-2")).toContainText("Queen Marrow");
    await openPanel(page);
    await expect(page.getByTestId("dungeon-reward-card")).toHaveText(
      "Sir Odo, the Last Taxman"
    );
    // A Unit at the start is in the dossier of its Boss, and hover shows its Card Details.
    const startUnit = page.getByTestId("dossier-start-unit").first();
    await expect(startUnit).toHaveAccessibleName(
      /\(Epic\), on the Board in Lane 1 at the start of the Battle$/u
    );
    await startUnit.hover();
    const unitPeek = page.getByTestId("dossier-unit-peek");
    await expect(unitPeek.getByTestId("card-details-name")).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("dossier-peek.png") });
    await page.mouse.move(0, 0);
    await expect(unitPeek).toHaveCount(0);

    await fillActiveDeck(page, 15);
    await page.getByTestId("dungeon-fight").click();
    await expect(page.getByTestId("boss-plates")).toHaveAttribute(
      "data-count",
      "3",
      { timeout: 30_000 }
    );
    await finishBattle(page, "player");
    const result = page.getByTestId("battle-result");
    await expect(result).toContainText("Victory");
    await expect(result).toContainText("The Broken Vault");
    await expect(result.getByTestId("result-card")).toHaveAttribute(
      "data-card",
      "undead.sirOdoLastTaxman"
    );
    await expect(result.getByTestId("result-coin")).toHaveAttribute(
      "data-copper",
      "1200"
    );
    // At level 30, XP has no use: the first win gives 100 Essence (Economy 2.4).
    await expect(result.getByTestId("result-essence")).toHaveAttribute(
      "data-essence",
      "100"
    );
  });
});

/** Opens the Dungeons screen at level 10, with Dungeon 1 won and `tickets` Dungeon Sweep Tickets. */
const openWonDungeon = async (page: Page, tickets: number) => {
  await openTown(page, LEVEL_10_XP);
  await page.evaluate((count) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
    hooks?.setDungeonResults({ "dungeon-1": 2 });
    hooks?.setSweepTickets("dungeon", count);
    // The Dungeons screen never shows or uses the Campaign Sweep Tickets.
    hooks?.setSweepTickets("campaign", 7);
  }, tickets);
  await page.getByTestId("town-shortcut-dungeons").click();
  await expect(page.getByTestId("dungeons")).toBeVisible();
};

/** The Dungeon Sweep of a won Dungeon (GDD 4.12, ADR-0041). */
test.describe("Dungeon Sweep", () => {
  test.use({ viewport: { width: 1600, height: 720 } });

  test("shows no Sweep on a Dungeon with no win", async ({ page }) => {
    await openTown(page, LEVEL_10_XP);
    await page.getByTestId("town-shortcut-dungeons").click();
    await openPanel(page);
    await expect(page.getByTestId("dungeon-fight")).toBeVisible();
    await expect(page.getByTestId("dungeon-sweep")).toHaveCount(0);
    await expect(page.getByTestId("sweep-owned")).toHaveCount(0);
  });

  test("sweeps a won Dungeon at once, keeps its wins, and uses only Dungeon Sweep Tickets", async ({
    page,
  }) => {
    await openWonDungeon(page, 3);
    // The Sweep Hint points at the Sweep button of the docked Dungeon Panel.
    // Other Hints of level 10 can show first: they close one after the other.
    const hint = page.getByTestId("hint");
    await expect(async () => {
      if ((await hint.getAttribute("data-hint")) !== "dungeonSweep") {
        await page.getByTestId("hint-close").click({ timeout: 1000 });
      }
      await expect(hint).toHaveAttribute("data-hint", "dungeonSweep", {
        timeout: 1000,
      });
    }).toPass();
    await fillActiveDeck(page);
    const owned = page.getByTestId("sweep-owned");
    await expect(owned).toHaveAttribute("data-kind", "dungeon");
    await expect(owned).toHaveAttribute("data-tickets", "3");
    await expect(page.getByTestId("sweep-tickets")).toHaveAttribute(
      "aria-valuenow",
      "3"
    );
    await page.getByTestId("dungeon-sweep").click();

    const result = page.getByTestId("sweep-result");
    await expect(result).toHaveAttribute("data-kind", "dungeon");
    await expect(result).toHaveAttribute("data-tickets", "3");
    await expect(page.getByTestId("sweep-tickets-left")).toHaveAttribute(
      "data-tickets",
      "0"
    );
    await expect(page.getByTestId("sweep-tickets-left")).toContainText(
      "Dungeon Sweep Tickets left: 0"
    );
    await expect(page.getByTestId("result-coin")).toHaveAttribute(
      "data-copper",
      "600"
    );
    await expect(page.getByTestId("dungeon-wins")).toHaveAttribute(
      "data-wins",
      "2"
    );
    await expect(page.getByTestId("sweep-again")).toBeDisabled();
    await expect(page.getByTestId("sweep-close")).toBeFocused();

    await page.getByTestId("sweep-close").click();
    await expect(owned).toHaveAttribute("data-tickets", "0");
    await expect(page.getByTestId("sweep-no-tickets")).toContainText(
      "Each Dungeon win gives you Dungeon Sweep Tickets: 1."
    );
    await expect(page.getByTestId("dungeon-sweep")).toBeDisabled();
    await expect(page.getByTestId("dungeon-fight")).toBeEnabled();
  });
});
