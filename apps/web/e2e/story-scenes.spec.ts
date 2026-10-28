/* oxlint-disable promise/avoid-new -- IndexedDB exposes events, so browser checks bridge them with Promises. */
/* oxlint-disable eslint/no-await-in-loop -- each Story Moment follows the previous Player action. */
import type { Profile } from "@workspace/rules";
import { newProfile } from "@workspace/rules";

import { expect, test } from "./_base";
import type { Page } from "./_base";

interface HookWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: {
    readonly profileSaved: () => Promise<void>;
    readonly finishBattle: (winner: "player" | "enemy") => void;
  };
}

type LegacyProfile = Omit<Profile, "schemaVersion" | "seenStoryScenes"> & {
  readonly schemaVersion: 14;
};

const awaitSaved = (page: Page) =>
  page.evaluate(async () => {
    // SAFETY: ready waits for the QA hooks.
    await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
  });

/** Read the actual saved record, after the existing save queue drains. */
const savedProfile = (page: Page) =>
  page.evaluate(async () => {
    // SAFETY: the dev and QA builds install these hooks before ready returns.
    await (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.profileSaved();
    return await new Promise<Profile>((resolve, reject) => {
      const open = indexedDB.open("heynbord", 1);
      open.addEventListener("error", () => reject(open.error));
      open.addEventListener("success", () => {
        const db = open.result;
        const get = db
          .transaction("entries")
          .objectStore("entries")
          .get("profile");
        get.addEventListener("success", () => {
          db.close();
          resolve(JSON.parse(get.result.value));
        });
        get.addEventListener("error", () => reject(get.error));
      });
    });
  });

const ready = async (page: Page) => {
  await expect(page.getByTestId("town")).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(
    () =>
      // SAFETY: the dev and QA builds install these hooks on window.
      (window as HookWindow).__THREE_GAME_TEST_HOOKS__ !== undefined
  );
};

const seedProfile = async (page: Page, profile: Profile | LegacyProfile) => {
  await page.goto("/play");
  await ready(page);
  await awaitSaved(page);
  await page.evaluate(async (value) => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("heynbord", 1);
      open.addEventListener("error", () => reject(open.error));
      open.addEventListener("success", () => {
        const db = open.result;
        const transaction = db.transaction("entries", "readwrite");
        transaction
          .objectStore("entries")
          .put({ key: "profile", value: JSON.stringify(value) });
        transaction.addEventListener("complete", () => {
          db.close();
          resolve();
        });
        transaction.addEventListener("error", () => reject(transaction.error));
      });
    });
  }, profile);
  await page.reload();
  await ready(page);
};

/** Starts the Boss through the real Stage Panel, then plays its rules to a win. */
const seedBossStage = async (page: Page) => {
  const profile = newProfile(42);
  await seedProfile(page, {
    ...profile,
    xp: 160,
    collection: profile.collection.map((entry) => ({
      ...entry,
      rank: "legendary",
    })),
    deckSlots: profile.deckSlots.map((slot) => ({
      ...slot,
      deck: slot.deck.map((entry) => ({ ...entry, rank: "legendary" })),
    })),
    gear: { weapon: 20, armor: 20, trinket: 20, banner: 20 },
    stageResults: { "1-9": 3 },
    seenStoryScenes: ["region-1-opening"],
  });
  await page.getByTestId("building-townGate").click();
  await page.getByTestId("stage-1-10").click();
  await page.getByTestId("start-battle").click();
};

const winFirstBoss = async (page: Page) => {
  await seedBossStage(page);
  // The first Fight on the Boss Stage plays the Boss scene; Skip starts the Battle.
  await expect(page.getByTestId("story-text")).toContainText("Brassbelly Hall");
  await page.getByTestId("story-skip").click();
  await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
    timeout: 30_000,
  });
  await page.evaluate(() => {
    // SAFETY: ready waits for the QA hooks.
    (window as HookWindow).__THREE_GAME_TEST_HOOKS__?.finishBattle("player");
  });
  await expect(page.getByTestId("battle-result")).toBeVisible({
    timeout: 30_000,
  });
};

