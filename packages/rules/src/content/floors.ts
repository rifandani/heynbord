import { getCard } from "./cards";
import { deckSizeLimits } from "./decks";
import {
  assertFloor,
  floorFirstWinReward,
  HEYNSPIRE_BOSS_FLOOR_EVERY,
  HEYNSPIRE_FLOORS,
  isBossFloor,
} from "./heynspire";
import { firstWinXp, playerLevelForXp } from "./player-levels";
import { RANKS } from "./ranks";
import type {
  ClassId,
  DeckEntry,
  FloorDefinition,
  GearLevels,
  RaceId,
  RankId,
  StageDefinition,
} from "./schema";
import { STAGES } from "./stages";

/**
 * A Floor template (ADR-0040): the enemy of the normal Floors with the same
 * last digit. It is written by hand. The strength curve gives the Ranks, the
 * Hero HP, the Gear and the Deck size for each Floor number.
 */
export interface FloorTemplate {
  /** The key of the enemy name in the Message Catalogs. */
  readonly id: string;
  /** Most Creature Cards are of this Race. No Battle rule reads it. */
  readonly race: RaceId;
  readonly classId: ClassId;
  /**
   * The card ID of each copy, at its Base Rank. Only cards of the Campaign
   * card pool, and no Epic Skill Card. The curve gives 1 more Rank step to
   * the first copies, so the order is part of the template.
   */
  readonly deck: readonly string[];
}

/** The Start Unit of a Boss Floor: a Start Unit of its Boss Stage. */
interface FloorStartUnit {
  readonly cardId: string;
  readonly rank: RankId;
  readonly lane: number;
  readonly position: number;
}

/**
 * A Boss Floor template: a Campaign Boss with a new Floor Deck. It keeps the
 * Class and the Start Units of its Boss Stage, and it has no Boss Rules
 * (ADR-0038).
 */
export interface BossFloorTemplate extends FloorTemplate {
  /** The Boss Stage of the Boss. */
  readonly stageId: string;
  readonly startUnits: readonly FloorStartUnit[];
}

/** `count` copies of one card, for a template Deck. */
const cards = (count: number, cardId: string): string[] =>
  Array.from({ length: count }, () => cardId);

/**
 * The 9 Floor templates. Floors 1 to 9 use templates 1 to 9, Floors 11 to
 * 19 use them again, and so on (ADR-0040). The enemy names are drafts (PRD
 * open question 1). A search with the sim tuned the cards and the order of
 * each Deck (docs/game/14-campaign-stages.md 8.3). A new order changes the
 * Rank steps and the shuffle, so run `bun run sim floor 1000` after it.
 */
