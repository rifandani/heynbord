import { existsSync, readdirSync, readFileSync } from "node:fs";

import { CARDS, getCard, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import {
  battleCreatureCards,
  cardIllustration,
  hasCardArt,
} from "@/features/battle/card-art";

describe("cardIllustration", () => {
  it("puts the kebab-case card name in the folder of its Race or Class", () => {
    expect(cardIllustration("human.crossbowGuard")).toBe(
      "/creature/human/crossbow-guard.webp"
    );
    expect(cardIllustration("orc.warchiefGrukka")).toBe(
      "/creature/orc/warchief-grukka.webp"
    );
    expect(cardIllustration("elf.lethielFirstGardener")).toBe(
      "/creature/elf/lethiel-first-gardener.webp"
    );
    expect(cardIllustration("mage.fireball")).toBe(
      "/skills/mage/fireball.webp"
    );
  });
});

describe("hasCardArt", () => {
  it("has art for the Human, Orc, Goblin, Elf and Feral cards and the Skill Cards", () => {
    expect(hasCardArt("human.crossbowGuard")).toBe(true);
    expect(hasCardArt("goblin.ankleSnatcher")).toBe(true);
    expect(hasCardArt("elf.lethielFirstGardener")).toBe(true);
    expect(hasCardArt("mage.fireball")).toBe(true);
    expect(hasCardArt("feral.caveBear")).toBe(true);
  });

  it("has a file in public/ for each card with art", () => {
    const missing = CARDS.filter((card) => hasCardArt(card.id))
      .map((card) => cardIllustration(card.id))
      .filter(
        (file) =>
          !existsSync(new URL(`../../../public${file}`, import.meta.url))
      );
    expect(missing).toEqual([]);
  });
});

/** A width or a height in the WebP header has 14 bits. */
const FOURTEEN_BITS = 0x40_00;

/**
 * The width and height of a WebP file, from its header. The first chunk is
 * `VP8 ` (lossy), `VP8L` (lossless) or `VP8X` (extended).
 */
const webpSize = (file: Buffer): readonly [number, number] => {
  const chunk = file.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return [
      file.readUInt16LE(26) % FOURTEEN_BITS,
      file.readUInt16LE(28) % FOURTEEN_BITS,
    ];
  }
  if (chunk === "VP8L") {
    const bits = file.readUInt32LE(21);
    return [
      (bits % FOURTEEN_BITS) + 1,
      (Math.floor(bits / FOURTEEN_BITS) % FOURTEEN_BITS) + 1,
    ];
  }
  return [file.readUIntLE(24, 3) + 1, file.readUIntLE(27, 3) + 1];
};

describe("card art files", () => {
  it("are all 600 × 800 (art direction 5.3)", () => {
    const wrong = ["creature", "skills"].flatMap((folder) => {
      const root = new URL(`../../../public/${folder}/`, import.meta.url);
      return readdirSync(root, { recursive: true, encoding: "utf-8" })
        .filter((path) => path.endsWith(".webp"))
        .map((path) => {
          const [width, height] = webpSize(readFileSync(new URL(path, root)));
          return `${folder}/${path} ${width} × ${height}`;
        })
        .filter((line) => !line.endsWith(" 600 × 800"));
    });
    expect(wrong).toEqual([]);
  });
});

describe("battleCreatureCards", () => {
  it("lists each Creature Card of both Sides one time, and no Skill Card", () => {
    const { rules } = startSession({
      stageId: "1-1",
      deck: getStarterDeck("vanguard"),
      seed: 7,
    });
    const cards = battleCreatureCards(rules);
    expect(cards.length).toBeGreaterThan(0);
    expect(new Set(cards).size).toBe(cards.length);
    for (const cardId of cards) {
      expect(getCard(cardId).kind).toBe("creature");
    }
  });
});
