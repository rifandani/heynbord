/* oxlint-disable eslint/no-await-in-loop -- the bot plays one real input at a time; each step reads the game state that the previous step made */
import { writeFile } from "node:fs/promises";

import { expect, test } from "./_base";
import type { Page } from "./_base";

/**
 * Bot playtests for the Battle slice (threejs-qa-release, playtest-bot). They
 * play with real input only: mouse clicks on cards and on the 3D target
 * markers, drag and drop, touch taps and the keyboard. The diagnostics hook
 * only reads state and the screen points of the target markers.
 */

interface Diagnostics {
  readonly state: {
    readonly mode: string;
    readonly turnNumber?: number;
    readonly units?: number;
    readonly playerHp?: number;
    readonly enemyHp?: number;
    readonly queued?: number;
    readonly current?: string | null;
    readonly result?: {
      readonly winner: string;
      readonly reason: string;
    } | null;
    readonly eventsPlayed?: number;
    readonly hand?: readonly number[];
    readonly tutorial?: {
      readonly shown: readonly string[];
      readonly done: readonly string[];
    } | null;
  };
  readonly renderer: {
    readonly render: { readonly calls: number; readonly triangles: number };
  };
  readonly frames: { readonly fps: number; readonly frameMs: number };
  readonly targetPoints: () => readonly {
    readonly x: number;
    readonly y: number;
  }[];
  readonly unitPoints: () => readonly UnitPoint[];
}

interface UnitPoint {
  readonly id: number;
  readonly owner: "player" | "enemy";
  readonly x: number;
  readonly y: number;
}

declare global {
  interface Window {
    __THREE_GAME_DIAGNOSTICS__?: Diagnostics;
  }
}

// WebGL suites run one test at a time: parallel contexts share the GPU and slow the timed phases.
test.describe.configure({ mode: "serial" });

const state = (page: Page) =>
  page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.state ?? null);

const battleMode = async (page: Page) => {
  const current = await state(page);
  return current?.mode;
};

const turnNumber = async (page: Page) => {
  const current = await state(page);
  return current?.turnNumber;
};

const unitCount = async (page: Page) => {
  const current = await state(page);
  return current?.units ?? 0;
};

const eventsPlayed = async (page: Page) => {
  const current = await state(page);
  return current?.eventsPlayed ?? 0;
};

const tutorialShown = async (page: Page) => {
  const current = await state(page);
  return current?.tutorial?.shown ?? null;
};

/** Reads each open Tutorial Step text and presses "Got it". */
const closeTutorialText = async (page: Page) => {
  const gotIt = page.getByTestId("tutorial-got-it");
  for (let count = 0; count < 6 && (await gotIt.isVisible()); count += 1) {
    await gotIt.click();
  }
};

const targetPoints = (page: Page) =>
  page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.targetPoints() ?? []);

const unitPoints = (page: Page) =>
  page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.unitPoints() ?? []);

/** Opens a Battle in the middle of play (QA state), with Units of both Sides on the Board. */
const openBoardWithUnits = async (page: Page) => {
  await page.goto("/play?state=active-play&seed=7");
  await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
    timeout: 30_000,
  });
  await expect.poll(() => battleMode(page), { timeout: 30_000 }).toBe("battle");
  await expect
    .poll(async () => {
      const units = await unitPoints(page);
      return new Set(units.map((unit) => unit.owner)).size;
    })
    .toBe(2);
  return unitPoints(page);
};

const unitOf = (units: readonly UnitPoint[], owner: UnitPoint["owner"]) => {
  const unit = units.find((candidate) => candidate.owner === owner);
  if (!unit) {
    throw new Error(`No ${owner} Unit on the Board`);
  }
  return unit;
};

const startBattle = async (
  page: Page,
  stageId: string,
  deckId: string,
  seed: number
) => {
  await page.goto(`/play?seed=${seed}`);
  await page.getByTestId("building-townGate").click();
  await page.getByTestId(`stage-${stageId}`).click();
  await page.getByTestId(`deck-${deckId}`).click();
  await page.getByTestId("start-battle").click();
  await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
    timeout: 30_000,
  });
  await expect.poll(() => battleMode(page), { timeout: 30_000 }).toBe("battle");
};

