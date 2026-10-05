import { Result } from "effect";
import { describe, expect, it } from "vitest";

import {
  emptyBattle,
  eventsOfType,
  giveHand,
  placeUnit,
  run,
  unitById,
} from "../testing/fixtures";
import { step } from "./step";
import { legalTargets, unitsInArea } from "./targets";
import { Command, Target } from "./types";

const play = (handIndex: number, target: Target) =>
  Command.PlayCard({ handIndex, target });

const violation = (result: ReturnType<typeof step>) =>
  Result.isFailure(result) ? result.failure._tag : "none";

const ids = (units: readonly { readonly id: number }[]) =>
  units.map((unit) => unit.id);

const square = (lane: number, position: number) =>
  Target.Square({ lane, position });

describe("playing a Creature Card (GDD 4.1, 4.3)", () => {
  it("summons a Unit into an empty Square of the Summon Zone", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    const { state: next, events } = run(state, play(0, square(1, 2)));
    expect(next.sides.player.hand).toHaveLength(0);
    expect(next.units).toEqual([
      expect.objectContaining({ owner: "player", lane: 1, position: 2, hp: 4 }),
    ]);
    expect(eventsOfType(events, "UnitSummoned")).toHaveLength(1);
  });

  it("gives Columns 1 to 3 of each open Lane, for each Side (ADR-0011)", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(legalTargets(state, 0)).toEqual([
      square(0, 0),
      square(0, 1),
      square(0, 2),
      square(1, 0),
      square(1, 1),
      square(1, 2),
    ]);
    expect(violation(step(state, play(0, square(0, 3))))).toBe("IllegalTarget");
    const enemy = emptyBattle({ activeSide: "enemy" });
    giveHand(enemy, "enemy", [["orc.badlandPup", 0]]);
    expect(legalTargets(enemy, 0)).toEqual([
      square(0, 11),
      square(0, 10),
      square(0, 9),
    ]);
    const { state: next } = run(enemy, play(0, square(0, 9)));
    expect(next.units[0]).toMatchObject({ owner: "enemy", position: 9 });
  });

  it("lets a side summon past an enemy Unit in its Summon Zone", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "enemy",
      position: 1,
    });
    expect(legalTargets(state, 0)).toEqual([square(0, 0), square(0, 2)]);
    const { state: next } = run(state, play(0, square(0, 2)));
    expect(next.units.at(-1)).toMatchObject({ owner: "player", position: 2 });
  });

  it("scales Attack and HP with the Rank", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.shieldbearer", 0, "legendary"]]);
    const { state: next } = run(state, play(0, square(0, 0)));
    expect(next.units[0]).toMatchObject({ attack: 2, hp: 17 });
  });

  it("refuses a card that is not Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 1]]);
    expect(violation(step(state, play(0, square(0, 0))))).toBe("CardNotReady");
    expect(legalTargets(state, 0)).toEqual([]);
  });

  it("refuses an occupied Square, a Lane target, a Lane that does not exist, and a bad hand index", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(violation(step(state, play(0, square(1, 0))))).toBe("IllegalTarget");
    expect(violation(step(state, play(0, Target.Lane({ lane: 0 }))))).toBe(
      "IllegalTarget"
    );
    expect(violation(step(state, play(3, square(0, 0))))).toBe(
      "InvalidHandIndex"
    );
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 0,
    });
    expect(violation(step(state, play(0, square(0, 0))))).toBe("IllegalTarget");
  });

  it("refuses a Closed Lane for a summon", () => {
    const state = emptyBattle({
      lanes: 3,
      closedLanes: [{ lane: 0 }, { lane: 2 }],
    });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    expect(legalTargets(state, 0)).toEqual([
      square(1, 0),
      square(1, 1),
      square(1, 2),
    ]);
    expect(violation(step(state, play(0, square(0, 0))))).toBe("IllegalTarget");
  });

  it("lets the side play all its Ready cards in one Play Phase", () => {
    let state = emptyBattle({ lanes: 3 });
    giveHand(state, "player", [
      ["human.militiaRecruit", 0],
      ["orc.badlandPup", 0],
      ["human.shieldbearer", 0],
    ]);
    for (const lane of [0, 1, 2]) {
      ({ state } = run(state, play(0, square(lane, 0))));
    }
    expect(state.units).toHaveLength(3);
  });

  it("lets a Unit act in the Turn of its summon, also from Column 3", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["orc.badlandPup", 0]]);
    const summoned = run(state, play(0, square(0, 2))).state;
    const { state: next } = run(summoned, Command.EndTurn());
    expect(next.units[0]?.position).toBe(4);
  });
});

