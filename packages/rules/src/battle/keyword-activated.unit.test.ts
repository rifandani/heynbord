import { describe, expect, it } from "vitest";

import { KEYWORD_ACTIVATES } from "../content/keywords";
import type { ActivatedKeyword } from "../content/keywords";
import {
  emptyBattle,
  eventsOfType,
  giveHand,
  placeUnit,
  preventRout,
  run,
} from "../testing/fixtures";
import { Command, Target } from "./types";
import type { BattleEvent, BattleState, Side } from "./types";

const endTurn = Command.EndTurn();

const play = (target: Target) =>
  Command.PlayCard({ hero: 0, handIndex: 0, target });

const square = (lane: number, position: number) =>
  Target.Square({ lane, position });

/** A target that does not move or attack: 0 Attack, 20 HP, Speed 0. */
const dummy = (
  state: BattleState,
  owner: Side,
  position: number,
  options: Partial<Parameters<typeof placeUnit>[1]> = {}
) =>
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner,
    position,
    attack: 0,
    hp: 20,
    maxHp: 20,
    speed: 0,
    ...options,
  });

/** A Physical attacker with Speed 0, so that only the Keyword under test acts. */
const attacker = (
  state: BattleState,
  cardId: string,
  owner: Side,
  position: number,
  options: Partial<Parameters<typeof placeUnit>[1]> = {}
) =>
  placeUnit(state, {
    cardId,
    owner,
    position,
    damageType: "physical",
    speed: 0,
    ...options,
  });

/** The player's Resolution Phase and End Phase, then the enemy's Start Phase. */
const resolve = (state: BattleState) => {
  preventRout(state);
  return run(state, endTurn).events;
};

/** The enemy's Turn, then the player's Start Phase (Regenerate and Rally). */
const nextPlayerStart = (state: BattleState) => {
  state.activeSide = "enemy";
  preventRout(state);
  return run(state, endTurn).events;
};

const activations = (events: readonly BattleEvent[], keyword?: string) =>
  eventsOfType(events, "KeywordActivated").filter(
    (event) => keyword === undefined || event.keyword === keyword
  );

/**
 * One Battle in which the Keyword activates one time. `around` is the tag of
 * the event just before `KeywordActivated` (`undefined` when it is the first
 * event of the Command) and the tag of the event just after it.
 */
interface Scenario {
  readonly events: readonly BattleEvent[];
  readonly unitId: number;
  readonly side: Side;
  readonly value?: number;
  readonly around: readonly [
    BattleEvent["_tag"] | undefined,
    BattleEvent["_tag"],
  ];
}

