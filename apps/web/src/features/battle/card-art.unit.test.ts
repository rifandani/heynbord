import { getCard, getStarterDeck } from "@workspace/rules";
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
    expect(cardIllustration("mage.fireball")).toBe(
      "/skills/mage/fireball.webp"
    );
  });
});

describe("hasCardArt", () => {
  it("has art for the Human and Orc cards and the Skill Cards only", () => {
    expect(hasCardArt("human.crossbowGuard")).toBe(true);
    expect(hasCardArt("mage.fireball")).toBe(true);
    expect(hasCardArt("goblin.ankleSnatcher")).toBe(false);
    expect(hasCardArt("feral.caveBear")).toBe(false);
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
