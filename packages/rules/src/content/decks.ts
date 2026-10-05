import type { DeckEntry, RankId, StarterDeck } from "./schema";

/** Repeats one Deck entry. */
export const copies = (
  count: number,
  cardId: string,
  rank: RankId
): DeckEntry[] => Array.from({ length: count }, () => ({ cardId, rank }));

/** The maximum number of copies of one card in a Deck, of any Rank (GDD 6). */
export const MAX_COPIES = 3;

/**
 * The Deck size limits at a player level (GDD 6): the maximum is 10 at level 1,
 * +1 for each level, up to 30. The minimum is 5 at level 1, +1 for each level,
 * up to 15.
 */
export const deckSizeLimits = (level: number) => ({
  min: Math.min(4 + level, 15),
  max: Math.min(9 + level, 30),
});

/**
 * The two starter Decks of the Battle slice. The Hero Class comes from the
 * Deck. The game gives them at player level 1, so each one has 10 cards, the
 * maximum Deck size at level 1 (GDD 6).
 */
export const STARTER_DECKS: readonly StarterDeck[] = [
  {
    id: "vanguard",
    classId: "warrior",
    deck: [
      ...copies(1, "human.militiaRecruit", "common"),
      ...copies(1, "human.shieldbearer", "common"),
      ...copies(2, "human.crossbowGuard", "common"),
      ...copies(2, "human.halberdier", "common"),
      ...copies(1, "human.riverKnight", "uncommon"),
      ...copies(1, "human.ironBulwark", "epic"),
      ...copies(1, "warrior.shieldWall", "common"),
      ...copies(1, "warrior.spearThrow", "uncommon"),
    ],
  },
  {
    id: "raiders",
    classId: "mage",
    deck: [
      ...copies(1, "orc.badlandPup", "common"),
      ...copies(2, "orc.scrapRaider", "common"),
      ...copies(1, "orc.emberShaman", "common"),
      ...copies(1, "orc.howlingCharger", "uncommon"),
      ...copies(1, "orc.skyreaver", "uncommon"),
      ...copies(1, "orc.tuskBrute", "common"),
      ...copies(1, "orc.warchiefGrukka", "epic"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(1, "mage.frostBolt", "common"),
    ],
  },
];

export const getStarterDeck = (deckId: string): StarterDeck => {
  const deck = STARTER_DECKS.find((candidate) => candidate.id === deckId);
  if (!deck) {
    throw new Error(`Unknown starter Deck: ${deckId}`);
  }
  return deck;
};
