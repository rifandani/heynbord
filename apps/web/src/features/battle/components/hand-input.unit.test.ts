import { Target } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { HandCardView } from "@/features/battle/battle-view";
import {
  activeDragIndex,
  draggedCard,
  dragMove,
  handHint,
  pressAction,
  startDrag,
} from "@/features/battle/components/hand-input";

const card = (
  cardId: string | null,
  countdown = 0,
  rank: HandCardView["rank"] = "uncommon"
): HandCardView => ({ instanceId: 1, cardId, rank, countdown });

const press = (overrides: Partial<Parameters<typeof pressAction>[0]>) =>
  pressAction({
    card: card("orc.badlandPup"),
    index: 0,
    selected: null,
    canAct: true,
    keyboard: false,
    focusedTarget: undefined,
    ...overrides,
  });

describe("dragMove", () => {
  it("stays a press until the pointer moves more than 10 pixels", () => {
    const drag = startDrag(2, 100, 100);
    expect(drag).toEqual({
      index: 2,
      startX: 100,
      startY: 100,
      x: 100,
      y: 100,
      active: false,
    });
    const small = dragMove(drag, 106, 108);
    expect(small).toEqual({
      drag: { ...drag, x: 106, y: 108, active: false },
      started: false,
    });
    const far = dragMove(small.drag, 120, 100);
    expect(far.started).toBe(true);
    expect(far.drag.active).toBe(true);
  });

  it("stays active, and starts only once", () => {
    const active = dragMove(startDrag(0, 0, 0), 50, 0).drag;
    const back = dragMove(active, 1, 1);
    expect(back).toEqual({
      drag: { ...active, x: 1, y: 1, active: true },
      started: false,
    });
  });
});

describe("activeDragIndex and draggedCard", () => {
  const hand = [card("orc.badlandPup"), card(null), card("x", 0, null)];

  it("ignores a drag that is not active", () => {
    const drag = startDrag(0, 10, 20);
    expect(activeDragIndex(null)).toBeNull();
    expect(activeDragIndex(drag)).toBeNull();
    expect(draggedCard(null, hand)).toBeNull();
    expect(draggedCard(drag, hand)).toBeNull();
  });

  it("follows the pointer with the dragged card", () => {
    const { drag } = dragMove(startDrag(0, 0, 0), 40, 30);
    expect(activeDragIndex(drag)).toBe(0);
    expect(draggedCard(drag, hand)).toEqual({
      cardId: "orc.badlandPup",
      rank: "uncommon",
      x: 40,
      y: 30,
    });
  });

  it("shows nothing for a hidden card, and a Common Rank when the Rank is unknown", () => {
    const hidden = dragMove(startDrag(1, 0, 0), 40, 0).drag;
    expect(draggedCard(hidden, hand)).toBeNull();
    const missing = dragMove(startDrag(5, 0, 0), 40, 0).drag;
    expect(draggedCard(missing, hand)).toBeNull();
    const noRank = dragMove(startDrag(2, 0, 0), 40, 0).drag;
    expect(draggedCard(noRank, hand)?.rank).toBe("common");
  });
});

describe("pressAction", () => {
  it("shows the details of a card that cannot play now", () => {
    expect(press({ card: undefined })).toEqual({ _tag: "inspect" });
    expect(press({ card: card("orc.badlandPup", 2) })).toEqual({
      _tag: "inspect",
    });
    expect(press({ canAct: false })).toEqual({ _tag: "inspect" });
  });

  it("selects a Ready card that needs a target", () => {
    expect(press({ index: 3 })).toEqual({ _tag: "select", index: 3 });
    expect(press({ card: card(null) })).toEqual({ _tag: "select", index: 0 });
    expect(press({ card: card("warrior.shieldWall") })).toEqual({
      _tag: "select",
      index: 0,
    });
  });

  it("plays a card with no target at once", () => {
    expect(press({ card: card("warrior.warDrums") })).toEqual({
      _tag: "play",
      target: Target.NoTarget(),
    });
  });

  it("plays the focused target on Enter, and cancels on a second click", () => {
    const target = Target.Lane({ lane: 0 });
    expect(
      press({ selected: 0, keyboard: true, focusedTarget: target })
    ).toEqual({ _tag: "play", target });
    expect(press({ selected: 0, keyboard: true })).toEqual({
      _tag: "select",
      index: null,
    });
    expect(press({ selected: 0, focusedTarget: target })).toEqual({
      _tag: "select",
      index: null,
    });
  });
});

describe("handHint", () => {
  it("asks for a target only while a card is selected", () => {
    expect(handHint(undefined, 3)).toBeNull();
    expect(handHint(card("x"), 2)).toBe("battle.selectTarget");
    expect(handHint(card("x"), 0)).toBe("battle.noTarget");
  });
});
