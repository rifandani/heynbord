/* oxlint-disable eslint/no-await-in-loop -- the bot plays one real input at a time, and each step reads the state that the previous step made */
/* oxlint-disable unicorn/prefer-dom-node-dataset, unicorn/prefer-dom-node-text-content -- Playwright locators are not DOM nodes */
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import {
  arch,
  cpus,
  loadavg,
  platform,
  release,
  tmpdir,
  totalmem,
} from "node:os";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

/**
 * Measures full Battles on a real GPU (NFR-01). This is not a CI gate: it
 * needs a person's device, a display at its real refresh rate, and a headed
 * browser. Headless Chromium renders in software and gives no NFR-01 number.
 *
 * The runner:
 *
 * 1. Builds the production app, or uses `--url` for a running origin.
 * 2. Opens the app in the installed Google Chrome, headed, with no viewport
 *    override, so that the native DPR reaches the game.
 * 3. Plays a full Battle with real mouse input at Speed ×1, with no Skip.
 * 4. Discards the first 3 s after the scene mounts, calls `reset()`, then
 *    reads `snapshot()` at the result.
 * 5. Writes one JSON file for each run under `artifacts/performance/`.
 *
 * Usage (repository root):
 *
 *   bun web measure:frame-rate --device=macbook-pro-m2
 *   bun web measure:frame-rate --url=http://192.168.1.10:4100 --device=pixel-6a --cdp=http://127.0.0.1:9222
 *
 * `--cdp` measures a real Android phone: connect it with USB debugging,
 * open the app in Chrome, run `adb forward tcp:9222 localabstract:chrome_devtools_remote`,
 * and pass the app URL on the local network.
 */

type Scenario = "baseline" | "strict";

interface ScenarioSpec {
  readonly id: Scenario;
  readonly stage: string;
  readonly label: string;
  readonly maxTurns: number;
  readonly timeoutMs: number;
}

const SCENARIOS: readonly ScenarioSpec[] = [
  {
    id: "baseline",
    stage: "1-1",
    label: "Stage 1-1, Raiders Deck, seed 4",
    maxTurns: 80,
    timeoutMs: 8 * 60_000,
  },
  {
    id: "strict",
    stage: "dungeon-3",
    label: "Dungeon 3 (4 Lanes, 3 Bosses), active Deck, seed 4",
    maxTurns: 300,
    timeoutMs: 25 * 60_000,
  },
];

/** The part of `window.__THREE_GAME_DIAGNOSTICS__` that the runner reads. */
interface Diagnostics {
  readonly state: BattleState;
  targetPoints: () => readonly { readonly x: number; readonly y: number }[];
  snapshot: () => Snapshot;
  reset: () => void;
}

interface BattleState {
  readonly mode: string;
  readonly stageId?: string;
  readonly seed?: number;
  readonly turnNumber?: number;
  readonly units?: number;
  readonly result?: { readonly winner: string; readonly reason: string } | null;
  readonly eventsPlayed?: number;
  readonly tutorial?: unknown;
}

interface Snapshot {
  readonly frames: {
    readonly fps: number;
    readonly frameMs: number;
    readonly meanFps: number;
    readonly p50: number;
    readonly p95: number;
    readonly p99: number;
    readonly worst: number;
    readonly samples: number;
    readonly total: number;
    readonly cap: number;
    readonly wrapped: boolean;
  };
  readonly drawCalls: { readonly current: number; readonly max: number };
  readonly dpr: {
    readonly native: number;
    readonly current: number;
    readonly changes: readonly {
      readonly at: number;
      readonly from: number;
      readonly to: number;
    }[];
  };
}

/** The QA hooks that the runner adds to `window` on a `?qa` page. */
type DiagWindow = Window & {
  __THREE_GAME_DIAGNOSTICS__?: Diagnostics;
  __THREE_GAME_TEST_HOOKS__?: { setXp: (xp: number) => void };
};

const webRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const artifactDir = path.join(webRoot, "artifacts/performance");
const LEVEL_30_XP = 24_130;

const options = new Map<string, string>();
for (const argument of process.argv.slice(2)) {
  if (!argument.startsWith("--")) {
    continue;
  }
  const [key, value = "true"] = argument.slice(2).split("=");
  if (key) {
    options.set(key, value);
  }
}

const device = options.get("device") ?? "macbook-pro-m2";
const runs = Number(options.get("runs") ?? 2);
const cdp = options.get("cdp");
const providedUrl = options.get("url");
const only = options.get("scenario");
const skipBuild = options.has("skip-build") || Boolean(providedUrl);

