import { describe, expect, it } from "vitest";

import { getCard } from "../content/cards";
import { deckCountdown } from "../content/decks";
import type { SkillCardDefinition } from "../content/schema";
import { NO_GEAR } from "./simulate";
import {
  isSwapPass,
  simulateSkillSwap,
  skillSwap,
  swappedCreature,
} from "./skill-swap";

const skill = (id: string): SkillCardDefinition => {
  const card = getCard(id);
  if (card.kind !== "skill") {
    throw new Error(`${id} is not a Skill Card`);
  }
  return card;
};

const countOf = (deck: readonly { cardId: string }[], cardId: string) =>
  deck.filter((entry) => entry.cardId === cardId).length;

describe("skillSwap (Archetypes 3.3)", () => {
  it("puts 1 more Skill Card copy in place of a melee Creature Card with the same Countdown", () => {
    const swap = skillSwap(skill("warrior.warDrums"));
    expect(swap.base.id).toBe("vanguardFull");
    // Crossbow Guard (Countdown 2, 2 copies) is a Range 3 Shooter: the swap
    // takes the melee Shieldbearer.
    expect(swap.creature.cardId).toBe("human.shieldbearer");
    expect(swap.sameCountdown).toBe(true);
    expect(countOf(swap.swapped.deck, "warrior.warDrums")).toBe(2);
    expect(countOf(swap.swapped.deck, "human.shieldbearer")).toBe(0);
    expect(swap.swapped.deck).toHaveLength(swap.base.deck.length);
    expect(deckCountdown(swap.swapped.deck)).toBe(
      deckCountdown(swap.base.deck)
    );
  });

  it("makes the reverse Deck with the Skill Card copy replaced by the Creature Card", () => {
    const swap = skillSwap(skill("warrior.warDrums"));
    expect(swap.reverse).not.toBeNull();
    expect(countOf(swap.reverse?.deck ?? [], "warrior.warDrums")).toBe(0);
    expect(countOf(swap.reverse?.deck ?? [], "human.shieldbearer")).toBe(2);
  });

  it("uses each Class Deck", () => {
    expect(
      [
        "warrior.spearThrow",
        "ranger.pinningShot",
        "mage.fireball",
        "priest.mend",
      ].map((id) => skillSwap(skill(id)).base.id)
    ).toEqual(["vanguardFull", "thornwatch", "raidersFull", "wildHunt"]);
  });

  it("uses the nearest Countdown when no melee Creature Card has the same one", () => {
    // Thornwatch has no Countdown 4 Creature Card.
    const swap = skillSwap(skill("ranger.longShot"));
    expect(swap.sameCountdown).toBe(false);
    expect(getCard(swap.creature.cardId).countdown).toBe(3);
  });
});

describe("swappedCreature", () => {
  const deck = [
    { cardId: "human.militiaRecruit", rank: "common" },
    { cardId: "human.halberdier", rank: "common" },
    { cardId: "human.kingsCourier", rank: "rare" },
    { cardId: "human.kingsCourier", rank: "rare" },
    { cardId: "human.crossbowGuard", rank: "common" },
  ] as const;

  it("selects the higher of two nearest Countdowns, then the card with the most copies", () => {
    // Countdown 2: Militia Recruit (1) and Halberdier (3) are both 1 away.
    // Crossbow Guard has Countdown 2, but it is a Shooter.
    expect(swappedCreature(deck, skill("warrior.warDrums")).cardId).toBe(
      "human.halberdier"
    );
    expect(swappedCreature(deck, skill("ranger.longShot")).cardId).toBe(
      "human.kingsCourier"
    );
  });

  it("throws when the Deck has no melee Creature Card", () => {
    expect(() =>
      swappedCreature(
        [{ cardId: "human.crossbowGuard", rank: "common" }],
        skill("warrior.warDrums")
      )
    ).toThrow("no melee Creature Card");
  });
});

describe("isSwapPass", () => {
  it("passes a change of 5 points or less, with no rounding error", () => {
    expect(isSwapPass(0.2, 0.25, 2000)).toBe(true);
    expect(isSwapPass(0.6, 0.55, 2000)).toBe(true);
    expect(isSwapPass(0.2, 0.2505, 2000)).toBe(false);
  });
});

describe("simulateSkillSwap", () => {
  it("reports the win rates before and after against Vanguard and Raiders", () => {
    const cache = new Map<string, number>();
    const options = { seeds: 2, level: 5, gear: NO_GEAR };
    const report = simulateSkillSwap(skill("priest.smite"), options, cache);
    expect(report).toMatchObject({
      skillId: "priest.smite",
      deckId: "wildHunt",
      creatureId: "feral.bristlebackBoar",
      sameCountdown: true,
      countdownChange: 0,
    });
    expect(report.results.map((result) => result.opponentId)).toEqual([
      "vanguard",
      "raiders",
    ]);
    expect(report.pass).toBe(report.results.every((result) => result.pass));
    // The base Matchups of a Deck play one time for each Class.
    expect([...cache.keys()]).toEqual([
      "wildHunt:vanguard",
      "wildHunt:raiders",
    ]);
    expect(
      simulateSkillSwap(skill("priest.mend"), options, cache).results.map(
        (result) => result.before
      )
    ).toEqual(report.results.map((result) => result.before));
  });
});
