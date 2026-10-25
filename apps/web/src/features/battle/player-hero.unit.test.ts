import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import { PLAYER_HERO, playerHand } from "@/features/battle/player-hero";
import { NEW_PLAYER } from "@/features/profile/profile";

const rules = () =>
  startSession({
    stageId: "1-1",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: 1,
  }).rules;

describe("playerHand", () => {
  it("gives the Hand of the Player's Hero", () => {
    const state = rules();
    const hand = playerHand(state);
    expect(hand.length).toBeGreaterThan(0);
    expect(hand).toBe(state.sides.player.heroes[PLAYER_HERO]?.hand);
  });

  it("gives an empty Hand when the Player's Side has no Hero", () => {
    const state = rules();
    expect(
      playerHand({
        ...state,
        sides: {
          ...state.sides,
          player: { ...state.sides.player, heroes: [] },
        },
      })
    ).toEqual([]);
  });
});
