import type { BattleState, StageDefinition } from "@workspace/rules";
import {
  BattleEvent,
  Command,
  chooseCommand,
  createBattle,
  getStage,
  getStarterDeck,
  legalTargets,
  step,
} from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import type { HandCardView } from "@/features/battle/battle-view";
import {
  applyEvent,
  countdownStates,
  viewFromState,
} from "@/features/battle/battle-view";

/** Runs a Battle with the AI on both sides and returns each step. */
const steps = (
  seed: number,
  stageId: string,
  deckId: string,
  stage: StageDefinition = getStage(stageId)
) => {
  const deck = getStarterDeck(deckId);
  let { state } = createBattle({
    seed,
    stage,
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

/** Stage 1-4 with an enemy Deck of Goblin and Feral cards. */
const goblinAndFeralStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cardIds = [
    "goblin.tunnelSaboteur",
    "goblin.grandGearjammer",
    "goblin.junkBarricade",
    "feral.bristlebackBoar",
    "elf.canopyVinewarden",
    "feral.frostElkMatriarch",
    "feral.cragRhino",
  ];
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      deck: cardIds.flatMap((cardId) =>
        Array.from({ length: 2 }, () => ({ cardId, rank: "epic" as const }))
      ),
    },
  };
};

describe("applyEvent with Sabotage, Trample, Entangle and Rally", () => {
  it.each([1, 2, 3])(
    "rebuilds the view of the next state from the events (seed %i)",
    (seed) => {
      const all = steps(seed, "1-4", "vanguard", goblinAndFeralStage());
      for (const { before, after, events } of all) {
        expect(events.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
      expect(
        all.some(({ events }) =>
          events.some((event) => event._tag === "CardSabotaged")
        )
      ).toBe(true);
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
          cardId: "orc.badlandRunt",
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
          bleeding: 0,
          frozen: false,
          entangled: false,
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
      { cardId: "orc.badlandRunt", rank: "common" },
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
      cardId: "orc.badlandRunt",
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
      bleeding: 0,
      frozen: false,
      entangled: false,
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

describe("the Hobbled and Bleeding view", () => {
  it("sets each count from its Hobble or Bleed event, and lowers it only for that Side when the Turn ends", () => {
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
      cardId: "orc.badlandRunt",
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
      bleeding: 0,
      frozen: false,
      entangled: false,
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

    const bled = applyEvent(
      {
        ...view,
        units: [unit, { ...unit, id: 8, owner: "enemy" as const, bleeding: 2 }],
      },
      BattleEvent.StatusApplied({ unitId: 7, status: "bleed", count: 3 })
    );
    expect(bled.units.map((candidate) => candidate.bleeding)).toEqual([3, 2]);
    const bledEnded = applyEvent(
      bled,
      BattleEvent.TurnEnded({ side: "player" })
    );
    expect(bledEnded.units.map((candidate) => candidate.bleeding)).toEqual([
      2, 2,
    ]);
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
      bleeding: 0,
      frozen: false,
      entangled: false,
    };
    const view = { ...viewFromState(state), units: [unit] };
    const next = applyEvent(
      view,
      BattleEvent.UnitPushed({ unitId: 7, lane: 0, from: 5, to: 7 })
    );
    expect(next.units[0]?.position).toBe(7);
  });
});

describe("a card that Unique blocks (GDD 5.4)", () => {
  it("is blocked when its Unit is summoned, and free again when the Unit dies", () => {
    const deck = getStarterDeck("vanguard");
    const { state } = createBattle({
      seed: 3,
      stage: getStage("1-2"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    const voss = "human.marshalElianVoss";
    state.sides.player.hand = [
      { instanceId: 901, cardId: voss, rank: "epic", countdown: 0 },
      { instanceId: 902, cardId: voss, rank: "legendary", countdown: 0 },
    ];
    const before = viewFromState(state);
    expect(before.sides.player.hand.map((card) => card.blocked)).toEqual([
      false,
      false,
    ]);
    const [target] = legalTargets(state, 0);
    if (!target) {
      throw new Error("Expected a legal target");
    }
    const { state: after, events } = Result.getOrThrow(
      step(state, Command.PlayCard({ handIndex: 0, target }))
    );
    const played = events.reduce(applyEvent, before);
    expect(played).toEqual(viewFromState(after));
    expect(played.sides.player.hand).toEqual([
      expect.objectContaining({ instanceId: 902, blocked: true }),
    ]);
    const unitId = played.units.find((unit) => unit.cardId === voss)?.id ?? -1;
    const died = applyEvent(played, BattleEvent.UnitDied({ unitId }));
    expect(died.sides.player.hand[0]?.blocked).toBe(false);
  });

  it("is never set on a card that the player cannot see", () => {
    const deck = getStarterDeck("vanguard");
    const { state } = createBattle({
      seed: 3,
      stage: getStage("1-2"),
      player: {
        classId: deck.classId,
        deck: deck.deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    expect(
      viewFromState(state).sides.enemy.hand.every((card) => !card.blocked)
    ).toBe(true);
  });
});

describe("the Entangled view", () => {
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
    bleeding: 0,
    frozen: false,
    entangled: false,
  };
  const view = { ...viewFromState(state), units: [unit] };
  const entangled = applyEvent(
    view,
    BattleEvent.StatusApplied({ unitId: 7, status: "entangle" })
  );

  it("sets Entangled from its Entangle event", () => {
    expect(entangled.units[0]?.entangled).toBe(true);
  });

  it("ends Entangled with the next action of the Unit: an attack or a skip", () => {
    const attacked = applyEvent(
      entangled,
      BattleEvent.UnitAttacked({
        unitId: 7,
        target: { _tag: "Hero", side: "player" },
        ranged: false,
      })
    );
    expect(attacked.units[0]?.entangled).toBe(false);
    const skipped = applyEvent(
      entangled,
      BattleEvent.UnitSkipped({ unitId: 7 })
    );
    expect(skipped.units[0]?.entangled).toBe(false);
  });

  it("ends Entangled at the end of the owner's Turn, also for a Unit with no action", () => {
    const otherSide = applyEvent(
      entangled,
      BattleEvent.TurnEnded({ side: "player" })
    );
    expect(otherSide.units[0]?.entangled).toBe(true);
    const ownSide = applyEvent(
      entangled,
      BattleEvent.TurnEnded({ side: "enemy" })
    );
    expect(ownSide.units[0]?.entangled).toBe(false);
  });
});

/** A Hand of hidden cards with these Countdowns, oldest first. */
const hand = (...countdowns: number[]): HandCardView[] =>
  countdowns.map((countdown, instanceId) => ({
    instanceId,
    cardId: null,
    rank: null,
    countdown,
    blocked: false,
  }));

describe("countdownStates (ADR-0021)", () => {
  it("marks the 3 oldest cards that are not Ready as Ticking Cards, also with Ready cards between them", () => {
    expect(countdownStates(hand(0, 2, 0, 3, 1, 4, 2))).toEqual([
      "ready",
      "ticking",
      "ready",
      "ticking",
      "ticking",
      "waiting",
      "waiting",
    ]);
  });

  it("moves the mark when Sabotage makes an older Ready card wait again", () => {
    expect(countdownStates(hand(0, 2, 3, 4))).toEqual([
      "ready",
      "ticking",
      "ticking",
      "ticking",
    ]);
    // Sabotage gives the Ready card +1. It keeps its place, so it is a
    // Ticking Card again, and the youngest Ticking Card waits.
    expect(countdownStates(hand(1, 2, 3, 4))).toEqual([
      "ticking",
      "ticking",
      "ticking",
      "waiting",
    ]);
  });

  it("has no Waiting Card with 3 or fewer cards that are not Ready", () => {
    expect(countdownStates(hand(2, 0, 5))).toEqual([
      "ticking",
      "ready",
      "ticking",
    ]);
  });
});
