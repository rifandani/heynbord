import { BattleEvent, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import { RALLY_PULSE } from "@/features/battle/scene/unit-pose";
import {
  shownAttack,
  statTone,
  summonAttack,
} from "@/features/battle/scene/unit-stats";

describe("statTone", () => {
  it("is white when the number equals the summon value", () => {
    expect(statTone(2, 2)).toBe("same");
  });

  it("is red when the number is lower", () => {
    expect(statTone(1, 2)).toBe("down");
  });

  it("is green when the number is higher", () => {
    expect(statTone(4, 2)).toBe("up");
  });
});

describe("summonAttack", () => {
  it("is the Attack with no Rally bonus and no Swarm bonus", () => {
    expect(summonAttack({ attack: 4, rallyBonus: 0, swarmBonus: 1 })).toBe(3);
    expect(summonAttack({ attack: 3, rallyBonus: 0, swarmBonus: 0 })).toBe(3);
    expect(summonAttack({ attack: 5, rallyBonus: 2, swarmBonus: 0 })).toBe(3);
    expect(summonAttack({ attack: 6, rallyBonus: 2, swarmBonus: 1 })).toBe(3);
  });
});

describe("shownAttack", () => {
  // Stage 1-10 starts with a Unit on the Board.
  const { view } = startSession({
    stageId: "1-10",
    deck: getStarterDeck("vanguard"),
    seed: 1,
  });
  const [first] = view.units;
  if (!first) {
    throw new Error("Stage 1-10 starts with a Unit on the Board");
  }
  const current = {
    event: BattleEvent.UnitsRallied({
      unitId: 1,
      targets: [{ unitId: 7, rallied: 3 }],
    }),
    duration: 1,
    before: {
      ...view,
      units: [{ ...first, id: 7, attack: 4, rallyBonus: 1 }],
    },
  };
  const target = { id: 7, attack: 6 };

  it("counts the Attack of a target up from its value before UnitsRallied, after the pulse", () => {
    expect(shownAttack(target, current, 0)).toBe(4);
    expect(shownAttack(target, current, RALLY_PULSE)).toBe(4);
    expect(shownAttack(target, current, RALLY_PULSE + 0.01)).toBe(5);
    expect(shownAttack(target, current, 0.9)).toBe(6);
    expect(shownAttack(target, current, 1)).toBe(6);
  });

  it("uses the event, also when the view of the Unit is one event behind", () => {
    expect(shownAttack({ id: 7, attack: 4 }, current, 1)).toBe(6);
  });

  it("shows the Attack of the view with reduced motion, for another Unit, and in another event", () => {
    expect(shownAttack(target, current, 0, true)).toBe(6);
    expect(shownAttack({ id: 8, attack: 2 }, current, 0)).toBe(2);
    expect(
      shownAttack(
        target,
        { ...current, event: BattleEvent.UnitSkipped({ unitId: 7 }) },
        0
      )
    ).toBe(6);
    expect(shownAttack(target, null, 0)).toBe(6);
  });
});
