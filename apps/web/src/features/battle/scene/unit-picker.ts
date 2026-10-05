import type { Side } from "@workspace/rules";
import type { Object3D } from "three";

/**
 * The Units that the pointer can inspect (UI-05). Each Unit figure registers
 * a hidden hit box. The Unit inspector in the scene sets `points`.
 */
interface UnitPicker {
  /** The hit box of each Unit on the Board, by Unit ID. */
  readonly hitAreas: Map<number, Object3D>;
  /** QA: the screen point of each Unit, so a bot can hover or press it. */
  points: () => readonly {
    readonly id: number;
    readonly owner: Side;
    readonly x: number;
    readonly y: number;
  }[];
}

export const unitPicker: UnitPicker = {
  hitAreas: new Map(),
  points: () => [],
};
