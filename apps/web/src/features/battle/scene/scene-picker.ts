import type { Target } from "@workspace/rules";

/**
 * Finds the legal target under a screen point: the Square of a Unit there
 * when it is a legal target, else the marker. The target markers in the scene
 * set it. The HUD uses it when the player drops a dragged card.
 */
interface ScenePicker {
  pick: (clientX: number, clientY: number) => Target | null;
  /** QA: the screen point of each legal target marker, in target order. */
  points: () => readonly { readonly x: number; readonly y: number }[];
  /**
   * The index of the legal target that is the Square of the Unit under a
   * screen point, or `null`. The figure of a Unit hides its Square marker.
   */
  unitTarget: (clientX: number, clientY: number) => number | null;
}

export const scenePicker: ScenePicker = {
  pick: () => null,
  points: () => [],
  unitTarget: () => null,
};
