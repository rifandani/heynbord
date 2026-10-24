import { describe, expect, it } from "vitest";

import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { CARDS, getCard } from "../content/cards";
import { DUNGEON_REWARDS, getDungeon } from "../content/dungeons";
import { EXPEDITION_DURATIONS, HOUR_MS } from "../content/expeditions";
import { getFloor } from "../content/floors";
import { NO_FORGE_STONES } from "../content/forge-stones";
import { HEYNSPIRE_FLOORS } from "../content/heynspire";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import { STAGES } from "../content/stages";
import { UNLOCK_LEVELS } from "../content/unlocks";
import { EXTRACT_ESSENCE, FUSE_ESSENCE } from "../content/workshop";
import { dungeonCardPool } from "../profile/dungeon-result";
import { discoveredCards } from "../profile/packs";
import { AT_BERTH } from "../profile/seaport";
import { findStage, stageCardPool } from "../profile/stage-result";
import {
  campaignSweep,
  claimAchievements,
  collectExpeditionAt,
  dispatchExpeditionAt,
  dungeonSweep,
  economyStages,
  expeditionPerDay,
  expectedFloorGear,
  expectedGear,
  expectedGearAtLevel,
  heynstoneLedger,
  judgePacing,
  INCOME_KINDS,
  MAX_REPEAT_BATTLES,
  newEconomyPlayer,
  nextExpedition,
  NO_INCOME,
  openCargoes,
  PACING_TARGETS,
  pacingTarget,
  PLAY_STYLES,
  simulateEconomy,
  simulateEconomyRun,
  spend,
} from "./economy";
import type {
  CheckpointId,
  CheckpointTargets,
  EconomyPlayer,
  PacingTargetId,
  PacingTargets,
  PacingVerdict,
} from "./economy";
import { NO_GEAR } from "./simulate";

/** 20 Forge Stones of each tier: all that the 4 Gear items need. */
const ALL_FORGE_STONES = {
  common: 20,
  uncommon: 20,
  rare: 20,
  epic: 20,
  legendary: 20,
};

/**
 * A Player at `level` with `coin` and `forgeStones`, the free Pack and the
 * 4th Deck slot done.
 */
const playerAt = (
  level: number,
  coin: number,
  forgeStones = ALL_FORGE_STONES
): EconomyPlayer => {
  const player = newEconomyPlayer(1);
  player.xp = PLAYER_LEVEL_XP[level - 1] ?? 0;
  player.coin = coin;
  player.forgeStones = forgeStones;
  player.freePackOpened = true;
  player.deckSlots = 4;
  return player;
};

const gearSum = (player: EconomyPlayer) =>
  Object.values(player.gear).reduce((total, level) => total + level, 0);

/** The copies of `after` that are not in `before`. */
const addedCopies = (before: Collection, after: Collection): Collection =>
  after.flatMap((entry) => {
    const copies = entry.copies - ownedCopies(before, entry.cardId, entry.rank);
    return copies > 0 ? [{ ...entry, copies }] : [];
  });

const countCopies = (collection: Collection) =>
  collection.reduce((total, entry) => total + entry.copies, 0);

describe("economyStages (Economy 7.1)", () => {
  it("uses the real Stages of all 5 Regions", () => {
    expect(economyStages().map((stage) => stage.id)).toEqual(
      STAGES.map((stage) => stage.id)
    );
  });

  it("adds 10 planned Stages to each Region up to Region 5, with the Boss Stage last", () => {
    const real = STAGES.filter((stage) => stage.region < 5);
    const stages = economyStages(real);
    expect(stages).toHaveLength(50);
    expect(stages.slice(0, real.length).map((stage) => stage.id)).toEqual(
      real.map((stage) => stage.id)
    );
    expect(
      stages.filter((stage) => stage.boss).map((stage) => stage.id)
    ).toEqual(["1-10", "2-10", "3-10", "4-10", "5-10"]);
    expect(stages.at(-1)?.firstWinCard).toBeNull();
  });

  it("gives the planned Stages the First-try Path levels of Economy 1.2", () => {
    expect(economyStages().map((stage) => stage.recommendedLevel)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10, 10, 11,
      11, 12, 12, 13, 13, 13, 14, 15, 15, 16, 16, 17, 17, 17, 18, 18, 19, 20,
      20, 20, 21, 21, 21, 21, 22, 22, 22,
    ]);
  });
});

