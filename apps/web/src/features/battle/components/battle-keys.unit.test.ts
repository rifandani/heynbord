import { describe, expect, it } from "vitest";

import {
  inspectDirection,
  KEY_GUIDE,
  keyCommand,
  logKeyAction,
  nextReadyCard,
} from "@/features/battle/components/battle-keys";

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
    expect(press("ArrowLeft")).toEqual({ action: "moveSelection", step: -1 });
    expect(press("ArrowRight")).toEqual({ action: "moveSelection", step: 1 });
    expect(press("ArrowUp")).toEqual({ action: "focusTarget", step: -1 });
    expect(press("ArrowDown")).toEqual({ action: "focusTarget", step: 1 });
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

describe("KEY_GUIDE", () => {
  it("shows each Battle key action one time", () => {
    const keys = ["ArrowLeft", "ArrowUp", "Enter", "e", "s", "i", "h", "l"];
    const actions = keys.map((key) => press(key)?.action);
    expect(KEY_GUIDE.map((row) => row.action)).toEqual([
      ...actions,
      "logEntry",
      "logTurn",
      "cancel",
    ]);
  });
});

const logCommand = (key: string) => {
  const found = press(key);
  if (!found) {
    throw new Error(`No command for ${key}`);
  }
  return found;
};

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

  it("keeps Inspect and the Handbook, and turns off all Live input", () => {
    expect(logKeyAction(logCommand("i"), false)._tag).toBe("live");
    expect(logKeyAction(logCommand("h"), false)._tag).toBe("live");
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
