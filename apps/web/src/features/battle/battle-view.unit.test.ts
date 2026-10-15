import type {
  BattleState,
  RankId,
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

import {
  heroOf,
  applyEvent,
  viewFromState,
} from "@/features/battle/battle-view";
import type { BattleView, UnitView } from "@/features/battle/battle-view";
import { playerHand } from "@/features/battle/player-hero";

/**
 * Runs a Battle with the AI on both sides and returns each step. `rank` puts
 * each copy of the player Deck at that Rank.
 */
const steps = (
  seed: number,
  stageId: string,
  deckId: string,
  stage: StageDefinition = getStage(stageId),
  rank?: RankId
) => {
  const deck = getStarterDeck(deckId);
  let { state } = createBattle({
    seed,
    stage,
    player: {
      classId: deck.classId,
      deck: deck.deck.map((entry) => ({ ...entry, rank: rank ?? entry.rank })),
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

/**
 * Stage 1-4 with an enemy Deck of Elf cards and the 3 Ranger Skill Cards. Each
 * copy is Rare, except Warning Shot and Pinning Shot: at Common (8 and 6
 * damage), an Epic player Unit survives them, and is pushed or Entangled.
 */
const rangerStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cardIds = [
    "elf.brambleDuelist",
    "elf.fernwingCourier",
    "elf.thornlineArcher",
    "ranger.pinningShot",
    "ranger.warningShot",
    "ranger.longShot",
  ];
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      deck: cardIds.flatMap((cardId) =>
        Array.from({ length: 2 }, () => ({
          cardId,
          rank:
            cardId === "ranger.warningShot" || cardId === "ranger.pinningShot"
              ? ("common" as const)
              : ("rare" as const),
        }))
      ),
    },
  };
};

/** The tags of the effect events of each cast of `cardId`: from its CardPlayed to its RecallRolled or BattleEnded. */
const castEffects = (events: readonly BattleEvent[], cardId: string) =>
  events.flatMap((event, index) => {
    if (event._tag !== "CardPlayed" || event.card.cardId !== cardId) {
      return [];
    }
    const rest = events.slice(index + 1);
    const end = rest.findIndex(
      (next) => next._tag === "RecallRolled" || next._tag === "BattleEnded"
    );
    return [rest.slice(0, end === -1 ? rest.length : end)];
  });

describe("applyEvent with the Ranger Skill Cards", () => {
  const battles = [1, 2, 3].map((seed) =>
    steps(seed, "1-4", "vanguard", rangerStage(), "epic")
  );
  const events = battles.flat().flatMap((entry) => entry.events);

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events: stepEvents } of all) {
        expect(stepEvents.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("plays a Skill push, a Skill Entangle and Skill damage to a Hero", () => {
    expect(
      castEffects(events, "ranger.warningShot").some((effects) =>
        effects.some((event) => event._tag === "UnitPushed")
      )
    ).toBe(true);
    expect(
      castEffects(events, "ranger.pinningShot").some((effects) =>
        effects.some(
          (event) =>
            event._tag === "StatusApplied" && event.status === "entangle"
        )
      )
    ).toBe(true);
    const longShots = castEffects(events, "ranger.longShot");
    expect(longShots.length).toBeGreaterThan(0);
    expect(
      longShots.every((effects) =>
        effects.some(
          (event) =>
            event._tag === "DamageDealt" &&
            event.source === "skill" &&
            event.target._tag === "Hero" &&
            event.target.side === "player"
        )
      )
    ).toBe(true);
  });

  it("moves the Unit of a Skill push and makes the Unit of a Skill Entangle Entangled", () => {
    for (const { before, events: stepEvents } of battles.flat()) {
      let view = viewFromState(before);
      for (const event of stepEvents) {
        view = applyEvent(view, event);
        if (event._tag === "UnitPushed") {
          expect(
            view.units.find((unit) => unit.id === event.unitId)?.position
          ).toBe(event.to);
        }
        if (event._tag === "StatusApplied" && event.status === "entangle") {
          expect(
            view.units.find((unit) => unit.id === event.unitId)?.entangled
          ).toBe(true);
        }
      }
    }
  });
});

/** Stage 1-4 with an enemy Deck of Elf cards and the Rare and Epic Ranger Skill Cards of #59, each at its Base Rank. */
const rareRangerStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cards = [
    ["elf.brambleDuelist", "rare"],
    ["elf.fernwingCourier", "rare"],
    ["elf.thornlineArcher", "rare"],
    ["ranger.venomArrow", "rare"],
    ["ranger.huntersFocus", "rare"],
    ["ranger.rainOfArrows", "epic"],
  ] as const;
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      deck: cards.flatMap(([cardId, rank]) =>
        Array.from({ length: 2 }, () => ({ cardId, rank }))
      ),
    },
  };
};

