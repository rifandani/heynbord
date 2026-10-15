import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { createBattle } from "../battle/create-battle";
import { step } from "../battle/step";
import type { BattleState } from "../battle/types";
import { Command, HAND_LIMIT, Target, TURN_LIMIT } from "../battle/types";
import { getCard } from "../content/cards";
import { getStarterDeck, STARTER_DECKS } from "../content/decks";
import { getStage, STAGES } from "../content/stages";
import { emptyBattle, giveHand, placeUnit, heroOf } from "../testing/fixtures";
import { chooseCommand, visibleTo } from "./choose-command";

/** Plays a full Battle with the AI on both sides (Auto-play for the player). */
const autoBattle = (seed: number, stageId: string, deckId: string) => {
  const deck = getStarterDeck(deckId);
  let { state } = createBattle({
    seed,
    stage: getStage(stageId),
    player: {
      classId: deck.classId,
      deck: deck.deck,
      level: 10,
      gear: { weapon: 6, armor: 6, trinket: 6, banner: 6 },
    },
  });
  const log: string[] = [];
  let commands = 0;
  while (state.status !== "finished" && commands < 5000) {
    const command = chooseCommand(state);
    const result = step(state, command);
    if (Result.isFailure(result)) {
      throw new Error(`AI chose an illegal Command: ${result.failure._tag}`);
    }
    ({ state } = result.success);
    log.push(...result.success.events.map((event) => event._tag));
    commands += 1;
  }
  return { state, log };
};

const stateOf = (seed: number, stageId: string, deckId: string): BattleState =>
  autoBattle(seed, stageId, deckId).state;

/** A Spear Throw kills either Unit. The Tusk Brute in the other Lane is far away, and it has more value. */
const spearThrowChoice = (
  threat: Parameters<typeof placeUnit>[1],
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
  giveHand(state, "enemy", [["warrior.spearThrow", 0]]);
  placeUnit(state, threat);
  placeUnit(state, {
    cardId: "orc.tuskBrute",
    owner: "player",
    lane: 1,
    position: 3,
    hp: 4,
  });
  setup(state);
  return chooseCommand(state);
};

const spearThrowAt = (lane: number, position: number) =>
  Command.PlayCard({
    hero: 0,
    handIndex: 0,
    target: Target.Square({ lane, position }),
  });

/** The enemy Hero has 3 HP. A Spear Throw kills a near Militia Recruit or a far Grukka of more value. */
const lethalChoice = (turnNumber: number) => {
  const state = emptyBattle({
    lanes: 2,
    activeSide: "enemy",
    turnNumber,
    enemy: { hp: 3 },
  });
  giveHand(state, "enemy", [["warrior.spearThrow", 0]]);
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    lane: 0,
    position: 10,
    attack: 2,
    hp: 4,
  });
  placeUnit(state, {
    cardId: "orc.warchiefGrukka",
    owner: "player",
    lane: 1,
    position: 3,
    // High Attack gives Grukka more value than the Militia Recruit.
    attack: 8,
    hp: 4,
  });
  return chooseCommand(state);
};

describe("visibleTo (GDD 9)", () => {
  it("hides the other side's Hand and both Decks", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 2]]);
    giveHand(state, "enemy", [["orc.badlandRunt", 1]]);
    heroOf(state, "enemy").deck = [
      { instanceId: 1, cardId: "orc.tuskBrute", rank: "common" },
    ];
    const view = visibleTo(state, "enemy");
    expect(heroOf(view, "player").hand).toEqual([
      expect.objectContaining({ cardId: "hidden", countdown: 2 }),
    ]);
    expect(heroOf(view, "enemy").hand[0]?.cardId).toBe("orc.badlandRunt");
    expect(heroOf(view, "enemy").deck).toEqual([]);
    expect(view.random).toBe(0);
    expect(view.seed).toBe(0);
  });
});

describe("chooseCommand (GDD 9)", () => {
  it("ends the Turn when no card is Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["human.militiaRecruit", 1]]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });

  it("summons into the deepest Square of the Lane with the largest threat", () => {
    const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
    giveHand(state, "enemy", [["human.shieldbearer", 0]]);
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      lane: 1,
      position: 6,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 1, position: 9 }),
      })
    );
  });

  it("blocks an enemy Unit in its Summon Zone, and summons past it only with Pivot", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["human.militiaRecruit", 0]]);
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 10,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 11 }),
      })
    );
    // In the last Column, no Square blocks the Tusk Brute, so the Hero damage is the same for all plays.
    const pivot = emptyBattle({ activeSide: "enemy" });
    giveHand(pivot, "enemy", [["human.gateWarden", 0, "uncommon"]]);
    placeUnit(pivot, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 11,
    });
    expect(chooseCommand(pivot)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 10 }),
      })
    );
  });

  it("aims a damage card at a Unit that it can kill", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["mage.frostBolt", 0]]);
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 3,
      hp: 20,
      maxHp: 20,
    });
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 6,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 6 }),
      })
    );
  });

  it("keeps a Lane Bulwark card when no friendly Unit is in a Lane", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["warrior.shieldWall", 0]]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });
});

/** The enemy AI with one Ready Skill Card, and player Units at these Squares of Lane 0. */
const skillChoice = (
  cardId: string,
  units: readonly (readonly [position: number, hp: number])[]
) => {
  const state = emptyBattle({ activeSide: "enemy" });
  giveHand(state, "enemy", [[cardId, 0]]);
  for (const [position, hp] of units) {
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position,
      hp,
    });
  }
  return chooseCommand(state);
};

