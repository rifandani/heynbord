import type { Object3D } from "three";

/**
 * The group of each Unit figure on the Board, by Unit ID. A Unit registers it
 * while it is on the Board. The Status layer puts the loops of a Unit at its
 * group, so they go with the Unit when it walks or lunges.
 */
export const unitAnchors = new Map<number, Object3D>();
