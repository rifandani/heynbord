import { FX_ANCHORS } from "@/features/battle/palette";
import type { FxSlot, FxSlotName } from "@/features/battle/scene/fx-atlas";
import { FX_SLOTS } from "@/features/battle/scene/fx-atlas";
import type {
  DustPresetKey,
  FxPreset,
  HitPresetKey,
  ImpactPresetKey,
  SprayMotion,
  WindupPresetKey,
} from "@/features/battle/scene/fx-presets";
import { DUST_PRESETS, FX_PRESETS } from "@/features/battle/scene/fx-presets";
import type { Status } from "@/features/battle/scene/status-visuals";

/** The particles in the pool. When it is full, the loops get fewer particles. */
export const PARTICLE_POOL = 200;

/** How long a Status burst plays at speed ×1, in scene seconds. */
export const BURST_DURATION = 0.7;

/**
 * A burst when a Status starts, when Burn or Poison deals damage, when an
 * attack hits, when a Unit moves or is Pushed onto a Square, when a Unit is
 * healed or gets Armor, or when a Hero casts a Skill Card.
 */
export type BurstName =
  | Status
  | "burn-tick"
  | "poison-tick"
  | HitPresetKey
  | DustPresetKey
  | WindupPresetKey
  | ImpactPresetKey;

/**
 * Where particles come from. `x`, `y` and `z` are the feet of a Unit for a
 * loop, and the hit point for a burst. `seed` makes the particles of two
 * emitters different.
 */
export type Emitter =
  | {
      readonly kind: "loop";
      readonly preset: Status;
      readonly x: number;
      readonly y: number;
      readonly z: number;
      readonly seed: number;
    }
  | {
      readonly kind: "burst";
      readonly preset: BurstName;
      readonly x: number;
      readonly y: number;
      readonly z: number;
      /** In scene seconds. */
      readonly start: number;
      /** In scene seconds. */
      readonly duration: number;
      /** 1, or larger for a Crit. It multiplies the sizes and the distances. */
      readonly scale: number;
      /** True for a Unit that goes to the left: the x of the particles is mirrored. */
      readonly mirror?: boolean;
      readonly seed: number;
    };

/** One camera-facing quad with an atlas image. */
export interface Particle {
  readonly slot: FxSlotName;
  readonly blend: FxSlot["blend"];
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly size: number;
  /** The width divided by the height. A negative value mirrors the image. */
  readonly stretch: number;
  /** In radians, around the view axis. */
  readonly rotation: number;
  readonly color: string;
  readonly opacity: number;
  /** True for a burst particle. A full pool keeps these. */
  readonly burst: boolean;
  /**
   * True for an image that lies flat on the ground, as a rune ring. It does
   * not face the camera, and `rotation` turns it around the vertical axis.
   */
  readonly ground: boolean;
}

/** A particle in the emitter space, before the emitter position. */
interface LocalParticle {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly size: number;
  readonly rotation: number;
  readonly opacity: number;
}

/**
 * Where a particle is at `age`, 0 to 1 of its life. `random(k)` gives a fixed
 * number from 0 to 1 for this particle and `k`.
 */
type Placement = (random: (k: number) => number, age: number) => LocalParticle;

/** A group of particles with the same atlas image and the same placement. */
interface Emission {
  readonly slot: FxSlotName;
  readonly count: number;
  /** The color for a `code` slot. A `fixed` slot keeps its painted color. */
  readonly color?: string;
  /** True for an image that lies flat on the ground. */
  readonly ground?: boolean;
  readonly place: Placement;
}

interface LoopPreset extends Emission {
  /** The life of one particle, in scene seconds. */
  readonly period: number;
  /** A steady particle keeps its place in each period, as the vines at the feet. */
  readonly steady?: boolean;
}

const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

/** In, then out: 0 at the two ends of a life and 1 in the middle. */
const fade = (age: number): number => Math.sin(age * Math.PI);

/** 1 until `from`, then down to 0 at the end of the life. */
const fadeOutAfter = (age: number, from: number): number =>
  age < from ? 1 : 1 - (age - from) / (1 - from);

