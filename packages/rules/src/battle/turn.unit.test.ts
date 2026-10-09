import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { getCard } from "../content/cards";
import { getStarterDeck } from "../content/decks";
import { getStage } from "../content/stages";
import {
  emptyBattle,
  eventsOfType,
  giveHand,
  placeUnit,
  preventRout,
  run,
  unitById,
} from "../testing/fixtures";
import { createBattle } from "./create-battle";
import { starsFor } from "./stars";
import { step } from "./step";
import { Command, LANE_LENGTH, Target } from "./types";
import type { BattleState } from "./types";

const endTurn = Command.EndTurn();

const countdownsOf = (state: BattleState) =>
  state.sides.player.hand.map((card) => card.countdown);

/** An enemy Turn at `turnNumber` that the Routed check does not end. */
const enemyTurnAt = (turnNumber: number) => {
  const state = emptyBattle({ activeSide: "enemy", turnNumber });
  preventRout(state);
  return state;
};

const setup = (seed: number, stageId = "1-1") => {
  const deck = getStarterDeck("vanguard");
  return {
    seed,
    stage: getStage(stageId),
    player: {
      classId: deck.classId,
      deck: deck.deck,
      level: 10,
      gear: { weapon: 3, armor: 3, trinket: 3, banner: 3 },
    },
  };
};

describe("createBattle (GDD 4.2)", () => {
  it("draws 4 cards for each side and runs the player's first Start Phase", () => {
    const { state, events } = createBattle(setup(7));
    expect(state.sides.player.hand).toHaveLength(5);
    expect(state.sides.enemy.hand).toHaveLength(4);
    expect(state.activeSide).toBe("player");
    expect(state.turnNumber).toBe(1);
    expect(eventsOfType(events, "TurnStarted")).toEqual([
      expect.objectContaining({ side: "player", turnNumber: 1 }),
    ]);
  });

  it("gives the player 30 + level HP plus the Armor Gear bonus", () => {
    const { state } = createBattle(setup(7));
    expect(state.sides.player.hero).toMatchObject({
      hp: 46,
      maxHp: 46,
      unitCrit: 300,
      skillCrit: 450,
      unitBlock: 300,
    });
    expect(state.sides.enemy.hero.hp).toBe(6);
  });

  it("puts the Stage's start Units on the Board", () => {
    const { state } = createBattle(setup(7, "1-10"));
    expect(state.units).toEqual([
      expect.objectContaining({
        owner: "enemy",
        lane: 1,
        position: 10,
        attack: 2,
        hp: 12,
      }),
    ]);
  });

  it("gives every Stage 3 Lanes and the Closed Lanes of the Stage (ADR-0010)", () => {
    const closed = {
      ...setup(7, "1-1"),
      stage: {
        ...getStage("1-1"),
        closedLanes: [{ lane: 0 }, { lane: 2, opensOnTurn: 5 }],
      },
    };
    expect(createBattle(closed).state).toMatchObject({
      lanes: 3,
      closedLanes: [{ lane: 0 }, { lane: 2, opensOnTurn: 5 }],
    });
    expect(createBattle(setup(7, "1-10")).state).toMatchObject({
      lanes: 3,
      closedLanes: [],
    });
  });

  it("refuses a start Unit that is not a Creature Card", () => {
    const stage = getStage("1-10");
    const bad = {
      ...setup(7, "1-10"),
      stage: {
        ...stage,
        enemy: {
          ...stage.enemy,
          startUnits: [
            {
              cardId: "warrior.warDrums",
              rank: "common" as const,
              lane: 0,
              position: 10,
            },
          ],
        },
      },
    };
    expect(() => createBattle(bad)).toThrow("needs a Creature Card");
  });

  it("gives instance IDs after the shuffle, so a hidden card ID does not show the card", () => {
    for (const seed of [1, 2, 3]) {
      const { state } = createBattle(setup(seed));
      const deckSize = getStarterDeck("vanguard").deck.length;
      expect(state.sides.enemy.hand.map((card) => card.instanceId)).toEqual([
        deckSize + 1,
        deckSize + 2,
        deckSize + 3,
        deckSize + 4,
      ]);
    }
  });

  it("keeps the drawn Countdown in each CardDrawn event", () => {
    const { events } = createBattle(setup(7));
    for (const event of eventsOfType(events, "CardDrawn")) {
      expect(event.card.countdown).toBe(getCard(event.card.cardId).countdown);
    }
  });

  it("gives the same Battle for the same seed", () => {
    expect(createBattle(setup(99))).toEqual(createBattle(setup(99)));
    expect(createBattle(setup(99)).state.sides.player.hand).not.toEqual(
      createBattle(setup(100)).state.sides.player.hand
    );
  });
});

