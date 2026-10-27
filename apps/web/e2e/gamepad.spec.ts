import { expect, test } from "./_base";
import type { Page } from "./_base";
import "./_diagnostics";

/**
 * The controller smoke test (web ADR-0015). It stubs `navigator.getGamepads`
 * with a pad in standard mapping, then plays real pad input only. The bot
 * playtest keeps the feel rules honest; this test checks the browser seam.
 */

interface PadWindow extends Window {
  __padPress?: (index: number, pressed: boolean) => void;
}

/** The standard-mapping index of each control that the test presses. */
const PAD = {
  south: 0,
  east: 1,
  l1: 4,
  r1: 5,
  start: 9,
  dpadRight: 15,
} as const;

/** Installs a pad that the test can press, before the app loads. */
const installPad = (page: Page) =>
  page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({
      pressed: false,
      value: 0,
    }));
    const pad = {
      id: "Xbox Wireless Controller",
      index: 0,
      mapping: "standard",
      connected: true,
      buttons,
      axes: [0, 0, 0, 0],
      timestamp: 0,
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [pad],
    });
    // SAFETY: this test hook is the only writer of the fake pad.
    (window as PadWindow).__padPress = (index, pressed) => {
      buttons[index] = { pressed, value: pressed ? 1 : 0 };
    };
  });

/** Presses a control for longer than one animation frame, then releases it. */
const padPress = async (page: Page, index: number) => {
  await page.evaluate((button) => {
    // SAFETY: `installPad` sets this hook before the app loads.
    (window as PadWindow).__padPress?.(button, true);
  }, index);
  await page.waitForTimeout(120);
  await page.evaluate((button) => {
    // SAFETY: `installPad` sets this hook before the app loads.
    (window as PadWindow).__padPress?.(button, false);
  }, index);
  await page.waitForTimeout(80);
};

const eventsPlayed = (page: Page) =>
  page.evaluate(
    () => window.__THREE_GAME_DIAGNOSTICS__?.state.eventsPlayed ?? 0
  );

test.describe("Controller", () => {
  test("plays a card and opens the Battle Log and the Controls Guide with only the pad", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await installPad(page);
    await page.goto("/play?state=active-play&seed=7");
    // One pad, one toast.
    const connected = page.getByText("Controller connected");
    await expect(connected).toBeVisible({ timeout: 30_000 });
    await expect(connected).toHaveCount(1);
    await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
      timeout: 30_000,
    });
    await expect
      .poll(() => page.getByTestId("end-turn").isEnabled(), { timeout: 30_000 })
      .toBe(true);
    // D-pad right selects the first Ready card.
    await padPress(page, PAD.dpadRight);
    await expect(
      page.locator("[data-testid^='hand-card-'][data-selected]")
    ).toHaveCount(1);
    // South plays that card on the focused target.
    const before = await eventsPlayed(page);
    await padPress(page, PAD.south);
    await expect
      .poll(() => eventsPlayed(page), { timeout: 10_000 })
      .toBeGreaterThan(before);
    // L1 opens the Battle Log, and East goes Back to Live.
    await padPress(page, PAD.l1);
    await expect(page.getByTestId("battle-log-dock")).toBeVisible();
    await padPress(page, PAD.east);
    await expect(page.getByTestId("battle-log-dock")).toBeHidden();
    // Start opens the Controls Guide.
    await padPress(page, PAD.start);
    await expect(page.getByTestId("key-guide")).toBeVisible();
    // A text field takes the pad input: right does not select a card.
    await page.evaluate(() => {
      const field = document.createElement("input");
      field.dataset.testid = "pad-text-field";
      document.querySelector('[data-testid="battle-stage"]')?.append(field);
      field.focus();
    });
    await padPress(page, PAD.dpadRight);
    await expect(
      page.locator("[data-testid^='hand-card-'][data-selected]")
    ).toHaveCount(0);
  });
});