export const FLOOR_TEMPLATES: readonly FloorTemplate[] = [
  // Floor 1: the Human guard at the gate of the tower.
  {
    id: "spireWardenHolt",
    race: "human",
    classId: "warrior",
    deck: [
      ...cards(1, "warrior.shoulderCharge"),
      ...cards(2, "human.riverKnight"),
      ...cards(1, "warrior.callToArms"),
      ...cards(1, "human.dawnCleric"),
      ...cards(1, "human.gateWarden"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(1, "warrior.callToArms"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "human.crossbowGuard"),
      ...cards(1, "warrior.warDrums"),
      ...cards(1, "human.crossbowGuard"),
      ...cards(3, "human.militiaRecruit"),
      ...cards(1, "warrior.groundSlam"),
      ...cards(2, "human.dawnCleric"),
      ...cards(2, "orc.scrapRaider"),
      ...cards(1, "human.riverKnight"),
      ...cards(1, "warrior.groundSlam"),
      ...cards(1, "warrior.spearThrow"),
      ...cards(1, "warrior.shoulderCharge"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(1, "warrior.exposeWeakness"),
      ...cards(1, "warrior.warDrums"),
      ...cards(1, "warrior.cleave"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "human.gateWarden"),
    ],
  },
  // Floor 2: an Orc fire caller of the Red Mesas.
  {
    id: "emberchiefRazka",
    race: "orc",
    classId: "mage",
    deck: [
      ...cards(1, "orc.scrapRaider"),
      ...cards(1, "orc.packStalker"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(3, "orc.emberShaman"),
      ...cards(1, "orc.cinderhornBreaker"),
      ...cards(1, "mage.spark"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(1, "orc.bonestakePalisade"),
      ...cards(2, "orc.skyreaver"),
      ...cards(1, "orc.mesaPitFighter"),
      ...cards(1, "mage.fireball"),
      ...cards(1, "orc.tuskBrute"),
      ...cards(1, "orc.bonestakePalisade"),
      ...cards(1, "orc.cinderhornBreaker"),
      ...cards(1, "orc.badlandRunt"),
      ...cards(2, "orc.warhowlerDrummer"),
      ...cards(1, "orc.mesaPitFighter"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(2, "mage.fireball"),
      ...cards(1, "mage.spark"),
      ...cards(1, "orc.badlandRunt"),
      ...cards(1, "orc.packStalker"),
      ...cards(1, "mage.wildfire"),
      ...cards(1, "orc.packStalker"),
      ...cards(1, "mage.frostBolt"),
    ],
  },
  // Floor 3: a Goblin trap maker with many cheap tricks.
  {
    id: "trapmasterKrink",
    race: "goblin",
    classId: "ranger",
    deck: [
      ...cards(3, "goblin.ankleSnatcher"),
      ...cards(1, "goblin.sidestepShiv"),
      ...cards(1, "goblin.junkSlinger"),
      ...cards(1, "goblin.scrapPlateGuard"),
      ...cards(2, "goblin.tunnelSaboteur"),
      ...cards(1, "goblin.greaseTrapper"),
      ...cards(1, "goblin.bombLobber"),
      ...cards(1, "goblin.fuseRunner"),
      ...cards(1, "goblin.greaseTrapper"),
      ...cards(1, "goblin.tunnelSaboteur"),
      ...cards(1, "goblin.rocketBarrelRider"),
      ...cards(1, "ranger.harryingShot"),
      ...cards(1, "ranger.pinningShot"),
      ...cards(1, "goblin.bombLobber"),
      ...cards(1, "goblin.fuseRunner"),
      ...cards(1, "goblin.greaseTrapper"),
      ...cards(1, "goblin.spyglassSniper"),
      ...cards(1, "goblin.junkSlinger"),
      ...cards(2, "goblin.sidestepShiv"),
      ...cards(1, "goblin.rocketBarrelRider"),
      ...cards(1, "ranger.quickShot"),
      ...cards(1, "ranger.barbedArrow"),
      ...cards(1, "ranger.harryingShot"),
      ...cards(1, "goblin.mineSapper"),
      ...cards(1, "goblin.rocketBarrelRider"),
      ...cards(1, "ranger.venomArrow"),
    ],
  },
  // Floor 4: an Elf healer of the Glowcap groves.
  {
    id: "groveSisterMyrra",
    race: "elf",
    classId: "priest",
    deck: [
      ...cards(2, "elf.brambleDuelist"),
      ...cards(1, "elf.fernwingCourier"),
      ...cards(2, "elf.acornTender"),
      ...cards(1, "elf.thornlineArcher"),
      ...cards(1, "priest.blessingOfLight"),
      ...cards(1, "elf.brambleDuelist"),
      ...cards(1, "priest.smite"),
      ...cards(3, "elf.canopySkirmisher"),
      ...cards(1, "elf.mosspitcherLookout"),
      ...cards(1, "elf.amberwingDart"),
      ...cards(1, "elf.gladeTurnblade"),
      ...cards(1, "elf.mosspitcherLookout"),
      ...cards(1, "elf.gladeTurnblade"),
      ...cards(1, "elf.fernwingCourier"),
      ...cards(1, "elf.rootboundGuard"),
      ...cards(1, "elf.elderreedDartmaster"),
      ...cards(1, "elf.dewkeeper"),
      ...cards(1, "elf.thornlineArcher"),
      ...cards(1, "priest.penance"),
      ...cards(1, "elf.brambleNest"),
      ...cards(1, "priest.prayerOfHealing"),
      ...cards(1, "priest.cleanse"),
      ...cards(1, "priest.radiantStrike"),
      ...cards(1, "elf.dewkeeper"),
      ...cards(1, "priest.radiantStrike"),
      ...cards(1, "priest.prayerOfHealing"),
    ],
  },
  // Floor 5: a Feral hunter with the beasts of the Thornwood.
  {
    id: "houndmasterBrokk",
    race: "feral",
    classId: "ranger",
    deck: [
      ...cards(1, "ranger.longShot"),
      ...cards(2, "feral.bristlebackBoar"),
      ...cards(1, "feral.caveTroll"),
      ...cards(1, "feral.cragRhino"),
      ...cards(1, "ranger.warningShot"),
      ...cards(1, "feral.frostfangLynx"),
      ...cards(1, "feral.bristlebackBoar"),
      ...cards(1, "feral.cragLizard"),
      ...cards(1, "ranger.huntersFocus"),
      ...cards(1, "feral.frostElkMatriarch"),
      ...cards(1, "ranger.warningShot"),
      ...cards(2, "feral.cragLizard"),
      ...cards(1, "feral.caveBear"),
      ...cards(1, "feral.frostfangLynx"),
      ...cards(1, "feral.caveBear"),
      ...cards(1, "feral.frostfangLynx"),
      ...cards(1, "ranger.huntersFocus"),
      ...cards(1, "feral.avalancheYeti"),
      ...cards(1, "feral.boulderTortoise"),
      ...cards(1, "ranger.skybreaker"),
      ...cards(1, "feral.cragRhino"),
      ...cards(1, "feral.caveBear"),
      ...cards(1, "ranger.barbedArrow"),
      ...cards(1, "ranger.venomArrow"),
      ...cards(1, "ranger.barbedArrow"),
      ...cards(1, "feral.frostElkMatriarch"),
      ...cards(1, "ranger.skybreaker"),
      ...cards(1, "ranger.huntersFocus"),
    ],
  },
  // Floor 6: an Undead captain of the Hollow Marches.
  {
    id: "bonecaptainRusk",
    race: "undead",
    classId: "warrior",
    deck: [
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "undead.winterMaw"),
      ...cards(1, "undead.chatteringCohort"),
      ...cards(2, "undead.graveyardDrudge"),
      ...cards(1, "warrior.spearThrow"),
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "undead.rimeEyeReaper"),
      ...cards(1, "warrior.spearThrow"),
      ...cards(1, "undead.chatteringCohort"),
      ...cards(1, "undead.ossuaryPiper"),
      ...cards(1, "undead.graveBellTender"),
      ...cards(1, "undead.backwatchBailiff"),
      ...cards(1, "undead.chatteringCohort"),
      ...cards(1, "undead.hushbow"),
      ...cards(1, "undead.ossuaryPiper"),
      ...cards(1, "undead.graveyardDrudge"),
      ...cards(1, "undead.rimeEyeReaper"),
      ...cards(1, "undead.coffinLidSkater"),
      ...cards(1, "warrior.shieldBash"),
      ...cards(1, "undead.hushbow"),
      ...cards(1, "undead.coffinLancer"),
      ...cards(1, "undead.graveBellTender"),
      ...cards(2, "undead.paleGalloper"),
      ...cards(1, "warrior.groundSlam"),
      ...cards(1, "warrior.warDrums"),
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "warrior.callToArms"),
      ...cards(1, "undead.hushbow"),
    ],
  },
  // Floor 7: a Human priest with Elf archers, the old allies of Hearthvale.
  {
    id: "lightbearerAnselm",
    race: "human",
    classId: "priest",
    deck: [
      ...cards(1, "elf.seedwindShepherd"),
      ...cards(1, "elf.brambleNest"),
      ...cards(1, "elf.seedwindShepherd"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "human.dawnCleric"),
      ...cards(1, "human.gateWarden"),
      ...cards(1, "human.dawnCleric"),
      ...cards(1, "elf.amberwingDart"),
      ...cards(1, "human.militiaRecruit"),
      ...cards(1, "elf.brambleDuelist"),
      ...cards(1, "priest.blessingOfLight"),
      ...cards(1, "elf.gladeTurnblade"),
      ...cards(1, "human.crossbowGuard"),
      ...cards(1, "elf.brambleNest"),
      ...cards(1, "elf.mosspitcherLookout"),
      ...cards(1, "priest.sanctuary"),
      ...cards(1, "elf.acornTender"),
      ...cards(1, "priest.blessingOfLight"),
      ...cards(1, "elf.thornlineArcher"),
      ...cards(1, "priest.sanctuary"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "human.militiaRecruit"),
      ...cards(1, "priest.radiantStrike"),
      ...cards(1, "priest.smite"),
      ...cards(1, "elf.brambleDuelist"),
      ...cards(1, "priest.radiantStrike"),
      ...cards(1, "priest.smite"),
      ...cards(1, "elf.dewkeeper"),
      ...cards(1, "human.militiaRecruit"),
      ...cards(1, "elf.thornlineArcher"),
    ],
  },
  // Floor 8: an Orc war boss with a Goblin crew.
  {
    id: "warbossGnash",
    race: "orc",
    classId: "warrior",
    deck: [
      ...cards(1, "orc.scrapRaider"),
      ...cards(1, "goblin.scrapPlateGuard"),
      ...cards(1, "orc.badlandRunt"),
      ...cards(1, "goblin.scrapPlateGuard"),
      ...cards(1, "orc.badlandRunt"),
      ...cards(1, "orc.packStalker"),
      ...cards(1, "warrior.spearThrow"),
      ...cards(1, "goblin.mineSapper"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(1, "goblin.bombLobber"),
      ...cards(1, "goblin.mineSapper"),
      ...cards(1, "orc.howlingCharger"),
      ...cards(1, "goblin.ankleSnatcher"),
      ...cards(1, "orc.packStalker"),
      ...cards(1, "warrior.groundSlam"),
      ...cards(1, "orc.mesaPitFighter"),
      ...cards(1, "goblin.scrapPlateGuard"),
      ...cards(1, "orc.badlandRunt"),
      ...cards(1, "goblin.bombLobber"),
      ...cards(1, "warrior.shieldBash"),
      ...cards(1, "orc.warhowlerDrummer"),
      ...cards(1, "goblin.mineSapper"),
      ...cards(1, "warrior.spearThrow"),
      ...cards(1, "orc.tuskBrute"),
      ...cards(1, "orc.warhowlerDrummer"),
      ...cards(1, "warrior.shoulderCharge"),
      ...cards(1, "warrior.shieldBash"),
      ...cards(1, "goblin.rocketBarrelRider"),
      ...cards(2, "goblin.junkSlinger"),
    ],
  },
  // Floor 9: an Undead frost witch with the frost beasts of the hills.
  {
    id: "rimecallerIsolde",
    race: "undead",
    classId: "mage",
    deck: [
      ...cards(1, "mage.frostBolt"),
      ...cards(1, "undead.rimeEyeReaper"),
      ...cards(1, "feral.cragLizard"),
      ...cards(1, "undead.lanternWidow"),
      ...cards(1, "undead.winterMaw"),
      ...cards(1, "mage.frostShards"),
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "mage.thunderstorm"),
      ...cards(1, "undead.chatteringCohort"),
      ...cards(1, "undead.graveyardDrudge"),
      ...cards(1, "feral.bristlebackBoar"),
      ...cards(1, "mage.spark"),
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "undead.chatteringCohort"),
      ...cards(1, "undead.paleGalloper"),
      ...cards(1, "mage.arcLightning"),
      ...cards(1, "undead.hushbow"),
      ...cards(1, "mage.spark"),
      ...cards(1, "mage.wildfire"),
      ...cards(1, "feral.rimebreathDrake"),
      ...cards(1, "undead.coffinLidSkater"),
      ...cards(1, "mage.spark"),
      ...cards(1, "mage.frostBolt"),
      ...cards(1, "feral.frostElkMatriarch"),
      ...cards(1, "undead.ossuaryPiper"),
      ...cards(1, "feral.boulderTortoise"),
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "feral.frostfangLynx"),
      ...cards(1, "undead.backwatchBailiff"),
      ...cards(1, "feral.rimebreathDrake"),
    ],
  },
];