/** The player's AI with a Ready Shield Wall, a friendly Unit in Lane 0 and `setup`. */
const shieldWallChoice = (setup: (state: BattleState) => void = () => {}) => {
  const state = emptyBattle();
  giveHand(state, "player", [["warrior.shieldWall", 0]]);
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    position: 1,
  });
  setup(state);
  return chooseCommand(state);
};

/** A play of the first Hand card at a Square of Lane 0. */
const playAt = (position: number) =>
  Command.PlayCard({
    hero: 0,
    handIndex: 0,
    target: Target.Square({ lane: 0, position }),
  });

/** Fills the player's Hand to the Hand Limit with cards that are not Ready. */
const fullHand = (state: BattleState) => {
  giveHand(
    state,
    "player",
    Array.from(
      { length: HAND_LIMIT - heroOf(state, "player").hand.length },
      () => ["human.militiaRecruit", 5] as const
    )
  );
};

const shieldWallAt = (lane: number) =>
  Command.PlayCard({ hero: 0, handIndex: 0, target: Target.Lane({ lane }) });

describe("chooseCommand: Hold Rules (GDD 9)", () => {
  it("keeps Shield Wall until an enemy Unit is in the Lane", () => {
    expect(shieldWallChoice()).toEqual(Command.EndTurn());
    expect(
      shieldWallChoice((state) => {
        placeUnit(state, {
          cardId: "orc.badlandRunt",
          owner: "enemy",
          position: 8,
        });
      })
    ).toEqual(shieldWallAt(0));
  });

  it("keeps War Drums until 2 other cards are not Ready", () => {
    const state = emptyBattle();
    giveHand(state, "player", [
      ["warrior.warDrums", 0],
      ["human.militiaRecruit", 3],
    ]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
    giveHand(state, "player", [["human.shieldbearer", 4]]);
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({ hero: 0, handIndex: 0, target: Target.NoTarget() })
    );
  });

  it("keeps Spear Throw until it kills the target Unit", () => {
    expect(skillChoice("warrior.spearThrow", [[5, 5]])).toEqual(
      Command.EndTurn()
    );
    expect(skillChoice("warrior.spearThrow", [[5, 4]])).toEqual(playAt(5));
  });

  it("keeps Fireball until it kills a Unit or hits 2 Units", () => {
    expect(skillChoice("mage.fireball", [[5, 4]])).toEqual(Command.EndTurn());
    expect(skillChoice("mage.fireball", [[5, 3]])).toEqual(playAt(5));
    expect(
      skillChoice("mage.fireball", [
        [5, 4],
        [6, 4],
      ])
    ).toEqual(playAt(6));
  });

  it("plays Frost Bolt at a Unit that it cannot kill", () => {
    expect(skillChoice("mage.frostBolt", [[5, 20]])).toEqual(playAt(5));
  });

  it("plays a held card when the Hand is full and the Deck has cards", () => {
    expect(shieldWallChoice(fullHand)).toEqual(Command.EndTurn());
    expect(
      shieldWallChoice((state) => {
        fullHand(state);
        heroOf(state, "player").deck = [
          { instanceId: 1, cardId: "orc.tuskBrute", rank: "common" },
        ];
      })
    ).toEqual(shieldWallAt(0));
  });
});

