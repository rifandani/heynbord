import { RegistryContext, useAtomSet, useAtomValue } from "@effect/atom-react";
import type { Target } from "@workspace/rules";
import { isTutorial } from "@workspace/rules";
import { Result } from "effect";
import { useContext } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
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
  isTutorialStageWin,
  newestSession,
  playIfAble,
  setSpeed,
  skip,
  startSession,
} from "@/features/battle/battle-session";
import type { BattleSpeed } from "@/features/battle/battle-timeline";
import {
  battleSessionAtom,
  battleSpeedAtom,
  focusedTargetAtom,
  legalTargetsAtom,
  selectedCardAtom,
  tutorialStageWonAtom,
} from "@/features/battle/battle.atoms";
import { playback } from "@/features/battle/scene/playback";
import type { Tutorial } from "@/features/battle/tutorial";
import { closeText, selectCard, skipText } from "@/features/battle/tutorial";

/** A new Battle seed. The seed is input to the rules, so this is not a rule. */
export const randomSeed = (): number =>
  Math.floor(Math.random() * 2_147_483_647);

/** The Battle state and the player's actions, for the HUD. */
export const useBattle = () => {
  const registry = useContext(RegistryContext);
  const session = useAtomValue(battleSessionAtom);
  const selected = useAtomValue(selectedCardAtom);
  const targets = useAtomValue(legalTargetsAtom);
  const focused = useAtomValue(focusedTargetAtom);
  const speed = useAtomValue(battleSpeedAtom);
  const setStoredSpeed = useAtomSet(battleSpeedAtom);

  /** The newest session: the scene clock can be ahead of the atom inside one event. */
  const live = (): BattleSession | null =>
    newestSession(registry.get(battleSessionAtom), playback.session);

  const commit = (next: BattleSession | null) => {
    registry.set(battleSessionAtom, next);
  };

  const select = (handIndex: number | null) => {
    registry.set(selectedCardAtom, handIndex);
    registry.set(focusedTargetAtom, 0);
  };

  const updateTutorial = (change: (tutorial: Tutorial) => Tutorial) => {
    const current = live();
    const next = current && changeTutorial(current, change);
    if (next !== current) {
      commit(next);
    }
  };

  /** The Stage results before a new Battle or the Stage select (in memory until the Profile). */
  const recordResult = () => {
    if (isTutorialStageWin(live())) {
      registry.set(tutorialStageWonAtom, true);
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
    canAct: session ? canAct(session) : false,
    /** Tutorial Step 3 holds the playback until its text closes. */
    held: session ? isHeld(session) : false,
    start: (options: BattleOptions) => {
      unlockAudio();
      playSound("select");
      recordResult();
      select(null);
      playback.session = null;
      const tutorial = isTutorial(
        options.stageId,
        registry.get(tutorialStageWonAtom)
      );
      commit(startSession(options, speed, tutorial));
    },
    /** The Stage select. Before a result, this is an Abandon: it records nothing. */
    leave: () => {
      recordResult();
      select(null);
      playback.session = null;
      commit(null);
    },
    select: (handIndex: number | null) => {
      unlockAudio();
      if (handIndex !== null) {
        playSound("select");
      }
      select(handIndex);
      const current = live();
      if (handIndex !== null && current && canAct(current)) {
        updateTutorial((tutorial) =>
          selectCard(tutorial, current.view.sides.player.hand[handIndex])
        );
      }
    },
    closeTutorialText: () => updateTutorial(closeText),
    skipTutorialText: () => updateTutorial(skipText),
    play,
    focusTarget: (step: number) => {
      const count = registry.get(legalTargetsAtom).length;
      if (count > 0) {
        registry.set(
          focusedTargetAtom,
          (registry.get(focusedTargetAtom) + step + count) % count
        );
      }
    },
    canEndTurn: session ? canEndTurn(session) : false,
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
