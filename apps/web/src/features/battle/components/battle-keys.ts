import type { PadButton, PadControl } from "@/core/input/gamepad";
import type { PadLabels } from "@/core/input/pad-family";
import type { InspectDirection } from "@/features/battle/unit-inspect";

/** What a key or a controller button does in a Battle (UI-02). */
export type BattleKeyAction =
  | "moveSelection"
  | "focusTarget"
  | "play"
  | "endTurn"
  | "skip"
  | "inspect"
  | "handbook"
  | "battleLog"
  | "controlsGuide"
  | "cancel";

/** The input that made the command. A keyboard-only guard reads this. */
export type BattleCommandSource = "keyboard" | "pad";

export interface BattleKeyCommand {
  readonly action: BattleKeyAction;
  /** The direction for `moveSelection` and `focusTarget`: 1 is right or down. */
  readonly step: 1 | -1;
  readonly source: BattleCommandSource;
}

const COMMANDS: ReadonlyMap<string, Omit<BattleKeyCommand, "source">> = new Map(
  [
    ["ArrowLeft", { action: "moveSelection", step: -1 }],
    ["ArrowRight", { action: "moveSelection", step: 1 }],
    ["ArrowUp", { action: "focusTarget", step: -1 }],
    ["ArrowDown", { action: "focusTarget", step: 1 }],
    ["Enter", { action: "play", step: 1 }],
    ["e", { action: "endTurn", step: 1 }],
    ["E", { action: "endTurn", step: 1 }],
    ["s", { action: "skip", step: 1 }],
    ["S", { action: "skip", step: 1 }],
    ["i", { action: "inspect", step: 1 }],
    ["I", { action: "inspect", step: 1 }],
    ["h", { action: "handbook", step: 1 }],
    ["H", { action: "handbook", step: 1 }],
    ["l", { action: "battleLog", step: 1 }],
    ["L", { action: "battleLog", step: 1 }],
    ["Escape", { action: "cancel", step: 1 }],
  ]
);

/**
 * One line of the Controls Guide: a Battle action, or an input of the open
 * Battle Log. In the Battle Log, ←/→ go one Log Entry and Shift+←/→ one Turn.
 */
export type ControlsGuideLine = BattleKeyAction | "logEntry" | "logTurn";

/** The Controls Guide uses positions, so a connected pad supplies its own labels. */
export const CONTROLS_GUIDE: readonly {
  readonly keys: readonly string[];
  readonly action: ControlsGuideLine;
  readonly padControls: readonly PadControl[];
}[] = [
  { keys: ["←", "→"], action: "moveSelection", padControls: ["left", "right"] },
  { keys: ["↑", "↓"], action: "focusTarget", padControls: ["up", "down"] },
  { keys: ["Enter"], action: "play", padControls: ["south"] },
  { keys: ["E"], action: "endTurn", padControls: ["r2"] },
  { keys: ["S"], action: "skip", padControls: ["l2"] },
  { keys: ["I"], action: "inspect", padControls: ["west"] },
  { keys: ["H"], action: "handbook", padControls: ["north"] },
  { keys: ["L"], action: "battleLog", padControls: ["l1", "r1"] },
  { keys: ["←", "→"], action: "logEntry", padControls: ["left", "right"] },
  { keys: ["Shift", "←", "→"], action: "logTurn", padControls: ["l1", "r1"] },
  { keys: ["Esc"], action: "cancel", padControls: ["east"] },
  { keys: [], action: "controlsGuide", padControls: ["start"] },
];

/** Directions share the D-pad and left stick labels, once per action row. */
export const controlsGuidePadLabels = (
  controls: readonly PadControl[],
  labels: PadLabels
): readonly string[] => [
  ...new Set(
    controls.flatMap((control) => {
      switch (control) {
        case "up":
        case "down":
        case "left":
        case "right": {
          return [labels.dpad, labels.stick];
        }
        default: {
          return [labels[control]];
        }
      }
    })
  ),
];