describe("Start Phase (GDD 4.3)", () => {
  it("lowers the Countdown of each card that is not Ready by 1, then draws 1 card", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "player", [
      ["human.militiaRecruit", 0],
      ["human.halberdier", 3],
    ]);
    state.sides.player.deck = [
      { instanceId: 1, cardId: "human.shieldbearer", rank: "common" },
    ];
    preventRout(state);
    const { state: next, events } = run(state, endTurn);
    expect(next.sides.player.hand.map((card) => card.countdown)).toEqual([
      0, 2, 2,
    ]);
    expect(eventsOfType(events, "CardDrawn")).toEqual([
      expect.objectContaining({ side: "player" }),
    ]);
  });

  it("lowers the Countdown of each card in a full Hand (ADR-0021)", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "player", [
      ["human.halberdier", 4],
      ["human.halberdier", 3],
      ["human.halberdier", 2],
      ["human.halberdier", 1],
      ["human.halberdier", 5],
      ["human.halberdier", 6],
      ["human.halberdier", 2],
      ["human.halberdier", 3],
    ]);
    preventRout(state);
    const { state: next, events } = run(state, endTurn);
    expect(countdownsOf(next)).toEqual([3, 2, 1, 0, 4, 5, 1, 2]);
    expect(eventsOfType(events, "CountdownsTicked")).toEqual([
      expect.objectContaining({
        side: "player",
        countdowns: [3, 2, 1, 0, 4, 5, 1, 2],
      }),
    ]);
  });

  it("keeps a Ready card at 0 and lowers the cards after it", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "player", [
      ["human.halberdier", 0],
      ["human.halberdier", 2],
      ["human.halberdier", 0],
      ["human.halberdier", 3],
      ["human.halberdier", 4],
      ["human.halberdier", 5],
    ]);
    preventRout(state);
    const { state: next } = run(state, endTurn);
    expect(countdownsOf(next)).toEqual([0, 1, 0, 2, 3, 4]);
  });

  it("puts a Recalled Skill Card at the end of the Hand, and it counts down with the other cards", () => {
    let recalled = false;
    for (let random = 0; random < 60 && !recalled; random += 1) {
      const state = emptyBattle({ random });
      giveHand(state, "player", [
        ["warrior.warDrums", 0, "legendary"],
        ["human.halberdier", 6],
        ["human.halberdier", 6],
        ["human.halberdier", 6],
      ]);
      preventRout(state);
      const played = run(
        state,
        Command.PlayCard({ handIndex: 0, target: Target.NoTarget() })
      );
      const [roll] = eventsOfType(played.events, "RecallRolled");
      if (!roll?.success) {
        continue;
      }
      recalled = true;
      expect(played.state.sides.player.hand.at(-1)).toMatchObject({
        cardId: "warrior.warDrums",
        countdown: 2,
      });
      // War Drums lowered 2 of the 3 Halberdiers to 5. The enemy Turn, then the player Start Phase.
      const enemyTurn = run(played.state, endTurn).state;
      const { state: next } = run(enemyTurn, endTurn);
      expect(countdownsOf(next).toSorted()).toEqual([1, 4, 4, 5]);
      expect(next.sides.player.hand.at(-1)).toMatchObject({
        cardId: "warrior.warDrums",
        countdown: 1,
      });
    }
    expect(recalled).toBe(true);
  });

  it("keeps a Sabotaged card in its place in the Hand, and it counts down again", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["goblin.tunnelSaboteur", 0]]);
    giveHand(state, "player", [
      ["human.halberdier", 0],
      ["human.halberdier", 5],
      ["human.halberdier", 5],
      ["human.halberdier", 5],
    ]);
    const sabotaged = run(
      state,
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: LANE_LENGTH - 1 }),
      })
    ).state;
    expect(countdownsOf(sabotaged)).toEqual([1, 5, 5, 5]);
    const { state: next } = run(sabotaged, endTurn);
    expect(countdownsOf(next)).toEqual([0, 4, 4, 4]);
  });

  it("Sabotages the oldest card on a tie, then counts down the whole Hand (ADR-0021)", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["goblin.tunnelSaboteur", 0]]);
    giveHand(state, "player", [
      ["human.halberdier", 5],
      ["human.halberdier", 2],
      ["human.halberdier", 2],
    ]);
    const sabotaged = run(
      state,
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: LANE_LENGTH - 1 }),
      })
    ).state;
    expect(countdownsOf(sabotaged)).toEqual([5, 3, 2]);
    const { state: next } = run(sabotaged, endTurn);
    expect(countdownsOf(next)).toEqual([4, 2, 1]);
  });

  it("does not draw with 8 cards in the Hand", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(
      state,
      "player",
      Array.from({ length: 8 }, () => ["human.militiaRecruit", 1] as const)
    );
    state.sides.player.deck = [
      { instanceId: 1, cardId: "human.shieldbearer", rank: "common" },
    ];
    const { state: next } = run(state, endTurn);
    expect(next.sides.player.hand).toHaveLength(8);
    expect(next.sides.player.deck).toHaveLength(1);
  });

  it("heals Regeneration Units up to their maximum HP", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const cleric = placeUnit(state, {
      cardId: "human.dawnCleric",
      owner: "player",
      position: 0,
      hp: 5,
      maxHp: 8,
    });
    const full = placeUnit(state, {
      cardId: "human.dawnCleric",
      owner: "player",
      position: 0,
      lane: 0,
      hp: 8,
      maxHp: 8,
    });
    full.position = 1;
    preventRout(state);
    const { state: next } = run(state, endTurn);
    expect(unitById(next, cleric.id)?.hp).toBe(6);
    expect(unitById(next, full.id)?.hp).toBe(8);
  });

  it("starts the next Turn number after the enemy's Turn", () => {
    const state = emptyBattle({ activeSide: "enemy", turnNumber: 4 });
    preventRout(state);
    const { state: next } = run(state, endTurn);
    expect(next).toMatchObject({ activeSide: "player", turnNumber: 5 });
    const after = run(next, endTurn).state;
    expect(after).toMatchObject({ activeSide: "enemy", turnNumber: 5 });
  });
});

