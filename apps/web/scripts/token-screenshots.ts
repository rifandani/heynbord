/* oxlint-disable eslint/no-await-in-loop -- screenshots are a sequence of UI states */
/**
 * Captures the steady-state screens of the game for a design-token change
 * (web docs/design.md). It uses the QA hooks, so the run is repeatable.
 *
 * Usage:
 *   bun scripts/token-screenshots.ts --out artifacts/token-conversion/after
 *
 * The dev server must be running in development mode (the QA hooks need it):
 *   VITE_E2E=true bunx vite --port 4100 --strictPort
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import type { Page } from "@playwright/test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_BASE_URL = "http://localhost:4100";
const SHOT_WIDTH = 1440;
const SHOT_HEIGHT = 900;

const readArg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const BASE_URL = readArg("base-url") ?? DEFAULT_BASE_URL;
const OUT = path.resolve(
  REPO_ROOT,
  readArg("out") ?? "artifacts/token-conversion/after"
);
const ONLY = new Set(
  (readArg("states") ?? "").split(",").filter((state) => state.length > 0)
);

interface QaHooks {
  readonly setXp: (xp: number) => void;
  readonly setCoin: (copper: number) => void;
  readonly openHeynspire: (floorsWon: number) => void;
  readonly giveUnopenedPack: (pack: {
    readonly pack: "peddler";
    readonly version: "all";
  }) => void;
  readonly setPausedForScreenshot: (paused: boolean) => void;
  readonly setState: (name: string) => { readonly state: string };
}

type QaCall =
  | { readonly op: "setXp"; readonly value: number }
  | { readonly op: "setCoin"; readonly value: number }
  | { readonly op: "openHeynspire"; readonly value: number }
  | { readonly op: "giveUnopenedPack" }
  | { readonly op: "pause" }
  | { readonly op: "setState"; readonly value: string };

const waitForGame = async (page: Page): Promise<void> => {
  await page.goto(`${BASE_URL}/play?seed=7`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-testid="town"]', { timeout: 60_000 });
  await page.waitForFunction(
    () => "__THREE_GAME_TEST_HOOKS__" in window,
    null,
    { timeout: 60_000 }
  );
};

const callHook = (page: Page, call: QaCall): Promise<void> =>
  page.evaluate((request) => {
    // SAFETY: the development build installs this shape on `window`
    // (battle/test-hooks.ts), and `waitForGame` waits for it before any call.
    const qaScope = window as Window & {
      readonly __THREE_GAME_TEST_HOOKS__?: QaHooks;
    };
    const qa = qaScope.__THREE_GAME_TEST_HOOKS__;
    if (!qa) {
      throw new Error("The QA hooks are not installed");
    }
    switch (request.op) {
      case "setXp": {
        qa.setXp(request.value);
        break;
      }
      case "setCoin": {
        qa.setCoin(request.value);
        break;
      }
      case "openHeynspire": {
        qa.openHeynspire(request.value);
        break;
      }
      case "giveUnopenedPack": {
        qa.giveUnopenedPack({ pack: "peddler", version: "all" });
        break;
      }
      case "pause": {
        qa.setPausedForScreenshot(true);
        break;
      }
      case "setState": {
        qa.setState(request.value);
        break;
      }
      default: {
        break;
      }
    }
  }, call);

const hooks = (page: Page) => ({
  setXp: (xp: number) => callHook(page, { op: "setXp", value: xp }),
  setCoin: (copper: number) => callHook(page, { op: "setCoin", value: copper }),
  openHeynspire: (floorsWon: number) =>
    callHook(page, { op: "openHeynspire", value: floorsWon }),
  giveUnopenedPack: () => callHook(page, { op: "giveUnopenedPack" }),
  pause: () => callHook(page, { op: "pause" }),
  setState: (name: string) => callHook(page, { op: "setState", value: name }),
});

const main = async (): Promise<void> => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: SHOT_WIDTH, height: SHOT_HEIGHT },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => {
    console.error(`page error: ${error.message}`);
  });

  const shots: string[] = [];
  const shot = async (name: string): Promise<void> => {
    if (ONLY.size > 0 && !ONLY.has(name)) {
      return;
    }
    await page.evaluate(() => {
      if (!document.querySelector("#token-shot-still")) {
        const style = document.createElement("style");
        style.id = "token-shot-still";
        style.textContent =
          "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}[data-sonner-toaster]{display:none!important}";
        document.head.append(style);
      }
      document.body.getBoundingClientRect();
    });
    // Let the canvas draw one more frame and the portals settle.
    await page.waitForTimeout(450);
    await page.screenshot({
      path: path.join(OUT, `${name}.jpg`),
      quality: 78,
      scale: "css",
      timeout: 30_000,
      type: "jpeg",
    });
    shots.push(name);
    console.info(`shot ${name}`);
  };

  try {
    await waitForGame(page);
    const qa = hooks(page);

    const openShortcut = async (id: string, testId: string): Promise<void> => {
      await page.getByTestId(`town-shortcut-${id}`).press("Enter");
      await page.waitForSelector(`[data-testid="${testId}"]`, {
        timeout: 30_000,
      });
    };
    const backToTown = async (): Promise<void> => {
      await page.getByTestId("town-shortcut-town").press("Enter");
      await page.waitForSelector('[data-testid="town"]', { timeout: 30_000 });
    };

    await shot("town");

    await page.getByTestId("town-settings").press("Enter");
    await page.waitForSelector('[data-testid="settings-dialog"]');
    await shot("settings");
    await page.keyboard.press("Escape");
    await page.waitForSelector('[data-testid="settings-dialog"]', {
      state: "detached",
    });

    await qa.setXp(1_000_000);
    await qa.setCoin(10_000_000);
    // The Heynspire, the Dungeons and the Seaport unlock from a cleared Campaign.
    await qa.openHeynspire(0);

    await openShortcut("campaign", "campaign");
    await shot("campaign");
    await page.locator('button[data-testid^="stage-"]').first().press("Enter");
    await page.waitForSelector('[data-testid="start-battle"]');
    await shot("stage-panel");
    await page.keyboard.press("Escape");
    await backToTown();

    await openShortcut("packs", "packs");
    await shot("packs");
    await page.getByTestId("drop-rates-button").press("Enter");
    await page.waitForSelector('[data-testid="drop-rates-dialog"]');
    await shot("drop-rates");
    await page.keyboard.press("Escape");
    await qa.giveUnopenedPack();
    await page.getByTestId("unopened-open-peddler-all").press("Enter");
    await page.waitForSelector('[data-testid="pack-reveal"]');
    await shot("pack-reveal");
    await page.getByTestId("reveal-done").press("Enter");
    await backToTown();

    await openShortcut("workshop", "workshop");
    await shot("workshop-craft");
    for (const station of ["fuse", "extract", "combine"] as const) {
      await page.getByTestId(`workshop-station-${station}`).press("Enter");
      await shot(`workshop-${station}`);
    }
    await backToTown();

    await openShortcut("heynspire", "heynspire");
    await shot("heynspire");
    await page.getByTestId("floor-2").click();
    await shot("heynspire-locked");
    await backToTown();

    await openShortcut("achievements", "achievements");
    await shot("achievements");
    await backToTown();

    await openShortcut("bazaar", "bazaar");
    await shot("bazaar");
    await backToTown();

    await openShortcut("seaport", "seaport");
    await shot("seaport");
    await backToTown();

    await openShortcut("dungeons", "dungeons");
    await shot("dungeons");
    await backToTown();

    await openShortcut("hero", "hero");
    await shot("hero");
    await backToTown();

    // The keyboard, because a toast can cover the right end of the Town Bar.
    await page.getByTestId("town-shortcut-deck").press("Enter");
    await page.waitForSelector('[data-testid="deck-dialog"]', {
      timeout: 30_000,
    });
    await shot("deck");
    await page.keyboard.press("Escape");
    await page.waitForSelector('[data-testid="deck-dialog"]', {
      state: "detached",
    });

    await page.getByTestId("town-shortcut-handbook").press("Enter");
    await page.waitForSelector('[data-testid="handbook-dialog"]', {
      timeout: 30_000,
    });
    await shot("handbook");
    await page.keyboard.press("Escape");
    await page.waitForSelector('[data-testid="handbook-dialog"]', {
      state: "detached",
    });

    for (const state of [
      "active-play",
      "targeting",
      "resolution",
      "victory",
      "defeat",
      "dungeon-three",
    ] as const) {
      await qa.setState(state);
      await qa.pause();
      await page.waitForSelector('[data-testid="battle-stage"]', {
        timeout: 30_000,
      });
      await shot(`battle-${state}`);
    }

    await qa.setState("town");
    await page.waitForSelector('[data-testid="town"]', { timeout: 30_000 });
  } finally {
    await browser.close();
  }

  console.info(`\n${shots.length} screenshots in ${OUT}`);
};

await main();
