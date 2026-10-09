import type { BattleEvent, Target } from "@workspace/rules";
import { BattleEvent as Event, LANE_LENGTH } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { castSquares, currentCast, effectColor } from "@/features/battle/cast";

const SQUARE: Target = { _tag: "Square", lane: 1, position: 4 };

const played = (
  cardId: string,
  side: "player" | "enemy" = "enemy",
  target: Target = SQUARE
) =>
  Event.CardPlayed({
    side,
    handIndex: 0,
    card: { instanceId: 7, cardId, rank: "common" },
    target,
  });

const damage = Event.DamageDealt({
  target: { _tag: "Unit", unitId: 3 },
  amount: 3,
  damageType: "fire",
  source: "skill",
  crit: false,
  blocked: false,
  hp: 1,
});

const recall = (success: boolean) =>
  Event.RecallRolled({
    side: "enemy",
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
    const hero: Target = { _tag: "Hero", side: "player" };
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
    expect(castSquares(cast("mage.fireball", "player", square))).toEqual([
      { lane: 2, position: 4 },
      { lane: 2, position: 5 },
    ]);
    expect(castSquares(cast("mage.fireball", "enemy", square))).toEqual([
      { lane: 2, position: 4 },
      { lane: 2, position: 3 },
    ]);
    expect(
      castSquares(
        cast("mage.fireball", "player", {
          ...square,
          position: LANE_LENGTH - 1,
        })
      )
    ).toHaveLength(1);
    expect(castSquares(cast("mage.frostBolt", "player", square))).toHaveLength(
      1
    );
  });

  it("covers a whole Lane from the caster's side, and nothing with no target", () => {
    const lane = castSquares(
      cast("mage.flameWave", "enemy", { _tag: "Lane", lane: 0 })
    );
    expect(lane).toHaveLength(LANE_LENGTH);
    expect(lane[0]).toEqual({ lane: 0, position: LANE_LENGTH - 1 });
    expect(
      castSquares(cast("warrior.warDrums", "player", { _tag: "NoTarget" }))
    ).toEqual([]);
    expect(
      castSquares(
        cast("ranger.longShot", "player", { _tag: "Hero", side: "enemy" })
      )
    ).toEqual([]);
  });
});

describe("effectColor", () => {
  it("uses the Damage Type color, Armor blue, or the neutral cast color", () => {
    expect(
      effectColor({ type: "damageUnit", amount: 2, damageType: "frost" })
    ).toBe("#8fd8ff");
    expect(effectColor({ type: "laneArmor", armor: 1, turns: 2 })).toBe(
      "#9cc8ff"
    );
    expect(effectColor({ type: "lowerCountdown", cards: 2, amount: 1 })).toBe(
      "#fff6df"
    );
  });
});