/** Waits until the player can act, or the Battle has a result. */
const waitForPlayer = async (
  page: Page,
  input: "mouse" | "keyboard" = "mouse"
) => {
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("battle-result").isVisible()) {
          return "result";
        }
        // Tutorial Step 3 holds the playback until its text closes.
        if (input === "mouse") {
          await closeTutorialText(page);
        }
        if (await page.getByTestId("end-turn").isEnabled()) {
          return "player";
        }
        // Real input: Skip ends the animations of the current phase.
        const skip = page.getByRole("button", { name: /^Skip$/u });
        if (await skip.isEnabled()) {
          await (input === "keyboard"
            ? page.keyboard.press("s")
            : skip.click());
        }
        return "waiting";
      },
      { timeout: 60_000, intervals: [200] }
    )
    .not.toBe("waiting");
};

/** Clicks each Ready card that has a target, then clicks the first target marker in the 3D scene. */
const playReadyCards = async (page: Page): Promise<number> => {
  let played = 0;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    const count = await ready.count();
    let playedThisRound = false;
    for (let index = 0; index < count; index += 1) {
      const card = ready.nth(index);
      await card.click();
      // The Step 2 text shows at the first selection of a Creature Card.
      await closeTutorialText(page);
      const points = await targetPoints(page);
      const [point] = points;
      if (point) {
        const before = await eventsPlayed(page);
        await page.mouse.click(point.x, point.y);
        await expect.poll(() => eventsPlayed(page)).toBeGreaterThan(before);
        played += 1;
        playedThisRound = true;
        await expect(page.getByTestId("end-turn")).toBeEnabled({
          timeout: 10_000,
        });
        break;
      }
      // A card that goes to the Hand at once (no target) also counts as a play.
      if (
        (await page
          .locator("[data-testid^='hand-card-'][aria-pressed='true']")
          .count()) === 0
      ) {
        played += 1;
        playedThisRound = true;
        break;
      }
      await page.keyboard.press("Escape");
    }
    if (!playedThisRound) {
      break;
    }
  }
  return played;
};

