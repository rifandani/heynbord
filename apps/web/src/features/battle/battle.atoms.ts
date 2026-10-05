import type { Target } from "@workspace/rules";
import { legalTargets } from "@workspace/rules";
import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";
import type { BattleSession } from "@/features/battle/battle-session";
import { canAct } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import type { TutorialMarks } from "@/features/battle/tutorial";
import { tutorialMarks } from "@/features/battle/tutorial";
import { unitAtTarget } from "@/features/battle/unit-inspect";

/** The Battle on the screen, or `null` on the Stage select. App state, so kept alive. */
export const battleSessionAtom = Atom.make<BattleSession | null>(null).pipe(
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
  if (!session || selected === null || !canAct(session)) {
    return [];
  }
  return legalTargets(session.rules, selected);
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
 * view, so its Card Details close. Nothing shows after the result.
 */
export const detailsUnitAtom = Atom.make((get): UnitView | null => {
  const session = get(battleSessionAtom);
  if (!session || session.view.result) {
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
    selected === null ? undefined : session?.view.sides.player.hand[selected],
    get(legalTargetsAtom).length
  );
});

/**
 * True after a win of Stage 1-1, the input of `isTutorial`. It is in memory
 * until the Profile keeps the Stage results: a page load shows the Tutorial
 * again until a win.
 */
export const tutorialStageWonAtom = Atom.make(false).pipe(Atom.keepAlive);

const BattleSpeed = Schema.Literals([1, 2]);

/** Battle speed ×1 or ×2. The player's choice stays for the next Battle. */
export const battleSpeedAtom = Atom.kvs({
  defaultValue: () => 1 as const,
  key: "heynbord.battle-speed",
  runtime: storageRuntime,
  schema: BattleSpeed,
}).pipe(Atom.withServerValue(() => 1 as const));

/** Sound on or off. */
export const soundOnAtom = Atom.kvs({
  defaultValue: () => true,
  key: "heynbord.sound-on",
  runtime: storageRuntime,
  schema: Schema.Boolean,
}).pipe(Atom.withServerValue(() => true));
