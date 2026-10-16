import { RegistryContext, useAtomSet, useAtomValue } from "@effect/atom-react";
import type { Target } from "@workspace/rules";
import { isTutorial } from "@workspace/rules";
import { Result } from "effect";
import type { ContextType } from "react";
import { useContext, useLayoutEffect } from "react";

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
import { recordBattleResult } from "@/features/battle/battle-rewards";
import type {
  BattleOptions,
  BattleSession,
} from "@/features/battle/battle-session";
import {
  canAct,
  canEndTurn,
  changeTutorial,
  endTurn,
  isHeld,
  isIdle,
  newestSession,
  playIfAble,
  setSpeed,
  skip,
  startSession,
} from "@/features/battle/battle-session";
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
import { playback } from "@/features/battle/scene/playback";
import type { Tutorial } from "@/features/battle/tutorial";
import { closeText, selectCard, skipText } from "@/features/battle/tutorial";
import type { InspectDirection } from "@/features/battle/unit-inspect";
import { nextInspectedUnit } from "@/features/battle/unit-inspect";
import { profileAtom } from "@/features/profile/profile.atoms";
import type { ReplayRun } from "@/features/replay/replay";
import { watchingSession } from "@/features/replay/replay";
import { gameScreenAtom } from "@/features/town/town.atoms";

/** A new Battle seed. The seed is input to the rules, so this is not a rule. */
export const randomSeed = (): number =>
  Math.floor(Math.random() * 2_147_483_647);

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

/**
 * Saves the result of a finished Battle into the Profile (GDD 11.4): the
 * rewards of a win or a loss (Economy 2.1), one time for each Battle. A reload on the
 * result keeps them. An Abandon and a Battle that is not finished save
 * nothing.
 */
const recordResult = (
  registry: ContextType<typeof RegistryContext>,
  finished: BattleSession
) => {
  const recorded = recordBattleResult(
    registry.get(profileAtom),
    finished,
    registry.get(battleRewardsAtom)
  );
  if (recorded) {
    registry.set(battleRewardsAtom, recorded.shown);
    registry.set(profileAtom, recorded.profile);
  }
};

/** The Battle Log is in each Solo Battle, but not in the Tutorial (GDD 4.12). */
const hasBattleLog = (session: BattleSession | null): boolean =>
  session !== null && session.tutorial === null;

/**
 * The Battle state and the player's actions, for the HUD. `session` is what
 * the screen shows: the selected moment of the open Battle Log, else Live.
 * `liveSession` is Live. Each Command goes to Live, and none goes while the
 * Battle Log is open. While the Player watches a Replay (web ADR-0012),
 * `liveSession` holds the full Replay and the Battle Log is always open: there
 * is no Live.
 */
export const useBattle = () => {
  const registry = useContext(RegistryContext);
  const liveSession = useAtomValue(battleSessionAtom);
  const session = useAtomValue(shownSessionAtom);
  const log = useAtomValue(battleLogAtom);
  const selected = useAtomValue(selectedCardAtom);
  const targets = useAtomValue(legalTargetsAtom);
  const focused = useAtomValue(focusedTargetAtom);
  const inspected = useAtomValue(inspectedUnitAtom);
  const detailsUnit = useAtomValue(detailsUnitAtom);
  const storedSpeed = useAtomValue(battleSpeedAtom);
  const setStoredSpeed = useAtomSet(battleSpeedAtom);
  const watching = liveSession?.watching ?? false;
  // A Replay plays at its own Speed: it does not change the choice of the Player.
  const speed = watching && log ? log.shown.speed : storedSpeed;

  // When the result shows (`ResultOverlay`), before the paint, so that it
  // shows with its rewards. The stored session, not the scene clock: after a
  // Skip, the clock is one frame behind it.
  useLayoutEffect(() => {
    if (liveSession?.view.result && isIdle(liveSession)) {
      recordResult(registry, liveSession);
    }
  }, [registry, liveSession]);

  const logOpen = () => registry.get(battleLogAtom) !== null;

  /**
   * The newest Live session: the scene clock can be ahead of the atom inside
   * one event. While the Battle Log is open, the clock shows the Battle Log,
   * and the atom is Live.
   */
  const live = (): BattleSession | null =>
    logOpen()
      ? registry.get(battleSessionAtom)
      : newestSession(registry.get(battleSessionAtom), playback.session);

  const commit = (next: BattleSession | null) => {
    registry.set(battleSessionAtom, next);
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
    const next = logOpen() ? null : playIfAble(live(), handIndex, target);
    if (!next) {
      return false;
    }
    unlockAudio();
    select(null);
    commit(next);
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
    playback.session = null;
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
    canAct: log === null && whenSession(liveSession, canAct, false),
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
     * Watching a Replay (web ADR-0012): the Battle Log of the Replay opens in
     * place of the screen, and Plays at ×1 from the first Log Entry.
     */
    watch: (run: ReplayRun) => {
      const replay = watchingSession(run);
      select(null);
      registry.set(inspectedUnitAtom, null);
      playback.session = null;
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
      playback.session = null;
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
    canEndTurn: log === null && whenSession(liveSession, canEndTurn, false),
    endTurn: () => {
      const current = live();
      if (logOpen() || !current || !canEndTurn(current)) {
        return;
      }
      unlockAudio();
      select(null);
      const result = endTurn(current);
      if (Result.isSuccess(result)) {
        commit(result.success);
      }
    },
    skip: () => {
      const current = live();
      if (current && !logOpen()) {
        commit(skip(current));
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