describe("simulateEconomyRun (Economy 7.1)", () => {
  it("gives the same result for the same seed", () => {
    const options = { playStyle: "balanced", seed: 7, maxBattles: 60 } as const;
    expect(simulateEconomyRun(options)).toEqual(simulateEconomyRun(options));
  });

  it("follows the First-try Path with a win chance of 100%", () => {
    const run = simulateEconomyRun({
      playStyle: "collector",
      seed: 1,
      firstTry: true,
    });
    expect(run.levelsAtStages).toEqual(run.stageLevels);
    expect(run.checkpoints.region1).toMatchObject({ battles: 10, level: 6 });
    expect(run.checkpoints.region2).toMatchObject({ battles: 20, level: 10 });
    expect(run.checkpoints.region3).toMatchObject({ battles: 30, level: 15 });
    expect(run.checkpoints.region4).toMatchObject({ battles: 40, level: 20 });
    expect(run.checkpoints.region5).toMatchObject({ battles: 50, level: 23 });
    expect(run.checkpoints.floor50).toMatchObject({ battles: 100, level: 28 });
    expect(run.checkpoints.level30?.level).toBe(30);
    expect(run.stuck).toBe(false);
  });

  it("has no repeat Battles and no Sweeps on the First-try run, and a win gives 2 Stars", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 1,
      firstTry: true,
    });
    expect(run.end).toMatchObject({
      stars: 100,
      threeStarStages: 0,
      repeatBattles: 0,
      campaignTicketsUsed: 0,
      dungeonTicketsUsed: 0,
    });
    expect(run.capped).toBe(false);
  });

  it("with a 3-Star chance of 1, opens all 3 Star chests of each Region and uses the Campaign Sweep Tickets", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 1,
      fixedWinChance: 1,
      fixedThreeStarChance: 1,
    });
    // A Sweep gives no XP (ADR-0047), so the levels are the levels of the
    // First-try Path.
    for (const [index, [id, level]] of (
      [
        ["region1", 6],
        ["region2", 10],
        ["region3", 15],
        ["region4", 20],
        ["region5", 23],
      ] as const
    ).entries()) {
      expect(run.checkpoints[id]).toMatchObject({
        battles: (index + 1) * 10,
        level,
        stars: (index + 1) * 30,
        threeStarStages: (index + 1) * 10,
        repeatBattles: 0,
      });
    }
    expect(run.checkpoints.floor50).toMatchObject({ battles: 100, level: 28 });
    // From the first 3-Star Stage, the Player Sweeps after each Battle: 2
    // Tickets for each of the 10 wins of Region 1.
    expect(run.checkpoints.region1).toMatchObject({
      campaignTicketsUsed: 20,
      campaignSweepTickets: 0,
    });
  });

  it("does not count a Sweep as a Battle or as time", () => {
    const run = simulateEconomyRun({
      playStyle: "collector",
      seed: 1,
      fixedWinChance: 1,
      fixedThreeStarChance: 1,
    });
    const snap = run.checkpoints.region3;
    expect(snap?.campaignTicketsUsed).toBeGreaterThan(0);
    expect(snap).toMatchObject({ battles: 30, hours: 4 });
  });

  it(`with a 3-Star chance of 0, stops each Stage after ${MAX_REPEAT_BATTLES} repeat Battles and then leaves the Region`, () => {
    const run = simulateEconomyRun({
      playStyle: "upgrader",
      seed: 1,
      fixedWinChance: 1,
      fixedThreeStarChance: 0,
    });
    // Region 1: 10 first wins, then 10 repeat Battles of each Stage.
    expect(run.checkpoints.region1).toMatchObject({
      battles: 10 + 10 * MAX_REPEAT_BATTLES,
      stars: 20,
      threeStarStages: 0,
      repeatBattles: 10 * MAX_REPEAT_BATTLES,
      cappedStages: 10,
      // 2 Tickets for each win, and no 3-Star Stage to Sweep.
      campaignTicketsUsed: 0,
      campaignSweepTickets: 2 * (10 + 10 * MAX_REPEAT_BATTLES),
    });
    expect(run.checkpoints.region2).toMatchObject({
      battles: 20 * (1 + MAX_REPEAT_BATTLES),
      cappedStages: 20,
    });
    expect(run.capped).toBe(true);
  });

  it("goes on to the next Stage of the repeat Battles after a 3-Star win", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 4,
      fixedWinChance: 1,
    });
    const snap = run.checkpoints.region1;
    expect(snap?.threeStarStages).toBe(10);
    expect(snap?.stars).toBe(30);
    expect(snap?.battles).toBe(10 + (snap?.repeatBattles ?? 0));
    expect(snap?.repeatBattles).toBeGreaterThan(0);
  });

  it("gives the loss Coin and XP, and the Player plays the Stage again", () => {
    const run = simulateEconomyRun({
      playStyle: "collector",
      seed: 1,
      fixedWinChance: 0,
      maxBattles: 3,
    });
    // Stage 1-1: a win is 60 Coin and 40 XP, so a loss is 6 Coin and 10 XP.
    expect(run.end).toMatchObject({ battles: 3, coin: 18, level: 1 });
    expect(run.levelsAtStages).toHaveLength(1);
    expect(run.checkpoints.region1).toBeNull();
  });

  it("stops at the Battle cap, and the Player is stuck", () => {
    const run = simulateEconomyRun({
      playStyle: "upgrader",
      seed: 2,
      maxBattles: 5,
    });
    expect(run.end.battles).toBe(5);
    expect(run.stuck).toBe(true);
    expect(run.checkpoints.level30).toBeNull();
  });

  it("stops when the Player is at level 30 and won Floor 50", () => {
    const run = simulateEconomyRun({ playStyle: "balanced", seed: 3 });
    expect(run.stuck).toBe(false);
    expect(run.end).toMatchObject({ level: 30, floorsWon: HEYNSPIRE_FLOORS });
    expect(run.end.battles).toBe(
      Math.max(
        run.checkpoints.level30?.battles ?? 0,
        run.checkpoints.floor50?.battles ?? 0
      )
    );
  });

  it("at level 30 before Floor 50, goes on to the Floor 50 win with Dungeon detours of 3 Battles", () => {
    // With a low win chance, the Player gets to level 30 before Floor 50.
    const run = simulateEconomyRun({
      playStyle: "collector",
      seed: 1,
      fixedWinChance: 0.45,
    });
    expect(run.checkpoints.level30?.floorsWon).toBeLessThan(HEYNSPIRE_FLOORS);
    expect(run.stuck).toBe(false);
    expect(run.end.floorsWon).toBe(HEYNSPIRE_FLOORS);
  });
});