describe("chooseCommand: damage that the AI's Hero will take (GDD 9)", () => {
  it("blocks an enemy Unit that its next action takes to the last Column", () => {
    const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
    giveHand(state, "enemy", [["human.militiaRecruit", 0]]);
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      lane: 0,
      position: 9,
    });
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      lane: 1,
      position: 5,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 10 }),
      })
    );
  });

  it("kills a Unit that will hit its Hero before a Unit of more value", () => {
    expect(
      spearThrowChoice({
        cardId: "orc.scrapRaider",
        owner: "player",
        lane: 0,
        position: 9,
      })
    ).toEqual(spearThrowAt(0, 9));
  });

  it("does not count an enemy Unit that a friendly ground Unit blocks", () => {
    expect(
      spearThrowChoice(
        { cardId: "orc.scrapRaider", owner: "player", lane: 0, position: 9 },
        (state) => {
          placeUnit(state, {
            cardId: "human.townBarricade",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(1, 3));
  });

  it("does not count an enemy ground Unit that a friendly Flying Unit blocks", () => {
    expect(
      spearThrowChoice(
        { cardId: "orc.scrapRaider", owner: "player", lane: 0, position: 9 },
        (state) => {
          placeUnit(state, {
            cardId: "orc.skyreaver",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(1, 3));
  });

  it("counts an enemy Flying Unit that is past a friendly blocker", () => {
    expect(
      spearThrowChoice(
        {
          cardId: "orc.skyreaver",
          owner: "player",
          lane: 0,
          position: 9,
          hp: 4,
        },
        (state) => {
          placeUnit(state, {
            cardId: "human.townBarricade",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(0, 9));
  });

  it("does not count an enemy Flying Unit that a friendly Flying Unit blocks", () => {
    expect(
      spearThrowChoice(
        {
          cardId: "orc.skyreaver",
          owner: "player",
          lane: 0,
          position: 9,
          hp: 4,
        },
        (state) => {
          placeUnit(state, {
            cardId: "orc.skyreaver",
            owner: "enemy",
            lane: 0,
            position: 10,
          });
        }
      )
    ).toEqual(spearThrowAt(1, 3));
  });

  it("blocks an enemy Flying Unit with a new Flying Unit", () => {
    const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
    giveHand(state, "enemy", [["orc.skyreaver", 0]]);
    placeUnit(state, {
      cardId: "orc.skyreaver",
      owner: "player",
      lane: 0,
      position: 9,
    });
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      lane: 1,
      position: 5,
    });
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Square({ lane: 0, position: 10 }),
      })
    );
  });

  it("counts an enemy Ranged Unit that has the Hero in its Range", () => {
    expect(
      spearThrowChoice({
        cardId: "human.crossbowGuard",
        owner: "player",
        lane: 0,
        position: 9,
        hp: 4,
      })
    ).toEqual(spearThrowAt(0, 9));
  });

  it("removes lethal damage first, with the Sudden Death of its next Start Phase", () => {
    // 3 HP − 2 damage is not lethal before Sudden Death, so the Unit of more value dies.
    expect(lethalChoice(1)).toEqual(spearThrowAt(1, 3));
    // At the next Start Phase (Turn 21), Sudden Death deals 1: 3 − 1 − 2 = 0.
    expect(lethalChoice(20)).toEqual(spearThrowAt(0, 10));
  });
});

describe("determinism (BAT-06) and Battle length", () => {
  it("gives the same events from the same seed and Commands", () => {
    expect(autoBattle(11, "1-3", "raiders")).toEqual(
      autoBattle(11, "1-3", "raiders")
    );
  });

  it("finishes every Battle before the Turn limit is passed", () => {
    for (const stage of STAGES) {
      for (const deck of STARTER_DECKS) {
        for (let seed = 1; seed <= 6; seed += 1) {
          const state = stateOf(seed, stage.id, deck.id);
          expect(state.status).toBe("finished");
          expect(state.turnNumber).toBeLessThanOrEqual(TURN_LIMIT);
        }
      }
    }
  });
});

describe("chooseCommand with Unique (GDD 5.4)", () => {
  it("does not play a Unique card while a friendly Unit from it is on the Board", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.marshalElianVoss",
      owner: "player",
      position: 4,
    });
    giveHand(state, "player", [["human.marshalElianVoss", 0]]);
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });
});

/** The enemy AI with a Ready Pinning Shot, one player Scrap Raider at Square 5 and `setup`. */
const pinningShotChoice = (
  raider: Partial<Parameters<typeof placeUnit>[1]> = {},
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ activeSide: "enemy" });
  giveHand(state, "enemy", [["ranger.pinningShot", 0]]);
  // The Scrap Raider survives the 6 damage of the hit.
  placeUnit(state, {
    cardId: "orc.scrapRaider",
    owner: "player",
    position: 5,
    hp: 8,
    ...raider,
  });
  setup(state);
  return chooseCommand(state);
};

describe("chooseCommand: Ranger Skill Cards (GDD 9)", () => {
  it("plays Pinning Shot when it kills the Unit", () => {
    expect(
      pinningShotChoice({ hp: 3 }, (state) => {
        placeUnit(state, {
          cardId: "human.halberdier",
          owner: "enemy",
          position: 6,
        });
      })
    ).toEqual(playAt(5));
  });

  it("plays Pinning Shot when the Unit would move in its next action", () => {
    expect(pinningShotChoice()).toEqual(playAt(5));
  });

  it("keeps Pinning Shot when the Unit would not move, or the hit deals 0 damage", () => {
    // An enemy Unit is in the Square in front of it.
    expect(
      pinningShotChoice({}, (state) => {
        placeUnit(state, {
          cardId: "human.halberdier",
          owner: "enemy",
          position: 6,
        });
      })
    ).toEqual(Command.EndTurn());
    expect(pinningShotChoice({ entangled: true })).toEqual(Command.EndTurn());
    expect(pinningShotChoice({ speed: 0 })).toEqual(Command.EndTurn());
    expect(
      pinningShotChoice({ bonusBulwark: 6, bonusBulwarkTurns: 2 })
    ).toEqual(Command.EndTurn());
    expect(
      pinningShotChoice({ cardId: "human.townBarricade", hp: 15 })
    ).toEqual(Command.EndTurn());
  });

  it("plays Long Shot at the enemy Hero when it is Ready", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["ranger.longShot", 0]]);
    expect(chooseCommand(state)).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Hero({ side: "player", hero: 0 }),
      })
    );
  });

  it("aims Warning Shot at the Unit nearest to its Hero that the push moves", () => {
    // The Unit at Square 9 cannot go back: the Unit at Square 8 stops it.
    // Each Unit survives the hit.
    expect(
      skillChoice("ranger.warningShot", [
        [3, 12],
        [8, 12],
        [9, 12],
      ])
    ).toEqual(playAt(8));
  });

  it("aims Warning Shot at a Unit that the hit kills before a Unit that the push moves (issue #50)", () => {
    // The hit kills the Unit at Square 3. The push moves the Unit at Square 8,
    // which is nearer to the enemy Hero.
    expect(
      skillChoice("ranger.warningShot", [
        [3, 5],
        [8, 12],
      ])
    ).toEqual(playAt(3));
  });

  it("aims Warning Shot at the Unit that takes the most damage when the push moves no Unit, and never keeps it", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["ranger.warningShot", 0]]);
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position: 0,
      hp: 12,
      bonusBulwark: 1,
      bonusBulwarkTurns: 2,
    });
    placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "player",
      position: 4,
    });
    expect(chooseCommand(state)).toEqual(playAt(4));
    expect(skillChoice("ranger.warningShot", [[0, 6]])).toEqual(playAt(0));
  });
});

