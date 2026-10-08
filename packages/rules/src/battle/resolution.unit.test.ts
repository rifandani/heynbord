import { describe, expect, it } from "vitest";

import {
  emptyBattle,
  eventsOfType,
  placeUnit,
  run,
  unitById,
} from "../testing/fixtures";
import { Command } from "./types";
import type { BattleEvent } from "./types";

const endTurn = Command.EndTurn();

const hobbleHit = (hobble: number, hobbled: number) => {
  const state = emptyBattle();
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    position: 4,
    attack: 2,
    hobble,
  });
  const target = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "enemy",
    position: 5,
    attack: 0,
    hp: 20,
    maxHp: 20,
    hobbled,
  });
  const result = run(state, endTurn);
  const status = eventsOfType(result.events, "StatusApplied").find(
    (event) => event.status === "hobble"
  );
  return {
    count: unitById(result.state, target.id)?.hobbled,
    event: status?.count,
  };
};

const hobbledByPavise = (rank: "rare" | "epic" | "legendary") => {
  const state = emptyBattle();
  placeUnit(state, {
    cardId: "human.paviseArbalist",
    owner: "player",
    position: 0,
    rank,
  });
  const target = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "enemy",
    position: 4,
    attack: 0,
    hp: 30,
    maxHp: 30,
  });
  return unitById(run(state, endTurn).state, target.id)?.hobbled;
};

/** The position of a River Knight after the Turn of its summon, from Square 0. */
const chargeByRank = (rank: "uncommon" | "epic" | "legendary") => {
  const state = emptyBattle({ turnNumber: 3 });
  const knight = placeUnit(state, {
    cardId: "human.riverKnight",
    owner: "player",
    position: 0,
    summonedTurn: 3,
    rank,
  });
  return unitById(run(state, endTurn).state, knight.id)?.position;
};
describe("movement (GDD 4.5)", () => {
  it("moves a ground Unit forward by its Speed", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(2);
    expect(eventsOfType(events, "UnitMoved")).toEqual([
      expect.objectContaining({ unitId: runt.id, from: 0, to: 2 }),
    ]);
  });

  it("moves a ground Unit through a friendly Wall", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
    });
    placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "player",
      position: 1,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(2);
    expect(eventsOfType(events, "UnitMoved")).toEqual([
      expect.objectContaining({ unitId: runt.id, from: 0, to: 2 }),
    ]);
  });

  it("stops a ground Unit in the farthest empty Square when a friendly Unit holds the last Square of its Speed", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
    });
    placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "player",
      position: 2,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(1);
  });

  it("moves a ground Unit through a friendly Unit that does not move", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
    });
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 1,
      frozen: true,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(2);
  });

  it("moves an enemy ground Unit through a friendly Unit toward the player's Hero", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 11,
    });
    placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "enemy",
      position: 10,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(9);
  });

  it("keeps a faster ground Unit behind a slower friendly Unit that acts first", () => {
    const state = emptyBattle();
    const fast = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
    });
    const slow = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 1,
      speed: 1,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, slow.id)?.position).toBe(2);
    expect(unitById(next, fast.id)?.position).toBe(1);
  });

  it("moves a ground Unit past a much slower friendly Unit", () => {
    const state = emptyBattle();
    const fast = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
      speed: 3,
    });
    const slow = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 1,
      speed: 1,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, slow.id)?.position).toBe(2);
    expect(unitById(next, fast.id)?.position).toBe(3);
  });

  it("stops a ground Unit before an enemy Unit", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 1,
      attack: 0,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(0);
  });

  it("moves a Flying Unit over other Units into the farthest empty Square", () => {
    const state = emptyBattle();
    const bird = placeUnit(state, {
      cardId: "orc.skyreaver",
      owner: "player",
      position: 3,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 4,
      attack: 0,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, bird.id)?.position).toBe(5);
  });

  it("never moves a Unit past its last Column", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 10,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(11);
  });

  it("moves enemy Units toward the player's Hero", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 11,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, runt.id)?.position).toBe(9);
  });

  it("keeps a ranged Unit in place when an enemy is in its Range", () => {
    const state = emptyBattle();
    const archer = placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 2,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, archer.id)?.position).toBe(2);
    expect(eventsOfType(events, "UnitAttacked")[0]).toMatchObject({
      unitId: archer.id,
      ranged: true,
    });
  });

  it("gives Charge N +N Speed, with Charge 1, 2 and 3 at Uncommon, Epic and Legendary", () => {
    expect([
      chargeByRank("uncommon"),
      chargeByRank("epic"),
      chargeByRank("legendary"),
    ]).toEqual([3, 4, 5]);
  });

  it("gives Charge +1 Speed only in the Turn of the summon", () => {
    const fresh = emptyBattle({ turnNumber: 3 });
    const knight = placeUnit(fresh, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      summonedTurn: 3,
      rank: "uncommon",
    });
    expect(unitById(run(fresh, endTurn).state, knight.id)?.position).toBe(3);

    const old = emptyBattle({ turnNumber: 4 });
    const veteran = placeUnit(old, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      summonedTurn: 3,
      rank: "uncommon",
    });
    expect(unitById(run(old, endTurn).state, veteran.id)?.position).toBe(2);
  });
});

