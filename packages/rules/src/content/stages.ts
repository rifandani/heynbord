import { copies } from "./decks";
import type { StageDefinition } from "./schema";

const NO_GEAR = { weapon: 0, armor: 0, trinket: 0, banner: 0 };

/**
 * The Stages of Region 1 (Hearthvale), with its Boss Stage (GDD 3.3, 8.1).
 * docs/game/14-campaign-stages.md gives the design of each Stage. All Stages
 * have 3 Lanes (ADR-0010). The first Stages 1-1 to 1-3 have all 3 Lanes open
 * (GDD 8.3). Stage 1-1 is the Tutorial.
 */
export const STAGES: readonly StageDefinition[] = [
  {
    id: "1-1",
    region: 1,
    number: 1,
    boss: false,
    recommendedLevel: 1,
    firstWinCard: { cardId: "human.militiaRecruit", rank: "common" },
    closedLanes: [],
    enemy: {
      heroHp: 6,
      classId: "warrior",
      gear: NO_GEAR,
      deck: [
        ...copies(2, "human.militiaRecruit", "common"),
        ...copies(2, "orc.badlandRunt", "common"),
        ...copies(3, "human.shieldbearer", "common"),
        ...copies(2, "orc.scrapRaider", "common"),
        ...copies(1, "human.halberdier", "common"),
      ],
      startUnits: [],
    },
  },
  {
    id: "1-2",
    region: 1,
    number: 2,
    boss: false,
    recommendedLevel: 1,
    firstWinCard: { cardId: "orc.scrapRaider", rank: "common" },
    closedLanes: [],
    enemy: {
      heroHp: 32,
      classId: "warrior",
      gear: { weapon: 2, armor: 0, trinket: 0, banner: 2 },
      deck: [
        ...copies(2, "orc.badlandRunt", "common"),
        ...copies(2, "orc.scrapRaider", "common"),
        ...copies(1, "human.militiaRecruit", "common"),
        ...copies(1, "human.crossbowGuard", "uncommon"),
        ...copies(2, "orc.howlingCharger", "uncommon"),
        ...copies(1, "warrior.warDrums", "common"),
      ],
      startUnits: [],
    },
  },
  {
    id: "1-3",
    region: 1,
    number: 3,
    boss: false,
    recommendedLevel: 2,
    firstWinCard: { cardId: "orc.emberShaman", rank: "common" },
    closedLanes: [],
    enemy: {
      heroHp: 38,
      classId: "mage",
      gear: { weapon: 3, armor: 0, trinket: 3, banner: 3 },
      deck: [
        ...copies(1, "orc.badlandRunt", "common"),
        ...copies(2, "orc.emberShaman", "common"),
        ...copies(1, "human.shieldbearer", "common"),
        ...copies(2, "orc.skyreaver", "uncommon"),
        ...copies(2, "mage.frostBolt", "common"),
        ...copies(1, "mage.fireball", "common"),
        ...copies(1, "mage.flameWave", "uncommon"),
      ],
      startUnits: [],
    },
  },
  {
    // The Toll Gate: walls with Armor, Pivot and Retaliation.
    id: "1-4",
    region: 1,
    number: 4,
    boss: false,
    recommendedLevel: 2,
    firstWinCard: { cardId: "human.shieldbearer", rank: "common" },
    closedLanes: [],
    enemy: {
      heroHp: 38,
      classId: "warrior",
      gear: NO_GEAR,
      deck: [
        ...copies(3, "human.shieldbearer", "common"),
        ...copies(2, "human.gateWarden", "uncommon"),
        ...copies(2, "human.halberdier", "common"),
        ...copies(1, "orc.scrapRaider", "common"),
        ...copies(2, "human.crossbowGuard", "uncommon"),
      ],
      startUnits: [],
    },
  },
  {
    // The Outlaw Camp: the first Units at the start.
    id: "1-5",
    region: 1,
    number: 5,
    boss: false,
    recommendedLevel: 3,
    firstWinCard: { cardId: "human.crossbowGuard", rank: "common" },
    closedLanes: [],
    enemy: {
      heroHp: 42,
      classId: "warrior",
      gear: { weapon: 3, armor: 0, trinket: 3, banner: 3 },
      deck: [
        ...copies(2, "human.militiaRecruit", "common"),
        ...copies(1, "orc.scrapRaider", "common"),
        ...copies(1, "orc.badlandRunt", "uncommon"),
        ...copies(1, "human.crossbowGuard", "common"),
        ...copies(2, "human.halberdier", "common"),
        ...copies(3, "human.shieldbearer", "common"),
        ...copies(1, "warrior.spearThrow", "uncommon"),
      ],
      startUnits: [
        {
          cardId: "human.militiaRecruit",
          rank: "common",
          lane: 0,
          position: 9,
        },
        {
          cardId: "human.shieldbearer",
          rank: "common",
          lane: 1,
          position: 9,
        },
        {
          cardId: "human.crossbowGuard",
          rank: "common",
          lane: 2,
          position: 10,
        },
      ],
    },
  },
  {
    // The Old Watchtower: ranged Units behind a front line, and Mage spells.
    id: "1-6",
    region: 1,
    number: 6,
    boss: false,
    recommendedLevel: 3,
    firstWinCard: { cardId: "human.dawnCleric", rank: "uncommon" },
    closedLanes: [],
    enemy: {
      heroHp: 42,
      classId: "mage",
      gear: { weapon: 1, armor: 0, trinket: 1, banner: 1 },
      deck: [
        ...copies(2, "human.halberdier", "common"),
        ...copies(2, "orc.emberShaman", "common"),
        ...copies(2, "human.shieldbearer", "rare"),
        ...copies(1, "human.dawnCleric", "uncommon"),
        ...copies(1, "human.militiaRecruit", "common"),
        ...copies(2, "mage.frostBolt", "common"),
        ...copies(1, "mage.fireball", "common"),
      ],
      startUnits: [],
    },
  },
  {
    // The Sellsword Camp: a rush of Charge, Flying and fast Runners.
    id: "1-7",
    region: 1,
    number: 7,
    boss: false,
    recommendedLevel: 4,
    firstWinCard: { cardId: "orc.howlingCharger", rank: "uncommon" },
    closedLanes: [],
    enemy: {
      heroHp: 34,
      classId: "warrior",
      gear: { weapon: 3, armor: 0, trinket: 2, banner: 3 },
      deck: [
        ...copies(1, "human.halberdier", "common"),
        ...copies(1, "orc.emberShaman", "common"),
        ...copies(2, "orc.scrapRaider", "uncommon"),
        ...copies(1, "orc.packStalker", "rare"),
        ...copies(1, "orc.howlingCharger", "uncommon"),
        ...copies(1, "orc.howlingCharger", "rare"),
        ...copies(2, "orc.skyreaver", "uncommon"),
        ...copies(1, "orc.skyreaver", "rare"),
        ...copies(1, "orc.tuskBrute", "rare"),
        ...copies(1, "warrior.spearThrow", "uncommon"),
      ],
      startUnits: [],
    },
  },
  {
    // The Rockfall Pass: the first Closed Lane. The outlaws clear the rocks.
    id: "1-8",
    region: 1,
    number: 8,
    boss: false,
    recommendedLevel: 4,
    firstWinCard: { cardId: "human.gateWarden", rank: "uncommon" },
    closedLanes: [{ lane: 0, opensOnTurn: 5 }],
    enemy: {
      heroHp: 40,
      classId: "warrior",
      gear: { weapon: 3, armor: 0, trinket: 3, banner: 3 },
      deck: [
        ...copies(1, "human.shieldbearer", "common"),
        ...copies(1, "human.shieldbearer", "rare"),
        ...copies(2, "human.halberdier", "common"),
        ...copies(1, "human.halberdier", "uncommon"),
        ...copies(1, "human.crossbowGuard", "uncommon"),
        ...copies(1, "human.gateWarden", "uncommon"),
        ...copies(1, "orc.scrapRaider", "rare"),
        ...copies(2, "orc.howlingCharger", "uncommon"),
        ...copies(1, "orc.tuskBrute", "rare"),
        ...copies(1, "warrior.shieldWall", "common"),
      ],
      startUnits: [
        {
          cardId: "human.militiaRecruit",
          rank: "common",
          lane: 1,
          position: 11,
        },
      ],
    },
  },
  {
    // The Great Oak: the final test before the Boss, a mix of all the above.
    id: "1-9",
    region: 1,
    number: 9,
    boss: false,
    recommendedLevel: 5,
    firstWinCard: { cardId: "human.riverKnight", rank: "uncommon" },
    closedLanes: [],
    enemy: {
      heroHp: 36,
      classId: "mage",
      gear: NO_GEAR,
      deck: [
        ...copies(1, "human.crossbowGuard", "uncommon"),
        ...copies(1, "human.crossbowGuard", "common"),
        ...copies(1, "orc.emberShaman", "common"),
        ...copies(1, "human.halberdier", "common"),
        ...copies(1, "human.shieldbearer", "common"),
        ...copies(2, "orc.skyreaver", "uncommon"),
        ...copies(1, "orc.scrapRaider", "common"),
        ...copies(1, "human.militiaRecruit", "common"),
        ...copies(1, "human.dawnCleric", "uncommon"),
        ...copies(1, "human.riverKnight", "uncommon"),
        ...copies(1, "mage.frostBolt", "common"),
        ...copies(1, "mage.fireball", "common"),
      ],
      startUnits: [],
    },
  },
  {
    id: "1-10",
    region: 1,
    number: 10,
    boss: true,
    recommendedLevel: 5,
    firstWinCard: { cardId: "human.ironBulwark", rank: "epic" },
    closedLanes: [],
    enemy: {
      heroHp: 44,
      classId: "warrior",
      gear: { weapon: 1, armor: 0, trinket: 0, banner: 1 },
      deck: [
        ...copies(3, "human.militiaRecruit", "common"),
        ...copies(1, "human.gateWarden", "rare"),
        ...copies(2, "human.shieldbearer", "common"),
        ...copies(1, "human.crossbowGuard", "common"),
        ...copies(1, "human.crossbowGuard", "uncommon"),
        ...copies(2, "human.halberdier", "uncommon"),
        ...copies(1, "human.ironBulwark", "epic"),
        ...copies(1, "warrior.spearThrow", "uncommon"),
        ...copies(1, "warrior.shieldWall", "uncommon"),
        ...copies(1, "warrior.warDrums", "common"),
      ],
      // Boss rule (GDD 8.1): the Baron's bodyguard, an Epic Shieldbearer,
      // starts on the Board as a Start Unit.
      startUnits: [
        {
          cardId: "human.shieldbearer",
          rank: "epic",
          lane: 1,
          position: 10,
        },
      ],
    },
  },
];

/** The Stages of `stages` that come before `stage`, in Stage order: Region, then number. */
export const stagesBefore = (
  stage: StageDefinition,
  stages: readonly StageDefinition[]
): StageDefinition[] =>
  stages
    .filter(
      (earlier) =>
        earlier.region < stage.region ||
        (earlier.region === stage.region && earlier.number < stage.number)
    )
    .toSorted((a, b) => a.region - b.region || a.number - b.number);

export const getStage = (stageId: string): StageDefinition => {
  const stage = STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) {
    throw new Error(`Unknown Stage: ${stageId}`);
  }
  return stage;
};
