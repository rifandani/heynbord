import { describe, expect, it, vi } from "vitest";

import {
  cardOf,
  emptyBattle,
  eventsOfType,
  giveHand,
  placeToken,
  placeUnit,
  preventRout,
  run,
  unitById,
} from "../testing/fixtures";
import { legalTargets } from "./targets";
import { Command, Target } from "./types";
import type { BattleState, Side } from "./types";

vi.mock(import("../content/cards"), async (importOriginal) => {
  const original = await importOriginal();
  const { SUMMON_TEST_CARDS } = await import("../testing/summon-cards");
  return {
    ...original,
    getCard: (cardId: string) =>
      SUMMON_TEST_CARDS.get(cardId) ?? original.getCard(cardId),
  };
});

const endTurn = Command.EndTurn();

const square = (lane: number, position: number) =>
  Target.Square({ lane, position });

/** Plays the first card of the Hand of the active Side into a Square. */
const playInto = (state: BattleState, lane: number, position: number) =>
  run(
    state,
    Command.PlayCard({ handIndex: 0, target: square(lane, position) })
  );

/** A Unit that fills a Square, so that no Token can go there. */
const blocker = (
  state: BattleState,
  lane: number,
  position: number,
  owner: Side = "player"
) =>
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner,
    lane,
    position,
    speed: 0,
  });

const tokenSquares = (state: BattleState) =>
  state.units.flatMap((unit) =>
    unit.source._tag === "Token"
      ? [{ lane: unit.lane, position: unit.position }]
      : []
  );