/** A scenario for each Keyword that activates. A new one fails the type check here. */
const SCENARIOS = {
  charge: () => {
    const state = emptyBattle();
    // Swift (Speed 3) and Charge 1 at Uncommon: 4 Squares in the Turn of the summon.
    const knight = placeUnit(state, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      rank: "uncommon",
      summonedTurn: 1,
    });
    return {
      events: resolve(state),
      unitId: knight.id,
      side: "player",
      value: 1,
      around: [undefined, "UnitMoved"],
    };
  },
  entangle: () => {
    const state = emptyBattle();
    const vinewarden = attacker(state, "elf.canopyVinewarden", "player", 0, {
      rank: "epic",
    });
    dummy(state, "enemy", 3);
    return {
      events: resolve(state),
      unitId: vinewarden.id,
      side: "player",
      around: ["DamageDealt", "StatusApplied"],
    };
  },
  firstStrike: () => {
    const state = emptyBattle();
    attacker(state, "human.militiaRecruit", "player", 4, {
      attack: 1,
      hp: 20,
      maxHp: 20,
    });
    const defender = dummy(state, "enemy", 5, {
      attack: 2,
      firstStrike: true,
    });
    return {
      events: resolve(state),
      unitId: defender.id,
      side: "enemy",
      around: [undefined, "DamageDealt"],
    };
  },
  heroic: () => {
    const state = emptyBattle();
    const brute = attacker(state, "orc.tuskBrute", "player", 4);
    dummy(state, "enemy", 5);
    return {
      events: resolve(state),
      unitId: brute.id,
      side: "player",
      value: 1,
      around: ["DamageDealt", "HeroicGained"],
    };
  },
  lastBreath: () => {
    const state = emptyBattle();
    attacker(state, "human.militiaRecruit", "player", 4, {
      hp: 20,
      maxHp: 20,
    });
    const runt = attacker(state, "orc.badlandRunt", "enemy", 5, { hp: 1 });
    return {
      events: resolve(state),
      unitId: runt.id,
      side: "enemy",
      value: 1,
      around: ["UnitDied", "DamageDealt"],
    };
  },
  pivot: () => {
    const state = emptyBattle();
    const warden = attacker(state, "human.gateWarden", "player", 5);
    dummy(state, "enemy", 4);
    dummy(state, "enemy", 6);
    return {
      events: resolve(state),
      unitId: warden.id,
      side: "player",
      around: [undefined, "UnitAttacked"],
    };
  },
  poison: () => {
    const state = emptyBattle();
    const tender = attacker(state, "elf.acornTender", "player", 0);
    dummy(state, "enemy", 3);
    return {
      events: resolve(state),
      unitId: tender.id,
      side: "player",
      around: ["DamageDealt", "StatusApplied"],
    };
  },
  rebirth: () => {
    const state = emptyBattle();
    attacker(state, "human.militiaRecruit", "player", 4);
    const lancer = attacker(state, "undead.coffinLancer", "enemy", 5, {
      hp: 1,
    });
    return {
      events: resolve(state),
      unitId: lancer.id,
      side: "enemy",
      around: ["DamageDealt", "UnitReborn"],
    };
  },
  rally: () => {
    const state = emptyBattle();
    const chaplain = attacker(state, "human.bannerChaplain", "player", 0, {
      rank: "uncommon",
    });
    attacker(state, "human.militiaRecruit", "player", 1);
    return {
      events: nextPlayerStart(state),
      unitId: chaplain.id,
      side: "player",
      value: 1,
      around: ["TurnStarted", "UnitsRallied"],
    };
  },
  regenerate: () => {
    const state = emptyBattle();
    const bear = attacker(state, "feral.caveBear", "player", 0, { hp: 5 });
    return {
      events: nextPlayerStart(state),
      unitId: bear.id,
      side: "player",
      value: 1,
      around: ["TurnStarted", "UnitHealed"],
    };
  },
  hobble: () => {
    const state = emptyBattle();
    const snatcher = attacker(state, "goblin.ankleSnatcher", "player", 4);
    dummy(state, "enemy", 5);
    return {
      events: resolve(state),
      unitId: snatcher.id,
      side: "player",
      value: 1,
      around: ["DamageDealt", "StatusApplied"],
    };
  },
  bleed: () => {
    const state = emptyBattle();
    const lynx = attacker(state, "feral.frostfangLynx", "player", 4);
    dummy(state, "enemy", 5);
    return {
      events: resolve(state),
      unitId: lynx.id,
      side: "player",
      value: 1,
      around: ["DamageDealt", "StatusApplied"],
    };
  },
  knockback: () => {
    const state = emptyBattle();
    const pikeman = attacker(state, "human.bridgePikeman", "player", 4, {
      rank: "uncommon",
    });
    dummy(state, "enemy", 5);
    return {
      events: resolve(state),
      unitId: pikeman.id,
      side: "player",
      value: 1,
      around: ["DamageDealt", "UnitPushed"],
    };
  },
  retaliate: () => {
    const state = emptyBattle();
    attacker(state, "human.militiaRecruit", "player", 4, {
      attack: 1,
      hp: 20,
      maxHp: 20,
    });
    const halberdier = attacker(state, "human.halberdier", "enemy", 5, {
      hp: 20,
      maxHp: 20,
    });
    return {
      events: resolve(state),
      unitId: halberdier.id,
      side: "enemy",
      around: ["DamageDealt", "DamageDealt"],
    };
  },
  sabotage: () => {
    const state = emptyBattle();
    giveHand(state, "player", [["goblin.tunnelSaboteur", 0]]);
    giveHand(state, "enemy", [["human.militiaRecruit", 2]]);
    const { state: next, events } = run(state, play(square(0, 0)));
    return {
      events,
      unitId: next.units[0]?.id ?? -1,
      side: "player",
      value: 1,
      around: ["UnitSummoned", "CardSabotaged"],
    };
  },
  summon: () => {
    const state = emptyBattle();
    giveHand(state, "player", [["undead.graveBellTender", 0]]);
    const { state: next, events } = run(state, play(square(0, 1)));
    const tender = next.units.find((unit) => unit.source._tag === "Card");
    return {
      events,
      unitId: tender?.id ?? -1,
      side: "player",
      around: ["UnitSummoned", "TokenSummoned"],
    };
  },
  swarm: () => {
    const state = emptyBattle();
    const knife = attacker(state, "undead.rattleknife", "player", 4);
    dummy(state, "player", 0);
    dummy(state, "enemy", 5);
    return {
      events: resolve(state),
      unitId: knife.id,
      side: "player",
      value: 1,
      around: ["UnitAttacked", "DamageDealt"],
    };
  },
  trample: () => {
    const state = emptyBattle();
    const rhino = attacker(state, "feral.cragRhino", "player", 4, {
      rank: "uncommon",
    });
    dummy(state, "enemy", 5, { hp: 1 });
    dummy(state, "enemy", 6);
    return {
      events: resolve(state),
      unitId: rhino.id,
      side: "player",
      around: ["UnitDied", "DamageDealt"],
    };
  },
  bolt: () => {
    const state = emptyBattle();
    const grosh = placeUnit(state, {
      cardId: "orc.ashcallerGrosh",
      owner: "player",
      position: 4,
    });
    dummy(state, "enemy", 5);
    return {
      events: nextPlayerStart(state),
      unitId: grosh.id,
      side: "player",
      value: 2,
      around: ["TurnStarted", "DamageDealt"],
    };
  },
  ironGuard: () => {
    const state = emptyBattle();
    const aldric = placeUnit(state, {
      cardId: "human.serAldricStonewall",
      owner: "player",
      position: 4,
      hp: 20,
      maxHp: 20,
    });
    attacker(state, "human.militiaRecruit", "enemy", 5, {
      attack: 6,
      hp: 20,
      maxHp: 20,
    });
    // The player ends its Turn; the enemy attacks in its own Turn.
    const enemyTurn = run(state, endTurn).state;
    return {
      events: run(enemyTurn, endTurn).events,
      unitId: aldric.id,
      side: "player",
      around: ["UnitAttacked", "DamageDealt"],
    };
  },
  soulHarvest: () => {
    const state = emptyBattle();
    const ysolde = placeUnit(state, {
      cardId: "undead.paleCantorYsolde",
      owner: "player",
      position: 4,
    });
    dummy(state, "enemy", 5, { hp: 1, maxHp: 1 });
    return {
      events: resolve(state),
      unitId: ysolde.id,
      side: "player",
      around: ["UnitDied", "SoulHarvestGained"],
    };
  },
  herosBane: () => {
    const state = emptyBattle();
    const grix = placeUnit(state, {
      cardId: "goblin.grixRatwhistle",
      owner: "player",
      position: 4,
    });
    return {
      events: nextPlayerStart(state),
      unitId: grix.id,
      side: "player",
      around: ["TurnStarted", "DamageDealt"],
    };
  },
  spawnbane: () => {
    const state = emptyBattle();
    const saelith = placeUnit(state, {
      cardId: "elf.wardenSaelith",
      owner: "enemy",
      position: 4,
    });
    giveHand(state, "player", [["human.militiaRecruit", 0]]);
    return {
      events: run(state, play(square(0, 1))).events,
      unitId: saelith.id,
      side: "enemy",
      value: 2,
      around: ["UnitSummoned", "DamageDealt"],
    };
  },
  vampirism: () => {
    const state = emptyBattle();
    const gorehorn = placeUnit(state, {
      cardId: "feral.gorehornRedMaw",
      owner: "player",
      position: 4,
      hp: 1,
    });
    dummy(state, "enemy", 5);
    return {
      events: resolve(state),
      unitId: gorehorn.id,
      side: "player",
      around: ["DamageDealt", "UnitHealed"],
    };
  },
  wallbreaker: () => {
    const state = emptyBattle();
    const aldric = attacker(state, "human.serAldricStonewall", "player", 4);
    dummy(state, "enemy", 5, { wall: true });
    return {
      events: resolve(state),
      unitId: aldric.id,
      side: "player",
      around: ["UnitAttacked", "DamageDealt"],
    };
  },
  piercing: () => {
    const state = emptyBattle();
    const gorehorn = attacker(state, "feral.gorehornRedMaw", "player", 4);
    dummy(state, "enemy", 5, { bulwark: 2 });
    return {
      events: resolve(state),
      unitId: gorehorn.id,
      side: "player",
      around: ["UnitAttacked", "DamageDealt"],
    };
  },
  quickStudy: () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const grix = placeUnit(state, {
      cardId: "goblin.grixRatwhistle",
      owner: "player",
      position: 4,
    });
    giveHand(state, "player", [
      ["human.militiaRecruit", 3],
      ["human.shieldbearer", 5],
    ]);
    giveHand(state, "enemy", [["mage.spark", 0]]);
    const { events } = run(state, play(square(0, 4)));
    return {
      events,
      unitId: grix.id,
      side: "player",
      around: ["CardPlayed", "CountdownChanged"],
    };
  },
  heal: () => {
    const state = emptyBattle();
    const saelith = placeUnit(state, {
      cardId: "elf.wardenSaelith",
      owner: "player",
      position: 0,
    });
    dummy(state, "player", 1, { hp: 3, maxHp: 8 });
    return {
      events: nextPlayerStart(state),
      unitId: saelith.id,
      side: "player",
      value: 2,
      around: ["TurnStarted", "UnitHealed"],
    };
  },
  dispel: () => {
    // The random state 3 makes the 20% roll of the Dispel succeed.
    const state = emptyBattle({ random: 3 });
    const ysolde = placeUnit(state, {
      cardId: "undead.paleCantorYsolde",
      owner: "player",
      position: 0,
    });
    dummy(state, "player", 1, { bleeding: 3 });
    return {
      events: nextPlayerStart(state),
      unitId: ysolde.id,
      side: "player",
      around: ["TurnStarted", "DebuffRemoved"],
    };
  },
} satisfies { readonly [K in ActivatedKeyword]: () => Scenario };

