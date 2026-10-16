import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The record of Achievements and their notices (Achievements 1.2 and 4,
 * issue #102): the Battle result shows the Achievements that its result
 * completed, and the toast does not show them again. The Achievements screen
 * (issue #103): the Hall of banners opens it, a Claim adds the reward, and
 * the badge of the shortcut counts the rewards to claim.
 */

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly winStage: (stageId: string) => void;
    readonly setXp: (xp: number) => void;
    readonly profileSaved: () => Promise<void>;
  };
}

test.describe("Achievements", () => {
  test("a win of Stage 1-10 shows Hearthvale Freed on the result, and a reload shows no second notice", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.winStage("1-10");
    });

    const result = page.getByTestId("battle-result");
    await expect(result).toBeVisible({ timeout: 30_000 });
    const achievement = result.getByTestId("result-achievement");
    await expect(achievement).toHaveCount(1);
    await expect(achievement).toHaveAttribute(
      "data-achievement",
      "campaign.hearthvale"
    );
    await expect(achievement).toContainText("Hearthvale Freed");

    // The result showed it: no toast in the Battle, and none after it.
    const notice = page.getByText(/Achievements? completed/u);
    await page.getByTestId("back-to-campaign").click();
    await expect(page.getByTestId("battle-result")).toBeHidden();
    await expect(notice).toHaveCount(0);

    await page.evaluate(async () => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    });
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(async () => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    });
    await expect(notice).toHaveCount(0);
  });

  test("an Achievement that becomes Completed outside a Battle shows a toast", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      // More XP than the highest Player level needs: "Veteran" (level 30).
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(10_000_000);
    });
    await expect(
      page.getByText("Achievement completed: Veteran", { exact: true })
    ).toBeVisible();
  });
});

/** The Heynstone balance on the Balance Plate, from its accessible name "Heynstones: N". */
const heynstones = async (page: Page): Promise<number> => {
  const name = await page
    .getByTestId("balance-heynstones")
    .getAttribute("aria-label");
  return Number(name?.replaceAll(/\D/gu, "") ?? Number.NaN);
};

/** Wins Stage 1-10 with the test hook and goes back to the Town. */
const winHearthvale = async (page: Page) => {
  await page.goto("/play");
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate(() => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.winStage("1-10");
  });
  await expect(page.getByTestId("battle-result")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByTestId("back-to-campaign").click();
  await page.getByTestId("town-shortcut-town").click();
  await expect(page.getByTestId("town")).toBeVisible();
};

test.describe("Achievements screen", () => {
  test("a Profile with Stage 1-10 won opens the screen from the Hall of banners and claims Hearthvale Freed", async ({
    page,
  }) => {
    await winHearthvale(page);
    const shortcut = page.getByTestId("town-shortcut-achievements");
    await expect(shortcut).toHaveAccessibleName("Achievements, 1 to claim");
    await expect(shortcut.getByTestId("achievements-badge")).toHaveText("1");
    const before = await heynstones(page);

    await page.getByTestId("building-hall").click();
    const screen = page.getByTestId("achievements");
    await expect(screen).toBeVisible();
    // The screen opens on the category with the reward to claim.
    await expect(
      page.getByRole("tab", { name: /^Campaign/u, selected: true })
    ).toBeVisible();
    const row = screen.locator('[data-achievement="campaign.hearthvale"]');
    await expect(row).toHaveAttribute("data-state", "completed");
    await expect(row).toContainText("Hearthvale Freed");
    await expect(row).toContainText("Win Stage 1-10");

    await row
      .getByRole("button", { name: "Claim Hearthvale Freed: 15 Heynstones" })
      .click();
    await expect(row).toHaveAttribute("data-state", "claimed");
    await expect(row.getByTestId("achievement-claimed")).toHaveText("Claimed");
    await expect.poll(() => heynstones(page)).toBe(before + 15);
    await expect(shortcut.getByTestId("achievements-badge")).toHaveCount(0);
    await expect(shortcut).toHaveAccessibleName("Achievements");
    await expect(page.getByTestId("achievements-claim-all")).toBeDisabled();

    // The Claim is in the Profile: a reload keeps it.
    await page.evaluate(async () => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    });
    await page.reload();
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("town-shortcut-achievements").click();
    await expect(
      page.locator('[data-achievement="campaign.hearthvale"]')
    ).toHaveAttribute("data-state", "claimed");
    await expect.poll(() => heynstones(page)).toBe(before + 15);
  });

  test("lists all categories, opens at any level, and Esc goes back to the Town", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    const hall = page.getByTestId("building-hall");
    await expect(hall).not.toHaveAttribute("data-locked");
    await hall.click();
    await expect(page.getByTestId("achievements")).toBeVisible();
    await expect(page.getByRole("tab")).toHaveText([
      /Campaign/u,
      /Dungeons and Heynspire/u,
      /Progress/u,
      /Feats/u,
    ]);
    // A new Player has nothing to claim: Claim all is off.
    await expect(page.getByTestId("achievements-claim-all")).toBeDisabled();
    await page.getByRole("tab", { name: /^Feats/u }).click();
    const feat = page.locator('[data-achievement="feat.rout"]');
    await expect(feat.getByTestId("achievement-not-done")).toHaveText(
      "Not done"
    );
    await expect(feat.getByTestId("achievement-progress")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town")).toBeVisible();
  });

  test("the Achievements Hint points at the shortcut and opens the Handbook Entry", async ({
    page,
  }) => {
    await winHearthvale(page);
    const hint = page.getByTestId("hint");
    // One Hint shows at a time. The win also gives a card that is in no Deck,
    // so the Deck builder Hint can come first: close it, and the Achievements
    // Hint shows next in the Town.
    await expect(hint).toBeVisible();
    if ((await hint.getAttribute("data-hint")) === "deckBuilder") {
      await hint.getByTestId("hint-close").click();
      await expect(hint).toHaveAttribute("data-hint", "achievements", {
        timeout: 10_000,
      });
    }
    await expect(hint).toHaveAttribute("data-hint", "achievements");
    await expect(hint).toContainText("Open Achievements to claim its reward.");
    const shortcut = await page
      .getByTestId("town-shortcut-achievements")
      .boundingBox();
    const banner = await hint.boundingBox();
    // The Hint stands above the shortcut, at the bottom of the screen.
    expect(banner && shortcut && banner.y + banner.height).toBeLessThanOrEqual(
      shortcut?.y ?? 0
    );
    await hint.getByTestId("hint-read-more").click();
    const entry = page.getByTestId("handbook-entry");
    await expect(entry).toHaveAttribute("data-entry", "achievement");
    await expect(entry).toContainText("Claim all");
  });
});
