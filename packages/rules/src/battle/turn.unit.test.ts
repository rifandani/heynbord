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
  run,
  unitById,
} from "../testing/fixtures";
import { createBattle } from "./create-battle";
import { starsFor } from "./stars";
import { step } from "./step";
import { Command, Target } from "./types";

const endTurn = Command.EndTurn();

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
  it("draws 4 cards for each side and runs the player's first Start Step", () => {
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
    expect(state.sides.enemy.hero.hp).toBe(12);
  });

  it("puts the Stage's start Units on the Board", () => {
    const { state } = createBattle(setup(7, "1-10"));
    expect(state.units).toEqual([
      expect.objectContaining({
        owner: "enemy",
        lane: 1,
        position: 10,
        attack: 2,
        hp: 14,
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

describe("Start Step (GDD 4.3)", () => {
  it("lowers each Countdown by 1 to a minimum of 0, then draws 1 card", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "player", [
      ["human.militiaRecruit", 0],
      ["human.halberdier", 3],
    ]);
    state.sides.player.deck = [
      { instanceId: 1, cardId: "human.shieldbearer", rank: "common" },
    ];
    const { state: next, events } = run(state, endTurn);
    expect(next.sides.player.hand.map((card) => card.countdown)).toEqual([
      0, 2, 2,
    ]);
    expect(eventsOfType(events, "CardDrawn")).toEqual([
      expect.objectContaining({ side: "player" }),
    ]);
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
    const { state: next } = run(state, endTurn);
    expect(unitById(next, cleric.id)?.hp).toBe(6);
    expect(unitById(next, full.id)?.hp).toBe(8);
  });

  it("starts the next Turn number after the enemy's Turn", () => {
    const state = emptyBattle({ activeSide: "enemy", turnNumber: 4 });
    const { state: next } = run(state, endTurn);
    expect(next).toMatchObject({ activeSide: "player", turnNumber: 5 });
    const after = run(next, endTurn).state;
    expect(after).toMatchObject({ activeSide: "enemy", turnNumber: 5 });
  });
});

describe("Closed Lanes (GDD 4.1)", () => {
  it("opens a Closed Lane in the first Start Step of its Turn number", () => {
    const state = emptyBattle({
      lanes: 3,
      activeSide: "enemy",
      turnNumber: 4,
      closedLanes: [{ lane: 0 }, { lane: 2, opensOnTurn: 5 }],
    });
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
    const twenty = run(
      emptyBattle({ activeSide: "enemy", turnNumber: 19 }),
      endTurn
    ).state;
    expect(twenty.sides.player.hero.hp).toBe(29);
    const forty = run(
      emptyBattle({ activeSide: "enemy", turnNumber: 39 }),
      endTurn
    ).state;
    expect(forty.sides.player.hero.hp).toBe(28);
    const early = run(
      emptyBattle({ activeSide: "enemy", turnNumber: 18 }),
      endTurn
    ).state;
    expect(early.sides.player.hero.hp).toBe(30);
  });

  it("ends the Battle when Sudden Death takes the last HP", () => {
    const state = emptyBattle({
      activeSide: "enemy",
      turnNumber: 25,
      player: { hp: 1 },
    });
    const { state: next } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "enemy", reason: "heroDefeated" });
  });

  it("gives the win to the defender at the end of Turn number 60", () => {
    const state = emptyBattle({ activeSide: "enemy", turnNumber: 60 });
    const { state: next, events } = run(state, endTurn);
    expect(next).toMatchObject({
      phase: "finished",
      result: { winner: "enemy", reason: "turnLimit" },
    });
    expect(eventsOfType(events, "BattleEnded")).toHaveLength(1);
  });
});

describe("win and loss", () => {
  it("ends the Battle at once when a Hero has 0 HP, and refuses more Commands", () => {
    const state = emptyBattle({ enemy: { hp: 3 } });
    placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 11,
    });
    placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 10,
    });
    const { state: next, events } = run(state, endTurn);
    expect(next.result).toEqual({ winner: "player", reason: "heroDefeated" });
    expect(next.sides.enemy.hero.hp).toBe(0);
    // The second Unit does not act, and no End Step runs.
    expect(eventsOfType(events, "UnitAttacked")).toHaveLength(1);
    expect(eventsOfType(events, "TurnEnded")).toHaveLength(0);
    const again = step(next, endTurn);
    expect(Result.isFailure(again) && again.failure._tag).toBe(
      "BattleFinished"
    );
  });
});

const finished = (
  hp: number,
  turnNumber: number,
  winner: "player" | "enemy"
) => {
  const state = emptyBattle({ turnNumber, player: { hp, maxHp: 40 } });
  state.phase = "finished";
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
