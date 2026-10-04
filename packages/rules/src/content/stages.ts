import { copies } from "./decks";
import type { StageDefinition } from "./schema";

const NO_GEAR = { weapon: 0, armor: 0, trinket: 0, banner: 0 };

/**
 * The Stages of the Battle slice: the first Stages of Region 1 (Hearthvale)
 * and its Boss Stage (GDD 3.3, 8.1). All Stages have 3 Lanes (ADR-0010). The
 * first Stages 1-1 to 1-3 have all 3 Lanes open (GDD 8.3). Stage 1-1 is the
 * Tutorial.
 */
export const STAGES: readonly StageDefinition[] = [
  {
    id: "1-1",
    region: 1,
    number: 1,
    boss: false,
    closedLanes: [],
    enemy: {
      heroHp: 18,
      classId: "warrior",
      gear: NO_GEAR,
      deck: [
        ...copies(3, "human.militiaRecruit", "common"),
        ...copies(2, "orc.badlandPup", "common"),
        ...copies(2, "human.shieldbearer", "common"),
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
    closedLanes: [],
    enemy: {
      heroHp: 32,
      classId: "warrior",
      gear: { weapon: 2, armor: 0, trinket: 0, banner: 2 },
      deck: [
        ...copies(2, "orc.badlandPup", "common"),
        ...copies(3, "orc.scrapRaider", "common"),
        ...copies(2, "human.militiaRecruit", "common"),
        ...copies(2, "human.crossbowGuard", "uncommon"),
        ...copies(2, "orc.howlingCharger", "uncommon"),
        ...copies(1, "orc.tuskBrute", "common"),
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
    closedLanes: [],
    enemy: {
      heroHp: 38,
      classId: "mage",
      gear: { weapon: 3, armor: 0, trinket: 3, banner: 3 },
      deck: [
        ...copies(2, "orc.badlandPup", "common"),
        ...copies(2, "orc.emberShaman", "uncommon"),
        ...copies(2, "human.shieldbearer", "uncommon"),
        ...copies(2, "human.halberdier", "uncommon"),
        ...copies(2, "orc.skyreaver", "uncommon"),
        ...copies(1, "orc.tuskBrute", "common"),
        ...copies(2, "mage.frostBolt", "common"),
        ...copies(1, "mage.fireball", "common"),
        ...copies(1, "mage.flameWave", "uncommon"),
      ],
      startUnits: [],
    },
  },
  {
    id: "1-10",
    region: 1,
    number: 10,
    boss: true,
    closedLanes: [],
    enemy: {
      heroHp: 40,
      classId: "warrior",
      gear: { weapon: 3, armor: 0, trinket: 2, banner: 3 },
      deck: [
        ...copies(2, "human.militiaRecruit", "common"),
        ...copies(1, "human.gateWarden", "uncommon"),
        ...copies(2, "human.shieldbearer", "uncommon"),
        ...copies(2, "human.crossbowGuard", "common"),
        ...copies(2, "human.halberdier", "uncommon"),
        ...copies(2, "human.riverKnight", "uncommon"),
        ...copies(1, "orc.tuskBrute", "common"),
        ...copies(1, "warrior.spearThrow", "uncommon"),
        ...copies(1, "warrior.shieldWall", "uncommon"),
        ...copies(1, "warrior.warDrums", "common"),
      ],
      // Boss rule (GDD 8.1): the Baron's bodyguard starts on the Board.
      startUnits: [
        {
          cardId: "human.ironBulwark",
          rank: "uncommon",
          lane: 1,
          position: 10,
        },
      ],
    },
  },
];

export const getStage = (stageId: string): StageDefinition => {
  const stage = STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) {
    throw new Error(`Unknown Stage: ${stageId}`);
  }
  return stage;
};
