import { describe, expect, it } from "vitest";

import { createBattle } from "../battle/create-battle";
import { STAGE_LANES } from "../battle/types";
import { ARCHETYPES } from "../content/archetypes";
import { deckCountdown, getStarterDeck } from "../content/decks";
import { getStage, STAGES } from "../content/stages";
import {
  createMatchupBattle,
  expectedDeck,
  gatesRelease,
  isOnTarget,
  MATCHUP_TARGET,
  NO_GEAR,
  playOut,
  simulateMatchup,
  simulateStage,
  stageTarget,
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
    expect(end.phase).toBe("finished");
    expect(end.result).not.toBeNull();
    expect(playOut(startOf(3))).toEqual(end);
  });

  it("throws when a Battle passes the Command limit", () => {
    expect(() => playOut(startOf(3), 2)).toThrow("not finished after 2");
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
    const { player, enemy } = state.sides;
    expect({ ...enemy.hero, classId: "warrior" }).toEqual(player.hero);
    expect(player.hero.maxHp).toBe(30 + 5 + 2 * 2);
    expect(enemy.hero.classId).toBe("mage");
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
      "tunnelRats",
      "wildHunt",
      "vanguardFull",
      "raidersFull",
      "humanHeavy",
      "humanLight",
    ]) {
      for (const main of ["vanguard", "raiders"]) {
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
  });

  it("gates release only with a pair of two main Archetypes", () => {
    expect(gatesRelease(archetype("vanguard"), archetype("raiders"))).toBe(
      true
    );
    expect(gatesRelease(archetype("vanguard"), archetype("tunnelRats"))).toBe(
      false
    );
    expect(gatesRelease(archetype("wildHunt"), archetype("raiders"))).toBe(
      false
    );
    expect(gatesRelease(archetype("tunnelRats"), archetype("wildHunt"))).toBe(
      false
    );
    expect(
      gatesRelease(archetype("vanguardFull"), archetype("raidersFull"))
    ).toBe(false);
    expect(gatesRelease(archetype("raidersFull"), archetype("vanguard"))).toBe(
      false
    );
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
      winRate: 0.55,
      firstSideWinRate: 0.55,
      averageTurn: 22,
    });
    // Gear 3 rolls Crit and Block.
    expect(
      simulateMatchup(vanguardArchetype, raidersArchetype, {
        seeds: 20,
        level: 5,
        gear: { weapon: 3, armor: 3, trinket: 3, banner: 3 },
      })
    ).toMatchObject({
      winRate: 0.675,
      firstSideWinRate: 0.525,
      averageTurn: 23.3,
    });
  });
});

describe("win-rate targets (GDD 13)", () => {
  it("gives the Region 1 ramp, normal Stages and the Boss Stage their targets", () => {
    expect(STAGES.map((stage) => stageTarget(stage))).toEqual([
      { min: 0.95, max: 1 },
      { min: 0.85, max: 1 },
      { min: 0.75, max: 1 },
      ...Array.from({ length: 6 }, () => ({ min: 0.6, max: 0.8 })),
      { min: 0.3, max: 0.5 },
    ]);
  });

  it("includes both ends of a target", () => {
    expect(isOnTarget(0.45, MATCHUP_TARGET)).toBe(true);
    expect(isOnTarget(0.55, MATCHUP_TARGET)).toBe(true);
    expect(isOnTarget(0.449, MATCHUP_TARGET)).toBe(false);
    expect(isOnTarget(0.551, MATCHUP_TARGET)).toBe(false);
  });
});