/**
 * The 5 Boss Floors: the Campaign Bosses come back in Region order (Floors
 * 10, 20, 30, 40 and 50). Each one has a new Floor Deck, and it keeps the
 * Class and the Start Units of its Boss Stage. The sim tuned each Deck, in
 * its order, as for `FLOOR_TEMPLATES`.
 */
export const BOSS_FLOOR_TEMPLATES: readonly BossFloorTemplate[] = [
  // Floor 10: the bandit lord of Hearthvale, with his outlaws.
  {
    id: "baronBrassbelly",
    stageId: "1-10",
    race: "human",
    classId: "warrior",
    startUnits: [
      { cardId: "human.shieldbearer", rank: "epic", lane: 1, position: 10 },
    ],
    deck: [
      ...cards(1, "orc.mesaPitFighter"),
      ...cards(2, "orc.howlingCharger"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "human.shieldbearer"),
      ...cards(1, "orc.badlandRunt"),
      ...cards(1, "human.riverKnight"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "human.crossbowGuard"),
      ...cards(1, "human.riverKnight"),
      ...cards(1, "human.shieldbearer"),
      ...cards(1, "human.halberdier"),
      ...cards(1, "orc.tuskBrute"),
      ...cards(1, "human.militiaRecruit"),
      ...cards(1, "human.crossbowGuard"),
      ...cards(1, "human.militiaRecruit"),
      ...cards(1, "human.shieldbearer"),
      ...cards(1, "warrior.shieldWall"),
      ...cards(1, "human.dawnCleric"),
      ...cards(1, "human.gateWarden"),
      ...cards(2, "orc.scrapRaider"),
      ...cards(1, "human.dawnCleric"),
      ...cards(1, "warrior.warDrums"),
      ...cards(1, "human.militiaRecruit"),
      ...cards(1, "orc.scrapRaider"),
      ...cards(1, "human.crossbowGuard"),
      ...cards(1, "human.gateWarden"),
      ...cards(1, "orc.tuskBrute"),
      ...cards(1, "human.ironBulwark"),
    ],
  },
  // Floor 20: the Goblin king of the Red Mesas, with his Orc warchief.
  {
    id: "bossSnikkit",
    stageId: "2-10",
    race: "goblin",
    classId: "ranger",
    startUnits: [
      {
        cardId: "orc.warchiefGrukka",
        rank: "epic",
        lane: 1,
        position: 10,
      },
      {
        cardId: "goblin.junkBarricade",
        rank: "uncommon",
        lane: 0,
        position: 10,
      },
      {
        cardId: "goblin.junkBarricade",
        rank: "uncommon",
        lane: 2,
        position: 10,
      },
    ],
    deck: [
      ...cards(1, "goblin.tunnelSaboteur"),
      ...cards(1, "orc.packStalker"),
      ...cards(1, "goblin.mineSapper"),
      ...cards(1, "goblin.rocketBarrelRider"),
      ...cards(1, "orc.emberShaman"),
      ...cards(1, "goblin.junkSlinger"),
      ...cards(1, "goblin.ankleSnatcher"),
      ...cards(1, "goblin.mineSapper"),
      ...cards(2, "goblin.ankleSnatcher"),
      ...cards(1, "ranger.pinningShot"),
      ...cards(1, "ranger.huntersFocus"),
      ...cards(1, "goblin.sidestepShiv"),
      ...cards(1, "ranger.skybreaker"),
      ...cards(1, "goblin.greaseTrapper"),
      ...cards(1, "goblin.bombLobber"),
      ...cards(1, "goblin.rocketBarrelRider"),
      ...cards(1, "goblin.junkSlinger"),
      ...cards(2, "goblin.scrapPlateGuard"),
      ...cards(2, "orc.howlingCharger"),
      ...cards(1, "goblin.sidestepShiv"),
      ...cards(1, "goblin.tunnelSaboteur"),
      ...cards(1, "ranger.quickShot"),
      ...cards(2, "ranger.harryingShot"),
      ...cards(1, "goblin.sidestepShiv"),
      ...cards(1, "goblin.greaseTrapper"),
      ...cards(1, "ranger.longShot"),
    ],
  },
  // Floor 30: the Elf lady of the Glowcap Hollows.
  {
    id: "ladyGlimmerbough",
    stageId: "3-10",
    race: "elf",
    classId: "priest",
    startUnits: [
      {
        cardId: "elf.canopyVinewarden",
        rank: "epic",
        lane: 1,
        position: 10,
      },
      { cardId: "elf.brambleNest", rank: "uncommon", lane: 1, position: 9 },
    ],
    deck: [
      ...cards(1, "goblin.fuseRunner"),
      ...cards(1, "elf.elderreedDartmaster"),
      ...cards(1, "goblin.ankleSnatcher"),
      ...cards(1, "elf.amberwingDart"),
      ...cards(3, "elf.brambleDuelist"),
      ...cards(1, "elf.mosspitcherLookout"),
      ...cards(1, "goblin.junkSlinger"),
      ...cards(1, "priest.cleanse"),
      ...cards(2, "priest.radiantStrike"),
      ...cards(1, "elf.acornTender"),
      ...cards(1, "elf.dewkeeper"),
      ...cards(1, "goblin.junkWalker"),
      ...cards(1, "goblin.bombLobber"),
      ...cards(1, "elf.gladeTurnblade"),
      ...cards(1, "priest.unbrokenVow"),
      ...cards(1, "elf.dewkeeper"),
      ...cards(1, "elf.mosspitcherLookout"),
      ...cards(1, "elf.seedwindShepherd"),
      ...cards(1, "elf.brambleNest"),
      ...cards(1, "elf.gladeTurnblade"),
      ...cards(1, "elf.brambleNest"),
      ...cards(1, "priest.blessingOfLight"),
      ...cards(1, "goblin.fuseRunner"),
      ...cards(1, "elf.gladeTurnblade"),
      ...cards(1, "elf.fernwingCourier"),
      ...cards(1, "elf.canopySkirmisher"),
      ...cards(1, "priest.penance"),
    ],
  },
  // Floor 40: the forest giant of the Thornwood.
  {
    id: "oldBramble",
    stageId: "4-10",
    race: "feral",
    classId: "warrior",
    startUnits: [
      {
        cardId: "feral.mountainColossus",
        rank: "epic",
        lane: 2,
        position: 10,
      },
      { cardId: "elf.brambleNest", rank: "uncommon", lane: 0, position: 9 },
    ],
    deck: [
      ...cards(1, "feral.woollyMammoth"),
      ...cards(1, "feral.avalancheYeti"),
      ...cards(1, "feral.cragRhino"),
      ...cards(1, "elf.amberwingDart"),
      ...cards(1, "feral.caveBear"),
      ...cards(1, "feral.rimebreathDrake"),
      ...cards(2, "feral.bristlebackBoar"),
      ...cards(1, "feral.boulderTortoise"),
      ...cards(1, "feral.cragRhino"),
      ...cards(1, "feral.boulderTortoise"),
      ...cards(1, "feral.caveBear"),
      ...cards(1, "warrior.shieldWall"),
      ...cards(1, "feral.cragLizard"),
      ...cards(1, "warrior.callToArms"),
      ...cards(1, "feral.tailsweepBasilisk"),
      ...cards(2, "feral.caveTroll"),
      ...cards(2, "elf.brambleDuelist"),
      ...cards(2, "elf.thornlineArcher"),
      ...cards(2, "warrior.cleave"),
      ...cards(1, "warrior.callToArms"),
      ...cards(1, "warrior.exposeWeakness"),
      ...cards(1, "feral.cragRhino"),
      ...cards(1, "warrior.shieldBash"),
      ...cards(1, "warrior.groundSlam"),
      ...cards(1, "feral.webSpitter"),
    ],
  },
  // Floor 50: the ruler of the Undead, at the top of the tower.
  {
    id: "queenMarrow",
    stageId: "5-10",
    race: "undead",
    classId: "mage",
    startUnits: [
      { cardId: "undead.boneRampart", rank: "epic", lane: 1, position: 9 },
      { cardId: "undead.hushbow", rank: "common", lane: 1, position: 10 },
    ],
    deck: [
      ...cards(1, "undead.paleGalloper"),
      ...cards(1, "undead.winterMaw"),
      ...cards(1, "undead.rimeEyeReaper"),
      ...cards(2, "undead.lanternWidow"),
      ...cards(2, "undead.coffinLancer"),
      ...cards(1, "feral.rimebreathDrake"),
      ...cards(1, "feral.woollyMammoth"),
      ...cards(1, "undead.rimeEyeReaper"),
      ...cards(1, "undead.winterMaw"),
      ...cards(1, "feral.rimebreathDrake"),
      ...cards(1, "undead.paleGalloper"),
      ...cards(1, "undead.graveBellTender"),
      ...cards(1, "mage.wildfire"),
      ...cards(2, "undead.graveyardDrudge"),
      ...cards(2, "undead.rattleknife"),
      ...cards(2, "undead.chatteringCohort"),
      ...cards(1, "undead.ossuaryPiper"),
      ...cards(2, "mage.frostBolt"),
      ...cards(1, "mage.frostShards"),
      ...cards(1, "mage.arcLightning"),
      ...cards(1, "mage.thunderstorm"),
      ...cards(1, "undead.rattleknife"),
      ...cards(1, "mage.arcLightning"),
      ...cards(1, "mage.spark"),
    ],
  },
];

