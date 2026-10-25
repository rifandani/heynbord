import { describe, expect, it } from "vitest";

import { emptyBattle, eventsOfType, heroOf } from "../testing/fixtures";
import { devDamageHero } from "./dev";
import { DUNGEON_LANES } from "./types";

describe("devDamageHero (Game Dev Panel)", () => {
  it("deals True Damage to the Hero and does not change the given state", () => {
    const state = emptyBattle({ enemy: { hp: 30 } });
    const { state: after, events } = devDamageHero(
      state,
      { side: "enemy", hero: 0 },
      12
    );
    expect(heroOf(state, "enemy").hp).toBe(30);
    expect(heroOf(after, "enemy").hp).toBe(18);
    expect(eventsOfType(events, "DamageDealt")).toEqual([
      expect.objectContaining({
        target: { _tag: "Hero", side: "enemy", hero: 0 },
        amount: 12,
        trueDamage: true,
        crit: false,
        hp: 18,
      }),
    ]);
  });

  it("a hit to 0 HP Defeats the last Hero of the Side and ends the Battle", () => {
    const { state, events } = devDamageHero(
      emptyBattle({ enemy: { hp: 5 } }),
      { side: "enemy", hero: 0 },
      99
    );
    expect(heroOf(state, "enemy").hp).toBe(0);
    expect(state.status).toBe("finished");
    expect(state.result).toEqual({ winner: "player", reason: "heroDefeated" });
    expect(eventsOfType(events, "BattleEnded")).toHaveLength(1);
  });

  it("a Defeated Boss of a Dungeon does not end the Battle while its Side has another Hero", () => {
    const { state, events } = devDamageHero(
      emptyBattle({
        lanes: DUNGEON_LANES,
        enemyHeroes: [{ front: [0, 1] }, { front: [2, 3], hp: 4 }],
      }),
      { side: "enemy", hero: 1 },
      4
    );
    expect(state.status).toBe("ongoing");
    expect(eventsOfType(events, "HeroDefeated")).toHaveLength(1);
    expect(heroOf(state, "enemy", 0).front).toEqual([0, 1, 2, 3]);
  });

  it("gives no events for a finished Battle, a Defeated Hero or an amount below 1", () => {
    const ended = devDamageHero(
      emptyBattle({ enemy: { hp: 1 } }),
      { side: "enemy", hero: 0 },
      1
    ).state;
    const ref = { side: "enemy", hero: 0 } as const;
    expect(devDamageHero(ended, ref, 5).events).toEqual([]);
    expect(devDamageHero(emptyBattle(), ref, 0).events).toEqual([]);
    expect(devDamageHero(emptyBattle(), ref, 0.5).events).toEqual([]);
  });
});
