import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { categories, entryIds } from "@/master-design/registry";

const GAME_DIR = path.join(
  import.meta.dirname,
  "..",
  "core",
  "components",
  "game"
);
const HEX = /#[0-9a-fA-F]{3,8}\b/u;

/**
 * The catalog is the one place to see the Heynbord UI. These checks keep it
 * complete and keep the game layer on its own side of the import rule.
 */
describe("the Component Catalog", () => {
  it("has one unique id for each category and entry", () => {
    const categoryIds = categories.map((category) => category.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    expect(new Set(entryIds).size).toBe(entryIds.length);
  });

  it("gives every entry a showcase", () => {
    for (const category of categories) {
      expect(category.name.length).toBeGreaterThan(0);
      for (const entry of category.entries) {
        expect(entry.Showcase).toBeTypeOf("function");
      }
    }
  });

  it("has one Design Foundation entry", () => {
    const foundation = categories.find(
      (category) => category.id === "foundation"
    );
    expect(foundation?.entries.map((entry) => entry.id)).toStrictEqual([
      "design-foundation",
    ]);
  });

  it("describes every Game Pieces entry", () => {
    const game = categories.find((category) => category.id === "game");
    expect(game?.name).toBe("Game Pieces");
    for (const entry of game?.entries ?? []) {
      expect((entry.description ?? "").trim().length, entry.id).toBeGreaterThan(
        0
      );
    }
  });

  it("shows every entry from issues #116 to #120 in the Game Pieces section", () => {
    const game = categories.find((category) => category.id === "game");
    expect(game).toBeDefined();
    expect(game?.entries.map((entry) => entry.id)).toStrictEqual([
      "game-screen",
      "game-plates",
      "game-buttons",
      "game-badges",
      "game-rank-gems",
      "game-resource-plate",
      "game-stat-plates",
      "game-dialog",
      "game-scrim",
      "balance-plate",
      "unit-model",
    ]);
  });
});

describe("the game layer", () => {
  it("imports no screen or feature", { timeout: 30_000 }, () => {
    for (const file of readdirSync(GAME_DIR)) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
        continue;
      }
      const source = readFileSync(path.join(GAME_DIR, file), "utf-8");
      expect(source, file).not.toContain("@/features/");
    }
  });

  it("keeps its colors in tokens.ts", { timeout: 30_000 }, () => {
    for (const file of readdirSync(GAME_DIR)) {
      if (file === "tokens.ts" || !/\.(?:ts|tsx)$/u.test(file)) {
        continue;
      }
      const source = readFileSync(path.join(GAME_DIR, file), "utf-8");
      expect(source, file).not.toMatch(HEX);
    }
  });
});