for (const locale of ["en-us", "id-id"] as const) {
  for (const phone of [false, true]) {
    test(`Story controls and text fit: ${locale}, ${phone ? "phone" : "desktop"}`, async ({
      page,
      context,
    }, testInfo) => {
      await context.addCookies([
        {
          name: "app-locale",
          value: locale,
          url: testInfo.project.use.baseURL ?? "http://localhost:4000",
        },
      ]);
      await page.setViewportSize(
        phone ? { width: 667, height: 375 } : { width: 1440, height: 900 }
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/play");
      await ready(page);
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .filter((entry) => entry.name.includes("/story/"))
        )
      ).toEqual([]);
      await page.getByTestId("building-townGate").click();
      const player = page.getByTestId("story-player");
      await expect(player).toBeVisible();
      await expect(page.locator("video")).toHaveCount(0);
      await expect(page.getByTestId("story-text")).toContainText(
        locale === "en-us"
          ? "the peoples of Heynbord went to war"
          : "bangsa-bangsa Heynbord saling berperang"
      );
      await expect(page.getByTestId("story-continue")).toBeFocused();
      await page.keyboard.press("Enter");
      await player
        .getByRole("button", {
          name: locale === "en-us" ? "Back" : "Kembali",
          exact: true,
        })
        .click();
      for (let moment = 0; moment < 5; moment += 1) {
        for (const target of [
          page.getByTestId("story-text"),
          page.getByTestId("story-skip"),
          page.getByTestId("story-continue"),
        ]) {
          const box = await target.boundingBox();
          expect(box).not.toBeNull();
          expect(
            box && box.y >= 0 && box.y + box.height <= (phone ? 375 : 900)
          ).toBe(true);
        }
        if (moment === 2) {
          await page.screenshot({
            path: testInfo.outputPath(
              `${locale}-${phone ? "phone" : "desktop"}.png`
            ),
          });
        }
        if (moment < 4) {
          await page.getByTestId("story-continue").click();
        }
      }
      await expect(page.getByTestId("story-continue")).toHaveText(
        locale === "en-us" ? "Return to Region" : "Kembali ke Wilayah"
      );
      await page.getByTestId("story-continue").click();
      await expect(player).toBeHidden();
      const saved = await savedProfile(page);
      expect(saved.seenStoryScenes).toEqual(["region-1-opening"]);
      await page.getByTestId("region-story").click();
      await page
        .getByRole("button", {
          name: locale === "en-us" ? "Opening" : "Pembuka",
          exact: true,
        })
        .click();
      await expect(player).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(player).toBeHidden();
      await expect(page.getByTestId("campaign")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("town")).toBeVisible();
      await page.getByTestId("building-townGate").click();
      await expect(player).toBeHidden();
    });
  }
}