/** The enemy AI with a Ready Priest card and its own Units. */
const priestChoice = (
  cardId: string,
  friends: readonly Partial<Parameters<typeof placeUnit>[1]>[],
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
  giveHand(state, "enemy", [[cardId, 0, getCard(cardId).baseRank]]);
  for (const friend of friends) {
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 9,
      attack: 0,
      ...friend,
    });
  }
  setup(state);
  return chooseCommand(state);
};

/** One player Scrap Raider in Lane 1, at Square 2. */
const enemy = (state: BattleState) => {
  placeUnit(state, {
    cardId: "orc.scrapRaider",
    owner: "player",
    position: 2,
  });
};

const playAtSquare = (lane: number, position: number) =>
  Command.PlayCard({
    hero: 0,
    handIndex: 0,
    target: Target.Square({ lane, position }),
  });

describe("chooseCommand: Priest Skill Cards (GDD 9)", () => {
  it("keeps Mend until a friendly Unit has lost at least 50% of its maximum HP", () => {
    expect(priestChoice("priest.mend", [{ hp: 6, maxHp: 10 }])).toEqual(
      Command.EndTurn()
    );
    expect(priestChoice("priest.mend", [{ hp: 5, maxHp: 10 }])).toEqual(
      playAtSquare(0, 9)
    );
  });

  it("aims Mend at the Unit that gets back the most HP, after Bleeding", () => {
    // The Bleeding Unit gets 4 of the 8. The other Unit gets 6.
    expect(
      priestChoice("priest.mend", [
        { position: 9, hp: 2, maxHp: 10, bleeding: 1 },
        { position: 8, hp: 4, maxHp: 10 },
      ])
    ).toEqual(playAtSquare(0, 8));
  });

  it("aims Mend at the Unit with the higher maximum HP when two Units get back the same HP", () => {
    expect(
      priestChoice("priest.mend", [
        { position: 9, hp: 1, maxHp: 10 },
        { lane: 1, position: 9, hp: 1, maxHp: 20 },
      ])
    ).toEqual(playAtSquare(1, 9));
  });

  it("keeps Sanctuary until a friendly Unit has an enemy Unit in its Lane", () => {
    expect(priestChoice("priest.sanctuary", [{}])).toEqual(Command.EndTurn());
    expect(
      priestChoice("priest.sanctuary", [{}], (state) => {
        placeUnit(state, {
          cardId: "orc.scrapRaider",
          owner: "player",
          lane: 1,
          position: 2,
        });
      })
    ).toEqual(Command.EndTurn());
  });

  it("aims Sanctuary at the friendly Unit nearest to the enemy, and skips a Unit with a Ward that is not lower", () => {
    expect(
      priestChoice(
        "priest.sanctuary",
        [{ position: 9 }, { position: 7 }],
        enemy
      )
    ).toEqual(playAtSquare(0, 7));
    expect(
      priestChoice(
        "priest.sanctuary",
        [{ position: 9 }, { position: 7, ward: 9 }],
        enemy
      )
    ).toEqual(playAtSquare(0, 9));
    expect(
      priestChoice("priest.sanctuary", [{ position: 9, ward: 9 }], enemy)
    ).toEqual(Command.EndTurn());
  });

  it("aims Sanctuary at the Lane where the enemy is nearest to its Hero", () => {
    expect(
      priestChoice(
        "priest.sanctuary",
        [{ position: 9 }, { lane: 1, position: 9 }],
        (state) => {
          placeUnit(state, {
            cardId: "orc.scrapRaider",
            owner: "player",
            position: 2,
          });
          placeUnit(state, {
            cardId: "orc.scrapRaider",
            owner: "player",
            lane: 1,
            position: 5,
          });
        }
      )
    ).toEqual(playAtSquare(1, 9));
  });

  it("keeps Smite until it kills, with the Spear Throw Hold Rule, and Bulwark does not count", () => {
    expect(skillChoice("priest.smite", [[5, 4]])).toEqual(Command.EndTurn());
    expect(skillChoice("priest.smite", [[5, 3]])).toEqual(playAt(5));
    const bulwarked = emptyBattle({ activeSide: "enemy" });
    giveHand(bulwarked, "enemy", [["priest.smite", 0]]);
    placeUnit(bulwarked, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position: 5,
      hp: 3,
      bonusBulwark: 3,
      bonusBulwarkTurns: 2,
    });
    expect(chooseCommand(bulwarked)).toEqual(playAt(5));
  });

  it("includes the Ward of the target in its kill estimate", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    giveHand(state, "enemy", [["priest.smite", 0]]);
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position: 5,
      hp: 2,
      ward: 2,
    });
    expect(chooseCommand(state)).toEqual(Command.EndTurn());
  });
});

/** The enemy AI with a Ready card at its Base Rank, and player Scrap Raiders (3 Attack) with `options`. */
const raidersChoice = (
  cardId: string,
  raiders: readonly Partial<Parameters<typeof placeUnit>[1]>[],
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
  giveHand(state, "enemy", [[cardId, 0, getCard(cardId).baseRank]]);
  for (const raider of raiders) {
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position: 5,
      ...raider,
    });
  }
  setup(state);
  return chooseCommand(state);
};

