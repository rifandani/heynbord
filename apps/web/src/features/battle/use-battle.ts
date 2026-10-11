import { RegistryContext, useAtomSet, useAtomValue } from "@effect/atom-react";
import type { Target } from "@workspace/rules";
import { isTutorial } from "@workspace/rules";
import { Result } from "effect";
import type { ContextType } from "react";
import { useContext, useLayoutEffect } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { recordStageResult } from "@/features/battle/battle-rewards";
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
import type { InspectedUnit } from "@/features/battle/battle.atoms";
import {
  battleRewardsAtom,
  battleSessionAtom,
  battleSpeedAtom,
  detailsUnitAtom,
  focusedTargetAtom,
  inspectedUnitAtom,
  legalTargetsAtom,
  selectedCardAtom,
  targetFocusByKeyAtom,
  tutorialStageWonAtom,
} from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";
import type { Tutorial } from "@/features/battle/tutorial";
import { closeText, selectCard, skipText } from "@/features/battle/tutorial";
import type { InspectDirection } from "@/features/battle/unit-inspect";
import { nextInspectedUnit } from "@/features/battle/unit-inspect";
import { profileAtom } from "@/features/profile/profile.atoms";

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
      selectCard(tutorial, current.view.sides.player.hand[handIndex])
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
  const recorded = recordStageResult(
    registry.get(profileAtom),
    finished,
    registry.get(battleRewardsAtom)
  );
  if (recorded) {
    registry.set(battleRewardsAtom, recorded.shown);
    registry.set(profileAtom, recorded.profile);
  }
};

/** The Battle state and the player's actions, for the HUD. */
export const useBattle = () => {
  const registry = useContext(RegistryContext);
  const session = useAtomValue(battleSessionAtom);
  const selected = useAtomValue(selectedCardAtom);
  const targets = useAtomValue(legalTargetsAtom);
  const focused = useAtomValue(focusedTargetAtom);
  const inspected = useAtomValue(inspectedUnitAtom);
  const detailsUnit = useAtomValue(detailsUnitAtom);
  const speed = useAtomValue(battleSpeedAtom);
  const setStoredSpeed = useAtomSet(battleSpeedAtom);

  // When the result shows (`ResultOverlay`), before the paint, so that it
  // shows with its rewards. The stored session, not the scene clock: after a
  // Skip, the clock is one frame behind it.
  useLayoutEffect(() => {
    if (session?.view.result && isIdle(session)) {
      recordResult(registry, session);
    }
  }, [registry, session]);

  /** The newest session: the scene clock can be ahead of the atom inside one event. */
  const live = (): BattleSession | null =>
    newestSession(registry.get(battleSessionAtom), playback.session);

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
    const next = playIfAble(live(), handIndex, target);
    if (!next) {
      return false;
    }
    unlockAudio();
    select(null);
    commit(next);
    return true;
  };

  return {
    session,
    selected,
    targets,
    focused,
    speed,
    canAct: whenSession(session, canAct, false),
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
    held: whenSession(session, isHeld, false),
    start: (options: BattleOptions) => {
      unlockAudio();
      playSound("select");
      select(null);
      registry.set(inspectedUnitAtom, null);
      playback.session = null;
      const tutorial = isTutorial(
        options.stageId,
        registry.get(tutorialStageWonAtom)
      );
      commit(startSession(options, speed, tutorial));
    },
    /** Back to the Campaign. Before a result, this is an Abandon: it records nothing. */
    leave: () => {
      select(null);
      registry.set(inspectedUnitAtom, null);
      playback.session = null;
      commit(null);
    },
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
    canEndTurn: whenSession(session, canEndTurn, false),
    endTurn: () => {
      const current = live();
      if (!current || !canEndTurn(current)) {
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
      if (current) {
        commit(skip(current));
      }
    },
    setSpeed: (value: BattleSpeed) => {
      setStoredSpeed(value);
      const current = live();
      if (current) {
        commit(setSpeed(current, value));
      }
    },
  };
};
