import type { Target } from "@workspace/rules";
import { legalTargets } from "@workspace/rules";
import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";
import type { BattleSession } from "@/features/battle/battle-session";
import { canAct } from "@/features/battle/battle-session";
import type { TutorialMarks } from "@/features/battle/tutorial";
import { tutorialMarks } from "@/features/battle/tutorial";

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