/** A quiet loop on the Unit for each Status. */
const LOOPS: Readonly<Record<Status, LoopPreset>> = {
  // Embers go up from the figure.
  burn: {
    slot: "ember",
    count: 6,
    period: 1.3,
    place: (random, age) => ({
      x: lerp(-0.3, 0.3, random(0)) + Math.sin(age * 6 + random(1) * 6) * 0.05,
      y: lerp(0.2, 0.7, random(2)) + age * 0.7,
      z: lerp(0.05, 0.25, random(3)),
      size: lerp(0.1, 0.18, random(4)) * (1 - age * 0.5),
      rotation: 0,
      opacity: fade(age),
    }),
  },
  // Frost motes fall slowly around the figure.
  freeze: {
    slot: "frost-mote",
    count: 5,
    period: 2.4,
    place: (random, age) => ({
      x: lerp(-0.4, 0.4, random(0)) + Math.sin(age * 4 + random(1) * 6) * 0.06,
      y: lerp(1.2, 0.2, age),
      z: lerp(-0.1, 0.25, random(2)),
      size: lerp(0.08, 0.14, random(3)),
      rotation: age * 2 * (random(4) - 0.5),
      opacity: fade(age) * 0.9,
    }),
  },
  // Bubbles go up and wobble.
  poison: {
    slot: "bubble",
    count: 4,
    period: 1.8,
    place: (random, age) => ({
      x:
        lerp(-0.28, 0.28, random(0)) + Math.sin(age * 9 + random(1) * 6) * 0.04,
      y: lerp(0.1, 0.9, age),
      z: lerp(0.05, 0.2, random(2)),
      size: lerp(0.08, 0.15, random(3)) * (0.6 + age * 0.4),
      rotation: 0,
      opacity: 0.9 * fadeOutAfter(age, 0.85),
    }),
  },
  // Vines at the feet, which sway a little.
  entangle: {
    slot: "vine",
    count: 2,
    period: 3,
    steady: true,
    place: (random, age) => ({
      x: lerp(-0.28, 0.28, random(0)),
      y: 0.2,
      z: lerp(0.1, 0.25, random(1)),
      size: lerp(0.38, 0.46, random(2)),
      rotation: Math.sin((age + random(3)) * Math.PI * 2) * 0.12,
      opacity: 0.95,
    }),
  },
  // Blood drips fall from the figure.
  bleed: {
    slot: "drip",
    count: 3,
    period: 1.2,
    place: (random, age) => ({
      x: lerp(-0.25, 0.25, random(0)),
      y: lerp(0.75, 0.1, age * age),
      z: lerp(0.1, 0.22, random(1)),
      size: lerp(0.08, 0.12, random(2)),
      rotation: 0,
      opacity: 0.95 * fadeOutAfter(age, 0.8),
    }),
  },
  // A chain at the feet, which swings a little.
  hobble: {
    slot: "chain",
    count: 1,
    period: 2.6,
    steady: true,
    place: (_random, age) => ({
      x: 0,
      y: 0.16,
      z: 0.22,
      size: 0.42,
      rotation: Math.sin(age * Math.PI * 2) * 0.08,
      opacity: 0.95,
    }),
  },
};

/** Particles that fly out from the middle, slow down and fade. */
const spray =
  (options: SprayMotion): Placement =>
  (random, age) => {
    const angle = random(0) * Math.PI * 2;
    const speed = lerp(options.speed[0], options.speed[1], random(1));
    const travel = 1 - (1 - age) ** 2;
    return {
      x: Math.cos(angle) * speed * travel,
      y:
        Math.sin(angle) * speed * travel * 0.6 +
        options.up * travel -
        (options.gravity ?? 0) * age * age,
      z: lerp(0.05, 0.3, random(2)),
      size: lerp(options.size[0], options.size[1], random(3)) * (1 - age * 0.4),
      rotation: (random(4) - 0.5) * (options.spin ?? 0) * age,
      opacity: 1 - age * age,
    };
  };

/** One image in the middle that grows and fades. */
const pulse =
  (from: number, to: number): Placement =>
  (_random, age) => ({
    x: 0,
    y: 0,
    z: 0.2,
    size: lerp(from, to, 1 - (1 - age) ** 3),
    rotation: 0,
    opacity: 1 - age,
  });

/** Vines that grow at the feet. The burst point is at the middle of the figure. */
const growVine: Placement = (random, age) => ({
  x: lerp(-0.3, 0.3, random(0)),
  y: -0.5,
  z: lerp(0.1, 0.3, random(1)),
  size: 0.45 * Math.min(age * 3, 1),
  rotation: (random(2) - 0.5) * 0.6,
  opacity: fadeOutAfter(age, 0.7),
});

/**
 * A rune ring on the ground: it grows in, turns, and fades at the end. The
 * burst point is at the feet.
 */