/** The strength of the enemy of a Floor, before the Deck size. */
interface TierStrength {
  /** The Rank steps above the Base Rank of each copy. */
  readonly rankSteps: number;
  /** The first copies of the template Deck that get 1 more Rank step. */
  readonly extraStepCopies: number;
  readonly heroHp: number;
  readonly gear: GearLevels;
}

const NO_GEAR: GearLevels = { weapon: 0, armor: 0, trinket: 0, banner: 0 };

/**
 * The strength curve of the normal Floors (ADR-0040), on Floors 1 to 9. One
 * Rank step on all copies changes a win rate by 40 to 80 points, so the curve
 * gives 1 Rank step to the first copies of the template Deck only. The
 * difficulty does not go up: from Floors 1 to 9 to Floors 41 to 49, the
 * Player gets about 4 levels and 2 or 3 Gear levels, 0 to 3 points of win
 * rate. Thus each later tier of 10 Floors only adds `HERO_HP_PER_TIER`.
 * docs/game/14-campaign-stages.md 8 has the sim results.
 */
const NORMAL_FLOOR_STRENGTH: TierStrength = {
  rankSteps: 0,
  extraStepCopies: 12,
  heroHp: 50,
  gear: NO_GEAR,
};

/** The Hero HP that each tier of 10 Floors adds to a normal Floor. */
const HERO_HP_PER_TIER = 2;