test.describe("Battle bot playtest", () => {
  test.describe.configure({ mode: "serial" });

  test("plays a full Battle with mouse input to a result, then retries", async ({
    page,
  }) => {
    test.setTimeout(420_000);
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    await startBattle(page, "1-1", "raiders", 7);
    // Stage 1-1 is the Tutorial until its first win (GDD 8.3).
    await expect(page.getByTestId("tutorial-text")).toHaveAttribute(
      "data-step",
      "ready"
    );
    await expect(page.getByTestId("hand")).toHaveAttribute(
      "data-tutorial-highlight",
      "true"
    );
    await page.getByRole("button", { name: /Speed/u }).click();
    const fps: number[] = [];
    const drawCalls: number[] = [];
    const metrics = {
      seed: 7,
      stage: "1-1",
      deck: "raiders",
      turns: 0,
      cardsPlayed: 0,
      firstPlayTurn: 0,
      fps,
      drawCalls,
    };
    for (let turn = 0; turn < 70; turn += 1) {
      await waitForPlayer(page);
      if (await page.getByTestId("battle-result").isVisible()) {
        break;
      }
      const played = await playReadyCards(page);
      if (played > 0 && metrics.firstPlayTurn === 0) {
        metrics.firstPlayTurn = turn + 1;
      }
      metrics.cardsPlayed += played;
      metrics.turns += 1;
      const diagnostics = await page.evaluate(() => ({
        fps: window.__THREE_GAME_DIAGNOSTICS__?.frames.fps ?? 0,
        calls: window.__THREE_GAME_DIAGNOSTICS__?.renderer.render.calls ?? 0,
      }));
      metrics.fps.push(diagnostics.fps);
      metrics.drawCalls.push(diagnostics.calls);
      await page.getByTestId("end-turn").click();
    }
    const dialog = page.getByTestId("battle-result");
    await expect(dialog).toBeVisible();
    const final = await state(page);
    expect(final?.result?.winner).toBe("player");
    expect(final?.tutorial?.shown).toEqual(
      expect.arrayContaining(["ready", "summonZone", "resolution"])
    );
    expect(metrics.cardsPlayed).toBeGreaterThan(3);
    expect(Math.max(...metrics.drawCalls)).toBeLessThan(150);
    await writeFile(
      "artifacts/bot-playtest.json",
      JSON.stringify(
        {
          ...metrics,
          result: final?.result,
          finalTurnNumber: final?.turnNumber,
          playerHp: final?.playerHp,
          enemyHp: final?.enemyHp,
          consoleErrors,
        },
        null,
        2
      )
    );
    // The retry path starts a new Battle.
    await page.getByTestId("retry").click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => turnNumber(page)).toBe(1);
    // After the first win, Stage 1-1 is a normal Stage.
    await expect.poll(() => tutorialShown(page)).toBeNull();
    await expect(page.getByTestId("tutorial-text")).toBeHidden();
    expect(consoleErrors).toEqual([]);
  });

  test("plays a card by drag and drop", async ({ page }) => {
    await startBattle(page, "1-2", "raiders", 11);
    let ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    for (let turn = 0; turn < 6 && (await ready.count()) === 0; turn += 1) {
      await page.getByTestId("end-turn").click();
      await waitForPlayer(page);
      ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    }
    const card = ready.first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
      return;
    }
    const unitsBefore = await unitCount(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 5 });
    const [point] = await targetPoints(page);
    expect(point).toBeDefined();
    await page.mouse.move(point?.x ?? 0, point?.y ?? 0, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => unitCount(page)).toBeGreaterThan(unitsBefore);
  });

  test("plays with the keyboard only", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/play?seed=5");
    await page.getByTestId("building-townGate").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("start-battle").focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => battleMode(page), { timeout: 30_000 })
      .toBe("battle");
    // Stage 1-1 is the Tutorial. Keyboard focus reaches its Skip control.
    const skipTutorial = page.getByTestId("tutorial-skip");
    for (
      let count = 0;
      count < 20 &&
      !(await skipTutorial.evaluate((node) => node === document.activeElement));
      count += 1
    ) {
      await page.keyboard.press("Tab");
    }
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("tutorial-text")).toBeHidden();
    let summoned = false;
    for (let turn = 0; turn < 6; turn += 1) {
      await waitForPlayer(page, "keyboard");
      const unitsBefore = await unitCount(page);
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      // The view shows the new Unit when its summon animation starts.
      summoned ||= await expect
        .poll(() => unitCount(page), { timeout: 3000 })
        .toBeGreaterThan(unitsBefore)
        .then(() => true)
        .catch(() => false);
      await page.keyboard.press("e");
    }
    await waitForPlayer(page, "keyboard");
    expect(summoned).toBe(true);
    expect(await turnNumber(page)).toBeGreaterThanOrEqual(6);
  });

  test("shows the Tutorial again after an Abandon", async ({ page }) => {
    await startBattle(page, "1-1", "vanguard", 9);
    await expect(page.getByTestId("tutorial-text")).toBeVisible();
    await page.getByTestId("tutorial-skip").click();
    await expect(page.getByTestId("tutorial-text")).toBeHidden();
    await page.getByTestId("leave-battle").click();
    await expect(page.getByTestId("abandon-dialog")).toBeVisible();
    await page.getByTestId("abandon-confirm").click();
    // An Abandon goes back to the Campaign.
    await expect(page.getByTestId("campaign")).toBeVisible();
    await page.getByTestId("start-battle").click();
    await expect(page.getByTestId("tutorial-text")).toHaveAttribute(
      "data-step",
      "ready"
    );
  });

  test("shows no Tutorial in other Stages", async ({ page }) => {
    await startBattle(page, "1-2", "vanguard", 9);
    await expect.poll(() => tutorialShown(page)).toBeNull();
    await expect(page.getByTestId("tutorial-text")).toBeHidden();
  });

  test("shows the Key Guide from the Top Bar on hover", async ({ page }) => {
    await startBattle(page, "1-2", "vanguard", 9);
    await expect(page.getByTestId("key-guide")).toBeHidden();
    await page.getByRole("button", { name: "Key Guide" }).hover();
    await expect(page.getByTestId("key-guide")).toContainText("End the Turn");
  });

  test("switches the language to Indonesian", async ({ page }) => {
    await page.goto("/play");
    // The keyboard, because the "ready to use offline" toast can cover the
    // right end of the Town Bar.
    await page.getByRole("button", { name: "English" }).press("Enter");
    await page.getByRole("menuitemradio", { name: "Indonesia" }).press("Enter");
    await expect(page.getByTestId("building-townGate")).toHaveText("Kampanye");
    await page.getByTestId("building-townGate").click();
    await expect(page.getByTestId("start-battle")).toHaveText(
      "Mulai Pertempuran"
    );
  });
});