describe("applyEvent with the Rare and Epic Ranger Skill Cards of #59", () => {
  const battles = [1, 2, 3].map((seed) =>
    steps(seed, "1-4", "vanguard", rareRangerStage(), "rare")
  );
  const events = battles.flat().flatMap((entry) => entry.events);

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events: stepEvents } of all) {
        expect(stepEvents.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("plays Poisoned stacks, a Lane Entangle and a bonus Range", () => {
    expect(
      castEffects(events, "ranger.venomArrow").some((effects) =>
        effects.some(
          (event) =>
            event._tag === "StatusApplied" &&
            event.status === "poison" &&
            (event.count ?? 0) >= 3
        )
      )
    ).toBe(true);
    expect(
      castEffects(events, "ranger.rainOfArrows").some((effects) =>
        effects.some(
          (event) =>
            event._tag === "StatusApplied" && event.status === "entangle"
        )
      )
    ).toBe(true);
    expect(
      castEffects(events, "ranger.huntersFocus").some((effects) =>
        effects.some((event) => event._tag === "RangeGained")
      )
    ).toBe(true);
  });

  it("sets the Poisoned stacks from StatusApplied", () => {
    for (const { before, events: stepEvents } of battles.flat()) {
      let view = viewFromState(before);
      for (const event of stepEvents) {
        view = applyEvent(view, event);
        if (event._tag === "StatusApplied" && event.status === "poison") {
          expect(
            view.units.find((unit) => unit.id === event.unitId)?.poisoned
          ).toBe(event.count);
        }
      }
    }
  });
});

/** Stage 1-4 with an enemy Priest Deck of Feral cards and the Rare and Epic Priest Skill Cards of #61, each at its Base Rank. */
const rarePriestStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cards = [
    ["feral.caveBear", "rare"],
    ["feral.cragRhino", "rare"],
    ["feral.bristlebackBoar", "rare"],
    ["priest.cleanse", "rare"],
    ["priest.unbrokenVow", "rare"],
    ["priest.aegisOfDawn", "epic"],
  ] as const;
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      classId: "priest",
      deck: cards.flatMap(([cardId, rank]) =>
        Array.from({ length: 2 }, () => ({ cardId, rank }))
      ),
    },
  };
};

describe("applyEvent with the Rare and Epic Priest Skill Cards of #61", () => {
  // The Raiders Starter Deck gives Burn and Freeze, so Cleanse has Debuffs to end.
  const battles = [1, 2, 3, 4].map((seed) =>
    steps(seed, "1-4", "raiders", rarePriestStage(), "rare")
  );
  const events = battles.flat().flatMap((entry) => entry.events);

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events: stepEvents } of all) {
        expect(stepEvents.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("plays Steadfast, a hit that Steadfast holds, a Cleanse and a Lane Ward", () => {
    expect(
      castEffects(events, "priest.unbrokenVow").some((effects) =>
        effects.some(
          (event) =>
            event._tag === "StatusApplied" && event.status === "steadfast"
        )
      )
    ).toBe(true);
    expect(events.some((event) => event._tag === "SteadfastHeld")).toBe(true);
    expect(
      castEffects(events, "priest.cleanse").some((effects) =>
        effects.some((event) => event._tag === "DebuffsRemoved")
      )
    ).toBe(true);
    expect(
      castEffects(events, "priest.aegisOfDawn").some(
        (effects) =>
          effects.filter(
            (event) => event._tag === "StatusApplied" && event.status === "ward"
          ).length >= 2
      )
    ).toBe(true);
  });

  it("ends Steadfast at SteadfastHeld, with the Unit at 1 HP", () => {
    for (const { before, events: stepEvents } of battles.flat()) {
      let view = viewFromState(before);
      for (const event of stepEvents) {
        view = applyEvent(view, event);
        if (event._tag === "SteadfastHeld") {
          expect(
            view.units.find((unit) => unit.id === event.unitId)
          ).toMatchObject({ hp: 1, steadfast: false });
        }
      }
    }
  });
});

