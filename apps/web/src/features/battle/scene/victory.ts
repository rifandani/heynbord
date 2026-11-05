import type { BattleEvent, ClassId } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";

import type { BattleSession } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";

/**
 * The victory sequence of a won Battle. It is presentation only: the rules
 * result is already final, and nothing here changes it.
 *
 * The time `t` is in seconds at speed ×1 from the start of `BattleEnded`. At
 * speed ×2 the same beats play in half the time. The result panel opens when
 * `BattleEnded` ends (t = `apex`), so the sequence fits in the time that the
 * Battle already took, and it adds only the short hit-stop of the last hit.
 *
 * 1. The last hit: the clock almost stops for a beat (hit-stop), and a warm
 *    flash shows. The camera pushes in a little on the defeated enemy.
 * 2. Relief: the enemy dissolves, the HUD goes away, and the Player Hero
 *    lets out a breath (the crouch of its victory clip).
 * 3. Celebration: the Hero raises its sword with a flourish of its Class,
 *    confetti bursts from the sword, and the result panel stamps in at the
 *    same moment. The Units of the Player answer in a wave, from the Hero out.
 * 4. The camera moves across the Board to the Hero, and the light goes warm.
 * 5. Victory idle: the Hero holds the pose and its banner moves in the wind,
 *    while the Player reads the rewards.
 */
export const VICTORY = {
  /** The hit-stop of the last hit, in real seconds (not ×speed). */
  hitStop: { hold: 0.16, release: 0.4, floor: 0.06 },
  /** The flash of the last hit, in real seconds. */
  flash: { rise: 0.04, fall: 0.26, strength: 0.42 },
  /** The Player Hero breathes out: the clip goes to its crouch. */
  exhale: 0.42,
  /** The sword goes up from here... */
  thrust: 0.6,
  /** ...and is at its highest here. The result panel stamps in. */
  apex: 0.9,
  /** The clip settles into the held pose. */
  settle: 1.5,
  /** One sway of the banner in the victory idle, there and back. */
  idleLoop: 2.6,
  /** The enemy dissolves in this window. */
  dissolve: { start: 0, end: 0.85 },
  /** Each enemy Unit fades after the one nearer to the enemy Hero. */
  enemyUnit: { start: 0.08, stagger: 0.045, fade: 0.6 },
  /** The Player Units cheer after the sword goes up, from the Hero out. */
  cheer: { start: 0.68, stagger: 0.06, hop: 0.3, hops: 2, height: 0.24 },
  /** A cheering Unit turns this far to the camera, in radians. */
  cheerTurn: 0.7,
  /** The camera moves from the enemy to the Hero in this window. */
  pan: { start: 0.05, end: 1.6 },
  /** The light goes warm in this window. */
  light: { start: 0.1, end: 1.4 },
  /** After Skip, the sequence starts at the sword: no time to wait. */
  skipFrom: 0.6,
} as const;

/** The clip times of the victory clip (36 frames, `hero_clips.py`). */
const CLIP = { crouch: 8 / 36, raised: 16 / 36, held: 22 / 36, end: 35 / 36 };

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** 0 to 1 in the window from `start` to `end`. */
const within = (t: number, start: number, end: number): number =>
  clamp01((t - start) / Math.max(1e-6, end - start));

const easeOut = (u: number): number => 1 - (1 - u) ** 3;
const easeInOut = (u: number): number =>
  u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;

/** True when the Player won `view`. */
const playerWon = (view: BattleView): boolean =>
  view.result?.winner === "player";

/**
 * True when `event` is the last hit of a won Battle: damage to an enemy Hero
 * after which no enemy Hero has HP. `view` is the view after the event.
 */
export const isFinalBlow = (
  event: BattleEvent | undefined,
  view: BattleView
): boolean =>
  event?._tag === "DamageDealt" &&
  event.target._tag === "Hero" &&
  event.target.side === "enemy" &&
  view.sides.enemy.heroes.every((hero) => hero.hp <= 0);

/**
 * The clock scale of the hit-stop, `age` real seconds after the last hit. The
 * clock almost stops, then comes back to full speed with an ease.
 */