const log = (message: string) => {
  process.stdout.write(`${message}\n`);
};

const runCommand = (command: string, args: readonly string[], cwd: string) =>
  execFileSync(command, args, { cwd, encoding: "utf-8" }).trim();

const readHost = (command: string, args: readonly string[]) => {
  try {
    return runCommand(command, args, repoRoot);
  } catch {
    return "unknown";
  }
};

const hardware = () => {
  const battery = readHost("pmset", ["-g", "batt"]);
  const powerMode = readHost("pmset", ["-g"]);
  return {
    model: readHost("sysctl", ["-n", "hw.model"]),
    cpu: readHost("sysctl", ["-n", "machdep.cpu.brand_string"]),
    os: `${platform()} ${release()}`,
    arch: arch(),
    powerSource:
      /AC Power/u.test(battery) || /AC Power/u.test(powerMode)
        ? "AC power"
        : "battery",
    lowPowerMode: /lowpowermode\s+1/u.test(powerMode),
    powerMode:
      powerMode
        .split("\n")
        .find((line) => line.includes("lowpowermode"))
        ?.trim() ?? "unknown",
    cores: cpus().length,
    memoryGb: Math.round(totalmem() / 1024 ** 3),
    loadAverage: loadavg().map((value) => Number(value.toFixed(2))),
  };
};

const commit = () => {
  const head = runCommand("git", ["rev-parse", "HEAD"], repoRoot);
  const dirty = runCommand("git", ["status", "--short"], repoRoot);
  return { head, dirty };
};

const availablePort = async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  // SAFETY: listening on an IP address gives AddressInfo, never a pipe name.
  const address = server.address() as AddressInfo;
  server.close();
  await once(server, "close");
  return address.port;
};

/** Builds the production app and copies the output, so another build cannot change it. */
const build = async () => {
  const origin = await availablePort();
  const env = {
    ...process.env,
    PORTLESS_URL: "",
    VITE_APP_URL: `http://127.0.0.1:${origin}`,
    VITE_APP_TITLE: "Heynbord",
    NITRO_HOST: "127.0.0.1",
    NITRO_PORT: String(origin),
  };
  await rm(path.join(webRoot, ".output"), { recursive: true, force: true });
  log("Building the production app...");
  execFileSync("bun", ["run", "build"], {
    cwd: webRoot,
    env,
    stdio: "inherit",
  });
  const copy = path.join(tmpdir(), `heynbord-frame-rate-${process.pid}`);
  await cp(path.join(webRoot, ".output"), copy, { recursive: true });
  return { output: copy, appUrl: `http://127.0.0.1:${origin}` };
};

const startOrigin = async (output: string, appUrl: string) => {
  const port = Number(new URL(appUrl).port);
  const server = spawn("node", [path.join(output, "server/index.mjs")], {
    cwd: output,
    env: {
      ...process.env,
      VITE_APP_URL: appUrl,
      NITRO_HOST: "127.0.0.1",
      NITRO_PORT: String(port),
    },
    stdio: "inherit",
  });
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`The production server exited with ${server.exitCode}.`);
    }
    try {
      const response = await fetch(appUrl, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        return async () => {
          const closed = once(server, "exit");
          server.kill("SIGTERM");
          await closed;
          await rm(output, { recursive: true, force: true });
        };
      }
    } catch {
      // The server is not up yet.
    }
    await delay(100);
  }
  throw new Error("The production server did not start.");
};

/**
 * Real pace for the bot: a short pause before each click, never a Skip. The
 * window comes to the front again, because macOS throttles an occluded one.
 */
const pace = async (page: Page) => {
  await delay(300 + Math.floor(Math.random() * 350));
  await page.bringToFront();
};

const state = (page: Page) =>
  page.evaluate(
    // SAFETY: a `?qa` page installs the diagnostics hook with this shape.
    () => (window as DiagWindow).__THREE_GAME_DIAGNOSTICS__?.state ?? null
  );

const targetPoints = (page: Page) =>
  page.evaluate(
    // SAFETY: a `?qa` page installs the diagnostics hook with this shape.
    () =>
      (window as DiagWindow).__THREE_GAME_DIAGNOSTICS__?.targetPoints() ?? []
  );

const eventsPlayed = async (page: Page) => {
  const current = await state(page);
  return current?.eventsPlayed ?? 0;
};

const closeTutorialText = async (page: Page) => {
  const gotIt = page.getByTestId("tutorial-got-it");
  for (let count = 0; count < 6; count += 1) {
    if (!(await gotIt.isVisible().catch(() => false))) {
      return;
    }
    await gotIt.click({ timeout: 1000 }).catch(() => null);
    await delay(120);
  }
};

