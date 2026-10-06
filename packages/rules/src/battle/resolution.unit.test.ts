import { describe, expect, it } from "vitest";

import {
  emptyBattle,
  eventsOfType,
  placeUnit,
  run,
  unitById,
} from "../testing/fixtures";
import { Command } from "./types";

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

describe("movement (GDD 4.5)", () => {
  it("moves a ground Unit forward by its Speed", () => {
    const state = emptyBattle();
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 0,
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, pup.id)?.position).toBe(2);
    expect(eventsOfType(events, "UnitMoved")).toEqual([
      expect.objectContaining({ unitId: pup.id, from: 0, to: 2 }),
    ]);
  });

  it("stops a ground Unit before any other Unit", () => {
    const state = emptyBattle();
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
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
    expect(unitById(next, pup.id)?.position).toBe(0);
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
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 10,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, pup.id)?.position).toBe(11);
  });

  it("moves enemy Units toward the player's Hero", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "enemy",
      position: 11,
    });
    const { state: next } = run(state, endTurn);
    expect(unitById(next, pup.id)?.position).toBe(9);
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

  it("gives Charge +2 Speed only in the Turn of the summon", () => {
    const fresh = emptyBattle({ turnNumber: 3 });
    const knight = placeUnit(fresh, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      summonedTurn: 3,
    });
    expect(unitById(run(fresh, endTurn).state, knight.id)?.position).toBe(4);

    const old = emptyBattle({ turnNumber: 4 });
    const veteran = placeUnit(old, {
      cardId: "human.riverKnight",
      owner: "player",
      position: 0,
      summonedTurn: 3,
    });
    expect(unitById(run(old, endTurn).state, veteran.id)?.position).toBe(2);
  });
});

describe("attack (GDD 4.6)", () => {
  it("attacks the enemy Unit in the next Square", () => {
    const state = emptyBattle();
    placeUnit(state, {
      cardId: "orc.badlandPup",
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
    expect(next.sides.enemy.hero.hp).toBe(27);
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
    expect(unitById(next, shield.id)?.hp).toBe(6);
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
    expect(unitById(next, wall.id)?.hp).toBe(15);
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
    expect(unitById(critRun.state, a.id)?.hp).toBe(26);
    expect(eventsOfType(critRun.events, "DamageDealt")[0]).toMatchObject({
      crit: true,
      blocked: false,
    });

    const block = emptyBattle({ enemy: { unitBlock: 10_000 } });
    placeUnit(block, {
      cardId: "orc.badlandPup",
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
    // 3 damage, Block: ceil(3 / 2) = 2.
    expect(unitById(blockRun.state, b.id)?.hp).toBe(28);
    expect(eventsOfType(blockRun.events, "DamageDealt")[0]).toMatchObject({
      amount: 2,
      blocked: true,
    });
  });

  it("does not let a Hero Block", () => {
    const state = emptyBattle({ enemy: { unitBlock: 10_000 } });
    placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 11,
    });
    const { state: next } = run(state, endTurn);
    expect(next.sides.enemy.hero.hp).toBe(27);
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
      cardId: "orc.badlandPup",
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
    });
    const { state: next, events } = run(state, endTurn);
    expect(unitById(next, halberdier.id)).toBeUndefined();
    expect(eventsOfType(events, "DamageDealt")).toHaveLength(1);
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
      cardId: "orc.badlandPup",
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
    expect(unitById(next, passed.id)?.hp).toBe(1);
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
      1, 4, 4,
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
    expect(unitById(next, passed.id)?.hp).toBe(1);
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
    expect(unitById(next, warden.id)?.hp).toBe(5);
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
    expect(unitById(next, recruit.id)?.position).toBe(7);
    expect(unitById(next, passed.id)?.hp).toBe(4);
  });
});

describe("Last Breath (GDD 4.9)", () => {
  it("deals its damage to the nearest enemy Unit ahead, and not to the Hero", () => {
    const state = emptyBattle();
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
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
    expect(unitById(next, pup.id)).toBeUndefined();
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
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "player",
      position: 0,
      attack: 0,
      hobbled: 1,
    });
    expect(unitById(run(state, endTurn).state, pup.id)?.position).toBe(1);
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
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "enemy",
      position: 3,
      attack: 0,
      hp: 20,
      maxHp: 20,
    });
    ({ state } = run(state, endTurn));
    expect(unitById(state, pup.id)?.hobbled).toBe(1);

    ({ state } = run(state, endTurn));
    expect(unitById(state, pup.id)).toMatchObject({ position: 2, hobbled: 0 });

    ({ state } = run(state, endTurn));
    ({ state } = run(state, endTurn));
    expect(unitById(state, pup.id)?.position).toBe(0);
  });

  it("keeps the higher Hobble count, and does not add the counts", () => {
    expect(hobbleHit(1, 3)).toEqual({ count: 3, event: 3 });
    expect(hobbleHit(3, 1)).toEqual({ count: 3, event: 3 });
    expect(hobbleHit(2, 2)).toEqual({ count: 2, event: 2 });
  });

  it("lowers the count of a Frozen Unit that skips its action", () => {
    const state = emptyBattle({ activeSide: "enemy" });
    const pup = placeUnit(state, {
      cardId: "orc.badlandPup",
      owner: "enemy",
      position: 11,
      attack: 0,
      frozen: true,
      hobbled: 2,
    });
    const { state: next, events } = run(state, endTurn);
    expect(eventsOfType(events, "UnitSkipped")).toEqual([
      expect.objectContaining({ unitId: pup.id }),
    ]);
    expect(unitById(next, pup.id)).toMatchObject({ position: 11, hobbled: 1 });
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