describe("Closed Lanes (GDD 4.1)", () => {
  it("opens a Closed Lane in the first Start Phase of its Turn number", () => {
    const state = emptyBattle({
      lanes: 3,
      activeSide: "enemy",
      turnNumber: 4,
      closedLanes: [{ lane: 0 }, { lane: 2, opensOnTurn: 5 }],
    });
    preventRout(state);
    const { state: next, events } = run(state, endTurn);
    expect(next.closedLanes).toEqual([{ lane: 0 }]);
    expect(eventsOfType(events, "LaneOpened")).toEqual([
      expect.objectContaining({ lane: 2 }),
    ]);
    const later = run(run(next, endTurn).state, endTurn);
    expect(later.state.closedLanes).toEqual([{ lane: 0 }]);
    expect(eventsOfType(later.events, "LaneOpened")).toEqual([]);
  });
});

describe("Sudden Death and the Turn limit (GDD 4.10)", () => {
  it("hits the active Hero for 1 from Turn number 20 and for 2 from Turn number 40", () => {
    const twenty = run(enemyTurnAt(19), endTurn).state;
    expect(twenty.sides.player.hero.hp).toBe(29);
    const forty = run(enemyTurnAt(39), endTurn).state;
    expect(forty.sides.player.hero.hp).toBe(28);
    const early = run(enemyTurnAt(18), endTurn).state;
    expect(early.sides.player.hero.hp).toBe(30);
  });

  it("ends the Battle when Sudden Death takes the last HP", () => {
    const state = emptyBattle({
      activeSide: "enemy",
      turnNumber: 25,
      player: { hp: 1 },
    });
    preventRout(state);
    const { state: next } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "enemy", reason: "heroDefeated" });
  });

  it("gives the win to the defender at the end of Turn number 60", () => {
    const state = emptyBattle({ activeSide: "enemy", turnNumber: 60 });
    preventRout(state);
    const { state: next, events } = run(state, endTurn);
    expect(next).toMatchObject({
      status: "finished",
      result: { winner: "enemy", reason: "turnLimit" },
    });
    expect(eventsOfType(events, "BattleEnded")).toHaveLength(1);
  });
});

