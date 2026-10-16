import { expect, test } from "./_base";

/** Replay Links (issue #100, web ADR-0012): share a finished Battle and watch it. */
test.describe("Replay Link", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("a won Stage gives a Replay Link that plays to a result with no rewards", async ({
    page,
    context,
  }) => {
    // Two pages load the game, and the Replay steps through each Log Entry.
    test.setTimeout(90_000);
    await page.goto("/play?state=victory&seed=3");
    const result = page.getByTestId("battle-result");
    await expect(result).toBeVisible({ timeout: 30_000 });
    await result.getByTestId("share-replay").click();
    await expect(page.getByText("Replay Link copied.")).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toMatch(/\/play#replay=1\.[\w-]+$/u);

    const viewer = await context.newPage();
    await viewer.goto(link);
    // The link opens Watching a Replay at once: it Plays from the first Log Entry.
    await expect(viewer.getByTestId("replay-badge")).toBeVisible({
      timeout: 30_000,
    });
    await expect(viewer.getByTestId("replay-name")).toHaveText(
      "The Muddy Ford"
    );
    await expect(viewer.getByTestId("log-play")).toHaveAttribute(
      "data-playing",
      "true"
    );
    await expect(viewer.getByTestId("battle-log-banner")).toContainText(
      "Replay"
    );
    // The game removes the fragment, so a reload opens the Town.
    await expect.poll(() => viewer.evaluate(() => location.hash)).toBe("");
    // There is no Live in a Replay.
    await expect(viewer.getByTestId("back-to-live")).toHaveCount(0);
    await expect(viewer.getByTestId("battle-log-button")).toHaveCount(0);

    // Pause, then step to the last Log Entry.
    await viewer.getByTestId("log-play").click();
    const replayResult = viewer.getByTestId("battle-result");
    await expect(async () => {
      await viewer.keyboard.press("ArrowRight");
      await expect(replayResult).toBeVisible({ timeout: 50 });
    }).toPass({ timeout: 30_000, intervals: [0] });
    await expect(replayResult).toHaveAttribute("data-replay");
    await expect(replayResult).toContainText("Victory");
    await expect(replayResult.getByTestId("result-rewards")).toHaveCount(0);
    await expect(replayResult.getByTestId("share-replay")).toHaveCount(0);

    // "Watch again" Plays from the first Log Entry again.
    await replayResult.getByTestId("watch-again").click();
    await expect(viewer.getByTestId("log-play")).toHaveAttribute(
      "data-playing",
      "true"
    );
    // Esc leaves the Replay: the Town opens.
    await viewer.keyboard.press("Escape");
    await expect(viewer.getByTestId("town")).toBeVisible();
    await viewer.close();
  });

  test("a Replay Link during a Live Battle does not end the Battle", async ({
    page,
  }) => {
    await page.goto("/play?state=active-play&seed=7");
    const turn = page.getByTestId("turn-number");
    await expect(turn).toBeVisible({ timeout: 30_000 });
    const before = await turn.textContent();
    await page.evaluate(() => {
      location.hash = "replay=1.AAAA";
    });
    await expect(
      page.getByText("Leave the Battle to watch a Replay.")
    ).toBeVisible();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
    await expect(page.getByTestId("battle-stage")).toBeVisible();
    await expect(page.getByTestId("replay-badge")).toHaveCount(0);
    await expect(turn).toHaveText(before ?? "");
  });

  test("a broken Replay Link opens the Town with a toast", async ({ page }) => {
    await page.goto("/play#replay=1.broken");
    await expect(page.getByText("This Replay Link is broken.")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("town")).toBeVisible();
    await expect(page.getByTestId("battle-stage")).toHaveCount(0);
  });
});