const waitFor = async (
  check: () => Promise<boolean>,
  timeoutMs: number,
  label: string
) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) {
      return;
    }
    await delay(200);
  }
  throw new Error(`Timed out after ${timeoutMs} ms: ${label}`);
};

/** Waits until the player can act, or the Battle has a result. Never skips. */
const waitForPlayer = async (page: Page, deadline: number) => {
  let lastRaise = 0;
  let lastLog = 0;
  for (;;) {
    if (
      await page
        .getByTestId("battle-result")
        .isVisible()
        .catch(() => false)
    ) {
      return "result" as const;
    }
    await closeTutorialText(page);
    if (
      await page
        .getByTestId("end-turn")
        .isEnabled()
        .catch(() => false)
    ) {
      return "player" as const;
    }
    if (Date.now() > deadline) {
      throw new Error("The Battle did not reach the player or a result.");
    }
    if (Date.now() - lastRaise > 2000) {
      await page.bringToFront();
      lastRaise = Date.now();
    }
    if (Date.now() - lastLog > 30_000) {
      const current = await state(page);
      log(
        `  waiting: Turn ${current?.turnNumber ?? "?"}, ` +
          `${current?.units ?? "?"} Units, ${current?.eventsPlayed ?? "?"} Events`
      );
      lastLog = Date.now();
    }
    await delay(250);
  }
};

/** Clicks each Ready card that has a target, and one of its target markers. */
const playReadyCards = async (page: Page) => {
  let played = 0;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const ready = page.locator("[data-testid^='hand-card-'][data-ready]");
    const count = await ready.count();
    let playedThisRound = false;
    for (let index = 0; index < count; index += 1) {
      const card = ready.nth(index);
      if (!(await card.isVisible().catch(() => false))) {
        continue;
      }
      await pace(page);
      await card.click();
      await closeTutorialText(page);
      const points = await targetPoints(page);
      if (points.length > 0) {
        const before = await eventsPlayed(page);
        let resolved = false;
        for (const point of points) {
          await pace(page);
          await page.mouse.click(point.x, point.y);
          try {
            await waitFor(
              async () => (await eventsPlayed(page)) > before,
              6000,
              "the played card to resolve"
            );
            resolved = true;
            break;
          } catch {
            // A Unit or an overlay can cover one marker. Try the next one.
          }
        }
        if (!resolved) {
          throw new Error(
            `The card did not resolve at any of ${points.length} target markers.`
          );
        }
        played += 1;
        playedThisRound = true;
        await waitFor(
          () => page.getByTestId("end-turn").isEnabled(),
          15_000,
          "End Turn to enable after a play"
        );
        break;
      }
      // A card that goes to the Hand at once has no target, and it counts as a play.
      const selected = await page
        .locator("[data-testid^='hand-card-'][aria-pressed='true']")
        .count();
      if (selected === 0) {
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

const waitForBattle = async (page: Page) => {
  await page.locator("[data-battle-canvas] canvas").waitFor({
    state: "visible",
    timeout: 60_000,
  });
  await waitFor(
    async () => {
      const current = await state(page);
      return current?.mode === "battle";
    },
    30_000,
    "the Battle to start"
  );
};

/** Dismisses the Region opening Story Scene before the Stage screen. */
const skipStory = async (page: Page) => {
  await page.getByTestId("campaign").waitFor({
    state: "visible",
    timeout: 30_000,
  });
  const skip = page.getByTestId("story-skip");
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await skip.waitFor({ state: "hidden", timeout: 30_000 });
  }
};

const startBaseline = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByTestId("building-townGate").click();
  await skipStory(page);
  await page.getByTestId("stage-1-1").click();
  await page.getByTestId("deck-raiders").click();
  await page.getByTestId("start-battle").click();
  await waitForBattle(page);
};

const startStrict = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByTestId("town").waitFor({ state: "visible", timeout: 60_000 });
  await waitFor(
    () =>
      page.evaluate(
        // SAFETY: a `?qa` page installs the test hooks with this shape.
        () => Boolean((window as DiagWindow).__THREE_GAME_TEST_HOOKS__)
      ),
    30_000,
    "the QA hooks"
  );
  await page.evaluate((xp) => {
    // SAFETY: a `?qa` page installs the test hooks with this shape.
    (window as DiagWindow).__THREE_GAME_TEST_HOOKS__?.setXp(xp);
  }, LEVEL_30_XP);
  const shortcut = page.getByTestId("town-shortcut-dungeons");
  await waitFor(
    async () =>
      (await shortcut.getAttribute("data-locked").catch(() => "true")) !==
      "true",
    30_000,
    "Dungeon 3 to open"
  );
  await shortcut.focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("dungeons").waitFor({
    state: "visible",
    timeout: 30_000,
  });
  const panel = page.getByTestId("dungeon-panel");
  await waitFor(
    async () => (await panel.getAttribute("data-dungeon")) === "3",
    30_000,
    "Dungeon 3 to show"
  );
  const problem = page.getByTestId("dungeon-fight-problem");
  if (await problem.isVisible().catch(() => false)) {
    // A level 30 Deck must hold 15 cards, and a starter Deck holds 10. The
    // Deck builder fills it from the collection that a new Player owns.
    log(`  Filling the Deck: ${await problem.innerText()}`);
    await page.getByTestId("edit-decks").click();
    await page.getByTestId("deck-dialog").waitFor({
      state: "visible",
      timeout: 30_000,
    });
    await page.getByTestId("deck-autofill").click();
    await page.getByTestId("deck-close").click();
    await page.getByTestId("deck-dialog").waitFor({
      state: "hidden",
      timeout: 30_000,
    });
    await waitFor(
      async () => !(await problem.isVisible().catch(() => false)),
      10_000,
      "the auto-filled Deck to pass the Deck rules"
    );
  }
  const chosenDeck = await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>(
      "[data-testid^='deck-'] input:checked"
    );
    return (
      input?.closest<HTMLElement>("[data-testid^='deck-']")?.dataset.testid ??
      null
    );
  });
  await page.getByTestId("dungeon-fight").click();
  await waitForBattle(page);
  return { deck: chosenDeck?.replace(/^deck-/u, "") ?? "unknown" };
};