/** Stage 1-4 with an enemy Deck of Human melee cards and the 3 Warrior Skill Cards of #63. */
const rareWarriorStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cards = [
    ["human.militiaRecruit", "rare"],
    ["human.halberdier", "rare"],
    ["human.riverKnight", "rare"],
    ["warrior.callToArms", "rare"],
    ["warrior.exposeWeakness", "rare"],
    ["warrior.onslaught", "epic"],
  ] as const;
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      classId: "warrior",
      deck: cards.flatMap(([cardId, rank]) =>
        Array.from({ length: 2 }, () => ({ cardId, rank }))
      ),
    },
  };
};

describe("applyEvent with the Rare and Epic Warrior Skill Cards of #63", () => {
  const battles = [1, 2, 3, 4].map((seed) =>
    steps(seed, "1-4", "vanguard", rareWarriorStage(), "rare")
  );
  const events = battles.flat().flatMap((entry) => entry.events);

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events: stepEvents } of all) {
        expect(stepEvents.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("plays a bonus Attack, Exposed and an extra action", () => {
    expect(
      castEffects(events, "warrior.callToArms").some((effects) =>
        effects.some((event) => event._tag === "AttackGained")
      )
    ).toBe(true);
    expect(events.some((event) => event._tag === "AttackFaded")).toBe(true);
    expect(
      castEffects(events, "warrior.exposeWeakness").some((effects) =>
        effects.some(
          (event) =>
            event._tag === "StatusApplied" && event.status === "exposed"
        )
      )
    ).toBe(true);
    expect(
      castEffects(events, "warrior.onslaught").some((effects) =>
        effects.some((event) => event._tag === "UnitAttacked")
      )
    ).toBe(true);
  });
});

/** Stage 1-4 with an enemy Mage Deck of the Lightning and Field Effect cards of #65. */
const mageStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cards = [
    ["human.militiaRecruit", "rare"],
    ["human.halberdier", "rare"],
    ["mage.spark", "rare"],
    ["mage.arcLightning", "rare"],
    ["mage.wildfire", "rare"],
    ["mage.thunderstorm", "rare"],
    ["mage.blizzard", "epic"],
  ] as const;
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      classId: "mage",
      deck: cards.flatMap(([cardId, rank]) =>
        Array.from({ length: 2 }, () => ({ cardId, rank }))
      ),
    },
  };
};

describe("applyEvent with the Mage cards of #65", () => {
  const battles = [1, 2, 3, 4].map((seed) =>
    steps(seed, "1-4", "vanguard", mageStage(), "rare")
  );
  const events = battles.flat().flatMap((entry) => entry.events);

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events: stepEvents } of all) {
        expect(stepEvents.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("plays Paralyzed, a skipped attack and a Field Effect that strikes and ends", () => {
    expect(
      events.some(
        (event) => event._tag === "StatusApplied" && event.status === "paralyze"
      )
    ).toBe(true);
    expect(events.some((event) => event._tag === "AttackSkipped")).toBe(true);
    expect(events.some((event) => event._tag === "FieldEffectPlaced")).toBe(
      true
    );
    expect(events.some((event) => event._tag === "FieldEffectStruck")).toBe(
      true
    );
    expect(events.some((event) => event._tag === "FieldEffectEnded")).toBe(
      true
    );
  });
});

