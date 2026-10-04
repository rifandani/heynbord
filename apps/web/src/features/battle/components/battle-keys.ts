/** What a key does in a Battle (UI-02: a full Battle with only a keyboard). */
export type BattleKeyAction =
  | "moveSelection"
  | "focusTarget"
  | "play"
  | "endTurn"
  | "skip"
  | "cancel";

export interface BattleKeyCommand {
  readonly action: BattleKeyAction;
  /** The direction for `moveSelection` and `focusTarget`: 1 is right or down. */
  readonly step: 1 | -1;
}

const COMMANDS: ReadonlyMap<string, BattleKeyCommand> = new Map([
  ["ArrowLeft", { action: "moveSelection", step: -1 }],
  ["ArrowRight", { action: "moveSelection", step: 1 }],
  ["ArrowUp", { action: "focusTarget", step: -1 }],
  ["ArrowDown", { action: "focusTarget", step: 1 }],
  ["Enter", { action: "play", step: 1 }],
  ["e", { action: "endTurn", step: 1 }],
  ["E", { action: "endTurn", step: 1 }],
  ["s", { action: "skip", step: 1 }],
  ["S", { action: "skip", step: 1 }],
  ["Escape", { action: "cancel", step: 1 }],
]);

/** The Key Guide: the keys for each action, in the order that the Top Bar shows them. */
export const KEY_GUIDE: readonly {
  readonly keys: readonly string[];
  readonly action: BattleKeyAction;
}[] = [
  { keys: ["←", "→"], action: "moveSelection" },
  { keys: ["↑", "↓"], action: "focusTarget" },
  { keys: ["Enter"], action: "play" },
  { keys: ["E"], action: "endTurn" },
  { keys: ["S"], action: "skip" },
  { keys: ["Esc"], action: "cancel" },
];

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
  return COMMANDS.get(key.key) ?? null;
};

/**
 * The next Ready card from the selected card in the direction `step`, or
 * `null` when no card is Ready. The selection wraps at the ends.
 */
export const nextReadyCard = (
  hand: readonly { readonly countdown: number }[],
  selected: number | null,
  step: 1 | -1
): number | null => {
  const ready = hand.flatMap((card, index) =>
    card.countdown === 0 ? [index] : []
  );
  const position = selected === null ? -1 : ready.indexOf(selected);
  return ready[(position + step + ready.length) % ready.length] ?? null;
};