/** A hurt enemy-side Militia Recruit (the AI's Unit) in Lane 0. */
const hurtFriend =
  (position: number, hp: number) =>
  (state: BattleState): void => {
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position,
      attack: 0,
      hp,
      maxHp: 8,
    });
  };

describe("chooseCommand: the Skill Cards of #57 (GDD 9)", () => {
  it("keeps Shoulder Charge, Quick Shot, Barbed Arrow and Penance until the hit kills", () => {
    for (const [cardId, kill] of [
      ["warrior.shoulderCharge", 3],
      ["ranger.quickShot", 5],
      // Uncommon: 5 × 1.2 = 6.
      ["ranger.barbedArrow", 6],
      // The Attack of the Scrap Raider.
      ["priest.penance", 3],
    ] as const) {
      expect(raidersChoice(cardId, [{ hp: kill + 1 }]), cardId).toEqual(
        Command.EndTurn()
      );
      expect(raidersChoice(cardId, [{ hp: kill }]), cardId).toEqual(
        playAtSquare(0, 5)
      );
    }
  });

  it("aims Penance at the target with the highest Attack", () => {
    expect(
      raidersChoice("priest.penance", [
        { hp: 3 },
        { lane: 1, position: 6, hp: 5, attack: 5 },
      ])
    ).toEqual(playAtSquare(1, 6));
  });

  it("keeps Shield Bash until it kills, or a friendly Unit is in the Lane of the target", () => {
    expect(raidersChoice("warrior.shieldBash", [{}])).toEqual(
      Command.EndTurn()
    );
    expect(raidersChoice("warrior.shieldBash", [{ hp: 2 }])).toEqual(
      playAtSquare(0, 5)
    );
    expect(raidersChoice("warrior.shieldBash", [{}], hurtFriend(9, 8))).toEqual(
      playAtSquare(0, 5)
    );
  });

  it("keeps Cleave until it kills a Unit or hits 2 Units", () => {
    expect(raidersChoice("warrior.cleave", [{ hp: 6 }])).toEqual(
      Command.EndTurn()
    );
    expect(
      raidersChoice("warrior.cleave", [{ hp: 6 }, { position: 6, hp: 6 }])
    ).toEqual(playAtSquare(0, 6));
  });

  it("counts each Frost hit for Frost Shards and Frost Wave, also at 0 damage, because Frost Freezes", () => {
    const bulwarked = { position: 6, bonusBulwark: 3, bonusBulwarkTurns: 2 };
    expect(raidersChoice("mage.frostShards", [{}])).toEqual(Command.EndTurn());
    expect(raidersChoice("mage.frostShards", [{}, bulwarked])).toEqual(
      playAtSquare(0, 6)
    );
    expect(raidersChoice("mage.frostWave", [{}])).toEqual(Command.EndTurn());
    expect(raidersChoice("mage.frostWave", [{}, bulwarked])).toEqual(
      Command.PlayCard({
        hero: 0,
        handIndex: 0,
        target: Target.Lane({ lane: 0 }),
      })
    );
    // Ground Slam is Physical: a hit at 0 damage does not count.
    expect(raidersChoice("warrior.groundSlam", [{}, bulwarked])).toEqual(
      Command.EndTurn()
    );
  });

  it("plays Harrying Shot with no Hold Rule", () => {
    expect(
      raidersChoice("ranger.harryingShot", [{ hp: 20, maxHp: 20 }])
    ).toEqual(playAtSquare(0, 5));
  });

  it("aims Skybreaker at the enemy Flying Unit that is not Grounded and is nearest to its Hero", () => {
    const bird = { cardId: "orc.skyreaver", hp: 20, maxHp: 20 };
    expect(raidersChoice("ranger.skybreaker", [bird])).toEqual(
      playAtSquare(0, 5)
    );
    expect(
      raidersChoice("ranger.skybreaker", [
        { ...bird, position: 3 },
        { ...bird, lane: 1, position: 7 },
      ])
    ).toEqual(playAtSquare(1, 7));
    // A Flying Unit comes before a kill.
    expect(
      raidersChoice("ranger.skybreaker", [
        { hp: 3 },
        { ...bird, lane: 1, position: 3 },
      ])
    ).toEqual(playAtSquare(1, 3));
    expect(
      raidersChoice("ranger.skybreaker", [
        { ...bird, position: 7, grounded: 2 },
        { ...bird, lane: 1, position: 3 },
      ])
    ).toEqual(playAtSquare(1, 3));
  });

  it("keeps Skybreaker when no enemy Flying Unit can become Grounded and the hit kills no Unit", () => {
    expect(raidersChoice("ranger.skybreaker", [{ hp: 20, maxHp: 20 }])).toEqual(
      Command.EndTurn()
    );
    expect(
      raidersChoice("ranger.skybreaker", [
        { cardId: "orc.skyreaver", hp: 20, maxHp: 20, grounded: 1 },
      ])
    ).toEqual(Command.EndTurn());
    expect(raidersChoice("ranger.skybreaker", [{ hp: 3 }])).toEqual(
      playAtSquare(0, 5)
    );
  });

  it("keeps Blessing of Light with the Sanctuary rule", () => {
    expect(priestChoice("priest.blessingOfLight", [{}])).toEqual(
      Command.EndTurn()
    );
    expect(priestChoice("priest.blessingOfLight", [{}], enemy)).toEqual(
      playAtSquare(0, 9)
    );
  });

  it("keeps Radiant Strike until it kills, or its heal gives back 2 HP or more", () => {
    expect(raidersChoice("priest.radiantStrike", [{}])).toEqual(
      Command.EndTurn()
    );
    expect(
      raidersChoice("priest.radiantStrike", [{}], hurtFriend(9, 7))
    ).toEqual(Command.EndTurn());
    expect(
      raidersChoice("priest.radiantStrike", [{}], hurtFriend(9, 6))
    ).toEqual(playAtSquare(0, 5));
  });

  it("keeps Prayer of Healing until the Lane has lost at least 6 HP in total", () => {
    const lane = Command.PlayCard({
      hero: 0,
      handIndex: 0,
      target: Target.Lane({ lane: 0 }),
    });
    expect(
      priestChoice("priest.prayerOfHealing", [
        { hp: 5, maxHp: 8 },
        { position: 8, hp: 6, maxHp: 8 },
      ])
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice("priest.prayerOfHealing", [
        { hp: 4, maxHp: 8 },
        { position: 8, hp: 6, maxHp: 8 },
      ])
    ).toEqual(lane);
  });
});