test("interruption, early Continue, reading hold, Skip, and the Battle Tutorial", async ({
  page,
}) => {
  test.setTimeout(45_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/play");
  await ready(page);
  await page.getByTestId("building-townGate").click();
  await expect(page.locator("video")).toBeVisible();
  await page.getByTestId("story-continue").click();
  await awaitSaved(page);
  await page.reload();
  await ready(page);
  await page.getByTestId("building-townGate").click();
  await expect(page.getByTestId("story-text")).toContainText("Long ago");
  // After its action the clip loops its calm tail; a clip that cannot play keeps its poster.
  await page.waitForTimeout(11_000);
  expect(
    await page.evaluate(() => {
      const video = document.querySelector("video");
      return !video || (!video.paused && video.currentTime >= 4.5);
    })
  ).toBe(true);
  await expect(page.getByTestId("story-player")).toBeVisible();
  await page.getByTestId("story-skip").click();
  await page.getByTestId("stage-1-1").click();
  await page.getByTestId("start-battle").click();
  await expect(page.getByTestId("tutorial-got-it")).toBeVisible({
    timeout: 30_000,
  });
});

test("Boss rewards precede the ending; reload retains it; replay adds no rewards", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await winFirstBoss(page);
  await expect(page.getByTestId("story-player")).toHaveCount(0);
  const rewards = await savedProfile(page);
  expect(rewards.stageResults).toHaveProperty("1-10");
  await page.getByTestId("back-to-campaign").click();
  await expect(page.getByTestId("story-text")).toContainText(
    "Brassbelly's banner falls"
  );
  await page.reload();
  await ready(page);
  // The Town Gate goes to Region 2 after the win, and its opening plays on the
  // first visit. The Hearthvale ending waits for Region 1.
  await page.getByTestId("building-townGate").click();
  await expect(page.getByTestId("region-banner")).toHaveAttribute(
    "data-region",
    "2"
  );
  await expect(page.getByTestId("story-text")).toContainText(
    "The trail of painted gold leads you east"
  );
  await page.getByTestId("story-skip").click();
  await expect(page.getByTestId("story-player")).toHaveCount(0);
  await page.getByRole("button", { name: /Previous Region/u }).click();
  await expect(page.getByTestId("story-text")).toContainText(
    "Brassbelly's banner falls"
  );
  await page.getByTestId("story-skip").click();
  const after = await savedProfile(page);
  expect(after).toEqual({
    ...rewards,
    // Returning through Town can also record a newly available Hint.
    seenHints: after.seenHints,
    seenStoryScenes: [
      "region-1-opening",
      "region-1-boss",
      "region-2-opening",
      "region-1-ending",
    ],
  });
  await page.getByTestId("region-story").click();
  await page.getByRole("button", { name: "Ending", exact: true }).click();
  await page.getByTestId("story-skip").click();
  expect(await savedProfile(page)).toEqual(after);
});

test("the first Boss Fight plays the Boss conversation, then the Battle", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seedBossStage(page);
  const text = page.getByTestId("story-text");
  await expect(text).toContainText("Brassbelly Hall");
  await expect(page.getByTestId("story-speaker")).toHaveCount(0);
  await page.getByTestId("story-continue").click();
  await expect(text).toContainText("Open the gates!");
  await expect(page.getByTestId("story-speaker")).toHaveText(
    "Baron Brassbelly"
  );
  // Back returns to the narration of the same moment.
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(text).toContainText("Brassbelly Hall");
  for (let line = 1; line < 12; line += 1) {
    await page.getByTestId("story-continue").click();
  }
  await expect(text).toContainText("Starting with your door");
  await expect(text).toHaveAttribute("data-speaker", "hero");
  await expect(page.getByTestId("story-continue")).toHaveText("Fight!");
  await page.getByTestId("story-continue").click();
  await expect(page.locator("[data-battle-canvas] canvas")).toBeVisible({
    timeout: 30_000,
  });
  const saved = await savedProfile(page);
  expect(saved.seenStoryScenes).toEqual(["region-1-opening", "region-1-boss"]);
});

test("Retry keeps the first Boss ending pending and preserves its rewards", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await winFirstBoss(page);
  const before = await savedProfile(page);
  await page.getByTestId("retry").click();
  await expect(page.getByTestId("battle-result")).toBeHidden();
  await page.getByTestId("leave-battle").click();
  await page.getByTestId("abandon-confirm").click();
  await expect(page.getByTestId("story-text")).toContainText(
    "Brassbelly's banner falls"
  );
  expect(await savedProfile(page)).toEqual(before);
});

