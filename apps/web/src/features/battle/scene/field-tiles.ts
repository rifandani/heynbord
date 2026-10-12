import type { DamageType } from "@workspace/rules";
import { areaSquares, LANE_LENGTH } from "@workspace/rules";

import type { FieldEffectView } from "@/features/battle/battle-view";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import type { FxSlotName } from "@/features/battle/scene/fx-slots";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import type { Particle } from "@/features/battle/scene/particles";
import { hash, slotParticle } from "@/features/battle/scene/particles";

/** One tinted Square of a Field Effect on the Board. */
export interface FieldTile {
  readonly fieldId: number;
  readonly x: number;
  readonly z: number;
  readonly color: string;
  readonly opacity: number;
}

/**
 * The full rectangle of a Field Effect area on the ground, also over the gaps
 * between its Lanes, with its border. `width` is along the Lanes and `depth`
 * across them.
 */
export interface FieldArea {
  readonly fieldId: number;
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
  readonly color: string;
  /** The opacity of the fill. The border is always clear. */
  readonly opacity: number;
}

/** The number of hits that are left, at the front edge of a Field Effect area. */
export interface FieldLabel {
  readonly fieldId: number;
  readonly text: string;
  readonly damageType: FieldEffectView["damageType"];
  readonly x: number;
  readonly z: number;
}

/**
 * The tile opacity of a Field Effect with 1 hit left, and more for each other
 * hit. The tiles must show clearly over the Battle Painting.
 */
const TILE_OPACITY = 0.5;
const TILE_OPACITY_PER_TURN = 0.12;
const MAX_TILE_OPACITY = 0.75;

/** The fill of the full area is softer than the tiles, so the Units stay readable. */
const AREA_OPACITY = 0.22;
const AREA_OPACITY_PER_TURN = 0.06;
const MAX_AREA_OPACITY = 0.34;

/** Half the size of a Square, so the area goes to the edges of its Squares. */
const HALF_SQUARE = 0.5;

/** The label is this far in front of the area, so no Unit stands on it. */
const LABEL_GAP = 0.35;

/** The Squares of a Field Effect area that are on the Board. */
const fieldSquares = (field: FieldEffectView, lanes: number) =>
  areaSquares(field.owner, field.lane, field.position, field).filter(
    (square) =>
      square.lane >= 0 &&
      square.lane < lanes &&
      square.position >= 0 &&
      square.position < LANE_LENGTH
  );

const hitsLeft = (field: FieldEffectView): number =>
  Math.max(field.turns - 1, 0);

/**
 * The tinted Squares of each Field Effect on the Board (GDD 4.8), in the
 * color of its Damage Type. More hits left give a stronger tint. Two Field
 * Effects on the same Square each give a tile.
 */
export const fieldTiles = (
  fields: readonly FieldEffectView[],
  lanes: number
): FieldTile[] =>
  fields.flatMap((field) => {
    const opacity = Math.min(
      MAX_TILE_OPACITY,
      TILE_OPACITY + TILE_OPACITY_PER_TURN * hitsLeft(field)
    );
    return fieldSquares(field, lanes).map((square) => ({
      fieldId: field.id,
      x: squareX(square.position),
      z: laneZ(square.lane, lanes),
      color: DAMAGE_COLORS[field.damageType],
      opacity,
    }));
  });

/** The ground rectangle of the Squares of `field`, or `null` when none is on the Board. */
const bounds = (field: FieldEffectView, lanes: number) => {
  const squares = fieldSquares(field, lanes);
  if (squares.length === 0) {
    return null;
  }
  const xs = squares.map((square) => squareX(square.position));
  const zs = squares.map((square) => laneZ(square.lane, lanes));
  return {
    left: Math.min(...xs) - HALF_SQUARE,
    right: Math.max(...xs) + HALF_SQUARE,
    back: Math.min(...zs) - HALF_SQUARE,
    front: Math.max(...zs) + HALF_SQUARE,
  };
};

/**
 * The full rectangle of each Field Effect area, with a soft fill and a clear
 * border in the color of its Damage Type. It also covers the gaps between
 * the Lanes, so a Unit on a Square does not hide the area.
 */
export const fieldAreas = (
  fields: readonly FieldEffectView[],
  lanes: number
): FieldArea[] =>
  fields.flatMap((field) => {
    const box = bounds(field, lanes);
    return box
      ? [
          {
            fieldId: field.id,
            x: (box.left + box.right) / 2,
            z: (box.back + box.front) / 2,
            width: box.right - box.left,
            depth: box.front - box.back,
            color: DAMAGE_COLORS[field.damageType],
            opacity: Math.min(
              MAX_AREA_OPACITY,
              AREA_OPACITY + AREA_OPACITY_PER_TURN * hitsLeft(field)
            ),
          },
        ]
      : [];
  });

/**
 * The label of hits left of each Field Effect: in the middle of the front
 * edge of its area, on the ground in front of it, where no Unit of the area
 * covers it.
 */
