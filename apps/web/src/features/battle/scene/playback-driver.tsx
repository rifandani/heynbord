import { RegistryContext } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import { useContext, useRef } from "react";

import { playSound } from "@/features/battle/battle-audio";
import type { BattleLogState } from "@/features/battle/battle-log-session";
import { advanceBattleLog } from "@/features/battle/battle-log-session";
import type { BattleSession } from "@/features/battle/battle-session";
import { progressOf, tick } from "@/features/battle/battle-session";
import {
  publishBattle,
  readBattle,
  stageBattle,
} from "@/features/battle/battle-store";
import { battleLogAtom, defeatPanelAtom } from "@/features/battle/battle.atoms";
import {
  DEFEAT,
  defeatHitStopScale,
  defeatStartOf,
  isLosingBlow,
} from "@/features/battle/scene/defeat";
import type { Fx } from "@/features/battle/scene/fx";
import { fxList } from "@/features/battle/scene/fx";
import { withoutPlates } from "@/features/battle/scene/keyword-plates";
import { defeatTime, playback } from "@/features/battle/scene/playback";
import {
  keptFx,
  shouldPublish,
  startedEvents,
} from "@/features/battle/scene/started-events";
import {
  hitStopScale,
  isFinalBlow,
  VICTORY,
  victoryStartOf,
} from "@/features/battle/scene/victory";

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
  // The last hit of a won Battle starts the hit-stop (`scene/victory.ts`),
  // and so does the last hit of a lost Battle (`scene/defeat.ts`).
  if (live && next.current && next.current !== before.current) {
    if (isFinalBlow(next.current.event, next.view)) {
      playback.finalBlow = 0;
      playback.finalBlowTo = "enemy";
    } else if (isLosingBlow(next.current.event, next.view)) {
      playback.finalBlow = 0;
      playback.finalBlowTo = "player";
      playback.shake = 1;
    }
  }
};

/** The real seconds after the last hit when its hit-stop and flash are over. */
const FINAL_BLOW_END = Math.max(
  VICTORY.hitStop.hold + VICTORY.hitStop.release,
  VICTORY.flash.rise + VICTORY.flash.fall
);

/** The same for the last hit of a lost Battle: its hit-stop and its edge pulse. */
const LOSING_BLOW_END = Math.max(
  DEFEAT.hitStop.hold + DEFEAT.hitStop.release,
  DEFEAT.pulse.rise + DEFEAT.pulse.fall
);

/**
 * The clock step of this frame: during the hit-stop of the last hit, the
 * clock almost stops, then comes back to full speed.
 */
const scaledStep = (step: number): number => {
  if (playback.finalBlow === null) {
    return step;
  }
  playback.finalBlow += step;
  const lost = playback.finalBlowTo === "player";
  const scale = lost
    ? defeatHitStopScale(playback.finalBlow)
    : hitStopScale(playback.finalBlow);
  if (playback.finalBlow > (lost ? LOSING_BLOW_END : FINAL_BLOW_END)) {
    playback.finalBlow = null;
  }
  return step * scale;
};

/**
 * Keeps the victory of the Live Battle: it starts once for each Battle, so
 * "Back to Live" from the Battle Log does not play it again.
 */
const trackVictory = (session: BattleSession | null) => {
  if (session && playback.victory?.options !== session.options) {
    playback.victory = victoryStartOf(session, playback.time);
  }
};

/** The same for the defeat of the Live Battle (`scene/defeat.ts`). */
const trackDefeat = (session: BattleSession | null) => {
  if (session && playback.defeat?.options !== session.options) {
    playback.defeat = defeatStartOf(session, playback.time);
  }
};

/**
 * The beats of the defeat that happen once, between the defeat time of the
 * last frame and of this one: the thud of the knee, and the end of the wait
 * for the result panel.
 */
const defeatBeats = (
  before: number | null,
  after: number | null,
  openPanel: () => void
) => {
  if (after === null) {
    return;
  }
  // A defeat that starts late (after Skip, or "Back to Live") plays no beat
  // that it has passed: the Hero is already down.
  const from = before ?? after;
  if (from < DEFEAT.impact && after >= DEFEAT.impact) {
    playSound("kneel");
    playback.shake = Math.max(playback.shake, 0.45);
  }
  if (from < DEFEAT.panel && after >= DEFEAT.panel) {
    openPanel();
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
    const stored = readBattle(registry);
    if (stored !== published.current) {
      keepFx(keptFx(fxList, playback.session, stored));
      stageBattle(stored);
      published.current = stored;
    }
  };

  const advance = (before: BattleSession, step: number) => {
    const next = tick(before, step * 1000);
    stageBattle(next);
    playback.progress = progressOf(next);
    if (next === before) {
      return;
    }
    playStarted(before, next, true);
    if (shouldPublish(before, next)) {
      published.current = next;
      publishBattle(registry, next);
    }
  };

  /** The Battle Log shows its selected moment, or its Play. */
  const showLog = (log: BattleLogState, step: number) => {
    // The Battle Log shows no plates, and Live shows no old plates after it.
    keepFx(withoutPlates(fxList));
    if (log.shown !== published.current) {
      stageBattle(log.shown);
      playback.progress = progressOf(log.shown);
      published.current = log.shown;
    }
    const before = playback.session;
    if (!log.playing || !before) {
      return;
    }
    const next = tick(before, step * 1000);
    stageBattle(next);
    playback.progress = progressOf(next);
    if (next !== before) {
      playStarted(before, next, false);
    }
    if (shouldPublish(before, next)) {
      const advanced = advanceBattleLog(log, next);
      published.current = advanced.shown;
      stageBattle(advanced.shown);
      registry.set(battleLogAtom, advanced);
    }
  };

  const openDefeatPanel = () => {
    const options = playback.defeat?.options ?? null;
    if (options && registry.get(defeatPanelAtom) !== options) {
      registry.set(defeatPanelAtom, options);
    }
  };

  useFrame((_, delta) => {
    // QA: a paused clock stops all motion for a screenshot.
    const step = scaledStep(playback.paused ? 0 : Math.min(delta, MAX_DELTA));
    const lostBefore = defeatTime();
    playback.time += step;
    playback.shake = Math.max(0, playback.shake - step * 3);
    const log = registry.get(battleLogAtom);
    playback.live = log === null;
    if (log) {
      playback.finalBlow = null;
      showLog(log, step);
      return;
    }
    adoptStored();
    const before = playback.session;
    if (before && !playback.paused) {
      advance(before, step);
    }
    trackVictory(playback.session);
    trackDefeat(playback.session);
    defeatBeats(lostBefore, defeatTime(), openDefeatPanel);
  }, -1);

  return null;
};
