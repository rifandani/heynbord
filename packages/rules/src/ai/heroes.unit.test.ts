import { describe, expect, it } from "vitest";

import type { BattleState, HeroState } from "../battle/types";
import { Command, DUNGEON_LANES, Target } from "../battle/types";
import {
  emptyBattle,
  giveHand,
  heroOf,
  placeUnit,
  run,
} from "../testing/fixtures";
import { chooseCommand, visibleTo } from "./choose-command";

/**
 * A Dungeon Board with 2 enemy Bosses: Boss 0 holds Lanes 1 and 2, Boss 1
 * holds Lanes 3 and 4. `boss1` changes Boss 1.
 */
const twoBosses = (
  activeSide: BattleState["activeSide"],
  boss1: Partial<HeroState> = {}
) =>
  emptyBattle({
    lanes: DUNGEON_LANES,
    activeSide,
    enemyHeroes: [{ front: [0, 1] }, { front: [2, 3], ...boss1 }],
  });

/** Runs the AI for one Play Phase, and returns the Hero of each play. */
const playPhase = (state: BattleState): number[] => {
  const heroes: number[] = [];
  let current = state;
  for (let plays = 0; plays < 20; plays += 1) {
    const command = chooseCommand(current);
    if (command._tag === "EndTurn") {
      return heroes;
    }
    heroes.push(command.hero);
    ({ state: current } = run(current, command));
  }
  throw new Error("The AI did not end the Play Phase");
};

describe("chooseCommand: a Side with 2 or more Heroes (GDD 9, ADR-0009)", () => {
  it("hides the Hand of each Hero of the other Side", () => {
    const state = twoBosses("player");
    giveHand(state, "enemy", [["orc.badlandRunt", 1]], 0);
    giveHand(state, "enemy", [["orc.tuskBrute", 3]], 1);
    const view = visibleTo(state, "player");
    expect(heroOf(view, "enemy", 0).hand).toEqual([
      expect.objectContaining({ cardId: "hidden", countdown: 1 }),
    ]);
    expect(heroOf(view, "enemy", 1).hand).toEqual([
      expect.objectContaining({ cardId: "hidden", countdown: 3 }),
    ]);
  });

  it("plays from more than one Boss in one Play Phase", () => {
    const state = twoBosses("enemy");
    giveHand(state, "enemy", [["human.militiaRecruit", 0]], 0);
    giveHand(state, "enemy", [["human.militiaRecruit", 0]], 1);
    expect(playPhase(state).toSorted()).toEqual([0, 1]);
  });

  it("defends the Lane of the Boss that is in danger, also with a card of another Boss", () => {
    // Boss 1 has 3 HP: the Militia Recruit in Lane 3 defeats it in the next
    // player Turn. Grukka in Lane 1 deals more damage and has more value, but
    // Boss 0 survives it.
    const state = twoBosses("enemy", { hp: 3 });
    giveHand(state, "enemy", [["warrior.spearThrow", 0]], 0);
    placeUnit(state, {
      cardId: "orc.warchiefGrukka",
      owner: "player",
      lane: 0,
      position: 10,
      attack: 8,
      hp: 4,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      lane: 2,
      position: 10,
      attack: 3,
      hp: 4,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 2, position: 10 }),
      })
    );
  });

  it("does not play for a Defeated Boss", () => {
    const state = emptyBattle({
      lanes: DUNGEON_LANES,
      activeSide: "enemy",
      enemyHeroes: [{ front: [0, 1, 2, 3] }, { front: [], hp: 0 }],
    });
    giveHand(state, "enemy", [["human.militiaRecruit", 0]], 1);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
    giveHand(state, "enemy", [["human.militiaRecruit", 0]], 0);
    expect(playPhase(state)).toEqual([0]);
  });

  it("gives Sabotage the value of the Hand of the Boss whose Front holds the Lane", () => {
    // Auto-play for the player: only Boss 1 has a Ready card.
    const state = twoBosses("player");
    giveHand(state, "player", [["goblin.tunnelSaboteur", 0]]);
    giveHand(state, "enemy", [["orc.tuskBrute", 4]], 0);
    giveHand(state, "enemy", [["orc.tuskBrute", 0]], 1);
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 2, position: 2 }),
      })
    );
  });

  it("aims Hero damage at the Boss that it defeats", () => {
    const state = twoBosses("player", { hp: 10 });
    giveHand(state, "player", [["ranger.longShot", 0, "uncommon"]]);
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Hero({ side: "enemy", hero: 1 }),
      })
    );
  });
});