describe("attack (GDD 4.6)", () => {
  it("attacks the enemy Unit in the next Square", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 4,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
    });
    const { events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitAttacked")[0]?.target).toEqual({
      _tag: "Unit",
      unitId: target.id,
    });
  });

  it("attacks the enemy Hero from the last Column, with Heroic", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.scrapRaider",
      owner: "player",
      position: 11,
    });
    const { state: next } = run(state, endTurn);
    // Attack 3 + Heroic 1.
    expect(next.sides.enemy.hero.hp).toBe(26);
  });

  it("does not attack a friendly Unit in front", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 3,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      attack: 0,
    });
    const { events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitAttacked")).toHaveLength(0);
  });

  it("lets a ranged Unit hit the nearest enemy over friendly Units", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 1,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 2,
      attack: 0,
    });
    const near = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 3,
      attack: 0,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 4,
      attack: 0,
    });
    const { events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitAttacked")[0]?.target).toEqual({
      _tag: "Unit",
      unitId: near.id,
    });
  });

  it("lets a ranged Unit hit the enemy Hero when the Hero is in Range", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 9,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitMoved")).toHaveLength(0);
    expect(next.sides.enemy.hero.hp).toBe(26);
  });

  it("does not attack with Attack 0", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 11,
      attack: 0,
    });
    const { events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitAttacked")).toHaveLength(0);
  });
});

describe("damage (GDD 4.7)", () => {
  it("subtracts Armor from Physical damage", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
    });
    const shield = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, shield.id)?.hp).toBe(5);
  });

  it("ignores Armor for Holy damage", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.dawnCleric",
      owner: "player",
      position: 3,
    });
    const shield = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, shield.id)?.hp).toBe(5);
  });

  it("never deals less than 0 damage", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
    });
    const wall = placeUnit(state, {
      cardId: "human.ironBulwark",
      owner: "enemy",
      position: 5,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, wall.id)?.hp).toBe(6);
    expect(eventsOfType(events, "DamageDealt")[0]?.amount).toBe(0);
  });

  it("doubles damage on a Crit and halves it (rounded up) on a Block", () => {
    const crit = emptyBattle({ player: { unitCrit: 10_000 } });
    placeUnit(crit, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
    });
    const a = placeUnit(crit, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 30,
      maxHp: 30,
    });
    const critRun = run(crit, endTurn);
    expect(unitById(critRun.state, a.id)?.hp).toBe(24);
    expect(eventsOfType(critRun.events, "DamageDealt")[0]).toMatchObject({
      crit: true,
      blocked: false,
    });

    const block = emptyBattle({ enemy: { unitBlock: 10_000 } });
    placeUnit(block, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    const b = placeUnit(block, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 30,
      maxHp: 30,
    });
    const blockRun = run(block, endTurn);
    // 4 damage, Block: ceil(4 / 2) = 2.
    expect(unitById(blockRun.state, b.id)?.hp).toBe(28);
    expect(eventsOfType(blockRun.events, "DamageDealt")[0]).toMatchObject({
      amount: 2,
      blocked: true,
    });
  });

  it("does not let a Hero Block", () => {
    const state = emptyBattle({ enemy: { unitBlock: 10_000 } });
    placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 11,
    });
    const { state: next } = run(state, endTurn);
    expect(next.sides.enemy.hero.hp).toBe(26);
  });

  it("gives Burn with Fire: 1 damage in each End Step of the owner, 2 times", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.emberShaman",
      owner: "player",
      position: 2,
    });
    const target = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 4,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const first = run(state, endTurn);
    // 4 Fire - Armor 1.
    expect(unitById(first.state, target.id)).toMatchObject({ hp: 17, burn: 2 });
    const second = run(first.state, endTurn);
    // The enemy's End Step: Burn ignores Armor.
    expect(unitById(second.state, target.id)).toMatchObject({
      hp: 16,
      burn: 1,
    });
  });

  it("gives Freeze with Frost: the Unit skips its next action", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const frozen = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 11,
      frozen: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, frozen.id)).toMatchObject({
      position: 11,
      frozen: false,
    });
    expect(eventsOfType(events, "UnitSkipped")).toEqual([
      expect.objectContaining({ unitId: frozen.id }),
    ]);
  });
});

describe("Retaliation (GDD 4.7)", () => {
  it("hits back a melee attacker when the Unit survives", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.hp).toBe(6);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).toEqual(["attack", "retaliation"]);
  });

  it("does not hit back when the Unit is Frozen, and the Freeze stays", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    const defender = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      frozen: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.hp).toBe(10);
    expect(unitById(next, defender.id)?.frozen).toBe(true);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).toEqual(["attack"]);
  });

  it("does not hit back a ranged attacker", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 3,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
    });
    const { events } = run(state, endTurn);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).toEqual(["attack"]);
  });

  it("does not hit back when the Unit dies", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 4,
    });
    const halberdier = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 5,
      maxHp: 5,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, halberdier.id)).toBeUndefined();
    expect(eventsOfType(events, "DamageDealt")).toHaveLength(1);
  });
});

describe("First Strike (GDD 4.7)", () => {
  it("hits a melee attacker first, then the attack occurs", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    const defender = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 2,
      hp: 10,
      maxHp: 10,
      firstStrike: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.hp).toBe(8);
    expect(unitById(next, defender.id)?.hp).toBe(7);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).toEqual(["firstStrike", "attack"]);
  });

  it("stops the attack when the attacker dies", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 2,
      maxHp: 2,
    });
    const defender = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 2,
      firstStrike: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)).toBeUndefined();
    expect(unitById(next, defender.id)?.hp).toBe(defender.maxHp);
    expect(eventsOfType(events, "UnitAttacked")).toEqual([]);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).toEqual(["firstStrike"]);
  });

  it("does not hit a ranged attacker, and a Frozen Unit does not use it", () => {
    const ranged = emptyBattle();
    placeUnit(ranged, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 3,
    });
    placeUnit(ranged, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      firstStrike: true,
    });
    expect(
      eventsOfType(run(ranged, endTurn).events, "DamageDealt").map(
        (event) => event.source
      )
    ).toEqual(["attack"]);

    const frozen = emptyBattle();
    placeUnit(frozen, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
    });
    placeUnit(frozen, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      frozen: true,
      firstStrike: true,
    });
    expect(
      eventsOfType(run(frozen, endTurn).events, "DamageDealt").map(
        (event) => event.source
      )
    ).toEqual(["attack"]);
  });

  it("applies Poison and Entangle, and the Entangle stays for the next action of the attacker", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "elf.canopyVinewarden",
      owner: "enemy",
      rank: "epic",
      position: 5,
      hp: 20,
      maxHp: 20,
      poison: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "StatusApplied")).toEqual([
      expect.objectContaining({ unitId: attacker.id, status: "poison" }),
      expect.objectContaining({ unitId: attacker.id, status: "entangle" }),
    ]);
    expect(unitById(next, attacker.id)?.entangled).toBe(true);
  });

  it("does not apply Knockback", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      firstStrike: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.position).toBe(4);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });
});