const scenarioOf = new Map<string, () => Scenario>(Object.entries(SCENARIOS));

const ACTIVATED = Object.entries(KEYWORD_ACTIVATES).flatMap(
  ([keyword, activates]) => (activates ? [keyword] : [])
);

describe("KeywordActivated (GDD 5.4)", () => {
  it("has a scenario for each Keyword that activates", () => {
    expect(Object.keys(SCENARIOS).toSorted()).toEqual(ACTIVATED.toSorted());
  });

  it("does not activate a Keyword that only sets a value", () => {
    expect(
      Object.entries(KEYWORD_ACTIVATES)
        .filter(([, activates]) => !activates)
        .map(([keyword]) => keyword)
        .toSorted()
    ).toEqual([
      "bulwark",
      "extremeRange",
      "fleet",
      "flying",
      "heavy",
      "longRange",
      "midRange",
      "resistance",
      "swift",
      "unique",
      "wall",
    ]);
  });

  it.each(ACTIVATED)(
    "%s: one event with the Unit, the Hero and the value, in the correct order",
    (keyword) => {
      const make = scenarioOf.get(keyword);
      if (!make) {
        throw new Error(`No scenario for the Keyword ${keyword}`);
      }
      const scenario = make();
      const { events } = scenario;
      const found = activations(events, keyword);
      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject({
        unitId: scenario.unitId,
        keyword,
        hero: { side: scenario.side, hero: 0 },
      });
      expect(found[0]?.value).toBe(scenario.value);
      // A Keyword with no value has no `value` field.
      expect("value" in (found[0] ?? {})).toBe(scenario.value !== undefined);
      const index = events.findIndex(
        (event) =>
          event._tag === "KeywordActivated" && event.keyword === keyword
      );
      expect([events[index - 1]?._tag, events[index + 1]?._tag]).toEqual(
        scenario.around
      );
    }
  );
});