describe("chooseCommand: the Rare and Epic Ranger Skill Cards of #59 (GDD 9)", () => {
  it("keeps Venom Arrow while the hit kills, because a Unit that dies gets no stacks", () => {
    // Rare: 4 damage.
    expect(raidersChoice("ranger.venomArrow", [{ hp: 4 }])).toEqual(
      Command.EndTurn()
    );
    expect(raidersChoice("ranger.venomArrow", [{ hp: 5 }])).toEqual(
      playAtSquare(0, 5)
    );
  });

  it("aims Venom Arrow at the Unit with the highest Attack, not at a Wall or a Unit with Bulwark", () => {
    expect(
      raidersChoice("ranger.venomArrow", [
        { hp: 12, maxHp: 12, attack: 1, bonusBulwark: 2, bonusBulwarkTurns: 2 },
        { lane: 1, position: 6, hp: 8, maxHp: 8, attack: 5 },
      ])
    ).toEqual(playAtSquare(1, 6));
  });

  it("aims Venom Arrow at the Unit with more HP left when the Attack is the same", () => {
    expect(
      raidersChoice("ranger.venomArrow", [
        { hp: 2 },
        { lane: 1, position: 6, hp: 9, maxHp: 9 },
      ])
    ).toEqual(playAtSquare(1, 6));
  });

  it("keeps Rain of Arrows until the Lane has 2 enemy Units, or the hit kills", () => {
    const lane = Command.PlayCard({
      hero: 0,
      handIndex: 0,
      target: Target.Lane({ lane: 0 }),
    });
    expect(raidersChoice("ranger.rainOfArrows", [{}])).toEqual(
      Command.EndTurn()
    );
    // Epic: 2 damage.
    expect(raidersChoice("ranger.rainOfArrows", [{ hp: 2 }])).toEqual(lane);
    expect(raidersChoice("ranger.rainOfArrows", [{}, { position: 6 }])).toEqual(
      lane
    );
  });
});

describe("chooseCommand: the Rare and Epic Priest Skill Cards of #61 (GDD 9)", () => {
  it("keeps Cleanse until a friendly Unit has a Debuff of value: Bleeding on a Unit at full HP and a Frozen Wall do not count", () => {
    expect(priestChoice("priest.cleanse", [{}])).toEqual(Command.EndTurn());
    expect(priestChoice("priest.cleanse", [{ bleeding: 2 }])).toEqual(
      Command.EndTurn()
    );
    expect(
      priestChoice("priest.cleanse", [{ frozen: true, wall: true }])
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice("priest.cleanse", [{ bleeding: 2, hp: 7, maxHp: 8 }])
    ).toEqual(playAtSquare(0, 9));
  });

  it("plays Cleanse as a heal with the Mend rule when no Unit has a Debuff of value", () => {
    expect(priestChoice("priest.cleanse", [{ hp: 5, maxHp: 8 }])).toEqual(
      Command.EndTurn()
    );
    expect(priestChoice("priest.cleanse", [{ hp: 4, maxHp: 8 }])).toEqual(
      playAtSquare(0, 9)
    );
  });

  it("aims Cleanse at a Frozen Unit first, then at the Unit with the most Poisoned stacks", () => {
    expect(
      priestChoice("priest.cleanse", [
        { position: 9, poisoned: 5 },
        { lane: 1, position: 9, frozen: true },
      ])
    ).toEqual(playAtSquare(1, 9));
    expect(
      priestChoice("priest.cleanse", [
        { position: 9, poisoned: 2 },
        { lane: 1, position: 9, poisoned: 4 },
      ])
    ).toEqual(playAtSquare(1, 9));
  });

  it("keeps Unbroken Vow until a friendly Unit that is not Steadfast has an enemy Unit in its Lane", () => {
    expect(priestChoice("priest.unbrokenVow", [{}])).toEqual(Command.EndTurn());
    expect(
      priestChoice("priest.unbrokenVow", [{ steadfast: true }], enemy)
    ).toEqual(Command.EndTurn());
    expect(priestChoice("priest.unbrokenVow", [{}], enemy)).toEqual(
      playAtSquare(0, 9)
    );
  });

  it("aims Unbroken Vow at the friendly Unit of the most value", () => {
    expect(
      priestChoice(
        "priest.unbrokenVow",
        [{ position: 9 }, { position: 8, attack: 5 }],
        enemy
      )
    ).toEqual(playAtSquare(0, 8));
  });

  it("does not count a hit on a Steadfast Unit as a kill", () => {
    expect(raidersChoice("warrior.spearThrow", [{ hp: 2 }])).toEqual(
      playAtSquare(0, 5)
    );
    expect(
      raidersChoice("warrior.spearThrow", [{ hp: 2, steadfast: true }])
    ).toEqual(Command.EndTurn());
  });

  it("keeps Aegis of Dawn until a Lane has 2 friendly Units and an enemy Unit", () => {
    const lane = Command.PlayCard({
      hero: 0,
      handIndex: 0,
      target: Target.Lane({ lane: 0 }),
    });
    expect(priestChoice("priest.aegisOfDawn", [{}], enemy)).toEqual(
      Command.EndTurn()
    );
    expect(
      priestChoice("priest.aegisOfDawn", [{ position: 9 }, { position: 8 }])
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice(
        "priest.aegisOfDawn",
        [{ position: 9 }, { position: 8 }],
        enemy
      )
    ).toEqual(lane);
  });
});