interface RunMeta {
  readonly measuredAt: string;
  readonly device: string;
  readonly host: ReturnType<typeof hardware>;
  readonly build: ReturnType<typeof commit>;
  readonly browser: {
    readonly version: string;
    readonly channel: string;
    readonly headed: boolean;
  };
  readonly scene: {
    readonly scenario: Scenario;
    readonly stage: string;
    readonly seed: number;
    readonly deck: string;
    readonly speed: number;
    readonly skip: boolean;
    readonly input: string;
    readonly warmUpDiscardedMs: number;
  };
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
  };
  readonly measuredDurationMs: number;
  readonly turns: number;
  readonly result: { readonly winner: string; readonly reason: string };
  readonly page: {
    readonly userAgent: string;
    readonly hardwareConcurrency: number;
    readonly visibility: string;
  };
  readonly consoleErrors: readonly string[];
}

interface RunResult {
  readonly meta: RunMeta;
  readonly snapshot: Snapshot;
}

const runBattle = async (
  browser: Browser,
  scenario: ScenarioSpec,
  runIndex: number,
  appUrl: string,
  host: ReturnType<typeof hardware>,
  buildInfo: ReturnType<typeof commit>,
  remote: boolean
): Promise<RunResult> => {
  // A phone over CDP gives one browser context and its real screen; a desktop
  // run gets a fresh context at the window size, with no viewport override.
  const context = remote
    ? browser.contexts()[0]
    : await browser.newContext({
        viewport: null,
        locale: "en-US",
        colorScheme: "light",
        reducedMotion: "no-preference",
      });
  if (!context) {
    throw new Error("The browser has no context to measure.");
  }
  const page = await context.newPage();
  await page.bringToFront();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  const url = `${appUrl}/play?qa&seed=4`;
  log(`\n${scenario.id} run ${runIndex}: ${scenario.label}`);
  let deck = "raiders";
  try {
    if (scenario.id === "baseline") {
      await startBaseline(page, url);
    } else {
      ({ deck } = await startStrict(page, url));
    }
    // The protocol discards the mount and its first 3 s.
    await delay(3000);
    const reset = await page.evaluate(() => {
      // SAFETY: a `?qa` page installs the diagnostics hook with this shape.
      const diagnostics = (window as DiagWindow).__THREE_GAME_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error("The QA diagnostics hook is absent.");
      }
      diagnostics.reset();
      return {
        at: performance.now(),
        viewport: {
          width: innerWidth,
          height: innerHeight,
          dpr: devicePixelRatio,
        },
        visibility: document.visibilityState,
        state: diagnostics.state,
      };
    });
    const deadline = Date.now() + scenario.timeoutMs;
    let turns = 0;
    for (;;) {
      if (turns >= scenario.maxTurns) {
        throw new Error(`The Battle passed ${scenario.maxTurns} Turns.`);
      }
      const status = await waitForPlayer(page, deadline);
      if (status === "result") {
        break;
      }
      await playReadyCards(page);
      turns += 1;
      await pace(page);
      await page.getByTestId("end-turn").click();
    }
    await page.getByTestId("battle-result").waitFor({
      state: "visible",
      timeout: 30_000,
    });
    await delay(500);
    const end = await page.evaluate(() => {
      // SAFETY: a `?qa` page installs the diagnostics hook with this shape.
      const diagnostics = (window as DiagWindow).__THREE_GAME_DIAGNOSTICS__;
      if (!diagnostics) {
        throw new Error("The QA diagnostics hook is absent.");
      }
      return {
        now: performance.now(),
        snapshot: diagnostics.snapshot(),
        state: diagnostics.state,
        visibility: document.visibilityState,
        userAgent: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
      };
    });
    if (end.visibility !== "visible") {
      throw new Error("The page was not visible at the snapshot.");
    }
    const { result } = end.state;
    if (!result) {
      throw new Error("The Battle has no result.");
    }
    const measured = end.now - reset.at;
    const meta = {
      measuredAt: new Date().toISOString(),
      device,
      host,
      build: buildInfo,
      browser: { version: browser.version(), channel: "chrome", headed: true },
      scene: {
        scenario: scenario.id,
        stage: scenario.stage,
        seed: 4,
        deck,
        speed: 1,
        skip: false,
        input: "real mouse input",
        warmUpDiscardedMs: 3000,
      },
      viewport: reset.viewport,
      measuredDurationMs: Math.round(measured),
      turns,
      result,
      page: {
        userAgent: end.userAgent,
        hardwareConcurrency: end.hardwareConcurrency,
        visibility: end.visibility,
      },
      consoleErrors,
    };
    log(
      `  ${scenario.id} run ${runIndex}: ${end.snapshot.frames.meanFps} fps mean, ` +
        `p95 ${end.snapshot.frames.p95} ms, ${end.snapshot.drawCalls.max} draw calls, ` +
        `${measured / 1000} s, ${turns} Turns, ${result.winner} by ${result.reason}`
    );
    return { meta, snapshot: end.snapshot };
  } finally {
    await page.close().catch(() => null);
    if (!remote) {
      await context.close();
    }
  }
};

