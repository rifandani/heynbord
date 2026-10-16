import { expect, test } from "./_base";
import type { Page } from "./_base";

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setXp: (xp: number) => void;
    readonly openHeynspire: (floorsWon: number) => void;
    readonly finishBattle: (winner: "player" | "enemy") => void;
  };
}

/** The total XP of Player level 20 (Economy 1.2). */
const LEVEL_20_XP = 7380;

/** Opens the Town and waits for the test hooks. */
const openTown = async (page: Page) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
};

/** Wins all Stages, so Heynspire is open, with `floorsWon` won Floors and `xp`. */
const openHeynspire = (page: Page, floorsWon: number, xp = 0) =>
  page.evaluate(
    ({ floors, total }) => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
      hooks?.setXp(total);
      hooks?.openHeynspire(floors);
    },
    { floors: floorsWon, total: xp }
  );

/** Presses a control with the keyboard, so that a Hint or a toast cannot take the click. */
const press = async (page: Page, testId: string) => {
  await page.getByTestId(testId).focus();
  await page.keyboard.press("Enter");
};

/** The Heynspire screen, the tower Building and the Floor Battle flow (issue #99). */
test.describe("Heynspire", () => {
  // A wide screen shows the full Town painting.
  test.use({ viewport: { width: 1600, height: 720 } });

  test("locks the tower and the shortcut until the first win of Stage 5-10", async ({
    page,
  }) => {
    await openTown(page);
    const tower = page.getByTestId("building-heynspire");
    await expect(tower).toHaveAttribute("data-locked", "true");
    await expect(tower.getByTestId("building-lock-plate")).toContainText(
      "5-10"
    );
    await expect(tower).toHaveAccessibleName(
      "Heynspire, win Marrow Castle (5-10) to open"
    );
    const shortcut = page.getByTestId("town-shortcut-heynspire");
    await expect(shortcut).toHaveAttribute("data-locked", "true");
    await expect(shortcut).toHaveAccessibleName(
      "Heynspire, win Marrow Castle (5-10) to open"
    );
    // Focus shows the tooltip of a locked shortcut, with the same words.
    await shortcut.focus();
    await expect(page.getByTestId("town-tooltip-heynspire")).toContainText(
      "Win Marrow Castle (5-10) to open"
    );
  });

  test("shows the Heynspire Hint at the tower, and Read more opens its Handbook Entry", async ({
    page,
  }) => {
    await openTown(page);
    await openHeynspire(page, 0);
    await expect(page.getByTestId("building-heynspire")).not.toHaveAttribute(
      "data-locked"
    );
    const hint = page.getByTestId("hint");
    await expect(hint).toHaveAttribute("data-hint", "heynspire", {
      timeout: 10_000,
    });
    await expect(hint).toContainText("Heynspire is open.");
    await page.getByTestId("hint-read-more").click();
    const entry = page.getByTestId("handbook-entry");
    await expect(entry).toHaveAttribute("data-entry", "heynspire");
    await expect(entry).toContainText("first win of Stage 5-10");
    await expect(page.getByTestId("handbook-heynspire-table")).toBeVisible();
  });

  test("opens from the tower, wins Floor 1 with a test hook, and shows Floor 2 as the Current Floor", async ({
    page,
  }) => {
    await openTown(page);
    await openHeynspire(page, 0, LEVEL_20_XP);
    await press(page, "building-heynspire");
    const screen = page.getByTestId("heynspire");
    await expect(screen).toBeVisible();
    await expect(page.getByTestId("heynspire-progress")).toHaveText(
      "Floor 1 of 50"
    );
    const floor1 = page.getByTestId("floor-1");
    await expect(floor1).toHaveAttribute("data-state", "current");
    await expect(floor1).toBeFocused();
    await expect(page.getByTestId("floor-2")).toHaveAttribute(
      "data-state",
      "locked"
    );
    // The Current stone opens the Floor Panel; Edit Decks and Auto-fill make the Deck valid at level 20.
    await page.keyboard.press("Enter");
    const panel = page.getByTestId("floor-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("floor-enemy")).toContainText(
      "Spire Warden Holt"
    );
    if (await page.getByTestId("deck-problem").isVisible()) {
      await page.getByTestId("edit-decks").click();
      await page.getByTestId("deck-autofill").press("Enter");
      await expect(page.getByTestId("deck-problems")).toHaveCount(0);
      await page.getByTestId("deck-close").press("Enter");
    }
    await expect(page.getByTestId("floor-fight")).toBeEnabled();
    await press(page, "floor-fight");
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.finishBattle("player");
    });
    const result = page.getByTestId("battle-result");
    await expect(result).toBeVisible({ timeout: 30_000 });
    await expect(result).toContainText("Heynspire, Floor 1");
    await expect(result.getByTestId("battle-stars")).toHaveCount(0);
    await expect(result.getByTestId("result-sweep-tickets")).toHaveAttribute(
      "data-tickets",
      "2"
    );
    await expect(result.getByTestId("back-to-heynspire")).toBeVisible();
    await press(page, "next-floor");
    // "Next Floor" opens the Floor Panel of Floor 2 on the Heynspire screen.
    await expect(screen).toHaveAttribute("data-floors-won", "1");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading")).toHaveText("Floor 2");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByTestId("floor-1")).toHaveAttribute(
      "data-state",
      "won"
    );
    await expect(page.getByTestId("floor-2")).toHaveAttribute(
      "data-state",
      "current"
    );
    await expect(page.getByTestId("heynspire-progress")).toHaveText(
      "Floor 2 of 50"
    );
    // Without a panel, Esc goes back to the Town.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town")).toBeVisible();
  });

  test.describe("Replay Link", () => {
    test.use({ permissions: ["clipboard-read", "clipboard-write"] });

    test("a won Floor gives a Replay Link that opens the Floor Battle (web ADR-0012)", async ({
      page,
      context,
    }) => {
      // Two pages load the game.
      test.setTimeout(90_000);
      await openTown(page);
      await openHeynspire(page, 0, LEVEL_20_XP);
      await press(page, "building-heynspire");
      await press(page, "floor-1");
      if (await page.getByTestId("deck-problem").isVisible()) {
        await page.getByTestId("edit-decks").click();
        await page.getByTestId("deck-autofill").press("Enter");
        await page.getByTestId("deck-close").press("Enter");
      }
      await press(page, "floor-fight");
      await page.evaluate(() => {
        // SAFETY: the dev and QA builds install the test hooks on `window`.
        (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.finishBattle(
          "player"
        );
      });
      const result = page.getByTestId("battle-result");
      await expect(result).toBeVisible({ timeout: 30_000 });
      await press(page, "share-replay");
      await expect(page.getByText("Replay Link copied.")).toBeVisible();
      const link = await page.evaluate(() => navigator.clipboard.readText());
      expect(link).toMatch(/\/play#replay=1\.[\w-]+$/u);

      const viewer = await context.newPage();
      await viewer.goto(link);
      await expect(viewer.getByTestId("replay-badge")).toBeVisible({
        timeout: 30_000,
      });
      await expect(viewer.getByTestId("replay-name")).toHaveText(
        "Heynspire, Floor 1"
      );
      await viewer.close();
    });
  });

  test("shows a won Floor with its reward and no Fight, and the climbed state after Floor 50", async ({
    page,
  }) => {
    await openTown(page);
    await openHeynspire(page, 50);
    await press(page, "town-shortcut-heynspire");
    await expect(page.getByTestId("heynspire-climbed")).toBeVisible();
    await expect(page.getByTestId("heynspire-progress")).toHaveText(
      "Heynspire climbed"
    );
    await press(page, "floor-50");
    const panel = page.getByTestId("floor-panel");
    await expect(panel.getByTestId("floor-panel-state")).toHaveAttribute(
      "data-state",
      "won"
    );
    await expect(panel.getByTestId("floor-reward-heynstones")).toBeVisible();
    await expect(panel.getByTestId("floor-fight")).toHaveCount(0);
  });
});
