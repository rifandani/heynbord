import { Target, getStarterDeck } from "@workspace/rules";
import { Atom, AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { changeTutorial, startSession } from "@/features/battle/battle-session";
import {
  battleSessionAtom,
  battleSpeedAtom,
  legalTargetsAtom,
  selectedCardAtom,
  soundOnAtom,
  tutorialMarksAtom,
  tutorialStageWonAtom,
} from "@/features/battle/battle.atoms";
import { NO_MARKS, selectCard } from "@/features/battle/tutorial";

const sessionWithReadyCard = () => {
  for (let seed = 1; seed < 50; seed += 1) {
    const session = startSession({
      stageId: "1-2",
      deck: getStarterDeck("vanguard"),
      seed,
    });
    const index = session.view.sides.player.hand.findIndex(
      (card) => card.countdown === 0 && card.cardId?.startsWith("human")
    );
    if (index !== -1) {
      return { session, index };
    }
  }
  throw new Error("No seed with a Ready Creature Card");
};

describe("legalTargetsAtom", () => {
  it("is empty without a Battle or a selected card", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(legalTargetsAtom)).toEqual([]);
    registry.set(
      battleSessionAtom,
      startSession({
        stageId: "1-1",
        deck: getStarterDeck("vanguard"),
        seed: 1,
      })
    );
    expect(registry.get(legalTargetsAtom)).toEqual([]);
  });

  it("gives the empty Summon Zone Squares for a Ready Creature Card", () => {
    const registry = AtomRegistry.make();
    const { session, index } = sessionWithReadyCard();
    registry.set(battleSessionAtom, session);
    registry.set(selectedCardAtom, index);
    expect(registry.get(legalTargetsAtom)).toEqual(
      [0, 1, 2].flatMap((lane) =>
        [0, 1, 2].map((position) => Target.Square({ lane, position }))
      )
    );
  });
});

describe("tutorialMarksAtom", () => {
  it("has no marks outside the Tutorial", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(tutorialMarksAtom)).toBe(NO_MARKS);
    expect(registry.get(tutorialStageWonAtom)).toBe(false);
  });

  it("shows the Step 2 arrow while the selected Ready Creature Card has targets", () => {
    const registry = AtomRegistry.make();
    const { session, index } = sessionWithReadyCard();
    const tutorial = changeTutorial(
      { ...session, tutorial: startSession(session.options, 1, true).tutorial },
      (current) => selectCard(current, session.view.sides.player.hand[index])
    );
    registry.set(battleSessionAtom, tutorial);
    expect(registry.get(tutorialMarksAtom)).toEqual({
      hand: true,
      summonLane: null,
      blockLane: null,
    });
    registry.set(selectedCardAtom, index);
    expect(registry.get(tutorialMarksAtom).summonLane).toBe(1);
  });
});

describe("player settings", () => {
  it("starts at speed ×1 with sound on, and keeps a change", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(battleSpeedAtom)).toBe(1);
    expect(registry.get(soundOnAtom)).toBe(true);
    registry.set(battleSpeedAtom, 2);
    registry.set(soundOnAtom, false);
    expect(registry.get(battleSpeedAtom)).toBe(2);
    expect(registry.get(soundOnAtom)).toBe(false);
    // A server render has no localStorage: it uses the defaults.
    expect(Atom.getServerValue(battleSpeedAtom, registry)).toBe(1);
    expect(Atom.getServerValue(soundOnAtom, registry)).toBe(true);
    registry.dispose();
  });
});
