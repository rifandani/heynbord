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
    expect(unitById(next, shield.id)?.hp).toBe(7);
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
    expect(unitById(next, shield.id)?.hp).toBe(6);
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
    expect(unitById(next, recruit.id)?.position).toBe(6);
    expect(unitById(next, passed.id)?.hp).toBe(4);
  });
});
