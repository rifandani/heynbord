/* oxlint-disable eslint/no-await-in-loop -- cold runs and browser input must run in sequence */
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, rm, writeFile } from "node:fs/promises";
import { createServer as createHttpServer, request } from "node:http";
import type { IncomingMessage } from "node:http";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { platform, release } from "node:os";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";

import { chromium } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";

const webRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const recordPath = path.join(repoRoot, "docs/game/22-performance.md");
const section = "## First load (NFR-02)";
const budget = 500_000;
const timeout = 120_000;

/** The measured phone: a 412×915 Android held sideways (ADR-0014). */
const device = {
  cpuSlowdown: 4,
  dpr: 2,
  height: 412,
  orientation: "landscape",
  width: 915,
} as const;
interface Tap {
  at: number;
  dialogMs: number | null;
  target: string;
}
declare global {
  interface Window {
    __firstLoadTap?: Tap;
    __workerReadyAt?: number;
  }
}
interface Run {
  tap: Tap;
  scripts: { url: string; encodedBytes: number }[];
  worker: {
    readyAt: number | null;
    observedAt: number;
    bytes: number;
    entries: number;
    state: string;
  };
}

/** Observe real input and the first visible dialog frame, on the page clock. */
const installProbe = () => {
  const state = window;
  const workerReady = async () => {
    try {
      await navigator.serviceWorker.ready;
      state.__workerReadyAt = performance.now();
    } catch (error) {
      console.error(error);
    }
  };
  workerReady();
  window.addEventListener(
    "pointerup",
    (event) => {
      if (!event.isTrusted || state.__firstLoadTap) {
        return;
      }
      const { target } = event;
      const settings =
        target instanceof Element
          ? target.closest('[data-testid="town-settings"]')
          : null;
      const tap: Tap = {
        at: event.timeStamp,
        dialogMs: null,
        target: settings
          ? "town-settings"
          : target instanceof Element
            ? (target.textContent?.trim().slice(0, 100) ?? target.tagName)
            : "unknown",
      };
      state.__firstLoadTap = tap;
      const check = () => {
        const dialog = document.querySelector(
          '[data-testid="settings-dialog"]'
        );
        if (
          settings &&
          dialog instanceof HTMLElement &&
          dialog.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          })
        ) {
          tap.dialogMs = performance.now() - tap.at;
        } else if (performance.now() - tap.at < 1000) {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    },
    { capture: true }
  );
};

const measureTap = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "commit", timeout });
  await page.getByTestId("town").waitFor({ state: "visible", timeout });
  const button = page.getByTestId("town-settings");
  await button.waitFor({ state: "visible", timeout });
  const box = await button.boundingBox();
  if (!box) {
    throw new Error("The Town Settings control has no tap position.");
  }
  // Do not force a locator tap: an overlay must be allowed to block this input.
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(
    () => {
      const tap = window.__firstLoadTap;
      return (
        tap && (tap.dialogMs !== null || performance.now() - tap.at >= 1000)
      );
    },
    undefined,
    { timeout }
  );
  return page.evaluate(() => {
    const tap = window.__firstLoadTap;
    if (!tap) {
      throw new Error("The browser did not receive a trusted tap.");
    }
    const scripts: Run["scripts"] = [];
    for (const entry of performance.getEntriesByType("resource")) {
      const scriptPath = new URL(entry.name).pathname;
      if (
        entry instanceof PerformanceResourceTiming &&
        scriptPath.startsWith("/assets/") &&
        scriptPath.endsWith(".js") &&
        entry.responseEnd <= tap.at
      ) {
        scripts.push({ url: scriptPath, encodedBytes: entry.encodedBodySize });
      }
    }
    return { tap, scripts };
  });
};

const workerRecord = async (page: Page) => {
  try {
    await page.waitForFunction(
      () => window.__workerReadyAt !== undefined,
      undefined,
      { timeout: 15_000 }
    );
  } catch (error) {
    if (!(error instanceof Error && error.name === "TimeoutError")) {
      throw error;
    }
    // A worker that does not activate is a measured outcome, not a runner
    // failure. Read its partial cache and preserve its state for Warm Load.
  }
  return page.evaluate(async () => {
    const keys = await caches.keys();
    const names = keys.filter((name) => name.startsWith("workbox-precache"));
    let bytes = 0;
    let entries = 0;
    for (const name of names) {
      const cache = await caches.open(name);
      for (const cachedRequest of await cache.keys()) {
        const response = await cache.match(cachedRequest);
        if (response) {
          const body = await response.arrayBuffer();
          bytes += body.byteLength;
          entries += 1;
        }
      }
    }
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      readyAt: window.__workerReadyAt ?? null,
      observedAt: performance.now(),
      bytes,
      entries,
      state:
        registration?.active?.state ??
        registration?.installing?.state ??
        "not registered",
    };
  });
};

