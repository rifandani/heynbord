import { describe, expect, it } from "vitest";

import { emptyBattle, placeUnit } from "../testing/fixtures";
import type { StepContext } from "./context";
import { hasDebuff, removeOneDebuff } from "./debuffs";

const contextOf = (state: StepContext["state"]): StepContext => ({
  state,
  events: [],
  random: { state: 1 },
});

describe("removeOneDebuff (Dispel, ADR-0054)", () => {
  it("ends 1 Debuff of the Unit and gives 1 event", () => {
    const ctx = contextOf(emptyBattle());
    const unit = placeUnit(ctx.state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 0,
      burn: 2,
      bleeding: 3,
    });
    expect(removeOneDebuff(ctx, unit)).toBe(true);
    expect(
      [unit.burn, unit.bleeding].filter((stacks) => stacks > 0)
    ).toHaveLength(1);
    expect(hasDebuff(unit)).toBe(true);
    expect(ctx.events).toEqual([
      expect.objectContaining({ _tag: "DebuffRemoved", unitId: unit.id }),
    ]);
  });

  it("gives no event for a Unit with no Debuff", () => {
    const ctx = contextOf(emptyBattle());
    const unit = placeUnit(ctx.state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 0,
    });
    expect(removeOneDebuff(ctx, unit)).toBe(false);
    expect(ctx.events).toEqual([]);
  });
});
