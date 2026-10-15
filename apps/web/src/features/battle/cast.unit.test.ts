import type { BattleEvent, Target } from "@workspace/rules";
import { BattleEvent as Event, LANE_LENGTH } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import {
  castSquares,
  currentCast,
  effectColor,
  targetPreview,
} from "@/features/battle/cast";

const SQUARE: Target = { _tag: "Square", lane: 1, position: 4 };

const played = (
  cardId: string,
  side: "player" | "enemy" = "enemy",
  target: Target = SQUARE
) =>
  Event.CardPlayed({
    side,
    hero: { side, hero: 0 },
    handIndex: 0,
    card: { instanceId: 7, cardId, rank: "common" },
    target,
  });

const damage = Event.DamageDealt({
  target: { _tag: "Unit", unitId: 3 },
  amount: 3,
  damageType: "fire",
  source: "skill",
  dealer: null,
  crit: false,
  blocked: false,
  trueDamage: false,
  absorbed: 0,
  ward: 0,
  hp: 1,
});

const recall = (success: boolean) =>
  Event.RecallRolled({
    side: "enemy",
    hero: 0,
    card: { instanceId: 7, cardId: "mage.fireball", rank: "common" },
    success,
  });

const turn = Event.TurnStarted({ side: "enemy", turnNumber: 4 });

describe("currentCast", () => {
  it("follows a Skill Card from its reveal to its settle", () => {
    const log: BattleEvent[] = [turn, played("mage.fireball")];
    expect(currentCast(log, true)).toMatchObject({
      id: 1,
      side: "enemy",
      phase: "reveal",
      recalled: null,
    });
    log.push(damage, Event.UnitDied({ unitId: 3 }));
    expect(currentCast(log, true)).toMatchObject({ id: 1, phase: "resolve" });
    log.push(recall(true));
    expect(currentCast(log, true)).toMatchObject({
      id: 1,
      phase: "settle",
      recalled: true,
    });
  });

  it("shows no cast for a Creature Card, after a cast, or at rest", () => {
    expect(
      currentCast([turn, played("human.militiaRecruit")], true)
    ).toBeNull();
    expect(
      currentCast([turn, played("mage.fireball"), recall(false), damage], true)
    ).toBeNull();
    expect(currentCast([turn, damage], true)).toBeNull();
    expect(currentCast([turn, played("mage.fireball")], false)).toBeNull();
    expect(currentCast([], true)).toBeNull();
  });

  it("ends a cast that ends the Battle: it has no Recall roll", () => {
    const hero: Target = { _tag: "Hero", side: "player", hero: 0 };
    expect(
      currentCast(
        [
          turn,
          played("ranger.longShot", "enemy", hero),
          Event.BattleEnded({
            result: { winner: "enemy", reason: "heroDefeated" },
          }),
        ],
        true
      )
    ).toBeNull();
  });
});

const cast = (cardId: string, side: "player" | "enemy", target: Target) => {
  const result = currentCast([played(cardId, side, target)], true);
  if (!result) {
    throw new Error("no cast");
  }
  return result;
};

describe("castSquares", () => {
  it("goes from the target Square toward the enemy Hero of the caster", () => {
    const square = { _tag: "Square", lane: 2, position: 4 } as const;
    expect(castSquares(cast("mage.fireball", "player", square), 3)).toEqual([
      { lane: 2, position: 4 },
      { lane: 2, position: 5 },
    ]);
    expect(castSquares(cast("mage.fireball", "enemy", square), 3)).toEqual([
      { lane: 2, position: 4 },
      { lane: 2, position: 3 },
    ]);
    expect(
      castSquares(
        cast("mage.fireball", "player", {
          ...square,
          position: LANE_LENGTH - 1,
        }),
        3
      )
    ).toHaveLength(1);
    expect(
      castSquares(cast("mage.frostBolt", "player", square), 3)
    ).toHaveLength(1);
  });

  it("covers a whole Lane from the caster's side, and nothing with no target", () => {
    const lane = castSquares(
      cast("mage.flameWave", "enemy", { _tag: "Lane", lane: 0 }),
      3
    );
    expect(lane).toHaveLength(LANE_LENGTH);
    expect(lane[0]).toEqual({ lane: 0, position: LANE_LENGTH - 1 });
    expect(
      castSquares(cast("warrior.warDrums", "player", { _tag: "NoTarget" }), 3)
    ).toEqual([]);
    expect(
      castSquares(
        cast("ranger.longShot", "player", {
          _tag: "Hero",
          side: "enemy",
          hero: 0,
        }),
        3
      )
    ).toEqual([]);
  });
});

