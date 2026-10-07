import type { BattleEvent, DamageType } from "@workspace/rules";

import { BLOCKED_HIT, DAMAGE_COLORS } from "@/features/battle/palette";
import type { FxSlotName } from "@/features/battle/scene/fx-atlas";

/**
 * How the particles of a spray fly out from the middle, slow down and fade.
 * The speeds and the sizes are ranges, in world units.
 */
export interface SprayMotion {
  readonly speed: readonly [number, number];
  readonly up: number;
  readonly size: readonly [number, number];
  readonly gravity?: number;
  readonly spin?: number;
}

/** Particles of one atlas image that fly out of a hit. */
export interface Spray extends SprayMotion {
  readonly slot: FxSlotName;
  readonly count: number;
}

export type HitPresetKey = `hit:${DamageType}` | "hit:blocked";

/** The attack and hit effects, with keys from the rules data (web ADR-0009). */
export type FxPresetKey = "melee" | "ranged" | HitPresetKey;

/**
 * One attack or hit effect. This module has no Three.js code, so the Battle
 * timeline can read the times in the first bundle.
 */
export interface FxPreset {
  /** The main atlas image. With reduced motion, the effect is only this image, which fades. */
  readonly main: FxSlotName;
  /** The size of the main image, in world units. */
  readonly size: number;
  /** The streak behind a projectile. */
  readonly trail: FxSlotName | null;
  readonly spray: Spray | null;
  /** The color of the `code` images. `null` is the Damage Type color of the attacker. */
  readonly color: string | null;
  /**
   * The time that the effect needs at speed ×1, in ms. Its event is at least
   * this long, up to the limit of the event. A ranged attack also gets the
   * flight time of its projectile.
   */
  readonly time: number;
}

const hit = (
  main: FxSlotName,
  size: number,
  spray: Spray,
  color: string,
  time: number
): FxPreset => ({ main, size, trail: null, spray, color, time });

export const FX_PRESETS: Readonly<Record<FxPresetKey, FxPreset>> = {
  // A slash arc at the target, at the impact of the lunge.
  melee: {
    main: "slash",
    size: 1.1,
    trail: null,
    spray: null,
    color: null,
    time: 420,
  },
  // A glow head with a streak behind it. The flight time comes from the distance.
  ranged: {
    main: "glow",
    size: 0.5,
    trail: "trail",
    spray: null,
    color: null,
    time: 200,
  },
  "hit:physical": hit(
    "burst",
    0.9,
    {
      slot: "spark",
      count: 9,
      speed: [0.5, 0.95],
      up: 0.15,
      size: [0.1, 0.2],
      gravity: 0.3,
    },
    DAMAGE_COLORS.physical,
    320
  ),
  "hit:fire": hit(
    "flame",
    0.85,
    {
      slot: "ember",
      count: 10,
      speed: [0.3, 0.7],
      up: 0.5,
      size: [0.1, 0.2],
    },
    DAMAGE_COLORS.fire,
    380
  ),
  "hit:frost": hit(
    "frost-shard",
    0.55,
    {
      slot: "frost-shard",
      count: 9,
      speed: [0.45, 0.85],
      up: 0,
      size: [0.14, 0.24],
      gravity: 0.25,
      spin: 4,
    },
    DAMAGE_COLORS.frost,
    360
  ),
  "hit:holy": hit(
    "flare",
    1,
    {
      slot: "glow",
      count: 6,
      speed: [0.2, 0.45],
      up: 0.35,
      size: [0.2, 0.32],
    },
    DAMAGE_COLORS.holy,
    400
  ),
  // No burst: the Block took the damage.
  "hit:blocked": hit(
    "spark",
    0.45,
    {
      slot: "spark",
      count: 5,
      speed: [0.3, 0.55],
      up: 0.1,
      size: [0.08, 0.14],
      gravity: 0.4,
    },
    BLOCKED_HIT,
    260
  ),
};

/** The atlas images of a preset, the main image first. */
export const presetSlots = (preset: FxPreset): FxSlotName[] => [
  preset.main,
  ...(preset.trail ? [preset.trail] : []),
  ...(preset.spray ? [preset.spray.slot] : []),
];

/** A Crit hit is this much larger. */
export const CRIT_SCALE = 1.4;

type DamageDealt = Extract<BattleEvent, { readonly _tag: "DamageDealt" }>;

/**
 * The burst of the Status that deals the damage, or `null` for other damage.
 * A Burn or a Poison hit shows this burst, not a hit preset, so the damage
 * has a cause.
 */
export const tickBurst = (
  event: DamageDealt
): "burn-tick" | "poison-tick" | null => {
  if (event.source === "burn") {
    return "burn-tick";
  }
  return event.source === "poison" ? "poison-tick" : null;
};

/** The hit preset of a damage event that is not from a Status. */
export const hitPreset = (event: DamageDealt): HitPresetKey =>
  event.blocked ? "hit:blocked" : `hit:${event.damageType}`;