test.describe("Card Details of a Unit (UI-05)", () => {
  test("hover shows the Card Details of a Unit of each Side, away from the Unit", async ({
    page,
  }) => {
    const units = await openBoardWithUnits(page);
    const details = page.getByTestId("unit-details");
    const width = page.viewportSize()?.width ?? 0;
    for (const owner of ["enemy", "player"] as const) {
      const unit = unitOf(units, owner);
      await page.mouse.move(unit.x, unit.y);
      await expect(details).toHaveAttribute("data-unit-id", String(unit.id));
      await expect(page.getByTestId("unit-details-side")).toHaveText(
        owner === "enemy" ? "Enemy" : "Yours"
      );
      await expect(page.getByText(/HP \d+ of \d+/u)).toHaveCount(0);
      await expect(details).toHaveAttribute(
        "data-side",
        unit.x < width / 2 ? "right" : "left"
      );
    }
    // Off the Units, the Card Details close.
    await page.mouse.move(width / 2, 4);
    await expect(details).toBeHidden();
  });

  test("the I key inspects the Units, the arrow keys go from Unit to Unit, and Esc stops", async ({
    page,
  }) => {
    await openBoardWithUnits(page);
    const details = page.getByTestId("unit-details");
    await expect(details).toBeHidden();
    await page.keyboard.press("i");
    await expect(details).toBeVisible();
    const first = await details.getAttribute("data-unit-id");
    const ids = new Set([first]);
    for (const key of ["ArrowRight", "ArrowDown", "ArrowUp", "ArrowLeft"]) {
      await page.keyboard.press(key);
      ids.add(await details.getAttribute("data-unit-id"));
    }
    expect(ids.size).toBeGreaterThanOrEqual(2);
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await expect(page.getByTestId("battle-stage")).toBeVisible();
  });
});

