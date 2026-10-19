/**
 * The painted art of the Dungeons screen (11 — Town Concepts 13): the mine
 * under the cave. The Player rides the lift down to one stop for each Dungeon,
 * so the same lift cut-out stands over each painted stop. The cave inside
 * painting stays as the fallback while a stop is not painted.
 */
export type DungeonArt =
  | "caveInside"
  | "shaftRock"
  | "lift"
  | "liftLocked"
  | "stop-1"
  | "stop-2"
  | "stop-3";

/**
 * The file of each painting. The cave inside is 3:2, 1536 × 1024, as the
 * Barracks inside. The shaft rock is a seamless 1280 × 840 tile. The lift and
 * the locked lift are 2:3 cut-outs with a transparent background. A stop is
 * 3:2, 1536 × 1024.
 */
export const DUNGEON_ART_FILE: Readonly<Record<DungeonArt, string>> = {
  caveInside: "/town/cave-inside.webp",
  shaftRock: "/dungeons/shaft-rock.webp",
  lift: "/dungeons/lift.webp",
  liftLocked: "/dungeons/lift-locked.webp",
  "stop-1": "/dungeons/stop-1.webp",
  "stop-2": "/dungeons/stop-2.webp",
  "stop-3": "/dungeons/stop-3.webp",
};

/** The size of each WebP file in pixels. */
export const DUNGEON_ART_SIZE: Readonly<
  Record<DungeonArt, { readonly width: number; readonly height: number }>
> = {
  caveInside: { width: 1536, height: 1024 },
  shaftRock: { width: 1280, height: 840 },
  lift: { width: 1024, height: 1536 },
  liftLocked: { width: 1024, height: 1536 },
  "stop-1": { width: 1536, height: 1024 },
  "stop-2": { width: 1536, height: 1024 },
  "stop-3": { width: 1536, height: 1024 },
};

/**
 * A stop (Town Concepts 13.2): the empty lift well at the left, the level
 * floor across it, the lair with its Bosses in the middle, and calm rock at
 * the right, under the docked Dungeon Panel. Measured on the paintings: the
 * centers of the 2 guide rails, and the floor line that the lift and the
 * Bosses stand on. A stop is 3:2.
 */
export const STOP = {
  /** The width of a stop over its height. */
  ratio: 3 / 2,
  /** The centers of the 2 guide rails of the empty lift well, in percent of the width. */
  rails: { left: 4, right: 26.2 },
  /** The floor line, in percent of the height. */
  floor: 77,
} as const;

/**
 * The lift cut-out (1024 × 1536, Town Concepts 13.2), measured on the file:
 * the outer edges of its cage, the top of its plank floor, and the center of
 * its rope. Its width is the width of the well between the 2 guide rails.
 */
export const LIFT_ART = {
  /** The outer edges of the cage, in percent of the lift width. */
  cage: { left: 12.7, right: 77.5 },
  /** The top of the plank floor, in percent of the lift height. */
  floor: 74.5,
  /** The center of the rope, in percent of the lift width. */
  rope: 49.8,
} as const;

/**
 * The place of the lift in a stop, in percent of the stop: the left edge and
 * the width of the stop width, the top of the stop height, and the center of
 * its rope of the stop width. The cage fills the well between the guide rails,
 * so the lift stands on the floor line of each stop.
 */
export const LIFT_BOX: {
  readonly left: number;
  readonly width: number;
  readonly top: number;
  readonly rope: number;
} = (() => {
  const scale =
    (STOP.rails.right - STOP.rails.left) /
    (LIFT_ART.cage.right - LIFT_ART.cage.left);
  const width = 100 * scale;
  return {
    left: STOP.rails.left - LIFT_ART.cage.left * scale,
    width,
    // The lift is 2:3: its height is 1.5 its width, and a length of the stop
    // width is `ratio` of the stop height.
    top: STOP.floor - (LIFT_ART.floor / 100) * width * 1.5 * STOP.ratio,
    rope:
      STOP.rails.left -
      LIFT_ART.cage.left * scale +
      (LIFT_ART.rope / 100) * width,
  };
})();

/** The width of the rope that the game draws over the well, in percent of the stop width. */
export const LIFT_ROPE_WIDTH = 1.7;

/**
 * The tile of the rope that the game draws over the well: a 3-twist crop of
 * the rope of the lift cut-out, so the rope above the lift has the same hemp,
 * light and shadow as the rope of the painting below it. The tile repeats down
 * the well; its top edge is the top edge of the lift rope, so the 2 meet
 * without a step.
 */
export const LIFT_ROPE_FILE = "/dungeons/rope.webp";

/**
 * A Boss of a stop, measured on its painting (Town Concepts 13.2): the center
 * of its body, and its top and its bottom, in percent of the stop. The game
 * lights this box when the Player hovers or focuses the dossier of the Boss.
 */
export interface BossMark {
  /** The center of the Boss, in percent of the width. */
  readonly x: number;
  /** The top of the Boss, in percent of the height. */
  readonly top: number;
  /** The bottom of the Boss, in percent of the height. */
  readonly bottom: number;
}

/**
 * The Bosses of each stop, in Boss order, so Boss 1 is at the left (13.3). The
 * Old Bramble of the Broken Vault stands behind the other 2, so its mark is
 * the tallest and the most inward.
 */
const STOP_BOSSES = {
  1: [
    { x: 39.5, top: 32, bottom: 78 },
    { x: 54.5, top: 33, bottom: 78 },
  ],
  2: [
    { x: 38, top: 30, bottom: 78 },
    { x: 57, top: 36, bottom: 78 },
  ],
  3: [
    { x: 40, top: 32, bottom: 78 },
    { x: 50, top: 12, bottom: 78 },
    { x: 56, top: 36, bottom: 79 },
  ],
} satisfies Readonly<Record<number, readonly BossMark[]>>;

/**
 * The art that a person has not painted yet. It shows a fallback in the same
 * box: the softened cave inside for a stop. Remove an ID when its WebP file is
 * in `public/`: a unit test checks the files.
 */
export const UNPAINTED_DUNGEON_ART: ReadonlySet<DungeonArt> =
  new Set<DungeonArt>();

/** The painted file of `art`, or `null` while it shows its fallback. */
export const dungeonArt = (art: DungeonArt): string | null =>
  UNPAINTED_DUNGEON_ART.has(art) ? null : DUNGEON_ART_FILE[art];

/** The stop painting of each Dungeon, by number. */
const STOP_ART = [
  "stop-1",
  "stop-2",
  "stop-3",
] as const satisfies readonly DungeonArt[];

/** The ID of the stop painting of Dungeon `number`, or `null` while it has none. */
export const stopArtId = (number: number): DungeonArt | null =>
  STOP_ART[number - 1] ?? null;

/** The Bosses of the stop of Dungeon `number`, or none while it is not painted. */
export const stopBosses = (number: number): readonly BossMark[] => {
  // SAFETY: a Dungeon whose number is not a key of `STOP_BOSSES` has no
  // painted stop, and the `?? []` covers it.
  const stop = STOP_BOSSES[number as keyof typeof STOP_BOSSES] ?? [];
  return stop;
};
