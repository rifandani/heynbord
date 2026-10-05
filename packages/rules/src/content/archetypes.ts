import { copies } from "./decks";
import type { Archetype } from "./schema";

/**
 * The player level of a Matchup by default. The Archetypes have the maximum
 * Deck size at this level (GDD 6).
 */
export const MATCHUP_LEVEL = 5;

/**
 * The Archetypes (GDD 13): one reference Deck for each style of play. A
 * Matchup plays each Archetype against each Archetype.
 * docs/game/08-archetypes.md gives the style of each one. An Archetype is not
 * a starter Deck: it is a full Deck of the same style, with 14 cards.
 */
export const ARCHETYPES: readonly Archetype[] = [
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
      ...copies(1, "human.ironBulwark", "epic"),
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
      ...copies(1, "orc.tuskBrute", "common"),
      ...copies(1, "orc.warchiefGrukka", "epic"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(1, "mage.frostBolt", "common"),
      ...copies(1, "mage.flameWave", "uncommon"),
    ],
  },
];
