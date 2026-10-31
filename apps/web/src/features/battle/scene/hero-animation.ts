import type { ClassId } from "@workspace/rules";
import { getCard } from "@workspace/rules";

import type { BattleSession } from "@/features/battle/battle-session";
import { isAtLowHp } from "@/features/battle/health";
import type { HeroClipName } from "@/features/battle/scene/hero-clips";

export interface HeroAnimation {
  readonly name: HeroClipName;
  readonly phase: number;
}

const CLASS_CAST: Readonly<Record<ClassId, HeroClipName>> = {
  warrior: "castWarrior",
  ranger: "castRanger",
  mage: "castMage",
  priest: "castPriest",
};

const summonAnimation = (
  session: BattleSession,
  phase: number
): HeroAnimation | null => {
  const event = session.current?.event;
  const previous = session.log.at(-2);
  if (
    event?._tag === "UnitSummoned" &&
    event.unit.source._tag === "Card" &&
    previous?._tag === "CardPlayed" &&
    previous.hero.side === "player" &&
    previous.hero.hero === 0 &&
    previous.card.instanceId === event.unit.source.card.instanceId
  ) {
    return { name: "summon", phase: 0.3 + phase * 0.7 };
  }
  return null;
};

const actionAnimation = (
  session: BattleSession,
  phase: number
): HeroAnimation | null => {
  const { current } = session;
  const [hero] = session.view.sides.player.heroes;
  const event = current?.event;
  if (
    event?._tag === "DamageDealt" &&
    event.target._tag === "Hero" &&
    event.target.side === "player" &&
    event.target.hero === 0 &&
    event.hp < (current?.before.sides.player.heroes[0]?.hp ?? 0)
  ) {
    return { name: "hurt", phase };
  }
  if (
    event?._tag === "CardPlayed" &&
    event.hero.side === "player" &&
    event.hero.hero === 0
  ) {
    if (getCard(event.card.cardId).kind === "creature") {
      return { name: "summon", phase: phase * 0.3 };
    }
    return { name: CLASS_CAST[hero?.classId ?? "warrior"], phase };
  }
  return summonAnimation(session, phase);
};

/** The Player Hero's animation at one point on the Battle playback clock. */
export const heroAnimation = (
  session: BattleSession,
  progress: number,
  time: number,
  loopSeconds: number,
  reducedMotion: boolean
): HeroAnimation => {
  const { view, current } = session;
  const [hero] = view.sides.player.heroes;
  const phase = Math.max(0, Math.min(1, progress));
  if (view.result) {
    return {
      name: view.result.winner === "player" ? "victory" : "defeat",
      phase: current?.event._tag === "BattleEnded" ? phase : 1,
    };
  }
  const action = actionAnimation(session, phase);
  if (action) {
    return action;
  }
  const name = hero && hero.hp > 0 && isAtLowHp(hero) ? "lowHp" : "idle";
  return {
    name,
    phase: reducedMotion || loopSeconds <= 0 ? 0 : (time / loopSeconds) % 1,
  };
};
