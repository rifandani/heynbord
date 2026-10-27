import { describe, expect, it } from "vitest";

import type {
  PadButton,
  PadDirection,
  PadSnapshot,
  PadState,
} from "@/core/input/gamepad";
import {
  INITIAL_PAD_STATE,
  REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
  stepPad,
} from "@/core/input/gamepad";

const BUTTON_INDEX: Readonly<Record<PadButton, number>> = {
  south: 0,
  east: 1,
  west: 2,
  north: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  select: 8,
  start: 9,
};

const DPAD_INDEX: Readonly<Record<PadDirection, number>> = {
  up: 12,
  down: 13,
  left: 14,
  right: 15,
};

interface SnapshotOptions {
  readonly buttons?: readonly PadButton[];
  readonly directions?: readonly PadDirection[];
  readonly axes?: readonly number[];
  readonly mapping?: string;
  readonly index?: number;
  readonly id?: string;
  readonly values?: Partial<Record<PadButton, number>>;
}

const snapshot = ({
  buttons = [],
  directions = [],
  axes = [0, 0, 0, 0],
  mapping = "standard",
  index = 0,
  id = "Xbox Wireless Controller",
  values = {},
}: SnapshotOptions = {}): PadSnapshot => {
  const states = Array.from({ length: 17 }, () => ({
    pressed: false,
    value: 0,
  }));
  for (const button of buttons) {
    states[BUTTON_INDEX[button]] = {
      pressed: true,
      value: values[button] ?? 1,
    };
  }
  for (const direction of directions) {
    states[DPAD_INDEX[direction]] = { pressed: true, value: 1 };
  }
  return { id, index, mapping, buttons: states, axes };
};

const step = (state: PadState, options: SnapshotOptions, now: number) =>
  stepPad(state, snapshot(options), now);

const rawSnapshot = (
  buttons: readonly { readonly pressed: boolean; readonly value: number }[],
  axes: readonly number[] = []
): PadSnapshot => ({
  id: "Test Pad",
  index: 0,
  mapping: "standard",
  buttons,
  axes,
});