/**
 * The strength of each Boss Floor, from Floor 10. Each tier has 1 Boss with
 * its own Deck, so the sim tunes each row with its Boss.
 */
const BOSS_FLOOR_STRENGTH: readonly TierStrength[] = [
  // Floor 10: Baron Brassbelly.
  { rankSteps: 0, extraStepCopies: 13, heroHp: 64, gear: NO_GEAR },
  // Floor 20: Boss Snikkit.
  { rankSteps: 0, extraStepCopies: 15, heroHp: 62, gear: NO_GEAR },
  // Floor 30: Lady Glimmerbough. Her Epic Canopy Vinewarden behind a Bramble
  // Nest is her power, so she has less HP.
  { rankSteps: 0, extraStepCopies: 10, heroHp: 41, gear: NO_GEAR },
  // Floor 40: the Old Bramble.
  { rankSteps: 0, extraStepCopies: 13, heroHp: 58, gear: NO_GEAR },
  // Floor 50: Queen Marrow.
  { rankSteps: 0, extraStepCopies: 12, heroHp: 56, gear: NO_GEAR },
];

/**
 * The Recommended level of each Floor, from Floor 1: the Player level on the
 * First-try Path before it. The path wins all Stages, then the earlier Floors
 * (Economy 1.2).
 */
