import { Target, getStarterDeck } from "@workspace/rules";
import { Atom, AtomRegistry } from "effect/reactivity";
import { describe, expect, it } from "vitest";

import { openBattleLog } from "@/features/battle/battle-log-session";
import { changeTutorial, startSession } from "@/features/battle/battle-session";
import type { BattleSession } from "@/features/battle/battle-session";
import { heroOf } from "@/features/battle/battle-view";
import type { UnitView } from "@/features/battle/battle-view";
import {
  battleLogAtom,
  battleSessionAtom,
  battleSpeedAtom,
  detailsUnitAtom,
  focusedTargetAtom,
  inspectedUnitAtom,
  legalTargetsAtom,
  selectedCardAtom,
  shownSessionAtom,
  soundOnAtom,
  soundVolumeAtom,
  targetFocusByKeyAtom,
  tutorialMarksAtom,
  tutorialStageWonAtom,
} from "@/features/battle/battle.atoms";
import { NO_MARKS, selectCard } from "@/features/battle/tutorial";
import { NEW_PLAYER } from "@/features/profile/profile";

const sessionWithReadyCard = () => {
  for (let seed = 1; seed < 50; seed += 1) {
    const session = startSession({
      stageId: "1-2",
      deck: getStarterDeck("vanguard"),
      player: NEW_PLAYER,
      seed,
    });
    const index = heroOf(session.view, "player").hand.findIndex(
      (card) => card.countdown === 0 && card.cardId?.startsWith("human")
    );
    if (index !== -1) {
      return { session, index };
    }
  }
  throw new Error("No seed with a Ready Creature Card");
};

/** A Halberdier Unit view of the player at Square 1 of Lane 1. */
const halberdier = (id: number): UnitView => ({
  id,
  owner: "player",
  hero: 0,
  source: { _tag: "Card", cardId: "human.halberdier" },
  rank: "common",
  lane: 0,
  position: 0,
  attack: 3,
  rallyBonus: 0,
  swarm: 0,
  swarmBonus: 0,
  bonusAttack: 0,
  bonusAttackTurns: 0,
  bonusRange: 0,
  bonusRangeTurns: 0,
  heroicBonus: 0,
  reborn: false,
  hp: 6,
  maxHp: 6,
  bulwark: 0,
  bonusBulwark: 0,
  bonusBulwarkTurns: 0,
  range: 0,
  flying: false,
  damageType: "physical",
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  grounded: 0,
  exposed: 0,
  exposedTurns: 0,
  frozen: false,
  paralyzed: false,
  entangled: false,
  ward: 0,
  steadfast: false,
  wall: false,
});

/** The session with these Units in its view, and with a result or not. */
const withUnits = (
  session: BattleSession,
  units: readonly UnitView[],
  finished = false
): BattleSession => ({
  ...session,
  view: {
    ...session.view,
    units,
    result: finished ? { winner: "player", reason: "heroDefeated" } : null,
  },
});

describe("legalTargetsAtom", () => {
  it("is empty without a Battle or a selected card", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(legalTargetsAtom)).toEqual([]);
    registry.set(
      battleSessionAtom,
      startSession({
        stageId: "1-1",
        deck: getStarterDeck("vanguard"),
        player: NEW_PLAYER,
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

describe("shownSessionAtom", () => {
  it("shows Live, or the selected moment of the open Battle Log", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(shownSessionAtom)).toBeNull();
    const { session } = sessionWithReadyCard();
    registry.set(battleSessionAtom, session);
    expect(registry.get(shownSessionAtom)).toBe(session);
    const log = openBattleLog(session);
    registry.set(battleLogAtom, log);
    expect(registry.get(shownSessionAtom)).toBe(log.shown);
    expect(registry.get(shownSessionAtom)).not.toBe(session);
  });
});

describe("detailsUnitAtom", () => {
  it("shows nothing without a Battle", () => {
    const registry = AtomRegistry.make();
    registry.set(inspectedUnitAtom, { unitId: 1, by: "pointer" });
    expect(registry.get(detailsUnitAtom)).toBeNull();
  });

  it("shows the inspected Unit while it is in the view", () => {
    const registry = AtomRegistry.make();
    const { session } = sessionWithReadyCard();
    registry.set(battleSessionAtom, withUnits(session, [halberdier(7)]));
    expect(registry.get(detailsUnitAtom)).toBeNull();
    registry.set(inspectedUnitAtom, { unitId: 7, by: "keyboard" });
    expect(registry.get(detailsUnitAtom)?.id).toBe(7);
    // A dead Unit is not in the view: its Card Details close.
    registry.set(battleSessionAtom, withUnits(session, []));
    expect(registry.get(detailsUnitAtom)).toBeNull();
  });

  it("shows the Unit on the target that an arrow key focused", () => {
    const registry = AtomRegistry.make();
    const { session, index } = sessionWithReadyCard();
    registry.set(battleSessionAtom, withUnits(session, [halberdier(7)]));
    registry.set(selectedCardAtom, index);
    // The first legal target is Square 1 of Lane 1, where the Unit is.
    expect(registry.get(legalTargetsAtom)[0]).toEqual(
      Target.Square({ lane: 0, position: 0 })
    );
    expect(registry.get(detailsUnitAtom)).toBeNull();
    registry.set(targetFocusByKeyAtom, true);
    expect(registry.get(detailsUnitAtom)?.id).toBe(7);
    registry.set(focusedTargetAtom, 1);
    expect(registry.get(detailsUnitAtom)).toBeNull();
  });

  it("shows nothing after the result, but shows the Unit in the Battle Log", () => {
    const registry = AtomRegistry.make();
    const { session } = sessionWithReadyCard();
    const finished = withUnits(session, [halberdier(7)], true);
    registry.set(battleSessionAtom, finished);
    registry.set(inspectedUnitAtom, { unitId: 7, by: "pointer" });
    expect(registry.get(detailsUnitAtom)).toBeNull();
    registry.set(battleLogAtom, { ...openBattleLog(session), shown: finished });
    expect(registry.get(detailsUnitAtom)?.id).toBe(7);
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
      (current) =>
        selectCard(current, heroOf(session.view, "player").hand[index])
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

  it("starts at volume 100, and keeps a change", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(soundVolumeAtom)).toBe(100);
    registry.set(soundVolumeAtom, 40);
    expect(registry.get(soundVolumeAtom)).toBe(40);
    // A server render has no localStorage: it uses the default.
    expect(Atom.getServerValue(soundVolumeAtom, registry)).toBe(100);
    // The value goes to localStorage: put the default back for other tests.
    registry.set(soundVolumeAtom, 100);
    registry.dispose();
  });
});
