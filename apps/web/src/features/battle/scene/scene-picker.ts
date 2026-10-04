import type { Target } from "@workspace/rules";

/**
 * Finds the legal target under a screen point. The target markers in the
 * scene set it. The HUD uses it when the player drops a dragged card.
 */
interface ScenePicker {
  pick: (clientX: number, clientY: number) => Target | null;
  /** QA: the screen point of each legal target marker, in target order. */
  points: () => readonly { readonly x: number; readonly y: number }[];
}

export const scenePicker: ScenePicker = {
  pick: () => null,
  points: () => [],
};
