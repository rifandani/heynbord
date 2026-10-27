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
  __padConnect?: (id: string | null) => void;
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
const installPad = (page: Page, id = "Xbox Wireless Controller") =>
  page.addInitScript((padId) => {
    const buttons = Array.from({ length: 17 }, () => ({
      pressed: false,
      value: 0,
    }));
    const pad = {
      id: padId,
      index: 0,
      mapping: "standard",
      connected: true,
      buttons,
      axes: [0, 0, 0, 0],
      timestamp: 0,
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => (pad.connected ? [pad] : []),
    });
    // SAFETY: this test hook is the only writer of the fake pad.
    (window as PadWindow).__padPress = (index, pressed) => {
      buttons[index] = { pressed, value: pressed ? 1 : 0 };
    };
    // SAFETY: this hook changes only the fake pad read by `getGamepads`.
    (window as PadWindow).__padConnect = (nextId) => {
      pad.connected = nextId !== null;
      if (nextId !== null) {
        pad.id = nextId;
      }
    };
  }, id);

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
    const guide = page.getByTestId("controls-guide");
    await expect(guide).toBeVisible();
    const controller = page.getByTestId("controls-guide-controller");
    await Promise.all(
      ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "Menu", "View"].map(
        (label) =>
          expect(controller.getByText(label, { exact: true })).toBeVisible()
      )
    );
    await expect(
      page.getByTestId("controls-guide-play").locator("kbd")
    ).toHaveText("Enter");
    await expect(page.getByTestId("controls-guide-play")).toContainText("A");
    await expect(
      page.getByTestId("controls-guide-controlsGuide")
    ).toContainText("Menu");
    await Promise.all(
      ["moveSelection", "focusTarget", "logEntry"].map((action) =>
        expect(page.getByTestId(`controls-guide-${action}`)).toContainText(
          "D-pad / Left stick"
        )
      )
    );
    await expect(page.getByTestId("controls-guide-logTurn")).toContainText(
      "LB / RB"
    );
    await test.info().attach("xbox-controls-guide", {
      body: await guide.screenshot(),
      contentType: "image/png",
    });
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

  test("shows the DualSense labels and returns to the keyboard list when it disconnects", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await installPad(
      page,
      "DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)"
    );
    await page.goto("/play?state=active-play&seed=7");
    await expect(page.getByText("Controller connected")).toBeVisible({
      timeout: 30_000,
    });
    await padPress(page, PAD.start);
    const guide = page.getByTestId("controls-guide");
    await expect(guide).toBeVisible();
    const controller = page.getByTestId("controls-guide-controller");
    await Promise.all(
      ["×", "○", "□", "△", "L1", "R1", "L2", "R2", "Options", "Create"].map(
        (label) =>
          expect(controller.getByText(label, { exact: true })).toBeVisible()
      )
    );
    await expect(page.getByTestId("controls-guide-play")).toContainText("×");
    await expect(page.getByTestId("controls-guide-cancel")).toContainText("○");
    await expect(page.getByTestId("controls-guide-inspect")).toContainText("□");
    await expect(page.getByTestId("controls-guide-handbook")).toContainText(
      "△"
    );
    await expect(
      page.getByTestId("controls-guide-controlsGuide")
    ).toContainText("Options");
    await test.info().attach("dualsense-controls-guide", {
      body: await guide.screenshot(),
      contentType: "image/png",
    });

    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(async () => {
        const box = await guide.boundingBox();
        return (
          box !== null &&
          box.y >= 0 &&
          box.y + box.height <= 390 &&
          box.x >= 0 &&
          box.x + box.width <= 844
        );
      })
      .toBe(true);
    await test.info().attach("dualsense-controls-guide-landscape", {
      body: await page.screenshot(),
      contentType: "image/png",
    });

    await page.evaluate(() => {
      // SAFETY: `installPad` sets this hook before the app loads.
      (window as PadWindow).__padConnect?.(null);
    });
    await expect(controller).toBeHidden();
    await expect(page.getByTestId("controls-guide-controlsGuide")).toBeHidden();
    await expect(page.getByTestId("controls-guide-play")).toHaveText(
      "EnterPlay the card"
    );
    await expect(guide).not.toContainText("Options");
    await expect(guide).not.toContainText("Create");

    await page.evaluate(() => {
      // SAFETY: `installPad` sets this hook before the app loads.
      (window as PadWindow).__padConnect?.("Xbox Wireless Controller");
    });
    await expect(controller.getByText("Menu", { exact: true })).toBeVisible();
    await expect(controller.getByText("View", { exact: true })).toBeVisible();
    await expect(guide).not.toContainText("Options");
    await expect(guide).not.toContainText("Create");
  });
});
