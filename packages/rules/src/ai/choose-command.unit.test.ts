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
    const pivot = emptyBattle({ activeSide: "enemy" });
    giveHand(pivot, "enemy", [["human.gateWarden", 0, "uncommon"]]);
    placeUnit(pivot, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 10,
    });
    expect(chooseCommand(pivot)).toEqual(
      Command.PlayCard({
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 9 }),
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
