/* oxlint-disable eslint/no-await-in-loop, react-doctor/server-sequential-independent-await -- browser runs and input must run in sequence */
/* oxlint-disable unicorn/consistent-function-scoping -- `armProbe` runs in the page, so it must carry its helpers */
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer as createHttpServer, request } from "node:http";
import type { IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { cpus, loadavg, platform, release } from "node:os";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";
import type { Browser, BrowserContext, Page } from "@playwright/test";

/**
 * Measures the Deck dialog of a production build that exists on disk: one tap
 * on the Town Bar Deck shortcut until the Card Pool art shows. Each run starts
 * in a new browser context with an empty cache. It measures the first open,
 * the second open, an open after a reload, a scroll to the end of the Card
 * Pool, and a change of the Kind filter.
 *
 * bun scripts/measure-deck-open.ts --label=before --output=.output \
 *   --out=artifacts/performance/deck-open
 *
 * The runner does not build the app, so two builds can run under the same
 * conditions, one after the other.
 */

const timeout = 120_000;
/** The art of the open Card Pool must show in this time. */
const SETTLE_MS = 30_000;
/** The runner stops to count image bytes at this time after the tap. */
const QUIET_CAP_MS = 25_000;
/** No image traffic for this time means that the page asks for no more art. */
const QUIET_MS = 1500;
/** The time of the book animation (`deck-cover` in globals.css). */
const BOOK_MS = 720;

interface Profile {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  readonly touch: boolean;
  readonly cpuSlowdown: number;
  /** Bytes per second down. `null`: the link adds no limit. */
  readonly downBytes: number | null;
  readonly latencyMs: number;
}

/** The first of these is the phone of `measure:first-load` (ADR-0014). */
const PROFILES: readonly Profile[] = [
  {
    id: "phone-slow-4g",
    width: 915,
    height: 412,
    dpr: 2,
    touch: true,
    cpuSlowdown: 4,
    downBytes: 200_000,
    latencyMs: 150,
  },
  {
    id: "desktop-broadband",
    width: 1440,
    height: 900,
    dpr: 2,
    touch: false,
    cpuSlowdown: 1,
    downBytes: 5_000_000,
    latencyMs: 20,
  },
];

interface Span {
  readonly start: number;
  readonly duration: number;
}
interface Probe {
  tapAt: number | null;
  dialogAt: number | null;
  tileAt: number | null;
  firstArtAt: number | null;
  artAt: number | null;
  frames: number[];
  longTasks: Span[];
  events: (Span & { name: string })[];
  stopped: boolean;
  blankFrames: number;
  tileFrames: number;
}
declare global {
  interface Window {
    __deckProbe?: Probe;
    __deckStopProbe?: () => void;
  }
}

/** The numbers of one measured step. All times start at the tap. */
interface Step {
  dialogMs: number | null;
  /** The frame after the dialog came into the DOM: it has been painted. */
  dialogPaintMs: number | null;
  tileMs: number | null;
  firstArtMs: number | null;
  artMs: number | null;
  longestTaskMs: number;
  blockingMs: number;
  longTasks: number;
  worstFrameMs: number;
  framesOver50Ms: number;
  bookFrames: number;
  inputMs: number | null;
  taskMs: number;
  scriptMs: number;
  layoutMs: number;
  styleMs: number;
  imageBytes: number;
  imageRequests: number;
  scriptBytes: number;
  capped: boolean;
  dialogNodes: number;
  dialogSvgs: number;
  poolImages: number;
  decodedImageBytes: number;
  blankTileFrames: number;
  tileFrames: number;
  scrollMs: number | null;
}

/** Installs the observers in the page. A trusted tap sets the zero of the clock. */
const armProbe = () => {
  const run: Probe = {
    tapAt: null,
    dialogAt: null,
    tileAt: null,
    firstArtAt: null,
    artAt: null,
    frames: [],
    longTasks: [],
    events: [],
    stopped: false,
    blankFrames: 0,
    tileFrames: 0,
  };
  window.__deckProbe = run;
  window.addEventListener(
    "pointerup",
    (event) => {
      if (event.isTrusted && run.tapAt === null) {
        run.tapAt = event.timeStamp;
      }
    },
    { capture: true }
  );
  const long = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      run.longTasks.push({ start: entry.startTime, duration: entry.duration });
    }
  });
  long.observe({ type: "longtask" });
  const events = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      run.events.push({
        name: entry.name,
        start: entry.startTime,
        duration: entry.duration,
      });
    }
  });
  // SAFETY: Chromium reads `durationThreshold`; the DOM types do not have it yet.
  events.observe({
    type: "event",
    durationThreshold: 16,
  } as PerformanceObserverInit);

  /** The tiles in the Card Pool window, and the ones with their art on the screen. */
  const artInView = () => {
    const pool = document.querySelector('[data-testid="deck-pool"]');
    if (!pool) {
      return null;
    }
    const box = pool.getBoundingClientRect();
    let tiles = 0;
    let ready = 0;
    let started = 0;
    for (const tile of pool.querySelectorAll('button[data-testid^="pool-"]')) {
      const place = tile.getBoundingClientRect();
      if (place.bottom > box.top && place.top < box.bottom) {
        tiles += 1;
        // Only class reads: `getComputedStyle` forces the style work that this
        // runner measures.
        const img = tile.querySelector("img");
        if (img?.complete && img.naturalWidth > 0) {
          started += 1;
          if (img.classList.contains("opacity-100")) {
            ready += 1;
          }
        }
      }
    }
    return { tiles, ready, started };
  };

  const tick = (now: number) => {
    if (run.stopped) {
      return;
    }
    run.frames.push(now);
    if (run.tapAt !== null) {
      const dialog = document.querySelector('[data-testid="deck-dialog"]');
      if (run.dialogAt === null && dialog) {
        run.dialogAt = now;
      }
      const seen = dialog ? artInView() : null;
      if (seen && seen.tiles > 0) {
        run.tileAt ??= now;
        run.tileFrames += seen.tiles;
        run.blankFrames += seen.tiles - seen.ready;
        if (run.firstArtAt === null && seen.started > 0) {
          run.firstArtAt = now;
        }
        if (seen.ready === seen.tiles) {
          run.artAt ??= now;
        } else {
          run.artAt = null;
        }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__deckStopProbe = () => {
    run.stopped = true;
    long.disconnect();
    events.disconnect();
  };
};

const readDialog = () => {
  const dialog = document.querySelector('[data-testid="deck-dialog"]');
  const images = [
    ...document.querySelectorAll<HTMLImageElement>(
      '[data-testid="deck-pool"] img'
    ),
  ].filter((img) => img.complete && img.naturalWidth > 0);
  return {
    dialogNodes: dialog?.querySelectorAll("*").length ?? 0,
    dialogSvgs: dialog?.querySelectorAll("svg").length ?? 0,
    poolImages: images.length,
    decodedImageBytes: images.reduce(
      (sum, img) => sum + img.naturalWidth * img.naturalHeight * 4,
      0
    ),
  };
};

/** One shared link. It counts the bytes of page and Service Worker traffic. */
const startOrigin = async (
  port: number,
  upstreamPort: number,
  profile: Profile
) => {
  let availableAt = performance.now();
  const counts = { imageBytes: 0, imageRequests: 0, scriptBytes: 0, lastAt: 0 };
  const take = async (bytes: number) => {
    if (profile.downBytes === null) {
      return;
    }
    availableAt =
      Math.max(availableAt, performance.now()) +
      (bytes * 1000) / profile.downBytes;
    await delay(Math.max(0, availableAt - performance.now()));
  };
  const server = createHttpServer(async (incoming, outgoing) => {
    const url = incoming.url ?? "";
    const image = /\.webp(?:\?|$)/u.test(url);
    const script = /\.js(?:\?|$)/u.test(url);
    const upstream = request({
      hostname: "127.0.0.1",
      port: upstreamPort,
      path: url,
      method: incoming.method,
      headers: incoming.headers,
    });
    outgoing.on("close", () => upstream.destroy());
    const receiving = once(upstream, "response");
    try {
      incoming.pipe(upstream);
      const [received] = await receiving;
      // SAFETY: node:http emits IncomingMessage for the response event.
      const response = received as IncomingMessage;
      await delay(profile.latencyMs);
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      if (image) {
        counts.imageRequests += 1;
      }
      for await (const chunk of response) {
        if (!Buffer.isBuffer(chunk)) {
          throw new TypeError("The origin received a non-binary response.");
        }
        for (let offset = 0; offset < chunk.byteLength; offset += 1500) {
          const packet = chunk.subarray(offset, offset + 1500);
          await take(packet.byteLength);
          if (outgoing.destroyed) {
            return;
          }
          if (image) {
            counts.imageBytes += packet.byteLength;
            counts.lastAt = performance.now();
          } else if (script) {
            counts.scriptBytes += packet.byteLength;
          }
          if (!outgoing.write(packet)) {
            await once(outgoing, "drain");
          }
        }
      }
      outgoing.end();
    } catch (error) {
      upstream.destroy();
      outgoing.destroy(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  });
  const listening = once(server, "listening");
  server.listen(port, "127.0.0.1");
  await listening;
  return {
    counts,
    reset: () => {
      counts.imageBytes = 0;
      counts.imageRequests = 0;
      counts.scriptBytes = 0;
      counts.lastAt = performance.now();
    },
    stop: async () => {
      const closed = once(server, "close");
      server.closeAllConnections();
      server.close();
      await closed;
    },
  };
};

type Origin = Awaited<ReturnType<typeof startOrigin>>;

const metricsOf = async (
  cdp: Awaited<ReturnType<BrowserContext["newCDPSession"]>>
) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const read = (name: string) =>
    (metrics.find((metric) => metric.name === name)?.value ?? 0) * 1000;
  return {
    taskMs: read("TaskDuration"),
    scriptMs: read("ScriptDuration"),
    layoutMs: read("LayoutDuration"),
    styleMs: read("RecalcStyleDuration"),
  };
};

const tapAt = async (page: Page, testId: string, profile: Profile) => {
  const box = await page.getByTestId(testId).boundingBox();
  if (!box) {
    throw new Error(`${testId} has no tap position.`);
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await (profile.touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
};

const waitForQuiet = async (origin: Origin) => {
  const started = performance.now();
  while (performance.now() - started < QUIET_CAP_MS) {
    if (performance.now() - origin.counts.lastAt >= QUIET_MS) {
      return false;
    }
    await delay(100);
  }
  return true;
};

/** Reads the probe, and turns its page clock into times after the tap. */
const closeStep = async (
  page: Page,
  origin: Origin,
  before: Awaited<ReturnType<typeof metricsOf>>,
  after: Awaited<ReturnType<typeof metricsOf>>,
  capped: boolean,
  scrollMs: number | null
): Promise<Step> => {
  const probe = await page.evaluate(() => {
    window.__deckStopProbe?.();
    return window.__deckProbe;
  });
  if (!probe || probe.tapAt === null) {
    throw new Error("The browser did not receive a trusted tap.");
  }
  const start = probe.tapAt;
  const since = (at: number | null) => (at === null ? null : at - start);
  const tasks = probe.longTasks.filter(
    (task) => task.start + task.duration >= start
  );
  const frames = probe.frames.filter((frame) => frame >= start);
  const gaps = frames.slice(1).map((frame, index) => {
    const previous = frames[index];
    return previous === undefined ? 0 : frame - previous;
  });
  const dialogAt = probe.dialogAt ?? start;
  const input = probe.events.filter(
    (event) => event.name === "click" || event.name === "pointerup"
  );
  return {
    dialogMs: since(probe.dialogAt),
    dialogPaintMs: since(frames.find((frame) => frame > dialogAt) ?? null),
    tileMs: since(probe.tileAt),
    firstArtMs: since(probe.firstArtAt),
    artMs: since(probe.artAt),
    longestTaskMs: Math.max(0, ...tasks.map((task) => task.duration)),
    blockingMs: tasks.reduce(
      (sum, task) => sum + Math.max(0, task.duration - 50),
      0
    ),
    longTasks: tasks.length,
    worstFrameMs: Math.max(0, ...gaps),
    framesOver50Ms: gaps.filter((gap) => gap > 50).length,
    bookFrames: frames.filter(
      (frame) => frame >= dialogAt && frame <= dialogAt + BOOK_MS
    ).length,
    inputMs: input.length
      ? Math.max(...input.map((event) => event.duration))
      : null,
    taskMs: after.taskMs - before.taskMs,
    scriptMs: after.scriptMs - before.scriptMs,
    layoutMs: after.layoutMs - before.layoutMs,
    styleMs: after.styleMs - before.styleMs,
    imageBytes: origin.counts.imageBytes,
    imageRequests: origin.counts.imageRequests,
    scriptBytes: origin.counts.scriptBytes,
    capped,
    ...(await page.evaluate(readDialog)),
    blankTileFrames: probe.blankFrames,
    tileFrames: probe.tileFrames,
    scrollMs,
  };
};

interface RunContext {
  readonly page: Page;
  readonly cdp: Awaited<ReturnType<BrowserContext["newCDPSession"]>>;
  readonly origin: Origin;
  readonly profile: Profile;
}

const measureOpen = async ({ page, cdp, origin, profile }: RunContext) => {
  await page.evaluate(armProbe);
  await delay(300);
  origin.reset();
  const before = await metricsOf(cdp);
  await tapAt(page, "town-shortcut-deck", profile);
  await page.waitForFunction(
    () => window.__deckProbe?.artAt !== null,
    undefined,
    { timeout: SETTLE_MS }
  );
  await delay(200);
  const after = await metricsOf(cdp);
  const capped = await waitForQuiet(origin);
  return closeStep(page, origin, before, after, capped, null);
};

/** A real scroll gesture from the top of the Card Pool to its end. */
const measureScroll = async ({ page, cdp, origin, profile }: RunContext) => {
  const pool = page.getByTestId("deck-pool");
  const box = await pool.boundingBox();
  if (!box) {
    throw new Error("The Card Pool has no position.");
  }
  await page.evaluate(armProbe);
  await delay(200);
  origin.reset();
  const before = await metricsOf(cdp);
  await page.evaluate(() => {
    const probe = window.__deckProbe;
    if (probe) {
      probe.tapAt = performance.now();
    }
  });
  const distance = await pool.evaluate(
    (element) => element.scrollHeight - element.clientHeight
  );
  const started = performance.now();
  await cdp.send("Input.synthesizeScrollGesture", {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    yDistance: -distance,
    speed: 1600,
    gestureSourceType: profile.touch ? "touch" : "mouse",
  });
  const scrollMs = performance.now() - started;
  await page.waitForFunction(
    () => window.__deckProbe?.artAt !== null,
    undefined,
    { timeout: SETTLE_MS }
  );
  const after = await metricsOf(cdp);
  const capped = await waitForQuiet(origin);
  return closeStep(page, origin, before, after, capped, scrollMs);
};

/** One press on a Kind filter: the pool shows the Creature Cards from the top. */
const measureFilter = async ({ page, cdp, origin, profile }: RunContext) => {
  await page.getByTestId("deck-pool").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.evaluate(armProbe);
  await delay(200);
  origin.reset();
  const before = await metricsOf(cdp);
  await tapAt(page, "pool-filter-creature", profile);
  await page.waitForFunction(
    () => window.__deckProbe?.artAt !== null,
    undefined,
    { timeout: SETTLE_MS }
  );
  await delay(200);
  const after = await metricsOf(cdp);
  return closeStep(page, origin, before, after, false, null);
};

const waitForTown = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "commit", timeout });
  await page.getByTestId("town").waitFor({ state: "visible", timeout });
  await page
    .getByTestId("town-shortcut-deck")
    .waitFor({ state: "visible", timeout });
};

/** The Town art and the precache must end, or their traffic joins the numbers. */
const waitForRest = async (page: Page, origin: Origin) => {
  await page
    .waitForFunction(
      async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.active?.state === "activated";
      },
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => null);
  await page.waitForLoadState("networkidle", { timeout }).catch(() => null);
  await waitForQuiet(origin);
};

const closeDialog = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.getByTestId("deck-dialog").waitFor({ state: "hidden", timeout });
  await delay(700);
};

