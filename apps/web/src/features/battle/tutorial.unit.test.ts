import type { BattleEvent, BattleState, UnitSnapshot } from "@workspace/rules";
import { getCard, Target } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import type { BattleSession } from "@/features/battle/battle-session";
import {
  canAct,
  changeTutorial,
  endTurn,
  isHeld,
  isIdle,
  isTutorialStageWin,
  newestSession,
  playCard,
  skip,
  startSession,
  tick,
} from "@/features/battle/battle-session";
import type { HandCardView } from "@/features/battle/battle-view";
import { viewFromState } from "@/features/battle/battle-view";
import {
  afterEvent,
  atPlayPhase,
  beforeEvent,
  closeText,
  holdsPlayback,
  NO_MARKS,
  openText,
  selectCard,
  skipText,
  startTutorial,
  tutorialMarks,
} from "@/features/battle/tutorial";

const tutorialSession = (seed = 1) =>
  startSession({ stageId: "1-1", deckId: "vanguard", seed }, 1, true);

const READY_CREATURE: HandCardView = {
  instanceId: 1,
  cardId: "human.militiaRecruit",
  rank: "common",
  countdown: 0,
};
const READY_SKILL: HandCardView = {
  ...READY_CREATURE,
  cardId: "warrior.warDrums",
};

const { view } = tutorialSession();

const unit = (owner: "player" | "enemy", lane: number): UnitSnapshot => ({
  id: owner === "player" ? 1 : 2,
  owner,
  card: { instanceId: 9, cardId: "human.militiaRecruit", rank: "common" },
  lane,
  position: owner === "player" ? 0 : 11,
  attack: 1,
  hp: 1,
  maxHp: 1,
  speed: 1,
  range: 0,
  damageType: "physical",
  armor: 0,
  charge: false,
  flying: false,
  heroic: 0,
  lastBreath: 0,
  pivot: false,
  poison: false,
  regeneration: 0,
  retaliation: false,
  summonedTurn: 1,
  burn: 0,
  poisoned: 0,
  frozen: false,
  bonusArmor: 0,
  bonusArmorTurns: 0,
});

const summoned = (owner: "player" | "enemy", lane: number): BattleEvent => ({
  _tag: "UnitSummoned",
  unit: unit(owner, lane),
});

const moved = (unitId: number): BattleEvent => ({
  _tag: "UnitMoved",
  unitId,
  lane: 0,
  from: 0,
  to: 1,
});

const withUnits = (units: readonly UnitSnapshot[]) => ({
  ...view,
  units: viewFromState({
    ...tutorialSession().rules,
    units: units.map((item) => ({ ...item })),
  }).units,
});

describe("startTutorial", () => {
  it("shows Step 1 first, with a highlight on the Hand", () => {
    const tutorial = startTutorial();
    expect(tutorial.shown).toEqual(["ready"]);
    expect(openText(tutorial)).toBe("ready");
    expect(tutorialMarks(tutorial, undefined, 0)).toEqual({
      ...NO_MARKS,
      hand: true,
    });
  });
});

describe("Step 1: Countdown and Ready", () => {
  it("is done when the Player plays a Card or ends the Turn", () => {
    const played = afterEvent(startTutorial(), {
      _tag: "CardPlayed",
      side: "player",
      handIndex: 0,
      card: { instanceId: 1, cardId: "x", rank: "common" },
      target: Target.NoTarget(),
    });
    expect(played.done).toEqual(["ready"]);
    const ended = afterEvent(startTutorial(), {
      _tag: "TurnEnded",
      side: "player",
    });
    expect(ended.done).toEqual(["ready"]);
    expect(
      afterEvent(startTutorial(), { _tag: "TurnEnded", side: "enemy" })
    ).toEqual(startTutorial());
  });

  it("keeps its text after it is done: only Got it closes a text", () => {
    const ended = afterEvent(startTutorial(), {
      _tag: "TurnEnded",
      side: "player",
    });
    expect(openText(ended)).toBe("ready");
    expect(tutorialMarks(ended, undefined, 0).hand).toBe(false);
  });
});

