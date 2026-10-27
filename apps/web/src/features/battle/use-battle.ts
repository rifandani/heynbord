import { RegistryContext, useAtomSet, useAtomValue } from "@effect/atom-react";
import type { Target } from "@workspace/rules";
import { isTutorial } from "@workspace/rules";
import { Result } from "effect";
import { useContext, useEffect, useLayoutEffect } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import {
  canPlayLog,
  openBattleLog,
  pauseBattleLog,
  playBattleLog,
  selectLogEntry,
  setBattleLogSpeed,
  stepBattleLog,
  watchBattleLog,
} from "@/features/battle/battle-log-session";
import type { BattleLogState } from "@/features/battle/battle-log-session";
import { recordBattle } from "@/features/battle/battle-result";
import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";
import {
  battleReadOf,
  canAct,
  canEndTurn,
  changeTutorial,
  endTurnBattle,
  isHeld,
  newestSession,
  playBattle,
  setSpeed,
  shouldRecordResult,
  skipBattle,
  startSession,
} from "@/features/battle/battle-session";
import {
  publishBattle,
  stageBattle,
  stagedBattle,
} from "@/features/battle/battle-store";
import type { BattleSpeed } from "@/features/battle/battle-timeline";
import type { UnitView } from "@/features/battle/battle-view";
import { heroOf } from "@/features/battle/battle-view";
import type { InspectedUnit } from "@/features/battle/battle.atoms";
import {
  battleLogAtom,
  battleRewardsAtom,
  battleSessionAtom,
  battleSpeedAtom,
  detailsUnitAtom,
  focusedTargetAtom,
  inspectedUnitAtom,
  legalTargetsAtom,
  selectedCardAtom,
  shownSessionAtom,
  targetFocusByKeyAtom,
  tutorialStageWonAtom,
} from "@/features/battle/battle.atoms";
import type { Tutorial } from "@/features/battle/tutorial";
import { closeText, selectCard, skipText } from "@/features/battle/tutorial";
import type { InspectDirection } from "@/features/battle/unit-inspect";
import { nextInspectedUnit } from "@/features/battle/unit-inspect";
import type { ReplayRun } from "@/features/replay/replay";
import { watchingSession } from "@/features/replay/replay";
import { gameScreenAtom } from "@/features/town/town.atoms";

const whenSession = <Value>(
  session: BattleSession | null,
  read: (session: BattleSession) => Value,
  fallback: Value
): Value => (session ? read(session) : fallback);

const keyboardInspect = (
  inspected: InspectedUnit | null,
  details: UnitView | null
) => inspected?.by === "keyboard" && details !== null;

const unitsOf = (session: BattleSession | null) => session?.view.units ?? [];

const heldUnitId = (inspected: InspectedUnit | null) =>
  inspected?.unitId ?? null;

const keyboardTarget = (unitId: number | null): InspectedUnit | null =>
  unitId === null ? null : { unitId, by: "keyboard" };

const playSelectSound = (handIndex: number | null) => {
  if (handIndex !== null) {
    playSound("select");
  }
};

/** True while the Player watches a Replay: there is no Live (web ADR-0011). */
const watchingOf = (session: BattleSession | null): boolean =>
  session?.watching ?? false;

/** A Replay plays at its own Speed: it does not change the choice of the Player. */
const speedOf = (
  watching: boolean,
  log: BattleLogState | null,
  storedSpeed: BattleSpeed
): BattleSpeed => (watching && log ? log.shown.speed : storedSpeed);

/** A Command goes to Live, and none goes while the Battle Log is open. */
const canCommand = (
  log: BattleLogState | null,
  liveSession: BattleSession | null,
  allowed: (session: BattleSession) => boolean
): boolean => log === null && whenSession(liveSession, allowed, false);

/** The session at the stored Speed, or `null` when that Speed is already in force. */
const speedChange = (
  session: BattleSession | null,
  speed: BattleSpeed
): BattleSession | null => {
  if (!session || session.watching || session.speed === speed) {
    return null;
  }
  return setSpeed(session, speed);
};

const noteSelect = (
  handIndex: number | null,
  current: BattleSession | null,
  update: (change: (tutorial: Tutorial) => Tutorial) => void
) => {
  if (handIndex !== null && current && canAct(current)) {
    update((tutorial) =>
      selectCard(tutorial, heroOf(current.view, "player").hand[handIndex])
    );
  }
};

/** The Battle Log is in each Solo Battle, but not in the Tutorial (GDD 4.12). */
const hasBattleLog = (session: BattleSession | null): boolean =>
  session !== null && session.tutorial === null;

/** The atom values of the Battle view and the Player's selection. */
const useBattleState = () => {
  const liveSession = useAtomValue(battleSessionAtom);
  const shown = useAtomValue(shownSessionAtom);
  return {
    liveSession,
    session: battleReadOf(shown),
    log: useAtomValue(battleLogAtom),
    selected: useAtomValue(selectedCardAtom),
    targets: useAtomValue(legalTargetsAtom),
    focused: useAtomValue(focusedTargetAtom),
    inspected: useAtomValue(inspectedUnitAtom),
    detailsUnit: useAtomValue(detailsUnitAtom),
  };
};

