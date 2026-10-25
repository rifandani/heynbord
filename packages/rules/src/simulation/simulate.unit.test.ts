import { describe, expect, it } from "vitest";

import { createBattle } from "../battle/create-battle";
import { BattleEvent, STAGE_LANES } from "../battle/types";
import { ARCHETYPES } from "../content/archetypes";
import { deckCountdown, getStarterDeck } from "../content/decks";
import { getDungeon } from "../content/dungeons";
import { FLOORS, getFloor } from "../content/floors";
import { getStage, STAGES } from "../content/stages";
import { emptyBattle, placeUnit } from "../testing/fixtures";
import {
  createMatchupBattle,
  dungeonTarget,
  dungeonDeck,
  expectedDeck,
  floorDeck,
  floorTarget,
  gatesRelease,
  isOnTarget,
  MATCHUP_TARGET,
  NO_GEAR,
  playOut,
  simulateDungeon,
  simulateFloor,
  simulateMatchup,
  simulateStage,
  stageTarget,
  skipRunTracker,
  starTarget,
  suggestStarTurn,
  threeStarShare,
} from "./simulate";

const vanguard = getStarterDeck("vanguard");
const raiders = getStarterDeck("raiders");
const options = { seeds: 4, level: 5, gear: NO_GEAR };

const startOf = (seed: number) =>
  createBattle({
    seed,
    stage: getStage("1-4"),
    player: { ...vanguard, level: 2, gear: NO_GEAR },
  }).state;

describe("playOut (GDD 13)", () => {
  it("plays a Battle to its end, the same way for the same seed", () => {
    const end = playOut(startOf(3));
    expect(end.status).toBe("finished");
    expect(end.result).not.toBeNull();
    expect(playOut(startOf(3))).toEqual(end);
  });

  it("throws when a Battle passes the Command limit", () => {
    expect(() => playOut(startOf(3), 2)).toThrow("not finished after 2");
  });
});

describe("skipRunTracker (ADR-0024)", () => {
  const state = emptyBattle();
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    position: 2,
  });
  const unitId = state.units[0]?.id ?? 0;
  const skip = BattleEvent.UnitSkipped({ unitId });
  const end = BattleEvent.TurnEnded({ side: "player" });
  const other = BattleEvent.TurnEnded({ side: "enemy" });

  it("finds a run of 3 skipped actions in a row of one Unit", () => {
    const tracker = skipRunTracker();
    for (const _ of [1, 2, 3]) {
      tracker.observe([skip, end, other], state);
    }
    expect([...tracker.locked]).toEqual(["player"]);
  });

  it("ends a run when the Unit acts in a Turn of its Side", () => {
    const tracker = skipRunTracker();
    tracker.observe([skip, end, other], state);
    tracker.observe([skip, end, other], state);
    tracker.observe([end, other], state);
    tracker.observe([skip, end, other], state);
    expect([...tracker.locked]).toEqual([]);
  });
});