describe("Summon X (GDD 5.4)", () => {
  it("puts the Token in the Square behind the Unit, with a Battle Event", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [["test.boneCaller", 0]]);
    const { state: next, events } = playInto(state, 1, 2);
    const caller = next.units.find((unit) => unit.source._tag === "Card");
    const token = next.units.find((unit) => unit.source._tag === "Token");
    expect(token).toMatchObject({
      owner: "player",
      lane: 1,
      position: 1,
      source: { _tag: "Token", tokenId: "token.skeleton", rank: "common" },
      attack: 1,
      hp: 1,
      maxHp: 1,
      speed: 1,
      swarm: 1,
      summonedTurn: 1,
    });
    expect(eventsOfType(events, "TokenSummoned")).toEqual([
      expect.objectContaining({ unit: token, sourceUnitId: caller?.id }),
    ]);
    expect(events.map((event) => event._tag)).toEqual([
      "CardPlayed",
      "UnitSummoned",
      "TokenSummoned",
    ]);
  });

  it("puts the Token behind toward the enemy's own Hero for the enemy Side", () => {
    const state = emptyBattle({ lanes: 3, activeSide: "enemy" });
    giveHand(state, "enemy", [["test.boneCaller", 0]]);
    const { state: next } = playInto(state, 0, 9);
    expect(tokenSquares(next)).toEqual([{ lane: 0, position: 10 }]);
  });

  it("uses the same Column in the lower Lane when the Square behind is full", () => {
    const state = emptyBattle({ lanes: 3 });
    blocker(state, 1, 1);
    giveHand(state, "player", [["test.boneCaller", 0]]);
    expect(tokenSquares(playInto(state, 1, 2).state)).toEqual([
      { lane: 0, position: 2 },
    ]);
  });

  it("uses the same Column in the higher Lane when the lower Lane is full", () => {
    const state = emptyBattle({ lanes: 3 });
    blocker(state, 1, 1);
    blocker(state, 0, 2, "enemy");
    giveHand(state, "player", [["test.boneCaller", 0]]);
    expect(tokenSquares(playInto(state, 1, 2).state)).toEqual([
      { lane: 2, position: 2 },
    ]);
  });

  it("makes no Token when no Square is empty", () => {
    const state = emptyBattle({ lanes: 3 });
    blocker(state, 1, 1);
    blocker(state, 0, 2);
    blocker(state, 2, 2);
    giveHand(state, "player", [["test.boneCaller", 0]]);
    const { state: next, events } = playInto(state, 1, 2);
    expect(tokenSquares(next)).toEqual([]);
    expect(eventsOfType(events, "TokenSummoned")).toEqual([]);
  });

  it("puts no Token into a Closed Lane", () => {
    const state = emptyBattle({ lanes: 3, closedLanes: [{ lane: 0 }] });
    blocker(state, 1, 1);
    giveHand(state, "player", [["test.boneCaller", 0]]);
    expect(tokenSquares(playInto(state, 1, 2).state)).toEqual([
      { lane: 2, position: 2 },
    ]);
  });

  it("makes no Token from Column 1 when both next Lanes are full", () => {
    const state = emptyBattle({ lanes: 3 });
    blocker(state, 0, 0);
    blocker(state, 2, 0);
    giveHand(state, "player", [["test.boneCaller", 0]]);
    expect(tokenSquares(playInto(state, 1, 0).state)).toEqual([]);
  });

  it("uses only Squares on the Board", () => {
    // Column 1 of Lane 1: no Square behind and no lower Lane.
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["test.boneCaller", 0]]);
    expect(tokenSquares(playInto(state, 0, 0).state)).toEqual([
      { lane: 1, position: 0 },
    ]);
    const top = emptyBattle({ lanes: 2 });
    blocker(top, 1, 0);
    giveHand(top, "player", [["test.boneCaller", 0]]);
    expect(tokenSquares(playInto(top, 1, 1).state)).toEqual([
      { lane: 0, position: 1 },
    ]);
  });

  it("does not need the Square to be in the Summon Zone", () => {
    // A Wall goes into Column 5 (ADR-0023). The Square behind is Column 4.
    const state = emptyBattle({ lanes: 1 });
    giveHand(state, "player", [["test.wallCaller", 0]]);
    expect(tokenSquares(playInto(state, 0, 4).state)).toEqual([
      { lane: 0, position: 3 },
    ]);
  });

  it("gives the Token the Rank of the Card copy and the values of its Rank table", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [
      ["test.boneCaller", 0, "epic"],
      ["test.wispCaller", 0, "rare"],
    ]);
    const first = playInto(state, 0, 2).state;
    const { state: next } = playInto(first, 2, 2);
    const tokens = next.units.filter((unit) => unit.source._tag === "Token");
    expect(tokens).toMatchObject([
      {
        source: { _tag: "Token", tokenId: "token.skeleton", rank: "epic" },
        attack: 2,
        hp: 3,
        maxHp: 3,
        speed: 2,
        swarm: 1,
        damageType: "physical",
        flying: false,
      },
      {
        source: { _tag: "Token", tokenId: "token.restlessWisp", rank: "rare" },
        attack: 2,
        hp: 2,
        speed: 1,
        swarm: 0,
        damageType: "frost",
        flying: true,
      },
    ]);
  });

  it("lets the Token act in the Turn when it appears", () => {
    const state = emptyBattle({ lanes: 3 });
    preventRout(state);
    blocker(state, 1, 1);
    giveHand(state, "player", [["test.boneCaller", 0]]);
    const { state: played } = playInto(state, 1, 2);
    const token = played.units.find((unit) => unit.source._tag === "Token");
    const { events } = run(played, endTurn);
    expect(eventsOfType(events, "UnitMoved")).toContainEqual(
      expect.objectContaining({ unitId: token?.id, from: 2, to: 3 })
    );
  });

  it("does not occur for a Start Unit or a Unit that is put on the Board", () => {
    const state = emptyBattle({ lanes: 3 });
    placeUnit(state, {
      cardId: "test.boneCaller",
      owner: "player",
      lane: 1,
      position: 2,
    });
    expect(tokenSquares(state)).toEqual([]);
  });

  it("gives no second Token when the Unit comes back with Rebirth", () => {
    const state = emptyBattle({ lanes: 3 });
    preventRout(state);
    giveHand(state, "player", [["test.rebornCaller", 0]]);
    const { state: played } = playInto(state, 1, 2);
    const caller = played.units.find((unit) => unit.source._tag === "Card");
    const callerId = caller?.id ?? 0;
    // The caller is in front of its Token. In the enemy Turn, an enemy Unit
    // kills it.
    placeUnit(played, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      lane: 1,
      position: 4,
      attack: 10,
      speed: 0,
    });
    const playerTurn = run(played, endTurn);
    const { state: next, events } = run(playerTurn.state, endTurn);
    expect(eventsOfType(events, "UnitReborn")).toMatchObject([
      { unitId: callerId },
    ]);
    expect(eventsOfType(events, "TokenSummoned")).toEqual([]);
    expect(
      next.units.filter((unit) => unit.source._tag === "Token")
    ).toHaveLength(1);
  });

  it("applies Sabotage one time, for the Unit and not for its Token", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [["test.sabotageCaller", 0]]);
    giveHand(state, "enemy", [["human.militiaRecruit", 2]]);
    const { state: next, events } = playInto(state, 1, 2);
    const caller = next.units.find((unit) => unit.source._tag === "Card");
    expect(eventsOfType(events, "CardSabotaged")).toEqual([
      expect.objectContaining({ unitId: caller?.id, countdown: 3 }),
    ]);
    expect(eventsOfType(events, "TokenSummoned")).toHaveLength(1);
  });
});