describe("expectedGear (ADR-0033)", () => {
  const gear = expectedGear();

  it("gives no Gear before the Gear unlock level", () => {
    const early = STAGES.filter(
      (stage) => stage.recommendedLevel < UNLOCK_LEVELS.gear
    );
    expect(early.length).toBeGreaterThan(0);
    for (const stage of early) {
      expect(gear.get(stage.id)).toEqual(NO_GEAR);
    }
  });

  it("gives 10 levels before Stage 1-9 and 11 before 1-10: 1 Common Forge Stone for each first win and 2 from the 10-Star chest (ADR-0036)", () => {
    expect(gear.get("1-9")).toEqual({
      weapon: 3,
      armor: 3,
      trinket: 2,
      banner: 2,
    });
    expect(gear.get("1-10")).toEqual({
      weapon: 3,
      armor: 3,
      trinket: 3,
      banner: 2,
    });
  });

  it("stops at level 5 in Region 2: Regions 1 and 2 give only Common Forge Stones", () => {
    expect(gear.get("2-10")).toEqual({
      weapon: 5,
      armor: 5,
      trinket: 5,
      banner: 5,
    });
  });

  it("comes from the Gear of the First-try runs before each Stage", () => {
    const run = simulateEconomyRun({
      playStyle: "collector",
      seed: 1,
      firstTry: true,
    });
    expect(run.gearAtStages).toHaveLength(run.levelsAtStages.length);
    const ids = economyStages().map((stage) => stage.id);
    expect([...gear.keys()]).toEqual(ids);
    expect(run.gearAtStages[ids.indexOf("1-10")]).toEqual(gear.get("1-10"));
  });
});

describe("expectedGearAtLevel (ADR-0033)", () => {
  const gear = expectedGear();

  it("is the Expected Gear of the first Stage at that level", () => {
    expect(expectedGearAtLevel(10)).toEqual(gear.get("3-1"));
    expect(expectedGearAtLevel(20)).toEqual(gear.get("5-1"));
  });

  it("goes on after the Campaign to level 30, with more Gear than at the last Stage", () => {
    const last = gear.get("5-10");
    const top = expectedGearAtLevel(30);
    const sum = (levels: typeof top) =>
      levels.weapon + levels.armor + levels.trinket + levels.banner;
    expect(last).toBeDefined();
    expect(sum(top)).toBeGreaterThan(sum(last ?? NO_GEAR));
  });
});

describe("expectedFloorGear (ADR-0033, ADR-0040)", () => {
  const gear = expectedFloorGear();
  const sum = (levels: (typeof gear)[number]) =>
    levels.weapon + levels.armor + levels.trinket + levels.banner;

  it("comes from the Gear of the First-try runs before each Floor", () => {
    const run = simulateEconomyRun({
      playStyle: "collector",
      seed: 1,
      firstTry: true,
    });
    expect(run.gearAtFloors).toHaveLength(HEYNSPIRE_FLOORS);
    expect(gear).toHaveLength(HEYNSPIRE_FLOORS);
    expect(sum(gear[0] ?? NO_GEAR)).toBeGreaterThanOrEqual(
      sum(run.gearAtFloors[0] ?? NO_GEAR)
    );
  });

  it("starts at the Gear of the Recommended level of Floor 1, and never goes down", () => {
    expect(gear[0]).toEqual(expectedGearAtLevel(getFloor(1).recommendedLevel));
    for (const [index, levels] of gear.entries()) {
      expect(sum(levels)).toBeGreaterThanOrEqual(
        sum(gear[index - 1] ?? NO_GEAR)
      );
    }
  });
});