describe("expectedDeck", () => {
  it("adds the first-win cards of the earlier Stages, up to the maximum Deck size", () => {
    expect(expectedDeck(getStage("1-1"), vanguard)).toEqual(vanguard.deck);
    // Level 1: the Deck is full at 10 cards.
    expect(expectedDeck(getStage("1-2"), vanguard)).toEqual(vanguard.deck);
    // Level 2: 1 more card, the first-win card of Stage 1-1.
    expect(expectedDeck(getStage("1-3"), raiders)).toEqual([
      ...raiders.deck,
      getStage("1-1").firstWinCard,
    ]);
    // Raiders has 3 Scrap Raiders and 3 Ember Shamans, so it skips the
    // first-win cards of Stages 1-2 and 1-3.
    const boss = expectedDeck(getStage("1-10"), raiders);
    expect(boss).toHaveLength(14);
    expect(boss.slice(10)).toEqual(
      ["1-1", "1-4", "1-5", "1-6"].map((id) => getStage(id).firstWinCard)
    );
  });

  it("skips a fourth copy and a Skill Card of another Class", () => {
    const stage = getStage("1-10");
    const fireball = { cardId: "mage.fireball", rank: "common" } as const;
    const recruit = { cardId: "human.militiaRecruit", rank: "common" } as const;
    const earlier = [fireball, recruit, recruit, recruit].map(
      (firstWinCard, index) => ({
        ...stage,
        id: `0-${index}`,
        region: 0,
        firstWinCard,
      })
    );
    const starter = {
      ...vanguard,
      deck: [
        ...vanguard.deck.filter((entry) => entry.cardId !== recruit.cardId),
        recruit,
      ],
    };
    expect(expectedDeck(stage, starter, earlier)).toEqual([
      ...starter.deck,
      recruit,
      recruit,
    ]);
  });

  it("skips a card over the Countdown Limit of the Recommended level (ADR-0021)", () => {
    // Stage 1-10 is level 5: the Countdown Limit is 35.
    const stage = getStage("1-10");
    const heavy = [
      "human.ironBulwark",
      "human.marshalElianVoss",
      "orc.warchiefGrukka",
      "feral.mountainColossus",
      "feral.oldFrostmaw",
      "orc.warbandStandardBearer",
      "human.militiaRecruit",
    ].map((cardId) => ({ cardId, rank: "common" }) as const);
    const earlier = heavy.map((firstWinCard, index) => ({
      ...stage,
      id: `0-${index}`,
      region: 0,
      firstWinCard,
    }));
    const deck = expectedDeck(stage, { ...vanguard, deck: [] }, earlier);
    // 5 × 6 = 30. A sixth Countdown 6 card makes 36, so it is skipped.
    expect(deck).toEqual([...heavy.slice(0, 5), heavy[6]]);
    expect(deckCountdown(deck)).toBe(31);
  });
});

describe("simulateStage (GDD 13, step 6)", () => {
  it("plays at the Recommended level and gives the same report each time", () => {
    const report = simulateStage(getStage("1-3"), raiders, 6);
    expect(report).toMatchObject({
      stageId: "1-3",
      deckId: "raiders",
      battles: 6,
    });
    expect(report.winRate).toBeGreaterThanOrEqual(0);
    expect(report.winRate).toBeLessThanOrEqual(1);
    expect(report.averageStars).toBeLessThanOrEqual(report.winRate * 3);
    expect(simulateStage(getStage("1-3"), raiders, 6)).toEqual(report);
  });

  it("gives the Turn of each win with half of the Hero HP or more", () => {
    const report = simulateStage(getStage("1-3"), raiders, 6);
    expect(report.wins).toBe(report.winRate * 6);
    expect(report.highHpWinTurns.length).toBeLessThanOrEqual(report.wins);
    // A Star Turn after the last win counts each high-HP win as 3 Stars.
    expect(threeStarShare(report, 61)).toBe(
      report.highHpWinTurns.length / report.wins
    );
  });
});

describe("3-Star targets (GDD 13, step 7, ADR-0045)", () => {
  it("gives the ramp a lower limit, and normal and Boss Stages a range", () => {
    expect(
      STAGES.filter((stage) => stage.region === 1).map((stage) =>
        starTarget(stage)
      )
    ).toEqual([
      ...Array.from({ length: 3 }, () => ({ min: 0.3, max: 1, aim: null })),
      ...Array.from({ length: 6 }, () => ({ min: 0.3, max: 0.5, aim: 0.4 })),
      { min: 0.2, max: 0.4, aim: 0.3 },
    ]);
  });

  it("counts a win before the Star Turn as 3 Stars, from all wins", () => {
    const wins = { wins: 4, highHpWinTurns: [10, 12, 15] };
    expect(threeStarShare(wins, 12)).toBe(0.25);
    expect(threeStarShare(wins, 13)).toBe(0.5);
    expect(threeStarShare({ wins: 0, highHpWinTurns: [] }, 15)).toBe(0);
  });

  it("suggests the Turn nearest to the aim on all rows", () => {
    const target = starTarget({ region: 2, number: 1, boss: false });
    const rows = [
      { wins: 10, highHpWinTurns: [5, 6, 7, 8, 9, 10] },
      { wins: 10, highHpWinTurns: [7, 8, 9, 10, 11, 12] },
    ];
    // Turn 9: 40% and 20%. Turn 10: 50% and 30%. Turn 11: 60% and 40%.
    expect(suggestStarTurn(rows, target)).toBe(10);
  });

  it("gives no suggestion for a target with only a lower limit", () => {
    const target = starTarget({ region: 1, number: 1, boss: false });
    expect(suggestStarTurn([{ wins: 1, highHpWinTurns: [5] }], target)).toBe(
      null
    );
  });
});