describe("win and loss", () => {
  it("ends the Battle at once when a Hero has 0 HP, and refuses more Commands", () => {
    const state = emptyBattle({ enemy: { hp: 3 } });
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 11,
    });
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 10,
    });
    const { state: next, events } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "player", reason: "heroDefeated" });
    expect(next.sides.enemy.hero.hp).toBe(0);
    // The second Unit does not act, and no End Phase runs.
    expect(eventsOfType(events, "UnitAttacked")).toHaveLength(1);
    expect(eventsOfType(events, "TurnEnded")).toHaveLength(0);
    const again = step(next, endTurn);
    expect(Result.isFailure(again) && again.failure._tag).toBe(
      "BattleFinished"
    );
  });
});

describe("Routed (ADR-0012)", () => {
  it("gives the win to the player when the enemy has no Units and no Cards at the end of a Turn", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.halberdier", 3]]);
    const { state: next, events } = run(state, endTurn);
    expect(next).toMatchObject({
      status: "finished",
      result: { winner: "player", reason: "routed" },
    });
    expect(eventsOfType(events, "BattleEnded")).toHaveLength(1);
    // The check comes after the End Phase, and the enemy Start Phase does not run.
    expect(eventsOfType(events, "TurnEnded")).toHaveLength(1);
    expect(eventsOfType(events, "TurnStarted")).toHaveLength(0);
  });

  it("gives the win to the enemy when the player is Routed", () => {
    const state = emptyBattle();
    giveHand(state, "enemy", [["human.halberdier", 3]]);
    const { state: next } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "enemy", reason: "routed" });
  });

  it("gives the win to the defender when both Sides are Routed at the same check", () => {
    const { state: next } = run(emptyBattle(), endTurn);
    expect(next.result).toEqual({ winner: "enemy", reason: "routed" });
  });

  it("counts a Card that is not Ready, a Card in the Deck and a Unit", () => {
    const hand = emptyBattle();
    giveHand(hand, "player", [["human.halberdier", 6]]);
    giveHand(hand, "enemy", [["human.halberdier", 6]]);
    expect(run(hand, endTurn).state.result).toBeNull();

    const deck = emptyBattle();
    preventRout(deck);
    expect(run(deck, endTurn).state.result).toBeNull();

    const units = emptyBattle();
    placeUnit(units, {
      cardId: "human.halberdier",
      owner: "player",
      position: 0,
    });
    placeUnit(units, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: LANE_LENGTH - 1,
    });
    expect(run(units, endTurn).state.result).toBeNull();
  });

  it("checks after the End Phase, so Burn can make a Side Routed", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "player", [["human.halberdier", 3]]);
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: LANE_LENGTH - 1,
      attack: 0,
      hp: 1,
      maxHp: 1,
      burn: 1,
    });
    const { state: next } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "player", reason: "routed" });
  });

  it("checks Routed before the Turn limit at the end of Turn number 60", () => {
    const state = emptyBattle({ activeSide: "enemy", turnNumber: 60 });
    giveHand(state, "player", [["human.halberdier", 3]]);
    const { state: next } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "player", reason: "routed" });
  });

  it("checks at the end of the Turn, so a Recalled last Card saves the Side", () => {
    const outcomes = new Set<boolean>();
    for (let random = 0; random < 60 && outcomes.size < 2; random += 1) {
      const state = emptyBattle({ random });
      giveHand(state, "player", [["warrior.warDrums", 0, "legendary"]]);
      giveHand(state, "enemy", [["human.halberdier", 3]]);
      const played = run(
        state,
        Command.PlayCard({ handIndex: 0, target: Target.NoTarget() })
      );
      const [roll] = eventsOfType(played.events, "RecallRolled");
      const success = roll?.success === true;
      outcomes.add(success);
      // The Side is Routed between the play and the Recall roll, but the check waits for the end of the Turn.
      expect(played.state.result).toBeNull();
      const { state: next } = run(played.state, endTurn);
      expect(next.result).toEqual(
        success ? null : { winner: "enemy", reason: "routed" }
      );
    }
    expect(outcomes).toEqual(new Set([true, false]));
  });
});

