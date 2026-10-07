import type { BattleEvent, DamageType } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleSpeed } from "@/features/battle/battle-timeline";
import { eventDuration, pushArrival } from "@/features/battle/battle-timeline";
import type { BattleView } from "@/features/battle/battle-view";
import type { Cast } from "@/features/battle/cast";
import { castSquares, effectColor } from "@/features/battle/cast";
import { DAMAGE_COLORS } from "@/features/battle/palette";
import type {
  FxPresetKey,
  ImpactPresetKey,
} from "@/features/battle/scene/fx-presets";
import {
  CRIT_SCALE,
  FX_PRESETS,
  hitPreset,
  tickBurst,
} from "@/features/battle/scene/fx-presets";
import {
  CAMERA_PITCH,
  HERO_FIGURE_Y,
  heroX,
  laneZ,
  squareX,
  worldOf,
} from "@/features/battle/scene/layout";
import type {
  Billboard,
  BurstName,
  Particle,
} from "@/features/battle/scene/particles";
import {
  BURST_DURATION,
  slotParticle,
} from "@/features/battle/scene/particles";

/** A short visual effect. `start` is in scene seconds. */
export type Fx =
  | {
      readonly kind: "number";
      readonly text: string;
      readonly damageType: DamageType | "heal" | "block";
      readonly crit: boolean;
      readonly x: number;
      readonly z: number;
      readonly height: number;
      readonly start: number;
    }
  | {
      readonly kind: "ring";
      readonly color: string;
      readonly x: number;
      readonly z: number;
      readonly start: number;
    }
  | {
      /**
       * A particle burst when a Status starts or deals damage, when an
       * attack hits, when a Unit moves or is Pushed, is healed or gets
       * Armor, or when a Hero casts a Skill Card (web ADR-0009).
       */
      readonly kind: "particles";
      readonly burst: BurstName;
      /** 1, or larger for a Crit. */
      readonly scale: number;
      /** True for a Unit that goes to the left: the dust is mirrored. */
      readonly mirror?: boolean;
      readonly x: number;
      readonly z: number;
      readonly height: number;
      readonly start: number;
      /** In scene seconds. Speed ×2 halves it. */
      readonly duration: number;
    }
  | ({ readonly kind: "billboard" } & Billboard);

/** Active effects. The playback driver adds them. The effects layer removes them when they end. */
export const fxList: Fx[] = [];

const FX_LIFETIME = { number: 1.1, ring: 0.7 } as const;

/** How long an effect plays, in scene seconds. */
export const fxLifetime = (fx: Fx): number =>
  fx.kind === "number" || fx.kind === "ring"
    ? FX_LIFETIME[fx.kind]
    : fx.duration;

type Spot = NonNullable<ReturnType<typeof worldOf>>;

/** A particle burst at the middle of a figure. `start` and `duration` are in scene seconds. */
const burstFx = (
  burst: BurstName,
  at: Spot,
  start: number,
  duration: number,
  scale = 1
): Fx => ({
  kind: "particles",
  burst,
  scale,
  ...at,
  height: at.height * 0.5,
  start,
  duration,
});

/** The life of a preset effect that does not change the time of its event, in scene seconds. */
const presetSeconds = (preset: FxPresetKey, speed: BattleSpeed): number =>
  FX_PRESETS[preset].time / 1000 / speed;

/** The heal or Armor impact on a Unit. */
const impactFx = (
  preset: ImpactPresetKey,
  at: Spot,
  start: number,
  speed: BattleSpeed
): Fx => burstFx(preset, at, start, presetSeconds(preset, speed));

/** The time of an event, in scene seconds. */
const eventSeconds = (
  event: BattleEvent,
  speed: BattleSpeed,
  before: BattleView
): number => eventDuration(event, speed, before) / 1000;

/**
 * The slash of a melee attack starts at this progress, when the lunge
 * reaches the target. The lunge is fully forward at 0.55 (`unit-pose.ts`).
 */
const MELEE_IMPACT = 0.5;

