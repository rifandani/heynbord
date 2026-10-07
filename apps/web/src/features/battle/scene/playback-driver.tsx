import { RegistryContext } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import { useContext, useRef } from "react";

import { playSound } from "@/features/battle/battle-audio";
import type { BattleSession } from "@/features/battle/battle-session";
import { progressOf, tick } from "@/features/battle/battle-session";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { fxList } from "@/features/battle/scene/fx";
import { playback } from "@/features/battle/scene/playback";
import {
  shouldPublish,
  startedEvents,
} from "@/features/battle/scene/started-events";

/** The longest frame step, so a tab that was in the background does not jump. */
const MAX_DELTA = 0.1;

/** Each event that started in this frame gets its sound and effects. */
const playStarted = (before: BattleSession, next: BattleSession) => {
  const started = startedEvents(before, next, playback.time);
  fxList.push(...started.fx);
  for (const sound of started.sounds) {
    playSound(sound, started.soundGap);
  }
  if (started.shake) {
    playback.shake = 1;
  }
};

/**
 * Plays the queued Battle Events (technical design 4.3). It runs first in each
 * frame. It writes the animation clock in each frame, and the session atom
 * only when an event starts or ends.
 */
export const PlaybackDriver = () => {
  const registry = useContext(RegistryContext);
  const published = useRef<BattleSession | null>(null);

  /** The HUD changed the session (a play, End Turn, Skip or speed). */
  const adoptStored = () => {
    const stored = registry.get(battleSessionAtom);
    if (stored !== published.current) {
      playback.session = stored;
      published.current = stored;
    }
  };

  const advance = (before: BattleSession, step: number) => {
    const next = tick(before, step * 1000);
    playback.session = next;
    playback.progress = progressOf(next);
    if (next === before) {
      return;
    }
    playStarted(before, next);
    if (shouldPublish(before, next)) {
      published.current = next;
      registry.set(battleSessionAtom, next);
    }
  };

  useFrame((_, delta) => {
    // QA: a paused clock stops all motion for a screenshot.
    const step = playback.paused ? 0 : Math.min(delta, MAX_DELTA);
    playback.time += step;
    playback.shake = Math.max(0, playback.shake - step * 3);
    adoptStored();
    const before = playback.session;
    if (before && !playback.paused) {
      advance(before, step);
    }
  }, -1);

  return null;
};
