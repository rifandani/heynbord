import { expect, test } from "./_base";

test.describe("Battle Board accessibility", () => {
  test("names the Board from the Message Catalog in both languages", async ({
    page,
  }) => {
    await page.goto("/play?state=active-play&seed=7");
    await expect(page.getByRole("img", { name: "Battle Board" })).toBeVisible({
      timeout: 30_000,
    });

    const { origin } = new URL(page.url());
    await page
      .context()
      .addCookies([{ name: "app-locale", value: "id-id", url: origin }]);
    await page.reload();
    await expect(
      page.getByRole("img", { name: "Papan Pertempuran" })
    ).toBeVisible({ timeout: 30_000 });
  });
});
