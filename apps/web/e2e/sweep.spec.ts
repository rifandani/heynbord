import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * The Campaign Sweep (GDD 4.12, ADR-0039, issue #82): the Sweep button of a
 * Stage with 3 best Stars, the Ticket control, the Sweep Result in the Stage
 * Panel, the Sweep Hint, and the Campaign Sweep Tickets of a Stage win. The
 * Dungeon Sweep is in `dungeon.spec.ts`.
 */

/** The part of `window` that the test hooks (test-hooks.ts) add. */
interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly setSweepTickets: (
      kind: "campaign" | "dungeon",
      tickets: number
    ) => void;
    readonly profileSaved: () => Promise<void>;
  };
}

/**
 * Opens the Campaign with Stages 1-1 to 1-9 won (1-1, 1-2, 1-4 and 1-7 with
 * 3 Stars), `tickets` Campaign Sweep Tickets and 9 Dungeon Sweep Tickets.
 */
const openCampaign = async (page: Page, tickets: number) => {
  await page.goto("/play?state=campaign-progress");
  await expect(page.getByTestId("campaign")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => "__THREE_GAME_TEST_HOOKS__" in window);
  await page.evaluate((count) => {
    // SAFETY: the dev and QA builds install the test hooks on `window`.
    const hooks = (window as HookWindow).__THREE_GAME_TEST_HOOKS__;
    hooks?.setSweepTickets("campaign", count);
    // The Stage Panel never shows or uses the Dungeon Sweep Tickets.
    hooks?.setSweepTickets("dungeon", 9);
  }, tickets);
};

