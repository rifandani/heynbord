import { getCard, Target } from "@workspace/rules";
import type { RankId } from "@workspace/rules";

import type { HandCardView } from "@/features/battle/battle-view";

/** A pointer must move this far before a press becomes a drag. */
const DRAG_DISTANCE = 10;

/** A card that the pointer holds. It is `active` after it moves far enough. */
export interface Drag {
  readonly index: number;
  readonly startX: number;
  readonly startY: number;
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
}

/** A press on a Ready card: the drag starts, but it is not active yet. */
export const startDrag = (index: number, x: number, y: number): Drag => ({
  index,
  startX: x,
  startY: y,
  x,
  y,
  active: false,
});

interface DragMove {
  readonly drag: Drag;
  /** True when this move made the drag active. */
  readonly started: boolean;
}

/** The drag after a pointer move. */
export const dragMove = (current: Drag, x: number, y: number): DragMove => {
  const active =
    current.active ||
    Math.hypot(x - current.startX, y - current.startY) > DRAG_DISTANCE;
  return {
    drag: { ...current, x, y, active },
    started: active && !current.active,
  };
};

/** The Hand index of the card that an active drag holds, or `null`. */
export const activeDragIndex = (drag: Drag | null): number | null =>
  drag?.active ? drag.index : null;

/** The card that follows the pointer while a drag is active, or `null`. */
export const draggedCard = (
  drag: Drag | null,
  hand: readonly HandCardView[]
): {
  readonly cardId: string;
  readonly rank: RankId;
  readonly x: number;
  readonly y: number;
} | null => {
  if (!drag?.active) {
    return null;
  }
  const card = hand[drag.index];
  return card?.cardId
    ? { cardId: card.cardId, rank: card.rank ?? "common", x: drag.x, y: drag.y }
    : null;
};

/** What a press (click, tap or Enter) on a Hand card does. */
export type PressAction =
  | { readonly _tag: "inspect" }
  | { readonly _tag: "play"; readonly target: Target }
  | { readonly _tag: "select"; readonly index: number | null };

interface PressInput {
  readonly card: HandCardView | undefined;
  readonly index: number;
  readonly selected: number | null;
  readonly canAct: boolean;
  /** True for a keyboard press (Enter), false for a pointer click. */
  readonly keyboard: boolean;
  /** The focused legal target of the selected card. */
  readonly focusedTarget: Target | undefined;
}

/** A card with no target plays at once. */
const playsAtOnce = (cardId: string | null): boolean => {
  const definition = cardId ? getCard(cardId) : null;
  return definition?.kind === "skill" && definition.target === "none";
};

/** Enter on the selected card plays the focused target. A second click cancels. */
const pressSelected = (
  keyboard: boolean,
  target: Target | undefined
): PressAction =>
  keyboard && target
    ? { _tag: "play", target }
    : { _tag: "select", index: null };

/**
 * A card that is not Ready shows its details. A Ready card is selected, or
 * plays at once when it has no target.
 */
export const pressAction = (input: PressInput): PressAction => {
  const { card, index } = input;
  if (!card || card.countdown > 0 || !input.canAct) {
    return { _tag: "inspect" };
  }
  if (input.selected === index) {
    return pressSelected(input.keyboard, input.focusedTarget);
  }
  return playsAtOnce(card.cardId)
    ? { _tag: "play", target: Target.NoTarget() }
    : { _tag: "select", index };
};

/** The hint under the Hand while a card is selected. */
export const handHint = (
  selectedCard: HandCardView | undefined,
  targetCount: number
): "battle.selectTarget" | "battle.noTarget" | null => {
  if (!selectedCard) {
    return null;
  }
  return targetCount > 0 ? "battle.selectTarget" : "battle.noTarget";
};