const laneTarget = (index: number) =>
  Command.PlayCard({
    hero: 0,
    handIndex: 0,
    target: Target.Lane({ lane: index }),
  });

/** A player Scrap Raider at `position`. */
const playerRaiderAt =
  (position: number, options: Partial<Parameters<typeof placeUnit>[1]> = {}) =>
  (state: BattleState) => {
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position,
      ...options,
    });
  };

describe("chooseCommand: the Rare and Epic Warrior Skill Cards of #63 (GDD 9)", () => {
  it("keeps Expose Weakness until a friendly Physical Unit hits the enemy Unit in this Turn", () => {
    // Militia Recruit: Speed 1, melee. Square 2 is too far from Square 9.
    expect(
      priestChoice("warrior.exposeWeakness", [{ attack: 3 }], playerRaiderAt(2))
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice("warrior.exposeWeakness", [{ attack: 3 }], playerRaiderAt(7))
    ).toEqual(playAtSquare(0, 7));
    // A Unit with Attack 0 does not hit.
    expect(
      priestChoice("warrior.exposeWeakness", [{}], playerRaiderAt(7))
    ).toEqual(Command.EndTurn());
  });

  it("aims Expose Weakness at a Unit with Bulwark, but first at a Unit that the Exposed damage lets the hits kill", () => {
    const bulwarked = { lane: 1, bonusBulwark: 2, bonusBulwarkTurns: 2 };
    expect(
      priestChoice(
        "warrior.exposeWeakness",
        [{ attack: 3 }, { lane: 1, attack: 3 }],
        (state) => {
          playerRaiderAt(7, { hp: 20 })(state);
          playerRaiderAt(7, { ...bulwarked, hp: 20 })(state);
        }
      )
    ).toEqual(playAtSquare(1, 7));
    // Attack 3 + Exposed 2 kills a Unit with 5 HP.
    expect(
      priestChoice(
        "warrior.exposeWeakness",
        [{ attack: 3 }, { lane: 1, attack: 3 }],
        (state) => {
          playerRaiderAt(7, { hp: 5 })(state);
          playerRaiderAt(7, { ...bulwarked, hp: 20 })(state);
        }
      )
    ).toEqual(playAtSquare(0, 7));
  });

  it("keeps Call to Arms until the Lane has 2 friendly Units with Attack above 0, and an enemy Unit or the enemy Hero in reach", () => {
    const two = [
      { position: 9, attack: 3 },
      { position: 8, attack: 3 },
    ];
    expect(priestChoice("warrior.callToArms", two)).toEqual(Command.EndTurn());
    expect(priestChoice("warrior.callToArms", two, playerRaiderAt(2))).toEqual(
      laneTarget(0)
    );
    expect(
      priestChoice(
        "warrior.callToArms",
        [{ position: 9, attack: 3 }, { position: 8 }],
        playerRaiderAt(2)
      )
    ).toEqual(Command.EndTurn());
    // The enemy Hero is in reach from Square 1.
    expect(
      priestChoice("warrior.callToArms", [
        { position: 1, attack: 3 },
        { position: 3, attack: 3 },
      ])
    ).toEqual(laneTarget(0));
  });

  it("keeps Onslaught until the Lane has 2 friendly Units that can act: a Frozen Unit and a Wall do not count", () => {
    expect(
      priestChoice("warrior.onslaught", [
        { position: 9, attack: 3 },
        { position: 8, attack: 3, frozen: true },
      ])
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice("warrior.onslaught", [
        { position: 9, attack: 3 },
        { position: 8, wall: true },
      ])
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice("warrior.onslaught", [
        { position: 9, attack: 3 },
        { position: 8, attack: 3 },
      ])
    ).toEqual(laneTarget(0));
  });

  it("counts Exposed in the kill estimate of a Physical hit", () => {
    // Spear Throw 5 against a Scrap Raider with more HP: Exposed 2 makes it a kill.
    expect(raidersChoice("warrior.spearThrow", [{ hp: 6 }])).toEqual(
      Command.EndTurn()
    );
    expect(
      raidersChoice("warrior.spearThrow", [{ hp: 6, exposed: 2 }])
    ).toEqual(playAtSquare(0, 5));
  });
});