const runeRing =
  (size: number): Placement =>
  (_random, age) => ({
    x: 0,
    y: 0,
    z: 0,
    size: size * lerp(0.6, 1, 1 - (1 - Math.min(age * 2.5, 1)) ** 3),
    rotation: age * 1.6,
    opacity: Math.min(age * 6, 1) * fadeOutAfter(age, 0.75),
  });

/**
 * Particles that start on the edge of a ring on the ground, of diameter
 * `ring`, and go up around its middle: `speed` takes them out, `up` up, and
 * `spin` turns them around the middle.
 */
const rise =
  (ring: number, options: SprayMotion): Placement =>
  (random, age) => {
    const travel = 1 - (1 - age) ** 2;
    const angle =
      random(0) * Math.PI * 2 + (options.spin ?? 0) * (random(1) - 0.2) * age;
    const radius =
      ring * 0.4 + lerp(options.speed[0], options.speed[1], random(2)) * travel;
    return {
      x: Math.cos(angle) * radius,
      y:
        0.05 +
        options.up * travel * lerp(0.6, 1, random(3)) -
        (options.gravity ?? 0) * age * age,
      z: Math.sin(angle) * radius,
      size: lerp(options.size[0], options.size[1], random(4)) * (1 - age * 0.3),
      rotation: 0,
      opacity: Math.min(age * 5, 1) * (1 - age * age),
    };
  };

/**
 * A wind-up: the rune ring is the key image, and the particles of the Class
 * go up from its edge.
 */
const windupBurst = (preset: FxPreset): Emission[] => {
  const color = preset.color ?? undefined;
  const ring: Emission = {
    slot: preset.main,
    count: 1,
    color,
    ground: true,
    place: runeRing(preset.size),
  };
  return preset.spray
    ? [
        ring,
        {
          slot: preset.spray.slot,
          count: preset.spray.count,
          color,
          place: rise(preset.size, preset.spray),
        },
      ]
    : [ring];
};

/** A hit or a dust puff: its main image grows and fades, and its spray flies out. */
const presetBurst = (preset: FxPreset): Emission[] => {
  const color = preset.color ?? undefined;
  const main: Emission = {
    slot: preset.main,
    count: 1,
    color,
    place: pulse(preset.size * 0.55, preset.size),
  };
  return preset.spray
    ? [
        main,
        {
          slot: preset.spray.slot,
          count: preset.spray.count,
          color,
          place: spray(preset.spray),
        },
      ]
    : [main];
};

/** The dust particles of the streak behind a Pushed Unit. */
const STREAK_COUNT = 6;

/**
 * Dust on the Square behind a Unit that goes to the right. It stays low,
 * grows a little, and the back of the streak is fainter.
 */
const streak: Placement = (random, age) => {
  const back = random(0);
  return {
    x: -back * 0.9,
    y: lerp(-0.04, 0.06, random(1)) + age * 0.08,
    z: lerp(0.05, 0.25, random(2)),
    size: lerp(0.14, 0.24, random(3)) * (1 + age * 0.4),
    rotation: (random(4) - 0.5) * age,
    opacity: (1 - age) * (1 - back * 0.6),
  };
};

/** A dust puff at the feet. A push also leaves a streak behind the Unit. */
const dustBurst = (preset: FxPreset): Emission[] => [
  ...presetBurst(preset),
  ...(preset.trail
    ? [{ slot: preset.trail, count: STREAK_COUNT, place: streak }]
    : []),
];

/** Bursts that are only motion. With reduced motion, they show nothing. */
const MOTION_ONLY: ReadonlySet<BurstName> = new Set<BurstName>(DUST_PRESETS);

/**
 * The bursts. The first spray is the key image: with reduced motion, a burst
 * is only that image, which fades in its place. A `MOTION_ONLY` burst shows
 * nothing.
 */