describe("death and action order (GDD 4.4, 4.9)", () => {
  it("moves a dead Unit's card to its owner's Graveyard", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 4,
    });
    const victim = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      hp: 5,
      maxHp: 5,
    });
    const { state: next, events } = run(state, endTurn);
    expect(next.sides.enemy.graveyard).toEqual([victim.card]);
    expect(eventsOfType(events, "UnitDied")).toEqual([
      expect.objectContaining({ unitId: victim.id }),
    ]);
  });

  it("acts Lane by Lane, front Unit first", () => {
    const state = emptyBattle({ lanes: 2 });
    const back = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      lane: 0,
      position: 1,
    });
    const front = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      lane: 0,
      position: 5,
    });
    const second = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      lane: 1,
      position: 8,
    });
    const { events } = run(state, endTurn);
    expect(
      eventsOfType(events, "UnitMoved").map((event) => event.unitId)
    ).toEqual([front.id, back.id, second.id]);
  });

  it("lets a Unit move into a Square that a dead Unit left in the same phase", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.tuskBrute",
      owner: "player",
      position: 5,
    });
    const follower = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 3,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, follower.id)?.position).toBe(4);
  });
});

describe("Pivot (GDD 4.5, 4.6)", () => {
  it("attacks the enemy Unit directly behind it, and does not move", () => {
    const state = emptyBattle();
    const warden = placeUnit(state, {
      cardId: "human.gateWarden",
      owner: "player",
      position: 5,
    });
    const passed = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 4,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, warden.id)?.position).toBe(5);
    expect(unitById(next, passed.id)?.hp).toBe(5);
    expect(eventsOfType(events, "UnitAttacked")).toEqual([
      expect.objectContaining({
        unitId: warden.id,
        target: { _tag: "Unit", unitId: passed.id },
      }),
    ]);
  });

  it("attacks next to it before the Unit in front, with the lower Lane first", () => {
    const state = emptyBattle({ lanes: 3 });
    placeUnit(state, {
      cardId: "human.gateWarden",
      owner: "player",
      lane: 1,
      position: 5,
    });
    const enemyAt = (lane: number, position: number) =>
      placeUnit(state, {
        cardId: "human.militiaRecruit",
        owner: "enemy",
        lane,
        position,
        attack: 0,
      });
    const targets = [enemyAt(0, 5), enemyAt(2, 5), enemyAt(1, 6)];
    const { state: next } = run(state, endTurn);
    expect(targets.map((unit) => unitById(next, unit.id)?.hp)).toEqual([
      5, 8, 8,
    ]);
  });

  it("attacks an enemy Unit behind it before the enemy Hero", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.gateWarden",
      owner: "player",
      position: 11,
    });
    const passed = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 10,
      attack: 0,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, passed.id)?.hp).toBe(5);
    expect(next.sides.enemy.hero.hp).toBe(30);
  });

  it("is a melee attack, so Retaliation applies", () => {
    const state = emptyBattle();
    const warden = placeUnit(state, {
      cardId: "human.gateWarden",
      owner: "player",
      position: 5,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 4,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, warden.id)?.hp).toBe(3);
  });

  it("moves when no enemy Unit is behind it or next to it, and a Unit without Pivot ignores the Unit behind it", () => {
    const state = emptyBattle({ lanes: 2 });
    const warden = placeUnit(state, {
      cardId: "human.gateWarden",
      owner: "player",
      position: 5,
    });
    const recruit = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      lane: 1,
      position: 5,
    });
    const passed = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      lane: 1,
      position: 4,
      attack: 0,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, warden.id)?.position).toBe(6);
    expect(unitById(next, recruit.id)?.position).toBe(6);
    expect(unitById(next, passed.id)?.hp).toBe(8);
  });
});

describe("Last Breath (GDD 4.9)", () => {
  it("deals its damage to the nearest enemy Unit ahead, and not to the Hero", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 4,
      attack: 0,
      hp: 1,
      burn: 1,
    });
    const behind = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 2,
      attack: 0,
      hp: 4,
    });
    const blocker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 5,
      attack: 0,
      hp: 4,
    });
    const ahead = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
      attack: 0,
      hp: 4,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, runt.id)).toBeUndefined();
    expect(unitById(next, behind.id)?.hp).toBe(4);
    expect(unitById(next, blocker.id)?.hp).toBe(4);
    expect(unitById(next, ahead.id)?.hp).toBe(3);
    expect(next.sides.enemy.hero.hp).toBe(30);
    expect(eventsOfType(events, "DamageDealt").at(-1)).toMatchObject({
      source: "lastBreath",
      amount: 1,
      target: { _tag: "Unit", unitId: ahead.id },
    });
  });

  it("deals the Damage Type of the Unit, so a Dawn Reliquary deals Holy damage that Armor does not reduce", () => {
    const state = emptyBattle();
    const reliquary = placeUnit(state, {
      cardId: "human.dawnReliquary",
      rank: "rare",
      owner: "player",
      position: 4,
      hp: 1,
      burn: 1,
    });
    const bulwark = placeUnit(state, {
      cardId: "human.ironBulwark",
      rank: "epic",
      owner: "enemy",
      position: 6,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, reliquary.id)).toBeUndefined();
    expect(unitById(next, bulwark.id)?.hp).toBe(bulwark.hp - 2);
    expect(eventsOfType(events, "DamageDealt").at(-1)).toMatchObject({
      source: "lastBreath",
      amount: 2,
      damageType: "holy",
      blocked: false,
      target: { _tag: "Unit", unitId: bulwark.id },
    });
  });
});

