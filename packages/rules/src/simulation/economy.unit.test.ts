import { describe, expect, it } from "vitest";

import { ownedCopies } from "../collection/deck-building";
import type { Collection } from "../collection/deck-building";
import { getCard } from "../content/cards";
import { DUNGEON_REWARDS, getDungeon } from "../content/dungeons";
import { getFloor } from "../content/floors";
import { NO_FORGE_STONES } from "../content/forge-stones";
import { HEYNSPIRE_FLOORS } from "../content/heynspire";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import { STAGES } from "../content/stages";
import { UNLOCK_LEVELS } from "../content/unlocks";
import { EXTRACT_ESSENCE } from "../content/workshop";
import { dungeonCardPool } from "../profile/dungeon-result";
import { findStage, stageCardPool } from "../profile/stage-result";
import {
  campaignSweep,
  claimAchievements,
  dungeonSweep,
  economyStages,
  expectedFloorGear,
  expectedGear,
  expectedGearAtLevel,
  heynstoneLedger,
  MAX_REPLAYS,
  newEconomyPlayer,
  pacingTarget,
  simulateEconomy,
  simulateEconomyRun,
  spend,
} from "./economy";
import type { EconomyPlayer } from "./economy";
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

  it("has no replays and no Sweeps on the First-try run, and a win gives 2 Stars", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 1,
      firstTry: true,
    });
    expect(run.end).toMatchObject({
      stars: 100,
      threeStarStages: 0,
      replays: 0,
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
    // With the Sweeps, the Player gets to level 30 in Region 5, and the sim
    // stops there.
    expect(run.checkpoints.region5).toBeNull();
    expect(run.end).toMatchObject({ level: 30, battles: 49, stars: 147 });
    for (const [index, id] of (
      ["region1", "region2", "region3", "region4"] as const
    ).entries()) {
      expect(run.checkpoints[id]).toMatchObject({
        battles: (index + 1) * 10,
        stars: (index + 1) * 30,
        threeStarStages: (index + 1) * 10,
        replays: 0,
      });
    }
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

  it(`with a 3-Star chance of 0, stops each Stage after ${MAX_REPLAYS} replays and then leaves the Region`, () => {
    const run = simulateEconomyRun({
      playStyle: "upgrader",
      seed: 1,
      fixedWinChance: 1,
      fixedThreeStarChance: 0,
    });
    // Region 1: 10 first wins, then 10 replays of each Stage.
    expect(run.checkpoints.region1).toMatchObject({
      battles: 10 + 10 * MAX_REPLAYS,
      stars: 20,
      threeStarStages: 0,
      replays: 10 * MAX_REPLAYS,
      cappedStages: 10,
      // 2 Tickets for each win, and no 3-Star Stage to Sweep.
      campaignTicketsUsed: 0,
      campaignSweepTickets: 2 * (10 + 10 * MAX_REPLAYS),
    });
    expect(run.checkpoints.region2).toMatchObject({
      battles: 20 * (1 + MAX_REPLAYS),
      cappedStages: 20,
    });
    expect(run.capped).toBe(true);
  });

  it("goes on to the next Stage of the replays after a 3-Star win", () => {
    const run = simulateEconomyRun({
      playStyle: "balanced",
      seed: 4,
      fixedWinChance: 1,
    });
    const snap = run.checkpoints.region1;
    expect(snap?.threeStarStages).toBe(10);
    expect(snap?.stars).toBe(30);
    expect(snap?.battles).toBe(10 + (snap?.replays ?? 0));
    expect(snap?.replays).toBeGreaterThan(0);
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

  it("stops at Player level 30", () => {
    const run = simulateEconomyRun({ playStyle: "balanced", seed: 3 });
    expect(run.stuck).toBe(false);
    expect(run.end.level).toBe(30);
    expect(run.end.battles).toBe(run.checkpoints.level30?.battles);
  });
});

describe("expectedGear (ADR-0034)", () => {
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

  it("gives 10 levels before Stage 1-9 and 11 before 1-10: 1 Common Forge Stone for each first win and 2 from the 10-Star chest (ADR-0038)", () => {
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

describe("expectedGearAtLevel (ADR-0034)", () => {
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

describe("expectedFloorGear (ADR-0034, ADR-0042)", () => {
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

  it("needs a Forge Stone of the tier of the new level for each Gear level (ADR-0038)", () => {
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

  it("gives one repeat-win reward for each Ticket: Coin, XP, the Forge Stone chance and a card of the Stage card pool", () => {
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
    // A Region 1 repeat win: 60 Coin and 40 XP.
    expect(player.coin).toBe(50 * 60);
    expect(player.xp).toBe((PLAYER_LEVEL_XP[0] ?? 0) + 50 * 40);
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
    const player = playerAt(1, 0);
    // 2-10 and 4-1 both give 200 Coin; 3-1 gives 150.
    for (const id of ["3-1", "4-1", "2-10"]) {
      player.bestStars.set(id, 3);
    }
    player.campaignSweepTickets = 1;
    campaignSweep(player, economyStages());
    // The Boss Stage 2-10: 2 × 70 XP. Stage 4-1 gives 130 XP.
    expect(player.coin).toBe(200);
    expect(player.xp).toBe(140);
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

describe("pacingTarget (Economy 4)", () => {
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
    expect(report.firstTry.checkpoints.region5?.replays).toBe(0);
    expect(report.stuck).toBe(0);
  });

  it("counts the Players at the replay cap", () => {
    const report = simulateEconomy("balanced", {
      seeds: 2,
      fixedThreeStarChance: 0,
      maxBattles: 150,
    });
    expect(report.capped).toBe(2);
    expect(report.checkpoints.region1.replays?.cappedStages.median).toBe(10);
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