const BURSTS: Readonly<Record<BurstName, readonly Emission[]>> = {
  burn: [
    { slot: "flame", count: 1, place: pulse(0.3, 0.7) },
    {
      slot: "ember",
      count: 10,
      place: spray({ speed: [0.3, 0.7], up: 0.4, size: [0.1, 0.18] }),
    },
  ],
  freeze: [
    { slot: "glow", count: 1, color: FX_ANCHORS.frost, place: pulse(0.4, 1) },
    {
      slot: "frost-shard",
      count: 8,
      place: spray({ speed: [0.4, 0.8], up: 0, size: [0.14, 0.22], spin: 3 }),
    },
  ],
  poison: [
    { slot: "bubble", count: 1, place: pulse(0.2, 0.5) },
    {
      slot: "bubble",
      count: 8,
      place: spray({ speed: [0.2, 0.5], up: 0.3, size: [0.08, 0.16] }),
    },
  ],
  entangle: [
    { slot: "vine", count: 3, place: growVine },
    {
      slot: "dust",
      count: 4,
      place: spray({ speed: [0.2, 0.4], up: -0.4, size: [0.15, 0.25] }),
    },
  ],
  bleed: [
    { slot: "drip", count: 1, place: pulse(0.15, 0.3) },
    {
      slot: "drip",
      count: 6,
      place: spray({
        speed: [0.3, 0.6],
        up: 0.2,
        size: [0.07, 0.12],
        gravity: 0.6,
      }),
    },
  ],
  hobble: [
    { slot: "chain", count: 1, place: pulse(0.6, 0.45) },
    {
      slot: "dust",
      count: 4,
      place: spray({ speed: [0.2, 0.4], up: -0.3, size: [0.15, 0.25] }),
    },
  ],
  "burn-tick": [
    { slot: "flame", count: 1, place: pulse(0.35, 0.6) },
    {
      slot: "ember",
      count: 6,
      place: spray({ speed: [0.15, 0.35], up: 0.6, size: [0.1, 0.16] }),
    },
  ],
  "poison-tick": [
    {
      slot: "glow",
      count: 1,
      color: FX_ANCHORS.poison,
      place: pulse(0.3, 0.8),
    },
    {
      slot: "bubble",
      count: 6,
      place: spray({ speed: [0.2, 0.4], up: 0.2, size: [0.08, 0.14] }),
    },
  ],
  "hit:physical": presetBurst(FX_PRESETS["hit:physical"]),
  "hit:fire": presetBurst(FX_PRESETS["hit:fire"]),
  "hit:frost": presetBurst(FX_PRESETS["hit:frost"]),
  "hit:holy": presetBurst(FX_PRESETS["hit:holy"]),
  "hit:blocked": presetBurst(FX_PRESETS["hit:blocked"]),
  move: dustBurst(FX_PRESETS.move),
  push: dustBurst(FX_PRESETS.push),
  "windup:warrior": windupBurst(FX_PRESETS["windup:warrior"]),
  "windup:ranger": windupBurst(FX_PRESETS["windup:ranger"]),
  "windup:mage": windupBurst(FX_PRESETS["windup:mage"]),
  "windup:priest": windupBurst(FX_PRESETS["windup:priest"]),
  heal: presetBurst(FX_PRESETS.heal),
  armor: presetBurst(FX_PRESETS.armor),
};

export const loopParticleCount = (status: Status): number =>
  LOOPS[status].count;

export const burstParticleCount = (burst: BurstName): number =>
  BURSTS[burst].reduce((total, part) => total + part.count, 0);

/**
 * A fixed number from 0 to 1 for three integers. The particles are only a
 * look, so this hash does not need the exact integer math of the rules.
 */
const hash = (a: number, b: number, c: number): number => {
  const value = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43_758.5453;
  return value - Math.floor(value);
};

const WHITE = "#ffffff";

/** One quad with the image of `slot`. A `fixed` slot keeps its painted color. */
export const slotParticle = (
  slot: FxSlotName,
  place: Omit<Particle, "slot" | "blend" | "color" | "ground"> & {
    readonly color?: string;
    readonly ground?: boolean;
  }
): Particle => {
  const { blend, tint } = FX_SLOTS[slot];
  return {
    ...place,
    slot,
    blend,
    color: tint === "code" ? (place.color ?? WHITE) : WHITE,
    opacity: Math.max(place.opacity, 0),
    ground: place.ground ?? false,
  };
};

const particleOf = (
  part: Emission,
  emitter: Emitter,
  local: LocalParticle
): Particle => {
  const scale = emitter.kind === "burst" ? emitter.scale : 1;
  const side = emitter.kind === "burst" && emitter.mirror ? -1 : 1;
  return slotParticle(part.slot, {
    x: emitter.x + local.x * scale * side,
    y: emitter.y + local.y * scale,
    z: emitter.z + local.z,
    size: local.size * scale,
    stretch: 1,
    rotation: local.rotation,
    color: part.color,
    opacity: local.opacity,
    burst: emitter.kind === "burst",
    ground: part.ground,
  });
};

