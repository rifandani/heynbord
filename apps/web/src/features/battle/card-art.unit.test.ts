import { existsSync } from "node:fs";

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
  it("has art for the Human, Orc, Goblin and Elf cards and the Skill Cards only", () => {
    expect(hasCardArt("human.crossbowGuard")).toBe(true);
    expect(hasCardArt("goblin.ankleSnatcher")).toBe(true);
    expect(hasCardArt("elf.lethielFirstGardener")).toBe(true);
    expect(hasCardArt("mage.fireball")).toBe(true);
    expect(hasCardArt("feral.caveBear")).toBe(false);
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
