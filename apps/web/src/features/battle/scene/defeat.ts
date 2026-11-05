import type { BattleEvent } from "@workspace/rules";

import type { BattleSession } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";

/**
 * The defeat sequence of a lost Battle. It is presentation only: the rules
 * result is already final, and nothing here changes it.
 *
 * The time `t` is in real seconds from the start of `BattleEnded`. It does
 * not follow the Battle speed: the Battle is over, and the loss needs the
 * same few seconds at speed ×1 and ×3. A key or a click opens the result
 * panel at once (`DEFEAT.panel` is the latest time that it waits).
 *
 * 1. The interruption: the last hit lands on the Player Hero. The clock
 *    almost stops on the recoil (hit-stop), the edges of the screen pulse,
 *    the camera punches in a little, and a heavy hit sounds. The HUD goes.
 * 2. The collapse: the Hero staggers, the tension goes out of it, and it
 *    drops to one knee with its sword point in the ground. The fall speeds
 *    up, as weight does. On the knee: a thud, a puff of dust and a bump of
 *    the camera.
 * 3. The aftermath: the Hero sags forward a little more and then holds,
 *    with a slow breath. Its Side ring goes out. The Player Units droop, from
 *    the Hero out. The light goes cool, the music goes muffled and fades, a
 *    ring stays in the silence, and then the defeat sting plays.
 * 4. The camera moves slowly to the Hero, and keeps it small in the frame,
 *    with space above it. The result panel opens after the loss sinks in.
 */
export const DEFEAT = {
  /** The hit-stop of the last hit, in real seconds. Heavier than a win. */
  hitStop: { hold: 0.24, release: 0.55, floor: 0.04 },
  /** The pulse at the edges of the screen at the last hit, in real seconds. */
  pulse: { rise: 0.03, fall: 0.7, strength: 0.62 },
  /** The Hero staggers on its recoil until here... */
  stagger: 0.42,
  /** ...then drops, faster and faster, and its knee hits the ground here. */
  impact: 0.98,
  /** The squash of the body on the knee, after the impact. */
  squash: { depth: 0.04, length: 0.32 },
  /** The Hero sags forward until here, then holds and breathes. */
  settle: 1.75,
  /** One slow breath of the held Hero. */
  breath: 3.6,
  /** The Side ring of the Hero goes out in this window. */
  ring: { start: 0.15, end: 1.4 },
  /** The light goes cool and a little dim in this window. */
  light: { start: 0.2, end: 2.4 },
  /** Each Player Unit droops after the one nearer to the Hero. */
  unit: { start: 0.8, stagger: 0.07, droop: 0.6 },
  /** The camera moves to the Hero in this window: slower than a win. */
  pan: { start: 0.1, end: 3.4 },
  /** The result panel opens here, if no key or click opened it first. */
  panel: 2.9,
  /** After Skip, the sequence starts with the Hero down: no time to wait. */
  skipFrom: 2.2,
} as const;

/** The clip times of the defeat clip (36 frames, `hero_clips.py`). */
const CLIP = { recoil: 6 / 36, down: 24 / 36 };

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** 0 to 1 in the window from `start` to `end`. */
const within = (t: number, start: number, end: number): number => {
  if (t <= start) {
    return 0;
  }
  if (t >= end) {
    return 1;
  }
  return (t - start) / (end - start);
};

const easeOut = (u: number): number => 1 - (1 - u) ** 3;
const easeIn = (u: number): number => u ** 2.4;
const easeInOut = (u: number): number =>
  u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;

/** True when the Player lost `view`. */
const playerLost = (view: BattleView): boolean =>
  view.result?.winner === "enemy";

/**
 * True when `event` is the last hit of a lost Battle: damage to a Player Hero
 * after which no Player Hero has HP. `view` is the view after the event.
 */
export const isLosingBlow = (
  event: BattleEvent | undefined,
  view: BattleView
): boolean =>
  event?._tag === "DamageDealt" &&
  event.target._tag === "Hero" &&
  event.target.side === "player" &&
  view.sides.player.heroes.every((hero) => hero.hp <= 0);

/**
 * The clock scale of the hit-stop, `age` real seconds after the last hit of
 * a lost Battle. The clock almost stops on the recoil, then comes back.
 */
export const defeatHitStopScale = (age: number | null): number => {
  if (age === null) {
    return 1;
  }
  const { hold, release, floor } = DEFEAT.hitStop;
  if (age < hold) {
    return floor;
  }
  return floor + (1 - floor) * easeInOut(within(age, hold, hold + release));
};

/** The strength of the edge pulse of the last hit, 0 to 1, `age` real seconds after it. */
export const pulseAt = (age: number | null): number => {
  if (age === null) {
    return 0;
  }
  const { rise, fall, strength } = DEFEAT.pulse;
  if (age < rise) {
    return strength * (age / rise);
  }
  return strength * (1 - easeOut(within(age, rise, rise + fall)));
};

/**
 * The phase of the defeat clip in the last hit: the recoil of the clip, in
 * place of the normal hurt, so the Player sees that this hit is not like the
 * others. `progress` is the progress of the hit, 0 to 1. The recoil snaps
 * in at the very start, so the hit-stop holds the Hero in it.
 */