const burstParticles = (
  emitter: Extract<Emitter, { readonly kind: "burst" }>,
  time: number,
  reducedMotion: boolean
): Particle[] => {
  const age = (time - emitter.start) / emitter.duration;
  if (age < 0 || age >= 1) {
    return [];
  }
  const parts = BURSTS[emitter.preset];
  if (reducedMotion && MOTION_ONLY.has(emitter.preset)) {
    return [];
  }
  if (reducedMotion) {
    const [key] = parts;
    if (!key) {
      return [];
    }
    // The key image in its middle place and size, with no movement.
    const still = key.place(() => 0.5, 0.5);
    return [particleOf(key, emitter, { ...still, opacity: 1 - age })];
  }
  return parts.flatMap((part, partIndex) =>
    Array.from({ length: part.count }, (_, index) =>
      particleOf(
        part,
        emitter,
        part.place((k) => hash(emitter.seed, partIndex * 64 + index, k), age)
      )
    )
  );
};

const loopParticles = (
  emitter: Extract<Emitter, { readonly kind: "loop" }>,
  time: number,
  count: number
): Particle[] => {
  const preset = LOOPS[emitter.preset];
  const offset = hash(emitter.seed, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    // The particles of a loop are spread over its period.
    const clock = time / preset.period + index / preset.count + offset;
    const cycle = preset.steady ? 0 : Math.floor(clock);
    return particleOf(
      preset,
      emitter,
      preset.place(
        (k) => hash(emitter.seed, index * 64 + k, cycle),
        clock - Math.floor(clock)
      )
    );
  });
};

/**
 * The particles of each loop in a pool with `free` places: one particle to
 * each loop in turn, so that each loop keeps some particles.
 */
const shareLoops = (wanted: readonly number[], free: number): number[] => {
  const counts = wanted.map(() => 0);
  let left = free;
  let added = true;
  while (left > 0 && added) {
    added = false;
    for (const [index, count] of wanted.entries()) {
      const current = counts[index] ?? 0;
      if (left > 0 && current < count) {
        counts[index] = current + 1;
        left -= 1;
        added = true;
      }
    }
  }
  return counts;
};

/**
 * All particles at `time`, in scene seconds. The bursts always get their
 * particles. The loops share the rest of the pool: when it is full, each loop
 * gets fewer particles. With reduced motion, the loops and the dust show no
 * particles, and another burst is one image that fades in its place.
 */
export const spawnParticles = (
  emitters: readonly Emitter[],
  time: number,
  capacity: number,
  reducedMotion = false
): Particle[] => {
  const bursts = emitters.flatMap((emitter) =>
    emitter.kind === "burst" ? burstParticles(emitter, time, reducedMotion) : []
  );
  const loops = reducedMotion
    ? []
    : emitters.filter(
        (emitter): emitter is Extract<Emitter, { readonly kind: "loop" }> =>
          emitter.kind === "loop"
      );
  const counts = shareLoops(
    loops.map((emitter) => LOOPS[emitter.preset].count),
    Math.max(capacity - bursts.length, 0)
  );
  return [
    ...bursts,
    ...loops.flatMap((emitter, index) =>
      loopParticles(emitter, time, counts[index] ?? 0)
    ),
  ];
};

/** One atlas image that plays in its place, as the slash of a melee attack. */
export interface Billboard {
  readonly slot: FxSlotName;
  /** The color of a `code` slot. */
  readonly color: string;
  /** In world units. */
  readonly size: number;
  /** True when the attacker faces left: the image and its sweep are mirrored. */
  readonly mirror: boolean;
  readonly x: number;
  readonly z: number;
  readonly height: number;
  /** In scene seconds. */
  readonly start: number;
  /** In scene seconds. */
  readonly duration: number;
}

/**
 * The quad of a billboard at `time`, or `null` outside its life. It sweeps,
 * grows and fades. With reduced motion, it only fades in its place.
 */
export const billboardParticle = (
  billboard: Billboard,
  time: number,
  reducedMotion = false
): Particle | null => {
  const age = (time - billboard.start) / billboard.duration;
  if (age < 0 || age >= 1) {
    return null;
  }
  const side = billboard.mirror ? -1 : 1;
  const sweep = reducedMotion ? 0.5 : 1 - (1 - age) ** 2;
  return slotParticle(billboard.slot, {
    x: billboard.x,
    y: billboard.height,
    // In front of the target, so that its figure does not hide the image.
    z: billboard.z + 0.3,
    size: billboard.size * lerp(0.75, 1.05, sweep),
    stretch: side,
    rotation: lerp(0.7, -0.35, sweep) * side,
    color: billboard.color,
    opacity: reducedMotion ? 1 - age : Math.min(age * 8, 1) * (1 - age * age),
    burst: true,
  });
};