/** The slash at the target of a melee attack, from the impact to the end of the attack. */
const meleeSlash = (
  event: Extract<BattleEvent, { readonly _tag: "UnitAttacked" }>,
  before: BattleView,
  time: number,
  speed: BattleSpeed
): Fx[] => {
  const attacker = before.units.find((unit) => unit.id === event.unitId);
  const at = worldOf(before, event.target);
  if (event.ranged || !attacker || !at) {
    return [];
  }
  const duration = eventSeconds(event, speed, before);
  const preset = FX_PRESETS.melee;
  return [
    {
      kind: "billboard",
      slot: preset.main,
      color: preset.color ?? DAMAGE_COLORS[attacker.damageType],
      size: preset.size,
      mirror: attacker.owner === "enemy",
      x: at.x,
      z: at.z,
      height: at.height * 0.55,
      start: time + duration * MELEE_IMPACT,
      duration: duration * (1 - MELEE_IMPACT),
    },
  ];
};

/**
 * The damage number and the hit on the target. A Burn or a Poison hit shows
 * the burst of its Status.
 */
const damageFx = (
  event: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>,
  before: BattleView,
  time: number,
  speed: BattleSpeed
): Fx[] => {
  const at = worldOf(before, event.target);
  if (!at) {
    return [];
  }
  const number: Fx = {
    kind: "number",
    text: event.amount === 0 ? "0" : `-${event.amount}`,
    damageType: event.blocked ? "block" : event.damageType,
    crit: event.crit,
    ...at,
    start: time,
  };
  const tick = tickBurst(event);
  return [
    number,
    tick
      ? burstFx(tick, at, time, BURST_DURATION / speed)
      : burstFx(
          hitPreset(event),
          at,
          time,
          eventSeconds(event, speed, before),
          event.crit ? CRIT_SCALE : 1
        ),
  ];
};

/** The progress of a Movement or a push when the Unit has gone `distance` (0 to 1) of the way. */
const arrival = (
  event: Extract<
    BattleEvent,
    { readonly _tag: "UnitMoved" } | { readonly _tag: "UnitPushed" }
  >,
  distance: number
): number => (event._tag === "UnitMoved" ? distance : pushArrival(distance));

/** The height of the dust at the feet of a Unit. */
const FEET = 0.12;

/**
 * A dust puff at the feet of a Unit that moves or is Pushed, at each Square
 * that it goes to. Each puff starts when the Unit gets to its Square: a
 * Movement goes at a steady speed, and a push slows down at the end
 * (`battle-timeline.ts`). A Flying Unit makes no dust. The dust does not
 * change the time of the event.
 */
const dustPuffs = (
  event: Extract<
    BattleEvent,
    { readonly _tag: "UnitMoved" } | { readonly _tag: "UnitPushed" }
  >,
  before: BattleView,
  time: number,
  speed: BattleSpeed
): Fx[] => {
  const unit = before.units.find((candidate) => candidate.id === event.unitId);
  const squares = Math.abs(event.to - event.from);
  if (!unit || unit.flying || squares === 0) {
    return [];
  }
  const preset = event._tag === "UnitMoved" ? "move" : "push";
  const step = Math.sign(event.to - event.from);
  const seconds = eventSeconds(event, speed, before);
  return Array.from({ length: squares }, (_, index) => ({
    kind: "particles",
    burst: preset,
    scale: 1,
    mirror: step < 0,
    x: squareX(event.from + step * (index + 1)),
    z: laneZ(event.lane, before.lanes),
    height: FEET,
    start: time + seconds * arrival(event, (index + 1) / squares),
    duration: presetSeconds(preset, speed),
  }));
};

/** The height of a rune ring on the ground. */
const RUNE_RING_HEIGHT = 0.04;

/**
 * The wind-up lasts to this progress of its cast. It fades while the spell
 * bolt leaves at `BOLT_START`.
 */
const WINDUP_END = 0.6;

/**
 * The wind-up of a Skill Card cast: a rune ring at the feet of the caster
 * Hero, and particles of the Class of the Hero. It fills the first part of
 * the cast, so a longer enemy cast has a longer wind-up.
 */
const windup = (
  event: Extract<BattleEvent, { readonly _tag: "CardPlayed" }>,
  before: BattleView,
  time: number,
  speed: BattleSpeed
): Fx => ({
  kind: "particles",
  burst: `windup:${before.sides[event.side].hero.classId}`,
  scale: 1,
  x: heroX(event.side),
  z: 0,
  height: RUNE_RING_HEIGHT,
  start: time,
  duration: eventSeconds(event, speed, before) * WINDUP_END,
});

