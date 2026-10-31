import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { battleBudgetAssets } from "../../../scripts/battle-budget-assets";
import { parseBattleBudgetConfig } from "../../../scripts/battle-budget-config";
import { makePublishedAssetReader } from "../../../scripts/battle-budget-files";
import {
  additionalBattleChunks,
  battleBudgetPasses,
  htmlScriptFiles,
} from "../../../scripts/battle-budget-graph";
import type { BudgetGraph } from "../../../scripts/battle-budget-graph";
import early from "../../../scripts/battle-budget/stage-1-1.json";
import hero from "../../../scripts/battle-budget/stage-5-10-hero.json";
import late from "../../../scripts/battle-budget/stage-5-10.json";

const graph: BudgetGraph = {
  "entry.js": {
    imports: ["react.js"],
    dynamicImports: ["play.js", "catalog.js"],
  },
  "play.js": {
    play: true,
    imports: ["react.js"],
    dynamicImports: ["battle.js", "bazaar.js"],
  },
  "react.js": { imports: [], dynamicImports: [] },
  "battle.js": {
    battle: true,
    imports: ["shared.js", "play.js"],
    dynamicImports: ["canvas.js", "hero.js"],
  },
  "shared.js": { imports: ["react.js"], dynamicImports: [] },
  "canvas.js": {
    imports: ["shared.js", "decoder.js"],
    dynamicImports: ["battle.js"],
  },
  "decoder.js": { imports: [], dynamicImports: [] },
  "hero.js": { hero: true, imports: ["shared.js"], dynamicImports: [] },
};
const html =
  '<script type="module" src="/entry.js"></script><link rel="modulepreload" href="/play.js">';

describe("Battle budget graph", () => {
  it("stops at loaded chunks, follows lazy dependencies, and deduplicates cycles", () => {
    expect(additionalBattleChunks(graph, html, false)).toEqual([
      "battle.js",
      "canvas.js",
      "decoder.js",
      "hero.js",
      "shared.js",
    ]);
    expect(additionalBattleChunks(graph, html, true)).toContain("hero.js");
  });
  it("counts a chunk that combines required Battle and optional Hero code", () => {
    expect(
      additionalBattleChunks(
        {
          "play.js": { play: true, imports: [], dynamicImports: ["mixed.js"] },
          "mixed.js": {
            battle: true,
            hero: true,
            imports: [],
            dynamicImports: [],
          },
        },
        '<script src="/play.js">',
        false
      )
    ).toEqual(["mixed.js"]);
  });

  it("fails on absent roots, dependencies and requested feature chunks", () => {
    expect(() => additionalBattleChunks({}, html, false)).toThrow(
      "entry points"
    );
    expect(() =>
      additionalBattleChunks(
        {
          ...graph,
          "canvas.js": { imports: ["missing.js"], dynamicImports: [] },
        },
        html,
        false
      )
    ).toThrow("Missing Battle");
    expect(() =>
      additionalBattleChunks(graph, '<script src="/missing.js">', false)
    ).toThrow("Missing initial");
    const { "hero.js": _hero, ...withoutHero } = graph;
    expect(() => additionalBattleChunks(withoutHero, html, true)).toThrow(
      "not enabled"
    );
  });
  it("reads script and preload URLs without hash-name assumptions", () => {
    expect(
      htmlScriptFiles(
        '<script src="/assets/a-123.js?x=1"></script><link href="/assets/style.css"><script src="/assets/a-123.js">'
      )
    ).toEqual(["assets/a-123.js"]);
  });
  it("fails at either exact limit", () => {
    expect(battleBudgetPasses(49_999_999, 4_999_999)).toBe(true);
    expect(battleBudgetPasses(50_000_000, 1)).toBe(false);
    expect(battleBudgetPasses(1, 5_000_000)).toBe(false);
  });
});

describe("Battle budget configuration", () => {
  it("accepts the declared valid Deck fixtures", () => {
    expect(parseBattleBudgetConfig(early).stageId).toBe("1-1");
    expect(parseBattleBudgetConfig(late).stageId).toBe("5-10");
    expect(parseBattleBudgetConfig(hero).stageId).toBe("5-10");
  });
  it("adds the complete Hero appearance only to the Hero-enabled fixture", () => {
    const withoutHero = battleBudgetAssets(parseBattleBudgetConfig(late));
    const withHero = battleBudgetAssets(parseBattleBudgetConfig(hero));
    expect(withoutHero.heroAssets).toEqual([]);
    expect(withHero.heroAssets).toEqual([
      "/models/heroes/dawn-gaze-iron-vine.glb",
    ]);
    const files = withHero.files.map((file) => file.url);
    expect(files).toContain("/models/heroes/dawn-gaze-iron-vine.glb");
    expect(files).toContain("/hero-portraits/dawn-gaze.webp");
  });
  it("rejects missing selections, wrong cosmetic families and invalid Decks", () => {
    expect(() => parseBattleBudgetConfig({ ...early, features: {} })).toThrow(
      "heroModel"
    );
    expect(() =>
      parseBattleBudgetConfig({
        ...early,
        appearance: { portrait: "boardSkin.hollowMoon", gearLook: null },
      })
    ).toThrow("heroPortrait");
    expect(() =>
      parseBattleBudgetConfig({
        ...early,
        deck: { classId: "warrior", deck: [] },
      })
    ).toThrow("Invalid Player Deck");
  });
});

describe("Battle asset accounting", () => {
  it("includes both Sides, future Tokens, Unit Models and selected cosmetics", () => {
    const earlyAssets = battleBudgetAssets(parseBattleBudgetConfig(early));
    const lateAssets = battleBudgetAssets(parseBattleBudgetConfig(late));
    const earlyUrls = earlyAssets.files.map((file) => file.url);
    const lateUrls = lateAssets.files.map((file) => file.url);
    expect(new Set(earlyUrls).size).toBe(earlyUrls.length);
    expect(earlyUrls).toContain("/skills/warrior/spear-throw.webp");
    expect(earlyUrls).toContain("/creature/orc/badland-runt.webp");
    expect(earlyUrls).toContain("/creature/human/river-knight.webp");
    expect(lateUrls).toContain("/creature/token/skeleton.webp");
    expect(lateUrls).toContain("/creature/token/restless-wisp.webp");
    expect(lateUrls).toContain("/board-skins/hollow-moon.webp");
    expect(lateUrls).toContain("/card-backs/gold-fleur.webp");
    expect(lateUrls).toContain("/hero-portraits/gold-crest.webp");
    expect(lateUrls).toContain("/music/boss.ogg");
    expect(lateUrls.some((url) => url.startsWith("/models/units/"))).toBe(true);
    expect(lateAssets.models.length).toBeGreaterThan(5);
    expect(lateAssets.stings).toEqual([
      "/music/victory.ogg",
      "/music/defeat.ogg",
    ]);
  });

  it("fails for a missing required published asset", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "battle-budget-"));
    try {
      const read = makePublishedAssetReader(root);
      await writeFile(path.join(root, "present.webp"), "12345");
      const bytes = await read("/present.webp");
      expect(bytes.byteLength).toBe(5);
      await expect(read("/missing.webp")).rejects.toThrow(
        "Missing required published asset: /missing.webp"
      );
      await expect(read("https://remote.test/file.webp")).rejects.toThrow(
        "local published asset"
      );
      await expect(read("/../escape.webp")).rejects.toThrow(
        "local published asset"
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