describe("KeywordActivated: no effect, so no event", () => {
  it("Charge: the Unit was not summoned in this Turn", () => {
    const state = emptyBattle({ turnNumber: 2 });
    placeUnit(state, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      rank: "uncommon",
      summonedTurn: 1,
    });
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Charge: an enemy Unit stops the Unit where it stops without Charge", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      rank: "uncommon",
      summonedTurn: 1,
    });
    dummy(state, "enemy", 4);
    const events = resolve(state);
    expect(eventsOfType(events, "UnitMoved")).toEqual([
      expect.objectContaining({ from: 0, to: 3 }),
    ]);
    expect(activations(events, "charge")).toEqual([]);
  });

  it("Charge: a ranged Unit stops in Range where it stops without Charge", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      rank: "uncommon",
      summonedTurn: 1,
      bonusRange: 2,
      bonusRangeTurns: 1,
    });
    dummy(state, "enemy", 5);
    const events = resolve(state);
    expect(eventsOfType(events, "UnitMoved")).toEqual([
      expect.objectContaining({ from: 0, to: 2 }),
    ]);
    expect(activations(events, "charge")).toEqual([]);
  });

  it("Charge: a Hobbled Unit has a maximum Speed of 1", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      rank: "uncommon",
      summonedTurn: 1,
      hobbled: 1,
    });
    expect(activations(resolve(state), "charge")).toEqual([]);
  });

  it("Knockback: the Unit does not change Square", () => {
    const state = emptyBattle();
    attacker(state, "human.bridgePikeman", "player", 4, { rank: "uncommon" });
    dummy(state, "enemy", 5);
    dummy(state, "enemy", 6);
    const events = resolve(state);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
    expect(activations(events)).toEqual([]);
  });

  it("Knockback: a Wall is never Pushed", () => {
    const state = emptyBattle();
    attacker(state, "human.bridgePikeman", "player", 4, { rank: "uncommon" });
    dummy(state, "enemy", 5, { wall: true });
    expect(activations(resolve(state))).toEqual([]);
  });

  it.each(["bleed", "hobble", "poison", "entangle"] as const)(
    "%s: a Ward absorbs the full hit, so the damage is 0",
    (keyword) => {
      const state = emptyBattle();
      attacker(state, "goblin.ankleSnatcher", "player", 4, {
        attack: 2,
        bleed: keyword === "bleed" ? 1 : 0,
        hobble: keyword === "hobble" ? 1 : 0,
        poison: keyword === "poison",
        entangle: keyword === "entangle",
      });
      dummy(state, "enemy", 5, { ward: 10 });
      const events = resolve(state);
      expect(eventsOfType(events, "DamageDealt")).toEqual([
        expect.objectContaining({ amount: 0, absorbed: 2 }),
      ]);
      expect(activations(events)).toEqual([]);
    }
  );

  it("Bleed: the Unit already has the same or a higher Bleeding count", () => {
    const state = emptyBattle();
    attacker(state, "feral.frostfangLynx", "player", 4);
    dummy(state, "enemy", 5, { bleeding: 3 });
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Hobble: the Unit already has the same or a higher Hobbled count", () => {
    const state = emptyBattle();
    attacker(state, "goblin.ankleSnatcher", "player", 4);
    dummy(state, "enemy", 5, { hobbled: 1 });
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Entangle: the Unit is already Entangled", () => {
    const state = emptyBattle();
    attacker(state, "elf.canopyVinewarden", "player", 0, { rank: "epic" });
    dummy(state, "enemy", 3, { entangled: true });
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Regenerate: the Unit has its maximum HP, or Bleeding halves the heal to 0", () => {
    const state = emptyBattle();
    attacker(state, "feral.caveBear", "player", 0);
    attacker(state, "feral.caveBear", "player", 1, { hp: 5, bleeding: 3 });
    const events = nextPlayerStart(state);
    expect(eventsOfType(events, "UnitHealed")).toEqual([]);
    expect(activations(events)).toEqual([]);
  });

  it("Rally: no other friendly Unit is in the Lane", () => {
    const state = emptyBattle();
    attacker(state, "human.bannerChaplain", "player", 0, { rank: "uncommon" });
    expect(activations(nextPlayerStart(state))).toEqual([]);
  });

  it("Swarm: no other friendly Unit is in the Lane", () => {
    const state = emptyBattle();
    attacker(state, "undead.rattleknife", "player", 4);
    dummy(state, "enemy", 5);
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Heroic: the Unit attacks a Hero, not a Unit", () => {
    const state = emptyBattle();
    attacker(state, "orc.tuskBrute", "player", 11);
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Pivot: no enemy Unit is behind the Unit or next to it", () => {
    const state = emptyBattle();
    attacker(state, "human.gateWarden", "player", 5);
    dummy(state, "enemy", 6);
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Last Breath: no enemy Unit is ahead of the Unit", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["ranger.warningShot", 0]]);
    attacker(state, "orc.badlandRunt", "enemy", 5, { hp: 1 });
    const { events } = run(state, play(square(0, 5)));
    expect(eventsOfType(events, "UnitDied")).toHaveLength(1);
    expect(activations(events)).toEqual([]);
  });

  it("Trample: no enemy Unit is in the Square behind the killed Unit", () => {
    const state = emptyBattle();
    attacker(state, "feral.cragRhino", "player", 4, { rank: "uncommon" });
    dummy(state, "enemy", 5, { hp: 1 });
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Retaliate and First Strike: the defender is Frozen or Paralyzed", () => {
    const state = emptyBattle({ lanes: 2 });
    attacker(state, "human.militiaRecruit", "player", 4, { attack: 1 });
    attacker(state, "human.halberdier", "enemy", 5, {
      hp: 20,
      maxHp: 20,
      frozen: true,
    });
    attacker(state, "human.militiaRecruit", "player", 4, {
      lane: 1,
      attack: 1,
    });
    dummy(state, "enemy", 5, {
      lane: 1,
      attack: 2,
      firstStrike: true,
      paralyzed: true,
    });
    expect(activations(resolve(state))).toEqual([]);
  });

  it("Rebirth: Steadfast keeps the Unit at 1 HP", () => {
    const state = emptyBattle();
    attacker(state, "human.militiaRecruit", "player", 4);
    attacker(state, "undead.coffinLancer", "enemy", 5, {
      hp: 1,
      steadfast: true,
    });
    const events = resolve(state);
    expect(eventsOfType(events, "SteadfastHeld")).toHaveLength(1);
    expect(activations(events)).toEqual([]);
  });

  it("Sabotage: the enemy Hand is empty", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["goblin.tunnelSaboteur", 0]]);
    expect(activations(run(state, play(square(0, 0))).events)).toEqual([]);
  });

  it("Summon: no Square for the Token is on the Board", () => {
    const state = emptyBattle();
    giveHand(state, "player", [["undead.graveBellTender", 0]]);
    const { events } = run(state, play(square(0, 0)));
    expect(eventsOfType(events, "TokenSummoned")).toEqual([]);
    expect(activations(events)).toEqual([]);
  });

  it("Quick Study: the Hand of the Hero of the Unit is empty", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    placeUnit(state, {
      cardId: "goblin.grixRatwhistle",
      owner: "player",
      position: 4,
    });
    giveHand(state, "enemy", [["mage.spark", 0]]);
    const { events } = run(state, play(square(0, 4)));
    expect(activations(events, "quickStudy")).toEqual([]);
  });

  it("Heal: no friendly Unit is below its maximum HP", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "elf.wardenSaelith",
      owner: "player",
      position: 0,
    });
    expect(activations(nextPlayerStart(state), "heal")).toEqual([]);
  });

  it("Dispel: no friendly Unit has a Debuff", () => {
    const state = emptyBattle({ random: 3 });
    placeUnit(state, {
      cardId: "undead.paleCantorYsolde",
      owner: "player",
      position: 0,
    });
    expect(activations(nextPlayerStart(state), "dispel")).toEqual([]);
  });
});

