import { describe, expect, it } from "vitest";

import {
  emptyBattle,
  eventsOfType,
  giveHand,
  heroOf,
  placeUnit,
  preventRout,
  run,
} from "../testing/fixtures";
import { activateBossRules } from "./boss-rules";
import { createBattle } from "./create-battle";
import type {
  BattleEvent,
  BattleState,
  BossRuleEffect,
  BossRuleState,
} from "./types";
import { Command, DUNGEON_LANES } from "./types";

const rule = (threshold: number, effect: BossRuleEffect): BossRuleState => ({
  threshold,
  effect,
  activated: false,
});

const summonRule = (threshold: number, lane = 0, position = 10) =>
  rule(threshold, {
    type: "summon",
    card: { instanceId: 500, cardId: "human.militiaRecruit", rank: "rare" },
    lane,
    position,
  });

/** A Board with `lanes` Lanes and 1 Boss with `hp` of 30 HP and `bossRules`. */
const bossBattle = (
  hp: number,
  bossRules: BossRuleState[],
  lanes = 1
): BattleState => emptyBattle({ lanes, enemy: { hp, maxHp: 30, bossRules } });

/** A player Unit in the last Column of `lane`: in this Turn it hits the enemy Hero for `attack`. */
const attackerAtEnd = (state: BattleState, attack: number, lane = 0) =>
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    lane,
    position: 11,
    attack,
  });

/** The tags of the events from the first `BossRuleActivated` event. */
const tagsFromActivation = (events: readonly BattleEvent[]): string[] =>
  events
    .slice(events.findIndex((event) => event._tag === "BossRuleActivated"))
    .map((event) => event._tag);

