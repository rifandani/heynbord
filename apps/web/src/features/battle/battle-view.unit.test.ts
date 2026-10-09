import type {
  BattleState,
  StageDefinition,
  UnitSnapshot,
} from "@workspace/rules";
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

import type { BattleView } from "@/features/battle/battle-view";
import { applyEvent, viewFromState } from "@/features/battle/battle-view";

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
  while (state.status !== "finished") {
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
      expect(
        all.some(({ events }) =>
          events.some((event) => event._tag === "UnitsRallied")
        )
      ).toBe(true);
    }
  );
});

/** Stage 1-4 with an enemy Deck of Undead cards: Swarm, Rebirth and Summon. */
const undeadStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cardIds = [
    "undead.graveyardDrudge",
    "undead.hushbow",
    "undead.graveBellTender",
    "undead.chatteringCohort",
    "undead.coffinLancer",
    "undead.lanternWidow",
    "undead.boneRampart",
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

describe("applyEvent with Swarm, Rebirth and Summon", () => {
  const battles = [1, 2, 3].map((seed) =>
    steps(seed, "1-4", "vanguard", undeadStage())
  );

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events } of all) {
        expect(events.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("has Tokens, Rebirths and a Swarm bonus in these Battles", () => {
    const all = battles.flat();
    const tags = new Set(
      all.flatMap(({ events }) => events.map((event) => event._tag))
    );
    expect(tags.has("TokenSummoned")).toBe(true);
    expect(tags.has("UnitReborn")).toBe(true);
    expect(
      all.some(({ after }) =>
        viewFromState(after).units.some((unit) => unit.swarmBonus > 0)
      )
    ).toBe(true);
  });
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
          source: { _tag: "Card" as const, cardId: "orc.badlandRunt" },
          rank: "common" as const,
          lane: 0,
          position: 2,
          attack: 3,
          rallyBonus: 0,
          swarm: 0,
          swarmBonus: 0,
          reborn: false,
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
          wall: false,
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
  it("counts down the Turns in each End Phase of the owner, then the Armor fades", () => {
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
      source: { _tag: "Card" as const, cardId: "orc.badlandRunt" },
      rank: "common" as const,
      lane: 0,
      position: 2,
      attack: 3,
      rallyBonus: 0,
      swarm: 0,
      swarmBonus: 0,
      reborn: false,
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
      wall: false,
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
      source: { _tag: "Card" as const, cardId: "orc.badlandRunt" },
      rank: "common" as const,
      lane: 0,
      position: 2,
      attack: 3,
      rallyBonus: 0,
      swarm: 0,
      swarmBonus: 0,
      reborn: false,
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
      wall: false,
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
      source: { _tag: "Card" as const, cardId: "human.militiaRecruit" },
      rank: "common" as const,
      lane: 0,
      position: 5,
      attack: 2,
      rallyBonus: 0,
      swarm: 0,
      swarmBonus: 0,
      reborn: false,
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
      wall: false,
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
    const unitId =
      played.units.find(
        (unit) => unit.source._tag === "Card" && unit.source.cardId === voss
      )?.id ?? -1;
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
    source: { _tag: "Card" as const, cardId: "human.militiaRecruit" },
    rank: "common" as const,
    lane: 0,
    position: 5,
    attack: 2,
    rallyBonus: 0,
    swarm: 0,
    swarmBonus: 0,
    reborn: false,
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
    wall: false,
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

/** An enemy Unit snapshot as the rules make it: Melee, with no Keyword and no Status. */
const snapshot = (
  id: number,
  lane: number,
  position: number,
  source: UnitSnapshot["source"],
  extra: Partial<UnitSnapshot> = {}
): UnitSnapshot => ({
  id,
  owner: "enemy",
  source,
  lane,
  position,
  attack: 3,
  hp: 5,
  maxHp: 5,
  speed: 1,
  range: 0,
  damageType: "physical",
  armor: 0,
  charge: 0,
  entangle: false,
  firstStrike: false,
  flying: false,
  heroic: 0,
  lastBreath: 0,
  pivot: false,
  poison: false,
  hobble: 0,
  bleed: 0,
  knockback: 0,
  rally: 0,
  rebirth: false,
  regenerate: 0,
  retaliate: false,
  swarm: 0,
  trample: false,
  wall: false,
  summonedTurn: 1,
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  frozen: false,
  entangled: false,
  rallied: 0,
  bonusArmor: 0,
  bonusArmorTurns: 0,
  ...extra,
});

describe("the Token, Rebirth and Swarm view", () => {
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
  const start = { ...viewFromState(state), units: [] };
  const hushbow = snapshot(20, 0, 9, {
    _tag: "Card",
    card: { instanceId: 70, cardId: "undead.hushbow", rank: "common" },
  });
  const skeleton = snapshot(
    21,
    0,
    10,
    { _tag: "Token", tokenId: "token.skeleton", rank: "common" },
    { attack: 1, hp: 1, maxHp: 1, swarm: 1 }
  );

  it("adds the Token Unit of TokenSummoned, and gives Swarm its bonus while a friendly Unit is in the Lane", () => {
    const alone = applyEvent(
      start,
      BattleEvent.UnitSummoned({ unit: skeleton })
    );
    expect(alone.units[0]?.attack).toBe(1);
    expect(alone.units[0]?.swarmBonus).toBe(0);
    const view = applyEvent(
      alone,
      BattleEvent.TokenSummoned({ unit: hushbow, sourceUnitId: 99 })
    );
    const token = view.units.find((unit) => unit.id === skeleton.id);
    expect(token?.source).toEqual({ _tag: "Token", tokenId: "token.skeleton" });
    expect(token?.rank).toBe("common");
    expect(token?.attack).toBe(2);
    expect(token?.swarmBonus).toBe(1);
    const moved = applyEvent(
      view,
      BattleEvent.UnitDied({ unitId: hushbow.id })
    );
    expect(moved.units.find((unit) => unit.id === skeleton.id)?.attack).toBe(1);
  });

  it("puts no card in the Graveyard when a Token dies", () => {
    const view = applyEvent(
      start,
      BattleEvent.UnitSummoned({ unit: skeleton })
    );
    const after = applyEvent(
      view,
      BattleEvent.UnitDied({ unitId: skeleton.id })
    );
    expect(after.units).toEqual([]);
    expect(after.sides.enemy.graveyard).toEqual(start.sides.enemy.graveyard);
  });

  it("keeps a reborn Unit in its Square with its new HP, no Status and no bonus Armor", () => {
    const lancer = snapshot(
      22,
      1,
      8,
      {
        _tag: "Card",
        card: { instanceId: 71, cardId: "undead.coffinLancer", rank: "rare" },
      },
      { rebirth: true }
    );
    let view = applyEvent(start, BattleEvent.UnitSummoned({ unit: lancer }));
    expect(view.units[0]?.reborn).toBe(false);
    view = [
      BattleEvent.StatusApplied({ unitId: lancer.id, status: "freeze" }),
      BattleEvent.StatusApplied({ unitId: lancer.id, status: "burn" }),
      BattleEvent.ArmorGained({ unitId: lancer.id, armor: 1, turns: 2 }),
      BattleEvent.UnitReborn({ unitId: lancer.id, hp: 1 }),
    ].reduce(applyEvent, view);
    expect(view.units).toHaveLength(1);
    expect(view.units[0]).toMatchObject({
      position: 8,
      hp: 1,
      reborn: true,
      frozen: false,
      burn: 0,
      bonusArmor: 0,
    });
    expect(view.sides.enemy.graveyard).toEqual(start.sides.enemy.graveyard);
  });
});

/** The source of a Common Card Unit. */
const cardSource = (
  instanceId: number,
  cardId: string
): UnitSnapshot["source"] => ({
  _tag: "Card",
  card: { instanceId, cardId, rank: "common" },
});

describe("the Rally view", () => {
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
  const elk = snapshot(30, 0, 9, cardSource(80, "feral.frostElkMatriarch"), {
    rally: 1,
  });
  const recruit = snapshot(31, 0, 10, cardSource(81, "human.militiaRecruit"));
  const skeleton = snapshot(
    32,
    0,
    11,
    { _tag: "Token", tokenId: "token.skeleton", rank: "common" },
    { attack: 1, hp: 1, maxHp: 1, swarm: 1 }
  );
  const start = applyEvent(
    applyEvent(
      { ...viewFromState(state), units: [] },
      BattleEvent.UnitSummoned({ unit: elk })
    ),
    BattleEvent.UnitSummoned({ unit: recruit })
  );
  const rallied = applyEvent(
    start,
    BattleEvent.UnitsRallied({
      unitId: elk.id,
      targets: [{ unitId: recruit.id, rallied: 1 }],
    })
  );
  const recruitOf = (view: BattleView) =>
    view.units.find((unit) => unit.id === recruit.id);

  it("sets the Rally bonus and the Attack of each target from UnitsRallied", () => {
    expect(recruitOf(rallied)).toMatchObject({ attack: 4, rallyBonus: 1 });
    expect(rallied.units.find((unit) => unit.id === elk.id)).toMatchObject({
      attack: 3,
      rallyBonus: 0,
    });
    const twice = applyEvent(
      rallied,
      BattleEvent.UnitsRallied({
        unitId: 99,
        targets: [{ unitId: recruit.id, rallied: 2 }],
      })
    );
    expect(recruitOf(twice)).toMatchObject({ attack: 5, rallyBonus: 2 });
  });

  it("ends the Rally bonus at TurnEnded of the owner only", () => {
    const otherSide = applyEvent(
      rallied,
      BattleEvent.TurnEnded({ side: "player" })
    );
    expect(recruitOf(otherSide)).toMatchObject({ attack: 4, rallyBonus: 1 });
    const ownSide = applyEvent(
      rallied,
      BattleEvent.TurnEnded({ side: "enemy" })
    );
    expect(recruitOf(ownSide)).toMatchObject({ attack: 3, rallyBonus: 0 });
  });

  it("ends the Rally bonus at UnitReborn", () => {
    const reborn = applyEvent(
      rallied,
      BattleEvent.UnitReborn({ unitId: recruit.id, hp: 1 })
    );
    expect(recruitOf(reborn)).toMatchObject({ attack: 3, rallyBonus: 0 });
  });

  it("shows the Rally bonus and the Swarm bonus of one Unit as two parts of its Attack", () => {
    const view = applyEvent(
      applyEvent(
        start,
        BattleEvent.TokenSummoned({ unit: skeleton, sourceUnitId: elk.id })
      ),
      BattleEvent.UnitsRallied({
        unitId: elk.id,
        targets: [
          { unitId: recruit.id, rallied: 1 },
          { unitId: skeleton.id, rallied: 1 },
        ],
      })
    );
    expect(view.units.find((unit) => unit.id === skeleton.id)).toMatchObject({
      attack: 3,
      rallyBonus: 1,
      swarmBonus: 1,
    });
    const ended = applyEvent(view, BattleEvent.TurnEnded({ side: "enemy" }));
    expect(ended.units.find((unit) => unit.id === skeleton.id)).toMatchObject({
      attack: 2,
      rallyBonus: 0,
      swarmBonus: 1,
    });
  });

  it("reads the Rally bonus from the rules state", () => {
    const withRally = structuredClone(state);
    withRally.units = [{ ...recruit, owner: "player", rallied: 2 }];
    expect(viewFromState(withRally).units[0]).toMatchObject({
      attack: 5,
      rallyBonus: 2,
    });
  });
});