const finished = (
  hp: number,
  turnNumber: number,
  winner: "player" | "enemy"
) => {
  const state = emptyBattle({ turnNumber, player: { hp, maxHp: 40 } });
  state.status = "finished";
  state.result = { winner, reason: "heroDefeated" };
  return state;
};

describe("starsFor (GDD 4.11)", () => {
  it("gives 0 for a loss and 1 to 3 for a win", () => {
    expect(starsFor(finished(40, 5, "enemy"))).toBe(0);
    expect(starsFor(finished(19, 5, "player"))).toBe(1);
    expect(starsFor(finished(20, 15, "player"))).toBe(2);
    expect(starsFor(finished(20, 14, "player"))).toBe(3);
  });
});

describe("purity", () => {
  it("does not change the input state", () => {
    const { state } = createBattle(setup(3));
    const before = structuredClone(state);
    run(state, endTurn);
    const ready = state.sides.player.hand.findIndex(
      (card) => card.countdown === 0
    );
    if (ready !== -1) {
      step(
        state,
        Command.PlayCard({ handIndex: ready, target: Target.Lane({ lane: 0 }) })
      );
    }
    expect(state).toEqual(before);
  });
});

/**
 * The enemy ends its Turn, so the player's Start Phase runs. The player has a
 * Unit with Rally 1 at Square 0 of Lane 0.
 */
const rallyBoard = (extraRally = false) => {
  const state = emptyBattle({ activeSide: "enemy", lanes: 2 });
  const elk = placeUnit(state, {
    cardId: "feral.frostElkMatriarch",
    owner: "player",
    position: 0,
  });
  const second = extraRally
    ? placeUnit(state, {
        cardId: "feral.frostElkMatriarch",
        owner: "player",
        position: 1,
      })
    : undefined;
  const ally = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    position: 2,
  });
  const otherLane = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    lane: 1,
    position: 2,
  });
  const enemy = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "enemy",
    position: 3,
    attack: 0,
    hp: 20,
    maxHp: 20,
    speed: 0,
  });
  return { elk, second, ally, otherLane, enemy, ...run(state, endTurn) };
};