describe("unitsInArea", () => {
  it("finds the Units of one side in a Lane or a Square area, and none for no target", () => {
    const state = emptyBattle({ lanes: 2 });
    const a = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 4,
    });
    const b = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 5,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "player",
      lane: 1,
      position: 3,
    });
    expect(
      ids(unitsInArea(state, "enemy", Target.Lane({ lane: 1 }), 1))
    ).toEqual([a.id, b.id]);
    expect(
      ids(
        unitsInArea(state, "enemy", Target.Square({ lane: 1, position: 4 }), 2)
      )
    ).toEqual([a.id, b.id]);
    expect(
      ids(
        unitsInArea(state, "enemy", Target.Square({ lane: 1, position: 5 }), 2)
      )
    ).toEqual([b.id]);
    expect(unitsInArea(state, "enemy", Target.NoTarget(), 2)).toEqual([]);
  });
});

describe("Skill Cards (GDD 4.8)", () => {
  it("deals damage to one enemy Unit, and Frost freezes it", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.frostBolt", 0]]);
    const target = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 6,
    });
    const { state: next } = run(
      state,
      play(0, Target.Square({ lane: 0, position: 6 }))
    );
    expect(unitById(next, target.id)).toMatchObject({ hp: 4, frozen: true });
  });

  it("deals area damage from the target Square toward the enemy Hero", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.fireball", 0]]);
    const first = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 6,
    });
    const second = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 7,
    });
    const outside = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
    });
    const { state: next } = run(
      state,
      play(0, Target.Square({ lane: 0, position: 6 }))
    );
    expect(unitById(next, first.id)?.hp).toBe(3);
    expect(unitById(next, second.id)?.hp).toBe(3);
    expect(unitById(next, outside.id)?.hp).toBe(6);
  });

  it("deals damage to all enemy Units in a Lane", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["mage.flameWave", 0, "uncommon"]]);
    const a = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 3,
    });
    const b = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 1,
      position: 9,
    });
    const other = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      lane: 0,
      position: 9,
    });
    expect(legalTargets(state, 0)).toEqual([
      Target.Lane({ lane: 0 }),
      Target.Lane({ lane: 1 }),
    ]);
    const { state: next } = run(state, play(0, Target.Lane({ lane: 1 })));
    // Uncommon: 2 × 1.2 = 2.4, rounded to 2.
    expect([
      unitById(next, a.id)?.hp,
      unitById(next, b.id)?.hp,
      unitById(next, other.id)?.hp,
    ]).toEqual([4, 4, 6]);
  });

  it("gives friendly Units in a Lane Armor for a number of enemy Turns", () => {
    let state = emptyBattle();
    giveHand(state, "player", [["warrior.shieldWall", 0]]);
    const unit = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 0,
      attack: 0,
    });
    ({ state } = run(state, play(0, Target.Lane({ lane: 0 }))));
    expect(unitById(state, unit.id)).toMatchObject({
      bonusArmor: 1,
      bonusArmorTurns: 2,
    });
    // The own End Step does not count.
    ({ state } = run(state, Command.EndTurn()));
    expect(unitById(state, unit.id)?.bonusArmorTurns).toBe(2);
    // The first enemy Turn.
    ({ state } = run(state, Command.EndTurn()));
    expect(unitById(state, unit.id)?.bonusArmorTurns).toBe(1);
    ({ state } = run(state, Command.EndTurn()));
    expect(unitById(state, unit.id)).toMatchObject({
      bonusArmor: 1,
      bonusArmorTurns: 1,
    });
    // The second enemy Turn.
    const { state: last, events } = run(state, Command.EndTurn());
    expect(unitById(last, unit.id)).toMatchObject({
      bonusArmor: 0,
      bonusArmorTurns: 0,
    });
    expect(eventsOfType(events, "ArmorFaded")).toHaveLength(1);
  });

  it("resets the Lane Armor when the side plays it again", () => {
    let state = emptyBattle();
    giveHand(state, "player", [
      ["warrior.shieldWall", 0],
      ["warrior.shieldWall", 0],
    ]);
    const unit = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 0,
      attack: 0,
    });
    ({ state } = run(state, play(0, Target.Lane({ lane: 0 }))));
    ({ state } = run(state, play(0, Target.Lane({ lane: 0 }))));
    expect(unitById(state, unit.id)).toMatchObject({
      bonusArmor: 1,
      bonusArmorTurns: 2,
    });
  });

  it("lowers the Countdown of own cards that are not Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [
      ["warrior.warDrums", 0],
      ["human.militiaRecruit", 0],
      ["human.halberdier", 3],
      ["human.ironBulwark", 5],
    ]);
    const { state: next, events } = run(state, play(0, Target.NoTarget()));
    const countdowns = next.sides.player.hand
      .filter((card) => card.cardId !== "warrior.warDrums")
      .map((card) => card.countdown);
    expect(countdowns).toEqual([0, 2, 4]);
    expect(eventsOfType(events, "CountdownChanged")).toHaveLength(2);
  });

  it("refuses a Unit or a Lane target in a Closed Lane", () => {
    const state = emptyBattle({ lanes: 2, closedLanes: [{ lane: 1 }] });
    giveHand(state, "player", [
      ["mage.frostBolt", 0],
      ["mage.flameWave", 0, "uncommon"],
    ]);
    for (const lane of [0, 1]) {
      placeUnit(state, {
        cardId: "human.halberdier",
        owner: "enemy",
        lane,
        position: 6,
      });
    }
    expect(legalTargets(state, 0)).toEqual([
      Target.Square({ lane: 0, position: 6 }),
    ]);
    expect(legalTargets(state, 1)).toEqual([Target.Lane({ lane: 0 })]);
    expect(violation(step(state, play(1, Target.Lane({ lane: 1 }))))).toBe(
      "IllegalTarget"
    );
  });

  it("refuses a Unit target when there is no enemy Unit", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["mage.frostBolt", 0]]);
    expect(legalTargets(state, 0)).toEqual([]);
    expect(
      violation(step(state, play(0, Target.Square({ lane: 0, position: 5 }))))
    ).toBe("IllegalTarget");
  });

  it("returns the card to the Hand with its full Countdown on a Recall success, else sends it to the Graveyard", () => {
    const outcomes = new Set<boolean>();
    for (let random = 0; random < 60; random += 1) {
      const state = emptyBattle({ random });
      giveHand(state, "player", [["warrior.warDrums", 0, "legendary"]]);
      const { state: next, events } = run(state, play(0, Target.NoTarget()));
      const [recall] = eventsOfType(events, "RecallRolled");
      outcomes.add(recall?.success ?? false);
      if (recall?.success) {
        expect(next.sides.player.hand).toEqual([
          expect.objectContaining({ cardId: "warrior.warDrums", countdown: 2 }),
        ]);
        expect(next.sides.player.graveyard).toEqual([]);
      } else {
        expect(next.sides.player.hand).toEqual([]);
        expect(next.sides.player.graveyard).toHaveLength(1);
      }
    }
    expect(outcomes).toEqual(new Set([true, false]));
  });
});