describe("simulateDungeon (GDD 13, step 6)", () => {
  const dungeon = getDungeon("dungeon-1");

  it("uses the expected Deck of the first Stage at the unlock level, when that Stage exists", () => {
    expect(dungeonDeck(dungeon, vanguard)).toEqual(
      expectedDeck(getStage("3-1"), vanguard)
    );
    expect(dungeonDeck(getDungeon("dungeon-2"), raiders)).toEqual(
      expectedDeck(getStage("5-1"), raiders)
    );
  });

  it("at level 30, above all Stages, takes the first-win cards of the Stages of Region 5 too, in the Deck limits", () => {
    const deck = dungeonDeck({ ...dungeon, unlockLevel: 30 }, raiders);
    expect(deck.length).toBeLessThanOrEqual(30);
    expect(deckCountdown(deck)).toBeLessThanOrEqual(75);
    expect(deck.slice(0, raiders.deck.length)).toEqual(raiders.deck);
    // The first-win card of Stage 5-1, at Recommended level 20.
    expect(deck.map((entry) => entry.cardId)).toContain("undead.rattleknife");
  });

  it("plays at the unlock level and gives the same report each time", () => {
    const report = simulateDungeon(dungeon, vanguard, 4);
    expect(report).toMatchObject({
      dungeonId: "dungeon-1",
      deckId: "vanguard",
      battles: 4,
    });
    expect(report.winRate).toBeGreaterThanOrEqual(0);
    expect(report.winRate).toBeLessThanOrEqual(1);
    expect(report.averageDefeated).toBeGreaterThanOrEqual(0);
    expect(report.averageDefeated).toBeLessThanOrEqual(dungeon.bosses.length);
    expect(simulateDungeon(dungeon, vanguard, 4)).toEqual(report);
  });

  it("has the target of a Boss Stage, also for each Gear row (ADR-0033)", () => {
    expect(dungeonTarget()).toEqual({ min: 0.3, max: 0.5 });
    expect(dungeonTarget("noGear")).toEqual({ min: 0.25, max: 0.5 });
    expect(dungeonTarget("gear")).toEqual({ min: 0.3, max: 0.55 });
  });
});

describe("simulateFloor (GDD 13, step 6, ADR-0040)", () => {
  const floor = getFloor(1);

  it("uses the starter Deck and the first-win cards of all Stages, in the Deck limits of the Recommended level", () => {
    const deck = floorDeck(floor, raiders);
    expect(deck.length).toBeLessThanOrEqual(30);
    expect(deckCountdown(deck)).toBeLessThanOrEqual(75);
    expect(deck.slice(0, raiders.deck.length)).toEqual(raiders.deck);
    // A Floor win gives no card, so each Floor has the same expected Deck.
    expect(floorDeck(getFloor(50), raiders)).toEqual(deck);
    expect(floorDeck(floor, vanguard)).toEqual(
      dungeonDeck({ ...getDungeon("dungeon-3"), unlockLevel: 23 }, vanguard)
    );
  });

  it("plays at the Recommended level and gives the same report each time", () => {
    const report = simulateFloor(floor, vanguard, 4);
    expect(report).toMatchObject({
      floorId: "floor-1",
      deckId: "vanguard",
      battles: 4,
    });
    expect(report.winRate).toBeGreaterThanOrEqual(0);
    expect(report.winRate).toBeLessThanOrEqual(1);
    expect(simulateFloor(floor, vanguard, 4)).toEqual(report);
  });

  it("gives a normal Floor the target of a normal Stage, and a Boss Floor the target of a Boss Stage", () => {
    expect(FLOORS.map((candidate) => floorTarget(candidate))).toEqual(
      FLOORS.map((candidate) =>
        candidate.number % 10 === 0
          ? { min: 0.3, max: 0.5 }
          : { min: 0.6, max: 0.8 }
      )
    );
  });

  it("gives a Boss Floor the target of each Gear row, and a normal Floor no change (ADR-0033)", () => {
    expect(floorTarget(getFloor(40), "noGear")).toEqual({
      min: 0.25,
      max: 0.5,
    });
    expect(floorTarget(getFloor(40), "gear")).toEqual({ min: 0.3, max: 0.55 });
    expect(floorTarget(floor, "noGear")).toEqual({ min: 0.6, max: 0.8 });
    expect(floorTarget(floor, "gear")).toEqual({ min: 0.6, max: 0.8 });
  });
});

