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
 * a starter Deck: it is a full Deck of the same style, with at most 14 cards
 * and within the Countdown Limit of level 5 (35, ADR-0021). A Deck of slow
 * cards thus has fewer cards.
 *
 * Tunnel Rats, Wild Hunt and Thornwatch are provisional diagnostic Decks
 * (Archetypes 2.1): Creature Cards only, until the Ranger and Priest Skill
 * Cards exist. Vanguard
 * Full and Raiders Full are diagnostic Decks with the full Human and Orc sets,
 * so that a Matchup tests most cards. Human Heavy (Countdown 3 to 4) and Human
 * Light (Countdown 1 to 3) are diagnostic Decks of one Race, so that a Matchup
 * tests the Power Budget for each Countdown (ADR-0020). The results of a
 * diagnostic Deck are for review, and they do not gate release.
 */
export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "vanguard",
    kind: "main",
    classId: "warrior",
    deck: [
      ...copies(1, "human.townBarricade", "common"),
      ...copies(1, "human.militiaRecruit", "common"),
      ...copies(1, "human.gateWarden", "uncommon"),
      ...copies(1, "human.shieldbearer", "common"),
      ...copies(2, "human.crossbowGuard", "common"),
      ...copies(2, "human.halberdier", "common"),
      ...copies(1, "human.dawnCleric", "uncommon"),
      ...copies(2, "human.riverKnight", "uncommon"),
      ...copies(1, "warrior.warDrums", "common"),
      ...copies(1, "warrior.shieldWall", "common"),
      ...copies(1, "warrior.spearThrow", "uncommon"),
    ],
  },
  {
    id: "raiders",
    kind: "main",
    classId: "mage",
    deck: [
      ...copies(1, "orc.badlandRunt", "common"),
      ...copies(1, "orc.packStalker", "uncommon"),
      ...copies(2, "orc.scrapRaider", "common"),
      ...copies(2, "orc.emberShaman", "common"),
      ...copies(1, "orc.howlingCharger", "uncommon"),
      ...copies(2, "orc.skyreaver", "uncommon"),
      ...copies(1, "orc.cinderhornBreaker", "uncommon"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(1, "mage.frostBolt", "common"),
      ...copies(1, "mage.flameWave", "uncommon"),
    ],
  },
  {
    id: "tunnelRats",
    kind: "diagnostic",
    classId: "ranger",
    deck: [
      ...copies(1, "goblin.ankleSnatcher", "common"),
      ...copies(2, "goblin.fuseRunner", "common"),
      ...copies(2, "goblin.junkSlinger", "common"),
      ...copies(2, "goblin.tunnelSaboteur", "common"),
      ...copies(1, "goblin.scrapPlateGuard", "common"),
      ...copies(1, "goblin.junkBarricade", "uncommon"),
      ...copies(2, "goblin.greaseTrapper", "uncommon"),
      ...copies(1, "goblin.rocketBarrelRider", "uncommon"),
      ...copies(1, "goblin.mineSapper", "rare"),
      ...copies(1, "goblin.grandGearjammer", "epic"),
    ],
  },
  {
    id: "wildHunt",
    kind: "diagnostic",
    classId: "priest",
    deck: [
      ...copies(2, "feral.bristlebackBoar", "common"),
      ...copies(1, "feral.cragLizard", "common"),
      ...copies(1, "feral.frostfangLynx", "common"),
      ...copies(2, "feral.caveBear", "common"),
      ...copies(1, "feral.webSpitter", "common"),
      ...copies(1, "feral.caveTroll", "uncommon"),
      ...copies(2, "feral.cragRhino", "uncommon"),
      ...copies(1, "feral.frostElkMatriarch", "uncommon"),
    ],
  },
  {
    id: "thornwatch",
    kind: "diagnostic",
    classId: "ranger",
    deck: [
      ...copies(2, "elf.rootboundGuard", "common"),
      ...copies(2, "elf.brambleDuelist", "common"),
      ...copies(2, "elf.fernwingCourier", "common"),
      ...copies(2, "elf.mosspitcherLookout", "common"),
      ...copies(2, "elf.acornTender", "common"),
      ...copies(1, "elf.thornlineArcher", "uncommon"),
      ...copies(1, "elf.dewkeeper", "uncommon"),
      ...copies(1, "elf.brambleNest", "uncommon"),
    ],
  },
  {
    id: "vanguardFull",
    kind: "diagnostic",
    classId: "warrior",
    deck: [
      ...copies(1, "human.townBarricade", "common"),
      ...copies(1, "human.militiaRecruit", "common"),
      ...copies(1, "human.shieldbearer", "common"),
      ...copies(2, "human.crossbowGuard", "common"),
      ...copies(1, "human.halberdier", "common"),
      ...copies(1, "human.bridgePikeman", "uncommon"),
      ...copies(1, "human.bannerChaplain", "uncommon"),
      ...copies(1, "human.kingsCourier", "rare"),
      ...copies(1, "human.dawnReliquary", "rare"),
      ...copies(1, "warrior.warDrums", "common"),
      ...copies(1, "warrior.shieldWall", "common"),
      ...copies(1, "warrior.spearThrow", "uncommon"),
    ],
  },
  {
    id: "raidersFull",
    kind: "diagnostic",
    classId: "mage",
    deck: [
      ...copies(1, "orc.badlandRunt", "common"),
      ...copies(2, "orc.scrapRaider", "common"),
      ...copies(1, "orc.dusthideBrawler", "common"),
      ...copies(1, "orc.cinderhornBreaker", "uncommon"),
      ...copies(1, "orc.warhowlerDrummer", "uncommon"),
      ...copies(1, "orc.skyreaver", "uncommon"),
      ...copies(1, "orc.ashspitHunter", "rare"),
      ...copies(1, "orc.mesaPitFighter", "rare"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(1, "mage.frostBolt", "common"),
      ...copies(1, "mage.flameWave", "uncommon"),
    ],
  },
  {
    id: "humanHeavy",
    kind: "diagnostic",
    classId: "warrior",
    deck: [
      ...copies(2, "human.halberdier", "common"),
      ...copies(1, "human.gateWarden", "uncommon"),
      ...copies(1, "human.bridgePikeman", "uncommon"),
      ...copies(1, "human.dawnCleric", "uncommon"),
      ...copies(2, "human.riverKnight", "uncommon"),
      ...copies(2, "human.kingsCourier", "rare"),
      ...copies(1, "human.paviseArbalist", "rare"),
    ],
  },
  {
    id: "humanLight",
    kind: "diagnostic",
    classId: "warrior",
    deck: [
      ...copies(3, "human.militiaRecruit", "common"),
      ...copies(1, "human.townBarricade", "common"),
      ...copies(3, "human.shieldbearer", "common"),
      ...copies(3, "human.crossbowGuard", "common"),
      ...copies(2, "human.halberdier", "common"),
      ...copies(1, "human.bannerChaplain", "uncommon"),
      ...copies(1, "human.dawnCleric", "uncommon"),
    ],
  },
];