describe("stepPad", () => {
  it("gives no press without a pad", () => {
    const result = stepPad(INITIAL_PAD_STATE, null, 0);

    expect(result.presses).toEqual([]);
    expect(result.state).toEqual(INITIAL_PAD_STATE);
  });

  it("gives one press for a button and no repeat", () => {
    const first = step(INITIAL_PAD_STATE, { buttons: ["south"] }, 0);
    expect(first.presses).toEqual([{ control: "south", repeat: false }]);

    const held = step(first.state, { buttons: ["south"] }, 5000);
    expect(held.presses).toEqual([]);
    expect(held.state.held).toEqual(["south"]);
  });

  it("repeats a held direction after the delay", () => {
    const first = step(INITIAL_PAD_STATE, { directions: ["right"] }, 0);
    expect(first.presses).toEqual([{ control: "right", repeat: false }]);

    const beforeDelay = step(
      first.state,
      { directions: ["right"] },
      REPEAT_DELAY_MS - 1
    );
    expect(beforeDelay.presses).toEqual([]);

    const firstRepeat = step(
      beforeDelay.state,
      { directions: ["right"] },
      REPEAT_DELAY_MS
    );
    expect(firstRepeat.presses).toEqual([{ control: "right", repeat: true }]);

    const between = step(
      firstRepeat.state,
      { directions: ["right"] },
      REPEAT_DELAY_MS + REPEAT_INTERVAL_MS - 1
    );
    expect(between.presses).toEqual([]);

    const secondRepeat = step(
      between.state,
      { directions: ["right"] },
      REPEAT_DELAY_MS + REPEAT_INTERVAL_MS
    );
    expect(secondRepeat.presses).toEqual([{ control: "right", repeat: true }]);
  });

  it("starts the delay again after a release", () => {
    const first = step(INITIAL_PAD_STATE, { directions: ["right"] }, 0);
    const released = step(first.state, {}, 100);
    expect(released.state.held).toEqual([]);

    const again = step(released.state, { directions: ["right"] }, 200);
    expect(again.presses).toEqual([{ control: "right", repeat: false }]);
  });

  it("keeps a direction through the release threshold of the stick", () => {
    const engaged = step(INITIAL_PAD_STATE, { axes: [0.45, 0, 0, 0] }, 0);
    expect(engaged.presses).toEqual([{ control: "right", repeat: false }]);

    const soft = step(engaged.state, { axes: [0.31, 0, 0, 0] }, 10);
    expect(soft.presses).toEqual([]);
    expect(soft.state.held).toEqual(["right"]);

    const released = step(soft.state, { axes: [0.29, 0, 0, 0] }, 20);
    expect(released.presses).toEqual([]);
    expect(released.state.held).toEqual([]);
  });

  it("ignores a stick below the engage threshold", () => {
    const result = step(INITIAL_PAD_STATE, { axes: [0.44, 0, 0, 0] }, 0);

    expect(result.presses).toEqual([]);
  });

  it("moves on the dominant axis of the stick", () => {
    const right = step(INITIAL_PAD_STATE, { axes: [0.9, 0.5, 0, 0] }, 0);
    expect(right.presses).toEqual([{ control: "right", repeat: false }]);

    const up = step(INITIAL_PAD_STATE, { axes: [0.3, -0.8, 0, 0] }, 0);
    expect(up.presses).toEqual([{ control: "up", repeat: false }]);
  });

  it("lets the D-pad win over the stick", () => {
    const result = step(
      INITIAL_PAD_STATE,
      { directions: ["left"], axes: [0.9, 0, 0, 0] },
      0
    );

    expect(result.presses).toEqual([{ control: "left", repeat: false }]);
  });

  it("gives no direction for two opposite D-pad buttons", () => {
    const result = step(
      INITIAL_PAD_STATE,
      { directions: ["left", "right"], axes: [0.9, 0, 0, 0] },
      0
    );

    expect(result.presses).toEqual([]);
  });

  it("gives no vertical direction for two opposite D-pad buttons", () => {
    const result = step(INITIAL_PAD_STATE, { directions: ["up", "down"] }, 0);

    expect(result.presses).toEqual([]);
  });

  it("moves down on the D-pad and on the stick", () => {
    const dpad = step(INITIAL_PAD_STATE, { directions: ["down"] }, 0);
    expect(dpad.presses).toEqual([{ control: "down", repeat: false }]);

    const stick = step(INITIAL_PAD_STATE, { axes: [0, 0.9, 0, 0] }, 0);
    expect(stick.presses).toEqual([{ control: "down", repeat: false }]);
  });

  it("moves left on the stick", () => {
    const result = step(INITIAL_PAD_STATE, { axes: [-0.9, 0, 0, 0] }, 0);

    expect(result.presses).toEqual([{ control: "left", repeat: false }]);
  });

  it("reads a trigger at half of its travel", () => {
    const soft = step(
      INITIAL_PAD_STATE,
      { buttons: ["l2"], values: { l2: 0.4 } },
      0
    );
    expect(soft.presses).toEqual([]);

    const hard = step(
      INITIAL_PAD_STATE,
      { buttons: ["l2"], values: { l2: 0.5 } },
      0
    );
    expect(hard.presses).toEqual([{ control: "l2", repeat: false }]);
  });

  it("reads the right trigger", () => {
    const result = step(INITIAL_PAD_STATE, { buttons: ["r2"] }, 0);

    expect(result.presses).toEqual([{ control: "r2", repeat: false }]);
  });

  it("reads a button without the pressed flag", () => {
    const result = stepPad(
      INITIAL_PAD_STATE,
      rawSnapshot([{ pressed: false, value: 0.6 }]),
      0
    );

    expect(result.presses).toEqual([{ control: "south", repeat: false }]);
  });

  it("reads a pad with no buttons or axes", () => {
    const result = stepPad(INITIAL_PAD_STATE, rawSnapshot([]), 0);

    expect(result.presses).toEqual([]);
  });

  it("keeps the delay for a held direction without a repeat time", () => {
    const state: PadState = { index: 0, held: ["right"], repeatAt: {} };
    const stepped = stepPad(state, snapshot({ directions: ["right"] }), 100);

    expect(stepped.presses).toEqual([]);
    expect(stepped.state.repeatAt.right).toBe(100 + REPEAT_DELAY_MS);
  });

  it("resets on a pad that is not in standard mapping", () => {
    const held = step(INITIAL_PAD_STATE, { buttons: ["south"] }, 0);
    const bad = step(
      held.state,
      { buttons: ["south"], mapping: "xr-standard" },
      10
    );

    expect(bad.presses).toEqual([]);
    expect(bad.state).toEqual(INITIAL_PAD_STATE);
  });

  it("resets the held controls on a pad change", () => {
    const first = step(INITIAL_PAD_STATE, { buttons: ["south"] }, 0);
    const second = step(first.state, { buttons: ["south"], index: 1 }, 10);

    expect(second.presses).toEqual([{ control: "south", repeat: false }]);
    expect(second.state.index).toBe(1);
  });

  it("resets when the pad goes away", () => {
    const held = step(INITIAL_PAD_STATE, { buttons: ["south"] }, 0);
    const gone = stepPad(held.state, null, 10);

    expect(gone.state).toEqual(INITIAL_PAD_STATE);
  });

  it("ignores a bad axis value", () => {
    const result = step(
      INITIAL_PAD_STATE,
      { axes: [Number.NaN, Number.POSITIVE_INFINITY, 0, 0] },
      0
    );

    expect(result.presses).toEqual([]);
  });
});