describe("Poison (GDD 4.7)", () => {
  it("adds 1 stack after attack damage above 0, then deals 1 damage per stack", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      attack: 2,
      poison: true,
    });
    const target = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 20,
      maxHp: 20,
      poisoned: 1,
    });
    const first = run(state, endTurn);
    // Attack 2, Armor 1: 1 damage. The old stack and the new stack add.
    expect(unitById(first.state, target.id)).toMatchObject({
      hp: 19,
      poisoned: 2,
    });
    const second = run(first.state, endTurn);
    // The enemy End Step: 2 damage, and Armor does not reduce it.
    expect(unitById(second.state, target.id)).toMatchObject({
      hp: 17,
      poisoned: 1,
    });
  });

  it("does not apply when the attack deals 0 damage, or from Retaliation", () => {
    const blocked = emptyBattle();
    placeUnit(blocked, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      attack: 1,
      poison: true,
    });
    const armored = placeUnit(blocked, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    expect(unitById(run(blocked, endTurn).state, armored.id)?.poisoned).toBe(0);

    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      poison: true,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.poisoned).toBe(0);
  });
});

describe("Hobble (GDD 4.5, 4.7)", () => {
  it("moves a Hobbled Unit with Speed 2 only 1 Square", () => {
    const state = emptyBattle();
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "player",
      position: 0,
      attack: 0,
      hobbled: 1,
    });
    expect(unitById(run(state, endTurn).state, runt.id)?.position).toBe(1);
  });

  it("moves a Hobbled Unit with Speed 1 by 1 Square, and a Hobbled Unit with Speed 0 does not move", () => {
    const slow = emptyBattle();
    const bearer = placeUnit(slow, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 0,
      attack: 0,
      hobbled: 1,
    });
    expect(unitById(run(slow, endTurn).state, bearer.id)?.position).toBe(1);

    const stuck = emptyBattle();
    const wall = placeUnit(stuck, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 0,
      attack: 0,
      speed: 0,
      hobbled: 1,
    });
    expect(unitById(run(stuck, endTurn).state, wall.id)?.position).toBe(0);
  });

  it("limits a Charge Unit to 1 Square in the Turn of its summon", () => {
    const state = emptyBattle({ turnNumber: 3 });
    const charger = placeUnit(state, {
      cardId: "orc.howlingCharger",
      owner: "player",
      position: 0,
      attack: 0,
      summonedTurn: 3,
      hobbled: 1,
      rank: "uncommon",
    });
    expect(unitById(run(state, endTurn).state, charger.id)?.position).toBe(1);
  });

  it("moves a Hobbled Flying Unit only to the next empty Square, and not when that Square holds a Unit", () => {
    const open = emptyBattle();
    const bird = placeUnit(open, {
      cardId: "orc.skyreaver",
      owner: "player",
      position: 3,
      attack: 0,
      hobbled: 1,
    });
    expect(unitById(run(open, endTurn).state, bird.id)?.position).toBe(4);

    const blocked = emptyBattle();
    const flyer = placeUnit(blocked, {
      cardId: "orc.skyreaver",
      owner: "player",
      position: 3,
      attack: 0,
      hobbled: 1,
    });
    placeUnit(blocked, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 4,
      attack: 0,
    });
    expect(unitById(run(blocked, endTurn).state, flyer.id)?.position).toBe(3);
  });

  it("applies Hobble after attack damage above 0, and not when Armor reduces the damage to 0", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      attack: 2,
      hobble: 2,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const hit = run(state, endTurn);
    expect(unitById(hit.state, target.id)?.hobbled).toBe(2);
    expect(eventsOfType(hit.events, "StatusApplied")).toContainEqual(
      expect.objectContaining({
        unitId: target.id,
        status: "hobble",
        count: 2,
      })
    );

    const blocked = emptyBattle();
    placeUnit(blocked, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      attack: 1,
      hobble: 2,
    });
    const armored = placeUnit(blocked, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    const miss = run(blocked, endTurn);
    expect(unitById(miss.state, armored.id)?.hobbled).toBe(0);
    expect(eventsOfType(miss.events, "StatusApplied")).toEqual([]);
  });

  it("does not apply Hobble from Retaliation or from an attack on a Hero", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      hobble: 2,
    });
    expect(unitById(run(state, endTurn).state, attacker.id)?.hobbled).toBe(0);

    const hero = emptyBattle();
    placeUnit(hero, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 11,
      hobble: 2,
    });
    const shot = run(hero, endTurn);
    expect(shot.state.sides.enemy.hero.hp).toBeLessThan(30);
    expect(eventsOfType(shot.events, "StatusApplied")).toEqual([]);
  });

  it("lowers the count only in the End Step of the owner, so Hobble 1 slows the next action and the action after has full Speed", () => {
    let state = emptyBattle();
    placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 0,
      attack: 3,
      hp: 1,
      maxHp: 1,
      burn: 1,
      hobble: 1,
    });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 3,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    ({ state } = run(state, endTurn));
    expect(unitById(state, runt.id)?.hobbled).toBe(1);

    ({ state } = run(state, endTurn));
    expect(unitById(state, runt.id)).toMatchObject({ position: 2, hobbled: 0 });

    ({ state } = run(state, endTurn));
    ({ state } = run(state, endTurn));
    expect(unitById(state, runt.id)?.position).toBe(0);
  });

  it("keeps the higher Hobble count, and does not add the counts", () => {
    expect(hobbleHit(1, 3)).toEqual({ count: 3, event: 3 });
    expect(hobbleHit(3, 1)).toEqual({ count: 3, event: 3 });
    expect(hobbleHit(2, 2)).toEqual({ count: 2, event: 2 });
  });

  it("lowers the count of a Frozen Unit that skips its action", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 11,
      attack: 0,
      frozen: true,
      hobbled: 2,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitSkipped")).toEqual([
      expect.objectContaining({ unitId: runt.id }),
    ]);
    expect(unitById(next, runt.id)).toMatchObject({ position: 11, hobbled: 1 });
  });

  it("applies Hobble 1, 2 and 3 from the Pavise Arbalist at Rare, Epic and Legendary", () => {
    expect([
      hobbledByPavise("rare"),
      hobbledByPavise("epic"),
      hobbledByPavise("legendary"),
    ]).toEqual([1, 2, 3]);
  });
});

