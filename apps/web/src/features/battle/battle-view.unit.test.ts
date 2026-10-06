import type { BattleState } from "@workspace/rules";
import {
  BattleEvent,
  chooseCommand,
  createBattle,
  getStage,
  getStarterDeck,
  step,
} from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { applyEvent, viewFromState } from "@/features/battle/battle-view";

/** Runs a Battle with the AI on both sides and returns each step. */
const steps = (seed: number, stageId: string, deckId: string) => {
  const deck = getStarterDeck(deckId);
  let { state } = createBattle({
    seed,
    stage: getStage(stageId),
    player: {
      classId: deck.classId,
      deck: deck.deck,
      level: 10,
      gear: { weapon: 3, armor: 3, trinket: 3, banner: 3 },
    },
  });
  const result: {
    before: BattleState;
    after: BattleState;
    events: readonly BattleEvent[];
  }[] = [];
  while (state.phase !== "finished") {
    const output = Result.getOrThrow(step(state, chooseCommand(state)));
    result.push({ before: state, after: output.state, events: output.events });
    ({ state } = output);
  }
  return result;
};

describe("applyEvent", () => {
  it.each([
    [3, "1-1", "vanguard"],
    [8, "1-3", "raiders"],
    [21, "1-10", "vanguard"],
    [5, "1-10", "raiders"],
  ])(
    "rebuilds the view of the next state from the events (seed %i, Stage %s, %s)",
    (seed, stageId, deckId) => {
      for (const { before, after, events } of steps(seed, stageId, deckId)) {
        expect(events.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  );
});

describe("viewFromState", () => {
  it("hides the enemy's cards but shows their Countdowns", () => {
    const deck = getStarterDeck("raiders");
    const { state } = createBattle({
      seed: 4,
      stage: getStage("1-2"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    const view = viewFromState(state);
    expect(
      view.sides.enemy.hand.every(
        (card) => card.cardId === null && card.rank === null
      )
    ).toBe(true);
    expect(view.sides.enemy.hand.map((card) => card.countdown)).toEqual(
      state.sides.enemy.hand.map((card) => card.countdown)
    );
    expect(view.sides.player.hand.map((card) => card.cardId)).toEqual(
      state.sides.player.hand.map((card) => card.cardId)
    );
  });
});

describe("the Graveyard view", () => {
  it("puts each new card on top: a dead Unit, then a Skill Card that is not Recalled", () => {
    const deck = getStarterDeck("vanguard");
    const { state } = createBattle({
      seed: 3,
      stage: getStage("1-1"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    const start = viewFromState(state);
    const view = {
      ...start,
      units: [
        {
          id: 7,
          owner: "player" as const,
          cardId: "orc.badlandPup",
          rank: "common" as const,
          lane: 0,
          position: 2,
          attack: 3,
          hp: 1,
          maxHp: 2,
          armor: 0,
          bonusArmor: 0,
          bonusArmorTurns: 0,
          range: 1,
          flying: false,
          damageType: "physical" as const,
          burn: 0,
          poisoned: 0,
          hobbled: 0,
          frozen: false,
        },
      ],
    };
    const events: BattleEvent[] = [
      BattleEvent.UnitDied({ unitId: 7 }),
      BattleEvent.RecallRolled({
        side: "player",
        card: { instanceId: 40, cardId: "mage.fireball", rank: "rare" },
        success: false,
      }),
    ];
    expect(events.reduce(applyEvent, view).sides.player.graveyard).toEqual([
      { cardId: "orc.badlandPup", rank: "common" },
      { cardId: "mage.fireball", rank: "rare" },
    ]);
  });
});

describe("the bonus Armor view", () => {
  it("counts down the Turns in each End Step of the owner, then the Armor fades", () => {
    const deck = getStarterDeck("vanguard");
    const { state } = createBattle({
      seed: 3,
      stage: getStage("1-1"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    const unit = {
      id: 7,
      owner: "player" as const,
      cardId: "orc.badlandPup",
      rank: "common" as const,
      lane: 0,
      position: 2,
      attack: 3,
      hp: 2,
      maxHp: 2,
      armor: 0,
      bonusArmor: 0,
      bonusArmorTurns: 0,
      range: 1,
      flying: false,
      damageType: "physical" as const,
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      frozen: false,
    };
    const view = { ...viewFromState(state), units: [unit] };
    const armorOf = (events: readonly BattleEvent[]) => {
      const [after] = events.reduce(applyEvent, view).units;
      return [after?.bonusArmor, after?.bonusArmorTurns];
    };
    const gained = BattleEvent.ArmorGained({ unitId: 7, armor: 1, turns: 2 });
    expect(armorOf([gained])).toEqual([1, 2]);
    expect(
      armorOf([gained, BattleEvent.TurnEnded({ side: "player" })])
    ).toEqual([1, 2]);
    expect(armorOf([gained, BattleEvent.TurnEnded({ side: "enemy" })])).toEqual(
      [1, 1]
    );
    expect(
      armorOf([
        gained,
        BattleEvent.TurnEnded({ side: "enemy" }),
        BattleEvent.ArmorFaded({ unitId: 7 }),
        BattleEvent.TurnEnded({ side: "player" }),
      ])
    ).toEqual([0, 0]);
  });
});

describe("the Hobbled view", () => {
  it("sets the count from a Hobble event, and lowers it only for that Side when the Turn ends", () => {
    const deck = getStarterDeck("vanguard");
    const { state } = createBattle({
      seed: 3,
      stage: getStage("1-1"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    const unit = {
      id: 7,
      owner: "player" as const,
      cardId: "orc.badlandPup",
      rank: "common" as const,
      lane: 0,
      position: 2,
      attack: 3,
      hp: 2,
      maxHp: 2,
      armor: 0,
      bonusArmor: 0,
      bonusArmorTurns: 0,
      range: 0,
      flying: false,
      damageType: "physical" as const,
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      frozen: false,
    };
    const view = {
      ...viewFromState(state),
      units: [unit, { ...unit, id: 8, owner: "enemy" as const, hobbled: 2 }],
    };
    const applied = applyEvent(
      view,
      BattleEvent.StatusApplied({ unitId: 7, status: "hobble", count: 3 })
    );
    expect(applied.units.map((candidate) => candidate.hobbled)).toEqual([3, 2]);
    const ended = applyEvent(
      applied,
      BattleEvent.TurnEnded({ side: "player" })
    );
    expect(ended.units.map((candidate) => candidate.hobbled)).toEqual([2, 2]);
  });
});

describe("a push", () => {
  it("sets the Unit Square to the end of UnitPushed", () => {
    const deck = getStarterDeck("vanguard");
    const { state } = createBattle({
      seed: 3,
      stage: getStage("1-1"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    const unit = {
      id: 7,
      owner: "enemy" as const,
      cardId: "human.militiaRecruit",
      rank: "common" as const,
      lane: 0,
      position: 5,
      attack: 2,
      hp: 4,
      maxHp: 4,
      armor: 0,
      bonusArmor: 0,
      bonusArmorTurns: 0,
      range: 0,
      flying: false,
      damageType: "physical" as const,
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      frozen: false,
    };
    const view = { ...viewFromState(state), units: [unit] };
    const next = applyEvent(
      view,
      BattleEvent.UnitPushed({ unitId: 7, lane: 0, from: 5, to: 7 })
    );
    expect(next.units[0]?.position).toBe(7);
  });
});