export const heroLosingBlowPhase = (progress: number): number =>
  CLIP.recoil * easeOut(clamp01(progress / 0.1));

/**
 * The phase of the defeat clip at `t`. The Hero holds its recoil while it
 * staggers, then the drop to the knee speeds up, as a fall does, and the
 * knee lands at `DEFEAT.impact`. The clip then holds its last pose.
 */
export const heroDefeatPhase = (t: number): number => {
  if (t < DEFEAT.stagger) {
    return CLIP.recoil;
  }
  if (t < DEFEAT.impact) {
    return (
      CLIP.recoil +
      (CLIP.down - CLIP.recoil) *
        easeIn(within(t, DEFEAT.stagger, DEFEAT.impact))
    );
  }
  return CLIP.down + (1 - CLIP.down) * within(t, DEFEAT.impact, DEFEAT.settle);
};

/** How the Hero figure moves on top of its clip. */
export interface Slump {
  /** Up, in world units: negative is down. */
  readonly lift: number;
  /** Toward the Board, in radians: negative is back, away from it. */
  readonly sway: number;
  /** Forward, toward the camera, in radians: the shoulders go down. */
  readonly bow: number;
}

const STILL: Slump = { lift: 0, sway: 0, bow: 0 };

/**
 * The weight of the Hero on top of its clip. It sways back on the recoil,
 * squashes down a little on the knee, sags forward as the tension goes, and
 * then breathes, slow. With reduced motion, only the clip plays.
 */
export const heroSlump = (t: number, reducedMotion: boolean): Slump => {
  if (reducedMotion) {
    return STILL;
  }
  // The stagger: a small sway back, away from the hit, then it gives.
  const reel = -0.08 * Math.sin(Math.PI * within(t, 0, DEFEAT.stagger + 0.12));
  const after = t - DEFEAT.impact;
  const squash =
    after > 0 && after < DEFEAT.squash.length
      ? -DEFEAT.squash.depth *
        Math.sin(Math.PI * (after / DEFEAT.squash.length)) *
        (1 - after / DEFEAT.squash.length)
      : 0;
  const sag = easeOut(within(t, DEFEAT.impact, DEFEAT.settle));
  const breath =
    t > DEFEAT.settle
      ? Math.sin((2 * Math.PI * (t - DEFEAT.settle)) / DEFEAT.breath)
      : 0;
  return {
    lift: squash - 0.02 * sag + 0.006 * breath,
    sway: reel + 0.03 * sag,
    bow: 0.09 * sag - 0.014 * breath,
  };
};

/** How much of the Side ring of the Player Hero still shows, 0 to 1. */
export const ringLightAt = (t: number): number =>
  1 - 0.88 * easeInOut(within(t, DEFEAT.ring.start, DEFEAT.ring.end));

/** How cool and dim the light is, 0 to 1. */
export const dimAt = (t: number): number =>
  easeInOut(within(t, DEFEAT.light.start, DEFEAT.light.end));

/** How far the camera has moved to the Hero, 0 to 1. */
export const defeatPanAt = (t: number): number =>
  easeInOut(within(t, DEFEAT.pan.start, DEFEAT.pan.end));

/** How a Player Unit droops: down, a little smaller, and grey. */
export interface Droop {
  readonly sink: number;
  readonly scale: number;
  /** How far it goes to the cool grey of the loss, 0 to 1. */
  readonly grey: number;
}

/**
 * A Player Unit loses heart after its Hero falls: it goes grey, sinks a
 * little and gets a little smaller. The Unit nearest to the Hero goes
 * first, so it goes out from the Hero like a wave. With reduced motion, only
 * the grey shows. Its Attack and HP stay as they are.
 */
export const unitDroop = (
  t: number,
  position: number,
  reducedMotion: boolean
): Droop => {
  const { start, stagger, droop } = DEFEAT.unit;
  const begin = start + stagger * Math.max(0, position);
  const u = easeInOut(within(t, begin, begin + droop));
  return {
    sink: reducedMotion ? 0 : 0.07 * u,
    scale: reducedMotion ? 1 : 1 - 0.04 * u,
    grey: u,
  };
};

/** The defeat of the Live Battle: its Battle, and when it started on the scene clock. */
export interface DefeatStart {
  readonly options: BattleSession["options"];
  /** On the scene clock, in seconds. */
  readonly start: number;
}

/**
 * The defeat that starts in `session` at scene time `now`, or `null`. A
 * defeat that plays `BattleEnded` starts at the start of that event. A
 * defeat after Skip (or a finished Battle that the QA states open) starts
 * with the Hero already down.
 */
export const defeatStartOf = (
  session: BattleSession,
  now: number
): DefeatStart | null => {
  if (session.watching || !playerLost(session.view)) {
    return null;
  }
  const { current } = session;
  const into =
    current?.event._tag === "BattleEnded"
      ? session.elapsed / 1000
      : DEFEAT.skipFrom;
  return { options: session.options, start: now - into };
};

/** The defeat time `t` of `defeat` at scene time `now`. */
export const defeatTimeAt = (defeat: DefeatStart, now: number): number =>
  Math.max(0, now - defeat.start);