const knockbackByRank = (rank: "common" | "epic" | "legendary") => {
  const state = emptyBattle();
  placeUnit(state, {
    cardId: "human.shieldbearer",
    owner: "player",
    position: 4,
    rank,
  });
  const target = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "enemy",
    position: 5,
    attack: 0,
    hp: 30,
    maxHp: 30,
  });
  const result = run(state, endTurn);
  return {
    position: unitById(result.state, target.id)?.position,
    event: eventsOfType(result.events, "UnitPushed")[0],
  };
};

describe("Knockback (GDD 4.7)", () => {
  it("Pushes the enemy Unit N Squares toward its own Hero", () => {
    expect(knockbackByRank("epic")).toEqual({
      position: 7,
      event: expect.objectContaining({
        unitId: expect.any(Number),
        lane: 0,
        from: 5,
        to: 7,
      }),
    });
  });

  it("uses Knockback 1, 2 and 3 at Common, Epic and Legendary", () => {
    expect([
      knockbackByRank("common").position,
      knockbackByRank("epic").position,
      knockbackByRank("legendary").position,
    ]).toEqual([6, 7, 8]);
  });

  it("stops before a friendly Unit and before an enemy Unit", () => {
    const friendly = emptyBattle();
    placeUnit(friendly, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      rank: "legendary",
    });
    const friendTarget = placeUnit(friendly, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    placeUnit(friendly, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 7,
      attack: 0,
    });
    expect(
      unitById(run(friendly, endTurn).state, friendTarget.id)?.position
    ).toBe(6);

    const hostile = emptyBattle();
    placeUnit(hostile, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      rank: "legendary",
    });
    const hostileTarget = placeUnit(hostile, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    placeUnit(hostile, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 7,
      attack: 0,
      speed: 0,
    });
    expect(
      unitById(run(hostile, endTurn).state, hostileTarget.id)?.position
    ).toBe(6);
  });

  it("stops at the pushed Unit's Column 1", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 9,
      rank: "legendary",
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 10,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.position).toBe(11);
    expect(eventsOfType(events, "UnitPushed")).toEqual([
      expect.objectContaining({ unitId: target.id, from: 10, to: 11 }),
    ]);
  });

  it("adds no push and no event when the Square behind is full", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      rank: "epic",
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.position).toBe(5);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("does not Push when Armor reduces the damage to 0", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
    });
    const target = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.position).toBe(5);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("does not Push a Unit that dies from the hit", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      attack: 20,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)).toBeUndefined();
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("does not Push a Unit with Wall", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      rank: "legendary",
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
      wall: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.position).toBe(5);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("stops a Flying target before another Unit, the same as a ground Unit", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      rank: "legendary",
    });
    const target = placeUnit(state, {
      cardId: "orc.skyreaver",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 7,
      attack: 0,
    });
    expect(unitById(run(state, endTurn).state, target.id)?.position).toBe(6);
  });

  it("Pushes a Frozen or Hobbled target, and the Status stays", () => {
    const frozen = emptyBattle();
    placeUnit(frozen, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
    });
    const frozenTarget = placeUnit(frozen, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
      frozen: true,
    });
    expect(unitById(run(frozen, endTurn).state, frozenTarget.id)).toMatchObject(
      {
        position: 6,
        frozen: true,
      }
    );

    const hobbled = emptyBattle();
    placeUnit(hobbled, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
    });
    const hobbledTarget = placeUnit(hobbled, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
      hobbled: 2,
    });
    expect(
      unitById(run(hobbled, endTurn).state, hobbledTarget.id)
    ).toMatchObject({
      position: 6,
      hobbled: 2,
    });
  });

  it("Pushes a Unit with Speed 0 that has no Wall", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
      speed: 0,
    });
    expect(unitById(run(state, endTurn).state, target.id)?.position).toBe(6);
  });

  it("gives no push from a Pivot hit to the rear, and Pushes a side target in its own Lane", () => {
    const rear = emptyBattle();
    placeUnit(rear, {
      cardId: "human.gateWarden",
      owner: "player",
      position: 5,
      knockback: 2,
    });
    const behind = placeUnit(rear, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 4,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    const rearResult = run(rear, endTurn);
    expect(unitById(rearResult.state, behind.id)?.position).toBe(4);
    expect(eventsOfType(rearResult.events, "UnitPushed")).toEqual([]);

    const side = emptyBattle({ lanes: 3 });
    placeUnit(side, {
      cardId: "human.gateWarden",
      owner: "player",
      lane: 1,
      position: 5,
      knockback: 1,
    });
    const beside = placeUnit(side, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      lane: 0,
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    const sideResult = run(side, endTurn);
    expect(unitById(sideResult.state, beside.id)?.position).toBe(6);
    expect(eventsOfType(sideResult.events, "UnitPushed")).toEqual([
      expect.objectContaining({ unitId: beside.id, lane: 0, from: 5, to: 6 }),
    ]);
  });

  it("resolves Retaliation after the push, in the order attack, push, retaliation", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 4,
      hp: 20,
      maxHp: 20,
    });
    const defender = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, defender.id)?.position).toBe(6);
    expect(unitById(next, attacker.id)?.hp).toBe(17);
    expect(
      events.flatMap((event) => {
        if (event._tag === "DamageDealt") {
          return [event.source];
        }
        return event._tag === "UnitPushed" ? ["push"] : [];
      })
    ).toEqual(["attack", "push", "retaliation"]);
  });

  it("does not apply Knockback from Retaliation", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 20,
      maxHp: 20,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      knockback: 3,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.position).toBe(4);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("does not Push a Hero", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.shieldbearer",
      owner: "player",
      position: 11,
    });
    const { state: next, events } = run(state, endTurn);
    expect(next.sides.enemy.hero.hp).toBe(29);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("applies Poison and Hobble with Knockback on the same hit", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      attack: 2,
      poison: true,
      hobble: 2,
      knockback: 1,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)).toMatchObject({
      poisoned: 1,
      hobbled: 2,
      position: 6,
    });
    expect(
      events.flatMap((event) => {
        if (event._tag === "StatusApplied") {
          return [event.status];
        }
        return event._tag === "UnitPushed" ? ["push"] : [];
      })
    ).toEqual(["poison", "hobble", "push"]);
  });

  it("does not Push from a ranged attack", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 2,
      knockback: 3,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 30,
      maxHp: 30,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.position).toBe(5);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });
});

