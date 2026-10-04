import type { DeckEntry, RankId, StarterDeck } from "./schema";

/** Repeats one Deck entry. */
export const copies = (
  count: number,
  cardId: string,
  rank: RankId
): DeckEntry[] => Array.from({ length: count }, () => ({ cardId, rank }));

/** The two starter Decks of the Battle slice. The Hero Class comes from the Deck. */
export const STARTER_DECKS: readonly StarterDeck[] = [
  {
    id: "vanguard",
    classId: "warrior",
    deck: [
      ...copies(1, "human.militiaRecruit", "common"),
      ...copies(1, "human.gateWarden", "uncommon"),
      ...copies(1, "human.shieldbearer", "common"),
      ...copies(2, "human.crossbowGuard", "common"),
      ...copies(2, "human.halberdier", "common"),
      ...copies(1, "human.dawnCleric", "uncommon"),
      ...copies(2, "human.riverKnight", "uncommon"),
      ...copies(1, "human.ironBulwark", "rare"),
      ...copies(1, "orc.scrapRaider", "uncommon"),
      ...copies(1, "warrior.warDrums", "common"),
      ...copies(1, "warrior.shieldWall", "common"),
      ...copies(1, "warrior.spearThrow", "uncommon"),
    ],
  },
  {
    id: "raiders",
    classId: "mage",
    deck: [
      ...copies(1, "orc.badlandPup", "common"),
      ...copies(1, "orc.packStalker", "uncommon"),
      ...copies(2, "orc.scrapRaider", "common"),
      ...copies(2, "orc.emberShaman", "common"),
      ...copies(1, "orc.howlingCharger", "uncommon"),
      ...copies(2, "orc.skyreaver", "uncommon"),
      ...copies(2, "orc.tuskBrute", "common"),
      ...copies(1, "orc.warchiefGrukka", "epic"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(1, "mage.frostBolt", "common"),
      ...copies(1, "mage.flameWave", "uncommon"),
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
