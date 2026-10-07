import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { createBattle } from "../battle/create-battle";
import { step } from "../battle/step";
import type { BattleState } from "../battle/types";
import { Command, Target, TURN_LIMIT } from "../battle/types";
import { getStarterDeck, STARTER_DECKS } from "../content/decks";
import { getStage, STAGES } from "../content/stages";
import { emptyBattle, giveHand, placeUnit } from "../testing/fixtures";
import { chooseCommand, visibleTo } from "./choose-command";

/** Plays a full Battle with the AI on both sides (Auto-play for the player). */
const autoBattle = (seed: number, stageId: string, deckId: string) => {
  const deck = getStarterDeck(deckId);
  let { state } = createBattle({
    seed,
    stage: getStage(stageId),
    player: {
      classId: deck.classId,
      deck: deck.deck,
      level: 10,
      gear: { weapon: 3, armor: 3, trinket: 3, banner: 3 },
    },
  });
  const log: string[] = [];
  let commands = 0;
  while (state.phase !== "finished" && commands < 5000) {
    const command = chooseCommand(state);
    const result = step(state, command);
    if (Result.isFailure(result)) {
      throw new Error(`AI chose an illegal Command: ${result.failure._tag}`);
    }
    ({ state } = result.success);
    log.push(...result.success.events.map((event) => event._tag));
    commands += 1;
  }
  return { state, log };
};

const stateOf = (seed: number, stageId: string, deckId: string): BattleState =>
  autoBattle(seed, stageId, deckId).state;

/** A Spear Throw kills either Unit. The Tusk Brute in the other Lane is far away, and it has more value. */
const spearThrowChoice = (
  threat: Parameters<typeof placeUnit>[1],
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
  giveHand(state, "enemy", [["warrior.spearThrow", 0]]);
  placeUnit(state, threat);
  placeUnit(state, {
    cardId: "orc.tuskBrute",
    owner: "player",
    lane: 1,
    position: 3,
    hp: 4,
  });
  setup(state);
  return chooseCommand(state);
};

const spearThrowAt = (lane: number, position: number) =>
  Command.PlayCard({
    handIndex: 0,
    target: Target.Square({ lane, position }),
  });

/** The enemy Hero has 3 HP. A Spear Throw kills a near Militia Recruit or a far Grukka of more value. */
const lethalChoice = (turnNumber: number) => {
  const state = emptyBattle({
    lanes: 2,
    activeSide: "enemy",
    turnNumber,
    enemy: { hp: 3 },
  });
  giveHand(state, "enemy", [["warrior.spearThrow", 0]]);
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    lane: 0,
    position: 9,
    attack: 2,
    hp: 4,
  });
  placeUnit(state, {
    cardId: "orc.warchiefGrukka",
    owner: "player",
    lane: 1,
    position: 3,
    // High Attack gives Grukka more value than the Militia Recruit.
    attack: 8,
    hp: 4,
  });
  return chooseCommand(state);
};

describe("visibleTo (GDD 9)", () => {
  it("hides the other side's Hand and both Decks", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 2]]);
    giveHand(state, "enemy", [["orc.badlandPup", 1]]);
    state.sides.enemy.deck = [
      { instanceId: 1, cardId: "orc.tuskBrute", rank: "common" },
    ];
    const view = visibleTo(state, "enemy");
    expect(view.sides.player.hand).toEqual([
      expect.objectContaining({ cardId: "hidden", countdown: 2 }),
    ]);
    expect(view.sides.enemy.hand[0]?.cardId).toBe("orc.badlandPup");
    expect(view.sides.enemy.deck).toEqual([]);
    expect(view.random).toBe(0);
    expect(view.seed).toBe(0);
  });
});