const contextFor = (browser: Browser, profile: Profile, video?: string) => {
  const size = { width: profile.width, height: profile.height };
  return browser.newContext({
    viewport: size,
    screen: size,
    deviceScaleFactor: profile.dpr,
    isMobile: profile.touch,
    hasTouch: profile.touch,
    locale: "en-US",
    serviceWorkers: "allow",
    recordVideo: video === undefined ? undefined : { dir: video, size },
  });
};

const measureRun = async (
  browser: Browser,
  origin: Origin,
  profile: Profile,
  url: string
) => {
  const context = await contextFor(browser, profile);
  try {
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.clearBrowserCache");
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: profile.cpuSlowdown,
    });
    const run = { page, cdp, origin, profile };
    await waitForTown(page, url);
    await waitForRest(page, origin);
    const firstOpen = await measureOpen(run);
    const scroll = await measureScroll(run);
    const filter = await measureFilter(run);
    await closeDialog(page);
    const secondOpen = await measureOpen(run);
    await closeDialog(page);
    await waitForTown(page, url);
    await waitForRest(page, origin);
    const reloadOpen = await measureOpen(run);
    return { firstOpen, scroll, filter, secondOpen, reloadOpen };
  } finally {
    await context.close();
  }
};

/** A film of the first open, for the eye. Its numbers are not in the record. */
const recordFilm = async (
  browser: Browser,
  origin: Origin,
  profile: Profile,
  url: string,
  dir: string
) => {
  const context = await contextFor(browser, profile, dir);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: profile.cpuSlowdown,
  });
  await waitForTown(page, url);
  await waitForRest(page, origin);
  await measureOpen({ page, cdp, origin, profile });
  await delay(500);
  const video = page.video();
  await context.close();
  return video?.path();
};