test.describe("Sweep", () => {
  test("shows no Sweep on a Stage with less than 3 best Stars", async ({
    page,
  }) => {
    await openCampaign(page, 5);
    await page.getByTestId("stage-1-3").click();
    await expect(page.getByTestId("stage-panel")).toBeVisible();
    await expect(page.getByTestId("start-battle")).toBeFocused();
    await expect(page.getByTestId("sweep")).toHaveCount(0);
    await expect(page.getByTestId("sweep-owned")).toHaveCount(0);
  });

  test("sweeps a 3-Star Stage at once, keeps the Stars, and saves the rewards", async ({
    page,
  }) => {
    await openCampaign(page, 5);
    await page.getByTestId("stage-1-4").click();
    await expect(page.getByTestId("sweep-owned")).toHaveAttribute(
      "data-tickets",
      "5"
    );
    await expect(page.getByTestId("sweep-owned")).toHaveAttribute(
      "data-kind",
      "campaign"
    );
    const control = page.getByTestId("sweep-tickets");
    await expect(control).toHaveAttribute("aria-valuenow", "5");
    await expect(control).toHaveAttribute("aria-valuemax", "5");
    await expect(page.getByTestId("sweep")).toBeFocused();
    await page.getByTestId("sweep-fewer").click();
    await control.focus();
    await page.keyboard.press("ArrowDown");
    await expect(control).toHaveAttribute("aria-valuenow", "3");
    await page.getByTestId("sweep").click();

    const result = page.getByTestId("sweep-result");
    await expect(result).toHaveAttribute("data-tickets", "3");
    await expect(result).toHaveAttribute("data-kind", "campaign");
    await expect(page.getByTestId("sweep-tickets-left")).toContainText(
      "Campaign Sweep Tickets left: 2"
    );
    await expect(page.getByTestId("sweep-tickets-left")).toHaveAttribute(
      "data-tickets",
      "2"
    );
    await expect(page.getByTestId("result-xp")).toBeVisible();
    await expect(page.getByTestId("stage-best-stars")).toHaveAttribute(
      "data-stars",
      "3"
    );
    await expect(page.getByTestId("sweep-again")).toBeDisabled();
    await expect(page.getByTestId("sweep-close")).toBeFocused();

    await page.getByTestId("sweep-close").click();
    await expect(page.getByTestId("sweep-owned")).toHaveAttribute(
      "data-tickets",
      "2"
    );
    await expect(control).toHaveAttribute("aria-valuenow", "2");

    // A page load keeps the Tickets, and it does not Sweep again.
    await page.evaluate(() =>
      // SAFETY: the dev and QA builds install the test hooks on `window`.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved()
    );
    await page.goto("/play");
    await page.getByTestId("town-shortcut-campaign").click();
    await page.getByTestId("stage-1-4").click();
    await expect(page.getByTestId("sweep-owned")).toHaveAttribute(
      "data-tickets",
      "2"
    );
    await expect(page.getByTestId("sweep-result")).toHaveCount(0);
  });

  test("sweeps again with the same Tickets", async ({ page }) => {
    await openCampaign(page, 30);
    await page.getByTestId("stage-1-7").click();
    await expect(page.getByTestId("sweep-tickets")).toHaveAttribute(
      "aria-valuenow",
      "10"
    );
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("sweep-tickets-left")).toHaveAttribute(
      "data-tickets",
      "20"
    );
    await expect(page.getByTestId("sweep-again")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("sweep-tickets-left")).toHaveAttribute(
      "data-tickets",
      "10"
    );
  });

  test("hover on a card of the Sweep Result shows its Card Details", async ({
    page,
  }) => {
    await openCampaign(page, 30);
    await page.getByTestId("stage-1-7").click();
    await page.keyboard.press("Enter");
    const card = page.getByTestId("sweep-card").first();
    const name = await card.getAttribute("data-card");
    const peek = page.getByTestId("sweep-card-peek");
    await expect(peek).toBeHidden();
    await card.getByTestId("sweep-card-frame").hover();
    await expect(peek).toBeVisible();
    await expect(peek.getByTestId("card-details-name")).toBeVisible();
    expect(name).not.toBeNull();
    await page.getByTestId("sweep-tickets-left").hover();
    await expect(peek).toBeHidden();
  });

  test("turns the Sweep off with no Tickets, and Fight is the gold action", async ({
    page,
  }) => {
    await openCampaign(page, 0);
    await page.getByTestId("stage-1-2").click();
    await expect(page.getByTestId("sweep")).toBeDisabled();
    await expect(page.getByTestId("sweep-no-tickets")).toContainText(
      "Each Stage win gives you Campaign Sweep Tickets: 2."
    );
    await expect(page.getByTestId("sweep-tickets")).toHaveCount(0);
    await expect(page.getByTestId("start-battle")).toBeFocused();
  });

  test("shows the Sweep Hint one time, and Read more opens the Sweep Entry", async ({
    page,
  }) => {
    await openCampaign(page, 3);
    await page.getByTestId("stage-1-1").click();
    const hint = page.getByTestId("hint");
    await expect(hint).toHaveAttribute("data-hint", "sweep");
    await page.getByTestId("hint-read-more").click();
    await expect(page.getByTestId("handbook-entry")).toHaveAttribute(
      "data-entry",
      "sweep"
    );
    // Esc closes the Handbook, and the Stage Panel keeps the focus.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("handbook-entry")).toBeHidden();
    await expect(page.getByTestId("stage-panel")).toBeVisible();
    await expect(page.getByTestId("sweep")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("stage-panel")).toBeHidden();
    await expect(page.getByTestId("campaign")).toBeVisible();
    await page.getByTestId("stage-1-2").click();
    await expect(page.getByTestId("stage-panel")).toBeVisible();
    await page.waitForTimeout(700);
    await expect(hint).toHaveCount(0);
  });

  test("a Stage win shows 2 Campaign Sweep Tickets", async ({ page }) => {
    await page.goto("/play?state=victory&seed=3");
    await expect(page.getByTestId("battle-result")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("result-sweep-tickets")).toHaveAttribute(
      "data-tickets",
      "2"
    );
    await expect(page.getByTestId("result-sweep-tickets")).toHaveAttribute(
      "data-kind",
      "campaign"
    );
    await expect(page.getByTestId("result-sweep-tickets")).toContainText(
      "+2 Campaign Sweep Ticket"
    );
  });
});
