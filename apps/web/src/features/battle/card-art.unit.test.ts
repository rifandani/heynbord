import { getCard } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import {
  battleCreatureCards,
  cardIllustration,
} from "@/features/battle/card-art";

describe("cardIllustration", () => {
  it("changes the card name in the card ID to a kebab-case file name", () => {
    expect(cardIllustration("human.crossbowGuard")).toBe(
      "/illustrations/crossbow-guard.jpg"
    );
    expect(cardIllustration("orc.warchiefGrukka")).toBe(
      "/illustrations/warchief-grukka.jpg"
    );
    expect(cardIllustration("mage.fireball")).toBe(
      "/illustrations/fireball.jpg"
    );
  });
});

describe("battleCreatureCards", () => {
  it("lists each Creature Card of both Sides one time, and no Skill Card", () => {
    const { rules } = startSession({
      stageId: "1-1",
      deckId: "vanguard",
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