const CONTROLLER_BUTTONS = [
  "south",
  "east",
  "west",
  "north",
  "l1",
  "r1",
  "l2",
  "r2",
  "start",
  "select",
] as const satisfies readonly PadButton[];

/** The legend includes Select without claiming that it has a Battle action. */
export const controlsGuideButtons = (labels: PadLabels): readonly string[] =>
  CONTROLLER_BUTTONS.map((control) => labels[control]);

/** What a key does while the Battle Log is open. */
export type LogKeyAction =
  | { readonly _tag: "step"; readonly step: 1 | -1; readonly byTurn: boolean }
  | { readonly _tag: "close" }
  /** The key works as in Live: Inspect and the Handbook. */
  | { readonly _tag: "live" }
  /** All Live input is off: no card play, no End Turn and no Skip. */
  | { readonly _tag: "off" };

/** What Esc or East does in Live (GDD 11.4). */
export type CancelAction = "select" | "leave" | "none";

/**
 * Esc in Live cancels the selected card first. With nothing to cancel, the
 * keyboard opens the Leave confirm. East on a pad only cancels: a pad cannot
 * close the confirm, so it never opens it.
 */
export const cancelAction = (
  hasSelection: boolean,
  source: BattleCommandSource
): CancelAction => {
  if (hasSelection) {
    return "select";
  }
  return source === "keyboard" ? "leave" : "none";
};

/**
 * The action of a key in the open Battle Log (GDD 11.2): ←/→ one Log Entry,
 * Shift+←/→ one Turn, L and Esc Back to Live. On a pad, L1 and R1 go one Turn
 * back and forward, and East (cancel) goes Back to Live. A Replay has no Live:
 * only Esc closes it, and the Player goes to the Town (web ADR-0011).
 */
export const logKeyAction = (
  command: BattleKeyCommand,
  shiftKey: boolean,
  watching = false
): LogKeyAction => {
  switch (command.action) {
    case "moveSelection": {
      return { _tag: "step", step: command.step, byTurn: shiftKey };
    }
    case "battleLog": {
      if (command.source === "pad" && !watching) {
        return { _tag: "step", step: command.step, byTurn: true };
      }
      return watching ? { _tag: "off" } : { _tag: "close" };
    }
    case "cancel": {
      return { _tag: "close" };
    }
    case "inspect":
    case "handbook":
    case "controlsGuide": {
      return { _tag: "live" };
    }
    default: {
      return { _tag: "off" };
    }
  }
};

/** The command for a key press, or `null`. A key with Meta, Control or Alt is the browser's. */
export const keyCommand = (key: {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}): BattleKeyCommand | null => {
  if (key.metaKey || key.ctrlKey || key.altKey) {
    return null;
  }
  const command = COMMANDS.get(key.key);
  return command ? { ...command, source: "keyboard" } : null;
};

/**
 * In the keyboard Inspect mode, the arrow keys go from Unit to Unit: the
 * direction of an arrow key command, or `null` for other commands.
 */
export const inspectDirection = (
  command: BattleKeyCommand
): InspectDirection | null => {
  if (command.action === "moveSelection") {
    return command.step === 1 ? "right" : "left";
  }
  if (command.action === "focusTarget") {
    return command.step === 1 ? "down" : "up";
  }
  return null;
};

/**
 * The next Ready card from the selected card in the direction `step`, or
 * `null` when no card is Ready. It skips a card that Unique blocks. The
 * selection wraps at the ends.
 */
export const nextReadyCard = (
  hand: readonly { readonly countdown: number; readonly blocked?: boolean }[],
  selected: number | null,
  step: 1 | -1
): number | null => {
  const ready = hand.flatMap((card, index) =>
    card.countdown === 0 && !card.blocked ? [index] : []
  );
  const position = selected === null ? -1 : ready.indexOf(selected);
  return ready[(position + step + ready.length) % ready.length] ?? null;
};