/** The damage events in order, as `source:amount`. */
const damageLog = (events: readonly BattleEvent[]) =>
  eventsOfType(events, "DamageDealt").map(
    (event) => `${event.source}:${event.amount}`
  );

/**
 * A melee Unit with Trample at Square 4 attacks the enemy Unit at Square 5.
 * Another enemy Unit stands at Square 6.
 */
const trampleBoard = (
  options: {
    readonly attack?: number;
    readonly defender?: Partial<Parameters<typeof placeUnit>[1]>;
    readonly behind?: Partial<Parameters<typeof placeUnit>[1]> | null;
  } = {}
) => {
  const state = emptyBattle();
  const attacker = placeUnit(state, {
    cardId: "feral.cragRhino",
    owner: "player",
    position: 4,
    attack: options.attack ?? 9,
  });
  const defender = placeUnit(state, {
    cardId: "goblin.scrapPlateGuard",
    owner: "enemy",
    position: 5,
    attack: 0,
    hp: 4,
    ...options.defender,
  });
  const behind =
    options.behind === null
      ? undefined
      : placeUnit(state, {
          cardId: "human.militiaRecruit",
          owner: "enemy",
          position: 6,
          attack: 0,
          hp: 20,
          maxHp: 20,
          ...options.behind,
        });
  return { attacker, defender, behind, ...run(state, endTurn) };
};