describe("spend (Economy 7.1)", () => {
  it("first opens the free Peddler Pack at level 2, and saves for the 4th Deck slot", () => {
    const player = newEconomyPlayer(1);
    player.xp = PLAYER_LEVEL_XP[5] ?? 0;
    player.coin = 499;
    spend(player, "balanced");
    expect(player.freePackOpened).toBe(true);
    expect(player.packsOpened).toBe(1);
    expect(player.deckSlots).toBe(3);
    expect(player.coin).toBe(499);
    expect(gearSum(player)).toBe(0);

    player.coin = 500;
    spend(player, "balanced");
    expect(player.deckSlots).toBe(4);
    expect(player.coin).toBe(0);
  });

  it("Collector: a Pack first, then Gear, and no Combine below Epic", () => {
    const player = playerAt(6, 900);
    spend(player, "collector");
    expect(player.packsOpened).toBe(1);
    expect(player.combines).toBe(0);
    // 400 Coin: 4 × 5 to level 1, 4 × 15, 4 × 30 and 4 × 50 to level 4.
    expect(gearSum(player)).toBe(16);
    expect(player.forgeStones.common).toBe(4);
    expect(player.coin).toBe(0);
  });

  it("Upgrader: Combine each pair, then Gear up to the level × 2 ÷ 3, then Packs", () => {
    const player = playerAt(6, 900);
    spend(player, "upgrader");
    // The Vanguard pairs: 3 Common pairs (3 × 50), then 1 Uncommon pair (200).
    expect(player.combines).toBe(4);
    // 550 Coin: 4 × 5, 4 × 15, 4 × 30 and 4 × 50 to level 4, the cap at
    // level 6. 150 Coin stays: less than a Peddler Pack.
    expect(gearSum(player)).toBe(16);
    expect(Math.max(...Object.values(player.gear))).toBe(4);
    expect(player.packsOpened).toBe(0);
    expect(player.coin).toBe(150);
  });

  it("Balanced: one Pack and two Gear levels in turn, then Combine", () => {
    const player = playerAt(6, 950);
    spend(player, "balanced");
    expect(player.packsOpened).toBe(1);
    // 450 Coin: 4 × 5, 4 × 15, 4 × 30 and 4 × 50 to level 4. Then a Common
    // pair (50) of the 50 Coin.
    expect(gearSum(player)).toBe(16);
    expect(player.combines).toBe(1);
    expect(player.coin).toBe(0);
  });

  it("needs a Forge Stone of the tier of the new level for each Gear level (ADR-0036)", () => {
    const player = playerAt(6, 900, {
      common: 3,
      uncommon: 20,
      rare: 20,
      epic: 20,
      legendary: 20,
    });
    spend(player, "collector");
    // 3 Common Forge Stones: 3 items to level 1. Uncommon cannot replace Common.
    expect(gearSum(player)).toBe(3);
    expect(player.forgeStones).toEqual({
      common: 0,
      uncommon: 20,
      rare: 20,
      epic: 20,
      legendary: 20,
    });
    expect(player.coin).toBe(400 - 3 * 5);
  });

  it("goes to the next priority when the Forge Stone is missing", () => {
    const player = playerAt(6, 1250, NO_FORGE_STONES);
    spend(player, "upgrader");
    // No Gear: the Coin after the 4 Combines (350) buys 2 Peddler Packs.
    expect(gearSum(player)).toBe(0);
    expect(player.combines).toBe(4);
    expect(player.packsOpened).toBe(2);
    expect(player.coin).toBe(200);
  });

  it("Extracts each copy above 2 of a card in the same Rank", () => {
    const player = playerAt(3, 0);
    // Vanguard has 3 Common Crossbow Guards.
    spend(player, "collector");
    expect(
      ownedCopies(player.collection, "human.crossbowGuard", "common")
    ).toBe(2);
    expect(player.essence).toBe(EXTRACT_ESSENCE.common);
  });
});

/** A Player at `level` with 3 Common Crossbow Guards and 3 Common Halberdiers. */
const withExtras = (level: number, essence: number, seed = 1) => {
  const player = playerAt(level, 0);
  player.rewardCursor.state = seed;
  player.essence = essence;
  player.collection = player.collection.map((entry) =>
    entry.cardId === "human.halberdier" ? { ...entry, copies: 3 } : entry
  );
  return player;
};

describe("spend: Fuse (Economy 3.7, 7.1)", () => {
  it("Fuses 2 Common copies above 2 in place of their Extract", () => {
    const player = withExtras(UNLOCK_LEVELS.fuse, FUSE_ESSENCE.common);
    const before = discoveredCards(player.collection);
    spend(player, "collector");
    expect(player.fuses).toBe(1);
    expect(player.extracts).toBe(0);
    expect(player.essence).toBe(0);
    expect(
      ownedCopies(player.collection, "human.crossbowGuard", "common")
    ).toBe(2);
    expect(ownedCopies(player.collection, "human.halberdier", "common")).toBe(
      2
    );
    const found = [...discoveredCards(player.collection)].filter(
      (cardId) => !before.has(cardId)
    );
    expect(found).toHaveLength(1);
    const card = getCard(found[0] ?? "");
    expect(card.kind === "creature" && card.race).toBe("human");
    expect(card.baseRank).toBe("common");
  });

  it("keeps 1 fewer copy than a Fuse uses for the next Fuse, and Extracts the others", () => {
    const player = withExtras(UNLOCK_LEVELS.fuse, FUSE_ESSENCE.common - 1);
    spend(player, "collector");
    expect(player.fuses).toBe(0);
    // 2 Common Human copies above 2: 1 stays for the next Fuse.
    expect(player.extracts).toBe(1);
    expect(player.essence).toBe(
      FUSE_ESSENCE.common - 1 + EXTRACT_ESSENCE.common
    );
    // The next copy above 2 makes a Fuse with the copy that stayed.
    player.essence = FUSE_ESSENCE.common;
    player.collection = player.collection.map((entry) =>
      entry.cardId === "human.militiaRecruit" ? { ...entry, copies: 3 } : entry
    );
    spend(player, "collector");
    expect(player.fuses).toBe(1);
    expect(player.extracts).toBe(1);
  });

  it("Extracts the copies of a Race with no card in the Fuse pool", () => {
    const player = withExtras(UNLOCK_LEVELS.fuse, 0);
    const humanCommons = CARDS.filter(
      (card) =>
        card.kind === "creature" &&
        card.race === "human" &&
        card.baseRank === "common"
    );
    player.collection = [
      ...player.collection,
      ...humanCommons
        .filter(
          (card) => ownedCopies(player.collection, card.id, "common") === 0
        )
        .map((card) => ({
          cardId: card.id,
          rank: "common" as const,
          copies: 0,
        })),
    ];
    spend(player, "collector");
    expect(player.fuses).toBe(0);
    expect(player.extracts).toBe(2);
  });

  it("does not Fuse below the unlock level", () => {
    const player = withExtras(UNLOCK_LEVELS.fuse - 1, 1000);
    spend(player, "collector");
    expect(player.fuses).toBe(0);
    expect(player.extracts).toBe(2);
  });

  it("gives the same card for the same reward random state, and moves it forward", () => {
    const first = withExtras(UNLOCK_LEVELS.fuse, FUSE_ESSENCE.common, 7);
    const second = withExtras(UNLOCK_LEVELS.fuse, FUSE_ESSENCE.common, 7);
    spend(first, "collector");
    spend(second, "collector");
    expect(second.collection).toEqual(first.collection);
    expect(first.rewardCursor.state).not.toBe(7);
  });
});