for (const locale of ["en-us", "id-id"] as const) {
  test(`ending text fits a landscape phone: ${locale}`, async ({
    page,
    context,
  }, testInfo) => {
    await context.addCookies([
      {
        name: "app-locale",
        value: locale,
        url: testInfo.project.use.baseURL ?? "http://localhost:4000",
      },
    ]);
    await page.setViewportSize({ width: 667, height: 375 });
    await seedProfile(page, {
      ...newProfile(42),
      stageResults: { "1-10": 1 },
      seenStoryScenes: ["region-1-opening", "region-2-opening"],
    });
    await page.getByTestId("building-townGate").click();
    await page
      .getByRole("button", {
        name: locale === "en-us" ? /Previous Region/u : /Wilayah sebelumnya/u,
      })
      .click();
    await expect(page.getByTestId("story-text")).toContainText(
      locale === "en-us"
        ? "Brassbelly's banner falls"
        : "Panji Brassbelly jatuh"
    );
    for (let moment = 0; moment < 5; moment += 1) {
      const box = await page.getByTestId("story-text").boundingBox();
      expect(box && box.y >= 0 && box.y + box.height <= 375).toBe(true);
      if (moment === 2) {
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-ending-phone.png`),
        });
      }
      await page.getByTestId("story-continue").click();
    }
    await expect(page.getByTestId("story-player")).toBeHidden();
  });
}

for (const locale of ["en-us", "id-id"] as const) {
  test(`Red Mesas Boss conversation fits a landscape phone: ${locale}`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(60_000);
    await context.addCookies([
      {
        name: "app-locale",
        value: locale,
        url: testInfo.project.use.baseURL ?? "http://localhost:4000",
      },
    ]);
    await page.setViewportSize({ width: 667, height: 375 });
    await seedProfile(page, {
      ...newProfile(42),
      stageResults: { "1-10": 1, "2-9": 2 },
      seenStoryScenes: [
        "region-1-opening",
        "region-1-boss",
        "region-1-ending",
        "region-2-opening",
      ],
    });
    await page.getByTestId("building-townGate").click();
    await expect(page.getByTestId("region-banner")).toHaveAttribute(
      "data-region",
      "2"
    );
    await expect(page.getByTestId("story-player")).toHaveCount(0);
    await page.getByTestId("region-story").click();
    await page
      .getByRole("button", {
        name: locale === "en-us" ? "Boss" : "Bos",
        exact: true,
      })
      .click();
    const text = page.getByTestId("story-text");
    await expect(text).toContainText(
      locale === "en-us" ? "Snikkit's Throne Hall" : "Throne Hall milik Snikkit"
    );
    // 14 lines over 5 moments; Grukka speaks once, before the Battle.
    for (let line = 0; line < 14; line += 1) {
      const box = await text.boundingBox();
      expect(box && box.y >= 0 && box.y + box.height <= 375).toBe(true);
      if (line === 9) {
        await expect(page.getByTestId("story-speaker")).toHaveText(
          "Boss Snikkit"
        );
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-red-mesas-boss-phone.png`),
        });
      }
      if (line === 12) {
        await expect(page.getByTestId("story-speaker")).toHaveText(
          "Warchief Grukka"
        );
      }
      await page.getByTestId("story-continue").click();
    }
    await expect(page.getByTestId("story-player")).toBeHidden();
  });
}

test("old saves get replay access without automatic scenes", async ({
  page,
}) => {
  const { seenStoryScenes: _, ...old } = newProfile(42);
  await seedProfile(page, {
    ...old,
    schemaVersion: 14,
    stageResults: { "1-10": 1 },
  });
  await page.getByTestId("building-townGate").click();
  await page.getByRole("button", { name: /Previous Region/u }).click();
  await expect(page.getByTestId("region-story")).toBeVisible();
  await expect(page.getByTestId("story-player")).toHaveCount(0);
  await page.getByTestId("region-story").click();
  await expect(
    page.getByRole("button", { name: "Ending", exact: true })
  ).toBeVisible();
});

test.describe("failed Story media", () => {
  test.use({ expectedHttpErrors: [/\/story\//u] });
  test("keeps text and controls usable when clips, posters and audio fail", async ({
    page,
  }) => {
    await page.route("**/story/**", (route) =>
      route.fulfill({ status: 404, body: "Missing" })
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/play");
    await ready(page);
    await page.getByTestId("building-townGate").click();
    await expect(page.getByTestId("story-text")).toContainText("Long ago");
    await page.getByTestId("story-continue").click();
    await expect(page.getByTestId("story-text")).toContainText(
      "three lanes of light"
    );
    await page.getByTestId("story-skip").click();
    await expect(page.getByTestId("campaign")).toBeVisible();
  });
});