describe("Rally (GDD 4.3, 5.4)", () => {
  it("gives the other friendly Units in the Lane +N Attack in the owner's Start Phase", () => {
    const { state, elk, ally, otherLane, enemy } = rallyBoard();
    expect(state.activeSide).toBe("player");
    expect(unitById(state, ally.id)?.rallied).toBe(1);
    expect(unitById(state, elk.id)?.rallied).toBe(0);
    expect(unitById(state, otherLane.id)?.rallied).toBe(0);
    expect(unitById(state, enemy.id)?.rallied).toBe(0);
  });

  it("adds the bonus to attacks, and the bonus ends at the end of the Turn", () => {
    const { state, ally, enemy } = rallyBoard();
    const { state: next, events } = run(state, endTurn);
    expect(
      eventsOfType(events, "DamageDealt").find(
        (event) =>
          event.target._tag === "Unit" && event.target.unitId === enemy.id
      )?.amount
    ).toBe(4);
    expect(unitById(next, enemy.id)?.hp).toBe(16);
    expect(unitById(next, ally.id)?.rallied).toBe(0);
  });

  it("adds no bonus to Retaliation, because it occurs in the enemy's Turn", () => {
    const state = emptyBattle({ activeSide: "enemy", lanes: 1 });
    placeUnit(state, {
      cardId: "feral.frostElkMatriarch",
      owner: "player",
      position: 0,
    });
    const halberdier = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "player",
      position: 2,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 3,
      attack: 1,
      hp: 30,
      maxHp: 30,
      speed: 0,
    });
    const { state: rallied } = run(state, endTurn);
    expect(unitById(rallied, halberdier.id)?.rallied).toBe(1);
    const { state: enemyTurn } = run(rallied, endTurn);
    expect(unitById(enemyTurn, halberdier.id)?.rallied).toBe(0);
    const { events } = run(enemyTurn, endTurn);
    expect(
      eventsOfType(events, "DamageDealt")
        .filter((event) => event.source === "retaliation")
        .map((event) => event.amount)
    ).toEqual([4]);
  });

  it("adds the bonuses of two Rally Units", () => {
    const { state, elk, second, ally } = rallyBoard(true);
    expect(unitById(state, ally.id)?.rallied).toBe(2);
    expect(unitById(state, elk.id)?.rallied).toBe(1);
    expect(unitById(state, second?.id ?? 0)?.rallied).toBe(1);
  });

  it("gives no bonus to a Unit with Base Attack 0, so it does not attack", () => {
    const state = emptyBattle({ activeSide: "enemy", lanes: 1 });
    placeUnit(state, {
      cardId: "feral.frostElkMatriarch",
      owner: "player",
      position: 0,
    });
    const tortoise = placeUnit(state, {
      cardId: "feral.boulderTortoise",
      owner: "player",
      position: 2,
    });
    const enemy = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 3,
      attack: 0,
      speed: 0,
    });
    const { state: rallied } = run(state, endTurn);
    expect(unitById(rallied, tortoise.id)?.rallied).toBe(0);
    const { events } = run(rallied, endTurn);
    expect(
      eventsOfType(events, "UnitAttacked").filter(
        (event) => event.unitId === tortoise.id
      )
    ).toHaveLength(0);
    expect(
      eventsOfType(events, "DamageDealt").filter(
        (event) =>
          event.target._tag === "Unit" && event.target.unitId === enemy.id
      )
    ).toHaveLength(0);
  });
});

describe("Bleeding (GDD 4.7, ADR-0019)", () => {
  it("halves each heal and rounds down, so Regeneration 2 heals 1 and Regeneration 1 heals 0", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const troll = placeUnit(state, {
      cardId: "feral.caveTroll",
      owner: "player",
      position: 0,
      hp: 5,
      bleeding: 2,
    });
    const cleric = placeUnit(state, {
      cardId: "human.dawnCleric",
      owner: "player",
      lane: 1,
      position: 0,
      hp: 5,
      bleeding: 2,
    });
    preventRout(state);
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, troll.id)?.hp).toBe(6);
    expect(unitById(next, cleric.id)?.hp).toBe(5);
    expect(eventsOfType(events, "UnitHealed")).toEqual([
      expect.objectContaining({ unitId: troll.id, amount: 1, hp: 6 }),
    ]);
  });

  it("lowers the count by 1 only in the End Phase of the owner", () => {
    let state = emptyBattle();
    const troll = placeUnit(state, {
      cardId: "feral.caveTroll",
      owner: "player",
      position: 0,
      attack: 0,
      speed: 0,
      bleeding: 2,
    });
    preventRout(state);
    ({ state } = run(state, endTurn));
    expect(unitById(state, troll.id)?.bleeding).toBe(1);
    ({ state } = run(state, endTurn));
    expect(unitById(state, troll.id)?.bleeding).toBe(1);
    ({ state } = run(state, endTurn));
    expect(unitById(state, troll.id)?.bleeding).toBe(0);
  });
});
