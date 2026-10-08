import { getCard } from "./cards";
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
 * The Countdown Limit at a player level (GDD 6, ADR-0021): the sum of the
 * printed Countdowns of the cards in a Deck is at most 2.5 × the maximum Deck
 * size, rounded down. It is 25 at level 1 and 35 at level 5. A Stage enemy
 * Deck does not have the limit.
 */
export const countdownLimit = (level: number): number =>
  Math.floor((deckSizeLimits(level).max * 5) / 2);

/**
 * The sum of the printed Countdowns of the cards in a Deck. Skill Cards count,
 * and the Rank of a copy does not change its Countdown.
 */
export const deckCountdown = (deck: readonly DeckEntry[]): number =>
  deck.reduce((sum, entry) => sum + getCard(entry.cardId).countdown, 0);

/**
 * The two starter Decks of the Battle slice. The Hero Class comes from the
 * Deck. The game gives them at player level 1, so each one has 10 cards, the
 * maximum Deck size at level 1 (GDD 6).
 *
 * Each copy in a Starter Deck has the Rank Common or Uncommon, so that the
 * first Epic of a Player is a reward from play (the first win of the Boss
 * Stage 1-10). Each copy is at its Base Rank, Common Creature Cards come in
 * pairs or triples, and each Deck has at least 1 Skill Card of its Class.
 * Each Deck is within the Countdown Limit of level 1 (25, ADR-0021).
 */
export const STARTER_DECKS: readonly StarterDeck[] = [
  {
    id: "vanguard",
    classId: "warrior",
    deck: [
      ...copies(2, "human.militiaRecruit", "common"),
      ...copies(3, "human.crossbowGuard", "common"),
      ...copies(2, "human.halberdier", "common"),
      ...copies(2, "human.riverKnight", "uncommon"),
      ...copies(1, "warrior.spearThrow", "uncommon"),
    ],
  },
  {
    id: "raiders",
    classId: "mage",
    deck: [
      ...copies(3, "orc.scrapRaider", "common"),
      ...copies(3, "orc.emberShaman", "common"),
      ...copies(2, "orc.badlandRunt", "common"),
      ...copies(1, "orc.howlingCharger", "uncommon"),
      ...copies(1, "mage.fireball", "common"),
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
