/**
 * The controller input core: one frame of a pad in standard mapping becomes the
 * presses of the Player. The module is pure, so the feel rules have a unit
 * test, and the browser read stays in `gamepad-source.ts` (web ADR-0015).
 */

/** A button of a pad in standard mapping, named by its position. */
export type PadButton =
  | "south"
  | "east"
  | "west"
  | "north"
  | "l1"
  | "r1"
  | "l2"
  | "r2"
  | "select"
  | "start";

/** A direction of the D-pad or of the left stick. */
export type PadDirection = "up" | "down" | "left" | "right";

/** A control that a press can name. */
export type PadControl = PadButton | PadDirection;

/** One button of a frame, as `navigator.getGamepads()` gives it. */
export interface PadButtonState {
  readonly pressed: boolean;
  readonly value: number;
}

/** One frame of a pad. Only a pad in standard mapping has a useful order. */
export interface PadSnapshot {
  readonly index: number;
  readonly id: string;
  readonly mapping: string;
  readonly buttons: readonly PadButtonState[];
  /** The left stick is `[x, y]` from `-1` to `1`, then the right stick. */
  readonly axes: readonly number[];
}

/** What the Player did in one frame. */
export interface PadPress {
  readonly control: PadControl;
  /** True for a direction that the Player still holds after the first press. */
  readonly repeat: boolean;
}

/** Where the Player is with the directions, and when the next repeat is due. */
export interface PadState {
  readonly index: number | null;
  readonly held: readonly PadControl[];
  readonly repeatAt: Readonly<Partial<Record<PadDirection, number>>>;
}

/** The state before the first frame, and after a reset. */
export const INITIAL_PAD_STATE: PadState = {
  index: null,
  held: [],
  repeatAt: {},
};

/** One frame of a pad becomes a new state and the presses of that frame. */
export interface PadStep {
  readonly state: PadState;
  readonly presses: readonly PadPress[];
}

/** The stick must pass this to start a direction. */
const STICK_ENGAGE = 0.45;

/** The stick must fall below this to stop a direction. The gap stops a rattle at the edge. */
const STICK_RELEASE = 0.3;

/** A trigger is pressed at half of its travel. */
const TRIGGER_PRESS = 0.5;

/** The time before a held direction repeats, after the first press. */
export const REPEAT_DELAY_MS = 380;

/** The time between the repeats of a held direction. */
export const REPEAT_INTERVAL_MS = 110;

/** The standard-mapping index of each digital button. */
const BUTTONS: readonly (readonly [PadButton, number])[] = [
  ["south", 0],
  ["east", 1],
  ["west", 2],
  ["north", 3],
  ["l1", 4],
  ["r1", 5],
  ["select", 8],
  ["start", 9],
];

const L2_INDEX = 6;
const R2_INDEX = 7;

/** The standard-mapping index of each D-pad button. */
const DPAD: Readonly<Record<PadDirection, number>> = {
  up: 12,
  down: 13,
  left: 14,
  right: 15,
};

const DIRECTIONS: readonly PadDirection[] = ["up", "down", "left", "right"];
const BUTTON_ORDER: readonly PadButton[] = [
  "south",
  "east",
  "west",
  "north",
  "l1",
  "r1",
  "l2",
  "r2",
  "select",
  "start",
];
const CONTROL_ORDER: readonly PadControl[] = [...DIRECTIONS, ...BUTTON_ORDER];

const buttonDown = (snapshot: PadSnapshot, index: number): boolean => {
  const button = snapshot.buttons[index];
  return (
    button !== undefined && (button.pressed || button.value >= TRIGGER_PRESS)
  );
};

const triggerDown = (snapshot: PadSnapshot, index: number): boolean =>
  (snapshot.buttons[index]?.value ?? 0) >= TRIGGER_PRESS;

const readButtons = (snapshot: PadSnapshot): ReadonlySet<PadButton> => {
  const held = new Set<PadButton>();
  for (const [position, index] of BUTTONS) {
    if (buttonDown(snapshot, index)) {
      held.add(position);
    }
  }
  if (triggerDown(snapshot, L2_INDEX)) {
    held.add("l2");
  }
  if (triggerDown(snapshot, R2_INDEX)) {
    held.add("r2");
  }
  return held;
};