/** A Player at level 6 with an Epic pair of `cardId`, and no Forge Stones. */
const withEpicPair = (coin: number, cardId = "human.halberdier") => {
  const player = playerAt(6, coin, NO_FORGE_STONES);
  player.collection = [
    ...player.collection,
    { cardId, rank: "epic", copies: 2 },
  ];
  return player;
};

describe("spend: the Legendary Combine first (Economy 7.1)", () => {
  for (const playStyle of ["upgrader", "balanced"] as const) {
    it(`${playStyle}: keeps its Coin for the Legendary Combine and buys no Packs`, () => {
      const player = withEpicPair(3199);
      spend(player, playStyle);
      expect(player.packsOpened).toBe(0);
      expect(
        ownedCopies(player.collection, "human.halberdier", "legendary")
      ).toBe(0);
    });

    it(`${playStyle}: does the Legendary Combine first, then buys Packs`, () => {
      const player = withEpicPair(3200 + 5000);
      spend(player, playStyle);
      expect(
        ownedCopies(player.collection, "human.halberdier", "legendary")
      ).toBe(1);
      expect(player.packsOpened).toBeGreaterThan(0);
    });
  }

  it("collector: buys Packs first, and keeps no Coin for the Legendary Combine", () => {
    const player = withEpicPair(3199);
    spend(player, "collector");
    expect(player.packsOpened).toBeGreaterThan(0);
  });
});

describe("claimAchievements (Achievements 1.2, Economy 7.1)", () => {
  it("claims the Essence of the first Craft at once, and only one time", () => {
    const player = playerAt(6, 0);
    player.crafts = 1;
    claimAchievements(player);
    expect(player.essence).toBe(50);
    expect(player.completedAchievements).toEqual(["workshop.craft"]);
    expect(player.claimedAchievements).toEqual(["workshop.craft"]);
    claimAchievements(player);
    expect(player.essence).toBe(50);
  });

  it("claims the Achievements with Heynstones, but gives no Heynstones and no Coin", () => {
    const player = playerAt(30, 0);
    for (const stage of economyStages().slice(0, 10)) {
      player.bestStars.set(stage.id, 2);
    }
    player.dungeonsWon.add(1);
    player.floorsWon = 25;
    claimAchievements(player);
    expect(player.claimedAchievements).toEqual([
      "campaign.hearthvale",
      "dungeon.rootdeepMine",
      "heynspire.floor25",
      "level.max",
    ]);
    expect(player.coin).toBe(0);
    expect(player.essence).toBe(0);
  });

  it("gives the 500 Coin when the Player opened all 15 Star chests", () => {
    const player = playerAt(1, 0);
    player.openedChests.fill(3);
    claimAchievements(player);
    expect(player.claimedAchievements).toContain("campaign.allChests");
    expect(player.coin).toBe(500);
  });

  it("claims the first Craft in a run, and never a Feat", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 1,
      firstTry: true,
    });
    expect(run.claimedAchievements).toContain("workshop.craft");
    expect(
      run.claimedAchievements.filter((id) => id.startsWith("feat."))
    ).toEqual([]);
  });
});

