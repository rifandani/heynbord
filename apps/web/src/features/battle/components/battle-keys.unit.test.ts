import { describe, expect, it } from "vitest";

import { padFamily, padLabels } from "@/core/input/pad-family";
import {
  controlsGuideButtons,
  controlsGuidePadLabels,
  inspectDirection,
  CONTROLS_GUIDE,
  keyCommand,
  logKeyAction,
  nextReadyCard,
} from "@/features/battle/components/battle-keys";
import { padBattleCommand } from "@/features/battle/components/pad-battle";

const press = (
  key: string,
  modifiers: Partial<Record<"metaKey" | "ctrlKey" | "altKey", boolean>> = {}
) =>
  keyCommand({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    ...modifiers,
  });

describe("keyCommand", () => {
  it("maps the Battle keys", () => {
    expect(press("ArrowLeft")).toEqual({
      action: "moveSelection",
      step: -1,
      source: "keyboard",
    });
    expect(press("ArrowRight")).toEqual({
      action: "moveSelection",
      step: 1,
      source: "keyboard",
    });
    expect(press("ArrowUp")).toEqual({
      action: "focusTarget",
      step: -1,
      source: "keyboard",
    });
    expect(press("ArrowDown")).toEqual({
      action: "focusTarget",
      step: 1,
      source: "keyboard",
    });
    expect(press("Enter")?.action).toBe("play");
    expect(press("e")?.action).toBe("endTurn");
    expect(press("E")?.action).toBe("endTurn");
    expect(press("s")?.action).toBe("skip");
    expect(press("S")?.action).toBe("skip");
    expect(press("Escape")?.action).toBe("cancel");
  });

  it("ignores other keys and keys with a modifier", () => {
    expect(press("x")).toBeNull();
    expect(press("constructor")).toBeNull();
    expect(press("e", { metaKey: true })).toBeNull();
    expect(press("e", { ctrlKey: true })).toBeNull();
    expect(press("e", { altKey: true })).toBeNull();
  });
});

describe("CONTROLS_GUIDE", () => {
  it("shows each Battle key action one time", () => {
    const keys = ["ArrowLeft", "ArrowUp", "Enter", "e", "s", "i", "h", "l"];
    const actions = keys.map((key) => press(key)?.action);
    expect(
      CONTROLS_GUIDE.filter((row) => row.keys.length > 0).map(
        (row) => row.action
      )
    ).toEqual([...actions, "logEntry", "logTurn", "cancel"]);
  });

  it("names the controls that perform each action in Live or in the Battle Log", () => {
    for (const row of CONTROLS_GUIDE) {
      expect(row.padControls.length).toBeGreaterThan(0);
      for (const control of row.padControls) {
        const command = padBattleCommand({ control, repeat: false });
        if (!command) {
          throw new Error(`No Battle command for ${control}`);
        }
        if (row.action === "logEntry" || row.action === "logTurn") {
          expect(logKeyAction(command, false)).toEqual({
            _tag: "step",
            step: command.step,
            byTurn: row.action === "logTurn",
          });
        } else {
          expect(command.action).toBe(row.action);
        }
      }
    }
  });

  it("shows Start as the input for the Controls Guide without adding a keyboard key", () => {
    expect(
      CONTROLS_GUIDE.find((row) => row.action === "controlsGuide")
    ).toEqual({
      action: "controlsGuide",
      keys: [],
      padControls: ["start"],
    });
  });

  it("keeps Select in the legend without claiming a Battle action", () => {
    expect(padBattleCommand({ control: "select", repeat: false })).toBeNull();
    expect(CONTROLS_GUIDE.flatMap((row) => row.padControls)).not.toContain(
      "select"
    );
    expect(controlsGuideButtons(padLabels("generic"))).toContain("Select");
  });
});

describe("controlsGuidePadLabels", () => {
  it("shows both direction sources once per row", () => {
    const labels = padLabels("xbox");
    expect(controlsGuidePadLabels(["left", "right"], labels)).toEqual([
      "D-pad",
      "Left stick",
    ]);
    expect(controlsGuidePadLabels(["up", "down"], labels)).toEqual([
      "D-pad",
      "Left stick",
    ]);
  });

  it("reads button labels by position from the connected family", () => {
    expect(
      controlsGuidePadLabels(
        ["south", "east", "start"],
        padLabels("playstation")
      )
    ).toEqual(["×", "○", "Options"]);
    expect(controlsGuidePadLabels(["l1", "r1"], padLabels("xbox"))).toEqual([
      "LB",
      "RB",
    ]);
  });
});

