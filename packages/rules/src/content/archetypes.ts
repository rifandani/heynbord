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
 *
 * Tunnel Rats and Wild Hunt are provisional diagnostic Decks (Archetypes 2.1):
 * Creature Cards only, until the Ranger and Priest Skill Cards exist. Vanguard
 * Full and Raiders Full are diagnostic Decks with the full Human and Orc sets,
 * so that a Matchup tests each card. The results of a diagnostic Deck are for
 * review, and they do not gate release.
 */
export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "vanguard",
    kind: "main",
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
    kind: "main",
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
      ...copies(1, "feral.avalancheYeti", "rare"),
      ...copies(1, "feral.woollyMammoth", "rare"),
      ...copies(1, "feral.mountainColossus", "epic"),
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
      ...copies(1, "human.marshalElianVoss", "epic"),
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
      ...copies(1, "orc.badlandPup", "common"),
      ...copies(2, "orc.scrapRaider", "common"),
      ...copies(1, "orc.dusthideBrawler", "common"),
      ...copies(1, "orc.cinderhornRam", "uncommon"),
      ...copies(1, "orc.warhowlerDrummer", "uncommon"),
      ...copies(1, "orc.skyreaver", "uncommon"),
      ...copies(1, "orc.ashspitHunter", "rare"),
      ...copies(1, "orc.mesaPitFighter", "rare"),
      ...copies(1, "orc.pyreaxeRavager", "rare"),
      ...copies(1, "orc.warbandStandardBearer", "epic"),
      ...copies(1, "mage.fireball", "common"),
      ...copies(1, "mage.frostBolt", "common"),
      ...copies(1, "mage.flameWave", "uncommon"),
    ],
  },
];