/**
 * The effects that start with an event. `before` is the view before it,
 * `after` the view after it. Speed ×2 halves the effect times.
 */
export const fxForEvent = (
  event: BattleEvent,
  before: BattleView,
  after: BattleView,
  time: number,
  speed: BattleSpeed
): Fx[] => {
  switch (event._tag) {
    case "UnitAttacked": {
      return meleeSlash(event, before, time, speed);
    }
    case "UnitMoved":
    case "UnitPushed": {
      return dustPuffs(event, before, time, speed);
    }
    case "DamageDealt": {
      return damageFx(event, before, time, speed);
    }
    case "StatusApplied": {
      const at = worldOf(after, { _tag: "Unit", unitId: event.unitId });
      return at
        ? [burstFx(event.status, at, time, BURST_DURATION / speed)]
        : [];
    }
    case "UnitHealed": {
      const at = worldOf(after, { _tag: "Unit", unitId: event.unitId });
      return at && event.amount > 0
        ? [
            {
              kind: "number",
              text: `+${event.amount}`,
              damageType: "heal",
              crit: false,
              ...at,
              start: time,
            },
            impactFx("heal", at, time, speed),
          ]
        : [];
    }
    case "UnitSummoned": {
      return [
        {
          kind: "ring",
          color: event.unit.owner === "player" ? "#ffd56b" : "#ff7a6b",
          x: squareX(event.unit.position),
          z: laneZ(event.unit.lane, after.lanes),
          start: time,
        },
      ];
    }
    case "CardPlayed": {
      return getCard(event.card.cardId).kind === "skill"
        ? [windup(event, before, time, speed)]
        : [];
    }
    case "ArmorGained": {
      const at = worldOf(after, { _tag: "Unit", unitId: event.unitId });
      return at ? [impactFx("armor", at, time, speed)] : [];
    }
    default: {
      return [];
    }
  }
};

type FxOf<Kind extends Fx["kind"]> = Extract<Fx, { readonly kind: Kind }>;

const ofKind = <Kind extends Fx["kind"]>(
  fxs: readonly Fx[],
  kind: Kind,
  size: number
): FxOf<Kind>[] =>
  fxs.filter((fx): fx is FxOf<Kind> => fx.kind === kind).slice(0, size);

/**
 * The effects that get an object from each pool, oldest first. A pool holds
 * `size` effects of one kind. Newer effects wait until older ones end.
 */
export const fxByKind = (fxs: readonly Fx[], size: number) => ({
  number: ofKind(fxs, "number", size),
  ring: ofKind(fxs, "ring", size),
});

interface Projectile {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly color: string;
  /** 1 for an arrow or a bolt of a Unit. A spell is larger. */
  readonly size: number;
}

/** The middle of the Squares that a cast hits, or `null` for a cast with no target. */
const castCenter = (
  cast: Cast,
  lanes: number
): { readonly x: number; readonly z: number } | null => {
  const squares = castSquares(cast);
  const [first] = squares;
  const last = squares.at(-1);
  if (!first || !last) {
    return null;
  }
  return {
    x: (squareX(first.position) + squareX(last.position)) / 2,
    z: laneZ(first.lane, lanes),
  };
};

/** The spell bolt flies in the second half of the cast reveal. */
const BOLT_START = 0.5;
const BOLT_END = 0.92;

/**
 * Where the spell bolt of a Skill Card cast is now: from the caster Hero to
 * the middle of the target Squares. `null` before and after its flight.
 */
export const spellBoltAt = (
  cast: Cast | null,
  lanes: number,
  progress: number
): Projectile | null => {
  if (cast?.phase !== "reveal") {
    return null;
  }
  const to = castCenter(cast, lanes);
  const flight = (progress - BOLT_START) / (BOLT_END - BOLT_START);
  if (!to || flight < 0 || flight > 1) {
    return null;
  }
  // Fast at the end, as a thrown spell.
  const eased = flight * flight;
  const fromX = heroX(cast.side);
  const fromY = HERO_FIGURE_Y + 0.6;
  return {
    x: fromX + (to.x - fromX) * eased,
    y: fromY + (0.5 - fromY) * eased + Math.sin(eased * Math.PI) * 1.2,
    z: to.z * eased,
    color: effectColor(cast.skill.effect),
    size: 2.2 - eased * 0.6,
  };
};