describe("simulateMatchup (GDD 13, steps 4 and 5)", () => {
  it("gives a mirror Matchup exactly 50%, because each seed plays both ways", () => {
    for (const archetype of ARCHETYPES) {
      const report = simulateMatchup(archetype, archetype, options);
      expect(report.battles).toBe(8);
      expect(report.winRate).toBe(0.5);
    }
  });

  it("counts the swapped Battles for the correct Archetype", () => {
    const ahead = simulateMatchup(vanguard, raiders, options);
    const behind = simulateMatchup(raiders, vanguard, options);
    expect(ahead.winRate + behind.winRate).toBe(1);
    expect(ahead.firstSideWinRate).toBe(behind.firstSideWinRate);
    expect(ahead.averageTurn).toBe(behind.averageTurn);
  });

  it("gives both Heroes the same HP and Gear, on the Board of a Stage", () => {
    const gear = { weapon: 1, armor: 2, trinket: 3, banner: 4 };
    const state = createMatchupBattle(1, vanguard, raiders, {
      ...options,
      gear,
    });
    const [player] = state.sides.player.heroes;
    const [enemy] = state.sides.enemy.heroes;
    expect({ ...enemy, classId: "warrior", hand: [], deck: [] }).toEqual({
      ...player,
      hand: [],
      deck: [],
    });
    expect(player?.maxHp).toBe(30 + 5 + 2);
    expect(enemy?.classId).toBe("mage");
    expect(state.lanes).toBe(STAGE_LANES);
    expect(state.closedLanes).toEqual([]);
    expect(state.units).toEqual([]);
  });
});