describe("chooseCommand (GDD 9)", () => {
  it("ends the Turn when no card is Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 1]]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });

  it("summons into the deepest Square of the Lane with the largest threat", () => {
    const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
    giveHand(state, "enemy", [["human.shieldbearer", 0]]);
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      lane: 1,
      position: 6,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 1, position: 9 }),
      })
    );
  });

  it("blocks an enemy Unit in its Summon Zone, and summons past it only with Pivot", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["human.militiaRecruit", 0]]);
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 10,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 11 }),
      })
    );
    // In the last Column, no Square blocks the Tusk Brute, so the Hero damage is the same for all plays.
    const pivot = emptyBattle({ activeSide: "enemy" });
    giveHand(pivot, "enemy", [["human.gateWarden", 0, "uncommon"]]);
    placeUnit(pivot, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 11,
    });
    expect(chooseCommand(pivot)).toEqual(
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 10 }),
      })
    );
  });

  it("aims a damage card at a Unit that it can kill", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["mage.frostBolt", 0]]);
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 3,
      hp: 20,
      maxHp: 20,
    });
    placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 6,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 6 }),
      })
    );
  });

  it("keeps a Lane Armor card when no friendly Unit is in a Lane", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["warrior.shieldWall", 0]]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });
});

describe("chooseCommand: damage that the AI's Hero will take (GDD 9)", () => {
  it("blocks an enemy Unit that its next action takes to the last Column", () => {
    const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
    giveHand(state, "enemy", [["human.militiaRecruit", 0]]);
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      lane: 0,
      position: 9,
    });
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      lane: 1,
      position: 5,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 10 }),
      })
    );
  });

  it("kills a Unit that will hit its Hero before a Unit of more value", () => {
    expect(
      spearThrowChoice({
        cardId: "orc.scrapRaider",
        owner: "player",
        lane: 0,
        position: 9,
      })
    ).toEqual(spearThrowAt(0, 9));
  });

  it("does not count an enemy Unit that a friendly ground Unit blocks", () => {
    expect(
      spearThrowChoice(
        { cardId: "orc.scrapRaider", owner: "player", lane: 0, position: 9 },
        (state) => {
          placeUnit(state, {
            cardId: "human.townBarricade",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(1, 3));
  });

  it("does not count an enemy ground Unit that a friendly Flying Unit blocks", () => {
    expect(
      spearThrowChoice(
        { cardId: "orc.scrapRaider", owner: "player", lane: 0, position: 9 },
        (state) => {
          placeUnit(state, {
            cardId: "orc.skyreaver",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(1, 3));
  });

  it("counts an enemy Flying Unit that is past a friendly blocker", () => {
    expect(
      spearThrowChoice(
        {
          cardId: "orc.skyreaver",
          owner: "player",
          lane: 0,
          position: 9,
          hp: 4,
        },
        (state) => {
          placeUnit(state, {
            cardId: "human.townBarricade",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(0, 9));
  });

  it("counts an enemy Ranged Unit that has the Hero in its Range", () => {
    expect(
      spearThrowChoice({
        cardId: "human.crossbowGuard",
        owner: "player",
        lane: 0,
        position: 9,
        hp: 4,
      })
    ).toEqual(spearThrowAt(0, 9));
  });

  it("removes lethal damage first, with the Sudden Death of its next Start Step", () => {
    // 3 HP − 2 damage is not lethal before Sudden Death, so the Unit of more value dies.
    expect(lethalChoice(1)).toEqual(spearThrowAt(1, 3));
    // At the next Start Step (Turn 21), Sudden Death deals 1: 3 − 1 − 2 = 0.
    expect(lethalChoice(20)).toEqual(spearThrowAt(0, 9));
  });
});

describe("determinism (BAT-06) and Battle length", () => {
  it("gives the same events from the same seed and Commands", () => {
    expect(autoBattle(11, "1-3", "raiders")).toEqual(
      autoBattle(11, "1-3", "raiders")
    );
  });

  it("finishes every Battle before the Turn limit is passed", () => {
    for (const stage of STAGES) {
      for (const deck of STARTER_DECKS) {
        for (let seed = 1; seed <= 6; seed += 1) {
          const state = stateOf(seed, stage.id, deck.id);
          expect(state.phase).toBe("finished");
          expect(state.turnNumber).toBeLessThanOrEqual(TURN_LIMIT);
        }
      }
    }
  });
});

describe("chooseCommand with Unique (GDD 5.4)", () => {
  it("does not play a Unique card while a friendly Unit from it is on the Board", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.marshalElianVoss",
      owner: "player",
      position: 4,
    });
    giveHand(state, "player", [["human.marshalElianVoss", 0]]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });
});