describe("Trample (GDD 4.7, ADR-0017)", () => {
  it("hits the next enemy Unit behind with the damage that is left (the glossary example)", () => {
    // Attack 9 against Armor 1 deals 8. The killed Unit had 4 HP, so 4 is left.
    const { state, defender, behind, events } = trampleBoard();
    expect(unitById(state, defender.id)).toBeUndefined();
    expect(unitById(state, behind?.id ?? 0)?.hp).toBe(16);
    expect(damageLog(events)).toEqual(["attack:8", "trample:4"]);
    expect(eventsOfType(events, "DamageDealt")[1]).toMatchObject({
      target: { _tag: "Unit", unitId: behind?.id },
      damageType: "physical",
      crit: false,
      hp: 16,
    });
  });

  it("lets the Armor of the second Unit reduce the hit", () => {
    const { events } = trampleBoard({
      behind: { cardId: "feral.cragLizard" },
    });
    expect(damageLog(events)).toEqual(["attack:8", "trample:3"]);
  });

  it("loses the damage when the next Square is empty, and never jumps over it", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "feral.cragRhino",
      owner: "player",
      position: 4,
      attack: 9,
    });
    placeUnit(state, {
      cardId: "goblin.scrapPlateGuard",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 4,
    });
    const far = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 7,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, far.id)?.hp).toBe(8);
    expect(damageLog(events)).toEqual(["attack:8"]);
  });

  it("does not hit a friendly Unit behind the killed Unit", () => {
    const { events } = trampleBoard({
      behind: { owner: "player", speed: 0 },
    });
    expect(damageLog(events)).toEqual(["attack:8"]);
  });

  it("never hits a Hero", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "feral.cragRhino",
      owner: "player",
      position: 10,
      attack: 9,
    });
    placeUnit(state, {
      cardId: "goblin.scrapPlateGuard",
      owner: "enemy",
      position: 11,
      attack: 0,
      hp: 4,
    });
    const { state: next, events } = run(state, endTurn);
    expect(next.sides.enemy.hero.hp).toBe(30);
    expect(damageLog(events)).toEqual(["attack:8"]);
  });

  it("does not occur when the defender survives", () => {
    const { behind, state, events } = trampleBoard({
      defender: { hp: 20, maxHp: 20 },
    });
    expect(unitById(state, behind?.id ?? 0)?.hp).toBe(20);
    expect(damageLog(events)).toEqual(["attack:8"]);
  });

  it("keeps the Damage Type of the Trample Unit, so Frost Freezes the second Unit", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "feral.oldFrostmaw",
      owner: "player",
      position: 4,
      // More Attack than the 4 HP of the first Unit, so Trample hits the second.
      attack: 8,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 4,
    });
    const behind = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, behind.id)).toMatchObject({ hp: 16, frozen: true });
    expect(eventsOfType(events, "DamageDealt")[1]).toMatchObject({
      source: "trample",
      damageType: "frost",
    });
  });

  it("uses the final damage after a Crit, does not roll Crit for the second hit, and lets the Hero Block it", () => {
    const rolls = Array.from({ length: 40 }, (_, seed) => {
      const state = emptyBattle({
        random: seed + 1,
        player: { unitCrit: 5000 },
        enemy: { unitBlock: 5000 },
      });
      placeUnit(state, {
        cardId: "feral.cragRhino",
        owner: "player",
        position: 4,
        attack: 6,
      });
      placeUnit(state, {
        cardId: "human.militiaRecruit",
        owner: "enemy",
        position: 5,
        attack: 0,
        hp: 4,
      });
      placeUnit(state, {
        cardId: "human.militiaRecruit",
        owner: "enemy",
        position: 6,
        attack: 0,
        hp: 20,
        maxHp: 20,
      });
      return eventsOfType(run(state, endTurn).events, "DamageDealt");
    });
    for (const [first, second] of rolls) {
      if (second) {
        expect(second.crit).toBe(false);
        const left = (first?.amount ?? 0) - 4;
        expect(second.amount).toBe(second.blocked ? Math.ceil(left / 2) : left);
      }
    }
    // A Crit hit: 12 damage, 8 left.
    expect(
      rolls.some(([first, second]) => first?.crit && second?.amount === 8)
    ).toBe(true);
    expect(rolls.some(([, second]) => second?.blocked)).toBe(true);
  });

  it("is not an attack: no Retaliation, Poison, Hobble, Entangle or Knockback from the second hit", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "feral.cragRhino",
      owner: "player",
      position: 4,
      attack: 9,
      poison: true,
      hobble: 2,
      knockback: 1,
      entangle: true,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 4,
    });
    const behind = placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 6,
      hp: 20,
      maxHp: 20,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, behind.id)).toMatchObject({
      hp: 15,
      position: 6,
      poisoned: 0,
      hobbled: 0,
      entangled: false,
    });
    expect(unitById(next, attacker.id)?.hp).toBe(8);
    expect(eventsOfType(events, "StatusApplied")).toEqual([]);
    expect(eventsOfType(events, "UnitPushed")).toEqual([]);
  });

  it("occurs one time for each attack: a kill by the second hit does not Trample again", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "feral.cragRhino",
      owner: "player",
      position: 4,
      attack: 12,
    });
    for (const position of [5, 6]) {
      placeUnit(state, {
        cardId: "human.militiaRecruit",
        owner: "enemy",
        position,
        attack: 0,
        hp: 2,
      });
    }
    const last = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 7,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, last.id)?.hp).toBe(8);
    expect(damageLog(events)).toEqual(["attack:12", "trample:10"]);
  });

  it("lets the killed Unit's Last Breath occur first, and still hits when that Last Breath kills the Trample Unit", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "feral.bristlebackBoar",
      owner: "player",
      position: 4,
      attack: 5,
      hp: 1,
    });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    const behind = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)).toBeUndefined();
    expect(unitById(next, behind.id)?.hp).toBe(16);
    expect(
      events.flatMap((event) => {
        if (event._tag === "DamageDealt") {
          return [event.source];
        }
        return event._tag === "UnitDied" ? [`died:${event.unitId}`] : [];
      })
    ).toEqual([
      "attack",
      `died:${runt.id}`,
      "lastBreath",
      `died:${attacker.id}`,
      "trample",
    ]);
  });

  it("does not occur from a ranged attack", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.crossbowGuard",
      owner: "player",
      position: 2,
      attack: 9,
      trample: true,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    const behind = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
      attack: 0,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, behind.id)?.hp).toBe(8);
  });
});

describe("Entangle (GDD 4.4, 4.5, 4.7)", () => {
  it("Entangles the enemy Unit after attack damage above 0, and not when Armor makes it 0", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "elf.canopyVinewarden",
      owner: "player",
      position: 2,
    });
    const target = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 4,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.entangled).toBe(true);
    expect(eventsOfType(events, "StatusApplied")).toEqual([
      expect.objectContaining({ unitId: target.id, status: "entangle" }),
    ]);

    const armored = emptyBattle();
    placeUnit(armored, {
      cardId: "elf.canopyVinewarden",
      owner: "player",
      position: 2,
      attack: 1,
    });
    const plated = placeUnit(armored, {
      cardId: "goblin.scrapPlateGuard",
      owner: "enemy",
      position: 4,
      attack: 0,
    });
    expect(unitById(run(armored, endTurn).state, plated.id)?.entangled).toBe(
      false
    );
  });

  it("gives Speed 0 in the next action, lets the Unit attack, and then ends", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 11,
      entangled: true,
    });
    const stuck = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      lane: 0,
      position: 6,
      entangled: true,
    });
    const target = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 5,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, runt.id)).toMatchObject({
      position: 11,
      entangled: false,
    });
    expect(unitById(next, stuck.id)?.entangled).toBe(false);
    expect(eventsOfType(events, "UnitAttacked")).toEqual([
      expect.objectContaining({
        unitId: stuck.id,
        target: { _tag: "Unit", unitId: target.id },
      }),
    ]);
    expect(eventsOfType(events, "UnitMoved")).toEqual([]);

    // The action after has full Speed.
    const moved = run(run(next, endTurn).state, endTurn).state;
    expect(unitById(moved, runt.id)?.position).toBe(9);
  });

  it("does not stack or extend: a second Entangle before the action still ends after one action", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "elf.canopyVinewarden",
      owner: "player",
      position: 2,
    });
    const target = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 4,
      attack: 0,
      hp: 20,
      maxHp: 20,
      entangled: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, target.id)?.entangled).toBe(true);
    expect(eventsOfType(events, "StatusApplied")).toEqual([]);
    const after = run(next, endTurn).state;
    expect(unitById(after, target.id)).toMatchObject({
      entangled: false,
      position: 4,
    });
  });

  it("is not applied by Retaliation", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 20,
      maxHp: 20,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      entangle: true,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, attacker.id)).toMatchObject({
      hp: 16,
      entangled: false,
    });
  });

  it("ends with a Freeze when the Frozen Unit skips its action", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const runt = placeUnit(state, {
      cardId: "orc.badlandRunt",
      owner: "enemy",
      position: 11,
      frozen: true,
      entangled: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitSkipped")).toHaveLength(1);
    expect(unitById(next, runt.id)).toMatchObject({
      position: 11,
      frozen: false,
      entangled: false,
    });
  });
});

