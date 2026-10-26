/* oxlint-disable eslint/no-await-in-loop -- each measurement depends on the preceding user action. */
import { writeFile } from "node:fs/promises";

import { expect, test } from "./_base";
import type { Page } from "./_base";
import {
  contrastRatio,
  measureSolidCue,
  measureTextContrast,
} from "./_contrast";

interface ContrastHooks {
  setXp: (xp: number) => void;
  openHeynspire: (floors: number) => void;
  setCoin: (coin: number) => void;
  setEssence: (essence: number) => void;
  setState: (state: string) => void;
  setPausedForScreenshot: (paused: boolean) => void;
  giveUnopenedPack: (pack: { pack: "peddler"; version: "all" }) => void;
}

interface ContrastWindow extends Window {
  readonly __THREE_GAME_TEST_HOOKS__?: ContrastHooks;
}

test.use({
  actionTimeout: 10_000,
  permissions: ["clipboard-read", "clipboard-write"],
});

const hooks = (
  page: Page,
  action:
    | "unlock"
    | "battle"
    | "victory"
    | "defeat"
    | "targeting"
    | "dungeon-three"
    | "pack"
) =>
  page.evaluate((name) => {
    // SAFETY: the caller waits for the existing QA hooks before using them.
    const qa = (window as ContrastWindow).__THREE_GAME_TEST_HOOKS__;
    if (!qa) {
      throw new Error("The contrast audit needs the game QA hooks");
    }
    if (name === "unlock") {
      qa.setXp(1_000_000);
      qa.openHeynspire(0);
    } else if (name === "pack") {
      qa.giveUnopenedPack({ pack: "peddler", version: "all" });
    } else {
      qa.setState(name === "battle" ? "active-play" : name);
      qa.setPausedForScreenshot(true);
    }
  }, action);

test("the contrast check detects low-contrast and faded disabled text", async ({
  page,
}) => {
  expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBe(21);
  expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeLessThan(4.5);
  await page.setContent(
    '<body style="background:white;color:black;font:16px Arial"><p>Readable text</p><p style="color:#aaa">Low contrast</p><button disabled style="opacity:.45;background:white;color:black">Disabled text</button></body>'
  );
  const results = await measureTextContrast(page);
  expect(results.find((item) => item.text === "Readable text")?.ratio).toBe(21);
  const failures = results.filter((item) => item.ratio < item.required);
  expect(failures.map((item) => item.text)).toEqual([
    "Low contrast",
    "Disabled text",
  ]);
});

