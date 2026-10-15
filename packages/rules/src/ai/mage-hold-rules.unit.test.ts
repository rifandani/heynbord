import { describe, expect, it } from "vitest";

import { areaSquares } from "../battle/targets";
import { Command, Target } from "../battle/types";
import type { BattleState } from "../battle/types";
import { emptyBattle, giveHand, placeUnit } from "../testing/fixtures";
import { chooseCommand } from "./choose-command";

/**
 * The enemy AI with one Ready Mage card at `rank`. The player Units are
 * Halberdiers (4/6, Speed 1, melee) at `[lane, position, hp]`.
 */
const mageChoice = (
  cardId: string,
  rank: "common" | "uncommon" | "rare" | "epic",
  units: readonly (readonly [lane: number, position: number, hp: number])[],
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ lanes: 3, activeSide: "enemy" });
  giveHand(state, "enemy", [[cardId, 0, rank]]);
  for (const [lane, position, hp] of units) {
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "player",
      lane,
      position,
      hp,
    });
  }
  setup(state);
  return chooseCommand(state);
};

/** Spark with one player Unit next to the enemy Hero that has `status`. */
const keep = (status: "paralyzed" | "frozen") =>
  mageChoice("mage.spark", "common", [], (state) => {
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "player",
      position: 10,
      [status]: true,
    });
  });

const playAt = (lane: number, position: number) =>
  Command.PlayCard({
    hero: 0,
    handIndex: 0,
    target: Target.Square({ lane, position }),
  });

describe("chooseCommand: Mage Hold Rules of #65 (GDD 9)", () => {
  it("keeps Spark until the target would attack in its next action, or the hit kills", () => {
    // Far from the enemy Hero and from each enemy Unit: no attack next.
    expect(mageChoice("mage.spark", "common", [[0, 2, 6]])).toEqual(
      Command.EndTurn()
    );
    // An enemy Unit in reach: the Halberdier attacks it next.
    expect(
      mageChoice("mage.spark", "common", [[0, 2, 6]], (state) => {
        placeUnit(state, {
          cardId: "human.halberdier",
          owner: "enemy",
          position: 4,
        });
      })
    ).toEqual(playAt(0, 2));
    // The hit kills.
    expect(mageChoice("mage.spark", "common", [[0, 2, 1]])).toEqual(
      playAt(0, 2)
    );
  });

  it("does not Spark a Unit that is already Paralyzed or Frozen", () => {
    expect(keep("paralyzed")).toEqual(Command.EndTurn());
    expect(keep("frozen")).toEqual(Command.EndTurn());
  });

  it("keeps Arc Lightning until it hits 2 or more Units, or the hit kills", () => {
    expect(mageChoice("mage.arcLightning", "uncommon", [[1, 5, 6]])).toEqual(
      Command.EndTurn()
    );
    expect(
      mageChoice("mage.arcLightning", "uncommon", [
        [1, 5, 6],
        [2, 5, 6],
      ])
    ).toEqual(
      expect.objectContaining({
        target: expect.objectContaining({ position: 5 }),
      })
    );
    expect(mageChoice("mage.arcLightning", "uncommon", [[1, 5, 2]])).toEqual(
      playAt(1, 5)
    );
  });

  it("keeps Thunderstorm until 2 or more enemy Units are on the Board", () => {
    expect(mageChoice("mage.thunderstorm", "rare", [[0, 5, 6]])).toEqual(
      Command.EndTurn()
    );
    expect(
      mageChoice("mage.thunderstorm", "rare", [
        [0, 5, 6],
        [2, 3, 6],
      ])
    ).toEqual(
      Command.PlayCard({ hero: 0, handIndex: 0, target: Target.NoTarget() })
    );
  });

  it("keeps Wildfire and Blizzard until an area has 2 or more enemy Units, and plays on the area with the most", () => {
    for (const [cardId, rank] of [
      ["mage.wildfire", "rare"],
      ["mage.blizzard", "epic"],
    ] as const) {
      expect(mageChoice(cardId, rank, [[0, 5, 30]]), cardId).toEqual(
        Command.EndTurn()
      );
      const units = [
        [0, 5, 30],
        [1, 5, 30],
        [1, 6, 30],
        [2, 9, 30],
      ] as const;
      const choice = mageChoice(cardId, rank, units);
      expect(choice._tag, cardId).toBe("PlayCard");
      if (choice._tag !== "PlayCard" || choice.target._tag !== "Square") {
        throw new Error(`${cardId}: no area play`);
      }
      const size =
        cardId === "mage.wildfire"
          ? { lanes: 2, columns: 2 }
          : { lanes: 3, columns: 2 };
      const squares = areaSquares(
        "enemy",
        choice.target.lane,
        choice.target.position,
        size
      );
      const covered = units.filter(([lane, position]) =>
        squares.some(
          (square) => square.lane === lane && square.position === position
        )
      );
      expect(covered, cardId).toHaveLength(3);
    }
  });
});