describe("castSquares of the Mage cards of #65", () => {
  it("covers the full area of a Field Effect from its corner Square", () => {
    const corner = { _tag: "Square", lane: 0, position: 6 } as const;
    expect(castSquares(cast("mage.wildfire", "player", corner), 3)).toEqual([
      { lane: 0, position: 6 },
      { lane: 0, position: 7 },
      { lane: 1, position: 6 },
      { lane: 1, position: 7 },
    ]);
    expect(castSquares(cast("mage.blizzard", "enemy", corner), 3)).toEqual([
      { lane: 0, position: 6 },
      { lane: 0, position: 5 },
      { lane: 1, position: 6 },
      { lane: 1, position: 5 },
      { lane: 2, position: 6 },
      { lane: 2, position: 5 },
    ]);
  });

  it("hits the same Column in the Lanes next to the target with Arc Lightning, on the Board only", () => {
    const middle = { _tag: "Square", lane: 1, position: 5 } as const;
    expect(castSquares(cast("mage.arcLightning", "player", middle), 3)).toEqual(
      [
        { lane: 1, position: 5 },
        { lane: 0, position: 5 },
        { lane: 2, position: 5 },
      ]
    );
    expect(
      castSquares(
        cast("mage.arcLightning", "player", { ...middle, lane: 0 }),
        1
      )
    ).toEqual([{ lane: 0, position: 5 }]);
    expect(
      castSquares(cast("mage.thunderstorm", "player", { _tag: "NoTarget" }), 3)
    ).toEqual([]);
  });
});

describe("targetPreview", () => {
  it("shows the full area of a Field Effect and of Arc Lightning, and nothing for a one-Square card", () => {
    const corner = { _tag: "Square", lane: 1, position: 3 } as const;
    expect(targetPreview("mage.wildfire", corner, 3)).toEqual({
      squares: [
        { lane: 1, position: 3 },
        { lane: 1, position: 4 },
        { lane: 2, position: 3 },
        { lane: 2, position: 4 },
      ],
      color: "#ff6a33",
    });
    expect(targetPreview("mage.arcLightning", corner, 3)?.squares).toHaveLength(
      3
    );
    expect(targetPreview("mage.spark", corner, 3)).toBeNull();
    expect(targetPreview("human.militiaRecruit", corner, 3)).toBeNull();
  });
});

describe("effectColor", () => {
  it("uses the Damage Type color, Bulwark blue, or the neutral cast color", () => {
    expect(
      effectColor({ type: "damageUnit", amount: 2, damageType: "frost" })
    ).toBe("#8fd8ff");
    expect(effectColor({ type: "laneBulwark", bulwark: 1, turns: 2 })).toBe(
      "#9cc8ff"
    );
    expect(effectColor({ type: "lowerCountdown", cards: 2, amount: 1 })).toBe(
      "#fff6df"
    );
  });

  it("uses the war gold for a Warrior bonus and the extra action, and rose for Exposed", () => {
    expect(effectColor({ type: "laneAttack", attack: 3 })).toBe("#ffd75a");
    expect(effectColor({ type: "laneExtraAction" })).toBe("#ffd75a");
    expect(effectColor({ type: "exposeUnit", exposed: 2 })).toBe("#ff6fa0");
  });

  it("gives the second-part damage cards the color of their Damage Type", () => {
    expect(
      effectColor({
        type: "damageLaneBulwark",
        amount: 2,
        damageType: "physical",
        bulwark: 1,
        turns: 1,
      })
    ).toBe(
      effectColor({ type: "damageUnit", amount: 2, damageType: "physical" })
    );
    expect(
      effectColor({
        type: "damageUnitHero",
        amount: 2,
        heroAmount: 4,
        damageType: "frost",
      })
    ).toBe("#8fd8ff");
    expect(
      effectColor({
        type: "damagePoison",
        amount: 1,
        damageType: "physical",
        poison: 3,
      })
    ).toBe(
      effectColor({ type: "damageUnit", amount: 1, damageType: "physical" })
    );
    expect(
      effectColor({
        type: "damageLaneEntangle",
        amount: 1,
        damageType: "physical",
      })
    ).toBe(
      effectColor({ type: "damageUnit", amount: 1, damageType: "physical" })
    );
  });

  it("gives the Priest cards the Holy gold", () => {
    expect(effectColor({ type: "healUnit", heal: 6 })).toBe("#ffd75a");
    expect(effectColor({ type: "healLane", heal: 8 })).toBe("#ffd75a");
    expect(effectColor({ type: "damageByAttack", damageType: "holy" })).toBe(
      "#ffd75a"
    );
    expect(effectColor({ type: "wardUnit", ward: 5 })).toBe("#ffd75a");
    expect(effectColor({ type: "wardLane", ward: 6 })).toBe("#ffd75a");
    expect(effectColor({ type: "steadfastUnit" })).toBe("#ffd75a");
    expect(effectColor({ type: "cleanseUnit", heal: 6 })).toBe("#ffd75a");
    expect(
      effectColor({ type: "damageUnit", amount: 3, damageType: "holy" })
    ).toBe("#ffd75a");
  });
});
