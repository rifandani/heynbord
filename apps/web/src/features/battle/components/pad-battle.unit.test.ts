import { describe, expect, it } from "vitest";

import type { PadControl, PadPress } from "@/core/input/gamepad";
import { padBattleCommand } from "@/features/battle/components/pad-battle";

const press = (control: PadControl, repeat = false): PadPress => ({
  control,
  repeat,
});

describe("padBattleCommand", () => {
  it("maps the face buttons by position", () => {
    expect(padBattleCommand(press("south"))).toMatchObject({
      action: "play",
      source: "pad",
    });
    expect(padBattleCommand(press("east"))).toMatchObject({
      action: "cancel",
      source: "pad",
    });
    expect(padBattleCommand(press("west"))).toMatchObject({
      action: "inspect",
      source: "pad",
    });
    expect(padBattleCommand(press("north"))).toMatchObject({
      action: "handbook",
      source: "pad",
    });
  });

  it("maps the bumpers, the triggers and Start", () => {
    expect(padBattleCommand(press("l1"))).toMatchObject({
      action: "battleLog",
      step: -1,
    });
    expect(padBattleCommand(press("r1"))).toMatchObject({
      action: "battleLog",
      step: 1,
    });
    expect(padBattleCommand(press("l2"))?.action).toBe("skip");
    expect(padBattleCommand(press("r2"))?.action).toBe("endTurn");
    expect(padBattleCommand(press("start"))?.action).toBe("controlsGuide");
  });

  it("moves the selection with left and right, and the target with up and down", () => {
    expect(padBattleCommand(press("left"))).toMatchObject({
      action: "moveSelection",
      step: -1,
    });
    expect(padBattleCommand(press("right"))).toMatchObject({
      action: "moveSelection",
      step: 1,
    });
    expect(padBattleCommand(press("up"))).toMatchObject({
      action: "focusTarget",
      step: -1,
    });
    expect(padBattleCommand(press("down"))).toMatchObject({
      action: "focusTarget",
      step: 1,
    });
  });

  it("gives the same command for a repeat of a direction", () => {
    expect(padBattleCommand(press("right", true))).toEqual(
      padBattleCommand(press("right"))
    );
  });

  it("has no command for Select", () => {
    expect(padBattleCommand(press("select"))).toBeNull();
  });
});