describe("Step 2: the Summon Zone", () => {
  it("shows at the first selection of a Ready Creature Card", () => {
    const tutorial = startTutorial();
    expect(selectCard(tutorial, READY_SKILL)).toBe(tutorial);
    expect(selectCard(tutorial, { ...READY_CREATURE, countdown: 1 })).toBe(
      tutorial
    );
    expect(selectCard(tutorial, { ...READY_CREATURE, cardId: null })).toBe(
      tutorial
    );
    const selected = selectCard(tutorial, READY_CREATURE);
    expect(selected.shown).toEqual(["ready", "summonZone"]);
    // Only one text shows at a time: Step 2 waits behind Step 1.
    expect(selected.texts).toEqual(["ready", "summonZone"]);
    expect(selectCard(selected, READY_CREATURE)).toBe(selected);
  });

  it("points to the middle Lane only while the card is selected, until a summon in any Lane", () => {
    const selected = selectCard(startTutorial(), READY_CREATURE);
    expect(tutorialMarks(selected, READY_CREATURE, 9).summonLane).toBe(1);
    // A cancel hides the arrow. It comes back at the next selection.
    expect(tutorialMarks(selected, undefined, 0).summonLane).toBeNull();
    expect(tutorialMarks(selected, READY_CREATURE, 0).summonLane).toBeNull();
    const done = afterEvent(selected, summoned("player", 2));
    expect(done.done).toContain("summonZone");
    expect(tutorialMarks(done, READY_CREATURE, 9).summonLane).toBeNull();
    expect(afterEvent(selected, summoned("enemy", 2))).toBe(selected);
  });
});

describe("Step 3: the Resolution Phase", () => {
  const units = withUnits([unit("player", 0), unit("enemy", 0)]);

  it("shows at the first move or attack of a Player Unit, and holds playback until Got it", () => {
    const tutorial = closeText(startTutorial());
    expect(beforeEvent(tutorial, moved(2), units)).toBe(tutorial);
    const held = beforeEvent(tutorial, moved(1), units);
    expect(openText(held)).toBe("resolution");
    expect(holdsPlayback(held)).toBe(true);
    const attack = beforeEvent(
      tutorial,
      {
        _tag: "UnitAttacked",
        unitId: 1,
        target: { _tag: "Hero", side: "enemy" },
        ranged: false,
      },
      units
    );
    expect(attack.shown).toContain("resolution");
    const closed = closeText(held);
    expect(holdsPlayback(closed)).toBe(false);
    expect(closed.done).toContain("resolution");
    // It shows one time only.
    expect(beforeEvent(closed, moved(1), units)).toBe(closed);
  });

  it("holds nothing when the text is skipped", () => {
    const skipped = skipText(startTutorial());
    const shown = beforeEvent(skipped, moved(1), units);
    expect(shown.shown).toContain("resolution");
    expect(holdsPlayback(shown)).toBe(false);
    expect(openText(shown)).toBeNull();
    expect(
      holdsPlayback(skipText(beforeEvent(startTutorial(), moved(1), units)))
    ).toBe(false);
  });
});

/** A Player Play Phase with a Ready Creature Card in the Hand. */
const playPhase = (): BattleState => {
  const { rules } = tutorialSession();
  const [card] = rules.sides.player.hand;
  if (!card) {
    throw new Error("No card");
  }
  return {
    ...rules,
    turnNumber: 3,
    sides: {
      ...rules.sides,
      player: {
        ...rules.sides.player,
        hand: [
          {
            ...card,
            cardId: "human.militiaRecruit",
            countdown: 0,
          },
        ],
      },
    },
  };
};

const at = (units: readonly UnitSnapshot[], state = playPhase()) =>
  atPlayPhase(startTutorial(), {
    ...state,
    units: units.map((item) => ({ ...item })),
  });

describe("Step 4: the Lane choice", () => {
  it("highlights a Lane with an enemy Unit and no Player Unit", () => {
    const tutorial = at([
      unit("enemy", 2),
      unit("player", 0),
      unit("enemy", 0),
    ]);
    expect(tutorial.blockLane).toBe(2);
    expect(openText(tutorial)).toBe("ready");
    expect(tutorial.texts).toEqual(["ready", "laneChoice"]);
    expect(tutorialMarks(tutorial, undefined, 0).blockLane).toBe(2);
  });

  it("highlights the Lane of the enemy Unit nearest to the Player's Hero", () => {
    const far = unit("enemy", 0);
    const near = { ...unit("enemy", 2), id: 3, position: 6 };
    expect(at([far, near]).blockLane).toBe(2);
  });

  it("needs a Ready Creature Card, and checks each Play Phase only at its start", () => {
    const state = playPhase();
    const noCard = at([unit("enemy", 1)], {
      ...state,
      sides: {
        ...state.sides,
        player: { ...state.sides.player, hand: [] },
      },
    });
    expect(noCard.shown).toEqual(["ready"]);
    expect(noCard.checkedTurn).toBe(3);
    expect(
      atPlayPhase(noCard, { ...state, units: [{ ...unit("enemy", 1) }] })
    ).toBe(noCard);
    expect(
      at([unit("enemy", 1)], { ...state, activeSide: "enemy" }).shown
    ).toEqual(["ready"]);
    expect(at([unit("player", 1)]).shown).toEqual(["ready"]);
  });

  it("is done at a summon into that Lane, or at the end of the Play Phase", () => {
    const tutorial = at([unit("enemy", 2)]);
    expect(afterEvent(tutorial, summoned("player", 0)).done).not.toContain(
      "laneChoice"
    );
    expect(afterEvent(tutorial, summoned("player", 2)).done).toContain(
      "laneChoice"
    );
    expect(
      afterEvent(tutorial, { _tag: "TurnEnded", side: "player" }).done
    ).toContain("laneChoice");
  });
});