describe("KeywordActivated: hidden information", () => {
  it("Sabotage does not name the enemy Hand card", () => {
    const { events } = SCENARIOS.sabotage();
    const [event] = activations(events);
    expect(Object.keys(event ?? {}).toSorted()).toEqual([
      "_tag",
      "hero",
      "keyword",
      "unitId",
      "value",
    ]);
    expect(JSON.stringify(event)).not.toContain("cardId");
  });
});

describe("The source of DamageDealt and the Hero of CardPlayed", () => {
  it("names the Unit and its Hero for an attack, a Retaliate and a Last Breath", () => {
    const retaliate = SCENARIOS.retaliate().events;
    const [attack, back] = eventsOfType(retaliate, "DamageDealt");
    expect(attack?.dealer).toEqual({
      _tag: "Unit",
      unitId: expect.any(Number),
      hero: { side: "player", hero: 0 },
      piercing: false,
      wallbreaker: false,
    });
    expect(back?.dealer).toEqual({
      _tag: "Unit",
      unitId: SCENARIOS.retaliate().unitId,
      hero: { side: "enemy", hero: 0 },
      piercing: false,
      wallbreaker: false,
    });
    const lastBreath = SCENARIOS.lastBreath();
    expect(
      eventsOfType(lastBreath.events, "DamageDealt").find(
        (event) => event.source === "lastBreath"
      )?.dealer
    ).toEqual({
      _tag: "Unit",
      unitId: lastBreath.unitId,
      hero: { side: "enemy", hero: 0 },
      piercing: false,
      wallbreaker: false,
    });
  });

  it("names the Hero for a Skill Card, of each Side", () => {
    for (const side of ["player", "enemy"] as const) {
      const state = emptyBattle({ activeSide: side });
      giveHand(state, side, [["mage.spark", 0]]);
      dummy(state, side === "player" ? "enemy" : "player", 6);
      const { events } = run(state, play(square(0, 6)));
      expect(eventsOfType(events, "CardPlayed")).toEqual([
        expect.objectContaining({ side, hero: { side, hero: 0 } }),
      ]);
      expect(eventsOfType(events, "DamageDealt")).toEqual([
        expect.objectContaining({
          source: "skill",
          dealer: { _tag: "Hero", hero: { side, hero: 0 } },
        }),
      ]);
    }
  });

  it("names the Hero for a Field Effect hit", () => {
    const state = emptyBattle({ lanes: 2 });
    giveHand(state, "player", [["mage.wildfire", 0, "rare"]]);
    dummy(state, "enemy", 6);
    preventRout(state);
    const placed = run(state, play(square(0, 6))).state;
    const { events } = run(placed, endTurn);
    expect(
      eventsOfType(events, "DamageDealt").filter(
        (event) => event.source === "field"
      )
    ).toEqual([
      expect.objectContaining({
        dealer: { _tag: "Hero", hero: { side: "player", hero: 0 } },
      }),
    ]);
  });

  it("names no source for Burn, Poison and Sudden Death", () => {
    const state = emptyBattle({ turnNumber: 20, activeSide: "enemy" });
    dummy(state, "enemy", 9, { burn: 2, poisoned: 2 });
    const events = nextPlayerStart(state);
    const damage = eventsOfType(events, "DamageDealt");
    expect(damage.map((event) => event.source)).toEqual([
      "burn",
      "poison",
      "suddenDeath",
    ]);
    expect(damage.map((event) => event.dealer)).toEqual([null, null, null]);
  });
});