export const hitStopScale = (age: number | null): number => {
  if (age === null) {
    return 1;
  }
  const { hold, release, floor } = VICTORY.hitStop;
  if (age < hold) {
    return floor;
  }
  return floor + (1 - floor) * easeInOut(within(age, hold, hold + release));
};

/** The strength of the flash of the last hit, 0 to 1, `age` real seconds after it. */
export const flashAt = (age: number | null): number => {
  if (age === null) {
    return 0;
  }
  const { rise, fall, strength } = VICTORY.flash;
  if (age < rise) {
    return strength * (age / rise);
  }
  return strength * (1 - easeOut(within(age, rise, rise + fall)));
};

/**
 * The phase of the victory clip at `t`. The breath out is slow, the sword
 * goes up fast, and then the pose holds while the banner sways, there and
 * back, so the idle loops with no jump. With reduced motion the idle holds.
 */
export const heroVictoryPhase = (t: number, reducedMotion: boolean): number => {
  if (t < VICTORY.exhale) {
    return CLIP.crouch * easeInOut(within(t, 0, VICTORY.exhale));
  }
  if (t < VICTORY.thrust) {
    return CLIP.crouch;
  }
  if (t < VICTORY.apex) {
    return (
      CLIP.crouch +
      (CLIP.raised - CLIP.crouch) *
        easeOut(within(t, VICTORY.thrust, VICTORY.apex))
    );
  }
  if (t < VICTORY.settle || reducedMotion) {
    return (
      CLIP.raised +
      (CLIP.held - CLIP.raised) *
        easeInOut(within(t, VICTORY.apex, VICTORY.settle))
    );
  }
  const loop = (t - VICTORY.settle) / VICTORY.idleLoop;
  return (
    CLIP.held +
    (CLIP.end - CLIP.held) * (0.5 - 0.5 * Math.cos(2 * Math.PI * loop))
  );
};

/** How the Hero figure moves on top of its clip. */
export interface Flourish {
  /** Up, in world units. */
  readonly lift: number;
  /** Around its vertical axis, in radians. */
  readonly spin: number;
  /** Back, away from the Board, in radians. */
  readonly lean: number;
}

const STILL: Flourish = { lift: 0, spin: 0, lean: 0 };

/**
 * The flourish of each Class when the sword goes up, so that the four Heroes
 * do not celebrate the same way. The Warrior jumps. The Ranger turns once on
 * the spot. The Mage rises and floats, calm. The Priest rises a little and
 * looks up to the sky.
 */
export const heroFlourish = (
  classId: ClassId,
  t: number,
  reducedMotion: boolean
): Flourish => {
  if (reducedMotion || t <= VICTORY.thrust - 0.12) {
    return STILL;
  }
  switch (classId) {
    case "warrior": {
      const jump = within(t, VICTORY.thrust, VICTORY.thrust + 0.42);
      return { lift: 0.2 * Math.sin(Math.PI * jump), spin: 0, lean: 0 };
    }
    case "ranger": {
      const turn = within(t, VICTORY.thrust - 0.12, VICTORY.apex + 0.12);
      return {
        lift: 0.06 * Math.sin(Math.PI * turn),
        spin: 2 * Math.PI * easeInOut(turn),
        lean: 0,
      };
    }
    case "mage": {
      const rise = easeInOut(within(t, VICTORY.thrust, VICTORY.settle));
      const float =
        t > VICTORY.settle ? Math.sin((t - VICTORY.settle) * 1.3) * 0.035 : 0;
      return { lift: 0.22 * rise + float * rise, spin: 0, lean: 0 };
    }
    case "priest": {
      const rise = easeOut(within(t, VICTORY.thrust, VICTORY.settle));
      return { lift: 0.08 * rise, spin: 0, lean: 0.07 * rise };
    }
    default: {
      return STILL;
    }
  }
};

/**
 * How a defeated enemy shows: its fade, its grey, its sink, its lean back and
 * how much smaller it gets.
 */
export interface Dissolve {
  readonly opacity: number;
  readonly grey: number;
  readonly sink: number;
  readonly lean: number;
  readonly scale: number;
}

/**
 * The enemy first goes grey, then fades. `fadeFrom` is the part of the window
 * before the fade starts: a Unit Model shows its ink outline through a half
 * transparent body, so a Unit fades late and fast.
 */
