import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { chooseCommand } from "../ai/choose-command";
import { getStarterDeck } from "../content/decks";
import { getStage } from "../content/stages";
import { emptyBattle } from "../testing/fixtures";
import { createBattle } from "./create-battle";
import { enemyHeroDamage } from "./enemy-hero-damage";
import { step } from "./step";
import { Command } from "./types";
import type { BattleState } from "./types";

describe("enemyHeroDamage (ADR-0041)", () => {
  it("gives the HP that the enemy Hero lost, of its maximum HP", () => {
    const state = emptyBattle({ enemy: { hp: 18, maxHp: 30 } });
    expect(enemyHeroDamage(state)).toEqual({ lost: 12, total: 30 });
  });

  it("adds all enemy Heroes, and a Defeated Hero lost all its HP", () => {
    const state = emptyBattle({
      lanes: 2,
      enemyHeroes: [
        { hp: 0, maxHp: 20, front: [0] },
        { hp: 25, maxHp: 30, front: [1] },
      ],
    });
    expect(enemyHeroDamage(state)).toEqual({ lost: 25, total: 50 });
  });

  it("does not count the HP of the Player's Hero", () => {
    const state = emptyBattle({ player: { hp: 1 } });
    expect(enemyHeroDamage(state)).toEqual({ lost: 0, total: 30 });
  });

  it("is 0 when the Player only ends the Turns until a loss", () => {
    const deck = getStarterDeck("vanguard");
    let { state }: { state: BattleState } = createBattle({
      seed: 7,
      stage: getStage("1-4"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    for (let commands = 0; state.status !== "finished"; commands += 1) {
      expect(commands).toBeLessThan(10_000);
      const command =
        state.activeSide === "player"
          ? Command.EndTurn()
          : chooseCommand(state);
      ({ state } = Result.getOrThrow(step(state, command)));
    }
    expect(state.result?.winner).toBe("enemy");
    expect(enemyHeroDamage(state).lost).toBe(0);
  });
});