describe("chooseCommand: Hunter's Focus (GDD 9)", () => {
  it("keeps Hunter's Focus until a friendly Unit with Base Attack above 0 attacks in this Turn with the bonus", () => {
    const shooter = {
      cardId: "human.crossbowGuard",
      position: 9,
      attack: 4,
    };
    // Crossbow Guard: Speed 2 and Range 3. It moves to Square 7, and Range 4
    // reaches Square 3.
    expect(
      priestChoice("ranger.huntersFocus", [shooter], playerRaiderAt(2))
    ).toEqual(Command.EndTurn());
    expect(
      priestChoice("ranger.huntersFocus", [shooter], playerRaiderAt(3))
    ).toEqual(playAtSquare(0, 9));
    expect(
      priestChoice("ranger.huntersFocus", [{ position: 9 }], playerRaiderAt(8))
    ).toEqual(Command.EndTurn());
  });

  it("aims Hunter's Focus at the Unit that gets a target from the bonus Range, else at the Unit with the most Attack", () => {
    const shooter = {
      cardId: "human.crossbowGuard",
      position: 9,
      attack: 4,
    };
    const melee = { lane: 1, position: 9, attack: 6 };
    expect(
      priestChoice("ranger.huntersFocus", [shooter, melee], (state) => {
        playerRaiderAt(3)(state);
        playerRaiderAt(8, { lane: 1 })(state);
      })
    ).toEqual(playAtSquare(0, 9));
    expect(
      priestChoice("ranger.huntersFocus", [shooter, melee], (state) => {
        playerRaiderAt(6)(state);
        playerRaiderAt(8, { lane: 1 })(state);
      })
    ).toEqual(playAtSquare(1, 9));
  });
});

/** The Hand index of the AI's play, or undefined when it ends the Turn. */
const playedIndex = (command: Command): number | undefined =>
  command._tag === "PlayCard" ? command.handIndex : undefined;

/**
 * The enemy AI with two Ready Creature Cards and an empty Board. Both cards
 * get the same Square score, so the value of the card decides.
 */
const firstSummon = (
  cards: Parameters<typeof giveHand>[2],
  playerHand: Parameters<typeof giveHand>[2] = []
) => {
  const state = emptyBattle({ activeSide: "enemy" });
  giveHand(state, "enemy", cards);
  giveHand(state, "player", playerHand);
  return playedIndex(chooseCommand(state));
};

/**
 * The enemy AI with one Ready Creature Card and two player Units with Attack 3:
 * a Heavy Unit (Speed 1) in Lane 0 and a Swift Unit (Speed 3) in Lane 1. The
 * Unit in Lane 0 is 1 Square nearer to the AI's Hero, so Lane 0 has a little
 * more threat.
 */
const hobbleChoice = (
  cardId: string,
  setup: (state: BattleState) => void = () => {}
) => {
  const state = emptyBattle({ lanes: 2, activeSide: "enemy" });
  giveHand(state, "enemy", [[cardId, 0]]);
  placeUnit(state, {
    cardId: "feral.caveTroll",
    owner: "player",
    lane: 0,
    position: 4,
  });
  placeUnit(state, {
    cardId: "orc.howlingCharger",
    owner: "player",
    lane: 1,
    position: 3,
  });
  setup(state);
  const command = chooseCommand(state);
  return command._tag === "PlayCard" && command.target._tag === "Square"
    ? command.target.lane
    : undefined;
};

describe("chooseCommand: Goblin Keywords (GDD 9, issue #84)", () => {
  it("gives Sabotage more value when the enemy Hand has a card that is Ready now or in the next Turn", () => {
    const cards = [
      ["elf.brambleDuelist", 0, "uncommon"],
      ["goblin.tunnelSaboteur", 0],
    ] as const;
    // No enemy card: Sabotage does nothing, and the Bramble Duelist has more value.
    expect(firstSummon(cards)).toBe(0);
    expect(firstSummon(cards, [["human.militiaRecruit", 4]])).toBe(0);
    expect(firstSummon(cards, [["human.militiaRecruit", 1]])).toBe(1);
    expect(firstSummon(cards, [["human.militiaRecruit", 0]])).toBe(1);
  });

  it("sends a Hobble Unit to the Lane where it slows a fast enemy Unit", () => {
    // Without Hobble, the AI blocks the Lane with more threat.
    expect(hobbleChoice("human.militiaRecruit")).toBe(0);
    expect(hobbleChoice("goblin.ankleSnatcher")).toBe(1);
    // A Unit that is already Hobbled for as long, or has Speed 1, loses nothing.
    expect(
      hobbleChoice("goblin.ankleSnatcher", (state) => {
        const charger = state.units.find((unit) => unit.lane === 1);
        if (charger) {
          charger.hobbled = 1;
        }
      })
    ).toBe(0);
  });

  it("gives Last Breath a small value", () => {
    // Fuse Runner (2/4, Swift) has less value than Militia Recruit (3/8,
    // Heavy) without its Last Breath 3.
    expect(
      firstSummon([
        ["human.militiaRecruit", 0],
        ["goblin.fuseRunner", 0],
      ])
    ).toBe(1);
  });
});