export const fieldLabels = (
  fields: readonly FieldEffectView[],
  lanes: number
): FieldLabel[] =>
  fields.flatMap((field) => {
    const box = bounds(field, lanes);
    return box
      ? [
          {
            fieldId: field.id,
            text: String(field.turns),
            damageType: field.damageType,
            x: (box.left + box.right) / 2,
            z: box.front + LABEL_GAP,
          },
        ]
      : [];
  });

/**
 * The look of a Field Effect on its Squares (#66): the painted ground of
 * each Square, and the particles over it. Only Fire and Frost have a Field
 * Effect card. Another Damage Type shows only the tinted Squares.
 */
interface FieldLook {
  readonly ground: FxSlotName;
  readonly mote: FxSlotName;
  /** The life of one particle, in scene seconds. */
  readonly period: number;
  readonly place: (
    random: (k: number) => number,
    age: number
  ) => { readonly x: number; readonly y: number; readonly size: number };
  /** The opacity of the ground at `time`: the fire flickers, the snow is still. */
  readonly flicker: (time: number, seed: number) => number;
}

const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

const FIELD_LOOKS: Partial<Readonly<Record<DamageType, FieldLook>>> = {
  // Burning ground, and embers that go up from it.
  fire: {
    ground: "field-fire",
    mote: "ember",
    period: 1.4,
    place: (random, age) => ({
      x: lerp(-0.4, 0.4, random(0)) + Math.sin(age * 5 + random(1) * 6) * 0.05,
      y: lerp(0.1, 0.9, age),
      size: lerp(0.08, 0.14, random(2)) * (1 - age * 0.5),
    }),
    flicker: (time, seed) => 0.9 + Math.sin(time * 7 + seed * 3) * 0.1,
  },
  // Snow on the ground, and snow that the wind blows over it.
  frost: {
    ground: "field-snow",
    mote: "frost-mote",
    period: 2,
    place: (random, age) => ({
      x: lerp(-0.45, 0.15, random(0)) + age * 0.35,
      y: lerp(0.95, 0.1, age),
      size: lerp(0.06, 0.11, random(1)),
    }),
    flicker: () => 1,
  },
};

/** The ground image is just above the tinted Squares. */
const GROUND_Y = 0.11;

/** The ground image fills most of its Square, so the tinted rim stays. */
const GROUND_SIZE = 0.94;

/** The particles over each Square of a Field Effect area. */
const MOTES_PER_SQUARE = 2;

/** The ground with 1 hit left, and more for each other hit. */
const GROUND_OPACITY = 0.8;
const GROUND_OPACITY_PER_TURN = 0.1;

const fadeInOut = (age: number): number => Math.sin(age * Math.PI);

/**
 * The atlas quads of each Field Effect on the Board at `time`, in scene
 * seconds (GDD 4.8, #66): the painted fire or snow on each Square of its
 * area, which is stronger with more hits left, and embers or snow over it.
 * Each Square has a different quarter turn of the ground, so the area does
 * not repeat. With reduced motion, only the ground shows, and it does not
 * flicker.
 */
export const fieldParticles = (
  fields: readonly FieldEffectView[],
  lanes: number,
  time: number,
  reducedMotion = false
): Particle[] =>
  fields.flatMap((field) => {
    const look = FIELD_LOOKS[field.damageType];
    if (!look) {
      return [];
    }
    const strength = Math.min(
      1,
      GROUND_OPACITY + GROUND_OPACITY_PER_TURN * hitsLeft(field)
    );
    return fieldSquares(field, lanes).flatMap((square, index) => {
      const x = squareX(square.position);
      const z = laneZ(square.lane, lanes);
      const seed = field.id * 64 + index;
      const ground = slotParticle(look.ground, {
        x,
        y: GROUND_Y,
        z,
        size: GROUND_SIZE,
        stretch: 1,
        rotation: Math.floor(hash(seed, 0, 0) * 4) * (Math.PI / 2),
        opacity: strength * (reducedMotion ? 1 : look.flicker(time, seed)),
        burst: true,
        ground: true,
      });
      if (reducedMotion) {
        return [ground];
      }
      const motes = Array.from({ length: MOTES_PER_SQUARE }, (_, mote) => {
        // The particles of a Square are spread over the period.
        const clock =
          time / look.period + mote / MOTES_PER_SQUARE + hash(seed, mote, 1);
        const cycle = Math.floor(clock);
        const age = clock - cycle;
        const place = look.place((k) => hash(seed, mote * 64 + k, cycle), age);
        return slotParticle(look.mote, {
          x: x + place.x,
          y: place.y,
          z: z + lerp(-0.35, 0.35, hash(seed, mote, cycle + 0.5)),
          size: place.size,
          stretch: 1,
          rotation: 0,
          opacity: fadeInOut(age) * 0.9,
          burst: false,
        });
      });
      return [ground, ...motes];
    });
  });