describe("Boss Rules (ADR-0038)", () => {
  it("activates when a hit puts the Boss at its threshold, with integer math", () => {
    const state = bossBattle(30, [rule(50, { type: "draw", cards: 1 })]);
    preventRout(state);
    attackerAtEnd(state, 15);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(heroOf(after, "enemy").hp).toBe(15);
    expect(eventsOfType(events, "BossRuleActivated")).toEqual([
      expect.objectContaining({
        hero: { side: "enemy", hero: 0 },
        rule: 0,
        threshold: 50,
      }),
    ]);
  });

  it("does not activate while the HP is above the threshold", () => {
    // 16 × 100 is above 30 × 50.
    const state = bossBattle(30, [rule(50, { type: "draw", cards: 1 })]);
    preventRout(state);
    attackerAtEnd(state, 14);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(eventsOfType(events, "BossRuleActivated")).toEqual([]);
    expect(heroOf(after, "enemy").bossRules[0]?.activated).toBe(false);
  });

  it("Countdown −X lowers the N cards with the highest Countdown, and on a tie the earlier card", () => {
    const state = bossBattle(30, [
      rule(50, { type: "countdown", amount: 3, cards: 2 }),
    ]);
    giveHand(state, "enemy", [
      ["human.militiaRecruit", 3],
      ["human.militiaRecruit", 4],
      ["human.militiaRecruit", 5],
      ["human.militiaRecruit", 4],
    ]);
    preventRout(state);
    attackerAtEnd(state, 15);
    const hand = heroOf(state, "enemy").hand.map((card) => card.instanceId);
    const { events } = run(state, Command.EndTurn());
    expect(tagsFromActivation(events).slice(0, 3)).toEqual([
      "BossRuleActivated",
      "CountdownChanged",
      "CountdownChanged",
    ]);
    expect(
      eventsOfType(events, "CountdownChanged").map((event) => [
        event.instanceId,
        event.countdown,
      ])
    ).toEqual([
      [hand[2], 2],
      [hand[1], 1],
    ]);
  });

  it("Countdown −X does not lower a card below 0, and skips a Ready card", () => {
    const state = bossBattle(30, [
      rule(50, { type: "countdown", amount: 4, cards: 3 }),
    ]);
    giveHand(state, "enemy", [
      ["human.militiaRecruit", 0],
      ["human.militiaRecruit", 2],
    ]);
    preventRout(state);
    attackerAtEnd(state, 15);
    const { events } = run(state, Command.EndTurn());
    expect(
      eventsOfType(events, "CountdownChanged").map((event) => event.countdown)
    ).toEqual([0]);
  });

  it("Summon puts a copy of the card at its Rank into the Square, for the Boss", () => {
    const state = bossBattle(30, [summonRule(50, 0, 10)]);
    preventRout(state);
    attackerAtEnd(state, 15);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(tagsFromActivation(events).slice(0, 2)).toEqual([
      "BossRuleActivated",
      "UnitSummoned",
    ]);
    const summoned = after.units.find((unit) => unit.owner === "enemy");
    expect(summoned).toMatchObject({
      hero: 0,
      lane: 0,
      position: 10,
      source: {
        _tag: "Card",
        card: { cardId: "human.militiaRecruit", rank: "rare" },
      },
    });
  });

  it("Summon does nothing when the Square has a Unit, but the rule still activates", () => {
    const state = bossBattle(30, [summonRule(50, 0, 10)]);
    preventRout(state);
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 10,
    });
    attackerAtEnd(state, 15);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(eventsOfType(events, "BossRuleActivated")).toHaveLength(1);
    expect(eventsOfType(events, "UnitSummoned")).toEqual([]);
    expect(heroOf(after, "enemy").bossRules[0]?.activated).toBe(true);
  });

  it("Summon refuses a card that is not a Creature Card", () => {
    const state = bossBattle(30, [
      rule(50, {
        type: "summon",
        card: { instanceId: 500, cardId: "warrior.warDrums", rank: "rare" },
        lane: 0,
        position: 10,
      }),
    ]);
    preventRout(state);
    attackerAtEnd(state, 15);
    expect(() => run(state, Command.EndTurn())).toThrow(
      "A Boss Rule Summon needs a Creature Card: warrior.warDrums"
    );
  });

  it("does not activate for a Defeated Hero, or after the Battle ends", () => {
    const enemy = { side: "enemy", hero: 0 } as const;
    const defeated = bossBattle(0, [rule(50, { type: "draw", cards: 1 })]);
    const finished = bossBattle(10, [rule(50, { type: "draw", cards: 1 })]);
    finished.status = "finished";
    for (const state of [defeated, finished]) {
      const ctx = { state, events: [], random: { state: 1 } };
      activateBossRules(ctx, enemy);
      expect(ctx.events).toEqual([]);
      expect(heroOf(state, "enemy").bossRules[0]?.activated).toBe(false);
    }
  });

  it("Draw N draws N cards for the Boss of the rule", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      enemyHeroes: [
        { front: [0, 1] },
        {
          front: [2, 3],
          bossRules: [rule(50, { type: "draw", cards: 2 })],
        },
      ],
    });
    for (const instanceId of [600, 601, 602]) {
      heroOf(state, "enemy", 1).deck.push({
        instanceId,
        cardId: "human.militiaRecruit",
        rank: "common",
      });
    }
    preventRout(state);
    attackerAtEnd(state, 15, 2);
    const { events } = run(state, Command.EndTurn());
    expect(tagsFromActivation(events).slice(0, 3)).toEqual([
      "BossRuleActivated",
      "CardDrawn",
      "CardDrawn",
    ]);
    expect(eventsOfType(events, "BossRuleActivated")).toEqual([
      expect.objectContaining({ hero: { side: "enemy", hero: 1 } }),
    ]);
    expect(
      eventsOfType(events, "CardDrawn")
        .slice(0, 2)
        .map((event) => [event.hero, event.card.instanceId])
    ).toEqual([
      [1, 600],
      [1, 601],
    ]);
  });

  it("does not activate when the hit Defeats the Boss", () => {
    const state = bossBattle(3, [rule(50, { type: "draw", cards: 1 })]);
    preventRout(state);
    attackerAtEnd(state, 3);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(eventsOfType(events, "HeroDefeated")).toHaveLength(1);
    expect(eventsOfType(events, "BossRuleActivated")).toEqual([]);
    expect(after.result).toEqual({ winner: "player", reason: "heroDefeated" });
  });

  it("activates both rules of a hit that crosses 2 thresholds, the higher threshold first", () => {
    const state = bossBattle(30, [
      rule(25, { type: "draw", cards: 1 }),
      rule(75, { type: "countdown", amount: 1, cards: 1 }),
    ]);
    giveHand(state, "enemy", [["human.militiaRecruit", 3]]);
    preventRout(state);
    attackerAtEnd(state, 24);
    const { events } = run(state, Command.EndTurn());
    expect(
      eventsOfType(events, "BossRuleActivated").map((event) => [
        event.rule,
        event.threshold,
      ])
    ).toEqual([
      [1, 75],
      [0, 25],
    ]);
  });

  it("activates a rule only one time in a Battle", () => {
    const state = bossBattle(30, [rule(50, { type: "draw", cards: 1 })], 2);
    preventRout(state);
    attackerAtEnd(state, 18, 0);
    attackerAtEnd(state, 3, 1);
    const { state: after, events } = run(state, Command.EndTurn());
    expect(heroOf(after, "enemy").hp).toBe(9);
    expect(eventsOfType(events, "BossRuleActivated")).toHaveLength(1);
    expect(heroOf(after, "enemy").bossRules[0]?.activated).toBe(true);
    // `step` changes a copy: the input state keeps the rule.
    expect(heroOf(state, "enemy").bossRules[0]?.activated).toBe(false);
  });

  it("a Summon rule that has not activated stops the Side from being Routed (ADR-0012)", () => {
    const routed = bossBattle(30, [rule(50, { type: "draw", cards: 1 })]);
    giveHand(routed, "player", [["human.militiaRecruit", 3]]);
    expect(run(routed, Command.EndTurn()).state.result).toEqual({
      winner: "player",
      reason: "routed",
    });

    const waiting = bossBattle(30, [summonRule(50)]);
    giveHand(waiting, "player", [["human.militiaRecruit", 3]]);
    const { state: after } = run(waiting, Command.EndTurn());
    expect(after.status).toBe("ongoing");
  });

  it("a Summon rule that has activated does not stop the Routed check", () => {
    const state = bossBattle(15, [summonRule(50)]);
    giveHand(state, "player", [["human.militiaRecruit", 3]]);
    const [activated] = heroOf(state, "enemy").bossRules;
    if (activated) {
      activated.activated = true;
    }
    expect(run(state, Command.EndTurn()).state.result).toEqual({
      winner: "player",
      reason: "routed",
    });
  });
});