/** The sign of a stick axis, with a different threshold to engage and to release. */
const stickAxis = (value: number, previous: -1 | 0 | 1): -1 | 0 | 1 => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const threshold = previous === 0 ? STICK_ENGAGE : STICK_RELEASE;
  if (Math.abs(value) < threshold) {
    return 0;
  }
  return value < 0 ? -1 : 1;
};

/** The direction that the Player held on an axis in the previous frame. */
const axisSign = (
  negative: PadDirection,
  positive: PadDirection,
  held: ReadonlySet<PadControl>
): -1 | 0 | 1 => {
  if (held.has(negative)) {
    return -1;
  }
  if (held.has(positive)) {
    return 1;
  }
  return 0;
};

/** The signed travel of the left stick on each axis. */
interface StickAxes {
  readonly x: -1 | 0 | 1;
  readonly y: -1 | 0 | 1;
}

/** A stick on two axes moves on one axis: the one with the larger travel. */
const dominantAxis = (
  x: -1 | 0 | 1,
  y: -1 | 0 | 1,
  rawX: number,
  rawY: number
): StickAxes => {
  if (x === 0 || y === 0) {
    return { x, y };
  }
  return Math.abs(rawX) >= Math.abs(rawY) ? { x, y: 0 } : { x: 0, y };
};

/**
 * The directions of one frame. The D-pad wins over the stick on its axis. A
 * pair of opposite D-pad buttons gives no direction on that axis.
 */
const readDirections = (
  snapshot: PadSnapshot,
  heldBefore: ReadonlySet<PadControl>
): ReadonlySet<PadDirection> => {
  const up = buttonDown(snapshot, DPAD.up);
  const down = buttonDown(snapshot, DPAD.down);
  const left = buttonDown(snapshot, DPAD.left);
  const right = buttonDown(snapshot, DPAD.right);

  const directions = new Set<PadDirection>();
  if (up !== down) {
    directions.add(up ? "up" : "down");
  }
  if (left !== right) {
    directions.add(left ? "left" : "right");
  }

  const rawX = snapshot.axes[0] ?? 0;
  const rawY = snapshot.axes[1] ?? 0;
  const stick = dominantAxis(
    stickAxis(rawX, axisSign("left", "right", heldBefore)),
    stickAxis(rawY, axisSign("up", "down", heldBefore)),
    rawX,
    rawY
  );

  if (!(left || right)) {
    if (stick.x === -1) {
      directions.add("left");
    }
    if (stick.x === 1) {
      directions.add("right");
    }
  }
  if (!(up || down)) {
    if (stick.y === -1) {
      directions.add("up");
    }
    if (stick.y === 1) {
      directions.add("down");
    }
  }
  return directions;
};

/**
 * The presses of one frame, from the previous state. A press is the first frame
 * of a control. A held direction repeats after `REPEAT_DELAY_MS`, then each
 * `REPEAT_INTERVAL_MS`. A face button does not repeat.
 */
export const stepPad = (
  state: PadState,
  snapshot: PadSnapshot | null,
  now: number
): PadStep => {
  if (!snapshot || snapshot.mapping !== "standard") {
    return { state: INITIAL_PAD_STATE, presses: [] };
  }

  const previous = state.index === snapshot.index ? state : INITIAL_PAD_STATE;
  const heldBefore = new Set<PadControl>(previous.held);
  const directions = readDirections(snapshot, heldBefore);
  const buttons = readButtons(snapshot);
  const next = new Set<PadControl>([...directions, ...buttons]);
  const held = CONTROL_ORDER.filter((control) => next.has(control));

  const presses: PadPress[] = [];
  for (const control of CONTROL_ORDER) {
    if (next.has(control) && !heldBefore.has(control)) {
      presses.push({ control, repeat: false });
    }
  }

  const repeatAt: Partial<Record<PadDirection, number>> = {};
  for (const direction of DIRECTIONS) {
    if (!directions.has(direction)) {
      continue;
    }
    const due = previous.repeatAt[direction];
    if (!heldBefore.has(direction) || due === undefined) {
      repeatAt[direction] = now + REPEAT_DELAY_MS;
      continue;
    }
    if (now < due) {
      repeatAt[direction] = due;
      continue;
    }
    presses.push({ control: direction, repeat: true });
    repeatAt[direction] = now + REPEAT_INTERVAL_MS;
  }

  return {
    state: { index: snapshot.index, held, repeatAt },
    presses,
  };
};