const main = async () => {
  if (!Number.isInteger(runs) || runs < 1) {
    throw new Error("--runs must be a positive integer.");
  }
  const selected = only
    ? SCENARIOS.filter((scenario) => scenario.id === only)
    : SCENARIOS;
  if (selected.length === 0) {
    throw new Error(`Unknown --scenario: ${only}. Use baseline or strict.`);
  }
  const buildInfo = commit();
  const host = hardware();
  log(`Host: ${host.model} ${host.cpu} (${host.os}, ${host.arch})`);
  log(
    `Power: ${host.powerSource}${host.lowPowerMode ? ", low power mode" : ""}`
  );

  let output: string | null = null;
  let appUrl = providedUrl;
  let stopOrigin: (() => Promise<void>) | null = null;
  let browser: Browser | null = null;
  try {
    if (!skipBuild) {
      ({ output, appUrl } = await build());
    }
    if (!appUrl) {
      throw new Error("No app URL. Pass --url or allow the runner to build.");
    }
    stopOrigin = output ? await startOrigin(output, appUrl) : null;
    await mkdir(artifactDir, { recursive: true });
    browser = cdp
      ? await chromium.connectOverCDP(cdp, { timeout: 30_000 })
      : await chromium.launch({
          channel: "chrome",
          headless: false,
          args: [
            "--window-size=1440,900",
            "--window-position=0,0",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-features=CalculateNativeWinOcclusion",
            "--autoplay-policy=no-user-gesture-required",
          ],
        });
    const stamp = new Date().toISOString().slice(0, 10);
    for (let index = 1; index <= runs; index += 1) {
      for (const scenario of selected) {
        const result = await runBattle(
          browser,
          scenario,
          index,
          appUrl,
          host,
          buildInfo,
          Boolean(cdp)
        );
        const file = path.join(
          artifactDir,
          `${stamp}-${device}-${scenario.id}-run-${index}.json`
        );
        await writeFile(
          file,
          `${JSON.stringify({ meta: result.meta, snapshot: result.snapshot }, null, 2)}\n`
        );
        log(`  Wrote ${path.relative(repoRoot, file)}`);
      }
    }
  } finally {
    try {
      await browser?.close();
      await stopOrigin?.();
    } catch (error) {
      log(`Cleanup error: ${String(error)}`);
    }
  }
};

await main();