/**
 * A melee Unit with Bleed at Square 4 attacks an enemy Unit at Square 5 that
 * is already Bleeding with the given count.
 */
const bleedHit = (bleed: number, bleeding: number) => {
  const state = emptyBattle();
  placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "player",
    position: 4,
    attack: 2,
    bleed,
  });
  const target = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "enemy",
    position: 5,
    attack: 0,
    hp: 20,
    maxHp: 20,
    bleeding,
  });
  const result = run(state, endTurn);
  const status = eventsOfType(result.events, "StatusApplied").find(
    (event) => event.status === "bleed"
  );
  return {
    count: unitById(result.state, target.id)?.bleeding,
    event: status?.count,
  };
};

/** The Bleeding count that a Frostfang Lynx of this Rank gives in one hit. */
const bleedingByLynx = (rank: "common" | "rare" | "epic" | "legendary") => {
  const state = emptyBattle();
  placeUnit(state, {
    cardId: "feral.frostfangLynx",
    owner: "player",
    position: 4,
    rank,
  });
  const target = placeUnit(state, {
    cardId: "human.militiaRecruit",
    owner: "enemy",
    position: 5,
    attack: 0,
    hp: 40,
    maxHp: 40,
  });
  return unitById(run(state, endTurn).state, target.id)?.bleeding;
};

describe("Bleed (GDD 4.7, ADR-0019)", () => {
  it("makes the enemy Unit Bleeding after attack damage above 0, and not when Armor reduces the damage to 0", () => {
    const { count, event } = bleedHit(2, 0);
    expect(count).toBe(2);
    expect(event).toBe(2);

    const blocked = emptyBattle();
    placeUnit(blocked, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      attack: 1,
      bleed: 2,
    });
    const armored = placeUnit(blocked, {
      cardId: "human.shieldbearer",
      owner: "enemy",
      position: 5,
      attack: 0,
    });
    const miss = run(blocked, endTurn);
    expect(unitById(miss.state, armored.id)?.bleeding).toBe(0);
    expect(eventsOfType(miss.events, "StatusApplied")).toEqual([]);
  });

  it("keeps the higher Bleeding count, and does not add the counts", () => {
    expect(bleedHit(1, 3)).toEqual({ count: 3, event: 3 });
    expect(bleedHit(3, 1)).toEqual({ count: 3, event: 3 });
    expect(bleedHit(2, 2)).toEqual({ count: 2, event: 2 });
  });

  it("does not apply Bleed from Retaliation or from an attack on a Hero", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      hp: 20,
      maxHp: 20,
      bleed: 2,
    });
    expect(unitById(run(state, endTurn).state, attacker.id)?.bleeding).toBe(0);

    const hero = emptyBattle();
    placeUnit(hero, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 11,
      bleed: 2,
    });
    const shot = run(hero, endTurn);
    expect(shot.state.sides.enemy.hero.hp).toBeLessThan(30);
    expect(eventsOfType(shot.events, "StatusApplied")).toEqual([]);
  });

  it("does not apply Bleed with the second hit of Trample", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "feral.cragRhino",
      owner: "player",
      position: 4,
      attack: 9,
      bleed: 2,
    });
    placeUnit(state, {
      cardId: "goblin.scrapPlateGuard",
      owner: "enemy",
      position: 5,
      attack: 0,
      hp: 4,
    });
    const behind = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      position: 6,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    const result = run(state, endTurn);
    expect(unitById(result.state, behind.id)).toMatchObject({
      hp: 16,
      bleeding: 0,
    });
  });

  it("gives Bleed 1 up to Rare, 2 at Epic and 3 at Legendary (Frostfang Lynx)", () => {
    expect(bleedingByLynx("common")).toBe(1);
    expect(bleedingByLynx("rare")).toBe(1);
    expect(bleedingByLynx("epic")).toBe(2);
    expect(bleedingByLynx("legendary")).toBe(3);
  });
});

describe("Wall (GDD 5.4)", () => {
  it("has no Movement, also with Speed or Charge", () => {
    const state = emptyBattle({ turnNumber: 3 });
    const fast = placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "player",
      position: 0,
      speed: 2,
    });
    const charger = placeUnit(state, {
      cardId: "human.riverKnight",
      owner: "player",
      lane: 1,
      position: 0,
      summonedTurn: 3,
      speed: 0,
      wall: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, fast.id)?.position).toBe(0);
    expect(unitById(next, charger.id)?.position).toBe(0);
    expect(eventsOfType(events, "UnitMoved")).toEqual([]);
  });

  it("does not attack, also with Attack above 0", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "player",
      position: 11,
      attack: 3,
    });
    placeUnit(state, {
      cardId: "human.townBarricade",
      owner: "player",
      lane: 1,
      position: 4,
      attack: 3,
    });
    placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "enemy",
      lane: 1,
      position: 5,
      attack: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitAttacked")).toEqual([]);
    expect(next.sides.enemy.hero.hp).toBe(30);
  });

  it("does not deal Retaliation or First Strike damage, also with Attack above 0", () => {
    const state = emptyBattle();
    const attacker = placeUnit(state, {
      cardId: "human.militiaRecruit",
      owner: "player",
      position: 4,
      hp: 10,
      maxHp: 10,
    });
    placeUnit(state, {
      cardId: "human.halberdier",
      owner: "enemy",
      position: 5,
      attack: 3,
      hp: 20,
      maxHp: 20,
      firstStrike: true,
      wall: true,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, attacker.id)?.hp).toBe(10);
    expect(
      eventsOfType(events, "DamageDealt").map((event) => event.source)
    ).toEqual(["attack"]);
  });
});
