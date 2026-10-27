import type { Target } from "@workspace/rules";
import { legalTargets, TUTORIAL_STAGE_ID } from "@workspace/rules";
import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";
import type { BattleLogState } from "@/features/battle/battle-log-session";
import type { ShownRewards } from "@/features/battle/battle-rewards";
import type { BattleSession } from "@/features/battle/battle-session";
import { canAct } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import { heroOf } from "@/features/battle/battle-view";
import type { ControlsGuideLine } from "@/features/battle/components/battle-keys";
import { PLAYER_HERO } from "@/features/battle/player-hero";
import type { TutorialMarks } from "@/features/battle/tutorial";
import { tutorialMarks } from "@/features/battle/tutorial";
import { unitAtTarget } from "@/features/battle/unit-inspect";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";

/** The Battle on the screen, or `null` on the Town or the Campaign. App state, so kept alive. */
export const battleSessionAtom = Atom.make<BattleSession | null>(null).pipe(
  Atom.keepAlive
);

/**
 * The open Battle Log (GDD 11.2), or `null` when Live shows. Live pauses
 * while it is open. It goes away when the Player leaves the Battle.
 */
export const battleLogAtom = Atom.make<BattleLogState | null>(null).pipe(
  Atom.keepAlive
);

/**
 * The open Controls Guide (UI-02), or `null`. `line` is the line that the
 * Controls Guide marks, or `null`: "Read more" on a Hint for a screen control
 * opens the Controls Guide at the line of its input (GDD 8.3). It closes when
 * the Battle goes.
 */
export const controlsGuideAtom = Atom.make<{
  readonly line: ControlsGuideLine | null;
} | null>(null);

/** The connected Battle pad; the guide must not name buttons after it goes. */
export const padIdAtom = Atom.make<string | null>(null).pipe(Atom.keepAlive);

/**
 * The session that the scene and the HUD show: the selected moment of the
 * open Battle Log, else Live. Commands always go to the Live session.
 */
export const shownSessionAtom = Atom.make(
  (get): BattleSession | null =>
    get(battleLogAtom)?.shown ?? get(battleSessionAtom)
);

/**
 * The rewards of the last Battle result (GDD 11.4), which are already in the
 * Profile. The result shows them while its Battle is on the screen. App state,
 * so kept alive.
 */
export const battleRewardsAtom = Atom.make<ShownRewards | null>(null).pipe(
  Atom.keepAlive
);

/** The Hand index of the card that the player selected to play. */
export const selectedCardAtom = Atom.make<number | null>(null).pipe(
  Atom.keepAlive
);

/** The index in `legalTargetsAtom` that the keyboard focuses. */
export const focusedTargetAtom = Atom.make(0).pipe(Atom.keepAlive);

/** The legal targets of the selected card, when the player can act. */
export const legalTargetsAtom = Atom.make((get): readonly Target[] => {
  const session = get(battleSessionAtom);
  const selected = get(selectedCardAtom);
  // All Live input is off in the Battle Log.
  if (
    !session ||
    selected === null ||
    !canAct(session) ||
    get(battleLogAtom) !== null
  ) {
    return [];
  }
  return legalTargets(session.rules, PLAYER_HERO, selected);
});

/**
 * The Unit that the player inspects (UI-05). `pointer` is a hover or a long
 * press. `keyboard` is the Inspect mode of the I key, where the arrow keys go
 * from Unit to Unit.
 */
export interface InspectedUnit {
  readonly unitId: number;
  readonly by: "pointer" | "keyboard";
}

export const inspectedUnitAtom = Atom.make<InspectedUnit | null>(null).pipe(
  Atom.keepAlive
);

/**
 * True after an arrow key moved the target focus. Then the Unit on the focused
 * Square shows its Card Details. A mouse selection does not open them.
 */
export const targetFocusByKeyAtom = Atom.make(false).pipe(Atom.keepAlive);

/**
 * The Unit whose Card Details show now, or `null`: the inspected Unit, else
 * the Unit on the target that the keyboard focuses. A dead Unit is not in the
 * view, so its Card Details close. Nothing shows after the result, but the
 * Battle Log shows the values of the Unit at the selected moment.
 */
export const detailsUnitAtom = Atom.make((get): UnitView | null => {
  const session = get(shownSessionAtom);
  if (!session || (session.view.result && get(battleLogAtom) === null)) {
    return null;
  }
  const { units } = session.view;
  const inspected = get(inspectedUnitAtom);
  const unitId =
    inspected?.unitId ??
    (get(targetFocusByKeyAtom)
      ? unitAtTarget(units, get(legalTargetsAtom)[get(focusedTargetAtom)])
      : null);
  return units.find((unit) => unit.id === unitId) ?? null;
});

/** The Tutorial arrows and highlights to show now (GDD 8.3). */
export const tutorialMarksAtom = Atom.make((get): TutorialMarks => {
  const session = get(battleSessionAtom);
  const selected = get(selectedCardAtom);
  return tutorialMarks(
    session?.tutorial ?? null,
    selected === null || !session
      ? undefined
      : heroOf(session.view, "player").hand[selected],
    get(legalTargetsAtom).length
  );
});

/** True when Stage 1-1 has a result: the input of `isTutorial`. */
export const tutorialStageWonAtom = Atom.make(
  (get) => (get(stageResultsAtom)[TUTORIAL_STAGE_ID] ?? 0) > 0
);

const BattleSpeed = Schema.Literals([1, 2]);

/** Battle speed ×1 or ×2. The player's choice stays for the next Battle. */
export const battleSpeedAtom = Atom.kvs({
  defaultValue: () => 1 as const,
  key: "heynbord.battle-speed",
  runtime: storageRuntime,
  schema: BattleSpeed,
}).pipe(Atom.withServerValue(() => 1 as const));