test.describe("Town", () => {
  test("opens first, and the Town Gate opens the Campaign", async ({
    page,
  }) => {
    await page.goto("/play");
    // The first load of a cold dev server can take some seconds.
    await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("town-bar")).toBeVisible();
    await expect(page.getByTestId("town-shortcut-town")).toHaveAttribute(
      "aria-current",
      "page"
    );
    await page.getByTestId("building-townGate").click();
    await expect(page.getByTestId("campaign")).toBeVisible();
    await expect(page.getByTestId("town")).toBeHidden();
    await expect(page.getByTestId("town-shortcut-campaign")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  test("goes back to the Town with Esc and with the Town shortcut", async ({
    page,
  }) => {
    await page.goto("/play");
    await page.getByTestId("town-shortcut-campaign").click();
    await expect(page.getByTestId("campaign")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town")).toBeVisible();
    await page.getByTestId("town-shortcut-campaign").click();
    await page.getByTestId("town-shortcut-town").click();
    await expect(page.getByTestId("town")).toBeVisible();
  });

  test("a shortcut to a screen that does not exist yet keeps focus and says 'Opens later'", async ({
    page,
  }) => {
    await page.goto("/play");
    const hero = page.getByRole("button", { name: "Hero, opens later" });
    await hero.focus();
    await expect(page.getByTestId("town-tooltip-hero")).toContainText(
      "Opens later"
    );
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("town")).toBeVisible();
  });

  test("a reload opens the Town", async ({ page }) => {
    await page.goto("/play");
    await page.getByTestId("building-townGate").click();
    await expect(page.getByTestId("campaign")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("town")).toBeVisible();
  });
});

test.describe("Town on a phone", () => {
  test.use({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });

  test("shows the Town Gate and all shortcuts with no scroll", async ({
    page,
  }) => {
    await page.goto("/play");
    const gate = page.getByTestId("building-townGate");
    await expect(gate).toBeInViewport({ ratio: 1 });
    const bar = await page.getByTestId("town-bar").boundingBox();
    const gateBox = await gate.boundingBox();
    expect(bar && gateBox && gateBox.y + gateBox.height <= bar.y).toBe(true);
    await expect(page.getByTestId("town-shortcut-bazaar")).toBeInViewport({
      ratio: 1,
    });
    await gate.tap();
    await expect(page.getByTestId("campaign")).toBeVisible();
  });
});

test.describe("Battle on a phone", () => {
  test.use({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });

  test("plays a card with taps in landscape", async ({ page }) => {
    await startBattle(page, "1-2", "vanguard", 3);
    let ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    for (let turn = 0; turn < 6 && (await ready.count()) === 0; turn += 1) {
      await page.getByTestId("end-turn").tap();
      await waitForPlayer(page);
      ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    }
    const unitsBefore = await unitCount(page);
    await ready.first().tap();
    const [point] = await targetPoints(page);
    expect(point).toBeDefined();
    await page.touchscreen.tap(point?.x ?? 0, point?.y ?? 0);
    await expect.poll(() => unitCount(page)).toBeGreaterThan(unitsBefore);
  });
});

test.describe("Card Details of a Unit on a phone (UI-05)", () => {
  test.use({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });

  test("a long press shows the Card Details until the finger goes up; a tap does not", async ({
    page,
  }) => {
    const units = await openBoardWithUnits(page);
    const unit = unitOf(units, "enemy");
    const details = page.getByTestId("unit-details");
    await page.touchscreen.tap(unit.x, unit.y);
    await expect(details).toBeHidden();

    // Playwright has no touch hold, so send the touch events through CDP.
    const cdp = await page.context().newCDPSession(page);
    const touchPoints = [{ x: unit.x, y: unit.y }];
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints,
    });
    await expect(details).toHaveAttribute("data-unit-id", String(unit.id));
    await expect(page.getByTestId("unit-details-side")).toHaveText("Enemy");
    // The Card Details fit between the Top Bar and the Hand Bar.
    const box = await details.boundingBox();
    const hand = await page.getByTestId("hand-bar").boundingBox();
    expect(box && hand && box.y >= 0 && box.y + box.height <= hand.y).toBe(
      true
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(details).toBeHidden();
  });
});

test.describe("Key Guide on a phone", () => {
  test.use({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
  });

  test("opens and closes the Key Guide with taps", async ({ page }) => {
    await startBattle(page, "1-2", "vanguard", 3);
    await page.getByTestId("key-guide-button").tap();
    await expect(page.getByTestId("key-guide")).toContainText("End the Turn");
    await page.getByTestId("turn-number").tap();
    await expect(page.getByTestId("key-guide")).toBeHidden();
  });
});

test.describe("Battle on a phone in portrait", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test("asks the player to turn the phone (UI-03)", async ({ page }) => {
    await page.goto("/play");
    await expect(
      page.getByText("Turn your phone to landscape to play.")
    ).toBeVisible();
  });
});