const archetype = (id: string) => {
  const found = ARCHETYPES.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Unknown Archetype: ${id}`);
  }
  return found;
};

describe("diagnostic Archetypes (Archetypes 2.1, 2.2)", () => {
  it("plays each diagnostic Archetype against each main Archetype with no illegal Command", () => {
    for (const diagnostic of [
      "breakneckCompany",
      "vanguardFull",
      "raidersFull",
      "humanHeavy",
      "humanLight",
    ]) {
      for (const main of [
        "vanguard",
        "raiders",
        "tunnelRats",
        "wildHunt",
        "thornwatch",
        "deathlessHost",
      ]) {
        const report = simulateMatchup(
          archetype(diagnostic),
          archetype(main),
          options
        );
        expect(report.battles).toBe(8);
        expect(report.winRate).toBeGreaterThanOrEqual(0);
        expect(report.winRate).toBeLessThanOrEqual(1);
      }
    }
    const goblinAgainstFeral = simulateMatchup(
      archetype("tunnelRats"),
      archetype("wildHunt"),
      options
    );
    expect(goblinAgainstFeral.battles).toBe(8);
    // Both Ranger Decks, with the Ranger Skill Cards on each Side.
    const rangerAgainstRanger = simulateMatchup(
      archetype("thornwatch"),
      archetype("tunnelRats"),
      options
    );
    expect(rangerAgainstRanger.battles).toBe(8);
    // Trample against cheap Units (Archetypes 2.2).
    const feralAgainstUndead = simulateMatchup(
      archetype("wildHunt"),
      archetype("deathlessHost"),
      options
    );
    expect(feralAgainstUndead.battles).toBe(8);
  });

  it("gates release only with a pair of two main Archetypes", () => {
    expect(gatesRelease(archetype("vanguard"), archetype("raiders"))).toBe(
      true
    );
    expect(gatesRelease(archetype("vanguard"), archetype("tunnelRats"))).toBe(
      true
    );
    expect(
      gatesRelease(archetype("thornwatch"), archetype("deathlessHost"))
    ).toBe(true);
    // Wild Hunt is main after the tuning of issue #80 (Archetypes 3.1).
    expect(gatesRelease(archetype("wildHunt"), archetype("raiders"))).toBe(
      true
    );
    expect(gatesRelease(archetype("tunnelRats"), archetype("wildHunt"))).toBe(
      true
    );
    expect(
      gatesRelease(archetype("wildHunt"), archetype("breakneckCompany"))
    ).toBe(false);
    expect(
      gatesRelease(archetype("vanguardFull"), archetype("raidersFull"))
    ).toBe(false);
    expect(gatesRelease(archetype("raidersFull"), archetype("vanguard"))).toBe(
      false
    );
    expect(
      gatesRelease(archetype("deathlessHost"), archetype("breakneckCompany"))
    ).toBe(false);
  });

  it("reports the average number of the Archetype's Turns with no Ready card in the Hand", () => {
    const report = simulateMatchup(
      archetype("vanguard"),
      archetype("tunnelRats"),
      options
    );
    expect(report.noReadyTurns).toBeGreaterThan(0);
    expect(report.noReadyTurns).toBeLessThanOrEqual(report.averageTurn);
    const reverse = simulateMatchup(
      archetype("tunnelRats"),
      archetype("vanguard"),
      options
    );
    expect(reverse.averageTurn).toBe(report.averageTurn);
    expect(reverse.noReadyTurns).not.toBe(report.noReadyTurns);
  });

  it("keeps the old Vanguard against Raiders results for the same seeds", () => {
    const vanguardArchetype = archetype("vanguard");
    const raidersArchetype = archetype("raiders");
    expect(
      simulateMatchup(vanguardArchetype, raidersArchetype, {
        seeds: 20,
        level: 5,
        gear: NO_GEAR,
      })
    ).toMatchObject({
      winRate: 0.525,
      firstSideWinRate: 0.425,
      averageTurn: 15.125,
    });
    // Gear 3 rolls Crit and Block.
    expect(
      simulateMatchup(vanguardArchetype, raidersArchetype, {
        seeds: 20,
        level: 5,
        gear: { weapon: 6, armor: 6, trinket: 6, banner: 6 },
      })
    ).toMatchObject({
      winRate: 0.5,
      firstSideWinRate: 0.5,
      averageTurn: 15.475,
    });
  });
});

describe("win-rate targets (GDD 13)", () => {
  it("gives the Region 1 ramp, normal Stages and the Boss Stage their targets", () => {
    expect(
      STAGES.filter((stage) => stage.region === 1).map((stage) =>
        stageTarget(stage)
      )
    ).toEqual([
      { min: 0.95, max: 1 },
      { min: 0.85, max: 1 },
      { min: 0.75, max: 1 },
      ...Array.from({ length: 6 }, () => ({ min: 0.6, max: 0.8 })),
      { min: 0.3, max: 0.5 },
    ]);
  });

  it("gives Region 2 no ramp: 9 normal Stages and the Boss Stage", () => {
    expect(
      STAGES.filter((stage) => stage.region === 2).map((stage) =>
        stageTarget(stage)
      )
    ).toEqual([
      ...Array.from({ length: 9 }, () => ({ min: 0.6, max: 0.8 })),
      { min: 0.3, max: 0.5 },
    ]);
  });

  it("gives a Boss Stage a target for each Gear row, and a normal Stage no change (ADR-0033)", () => {
    const boss = { region: 4, number: 10, boss: true };
    const normal = { region: 2, number: 1, boss: false };
    expect(stageTarget(boss, "noGear")).toEqual({ min: 0.25, max: 0.5 });
    expect(stageTarget(boss, "gear")).toEqual({ min: 0.3, max: 0.55 });
    expect(stageTarget(normal, "gear")).toEqual({ min: 0.6, max: 0.8 });
  });

  it("includes both ends of a target", () => {
    expect(isOnTarget(0.45, MATCHUP_TARGET)).toBe(true);
    expect(isOnTarget(0.55, MATCHUP_TARGET)).toBe(true);
    expect(isOnTarget(0.449, MATCHUP_TARGET)).toBe(false);
    expect(isOnTarget(0.551, MATCHUP_TARGET)).toBe(false);
  });
});
