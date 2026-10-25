import { describe, expect, it } from "vitest";

import { canAct } from "@/features/battle/battle-session";
import { sourceId } from "@/features/battle/card-art";
import { buildQaState, QA_STATES } from "@/features/battle/test-hooks";

describe("buildQaState", () => {
  it("builds a real state for each QA state", () => {
    expect(QA_STATES).toContain("active-play");
    expect(buildQaState("town", 1)).toBeNull();
    expect(buildQaState("stage-select", 1)).toBeNull();
    const active = buildQaState("active-play", 42);
    expect(active && canAct(active)).toBe(true);
    expect(active?.view.units.length).toBeGreaterThan(0);
    const resolution = buildQaState("resolution", 42);
    expect(resolution?.queue.length).toBeGreaterThan(0);
    const cast = buildQaState("enemy-cast", 42)?.queue[0];
    expect(cast?._tag === "CardPlayed" && cast.side).toBe("enemy");
    expect(buildQaState("victory", 42)?.rules.result?.winner).toBe("player");
    expect(buildQaState("defeat", 42)?.rules.result?.winner).toBe("enemy");
  });
});

describe("buildQaState for a Unit Model", () => {
  it("has Warden Saelith of the player on the Board", () => {
    const session = buildQaState("unit-model", 42);
    expect(
      session?.view.units.some(
        (unit) =>
          unit.owner === "player" &&
          sourceId(unit.source) === "elf.wardenSaelith"
      )
    ).toBe(true);
  });
});