describe("createBattle with Boss Rules", () => {
  it("gives the enemy Hero its Boss Rules, and a Summon a Card copy after the start Units", () => {
    const { state } = createBattle({
      seed: 7,
      player: {
        classId: "warrior",
        deck: Array.from({ length: 5 }, () => ({
          cardId: "human.militiaRecruit",
          rank: "common" as const,
        })),
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
      stage: {
        id: "test",
        region: 1,
        number: 1,
        boss: true,
        recommendedLevel: 1,
        starTurn: 15,
        firstWinCard: { cardId: "human.militiaRecruit", rank: "common" },
        closedLanes: [],
        enemy: {
          heroHp: 40,
          classId: "warrior",
          gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
          deck: Array.from({ length: 5 }, () => ({
            cardId: "human.militiaRecruit",
            rank: "common" as const,
          })),
          startUnits: [
            {
              cardId: "human.militiaRecruit",
              rank: "common",
              lane: 1,
              position: 10,
            },
          ],
          bossRules: [
            { threshold: 60, effect: { type: "draw", cards: 2 } },
            {
              threshold: 30,
              effect: {
                type: "summon",
                cardId: "human.militiaRecruit",
                rank: "uncommon",
                lane: 0,
                position: 9,
              },
            },
          ],
        },
      },
    });
    expect(heroOf(state, "enemy").bossRules).toEqual([
      { threshold: 60, effect: { type: "draw", cards: 2 }, activated: false },
      {
        threshold: 30,
        effect: {
          type: "summon",
          // 5 + 5 Deck cards and 1 start Unit come first.
          card: {
            instanceId: 12,
            cardId: "human.militiaRecruit",
            rank: "uncommon",
          },
          lane: 0,
          position: 9,
        },
        activated: false,
      },
    ]);
    expect(heroOf(state, "player").bossRules).toEqual([]);
  });
});
