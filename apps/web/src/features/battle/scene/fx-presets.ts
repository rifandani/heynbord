import type { BattleEvent, ClassId, DamageType } from "@workspace/rules";

import {
  BLOCKED_HIT,
  CLASS_COLORS,
  DAMAGE_COLORS,
  FX_ANCHORS,
  HEAL_COLOR,
} from "@/features/battle/palette";
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

/** The dust puffs at the feet of a Unit that moves or is Pushed. */
export const DUST_PRESETS = ["move", "push"] as const;

export type DustPresetKey = (typeof DUST_PRESETS)[number];

/** The wind-up at the caster Hero of a Skill Card cast, for each Class. */
export type WindupPresetKey = `windup:${ClassId}`;

/** The impact of a heal or an Armor gain. A hit and a Status have their own bursts. */
export type ImpactPresetKey = "heal" | "armor";

/**
 * The attack, hit, movement and cast effects, with keys from the rules data
 * (web ADR-0009).
 */
export type FxPresetKey =
  | "melee"
  | "ranged"
  | HitPresetKey
  | DustPresetKey
  | WindupPresetKey
  | ImpactPresetKey;

/**
 * One attack, hit, movement or cast effect. This module has no Three.js code, so the Battle
 * timeline can read the times in the first bundle.
 */
export interface FxPreset {
  /** The main atlas image. With reduced motion, the effect is only this image, which fades. */
  readonly main: FxSlotName;
  /** The size of the main image, in world units. */
  readonly size: number;
  /** The streak behind a projectile, or behind a Pushed Unit. */
  readonly trail: FxSlotName | null;
  readonly spray: Spray | null;
  /**
   * The color of the `code` images. `null` is the Damage Type color of the
   * attacker, or no color for an effect with only `fixed` images.
   */
  readonly color: string | null;
  /**
   * The time that the effect needs at speed ×1, in ms. Its event is at least
   * this long, up to the limit of the event. A ranged attack also gets the
   * flight time of its projectile. A dust puff, a heal and an Armor gain do
   * not change the time of their event: this is only the life of the effect.
   * A wind-up fills its cast up to the spell bolt, and this is the shortest
   * time that it needs.
   */
  readonly time: number;
}

/**
 * A wind-up: a rune ring on the ground at the feet of the caster, and
 * particles of the Class color that go up from its edge. `speed` takes the
 * particles out from the edge (a negative speed takes them in), and `spin`
 * turns them around the Hero.
 */
const windup = (classId: ClassId, spray: Spray): FxPreset => ({
  main: "rune-ring",
  size: 2.1,
  trail: null,
  spray,
  color: CLASS_COLORS[classId],
  time: 340,
});

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
  // A small puff at each Square of a Movement.
  move: {
    main: "dust",
    size: 0.4,
    trail: null,
    spray: {
      slot: "dust",
      count: 4,
      speed: [0.15, 0.3],
      up: 0.1,
      size: [0.1, 0.18],
    },
    color: null,
    time: 450,
  },
  // A push is fast and forced: a larger puff, and a streak of dust behind the Unit.
  push: {
    main: "dust",
    size: 0.6,
    trail: "dust",
    spray: {
      slot: "dust",
      count: 7,
      speed: [0.25, 0.5],
      up: 0.15,
      size: [0.14, 0.24],
    },
    color: null,
    time: 550,
  },
  // Warrior: sparks jump up from the ring and fall, as from an anvil.
  "windup:warrior": windup("warrior", {
    slot: "spark",
    count: 20,
    speed: [0, 0.3],
    up: 1.4,
    size: [0.45, 0.7],
    gravity: 0.8,
  }),
  // Ranger: sparks turn fast around the Hero, as a wind.
  "windup:ranger": windup("ranger", {
    slot: "spark",
    count: 18,
    speed: [-0.2, 0.15],
    up: 1.2,
    size: [0.42, 0.64],
    spin: 6,
  }),
  // Mage: soft motes go up and turn slowly around the Hero.
  "windup:mage": windup("mage", {
    slot: "glow",
    count: 16,
    speed: [-0.3, 0.05],
    up: 1.7,
    size: [0.36, 0.56],
    spin: 2,
  }),
  // Priest: large soft lights go straight up, as a prayer.
  "windup:priest": windup("priest", {
    slot: "glow",
    count: 14,
    speed: [-0.1, 0.1],
    up: 2.1,
    size: [0.44, 0.66],
  }),
  // A green cross that grows on the Unit, and sparks that go up.
  heal: {
    main: "heal",
    size: 0.8,
    trail: null,
    spray: {
      slot: "spark",
      count: 8,
      speed: [0.15, 0.35],
      up: 0.6,
      size: [0.18, 0.3],
    },
    color: HEAL_COLOR,
    time: 650,
  },
  // A shield on the Unit, and blue sparks around it.
  armor: {
    main: "shield",
    size: 0.75,
    trail: null,
    spray: {
      slot: "spark",
      count: 7,
      speed: [0.35, 0.6],
      up: 0.1,
      size: [0.18, 0.3],
    },
    color: FX_ANCHORS.shield,
    time: 600,
  },
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
