import { RegistryContext } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import { useContext, useRef } from "react";

import { playSound } from "@/features/battle/battle-audio";
import type { BattleLogState } from "@/features/battle/battle-log-session";
import { advanceBattleLog } from "@/features/battle/battle-log-session";
import type { BattleSession } from "@/features/battle/battle-session";
import { progressOf, tick } from "@/features/battle/battle-session";
import {
  battleLogAtom,
  battleSessionAtom,
} from "@/features/battle/battle.atoms";
import type { Fx } from "@/features/battle/scene/fx";
import { fxList } from "@/features/battle/scene/fx";
import { withoutPlates } from "@/features/battle/scene/keyword-plates";
import { playback } from "@/features/battle/scene/playback";
import {
  keptFx,
  shouldPublish,
  startedEvents,
} from "@/features/battle/scene/started-events";

/** The longest frame step, so a tab that was in the background does not jump. */
const MAX_DELTA = 0.1;

/** Puts `kept` in the effects list, when it is not the same list. */
const keepFx = (kept: readonly Fx[]) => {
  if (kept !== fxList) {
    fxList.splice(0, fxList.length, ...kept);
  }
};

/**
 * Each event that started in this frame gets its effects, and in Live its
 * sound and its Keyword Plates. The Play of the Battle Log has no sound and
 * no plates, so that it never looks or sounds like Live.
 */
const playStarted = (
  before: BattleSession,
  next: BattleSession,
  live: boolean
) => {
  const started = startedEvents(before, next, playback.time);
  fxList.push(...(live ? started.fx : withoutPlates(started.fx)));
  if (live) {
    for (const name of started.sounds) {
      playSound(name, started.soundGap);
    }
  }
  if (started.shake) {
    playback.shake = 1;
  }
};

/**
 * Plays the queued Battle Events (technical design 4.3). It runs first in each
 * frame. It writes the animation clock in each frame, and the session atom
 * only when an event starts or ends. While the Battle Log is open, Live
 * pauses: the clock plays only the Play of the Battle Log.
 */
export const PlaybackDriver = () => {
  const registry = useContext(RegistryContext);
  const published = useRef<BattleSession | null>(null);

  /** The HUD changed the session (a play, End Turn, Skip or speed). */
  const adoptStored = () => {
    const stored = registry.get(battleSessionAtom);
    if (stored !== published.current) {
      keepFx(keptFx(fxList, playback.session, stored));
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
    playStarted(before, next, true);
    if (shouldPublish(before, next)) {
      published.current = next;
      registry.set(battleSessionAtom, next);
    }
  };

  /** The Battle Log shows its selected moment, or its Play. */
  const showLog = (log: BattleLogState, step: number) => {
    // The Battle Log shows no plates, and Live shows no old plates after it.
    keepFx(withoutPlates(fxList));
    if (log.shown !== published.current) {
      playback.session = log.shown;
      playback.progress = progressOf(log.shown);
      published.current = log.shown;
    }
    const before = playback.session;
    if (!log.playing || !before) {
      return;
    }
    const next = tick(before, step * 1000);
    playback.session = next;
    playback.progress = progressOf(next);
    if (next !== before) {
      playStarted(before, next, false);
    }
    if (shouldPublish(before, next)) {
      const advanced = advanceBattleLog(log, next);
      published.current = advanced.shown;
      playback.session = advanced.shown;
      registry.set(battleLogAtom, advanced);
    }
  };

  useFrame((_, delta) => {
    // QA: a paused clock stops all motion for a screenshot.
    const step = playback.paused ? 0 : Math.min(delta, MAX_DELTA);
    playback.time += step;
    playback.shake = Math.max(0, playback.shake - step * 3);
    const log = registry.get(battleLogAtom);
    if (log) {
      showLog(log, step);
      return;
    }
    adoptStored();
    const before = playback.session;
    if (before && !playback.paused) {
      advance(before, step);
    }
  }, -1);

  return null;
};