/** A Halberdier Unit view at Square 5 of Lane 1, with no bonus and no Status. */
const halberdierView = (owner: "player" | "enemy", id: number): UnitView => ({
  id,
  owner,
  hero: 0,
  source: { _tag: "Card", cardId: "human.halberdier" },
  rank: "common",
  lane: 0,
  position: 5,
  attack: 3,
  rallyBonus: 0,
  swarm: 0,
  swarmBonus: 0,
  bonusAttack: 0,
  bonusAttackTurns: 0,
  bonusRange: 0,
  bonusRangeTurns: 0,
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

describe("the Paralyzed and Field Effect view", () => {
  const base: BattleView = {
    ...viewFromState(
      createBattle({
        seed: 1,
        stage: getStage("1-1"),
        player: {
          classId: "mage",
          deck: getStarterDeck("vanguard").deck,
          level: 1,
          gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
        },
      }).state
    ),
    units: [],
    fieldEffects: [],
  };

  it("sets Paralyzed from StatusApplied, and ends it at AttackSkipped, UnitSkipped and DebuffsRemoved", () => {
    const view: BattleView = { ...base, units: [halberdierView("enemy", 4)] };
    const paralyzed = applyEvent(
      view,
      BattleEvent.StatusApplied({ unitId: 4, status: "paralyze" })
    );
    expect(paralyzed.units[0]?.paralyzed).toBe(true);
    for (const end of [
      BattleEvent.AttackSkipped({ unitId: 4 }),
      BattleEvent.UnitSkipped({ unitId: 4 }),
      BattleEvent.DebuffsRemoved({ unitId: 4 }),
      BattleEvent.UnitReborn({ unitId: 4, hp: 1 }),
    ]) {
      expect(applyEvent(paralyzed, end).units[0]?.paralyzed, end._tag).toBe(
        false
      );
    }
  });

  it("adds a Field Effect at FieldEffectPlaced, lowers its hits at FieldEffectStruck and removes it at FieldEffectEnded", () => {
    const placed = applyEvent(
      base,
      BattleEvent.FieldEffectPlaced({
        field: {
          id: 9,
          owner: "player",
          hero: 0,
          card: { instanceId: 1, cardId: "mage.wildfire", rank: "rare" },
          lane: 0,
          position: 6,
          lanes: 2,
          columns: 2,
          amount: 2,
          damageType: "fire",
          turns: 2,
        },
      })
    );
    expect(placed.fieldEffects).toEqual([
      {
        id: 9,
        owner: "player",
        cardId: "mage.wildfire",
        lane: 0,
        position: 6,
        lanes: 2,
        columns: 2,
        damageType: "fire",
        turns: 2,
      },
    ]);
    const struck = applyEvent(
      placed,
      BattleEvent.FieldEffectStruck({ fieldId: 9, turns: 1 })
    );
    expect(struck.fieldEffects[0]?.turns).toBe(1);
    expect(
      applyEvent(struck, BattleEvent.FieldEffectEnded({ fieldId: 9 }))
        .fieldEffects
    ).toEqual([]);
  });
});

describe("the bonus Attack and Exposed view", () => {
  const state = (() => {
    const { state: start } = createBattle({
      seed: 1,
      stage: getStage("1-1"),
      player: {
        classId: "warrior",
        deck: getStarterDeck("vanguard").deck,
        level: 1,
        gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
      },
    });
    return start;
  })();

  it("adds the bonus Attack to the Attack, counts down its Turns at the End Phase of the owner, and ends it at AttackFaded", () => {
    const view: BattleView = {
      ...viewFromState(state),
      units: [halberdierView("player", 7)],
    };
    const gained = applyEvent(
      view,
      BattleEvent.AttackGained({ unitId: 7, attack: 3, turns: 2 })
    );
    expect(gained.units[0]).toMatchObject({
      attack: 6,
      bonusAttack: 3,
      bonusAttackTurns: 2,
    });
    const ended = applyEvent(gained, BattleEvent.TurnEnded({ side: "player" }));
    expect(ended.units[0]).toMatchObject({ attack: 6, bonusAttackTurns: 1 });
    const enemyEnded = applyEvent(
      ended,
      BattleEvent.TurnEnded({ side: "enemy" })
    );
    expect(enemyEnded.units[0]?.bonusAttackTurns).toBe(1);
    const faded = applyEvent(
      enemyEnded,
      BattleEvent.AttackFaded({ unitId: 7 })
    );
    expect(faded.units[0]).toMatchObject({
      attack: 3,
      bonusAttack: 0,
      bonusAttackTurns: 0,
      bonusRange: 0,
      bonusRangeTurns: 0,
    });
  });

  it("sets Exposed from StatusApplied, ends it after 2 End Phases of the owner, and Cleanse ends it", () => {
    const view: BattleView = {
      ...viewFromState(state),
      units: [halberdierView("enemy", 8)],
    };
    const exposed = applyEvent(
      view,
      BattleEvent.StatusApplied({ unitId: 8, status: "exposed", count: 2 })
    );
    expect(exposed.units[0]).toMatchObject({ exposed: 2, exposedTurns: 2 });
    const playerEnded = applyEvent(
      exposed,
      BattleEvent.TurnEnded({ side: "player" })
    );
    expect(playerEnded.units[0]?.exposedTurns).toBe(2);
    const once = applyEvent(
      playerEnded,
      BattleEvent.TurnEnded({ side: "enemy" })
    );
    expect(once.units[0]).toMatchObject({ exposed: 2, exposedTurns: 1 });
    const twice = applyEvent(once, BattleEvent.TurnEnded({ side: "enemy" }));
    expect(twice.units[0]).toMatchObject({ exposed: 0, exposedTurns: 0 });
    const cleansed = applyEvent(
      exposed,
      BattleEvent.DebuffsRemoved({ unitId: 8 })
    );
    expect(cleansed.units[0]).toMatchObject({ exposed: 0, exposedTurns: 0 });
  });
});

/** Stage 1-4 with an enemy Deck of big Feral and Undead cards and the 3 Priest Skill Cards. */
const priestStage = (): StageDefinition => {
  const stage = getStage("1-4");
  const cardIds = [
    "feral.caveBear",
    "feral.cragRhino",
    "undead.chatteringCohort",
    "priest.mend",
    "priest.smite",
    "priest.sanctuary",
  ];
  return {
    ...stage,
    enemy: {
      ...stage.enemy,
      classId: "priest",
      deck: cardIds.flatMap((cardId) =>
        Array.from({ length: 2 }, () => ({ cardId, rank: "rare" as const }))
      ),
    },
  };
};

describe("applyEvent with the Priest Skill Cards", () => {
  const battles = [1, 2, 3, 4].map((seed) =>
    steps(seed, "1-4", "vanguard", priestStage())
  );
  const events = battles.flat().flatMap((entry) => entry.events);

  it("rebuilds the view of the next state from the events", () => {
    for (const all of battles) {
      for (const { before, after, events: stepEvents } of all) {
        expect(stepEvents.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  });

  it("plays a heal, a Ward and a hit that a Ward absorbs in these Battles", () => {
    expect(
      castEffects(events, "priest.mend").some((effects) =>
        effects.some((event) => event._tag === "UnitHealed")
      )
    ).toBe(true);
    expect(
      castEffects(events, "priest.sanctuary").some((effects) =>
        effects.some(
          (event) => event._tag === "StatusApplied" && event.status === "ward"
        )
      )
    ).toBe(true);
    expect(
      events.some((event) => event._tag === "DamageDealt" && event.absorbed > 0)
    ).toBe(true);
  });

  it("sets the Ward from StatusApplied and from each DamageDealt", () => {
    for (const { before, events: stepEvents } of battles.flat()) {
      let view = viewFromState(before);
      for (const event of stepEvents) {
        view = applyEvent(view, event);
        if (event._tag === "StatusApplied" && event.status === "ward") {
          expect(
            view.units.find((unit) => unit.id === event.unitId)?.ward
          ).toBe(event.count);
        }
        if (event._tag === "DamageDealt" && event.target._tag === "Unit") {
          const { unitId } = event.target;
          const unit = view.units.find((candidate) => candidate.id === unitId);
          // A Unit that died is not in the view.
          expect(unit === undefined || unit.ward === event.ward).toBe(true);
        }
      }
    }
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
      heroOf(view, "enemy").hand.every(
        (card) => card.cardId === null && card.rank === null
      )
    ).toBe(true);
    expect(heroOf(view, "enemy").hand.map((card) => card.countdown)).toEqual(
      state.sides.enemy.heroes[0]?.hand.map((card) => card.countdown)
    );
    expect(heroOf(view, "player").hand.map((card) => card.cardId)).toEqual(
      playerHand(state).map((card) => card.cardId)
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
          hero: 0,
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
          bulwark: 0,
          bonusBulwark: 0,
          bonusBulwarkTurns: 0,
          bonusAttack: 0,
          bonusAttackTurns: 0,
          bonusRange: 0,
          bonusRangeTurns: 0,
          exposed: 0,
          exposedTurns: 0,
          range: 1,
          flying: false,
          damageType: "physical" as const,
          burn: 0,
          poisoned: 0,
          hobbled: 0,
          bleeding: 0,
          grounded: 0,
          frozen: false,
          paralyzed: false,
          entangled: false,
          ward: 0,
          steadfast: false,
          wall: false,
        },
      ],
    };
    const events: BattleEvent[] = [
      BattleEvent.UnitDied({ unitId: 7 }),
      BattleEvent.RecallRolled({
        side: "player",
        hero: 0,
        card: { instanceId: 40, cardId: "mage.fireball", rank: "rare" },
        success: false,
      }),
    ];
    expect(heroOf(events.reduce(applyEvent, view), "player").graveyard).toEqual(
      [
        { cardId: "orc.badlandRunt", rank: "common" },
        { cardId: "mage.fireball", rank: "rare" },
      ]
    );
  });
});

describe("the bonus Bulwark view", () => {
  it("counts down the Turns in each End Phase of the owner, then the Bulwark fades", () => {
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
      hero: 0,
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
      bulwark: 0,
      bonusBulwark: 0,
      bonusBulwarkTurns: 0,
      bonusAttack: 0,
      bonusAttackTurns: 0,
      bonusRange: 0,
      bonusRangeTurns: 0,
      exposed: 0,
      exposedTurns: 0,
      range: 1,
      flying: false,
      damageType: "physical" as const,
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      bleeding: 0,
      grounded: 0,
      frozen: false,
      paralyzed: false,
      entangled: false,
      ward: 0,
      steadfast: false,
      wall: false,
    };
    const view = { ...viewFromState(state), units: [unit] };
    const bulwarkOf = (events: readonly BattleEvent[]) => {
      const [after] = events.reduce(applyEvent, view).units;
      return [after?.bonusBulwark, after?.bonusBulwarkTurns];
    };
    const gained = BattleEvent.BulwarkGained({
      unitId: 7,
      bulwark: 1,
      turns: 2,
    });
    expect(bulwarkOf([gained])).toEqual([1, 2]);
    expect(
      bulwarkOf([gained, BattleEvent.TurnEnded({ side: "player" })])
    ).toEqual([1, 2]);
    expect(
      bulwarkOf([gained, BattleEvent.TurnEnded({ side: "enemy" })])
    ).toEqual([1, 1]);
    expect(
      bulwarkOf([
        gained,
        BattleEvent.TurnEnded({ side: "enemy" }),
        BattleEvent.BulwarkFaded({ unitId: 7 }),
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
      hero: 0,
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
      bulwark: 0,
      bonusBulwark: 0,
      bonusBulwarkTurns: 0,
      bonusAttack: 0,
      bonusAttackTurns: 0,
      bonusRange: 0,
      bonusRangeTurns: 0,
      exposed: 0,
      exposedTurns: 0,
      range: 0,
      flying: false,
      damageType: "physical" as const,
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      bleeding: 0,
      grounded: 0,
      frozen: false,
      paralyzed: false,
      entangled: false,
      ward: 0,
      steadfast: false,
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
      hero: 0,
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
      bulwark: 0,
      bonusBulwark: 0,
      bonusBulwarkTurns: 0,
      bonusAttack: 0,
      bonusAttackTurns: 0,
      bonusRange: 0,
      bonusRangeTurns: 0,
      exposed: 0,
      exposedTurns: 0,
      range: 0,
      flying: false,
      damageType: "physical" as const,
      burn: 0,
      poisoned: 0,
      hobbled: 0,
      bleeding: 0,
      grounded: 0,
      frozen: false,
      paralyzed: false,
      entangled: false,
      ward: 0,
      steadfast: false,
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
    for (const hero of state.sides.player.heroes) {
      hero.hand = [
        { instanceId: 901, cardId: voss, rank: "epic", countdown: 0 },
        { instanceId: 902, cardId: voss, rank: "legendary", countdown: 0 },
      ];
    }
    const before = viewFromState(state);
    expect(heroOf(before, "player").hand.map((card) => card.blocked)).toEqual([
      false,
      false,
    ]);
    const [target] = legalTargets(state, 0, 0);
    if (!target) {
      throw new Error("Expected a legal target");
    }
    const { state: after, events } = Result.getOrThrow(
      step(state, Command.PlayCard({ hero: 0, handIndex: 0, target }))
    );
    const played = events.reduce(applyEvent, before);
    expect(played).toEqual(viewFromState(after));
    expect(heroOf(played, "player").hand).toEqual([
      expect.objectContaining({ instanceId: 902, blocked: true }),
    ]);
    const unitId =
      played.units.find(
        (unit) => unit.source._tag === "Card" && unit.source.cardId === voss
      )?.id ?? -1;
    const died = applyEvent(played, BattleEvent.UnitDied({ unitId }));
    expect(heroOf(died, "player").hand[0]?.blocked).toBe(false);
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
      heroOf(viewFromState(state), "enemy").hand.every((card) => !card.blocked)
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
    hero: 0,
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
    bulwark: 0,
    bonusBulwark: 0,
    bonusBulwarkTurns: 0,
    bonusAttack: 0,
    bonusAttackTurns: 0,
    bonusRange: 0,
    bonusRangeTurns: 0,
    exposed: 0,
    exposedTurns: 0,
    range: 0,
    flying: false,
    damageType: "physical" as const,
    burn: 0,
    poisoned: 0,
    hobbled: 0,
    bleeding: 0,
    grounded: 0,
    frozen: false,
    paralyzed: false,
    entangled: false,
    ward: 0,
    steadfast: false,
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
        target: { _tag: "Hero", side: "player", hero: 0 },
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
  hero: 0,
  source,
  lane,
  position,
  attack: 3,
  hp: 5,
  maxHp: 5,
  speed: 1,
  range: 0,
  damageType: "physical",
  bulwark: 0,
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
  grounded: 0,
  frozen: false,
  paralyzed: false,
  entangled: false,
  ward: 0,
  steadfast: false,
  rallied: 0,
  bonusBulwark: 0,
  bonusBulwarkTurns: 0,
  bonusAttack: 0,
  bonusAttackTurns: 0,
  bonusRange: 0,
  bonusRangeTurns: 0,
  exposed: 0,
  exposedTurns: 0,
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
    expect(heroOf(after, "enemy").graveyard).toEqual(
      heroOf(start, "enemy").graveyard
    );
  });

  it("keeps a reborn Unit in its Square with its new HP, no Status (also no Ward) and no bonus Bulwark", () => {
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
      BattleEvent.StatusApplied({
        unitId: lancer.id,
        status: "ward",
        count: 6,
      }),
      BattleEvent.BulwarkGained({ unitId: lancer.id, bulwark: 1, turns: 2 }),
    ].reduce(applyEvent, view);
    expect(view.units[0]?.ward).toBe(6);
    view = applyEvent(
      view,
      BattleEvent.UnitReborn({ unitId: lancer.id, hp: 1 })
    );
    expect(view.units).toHaveLength(1);
    expect(view.units[0]).toMatchObject({
      position: 8,
      hp: 1,
      reborn: true,
      frozen: false,
      paralyzed: false,
      burn: 0,
      ward: 0,
      steadfast: false,
      bonusBulwark: 0,
    });
    expect(heroOf(view, "enemy").graveyard).toEqual(
      heroOf(start, "enemy").graveyard
    );
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
