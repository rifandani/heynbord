import type { BattleEvent, HeroRef } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import { hasManyHeroes } from "@/features/battle/battle-view";
import { effectColor } from "@/features/battle/cast";
import { frontZ, HERO_FIGURE_Y, heroX } from "@/features/battle/scene/layout";
import { RALLY_TINT } from "@/features/battle/tokens";

export interface HeroPose {
  readonly x: number;
  readonly y: number;
  /** The middle of the Front of the Hero (GDD 11.2). */
  readonly z: number;
  /** How far the figure falls back, in radians, while the Hero is Defeated. */
  readonly lean: number;
  /** 1 is in full view. A Defeated Boss fades out, and then it is gone. */
  readonly opacity: number;
  /** How much red the figure shows while it is hit, or `null` when it is not hit. */
  readonly hitTint: number | null;
  /**
   * The effect color and its strength while the Hero casts a Skill Card, or
   * the gold of a Boss Rule while one activates, or `null`.
   */
  readonly cast: { readonly color: string; readonly amount: number } | null;
}

/** A Boss Rule flashes the Boss in Ready Gold (DESIGN.md). */
const BOSS_RULE_COLOR = RALLY_TINT;

/** The angle of a Defeated Hero at the end of its fall. */
const FALL_ANGLE = 1.25;

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

const isHero = (ref: HeroRef, other: HeroRef): boolean =>
  ref.side === other.side && ref.hero === other.hero;

/** The effect color of the Skill Card that the Hero `ref` casts in `event`, or `null`. */
const castColor = (ref: HeroRef, event: BattleEvent | null): string | null => {
  if (event?._tag !== "CardPlayed" || !isHero(ref, event.hero)) {
    return null;
  }
  const definition = getCard(event.card.cardId);
  return definition.kind === "skill" ? effectColor(definition.effect) : null;
};

/** The color that the Hero glows in now: its cast, or its Boss Rule. */
const glowColor = (ref: HeroRef, event: BattleEvent | null): string | null =>
  event?._tag === "BossRuleActivated" && isHero(ref, event.hero)
    ? BOSS_RULE_COLOR
    : castColor(ref, event);

/**
 * The z of the Hero now. While its Front grows (`FrontMoved` to this Hero),
 * the Hero walks to the middle of its new Front.
 */
const standZ = (
  ref: HeroRef,
  current: PlayingEvent | null,
  view: BattleView,
  progress: number,
  reducedMotion: boolean
): number => {
  const front = view.sides[ref.side].heroes[ref.hero]?.front ?? [];
  const event = current?.event;
  if (event?._tag === "FrontMoved") {
    // The Defeated Hero stays where it fell while its Front moves away.
    const before = current?.before.sides[ref.side].heroes[ref.hero]?.front;
    const from = before ? frontZ(before, view.lanes) : 0;
    if (isHero(ref, event.from)) {
      return from;
    }
    if (isHero(ref, event.to) && !reducedMotion) {
      const to = frontZ(front, view.lanes);
      return from + (to - from) * easeOut(progress);
    }
  }
  return frontZ(front, view.lanes);
};

/** The fall of a Defeated Hero: its lean, how much of it shows, and how far it sinks. */
interface Fall {
  readonly lean: number;
  readonly opacity: number;
  readonly sink: number;
}

/**
 * How much of a Defeated Hero shows: it falls back and fades in
 * `HeroDefeated`, and then it is gone. Only a Side of 2 or more Heroes shows
 * this (a Dungeon). In a Stage, the Battle ends on the defeat, and the Hero
 * stays as before.
 */
const fall = (
  ref: HeroRef,
  current: PlayingEvent | null,
  view: BattleView,
  progress: number,
  reducedMotion: boolean
): Fall => {
  const hero = view.sides[ref.side].heroes[ref.hero];
  if (!hero || hero.hp > 0 || !hasManyHeroes(view, ref.side)) {
    return { lean: 0, opacity: 1, sink: 0 };
  }
  const event = current?.event;
  const falling =
    event?._tag === "HeroDefeated" && isHero(ref, event.hero) && !reducedMotion;
  if (!falling) {
    return { lean: 0, opacity: 0, sink: 0 };
  }
  // It tips back, away from the Board, and fades in the second half.
  const tip = easeOut(Math.min(1, progress / 0.7));
  const away = ref.side === "player" ? 1 : -1;
  return {
    lean: tip * FALL_ANGLE * away,
    opacity: 1 - easeOut(Math.max(0, (progress - 0.35) / 0.65)),
    sink: tip * 0.45,
  };
};

/**
 * The pose of a Hero figure: an idle bob, and a red shake while damage hits
 * it. While it casts a Skill Card or a Boss Rule activates, it rises, leans
 * toward the Board and takes the color of the effect. With reduced motion,
 * the cast changes only the color. A Boss stands at the middle of its Front,
 * walks when its Front grows, and falls when it is Defeated. `view` is the
 * view after `current`. `time` is in scene seconds.
 */
export const heroPose = (
  ref: HeroRef,
  current: PlayingEvent | null,
  view: BattleView,
  progress: number,
  time: number,
  reducedMotion = false
): HeroPose => {
  const event = current?.event ?? null;
  const { side } = ref;
  const hit =
    event?._tag === "DamageDealt" &&
    event.target._tag === "Hero" &&
    event.target.side === side &&
    event.target.hero === ref.hero &&
    event.hp < (current?.before.sides[side].heroes[ref.hero]?.hp ?? 0);
  const color = glowColor(ref, event);
  // Up while the spell gathers, down when the bolt leaves.
  const swell = color ? Math.sin(Math.min(1, progress / 0.6) * Math.PI) : 0;
  const lift = reducedMotion ? 0 : swell;
  const toBoard = side === "player" ? 1 : -1;
  const down = fall(ref, current, view, progress, reducedMotion);
  // Each Boss bobs at its own beat, so a row of Bosses does not move as one.
  const beat = (side === "player" ? 0 : 2) + ref.hero * 1.3;
  return {
    x:
      heroX(side) +
      (hit ? Math.sin(progress * 40) * 0.08 * (1 - progress) : 0) +
      lift * 0.12 * toBoard,
    y:
      HERO_FIGURE_Y +
      (reducedMotion ? 0 : Math.sin(time * 1.4 + beat) * 0.03) +
      lift * 0.3 -
      down.sink,
    z: standZ(ref, current, view, progress, reducedMotion),
    lean: down.lean,
    opacity: down.opacity,
    hitTint: hit ? 0.7 * (1 - progress) : null,
    cast: color ? { color, amount: 0.45 * swell } : null,
  };
};