for (const locale of ["en-us", "id-id"] as const) {
  for (const mode of ["light", "dark"] as const) {
    for (const display of ["desktop", "mobile"] as const) {
      test.describe(`${locale} ${mode} ${display}`, () => {
        test.use({
          hasTouch: display === "mobile",
          isMobile: display === "mobile",
        });
        test(`contrast ${locale} ${mode} ${display}`, async ({
          page,
          context,
        }, testInfo) => {
          test.setTimeout(240_000);
          await page.setViewportSize(
            display === "desktop"
              ? { width: 1440, height: 900 }
              : { width: 844, height: 390 }
          );
          await page.emulateMedia({
            colorScheme: mode,
            reducedMotion: "reduce",
          });
          await context.addCookies([
            {
              name: "app-locale",
              value: locale,
              url: testInfo.project.use.baseURL ?? "http://localhost:4000",
            },
          ]);
          await page.addInitScript(
            (value) =>
              localStorage.setItem("app-color-mode", JSON.stringify(value)),
            mode
          );
          const results: {
            state: string;
            measurements: Awaited<ReturnType<typeof measureTextContrast>>;
          }[] = [];
          const audit = async (state: string, scope?: string) => {
            // Wait for images and settled UI, without a fixed timing assumption.
            await page.evaluate(async () => {
              // Measure steady states. Screenshot animation overrides can restart
              // portal entrance animations after they restore the stylesheet.
              if (!document.querySelector("#contrast-steady-state")) {
                const style = document.createElement("style");
                style.id = "contrast-steady-state";
                style.textContent =
                  "*,*::before,*::after { animation: none !important; transition: none !important; }";
                document.head.append(style);
              }
              await Promise.all(
                [...document.images]
                  .filter((image) => image.complete || image.loading !== "lazy")
                  .map((image) => image.decode().catch(() => {}))
              );
              document.body.getBoundingClientRect();
            });
            // Let floating details complete placement before reading text bounds.
            await page.screenshot({
              path: testInfo.outputPath(`${state}.png`),
              scale: "css",
            });
            const measurements = await measureTextContrast(page, scope);
            expect(measurements.length, state).toBeGreaterThan(0);
            results.push({ state, measurements });
            await writeFile(
              testInfo.outputPath("contrast-measurements.json"),
              JSON.stringify(results, null, 2)
            );
          };
          try {
            await page.goto("/");
            await expect(page.locator("html")).toHaveClass(
              new RegExp(`\\b${mode}\\b`, "u")
            );
            await audit("home");
            await page.getByTestId("play-link").hover();
            await audit("home-hover");
            await expect(async () => {
              await page
                .getByRole("button", {
                  name: locale === "en-us" ? "Theme" : "Tema",
                  exact: true,
                })
                .click();
              await expect(page.getByRole("menu")).toBeVisible({
                timeout: 1000,
              });
            }).toPass();
            await audit("theme-menu");
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toHaveCount(0);
            await page
              .getByRole("button", {
                name: locale === "en-us" ? "English" : "Indonesia",
              })
              .press("Enter");
            await expect(page.getByRole("menu")).toBeVisible();
            await audit("language-menu");
            await page.keyboard.press("Escape");
            await expect(page.getByRole("menu")).toHaveCount(0);
            if (display === "mobile") {
              await page.setViewportSize({ width: 390, height: 844 });
              await audit("home-mobile-portrait");
              await page.setViewportSize({ width: 844, height: 390 });
            }
            await page.goto("/play?seed=7");
            await expect(page.getByTestId("town")).toBeVisible({
              timeout: 30_000,
            });
            await page.waitForFunction(
              () => "__THREE_GAME_TEST_HOOKS__" in window
            );
            if (display === "mobile") {
              await page.setViewportSize({ width: 390, height: 844 });
              await expect(
                page.locator('div[class*="orientation:portrait"]')
              ).toBeVisible();
              await audit("game-mobile-portrait");
              await page.setViewportSize({ width: 844, height: 390 });
            }
            await audit("town-locked");
            await page.getByTestId("town-settings").press("Enter");
            await expect(page.getByTestId("settings-dialog")).toBeVisible();
            await audit("settings");
            expect(
              await measureSolidCue(
                page,
                '[data-testid="settings-language"] [data-selected] > span:last-child'
              )
            ).toBeGreaterThanOrEqual(3);
            expect(
              await measureSolidCue(
                page,
                '[data-testid="settings-language"] label:not([data-selected]) > span:last-child'
              )
            ).toBeGreaterThanOrEqual(3);
            await page.getByTestId("settings-close").focus();
            await page.keyboard.press("Tab");
            const focused = page.locator('[data-focus-visible="true"]').first();
            await expect(focused).toBeVisible();
            await expect(focused).toHaveCSS("outline-width", "2px");
            await audit("settings-focus");
            await page.getByTestId("settings-sound-switch").press("Space");
            await audit("settings-muted");
            await page.getByTestId("settings-close").press("Enter");
            await hooks(page, "unlock");
            for (const screen of [
              "campaign",
              "packs",
              "workshop",
              "hero",
              "dungeons",
              "heynspire",
              "achievements",
              "bazaar",
              "seaport",
            ] as const) {
              await page.getByTestId(`town-shortcut-${screen}`).press("Enter");
              await expect(page.getByTestId(screen)).toBeVisible();
              await audit(screen);
              if (screen === "packs") {
                await page.getByTestId("drop-rates-button").press("Enter");
                await expect(
                  page.getByTestId("drop-rates-dialog")
                ).toBeVisible();
                await audit("drop-rates");
                await page.keyboard.press("Escape");
                await hooks(page, "pack");
                await page
                  .getByTestId("unopened-open-peddler-all")
                  .press("Enter");
                await expect(page.getByTestId("pack-reveal")).toBeVisible();
                await audit("pack-reveal");
                await page.getByTestId("reveal-card-0").hover();
                await expect(page.getByTestId("reveal-peek")).toBeVisible();
                // This opaque popup ignores pointer input. Its covered background
                // was measured in the preceding pack-reveal state.
                await audit("card-details", '[data-testid="reveal-peek"]');
                await page.getByTestId("reveal-done").press("Enter");
              }
              if (screen === "campaign") {
                await page
                  .locator('button[data-testid^="stage-"]')
                  .first()
                  .press("Enter");
                await expect(page.getByTestId("start-battle")).toBeVisible();
                await audit("stage-panel");
                await page.keyboard.press("Escape");
              }
              if (screen === "workshop") {
                for (const station of ["craft", "fuse", "extract", "combine"]) {
                  await page
                    .getByTestId(`workshop-station-${station}`)
                    .press("Enter");
                  await audit(`workshop-${station}`);
                }
              }
              if (screen === "heynspire") {
                await page.getByTestId("floor-2").click();
                await audit("heynspire-locked");
              }
            }
            for (const dialog of ["deck", "handbook"]) {
              await page.getByTestId(`town-shortcut-${dialog}`).click();
              await expect(page.getByTestId(`${dialog}-dialog`)).toBeVisible();
              await audit(dialog);
              if (dialog === "deck") {
                expect(
                  await measureSolidCue(
                    page,
                    '[data-testid="deck-class-warrior"]'
                  )
                ).toBeGreaterThanOrEqual(3);
                await page.getByTestId("deck-buy-slot").press("Enter");
                await expect(
                  page.getByTestId("buy-slot-confirm")
                ).toBeVisible();
                await audit("buy-deck-slot-disabled");
                await page.keyboard.press("Escape");
              }
              await page.getByTestId(`${dialog}-close`).press("Enter");
            }
            await hooks(page, "battle");
            await expect(page.getByTestId("battle-stage")).toBeVisible();
            await expect(
              page.locator("[data-battle-canvas] canvas")
            ).toBeVisible({ timeout: 30_000 });
            await audit("battle");
            const endTurn = page.getByTestId("end-turn");
            await endTurn.hover();
            await audit("battle-button-hover");
            await page.mouse.down();
            await expect(endTurn).toHaveAttribute("data-pressed", "true");
            await audit("battle-button-pressed");
            await page.mouse.move(4, 4);
            await page.mouse.up();
            const unit = await page.evaluate(
              () =>
                window.__THREE_GAME_DIAGNOSTICS__
                  ?.unitPoints()
                  .toSorted((a, b) => b.y - a.y)[0]
            );
            if (!unit) {
              throw new Error("The Battle audit needs a visible Unit");
            }
            await page.mouse.move(unit.x, unit.y);
            await expect(page.getByTestId("unit-details")).toBeVisible();
            await audit(
              "unit-focus-and-details",
              '[data-testid="unit-details"]'
            );
            await page.mouse.move(4, 4);
            await hooks(page, "targeting");
            await expect
              .poll(() =>
                page.evaluate(
                  () =>
                    window.__THREE_GAME_DIAGNOSTICS__?.targetPoints().length ??
                    0
                )
              )
              .toBeGreaterThan(0);
            await audit("board-targeting");
            await hooks(page, "battle");
            await page.getByTestId("battle-log-button").press("Enter");
            await expect(page.getByTestId("battle-log")).toBeVisible();
            await audit("battle-log");
            await page.getByTestId("back-to-live").press("Enter");
            await hooks(page, "victory");
            await expect(page.getByTestId("battle-result")).toBeVisible();
            await audit("victory");
            await page.getByTestId("share-replay").press("Enter");
            await expect(page.locator("[data-sonner-toast]")).toBeVisible();
            await audit("replay-notification");
            const link = await page.evaluate(() =>
              navigator.clipboard.readText()
            );
            await page.goto(link);
            await expect(page.getByTestId("replay-badge")).toBeVisible({
              timeout: 30_000,
            });
            await page.getByTestId("log-play").press("Enter");
            await audit("watching-replay");
            await page.getByTestId("leave-replay").press("Enter");
            await expect(page.getByTestId("town")).toBeVisible();
            await page.waitForFunction(
              () => "__THREE_GAME_TEST_HOOKS__" in window
            );
            await hooks(page, "defeat");
            await expect(page.getByTestId("battle-result")).toBeVisible();
            await audit("defeat");
            await hooks(page, "dungeon-three");
            await expect(page.getByTestId("battle-result")).toBeHidden();
            await audit("dungeon-boss-overlays");
          } finally {
            await writeFile(
              testInfo.outputPath("contrast-measurements.json"),
              JSON.stringify(results, null, 2)
            );
            await testInfo.attach("contrast-measurements.json", {
              body: JSON.stringify(results, null, 2),
              contentType: "application/json",
            });
          }
          const failures = results.flatMap(({ state, measurements }) =>
            measurements
              .filter((item) => item.ratio < item.required)
              .map((item) => ({
                state,
                ...item,
                ratio: Number(item.ratio.toFixed(3)),
              }))
          );
          expect(failures).toEqual([]);
        });
      });
    }
  }
}