const dissolveAt = (
  u: number,
  reducedMotion: boolean,
  fadeFrom = 0.25
): Dissolve => {
  const grey = easeOut(clamp01(u * 2.2));
  const fade = easeInOut(clamp01((u - fadeFrom) / (1 - fadeFrom)));
  return {
    opacity: 1 - fade,
    grey,
    sink: reducedMotion ? 0 : 0.35 * easeInOut(u),
    lean: reducedMotion ? 0 : 0.45 * easeOut(u),
    scale: reducedMotion ? 1 : 1 - 0.28 * easeInOut(u),
  };
};

/** The enemy Hero dissolves into light. */
export const enemyHeroDissolve = (
  t: number,
  reducedMotion: boolean
): Dissolve =>
  dissolveAt(
    within(t, VICTORY.dissolve.start, VICTORY.dissolve.end),
    reducedMotion
  );

/**
 * An enemy Unit fades after its Hero falls, the Unit nearest to the enemy
 * Hero first, so the defeat goes across the Board like a wave.
 */
export const enemyUnitDissolve = (
  t: number,
  position: number,
  reducedMotion: boolean
): Dissolve => {
  const { start, stagger, fade } = VICTORY.enemyUnit;
  const begin = start + stagger * (LANE_LENGTH - 1 - position);
  const u = within(t, begin, begin + fade);
  const shown = dissolveAt(u, reducedMotion, 0.6);
  // A Unit does not lean back: it sinks into the ground.
  return { ...shown, lean: 0 };
};

/** How a Player Unit cheers. */
export interface Cheer {
  readonly hop: number;
  /** Toward the camera, in radians. */
  readonly turn: number;
}

/**
 * A Player Unit answers the raised sword: it turns to the camera and hops
 * two times. The Unit nearest to the Hero goes first, so the cheer goes out
 * from the Hero like a wave. With reduced motion it stays still.
 */
export const unitCheer = (
  t: number,
  position: number,
  reducedMotion: boolean
): Cheer => {
  if (reducedMotion) {
    return { hop: 0, turn: 0 };
  }
  const { start, stagger, hop, hops, height } = VICTORY.cheer;
  const begin = start + stagger * Math.max(0, position);
  const turn =
    VICTORY.cheerTurn * easeOut(within(t, begin - 0.1, begin + 0.25));
  const beats = (t - begin) / hop;
  if (beats <= 0 || beats >= hops) {
    return { hop: 0, turn };
  }
  // The second hop is lower than the first.
  const fall = beats < 1 ? 1 : 0.6;
  return { hop: height * fall * Math.sin(Math.PI * (beats % 1)), turn };
};

/** How far the camera has moved from the enemy to the Hero, 0 to 1. */
export const panAt = (t: number): number =>
  easeInOut(within(t, VICTORY.pan.start, VICTORY.pan.end));

/** How warm the light is, 0 to 1. */
export const lightAt = (t: number): number =>
  easeInOut(within(t, VICTORY.light.start, VICTORY.light.end));

/** The victory of the Live Battle: its Battle, and when it started on the scene clock. */
export interface VictoryStart {
  readonly options: BattleSession["options"];
  /** On the scene clock, in seconds. */
  readonly start: number;
  readonly speed: number;
}

/**
 * The victory that starts in `session` at scene time `now`, or `null`. A
 * victory that plays `BattleEnded` starts at the start of that event. A
 * victory after Skip (or a finished Battle that the QA states open) starts
 * at the sword.
 */
export const victoryStartOf = (
  session: BattleSession,
  now: number
): VictoryStart | null => {
  if (session.watching || !playerWon(session.view)) {
    return null;
  }
  const { current, speed } = session;
  const into =
    current?.event._tag === "BattleEnded"
      ? current.duration > 0
        ? (session.elapsed / current.duration) * (VICTORY.apex / speed)
        : 0
      : VICTORY.skipFrom / speed;
  return { options: session.options, start: now - into, speed };
};

/** The victory time `t` of `victory` at scene time `now`. */
export const victoryTimeAt = (victory: VictoryStart, now: number): number =>
  Math.max(0, (now - victory.start) * victory.speed);
