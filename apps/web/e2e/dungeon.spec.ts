import { expect, test } from "./_base";

/** The Battle UI with 2 or more enemy Bosses on a 4-Lane Board (issue #93). */
test.describe("Dungeon Battle", () => {
  test("shows one plate for each Boss, with the Lanes of its Front", async ({
    page,
  }) => {
    await page.goto("/play?state=dungeon&seed=42");
    const plates = page.getByTestId("boss-plates");
    await expect(plates).toBeVisible({ timeout: 30_000 });
    await expect(plates).toHaveAttribute("data-count", "2");
    // The Lane strip of each Boss fills the 2 Lanes of its Front: Lanes 1-2, then 3-4.
    const held = (index: number) =>
      page
        .getByTestId(`boss-${index}`)
        .getByTestId("lane-strip")
        .locator("[data-held]");
    await expect(held(0)).toHaveCount(2);
    await expect(held(1)).toHaveCount(2);
    await expect(page.getByTestId("boss-0")).toHaveAccessibleName(
      /Holds Lanes 1, 2/u
    );
    await expect(page.getByTestId("boss-1")).toHaveAccessibleName(
      /Holds Lanes 3, 4/u
    );
    // Each Boss has a notch at each Boss Rule threshold, and its own Hand.
    await expect(
      page.getByTestId("boss-0").getByTestId("boss-notch")
    ).toHaveCount(1);
    await expect(page.getByTestId("boss-hand")).toHaveCount(2);
  });

  test("shows 3 Bosses with Fronts of 1, 2 and 1 Lanes", async ({ page }) => {
    await page.goto("/play?state=dungeon-three&seed=42");
    await expect(page.getByTestId("boss-plates")).toHaveAttribute(
      "data-count",
      "3",
      { timeout: 30_000 }
    );
    const held = (index: number) =>
      page
        .getByTestId(`boss-${index}`)
        .getByTestId("lane-strip")
        .locator("[data-held]");
    await expect(held(0)).toHaveCount(1);
    await expect(held(1)).toHaveCount(2);
    await expect(held(2)).toHaveCount(1);
  });

  test("Skip jumps over a Defeat and a Front move", async ({ page }) => {
    await page.goto("/play?state=dungeon-defeat&seed=42");
    await expect(page.getByTestId("boss-plates")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Skip" }).click();
    const fallen = page.getByTestId("boss-0");
    await expect(fallen).toHaveAttribute("data-defeated", "true");
    await expect(fallen).toContainText("Defeated");
    // The Front of the Defeated Boss went to the other Boss: it holds all 4 Lanes.
    await expect(
      page
        .getByTestId("boss-1")
        .getByTestId("lane-strip")
        .locator("[data-held]")
    ).toHaveCount(4);
  });
});
