import { describe, expect, it } from "vitest";

import { ownedCopies } from "../collection/deck-building";
import { PLAYER_LEVEL_XP } from "../content/player-levels";
import { STAGES } from "../content/stages";
import { UNLOCK_LEVELS } from "../content/unlocks";
import { EXTRACT_ESSENCE } from "../content/workshop";
import {
  economyStages,
  expectedGear,
  heynstoneLedger,
  newEconomyPlayer,
  simulateEconomy,
  simulateEconomyRun,
  spend,
} from "./economy";
import type { EconomyPlayer } from "./economy";
import { NO_GEAR } from "./simulate";

/** 20 Forge Stones of each tier: all that the 4 Gear items need. */
const ALL_FORGE_STONES = { common: 20, uncommon: 20, rare: 20, epic: 20 };

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

describe("economyStages (Economy 7.1)", () => {
  it("adds 10 planned Stages to each Region up to Region 5, with the Boss Stage last", () => {
    const stages = economyStages();
    expect(stages).toHaveLength(50);
    expect(stages.slice(0, STAGES.length).map((stage) => stage.id)).toEqual(
      STAGES.map((stage) => stage.id)
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
      fixedWinChance: 1,
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
      fixedWinChance: 1,
    });
    expect(run.gearAtStages).toHaveLength(run.levelsAtStages.length);
    const ids = economyStages().map((stage) => stage.id);
    expect([...gear.keys()]).toEqual(ids);
    expect(run.gearAtStages[ids.indexOf("1-10")]).toEqual(gear.get("1-10"));
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
    });
    spend(player, "collector");
    // 3 Common Forge Stones: 3 items to level 1. Uncommon cannot replace Common.
    expect(gearSum(player)).toBe(3);
    expect(player.forgeStones).toEqual({
      common: 0,
      uncommon: 20,
      rare: 20,
      epic: 20,
    });
    expect(player.coin).toBe(400 - 3 * 5);
  });

  it("goes to the next priority when the Forge Stone is missing", () => {
    const player = playerAt(6, 1250, {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
    });
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

describe("simulateEconomy (Economy 7.1)", () => {
  it("reports each checkpoint and a First-try run", () => {
    const report = simulateEconomy("collector", { seeds: 3 });
    expect(report.checkpoints.region1.reached).toBe(3);
    const battles = report.checkpoints.region1.metrics?.battles;
    expect(battles?.p10).toBeLessThanOrEqual(battles?.median ?? 0);
    expect(battles?.median).toBeLessThanOrEqual(battles?.p90 ?? 0);
    expect(report.firstTry.checkpoints.region1?.battles).toBe(10);
    expect(report.stuck).toBe(0);
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