const limiter = (bytesPerSecond: number) => {
  let availableAt = performance.now();
  return async (bytes: number) => {
    availableAt =
      Math.max(availableAt, performance.now()) +
      (bytes * 1000) / bytesPerSecond;
    await delay(Math.max(0, availableAt - performance.now()));
  };
};

/** One shared link for page and worker traffic, with no browser target hooks. */
const throttledOrigin = async (port: number, upstreamPort: number) => {
  const download = limiter(1_600_000 / 8);
  const upload = limiter(750_000 / 8);
  const server = createHttpServer(async (incoming, outgoing) => {
    const upstream = request({
      hostname: "127.0.0.1",
      port: upstreamPort,
      path: incoming.url,
      method: incoming.method,
      headers: incoming.headers,
    });
    outgoing.on("close", () => upstream.destroy());
    const receiving = once(upstream, "response");
    try {
      for await (const chunk of incoming) {
        if (!Buffer.isBuffer(chunk)) {
          throw new TypeError("The origin received a non-binary upload.");
        }
        await upload(chunk.byteLength);
        upstream.write(chunk);
      }
      upstream.end();
      const [received] = await receiving;
      // SAFETY: node:http emits IncomingMessage for the response event.
      const response = received as IncomingMessage;
      // Match CDP latency: minimum request-to-response-header time. Body
      // limits share one queue across all page and Service Worker requests.
      await delay(150);
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      for await (const chunk of response) {
        if (!Buffer.isBuffer(chunk)) {
          throw new TypeError("The origin received a non-binary response.");
        }
        for (let offset = 0; offset < chunk.byteLength; offset += 1500) {
          const packet = chunk.subarray(offset, offset + 1500);
          await download(packet.byteLength);
          if (outgoing.destroyed) {
            return;
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
  return async () => {
    const closed = once(server, "close");
    server.closeAllConnections();
    server.close();
    await closed;
  };
};

const coldRun = async (browser: Browser, url: string, warm: boolean) => {
  // The Portrait Guard covers the Town for a coarse pointer in portrait, so a
  // portrait tap cannot reach Settings. Measure the phone held sideways.
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    screen: { width: device.width, height: device.height },
    deviceScaleFactor: device.dpr,
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
    userAgent: `Mozilla/5.0 (Linux; Android 12; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Mobile Safari/537.36`,
    serviceWorkers: "allow",
  });
  try {
    await context.addInitScript(installProbe);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.clearBrowserCache");
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: device.cpuSlowdown,
    });
    const coldTap = await measureTap(page, url);
    const cold: Run = { ...coldTap, worker: await workerRecord(page) };
    let warmRun: Run | null = null;
    if (warm) {
      const warmTap = await measureTap(page, url);
      warmRun = { ...warmTap, worker: await workerRecord(page) };
    }
    return { cold, warm: warmRun };
  } finally {
    await context.close();
  }
};

const median = (values: number[]) => values.toSorted((a, b) => a - b)[1];
const ms = (value: number) => `${value.toFixed(1)} ms`;
const qualifies = (run: Run) =>
  run.tap.dialogMs !== null && run.tap.dialogMs <= 50;
const row = (label: string, run: Run) =>
  `| ${label} | ${ms(run.tap.at)} | ${run.tap.dialogMs === null ? "Did not open within 1000 ms" : ms(run.tap.dialogMs)} | ${qualifies(run) ? "PASS" : "FAIL"} | ${run.scripts.reduce((sum, script) => sum + script.encodedBytes, 0)} | ${run.worker.bytes} | ${run.worker.readyAt === null ? `Not ready by ${ms(run.worker.observedAt)} (${run.worker.state})` : ms(run.worker.readyAt)} |`;

/**
 * Inserts a new record after the existing ones under the First load section.
 * A rerun must not delete the record of an earlier build.
 */
const writeRecord = async (record: string) => {
  let current =
    "# Game performance\n\n## Frame rate (NFR-01)\n\nNo record yet.\n";
  try {
    current = await readFile(recordPath, "utf-8");
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOENT")
    ) {
      throw error;
    }
  }
  const start = current.indexOf(section);
  const end =
    start === -1 ? -1 : current.indexOf("\n## ", start + section.length);
  const boundary = end === -1 ? current.length : end;
  const next =
    start === -1
      ? `${current.trimEnd()}\n\n${record}\n`
      : `${current.slice(0, boundary).trimEnd()}\n\n${record.slice(section.length).trimStart()}\n${current.slice(boundary)}`;
  await writeFile(recordPath, next);
};

const availablePort = async () => {
  const server = createServer();
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

interface Bundle {
  url: string;
  raw: number;
  gzip: number;
  br: number;
}
interface RecordInput {
  runs: Run[];
  warmRun: Run;
  bundles: Bundle[];
  playUrl: string;
  origin: string;
  url: string;
  commit: string;
  dirty: string;
  browserVersion: string;
}
const renderRecord = ({
  runs,
  warmRun,
  bundles,
  playUrl,
  origin,
  url,
  commit,
  dirty,
  browserVersion,
}: RecordInput) => {
  const total = bundles.reduce(
    (sum, bundle) => ({
      raw: sum.raw + bundle.raw,
      gzip: sum.gzip + bundle.gzip,
      br: sum.br + bundle.br,
    }),
    { raw: 0, gzip: 0, br: 0 }
  );
  const tapMedian = median(runs.map((run) => run.tap.at));
  if (tapMedian === undefined) {
    throw new Error("Three cold runs are required.");
  }
  const valid = runs.every(qualifies);
  const pass = valid && tapMedian < 3000;
  return `${section}

### ${new Date().toISOString()} — ${pass ? "PASS" : "FAIL"}

- Command (repository root): \`bun web measure:first-load\`. This removes the previous production output, builds the app, starts a compressed Nitro production origin, runs Chromium, writes this section, and stops both processes. Install the existing browser first with \`bun web test:install\` if needed.
- Commit: \`${commit}\`. ${dirty ? "The build includes uncommitted changes (listed below); this is a working tree measurement." : "Clean working tree."}
- Browser: Chromium ${browserVersion}, headless; host: ${platform()} ${release()}.
- Device: emulated mid-range Android (Pixel 6a user agent), ${device.width}×${device.height} CSS pixels in ${device.orientation}, DPR ${device.dpr}, mobile touch, ${device.cpuSlowdown}× CPU slowdown. The Portrait Guard covers the Town for a coarse pointer in portrait, so the measured phone is held sideways.
- Network: Slow 4G, 1.6 Mbps down, 750 kbps up, 150 ms RTT, a local HTTP proxy adds 150 ms before response headers and limits response bodies to a shared 200,000 B/s download queue and request bodies to a shared 93,750 B/s upload queue. Both page and Service Worker traffic cross this origin. Headers and loopback overhead are extra; this is an emulated link.
- Origin: ${origin}; entry: ${url} (direct navigation).
- Cache: a new browser context and cleared HTTP cache for each cold run, with no prior storage or active Service Worker. New workers can install during the visit. Warm Load reuses the third context with its HTTP cache, storage and current Service Worker state. The worker status is recorded; an incomplete precache is not treated as ready.
- Input: one trusted touch at the Town Settings control center as soon as the Town and control are visible. An input listener records pointer-up time from navigation start. A frame observer records the first visible Settings dialog. No overlay is removed and no failed tap is retried.

| Run | Navigation to tap | Tap to visible dialog | ≤50 ms interaction | Page JavaScript encoded body bytes at tap | Precache decoded bytes | Navigation to SW ready |
| --- | ---: | --- | --- | ---: | ---: | ---: |
${runs.map((run, index) => row(`Cold ${index + 1}`, run)).join("\n")}
${row("Warm (context only)", warmRun)}

- Median of 3 cold tap times: **${ms(tapMedian)}**.
- Median qualified First Load: **${valid ? ms(tapMedian) : "not reached — the Settings interaction gate failed"}**. A tap time alone is not time to interactive.
- NFR-02 (less than 3000 ms and a Settings response of at most 50 ms): **${pass ? "PASS" : "FAIL"}**.${valid ? ` Measured First Load: ${ms(tapMedian)}.` : ` Observed tap targets: ${runs.map((run) => JSON.stringify(run.tap.target)).join(", ")}.`}
- First JavaScript: ${total.raw} bytes uncompressed; **${total.gzip} bytes gzip**; ${total.br} bytes brotli. Budget: less than 500,000 bytes gzip (500 KB, decimal): **${total.gzip < budget ? "PASS" : "FAIL"}**. This sums distinct page JavaScript resources completed by the tap, including module preloads; it excludes worker precache traffic. The bundle table lists their URLs.
- The set differs from the #139 bundle record above: that record counts the files that the \`/play\` HTML preloads; this runner counts the page JavaScript that completed before the tap, so a chunk that the HTML does not name can be included. The totals are not directly comparable.
- Compression check: \`${playUrl}\` returns \`content-encoding: gzip\` with \`Accept-Encoding: gzip\`. Page encoded body bytes use the encoding Chromium negotiated; gzip (level 9) and brotli sizes above are computed from the same built files.
- Service Worker precache: ${runs.map((run) => run.worker.entries).join(" / ")} entries in the cold runs. Bytes are decoded response bodies stored in Workbox precaches, not wire bytes. If activation does not finish within 15 seconds after the tap result, the runner records the observation time and partial cache. Time is navigation to \`navigator.serviceWorker.ready\`, including registration and installation. It is separate from the tap gate.
- Follow-up: the NFR-02 time and interaction failure is recorded here. Bundle reduction is outside this measurement.

<details>
<summary>Measured JavaScript files</summary>

| File | Uncompressed bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: |
${bundles.map((bundle) => `| \`${bundle.url}\` | ${bundle.raw} | ${bundle.gzip} | ${bundle.br} |`).join("\n")}

</details>
${dirty ? `\n<details>\n<summary>Working tree at build time</summary>\n\n\`\`\`text\n${dirty}\n\`\`\`\n\n</details>\n` : ""}`;
};

const main = async () => {
  const [port, upstreamPort] = await Promise.all([
    availablePort(),
    availablePort(),
  ]);
  const origin = `http://127.0.0.1:${port}`;
  const url = `${origin}/play`;
  const env = {
    ...process.env,
    PORTLESS_URL: "",
    VITE_APP_URL: origin,
    VITE_APP_TITLE: "Heynbord",
    NITRO_HOST: "127.0.0.1",
    NITRO_PORT: String(upstreamPort),
  };
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
  const dirty = execFileSync("git", ["status", "--short"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).trim();
  // A prior compressed Service Worker can contain old chunk hashes.
  // Remove generated output so each build starts with the current files.
  await rm(path.join(webRoot, ".output"), { recursive: true, force: true });
  execFileSync("bun", ["run", "build"], {
    cwd: webRoot,
    env,
    stdio: "inherit",
  });
  const server = spawn("node", [".output/server/index.mjs"], {
    cwd: webRoot,
    env,
    stdio: "inherit",
  });
  let browser: Browser | undefined;
  let stopOrigin: (() => Promise<void>) | undefined;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (server.exitCode !== null) {
        throw new Error(`Production server exited with ${server.exitCode}.`);
      }
      try {
        const response = await fetch(`http://127.0.0.1:${upstreamPort}`, {
          signal: AbortSignal.timeout(1000),
        });
        ready = response.ok;
      } catch {
        ready = false;
      }
      if (ready) {
        break;
      }
      await delay(100);
    }
    if (!ready) {
      throw new Error("Production server did not start.");
    }
    stopOrigin = await throttledOrigin(port, upstreamPort);
    browser = await chromium.launch({ headless: true });
    const runs: Run[] = [];
    let warmRun: Run | null = null;
    for (let index = 0; index < 3; index += 1) {
      console.log(`Measuring cold run ${index + 1}/3...`);
      const result = await coldRun(browser, url, index === 2);
      runs.push(result.cold);
      warmRun = result.warm;
    }
    if (!warmRun) {
      throw new Error("No Warm Load result.");
    }
    const scriptUrls = [
      ...new Set(
        runs.flatMap((run) => run.scripts.map((script) => script.url))
      ),
    ].toSorted();
    const bundles = [];
    for (const scriptUrl of scriptUrls) {
      const source = await readFile(
        path.join(webRoot, ".output/public", scriptUrl)
      );
      bundles.push({
        url: scriptUrl,
        raw: source.byteLength,
        gzip: gzipSync(source, { level: 9 }).byteLength,
        br: brotliCompressSync(source).byteLength,
      });
    }
    const play = bundles.find((bundle) => /\/play-/u.test(bundle.url));
    if (!play) {
      throw new Error("No Play chunk was measured.");
    }
    const response = await fetch(`${origin}${play.url}`, {
      headers: { "accept-encoding": "gzip" },
    });
    if (!response.ok || response.headers.get("content-encoding") !== "gzip") {
      throw new Error(
        "The production origin did not serve the Play chunk with gzip."
      );
    }
    const record = renderRecord({
      runs,
      warmRun,
      bundles,
      playUrl: play.url,
      origin,
      url,
      commit,
      dirty,
      browserVersion: browser.version(),
    });
    await writeRecord(record);
    console.log(record);
    // A measured NFR failure is a valid result. Exit nonzero only for runner errors.
  } finally {
    try {
      await browser?.close();
      await stopOrigin?.();
    } finally {
      server.kill("SIGTERM");
    }
  }
};

await main();