export const floorRecommendedLevels = (
  stages: readonly Pick<StageDefinition, "region" | "boss">[] = STAGES
): readonly number[] => {
  let xp = stages.reduce((total, stage) => total + firstWinXp(stage), 0);
  return Array.from({ length: HEYNSPIRE_FLOORS }, (_, index) => {
    const level = playerLevelForXp(xp);
    xp += floorFirstWinReward(index + 1).xp;
    return level;
  });
};

const RECOMMENDED_LEVELS = floorRecommendedLevels();

/** The strength of a Floor, from the strength curve (ADR-0040). */
export interface FloorStrength extends TierStrength {
  /** The Deck size: the largest that the Recommended level allows (GDD 6). */
  readonly deckSize: number;
}

/** The strength of Floor `floor` (1 to 50), from the strength curve. */
export const floorStrength = (floor: number): FloorStrength => {
  assertFloor(floor);
  const tier = Math.floor((floor - 1) / HEYNSPIRE_BOSS_FLOOR_EVERY);
  const level = RECOMMENDED_LEVELS[floor - 1];
  const boss = BOSS_FLOOR_STRENGTH[tier];
  /* v8 ignore next -- @preserve */
  if (level === undefined || boss === undefined) {
    throw new RangeError(`No strength for Floor ${floor}`);
  }
  const strength = isBossFloor(floor)
    ? boss
    : {
        ...NORMAL_FLOOR_STRENGTH,
        heroHp: NORMAL_FLOOR_STRENGTH.heroHp + HERO_HP_PER_TIER * tier,
      };
  return { ...strength, deckSize: deckSizeLimits(level).max };
};

