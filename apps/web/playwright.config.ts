import { defineConfig, devices } from "@playwright/test";

// Overridable so a worktree can run E2E while the main checkout holds :4000.
const port = Number(process.env.PW_PORT ?? 4000);
const baseURL = `http://localhost:${port}`;
/**
 * The browser matrix runs only the tests that carry this tag. The
 * full suite stays on the default `chromium` project, so the full suite does
 * not run on six engines.
 */
const BROWSER_MATRIX_TAG = /@browser-matrix/u;
/** The game asks for landscape on a phone, so its mobile rows use this viewport. */
const phone = { width: 844, height: 390 };
/** A Pixel 7 profile with the landscape viewport that the game asks for. */
const pixel7Landscape = {
  ...devices["Pixel 7"],
  viewport: phone,
  screen: phone,
};
/** An iPhone 15 profile with the landscape viewport that the game asks for. */
const iphone15Landscape = {
  ...devices["iPhone 15"],
  viewport: phone,
  screen: phone,
};
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  // Timeout for each test in milliseconds.
  timeout: 20 * 1000,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  outputDir: "playwright-test-results",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Reduce animation motion from frammer motion. See https://motion.dev/docs/react-accessibility */
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  /* Capture git info in trace viewer and report */
  captureGitInfo: { commit: true, diff: true },
  /* Configure projects for major browsers */
  projects: [
    {
      // The full suite. The matrix has its own projects below.
      name: "chromium",
      grepInvert: BROWSER_MATRIX_TAG,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      // The branded Chrome channel, not Playwright Chromium.
      name: "chrome",
      grep: BROWSER_MATRIX_TAG,
      metadata: { browser: "Chrome", display: "desktop", emulated: false },
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    {
      // The branded Edge channel, not Playwright Chromium.
      name: "edge",
      grep: BROWSER_MATRIX_TAG,
      metadata: { browser: "Edge", display: "desktop", emulated: false },
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
      },
    },
    {
      name: "firefox",
      grep: BROWSER_MATRIX_TAG,
      metadata: { browser: "Firefox", display: "desktop", emulated: false },
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      // Playwright WebKit is the Safari engine. It is not Safari itself.
      name: "webkit",
      grep: BROWSER_MATRIX_TAG,
      metadata: { browser: "Safari", display: "desktop", emulated: false },
      use: {
        ...devices["Desktop Safari"],
      },
    },
    {
      // Chrome on Android, emulated with the Chromium engine.
      name: "chrome-android",
      grep: BROWSER_MATRIX_TAG,
      metadata: {
        browser: "Chrome Android",
        display: "mobile",
        emulated: true,
      },
      use: pixel7Landscape,
    },
    {
      // Edge on Android, emulated with the branded Edge binary.
      name: "edge-android",
      grep: BROWSER_MATRIX_TAG,
      metadata: { browser: "Edge Android", display: "mobile", emulated: true },
      use: {
        ...pixel7Landscape,
        channel: "msedge",
      },
    },
    {
      // Safari on iOS, emulated with the WebKit engine. It is not Safari on
      // an iOS device.
      name: "safari-ios",
      grep: BROWSER_MATRIX_TAG,
      metadata: { browser: "Safari iOS", display: "mobile", emulated: true },
      use: iphone15Landscape,
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    timeout: 5 * 60 * 1000, // default is 60s
    // Skip portless: bind localhost, match Playwright baseURL, hide TanStack Devtools.
    env: {
      VITE_E2E: "true",
      VITE_APP_URL: baseURL,
    },
    url: baseURL,
    // CI: build + preview on :port. Local: vite dev on :port (not `bun dev` / portless).
    command: process.env.CI
      ? `bun run build && bunx vite preview --port ${port} --strictPort`
      : `bunx vite --port ${port} --strictPort`,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
