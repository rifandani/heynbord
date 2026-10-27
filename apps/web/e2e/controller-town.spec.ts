/* oxlint-disable eslint/no-await-in-loop -- each pad press reads the focus that the previous press made */
import { expect, test } from "./_base";
import type { Page } from "./_base";

interface PadWindow extends Window {
  __townPad?: {
    readonly button: (index: number, pressed: boolean) => void;
    readonly stick: (x: number, y: number) => void;
    readonly reads: () => number;
    readonly pointerEvents: () => number;
    readonly keyEvents: () => number;
  };
}

const PAD = {
  south: 0,
  east: 1,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;

/** The same standard-mapping browser seam as gamepad.spec.ts. */
const installPad = (page: Page) =>
  page.addInitScript(() => {
    let reads = 0;
    let pointerEvents = 0;
    let keyEvents = 0;
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
      value: () => {
        reads += 1;
        return [pad];
      },
    });
    document.addEventListener("pointerdown", () => {
      pointerEvents += 1;
    });
    document.addEventListener("keydown", () => {
      keyEvents += 1;
    });
    // SAFETY: this init script is the only writer of the fake pad.
    (window as PadWindow).__townPad = {
      button: (index, pressed) => {
        buttons[index] = { pressed, value: pressed ? 1 : 0 };
      },
      stick: (x, y) => {
        pad.axes = [x, y, 0, 0];
      },
      reads: () => reads,
      pointerEvents: () => pointerEvents,
      keyEvents: () => keyEvents,
    };
  });

/** Wait for real pad polling, so the press and release both reach the app. */
const setButton = async (page: Page, index: number, pressed: boolean) => {
  const before = await page.evaluate(
    ({ button, down }) => {
      // SAFETY: installPad installs this hook before the app loads.
      const pad = (window as PadWindow).__townPad;
      pad?.button(button, down);
      return pad?.reads() ?? 0;
    },
    { button: index, down: pressed }
  );
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            // SAFETY: installPad installs this hook before the app loads.
            (window as PadWindow).__townPad?.reads() ?? 0
        ),
      { intervals: [16, 32, 50], timeout: 5000 }
    )
    .toBeGreaterThanOrEqual(before + 3);
};

const press = async (page: Page, index: number) => {
  await setButton(page, index, true);
  await setButton(page, index, false);
};

const startInTown = async (page: Page) => {
  await installPad(page);
  await page.goto("/play?state=campaign-progress&seed=3");
  // This preset opens the Campaign after it seeds the Profile. Return with
  // the pad, so the test starts in the Town without a QA state mutation.
  await expect(page.getByTestId("campaign")).toBeVisible({ timeout: 30_000 });
  await press(page, PAD.east);
  await expect(page.getByTestId("building-townGate")).toBeEnabled();
};

/** A bounded search through the focus order, with no direct focus or key event. */
const moveTo = async (
  page: Page,
  testId: string,
  direction: number,
  limit = 30
) => {
  const target = page.getByTestId(testId);
  await expect(target).toBeVisible();
  for (let move = 0; move < limit; move += 1) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      break;
    }
    await press(page, direction);
  }
  await expect(target).toBeFocused();
};

const enterBar = async (page: Page) => {
  for (let move = 0; move < 12; move += 1) {
    if (
      await page
        .getByTestId("town-bar")
        .evaluate((bar) => bar.contains(document.activeElement))
    ) {
      break;
    }
    await press(page, PAD.down);
  }
  await expect(page.locator("[data-pad-town-bar] :focus")).toHaveCount(1);
};

for (const viewport of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone landscape", width: 844, height: 390 },
]) {
  test.describe(`Town controller, ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("opens a Stage and changes Settings with no pointer or key events", async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await startInTown(page);
      const gate = page.getByTestId("building-townGate");

      await moveTo(page, "building-townGate", PAD.down);
      await expect(gate).toHaveAttribute("data-pad-focus", "");
      await press(page, PAD.south);
      await expect(page.getByTestId("campaign")).toBeVisible();
      await moveTo(page, "stage-1-1", PAD.down);
      await press(page, PAD.south);
      await expect(page.getByTestId("stage-panel")).toBeVisible();
      await press(page, PAD.east);
      await expect(page.getByTestId("stage-panel")).toBeHidden();
      await expect(page.getByTestId("campaign")).toBeVisible();
      await press(page, PAD.east);
      await expect(page.getByTestId("town")).toBeVisible();

      await enterBar(page);
      // Up returns from the shelf to the painting, and Down can reach it again.
      await press(page, PAD.up);
      await expect(page.locator("[data-building-id]:focus")).toHaveCount(1);
      await enterBar(page);
      await moveTo(page, "town-settings", PAD.right);
      await press(page, PAD.south);
      const dialog = page.getByTestId("settings-dialog");
      await expect(dialog).toBeVisible();
      await press(page, PAD.down);
      await expect
        .poll(() =>
          dialog.evaluate((element) => element.contains(document.activeElement))
        )
        .toBe(true);
      await expect(page.getByTestId("town")).toBeVisible();
      await expect(page.getByTestId("campaign")).toHaveCount(0);

      await moveTo(page, "settings-sound-switch", PAD.down);
      const sound = page.getByTestId("settings-sound-switch");
      const selected = await sound.getAttribute("aria-pressed");
      await press(page, PAD.south);
      await expect(sound).toHaveAttribute(
        "aria-pressed",
        selected === "true" ? "false" : "true"
      );
      await press(page, PAD.east);
      await expect(dialog).toBeHidden();
      await expect(page.getByTestId("town")).toBeVisible();
      await expect(page.getByTestId("town-settings")).toBeFocused();
      await expect(page.getByTestId("town-settings")).toHaveAttribute(
        "data-pad-focus",
        ""
      );
      const events = await page.evaluate(() => {
        // SAFETY: installPad installs these read-only counters before the app loads.
        const pad = (window as PadWindow).__townPad;
        return { pointer: pad?.pointerEvents(), key: pad?.keyEvents() };
      });
      expect(events).toEqual({ pointer: 0, key: 0 });
    });
  });
}

test("the stick repeats, text input is protected, and real input clears the pad ring", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await startInTown(page);
  await moveTo(page, "building-townGate", PAD.down);
  await page.evaluate(() => {
    // SAFETY: installPad installs this hook before the app loads.
    (window as PadWindow).__townPad?.stick(1, 0);
  });
  await expect(page.getByTestId("building-cardShop")).toBeFocused();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const current = document.activeElement;
          return current instanceof HTMLElement
            ? current.dataset.buildingId
            : null;
        }),
      { intervals: [16, 32, 50] }
    )
    .toBe("bazaar");
  await page.evaluate(() => {
    // SAFETY: installPad installs this hook before the app loads.
    (window as PadWindow).__townPad?.stick(0, 0);
  });

  await page.keyboard.press("Tab");
  await expect(page.locator("[data-pad-focus]")).toHaveCount(0);
  await press(page, PAD.left);
  await expect(page.locator("[data-building-id][data-pad-focus]")).toHaveCount(
    1
  );
  await page.mouse.click(2, 2);
  await expect(page.locator("[data-pad-focus]")).toHaveCount(0);

  await page.evaluate(() => {
    const input = document.createElement("input");
    input.dataset.testid = "pad-text-field";
    document.body.append(input);
    input.focus();
  });
  await press(page, PAD.right);
  await press(page, PAD.south);
  await press(page, PAD.east);
  await expect(page.getByTestId("pad-text-field")).toBeFocused();
  await expect(page.getByTestId("town")).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});