/** The projectile of a ranged attack leaves at this progress. */
const FLIGHT_START = 0.2;

/**
 * Where the projectile of a ranged attack is now, and its color, or `null`
 * when no projectile flies (art direction 2.1). It arrives at the end of the
 * attack, so the hit waits for it.
 */
export const projectileAt = (
  current: PlayingEvent | null | undefined,
  progress: number
): Projectile | null => {
  if (current?.event._tag !== "UnitAttacked" || !current.event.ranged) {
    return null;
  }
  const { before, event } = current;
  const from = worldOf(before, { _tag: "Unit", unitId: event.unitId });
  const to = worldOf(before, event.target);
  const attacker = before.units.find((unit) => unit.id === event.unitId);
  const flight = (progress - FLIGHT_START) / (1 - FLIGHT_START);
  if (!from || !to || !attacker || flight < 0) {
    return null;
  }
  return {
    x: from.x + (to.x - from.x) * flight,
    y: 0.8 + Math.sin(flight * Math.PI) * 0.9,
    z: from.z + (to.z - from.z) * flight,
    color: DAMAGE_COLORS[attacker.damageType],
    size: 1,
  };
};

/** The trail shows where the projectile was in this part of the attack. */
const TRAIL_SPAN = 0.12;

/** The camera looks down at this angle, so a world height is shorter on the screen. */
const PITCH = (CAMERA_PITCH * Math.PI) / 180;

/**
 * The atlas quads of a projectile (web ADR-0009): a glow head at `head`, and a
 * trail streak from `tail` to the head. With no `tail`, only the head flies.
 * The `size` of the projectile scales the images of the ranged preset.
 */
const flightQuads = (head: Projectile, tail: Projectile | null): Particle[] => {
  const preset = FX_PRESETS.ranged;
  const size = preset.size * head.size;
  const glow = slotParticle(preset.main, {
    x: head.x,
    y: head.y,
    z: head.z,
    size,
    stretch: 1,
    rotation: 0,
    color: head.color,
    opacity: 1,
    burst: true,
  });
  if (!preset.trail || !tail) {
    return [glow];
  }
  // The direction of the flight on the screen. The camera has no yaw.
  const across = head.x - tail.x;
  const up =
    (head.y - tail.y) * Math.cos(PITCH) - (head.z - tail.z) * Math.sin(PITCH);
  const width = size * 0.45;
  const length = Math.hypot(across, up) + width;
  return [
    slotParticle(preset.trail, {
      x: (head.x + tail.x) / 2,
      y: (head.y + tail.y) / 2,
      z: (head.z + tail.z) / 2,
      size: width,
      stretch: length / width,
      rotation: Math.atan2(up, across),
      color: head.color,
      opacity: 0.85,
      burst: true,
    }),
    glow,
  ];
};

/**
 * The atlas quads of a ranged projectile now. With reduced motion, only the
 * head flies.
 */
export const projectileParticles = (
  current: PlayingEvent | null | undefined,
  progress: number,
  reducedMotion = false
): Particle[] => {
  const head = projectileAt(current, progress);
  if (!head) {
    return [];
  }
  const tail = reducedMotion
    ? null
    : projectileAt(current, Math.max(progress - TRAIL_SPAN, FLIGHT_START));
  return flightQuads(head, tail);
};

/**
 * The atlas quads of the spell bolt of a Skill Card cast now, in the color
 * of its effect. With reduced motion, the bolt is hidden: the cast shows only
 * its card and its target Squares.
 */
export const spellBoltParticles = (
  cast: Cast | null,
  lanes: number,
  progress: number,
  reducedMotion = false
): Particle[] => {
  const head = reducedMotion ? null : spellBoltAt(cast, lanes, progress);
  if (!head) {
    return [];
  }
  return flightQuads(
    head,
    spellBoltAt(cast, lanes, Math.max(progress - TRAIL_SPAN, BOLT_START))
  );
};