describe("campaignSweep (Economy 2.1, 7.1)", () => {
  it("keeps the Tickets when no Stage has 3 best Stars", () => {
    const player = playerAt(1, 0);
    player.bestStars.set("1-1", 2);
    player.campaignSweepTickets = 4;
    campaignSweep(player, economyStages());
    expect(player.campaignSweepTickets).toBe(4);
    expect(player.campaignTicketsUsed).toBe(0);
  });

  it("gives one repeat-win reward for each Ticket: Coin, no XP, the Forge Stone chance and a card of the Stage card pool", () => {
    const player = playerAt(1, 0, {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    player.bestStars.set("1-4", 3);
    player.campaignSweepTickets = 50;
    const before = player.collection;
    campaignSweep(player, economyStages());
    expect(player.campaignSweepTickets).toBe(0);
    expect(player.campaignTicketsUsed).toBe(50);
    // A Region 1 Repeat win: ⅓ of 60 Coin, and no XP (ADR-0047).
    expect(player.coin).toBe(50 * 20);
    expect(player.xp).toBe(PLAYER_LEVEL_XP[0]);
    expect(player.bestStars.get("1-4")).toBe(3);
    // The fixed seed: 10% chances of 1 Common Forge Stone, 20% chances of a card.
    expect(player.forgeStones).toEqual({
      common: 4,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    const added = addedCopies(before, player.collection);
    expect(countCopies(added)).toBe(13);
    const pool = stageCardPool(findStage(STAGES, "1-4"), "warrior");
    for (const entry of added) {
      expect(pool).toContain(entry.cardId);
      expect(entry.rank).toBe(getCard(entry.cardId).baseRank);
    }
  });

  it("Sweeps the 3-Star Stage with the most Coin, and a Boss Stage on a tie", () => {
    const player = playerAt(1, 0, NO_FORGE_STONES);
    // 2-10 and 4-1 both give 66 Coin (⅓ of 200); 3-1 gives 50.
    for (const id of ["3-1", "4-1", "2-10"]) {
      player.bestStars.set(id, 3);
    }
    player.campaignSweepTickets = 50;
    campaignSweep(player, economyStages());
    expect(player.coin).toBe(50 * 66);
    // The Boss Stage 2-10 of Region 2 gives Common Forge Stones. Stage 4-1
    // gives Uncommon.
    expect(player.forgeStones.common).toBeGreaterThan(0);
    expect(player.forgeStones.uncommon).toBe(0);
  });
});

describe("dungeonSweep (Economy 2.4, 7.1)", () => {
  it("gives one repeat-win reward of the Dungeon for each Ticket, with a card of the Dungeon card pool", () => {
    const [rewards] = DUNGEON_REWARDS;
    if (rewards === undefined) {
      throw new Error("No Dungeon 1");
    }
    const player = playerAt(1, 0, {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    player.dungeonSweepTickets = 40;
    const before = player.collection;
    dungeonSweep(player, rewards);
    expect(player.dungeonSweepTickets).toBe(0);
    expect(player.dungeonTicketsUsed).toBe(40);
    expect(player.coin).toBe(40 * rewards.winCoin);
    expect(player.xp).toBe(40 * rewards.winXp);
    // The fixed seed: 25% chances of 1 Uncommon Forge Stone.
    expect(player.forgeStones).toEqual({
      common: 0,
      uncommon: 13,
      rare: 0,
      epic: 0,
      legendary: 0,
    });
    const added = addedCopies(before, player.collection);
    expect(countCopies(added)).toBe(10);
    const pool = dungeonCardPool(getDungeon("dungeon-1"), "warrior");
    for (const entry of added) {
      expect(pool).toContain(entry.cardId);
      expect(entry.rank).toBe(getCard(entry.cardId).baseRank);
    }
  });
});

describe("the Seaport of the simulated Player (Economy 2.8, 7.1)", () => {
  const DAY_MS = 24 * HOUR_MS;

  it("sends the longest open duration: with the bonus, it gives the most for each day of the play calendar", () => {
    for (const cargo of ["coin", "xp", "essence"] as const) {
      const perDay = EXPEDITION_DURATIONS.map(({ hours }) =>
        expeditionPerDay({ cargo, hours })
      );
      expect(perDay, cargo).toEqual(perDay.toSorted((x, y) => x - y));
    }
    // A voyage of 48 hours takes 2 days.
    expect(expeditionPerDay({ cargo: "coin", hours: 48 })).toBe(1656);
    expect(expeditionPerDay({ cargo: "coin", hours: 24 })).toBe(1584);
    expect(
      [8, 12, 18, 24].map((level) => nextExpedition(level, 0)?.hours)
    ).toEqual([6, 12, 24, 48]);
  });

  it("takes each open Cargo in turn", () => {
    expect(
      [0, 1, 2, 3, 4].map((voyages) => nextExpedition(30, voyages)?.cargo)
    ).toEqual(["coin", "xp", "essence", "forgeStones", "coin"]);
    expect(
      [0, 1, 2].map((voyages) => nextExpedition(12, voyages)?.cargo)
    ).toEqual(["coin", "xp", "coin"]);
    expect(nextExpedition(8, 5)).toEqual({ cargo: "coin", hours: 6 });
    expect(nextExpedition(UNLOCK_LEVELS.seaport - 1, 0)).toBeNull();
    expect(openCargoes(18).map((cargo) => cargo.id)).toEqual([
      "coin",
      "xp",
      "essence",
    ]);
  });

  it("Dispatches at the end of a session, and Collects at the start of the next", () => {
    const player = playerAt(18, 0);
    dispatchExpeditionAt(player, 0);
    expect(player.seaport).toEqual({ cargo: "coin", hours: 24, startedAt: 0 });
    expect(player.voyages).toBe(1);
    expect(collectExpeditionAt(player, DAY_MS - 1)).toBe(false);
    expect(player.coin).toBe(0);
    expect(collectExpeditionAt(player, DAY_MS)).toBe(true);
    expect(player).toMatchObject({ coin: 1584, seaport: AT_BERTH });
    const income = { coin: 1584, xp: 0, essence: 0, epicStones: 0 };
    expect(player.seaportIncome).toEqual(income);
    expect(player.income).toEqual(income);
    dispatchExpeditionAt(player, DAY_MS + HOUR_MS);
    expect(player.seaport).toMatchObject({ cargo: "xp", hours: 24 });
  });

  it("lets a ship that is not back sail on, so the Forge Stone Cargo gives its Epic Forge Stone", () => {
    const player = playerAt(24, 0, NO_FORGE_STONES);
    player.voyages = 3;
    dispatchExpeditionAt(player, 0);
    expect(player.seaport).toEqual({
      cargo: "forgeStones",
      hours: 48,
      startedAt: 0,
    });
    expect(collectExpeditionAt(player, DAY_MS + HOUR_MS)).toBe(false);
    // The next session starts after 1 hour of play and 1 more day away.
    expect(collectExpeditionAt(player, 2 * DAY_MS + 2 * HOUR_MS)).toBe(true);
    expect(player.forgeStones.epic).toBe(1);
    expect(player.seaportIncome).toEqual({
      coin: 0,
      xp: 0,
      essence: 0,
      epicStones: 1,
    });
  });

  it("loses nothing on a late Collect: the reward stops at the duration", () => {
    const player = playerAt(UNLOCK_LEVELS.seaport, 0);
    dispatchExpeditionAt(player, 0);
    expect(collectExpeditionAt(player, 9 * DAY_MS)).toBe(true);
    expect(player.coin).toBe(360);
  });

  it("Dispatches nothing below the Seaport unlock, and does not change a ship that is out", () => {
    const below = playerAt(UNLOCK_LEVELS.seaport - 1, 0);
    dispatchExpeditionAt(below, 0);
    expect(below.seaport).toEqual(AT_BERTH);
    expect(collectExpeditionAt(below, DAY_MS)).toBe(false);
    const out = playerAt(UNLOCK_LEVELS.seaport, 0);
    dispatchExpeditionAt(out, 0);
    out.xp = PLAYER_LEVEL_XP.at(-1) ?? 0;
    dispatchExpeditionAt(out, HOUR_MS);
    expect(out.seaport).toEqual({ cargo: "coin", hours: 6, startedAt: 0 });
    expect(out.voyages).toBe(1);
  });

  it("stops the XP at level 30, and counts only the XP that the Player got", () => {
    const player = playerAt(30, 0);
    player.voyages = 1;
    dispatchExpeditionAt(player, 0);
    expect(player.seaport.cargo).toBe("xp");
    collectExpeditionAt(player, 2 * DAY_MS);
    expect(player.xp).toBe(PLAYER_LEVEL_XP.at(-1));
    expect(player.seaportIncome).toEqual(NO_INCOME);
  });

  it("sends the ship between the sessions of a run from level 8, and Collects only full voyages", () => {
    const run = simulateEconomyRun({ playStyle: "balanced", seed: 1 });
    expect(run.checkpoints.region1?.level).toBeLessThan(UNLOCK_LEVELS.seaport);
    expect(run.checkpoints.region1?.seaportIncome).toEqual(NO_INCOME);
    let previous = NO_INCOME;
    for (const id of [
      "region2",
      "region3",
      "region4",
      "region5",
      "floor50",
    ] as const) {
      const snap = run.checkpoints[id];
      if (snap === null) {
        throw new Error(`The run did not get to ${id}`);
      }
      for (const kind of INCOME_KINDS) {
        expect(snap.seaportIncome[kind]).toBeGreaterThanOrEqual(previous[kind]);
        expect(snap.seaportIncome[kind]).toBeLessThanOrEqual(snap.income[kind]);
      }
      // A full Coin voyage gives at most 1,656 Coin for each day (48 hours,
      // in 2 days). The hours are the days.
      expect(snap.seaportIncome.coin).toBeLessThanOrEqual(snap.hours * 1656);
      previous = snap.seaportIncome;
    }
    expect(run.end.seaportIncome.coin).toBeGreaterThan(0);
    expect(run.end.seaportIncome.epicStones).toBeGreaterThan(0);
    // A supplement: less than a third of the Coin.
    expect(run.end.seaportIncome.coin * 3).toBeLessThan(run.end.income.coin);
  });

  it("sends no ship on the First-try run", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 1,
      firstTry: true,
    });
    expect(run.end.seaportIncome).toEqual(NO_INCOME);
    expect(run.end.income.coin).toBeGreaterThan(0);
  });
});

describe("pacingTarget (Economy 4)", () => {
  it('has no "All cards Discovered" target at Floor 50 for the Upgrader', () => {
    expect(pacingTarget("floor50", "upgrader").discoveredShare).toBeUndefined();
    expect(pacingTarget("floor50", "collector").discoveredShare).toEqual({
      min: 1,
      max: 1,
    });
  });

  it("has no Packs target at Region 3", () => {
    expect(pacingTarget("region3", "balanced").packsOpened).toBeUndefined();
  });

  it("has no First Combine target for the Collector", () => {
    expect(pacingTarget("region1", "collector").firstCombine).toBeUndefined();
    expect(pacingTarget("region1", "collector").level).toBe(6);
    expect(pacingTarget("region1", "upgrader").firstCombine).toBe(true);
    expect(pacingTarget("region1", "balanced").firstCombine).toBe(true);
  });
});

describe("simulateEconomy (Economy 7.1)", () => {
  it("reports each checkpoint and a First-try run", () => {
    const report = simulateEconomy("collector", { seeds: 3 });
    expect(report.checkpoints.region1.reached).toBe(3);
    const battles = report.checkpoints.region1.metrics?.battles;
    expect(battles?.p10).toBeLessThanOrEqual(battles?.median ?? 0);
    expect(battles?.median).toBeLessThanOrEqual(battles?.p90 ?? 0);
    expect(report.firstTry.checkpoints.region1?.battles).toBe(10);
    expect(report.firstTry.checkpoints.region5?.repeatBattles).toBe(0);
    expect(report.stuck).toBe(0);
    expect(report.level30BeforeFloor50).toBeLessThanOrEqual(3);
  });

  it("reports the Seaport income and its share of the income from all sources", () => {
    const report = simulateEconomy("upgrader", { seeds: 3 });
    expect(report.checkpoints.region1.seaport?.coin.amount.median).toBe(0);
    const coin = report.checkpoints.floor50.seaport?.coin;
    expect(coin?.amount.median).toBeGreaterThan(0);
    expect(coin?.share.median).toBeGreaterThan(0);
    expect(coin?.share.median).toBeLessThan(1);
    expect(
      report.checkpoints.floor50.seaport?.epicStones.amount.median
    ).toBeGreaterThan(0);
  });

  it("counts the Players at the repeat cap", () => {
    const report = simulateEconomy("balanced", {
      seeds: 2,
      fixedThreeStarChance: 0,
      maxBattles: 150,
    });
    expect(report.capped).toBe(2);
    expect(report.checkpoints.region1.repeats?.cappedStages.median).toBe(10);
  });
});

/** `PACING_TARGETS` with Region 1 replaced by `region1`. */
const withRegion1 = (region1: CheckpointTargets): PacingTargets => ({
  ...PACING_TARGETS,
  region1,
});

const verdictOf = (
  verdicts: readonly PacingVerdict[],
  checkpoint: CheckpointId,
  target: PacingTargetId
) =>
  verdicts.find(
    (verdict) => verdict.checkpoint === checkpoint && verdict.target === target
  );

describe("judgePacing (Economy 4, 7.1)", () => {
  const report = simulateEconomy("upgrader", { seeds: 3 });
  const hoursMedian = report.checkpoints.region1.metrics?.hours.median;

  it("fails a median outside a gated target, and names the checkpoint, the target and the Play Style", () => {
    const verdicts = judgePacing(
      report,
      withRegion1({ hours: { min: 100, max: null } })
    );
    expect(verdictOf(verdicts, "region1", "hours")).toEqual({
      checkpoint: "region1",
      target: "hours",
      playStyle: "upgrader",
      value: hoursMedian,
      range: { min: 100, max: null },
      onTarget: false,
      gated: true,
    });
  });

  it("passes a median on its target", () => {
    const verdicts = judgePacing(
      report,
      withRegion1({ hours: { min: 0, max: 100 } })
    );
    expect(verdictOf(verdicts, "region1", "hours")?.onTarget).toBe(true);
  });

  it("makes a miss of a draft target a review, not a fail", () => {
    const verdicts = judgePacing(
      report,
      withRegion1({
        hours: { min: 100, max: null },
        draftFor: { hours: ["upgrader"] },
      })
    );
    expect(verdictOf(verdicts, "region1", "hours")).toMatchObject({
      onTarget: false,
      gated: false,
    });
    // A draft mark for another Play Style does not change this Play Style.
    const other = judgePacing(
      report,
      withRegion1({
        hours: { min: 100, max: null },
        draftFor: { hours: ["balanced"] },
      })
    );
    expect(verdictOf(other, "region1", "hours")?.gated).toBe(true);
  });

  it("does not judge a target that does not apply to the Play Style", () => {
    const verdicts = judgePacing(
      report,
      withRegion1({
        hours: { min: 100, max: null },
        notFor: { hours: ["upgrader"] },
      })
    );
    expect(verdictOf(verdicts, "region1", "hours")).toBeUndefined();
  });

  it("judges the Player level on the First-try run, and the shares of the Players", () => {
    const verdicts = judgePacing(
      report,
      withRegion1({ level: 6, firstCombine: true })
    );
    expect(verdictOf(verdicts, "region1", "level")).toMatchObject({
      value: report.firstTry.checkpoints.region1?.level,
      range: { min: 6, max: 6 },
    });
    expect(verdictOf(verdicts, "region1", "firstCombine")).toMatchObject({
      value: report.checkpoints.region1.combinedShare,
      range: { min: 1, max: 1 },
    });
    expect(verdictOf(verdicts, "level30", "level30BeforeFloor50")?.value).toBe(
      report.level30BeforeFloor50 / report.seeds
    );
  });

  it("gates each target of Economy 4, but the Discovered target of the Balanced Player at Floor 50", () => {
    const drafts = PLAY_STYLES.flatMap((playStyle) =>
      judgePacing({ ...report, playStyle }).filter((verdict) => !verdict.gated)
    );
    expect(
      drafts.map(({ checkpoint, target, playStyle }) => ({
        checkpoint,
        target,
        playStyle,
      }))
    ).toEqual([
      {
        checkpoint: "floor50",
        target: "discoveredShare",
        playStyle: "balanced",
      },
    ]);
  });
});

describe("heynstoneLedger (Economy 2.6)", () => {
  it("adds up the one-time sources", () => {
    const ledger = heynstoneLedger();
    expect(ledger.total).toBe(
      ledger.sources.reduce((total, source) => total + source.heynstones, 0)
    );
    expect(ledger.catalogShare).toBeCloseTo(ledger.total / ledger.catalog, 10);
  });
});
