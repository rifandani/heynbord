import type { Locator } from "@playwright/test";

import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The record of Achievements and their notices (Achievements 1.2 and 4,
 * issue #102): the Battle result shows the Achievements that its result
 * completed, and the toast does not show them again. The Objectives dialog
 * (issue #190): the Objectives shortcut opens it, a Claim adds the reward, and
 * the Objectives badge counts the rewards to claim.
 */

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly winStage: (stageId: string) => void;
    readonly setXp: (xp: number) => void;
    readonly setActivity: (activity: number) => void;
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

/** The Heynstone balance on the Balance Plate of the Town, from its accessible name "Heynstones: N". */
const heynstones = async (page: Page): Promise<number> => {
  const name = await page
    .getByTestId("town")
    .getByTestId("balance-heynstones")
    .getAttribute("aria-label");
  return Number(name?.replaceAll(/\D/gu, "") ?? Number.NaN);
};

/** The left edge of an element on the page. */
const leftEdge = (locator: Locator): Promise<number> =>
  locator.evaluate((element) => element.getBoundingClientRect().left);

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

test.describe("Objectives dialog", () => {
  test("a Profile with Stage 1-10 won opens the dialog from the Town Bar and claims Hearthvale Freed", async ({
    page,
  }) => {
    await winHearthvale(page);
    const shortcut = page.getByTestId("town-shortcut-objectives");
    await expect(shortcut).toHaveAccessibleName(/^Objective, 1 to claim/u);
    await expect(shortcut.getByTestId("objectives-badge")).toHaveText("1");
    const before = await heynstones(page);

    await shortcut.press("Enter");
    const screen = page.getByTestId("objectives-dialog");
    await expect(screen).toBeVisible();
    // The dialog opens on the tab and the category with the reward to claim.
    await expect(
      page.getByRole("tab", { name: /^Achievements/u, selected: true })
    ).toBeVisible();
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
    await expect(page.getByTestId("achievements-claim-all")).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(screen).toBeHidden();
    await expect(shortcut.getByTestId("objectives-badge")).toHaveCount(0);
    await expect(shortcut).toHaveAccessibleName("Objective");

    // The Claim is in the Profile: a reload keeps it.
    await page.evaluate(async () => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    });
    await page.reload();
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("town-shortcut-objectives").press("Enter");
    await expect(
      page.locator('[data-achievement="campaign.hearthvale"]')
    ).toHaveAttribute("data-state", "claimed");
    await expect.poll(() => heynstones(page)).toBe(before + 15);
  });

  test("lists all categories at level 1 with a locked Daily Quests tab, and Esc closes it over the Town", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("town-shortcut-objectives").press("Enter");
    await expect(page.getByTestId("objectives-dialog")).toBeVisible();
    // Below level 3, the Daily Quests tab has a Lock Plate.
    await expect(page.getByTestId("objectives-tab-daily")).toHaveAttribute(
      "data-locked",
      "true"
    );
    await expect(page.getByTestId("objectives-lock-plate")).toHaveText(
      "Level 3"
    );
    await expect(
      page.getByTestId("objectives-achievements").getByRole("tab")
    ).toHaveText([
      /Campaign/u,
      /Dungeon/u,
      /Heynspire/u,
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
    await expect(page.getByTestId("objectives-dialog")).toBeHidden();
    await expect(page.getByTestId("town")).toBeVisible();
  });

  test("the states of Achievement cards stay in one column, also beside the Cosmetic badge", async ({
    page,
  }) => {
    await winHearthvale(page);
    await page.getByTestId("town-shortcut-objectives").press("Enter");

    const screen = page.getByTestId("objectives-dialog");
    const row = screen.locator('[data-achievement="campaign.hearthvale"]');
    const claim = row.getByRole("button", { name: /^Claim Hearthvale Freed/u });
    await expect(claim).toBeVisible();
    await page.mouse.move(0, 0);
    const claimLeft = await leftEdge(claim);
    await claim.press("Enter");
    await expect(row).toHaveAttribute("data-state", "claimed");
    await expect
      .poll(() => leftEdge(row.getByTestId("achievement-claimed")))
      .toBeCloseTo(claimLeft, 0);

    await page.getByRole("tab", { name: /^Feats/u }).click();
    const notDone = screen.getByTestId("achievement-not-done");
    await expect(
      screen.locator('[data-frame="gold"]').getByTestId("achievement-not-done")
    ).toHaveCount(1);
    const lefts = await notDone.evaluateAll((slots) =>
      slots.map((slot) => slot.getBoundingClientRect().left)
    );
    expect(lefts.length).toBeGreaterThan(1);
    expect(new Set(lefts).size).toBe(1);
  });

  test("Daily Quests open at level 3 with the Activity bar", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(3000);
    });
    await page.getByTestId("town-shortcut-objectives").press("Enter");
    const dialog = page.getByTestId("objectives-dialog");
    await expect(
      page.getByRole("tab", { name: /^Daily Quests/u, selected: true })
    ).toBeVisible();
    await expect(dialog.getByTestId("quest-row")).toHaveCount(5);
    await expect(dialog.getByTestId("activity-count")).toHaveText("0 / 500");
    await expect(dialog.getByTestId("activity-claim")).toBeDisabled();
    await expect(dialog.getByTestId("quests-claim-all")).toBeDisabled();
    // The 2 Claims that are off have the same face.
    const claimAllFace = await dialog
      .getByTestId("quests-claim-all")
      .evaluate((claimAll) => getComputedStyle(claimAll).backgroundImage);
    await expect(dialog.getByTestId("activity-claim")).toHaveCSS(
      "background-image",
      claimAllFace
    );
    // The ladder goes up the page: the highest Activity is at the top.
    const lowest = await dialog
      .getByTestId("activity-checkpoint-100")
      .boundingBox();
    const highest = await dialog
      .getByTestId("activity-checkpoint-500")
      .boundingBox();
    expect(highest?.y).toBeLessThan(lowest?.y ?? 0);
    await expect(dialog.getByTestId("daily-reset")).toContainText("New in");
    await dialog.getByTestId("activity-checkpoint-500").focus();
    await expect(page.getByTestId("activity-tooltip-500")).toContainText(
      "500 Activity"
    );
  });

  test("a press on a reached chest claims it and the reached chests below it", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(3000);
    });
    await page.getByTestId("town-shortcut-objectives").press("Enter");
    const dialog = page.getByTestId("objectives-dialog");
    // The unlock does a Weekly reset, so the Activity comes after it.
    await expect(dialog.getByTestId("quest-row")).toHaveCount(5);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setActivity(400);
    });
    const checkpoint = (activity: number) =>
      dialog.getByTestId(`activity-checkpoint-${activity}`);

    // A locked chest only shows its tooltip.
    await checkpoint(500).click();
    await expect(checkpoint(500)).toHaveAttribute("data-state", "notReached");
    await expect(page.getByTestId("activity-tooltip-500")).toBeVisible();

    await checkpoint(200).click();
    await expect(checkpoint(100)).toHaveAttribute("data-state", "claimed");
    await expect(checkpoint(200)).toHaveAttribute("data-state", "claimed");
    await expect(checkpoint(300)).toHaveAttribute("data-state", "reached");
    await expect(checkpoint(400)).toHaveAttribute("data-state", "reached");

    await checkpoint(400).click();
    await expect(checkpoint(300)).toHaveAttribute("data-state", "claimed");
    await expect(checkpoint(400)).toHaveAttribute("data-state", "claimed");
    await expect(dialog.getByTestId("activity-claim")).toBeDisabled();
  });

  test("Go to on an In progress Daily Quest closes the dialog and opens its screen", async ({
    page,
  }) => {
    await page.goto("/play");
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
    await page.evaluate(() => {
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.setXp(3000);
    });
    await page.getByTestId("town-shortcut-objectives").press("Enter");
    const dialog = page.getByTestId("objectives-dialog");
    const goTo = dialog
      .getByTestId("quest-go-to")
      .and(page.locator('[data-destination="campaign"]'))
      .first();
    await expect(goTo).toHaveText("Go to Campaign");
    await goTo.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("town")).toBeHidden();
    await expect(page.getByTestId("campaign")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("the Achievements Hint points at the shortcut and opens the Handbook Entry", async ({
    page,
  }) => {
    await winHearthvale(page);
    const hint = page.getByTestId("hint");
    // One Hint shows at a time. The win opens other Town Hints too: close
    // them, and the Achievements Hint shows next in the Town.
    await expect(hint).toBeVisible();
    await expect(async () => {
      const shown = await hint.getAttribute("data-hint");
      if (shown !== "achievements") {
        await hint.getByTestId("hint-close").click();
      }
      expect(shown).toBe("achievements");
    }).toPass({ timeout: 15_000 });
    await expect(hint).toContainText("Open Objective to claim its reward.");
    const shortcut = await page
      .getByTestId("town-shortcut-objectives")
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