/**
 * The Battle state and the player's actions, for the HUD. `session` is the
 * narrow read model of what the screen shows: the selected moment of the open
 * Battle Log, else Live. `liveSession` is the full Live session, for the
 * Battle Log, the Replay and the result. Each Command goes to Live, and none
 * goes while the Battle Log is open. While the Player watches a Replay (web
 * ADR-0011), `liveSession` holds the full Replay and the Battle Log is always
 * open: there is no Live.
 */
export const useBattle = () => {
  const registry = useContext(RegistryContext);
  const {
    liveSession,
    session,
    log,
    selected,
    targets,
    focused,
    inspected,
    detailsUnit,
  } = useBattleState();
  const storedSpeed = useAtomValue(battleSpeedAtom);
  const setStoredSpeed = useAtomSet(battleSpeedAtom);
  const watching = watchingOf(liveSession);
  const speed = speedOf(watching, log, storedSpeed);

  // When the result shows (`ResultOverlay`), before the paint, so that it
  // shows with its rewards. The stored session, not the scene clock: after a
  // Skip, the clock is one frame behind it.
  useLayoutEffect(() => {
    if (
      liveSession !== null &&
      shouldRecordResult(liveSession, registry.get(battleRewardsAtom))
    ) {
      recordBattle(registry, liveSession);
    }
  }, [registry, liveSession]);

  // The Settings dialog changes the stored speed: apply it to the Battle on
  // the screen, and to its Battle Log. A Replay keeps its own speed.
  useEffect(() => {
    const next = speedChange(registry.get(battleSessionAtom), storedSpeed);
    if (next === null) {
      return;
    }
    publishBattle(registry, next);
    const shownLog = registry.get(battleLogAtom);
    if (shownLog) {
      registry.set(battleLogAtom, setBattleLogSpeed(shownLog, storedSpeed));
    }
  }, [registry, storedSpeed]);

  const logOpen = () => registry.get(battleLogAtom) !== null;

  /**
   * The newest Live session: the scene clock can be ahead of the atom inside
   * one event. While the Battle Log is open, the clock shows the Battle Log,
   * and the atom is Live.
   */
  const live = (): BattleSession | null =>
    logOpen()
      ? registry.get(battleSessionAtom)
      : newestSession(registry.get(battleSessionAtom), stagedBattle());

  const commit = (next: BattleSession | null) => {
    publishBattle(registry, next);
  };

  const select = (handIndex: number | null) => {
    registry.set(selectedCardAtom, handIndex);
    registry.set(focusedTargetAtom, 0);
    registry.set(targetFocusByKeyAtom, false);
  };

  /** Keyboard Inspect: the next Unit in `direction`, from the inspected Unit. */
  const inspectNext = (direction: InspectDirection) => {
    const unitId = nextInspectedUnit(
      unitsOf(live()),
      heldUnitId(registry.get(inspectedUnitAtom)),
      direction
    );
    registry.set(inspectedUnitAtom, keyboardTarget(unitId));
  };

  const updateTutorial = (change: (tutorial: Tutorial) => Tutorial) => {
    const current = live();
    const next = current && changeTutorial(current, change);
    if (next !== current) {
      commit(next);
    }
  };

  const play = (target: Target, handIndexArg?: number | null) => {
    const handIndex =
      handIndexArg === undefined
        ? registry.get(selectedCardAtom)
        : handIndexArg;
    const result = playBattle(live(), logOpen(), handIndex, target);
    if (Result.isFailure(result)) {
      return false;
    }
    unlockAudio();
    select(null);
    commit(result.success);
    return true;
  };

  const changeLog = (change: (state: BattleLogState) => BattleLogState) => {
    const current = registry.get(battleLogAtom);
    if (current) {
      registry.set(battleLogAtom, change(current));
    }
  };

  /** Back to the screen that started the Battle, or to the Town after a Replay. */
  const leave = () => {
    const wasWatching = registry.get(battleSessionAtom)?.watching ?? false;
    select(null);
    registry.set(inspectedUnitAtom, null);
    // The Battle Log is not saved: it goes away with the Battle.
    registry.set(battleLogAtom, null);
    stageBattle(null);
    commit(null);
    if (wasWatching) {
      registry.set(gameScreenAtom, "town");
    }
  };

  return {
    session,
    liveSession,
    selected,
    targets,
    focused,
    speed,
    canAct: canCommand(log, liveSession, canAct),
    /** True in the keyboard Inspect mode, while its Unit is on the Board. */
    inspecting: keyboardInspect(inspected, detailsUnit),
    /** The I key: starts the keyboard Inspect mode at the first Unit, or stops it. */
    toggleInspect: () => {
      const inKeyboardMode =
        registry.get(inspectedUnitAtom)?.by === "keyboard" &&
        registry.get(detailsUnitAtom) !== null;
      registry.set(inspectedUnitAtom, null);
      if (!inKeyboardMode) {
        inspectNext("right");
      }
    },
    inspectNext,
    stopInspect: () => registry.set(inspectedUnitAtom, null),
    /** Tutorial Step 3 holds the playback until its text closes. */
    held: whenSession(liveSession, isHeld, false),
    /** The open Battle Log, or `null`. */
    log,
    hasBattleLog: hasBattleLog(liveSession),
    /** True while the Player watches a Replay: the Battle Log shows it, and there is no Live. */
    watching,
    /**
     * Watching a Replay (web ADR-0011): the Battle Log of the Replay opens in
     * place of the screen, and Plays at ×1 from the first Log Entry.
     */
    watch: (run: ReplayRun) => {
      const replay = watchingSession(run);
      select(null);
      registry.set(inspectedUnitAtom, null);
      stageBattle(null);
      commit(replay);
      registry.set(battleLogAtom, watchBattleLog(replay));
    },
    /** "Watch again" at the end of a Replay: the Play starts again at the first Log Entry. */
    watchAgain: () => {
      const current = registry.get(battleSessionAtom);
      if (current?.watching) {
        registry.set(inspectedUnitAtom, null);
        registry.set(battleLogAtom, watchBattleLog(current));
      }
    },
    /**
     * The L key, the Top Bar button and the result: opens the Battle Log at
     * the last Log Entry, and Live pauses at the same point.
     */
    openLog: () => {
      const current = live();
      if (logOpen() || !current || !hasBattleLog(current)) {
        return;
      }
      // Live keeps the newest point of the scene clock, and continues from it.
      commit(current);
      select(null);
      registry.set(inspectedUnitAtom, null);
      registry.set(battleLogAtom, openBattleLog(current));
    },
    /** Back to Live (Esc): Live continues from the same point. A Replay has no Live: Esc leaves it. */
    closeLog: () => {
      if (!logOpen()) {
        return;
      }
      if (registry.get(battleSessionAtom)?.watching) {
        leave();
        return;
      }
      registry.set(inspectedUnitAtom, null);
      registry.set(battleLogAtom, null);
    },
    selectLogEntry: (entry: number) =>
      changeLog((state) => selectLogEntry(state, entry)),
    /** ←/→ go one Log Entry, Shift+←/→ one Turn. */
    stepLog: (step: 1 | -1, byTurn: boolean) =>
      changeLog((state) => stepBattleLog(state, step, byTurn)),
    toggleLogPlay: () =>
      changeLog((state) => {
        if (state.playing) {
          return pauseBattleLog(state);
        }
        return canPlayLog(state) ? playBattleLog(state) : state;
      }),
    start: (options: BattleOptions) => {
      unlockAudio();
      playSound("select");
      select(null);
      registry.set(inspectedUnitAtom, null);
      registry.set(battleLogAtom, null);
      stageBattle(null);
      const tutorial = isTutorial(
        options.stageId,
        registry.get(tutorialStageWonAtom)
      );
      commit(startSession(options, speed, tutorial));
    },
    /**
     * Back to the screen that started the Battle: the Campaign or the
     * Dungeons. Before a result, this is an Abandon: it records nothing. A
     * Replay goes back to the Town.
     */
    leave,
    select: (handIndex: number | null) => {
      unlockAudio();
      playSelectSound(handIndex);
      select(handIndex);
      noteSelect(handIndex, live(), updateTutorial);
    },
    closeTutorialText: () => updateTutorial(closeText),
    skipTutorialText: () => updateTutorial(skipText),
    play,
    focusTarget: (step: number) => {
      const count = registry.get(legalTargetsAtom).length;
      if (count > 0) {
        registry.set(targetFocusByKeyAtom, true);
        registry.set(
          focusedTargetAtom,
          (registry.get(focusedTargetAtom) + step + count) % count
        );
      }
    },
    canEndTurn: canCommand(log, liveSession, canEndTurn),
    endTurn: () => {
      const current = live();
      if (!current) {
        return;
      }
      const result = endTurnBattle(current, logOpen());
      if (Result.isSuccess(result)) {
        unlockAudio();
        select(null);
        commit(result.success);
      }
    },
    skip: () => {
      const current = live();
      if (!current) {
        return;
      }
      const result = skipBattle(current, logOpen());
      if (Result.isSuccess(result)) {
        commit(result.success);
      }
    },
    setSpeed: (value: BattleSpeed) => {
      if (registry.get(battleSessionAtom)?.watching) {
        changeLog((state) => setBattleLogSpeed(state, value));
        return;
      }
      setStoredSpeed(value);
      const current = live();
      if (current) {
        commit(setSpeed(current, value));
      }
      changeLog((state) => setBattleLogSpeed(state, value));
    },
  };
};