describe("Step text", () => {
  it("shows one text at a time; Skip hides all text but keeps the highlights", () => {
    const tutorial = selectCard(startTutorial(), READY_CREATURE);
    expect(openText(closeText(tutorial))).toBe("summonZone");
    expect(closeText(closeText(closeText(tutorial))).texts).toEqual([]);
    const skipped = skipText(tutorial);
    expect(openText(skipped)).toBeNull();
    expect(tutorialMarks(skipped, READY_CREATURE, 9)).toEqual({
      hand: true,
      summonLane: 1,
      blockLane: null,
    });
    expect(selectCard(skipText(startTutorial()), READY_CREATURE).texts).toEqual(
      []
    );
    expect(tutorialMarks(null, READY_CREATURE, 9)).toBe(NO_MARKS);
  });
});

/** Plays until a Player Unit is about to move or attack. */
const toFirstResolution = (start: BattleSession): BattleSession => {
  let session = changeTutorial(start, closeText);
  for (let turn = 0; turn < 10 && !isHeld(session); turn += 1) {
    const index = session.rules.sides.player.hand.findIndex(
      (card) => card.countdown === 0 && getCard(card.cardId).kind === "creature"
    );
    if (index !== -1) {
      session = skip(
        Result.getOrThrow(
          playCard(session, index, Target.Square({ lane: 1, position: 0 }))
        )
      );
    }
    session = skip(Result.getOrThrow(endTurn(session)));
    while (!isHeld(session) && session.tutorial && openText(session.tutorial)) {
      session = changeTutorial(session, closeText);
    }
  }
  return session;
};

describe("the Tutorial in a Battle session", () => {
  it("is only in a Tutorial play", () => {
    expect(
      startSession({ stageId: "1-1", deckId: "vanguard", seed: 1 }).tutorial
    ).toBeNull();
    expect(tutorialSession().tutorial?.shown).toEqual(["ready"]);
  });

  it("holds playback at Step 3: tick and Skip stop there until Got it", () => {
    const held = toFirstResolution(tutorialSession());
    expect(isHeld(held)).toBe(true);
    expect(isIdle(held)).toBe(false);
    expect(canAct(held)).toBe(false);
    expect(openText(held.tutorial)).toBe("resolution");
    expect(tick(held, 5000)).toBe(held);
    expect(skip(held).queue).toEqual(held.queue);
    // The hold is only in the web playback: the rules state is already at the next Player Turn.
    expect(held.rules.activeSide).toBe("player");
    expect(held.view).not.toEqual(viewFromState(held.rules));
    const released = changeTutorial(held, closeText);
    expect(isHeld(released)).toBe(false);
    expect(skip(released).queue).toEqual([]);
    expect(tick(released, 1).current).not.toBeNull();
  });

  it("does not hold playback when the text is skipped", () => {
    const session = changeTutorial(tutorialSession(), skipText);
    const ended = skip(Result.getOrThrow(endTurn(session)));
    expect(isHeld(ended)).toBe(false);
    expect(changeTutorial(ended, skipText)).toBe(ended);
  });

  it("lets a Tutorial change from the HUD win over the scene clock", () => {
    const stored = tutorialSession();
    const ahead = { ...stored, elapsed: 50 };
    expect(newestSession(stored, ahead)).toBe(ahead);
    const closed = changeTutorial(stored, closeText);
    expect(newestSession(closed, ahead)).toBe(closed);
  });
});

const finished = (stageId: string, winner: "player" | "enemy") => {
  const session = startSession({ stageId, deckId: "vanguard", seed: 1 });
  return {
    ...session,
    rules: {
      ...session.rules,
      phase: "finished" as const,
      result: { winner, reason: "heroDefeated" as const },
    },
  };
};

describe("isTutorialStageWin", () => {
  it("is a Player win of Stage 1-1 only", () => {
    expect(isTutorialStageWin(finished("1-1", "player"))).toBe(true);
    expect(isTutorialStageWin(finished("1-1", "enemy"))).toBe(false);
    expect(isTutorialStageWin(finished("1-2", "player"))).toBe(false);
    expect(isTutorialStageWin(tutorialSession())).toBe(false);
    expect(isTutorialStageWin(null)).toBe(false);
  });
});