describe("controlsGuideButtons", () => {
  it.each([
    {
      family: "xbox",
      buttons: ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "Menu", "View"],
    },
    {
      family: "playstation",
      buttons: [
        "×",
        "○",
        "□",
        "△",
        "L1",
        "R1",
        "L2",
        "R2",
        "Options",
        "Create",
      ],
    },
    {
      family: "generic",
      buttons: ["A", "B", "X", "Y", "L1", "R1", "L2", "R2", "Start", "Select"],
    },
  ] as const)("lists all ten $family labels", ({ family, buttons }) => {
    expect(controlsGuideButtons(padLabels(family))).toEqual(buttons);
  });

  it("uses generic labels for a Nintendo id, with no Nintendo layout", () => {
    expect(
      controlsGuideButtons(
        padLabels(padFamily("Nintendo Switch Pro Controller"))
      )
    ).toEqual(["A", "B", "X", "Y", "L1", "R1", "L2", "R2", "Start", "Select"]);
  });
});

const logCommand = (key: string) => {
  const found = press(key);
  if (!found) {
    throw new Error(`No command for ${key}`);
  }
  return found;
};

const padCommand = (action: "battleLog" | "controlsGuide", step: 1 | -1 = 1) =>
  ({ action, step, source: "pad" }) as const;

describe("logKeyAction", () => {
  it("goes one Log Entry with ←/→ and one Turn with Shift+←/→", () => {
    expect(logKeyAction(logCommand("ArrowLeft"), false)).toEqual({
      _tag: "step",
      step: -1,
      byTurn: false,
    });
    expect(logKeyAction(logCommand("ArrowRight"), true)).toEqual({
      _tag: "step",
      step: 1,
      byTurn: true,
    });
  });

  it("goes Back to Live with L and Esc", () => {
    expect(logKeyAction(logCommand("l"), false)._tag).toBe("close");
    expect(logKeyAction(logCommand("L"), false)._tag).toBe("close");
    expect(logKeyAction(logCommand("Escape"), false)._tag).toBe("close");
  });

  it("goes one Turn with L1 and R1 on a pad", () => {
    expect(logKeyAction(padCommand("battleLog", -1), false)).toEqual({
      _tag: "step",
      step: -1,
      byTurn: true,
    });
    expect(logKeyAction(padCommand("battleLog", 1), false)).toEqual({
      _tag: "step",
      step: 1,
      byTurn: true,
    });
    expect(logKeyAction(padCommand("battleLog", 1), false, true)._tag).toBe(
      "off"
    );
  });

  it("leaves a Replay only with Esc: L does nothing, because a Replay has no Live", () => {
    expect(logKeyAction(logCommand("l"), false, true)._tag).toBe("off");
    expect(logKeyAction(logCommand("Escape"), false, true)._tag).toBe("close");
    expect(logKeyAction(logCommand("ArrowRight"), true, true)._tag).toBe(
      "step"
    );
  });

  it("keeps Inspect and the Handbook, and turns off all Live input", () => {
    expect(logKeyAction(logCommand("i"), false)._tag).toBe("live");
    expect(logKeyAction(logCommand("h"), false)._tag).toBe("live");
    expect(logKeyAction(padCommand("controlsGuide"), false)._tag).toBe("live");
    for (const key of ["Enter", "e", "s", "ArrowUp", "ArrowDown"]) {
      expect(logKeyAction(logCommand(key), false)._tag).toBe("off");
    }
  });
});

describe("nextReadyCard", () => {
  const hand = [{ countdown: 0 }, { countdown: 2 }, { countdown: 0 }];

  it("moves over the Ready cards and wraps at the ends", () => {
    expect(nextReadyCard(hand, null, 1)).toBe(0);
    expect(nextReadyCard(hand, null, -1)).toBe(0);
    expect(nextReadyCard(hand, 0, 1)).toBe(2);
    expect(nextReadyCard(hand, 2, 1)).toBe(0);
    expect(nextReadyCard(hand, 0, -1)).toBe(2);
  });

  it("starts from the ends when the selected card is not Ready", () => {
    expect(nextReadyCard(hand, 1, 1)).toBe(0);
  });

  it("skips a Ready card that Unique blocks", () => {
    const blocked = [
      { countdown: 0 },
      { countdown: 0, blocked: true },
      { countdown: 0 },
    ];
    expect(nextReadyCard(blocked, 0, 1)).toBe(2);
    expect(
      nextReadyCard([{ countdown: 0, blocked: true }], null, 1)
    ).toBeNull();
  });

  it("finds nothing when no card is Ready", () => {
    expect(nextReadyCard([{ countdown: 1 }], null, 1)).toBeNull();
    expect(nextReadyCard([], 0, -1)).toBeNull();
  });
});

describe("inspectDirection", () => {
  it("maps the I key and the arrow keys of the Inspect mode", () => {
    expect(press("i")?.action).toBe("inspect");
    expect(press("I")?.action).toBe("inspect");
    const direction = (key: string) => {
      const command = press(key);
      return command ? inspectDirection(command) : undefined;
    };
    expect(direction("ArrowLeft")).toBe("left");
    expect(direction("ArrowRight")).toBe("right");
    expect(direction("ArrowUp")).toBe("up");
    expect(direction("ArrowDown")).toBe("down");
    expect(direction("Enter")).toBeNull();
    expect(direction("Escape")).toBeNull();
  });
});
