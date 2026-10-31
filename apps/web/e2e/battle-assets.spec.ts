import { expect, test } from "./_base";

const FX = "/battle/fx-atlas.webp";
const PAINTING = "/battle/hearthvale.webp";

// The failed Unit Model test answers this file with 404 on purpose.
test.use({ expectedHttpErrors: [/\/models\/units\/warden-saelith\.glb$/u] });

test("Stage Panel preloads painting and FX; Fight reuses the FX image", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const requested: string[] = [];
  page.on("request", (request) =>
    requested.push(new URL(request.url()).pathname)
  );
  await page.goto("/play?state=campaign-progress");
  await expect(page.getByTestId("stage-1-10")).toBeVisible({ timeout: 30_000 });
  expect(requested).not.toContain(FX);
  expect(requested).not.toContain(PAINTING);
  await page.getByTestId("stage-1-10").click();
  await expect(page.getByTestId("stage-panel")).toBeVisible();
  await expect.poll(() => requested.filter((url) => url === FX).length).toBe(1);
  await expect.poll(() => requested.includes(PAINTING)).toBe(true);
  await page.getByTestId("start-battle").click();
  await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(() => requested.some((url) => url.startsWith("/models/units/")))
    .toBe(true);
  await expect(page.getByTestId("end-turn")).toBeEnabled({ timeout: 15_000 });
  expect(requested.filter((url) => url === FX)).toHaveLength(1);
  const maxTexture = await page
    .locator("[data-battle-canvas] canvas")
    .evaluate((element) => {
      // SAFETY: the locator selects the Battle canvas, which the renderer creates as an HTMLCanvasElement.
      const canvas = element as HTMLCanvasElement;
      const gl = canvas.getContext("webgl2");
      // SAFETY: `MAX_TEXTURE_SIZE` is a number parameter on every WebGL2 context; a null context gives undefined.
      return gl?.getParameter(gl.MAX_TEXTURE_SIZE) as number | undefined;
    });
  expect(maxTexture).toBeGreaterThanOrEqual(2048);
});

test("a failed Unit Model blocks the Battle and offers a retry", async ({
  page,
}) => {
  test.setTimeout(60_000);
  let failedRequests = 0;
  await page.route("**/models/units/warden-saelith.glb", async (route) => {
    failedRequests += 1;
    await route.fulfill({ status: 404, body: "model unavailable" });
  });
  await page.goto("/play?state=unit-model&seed=7");
  await expect(
    page.getByText("The Battle could not load every Unit Model.")
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect.poll(() => failedRequests).toBeGreaterThan(0);
  const retry = page.getByRole("button", { name: "Load again", exact: true });
  await expect(retry).toBeVisible();
  const before = failedRequests;
  await retry.click();
  await expect.poll(() => failedRequests).toBeGreaterThan(before);
  await expect(
    page.getByText("The Battle could not load every Unit Model.")
  ).toBeVisible();
});

test("optimized Battle tracks decode as stereo and play in the browser", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/play");
  const result = await page.evaluate(async () => {
    const context = new AudioContext();
    const tracks = [
      "region-1.ogg",
      "region-2.ogg",
      "region-3.ogg",
      "region-4.mp3",
      "region-5.mp3",
      "boss.ogg",
      "heynspire.ogg",
      "dungeons.ogg",
    ];
    try {
      const results = await Promise.all(
        tracks.map(async (file) => {
          const response = await fetch(`/music/${file}`);
          const buffer = await context.decodeAudioData(
            await response.arrayBuffer()
          );
          return {
            file,
            channels: buffer.numberOfChannels,
            duration: buffer.duration,
            frames: buffer.length,
          };
        })
      );
      const audio = new Audio("/music/boss.ogg");
      audio.loop = true;
      audio.muted = true;
      await audio.play();
      const playing = !audio.paused && audio.loop;
      audio.pause();
      return { tracks: results, playing };
    } finally {
      await context.close();
    }
  });
  expect(result.playing).toBe(true);
  expect(result.tracks).toHaveLength(8);
  for (const track of result.tracks) {
    expect(track.channels).toBe(2);
    expect(track.duration).toBeGreaterThan(10);
    expect(track.frames).toBeGreaterThan(0);
  }
});

test("the Battle Board fits a landscape phone viewport", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/play?state=active-play&seed=7");
  await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("end-turn")).toBeInViewport();
  await page.screenshot({ path: "../../artifacts/battle-models-phone.png" });
});