/** `rank` with `steps` more Rank steps, at most Legendary. */
const stepRank = (rank: RankId, steps: number): RankId =>
  RANKS[Math.min(RANKS.indexOf(rank) + steps, RANKS.length - 1)] ?? rank;

/** The template of Floor `floor`: a Boss Floor template or a Floor template. */
const floorTemplate = (floor: number): FloorTemplate | BossFloorTemplate => {
  assertFloor(floor);
  const template = isBossFloor(floor)
    ? BOSS_FLOOR_TEMPLATES[floor / HEYNSPIRE_BOSS_FLOOR_EVERY - 1]
    : FLOOR_TEMPLATES[(floor % HEYNSPIRE_BOSS_FLOOR_EVERY) - 1];
  /* v8 ignore next -- @preserve */
  if (template === undefined) {
    throw new RangeError(`No template for Floor ${floor}`);
  }
  return template;
};

/**
 * Makes Floor `floor` from its template and the strength curve (ADR-0040):
 * the first `deckSize` copies of the template Deck, each `rankSteps` Ranks
 * above its Base Rank, and the first `extraStepCopies` copies 1 Rank more.
 */
const makeFloor = (floor: number): FloorDefinition => {
  const template = floorTemplate(floor);
  const strength = floorStrength(floor);
  const deck = template.deck
    .slice(0, strength.deckSize)
    .map((cardId, index): DeckEntry => {
      const steps =
        strength.rankSteps + (index < strength.extraStepCopies ? 1 : 0);
      return { cardId, rank: stepRank(getCard(cardId).baseRank, steps) };
    });
  return {
    id: `floor-${floor}`,
    number: floor,
    boss: isBossFloor(floor),
    /* v8 ignore next -- @preserve */
    recommendedLevel: RECOMMENDED_LEVELS[floor - 1] ?? 1,
    enemy: {
      id: template.id,
      heroHp: strength.heroHp,
      classId: template.classId,
      gear: strength.gear,
      deck,
      startUnits: "startUnits" in template ? template.startUnits : [],
    },
  };
};

/** The 50 Floors of Heynspire, from Floor 1. Floor n is always the same Floor. */
export const FLOORS: readonly FloorDefinition[] = Array.from(
  { length: HEYNSPIRE_FLOORS },
  (_, index) => makeFloor(index + 1)
);

/** The definition of Floor `floor` (1 to 50). It throws a RangeError for another number. */
export const getFloor = (floor: number): FloorDefinition => {
  assertFloor(floor);
  // SAFETY: `assertFloor` checks that `floor` is 1 to 50, and `FLOORS` has
  // an item for each of them.
  return FLOORS[floor - 1] as FloorDefinition;
};