const availablePort = async () => {
  const server = createHttpServer();
  const listening = once(server, "listening");
  server.listen(0, "127.0.0.1");
  await listening;
  // SAFETY: listening on an IP address gives AddressInfo, never a pipe name.
  const address = server.address() as AddressInfo;
  const closed = once(server, "close");
  server.close();
  await closed;
  return address.port;
};

const startApp = async (output: string, env: NodeJS.ProcessEnv) => {
  const port = Number(env["NITRO_PORT"]);
  const app = spawn("node", [path.join(output, "server/index.mjs")], {
    cwd: path.dirname(output),
    env,
    stdio: "inherit",
  });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (app.exitCode !== null) {
      throw new Error(`Production server exited with ${app.exitCode}.`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        return app;
      }
    } catch {
      // The server is not ready yet.
    }
    await delay(100);
  }
  throw new Error("Production server did not start.");
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      label: { type: "string" },
      output: { type: "string", default: ".output" },
      out: { type: "string", default: "artifacts/performance/deck-open" },
      runs: { type: "string", default: "5" },
      film: { type: "boolean", default: false },
      profile: { type: "string" },
      /** The installed Chrome in a window, on the real GPU. */
      headed: { type: "boolean", default: false },
    },
  });
  if (!values.label) {
    throw new Error("--label is necessary.");
  }
  const output = path.resolve(values.output);
  const out = path.resolve(values.out);
  await mkdir(out, { recursive: true });
  const runs = Number(values.runs);
  const profiles = PROFILES.filter(
    (profile) => !values.profile || profile.id === values.profile
  );
  const upstreamPort = await availablePort();
  const app = await startApp(output, {
    ...process.env,
    NITRO_HOST: "127.0.0.1",
    NITRO_PORT: String(upstreamPort),
  });
  const browser = await chromium.launch(
    values.headed ? { headless: false, channel: "chrome" } : { headless: true }
  );
  try {
    for (const profile of profiles) {
      const port = await availablePort();
      const url = `http://127.0.0.1:${port}/play`;
      const origin = await startOrigin(port, upstreamPort, profile);
      try {
        const results = [];
        for (let run = 0; run < runs; run += 1) {
          console.log(`${values.label} ${profile.id} run ${run + 1}/${runs}`);
          results.push(await measureRun(browser, origin, profile, url));
        }
        const film = values.film
          ? await recordFilm(browser, origin, profile, url, out)
          : undefined;
        await writeFile(
          path.join(out, `${values.label}-${profile.id}.json`),
          `${JSON.stringify(
            {
              label: values.label,
              date: new Date().toISOString(),
              profile,
              browser: `${browser.version()}, ${values.headed ? "Chrome, headed, real GPU" : "Chromium, headless"}`,
              host: `${platform()} ${release()}, ${cpus().length} CPUs`,
              loadAverage: loadavg(),
              film,
              results,
            },
            null,
            2
          )}\n`
        );
      } finally {
        await origin.stop();
      }
    }
  } finally {
    await browser.close();
    app.kill("SIGTERM");
  }
};

await main();