describe("Tokens (GDD 4.9)", () => {
  it("does not send a dead Token to the Graveyard", () => {
    const state = emptyBattle();
    preventRout(state);
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      speed: 0,
    });
    const token = placeToken(state, {
      tokenId: "token.skeleton",
      owner: "enemy",
      position: 5,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitDied")).toEqual([
      expect.objectContaining({ unitId: token.id }),
    ]);
    expect(unitById(next, token.id)).toBeUndefined();
    expect(next.sides.enemy.graveyard).toEqual([]);
  });

  it("still sends the Card of a dead Card Unit to the Graveyard", () => {
    const state = emptyBattle();
    preventRout(state);
    placeToken(state, {
      tokenId: "token.skeleton",
      owner: "player",
      position: 4,
      rank: "legendary",
    });
    const victim = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      hp: 1,
      speed: 0,
    });
    const { state: next } = run(state, endTurn);
    expect(next.sides.enemy.graveyard).toEqual([cardOf(victim)]);
  });

  it("counts a Token as a friendly Unit for Swarm", () => {
    const state = emptyBattle();
    preventRout(state);
    const swarmer = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      swarm: 2,
      speed: 0,
    });
    placeToken(state, {
      tokenId: "token.restlessWisp",
      owner: "player",
      position: 0,
    });
    const enemy = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      hp: 30,
      maxHp: 30,
      speed: 0,
    });
    const { events } = run(state, endTurn);
    const hits = eventsOfType(events, "DamageDealt").filter(
      (event) =>
        event.source === "attack" &&
        event.target._tag === "Unit" &&
        event.target.unitId === enemy.id
    );
    expect(hits.map((event) => event.amount)).toEqual([swarmer.attack + 2]);
  });

  it("gives the Skeleton its Swarm bonus next to a friendly Unit", () => {
    const state = emptyBattle();
    preventRout(state);
    const skeleton = placeToken(state, {
      tokenId: "token.skeleton",
      owner: "player",
      position: 4,
    });
    placeToken(state, {
      tokenId: "token.skeleton",
      owner: "player",
      position: 0,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      hp: 30,
      maxHp: 30,
      speed: 0,
      attack: 0,
    });
    const { events } = run(state, endTurn);
    const attack = eventsOfType(events, "UnitAttacked").findIndex(
      (event) => event.unitId === skeleton.id
    );
    expect(attack).toBeGreaterThanOrEqual(0);
    expect(
      eventsOfType(events, "DamageDealt").find(
        (event) => event.source === "attack"
      )?.amount
    ).toBe(2);
  });

  it("counts a Token as a friendly Unit for Rally", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    preventRout(state);
    placeUnit(state, {
      cardId: "human.bannerChaplain",
      owner: "player",
      position: 0,
    });
    const token = placeToken(state, {
      tokenId: "token.skeleton",
      owner: "player",
      position: 2,
    });
    const { state: rallied } = run(state, endTurn);
    expect(unitById(rallied, token.id)?.rallied).toBe(1);
  });

  it("does not count a Token for Unique", () => {
    const state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [
      ["test.uniqueCaller", 0],
      ["test.uniqueCaller", 0],
    ]);
    const { state: played } = playInto(state, 1, 2);
    expect(legalTargets(played, 0)).toEqual([]);
    // Only the Token stays on the Board.
    played.units = played.units.filter((unit) => unit.source._tag === "Token");
    expect(legalTargets(played, 0).length).toBeGreaterThan(0);
  });

  it("stops a Routed result while it is on the Board", () => {
    const routed = emptyBattle();
    routed.sides.enemy.deck.push({
      instanceId: 1,
      cardId: "human.militiaRecruit",
      rank: "common",
    });
    const withToken = structuredClone(routed);
    placeToken(withToken, {
      tokenId: "token.skeleton",
      owner: "player",
      position: 0,
    });
    expect(run(routed, endTurn).state.result).toEqual({
      winner: "enemy",
      reason: "routed",
    });
    expect(run(withToken, endTurn).state.result).toBeNull();
  });
});
