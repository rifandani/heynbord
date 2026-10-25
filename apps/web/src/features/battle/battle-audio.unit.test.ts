import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { eventSound } from "@/features/battle/battle-audio";
import { startSession } from "@/features/battle/battle-session";
import { qaTwoBossDungeon, startDungeon } from "@/features/battle/qa-dungeons";
import { NEW_PLAYER } from "@/features/profile/profile";

const played = (cardId: string) =>
  ({
    _tag: "CardPlayed",
    side: "enemy",
    hero: { side: "enemy", hero: 0 },
    handIndex: 0,
    card: { instanceId: 1, cardId, rank: "common" },
    target: { _tag: "NoTarget" },
  }) as const;

describe("eventSound", () => {
  it("gives each Battle action a sound (ART-03)", () => {
    expect(
      eventSound({
        _tag: "UnitAttacked",
        unitId: 1,
        target: { _tag: "Hero", side: "enemy", hero: 0 },
        ranged: true,
      })
    ).toBe("ranged");
    expect(
      eventSound({
        _tag: "UnitAttacked",
        unitId: 1,
        target: { _tag: "Hero", side: "enemy", hero: 0 },
        ranged: false,
      })
    ).toBe("melee");
    const damage = {
      _tag: "DamageDealt",
      target: { _tag: "Hero", side: "enemy", hero: 0 },
      amount: 2,
      damageType: "physical",
      source: "attack",
      dealer: null,
      crit: false,
      blocked: false,
      trueDamage: false,
      absorbed: 0,
      ward: 0,
      hp: 3,
    } as const;
    expect(eventSound(damage)).toBe("hit");
    expect(eventSound({ ...damage, crit: true })).toBe("crit");
    expect(eventSound({ ...damage, blocked: true })).toBe("block");
    expect(eventSound({ ...damage, damageType: "frost" })).toBe("frost");
    expect(eventSound({ ...damage, source: "burn", damageType: "fire" })).toBe(
      "fire"
    );
    expect(eventSound({ _tag: "UnitDied", unitId: 1 })).toBe("death");
    expect(
      eventSound({
        _tag: "BattleEnded",
        result: { winner: "player", reason: "heroDefeated" },
      })
    ).toBe("victory");
    expect(
      eventSound({
        _tag: "BattleEnded",
        result: { winner: "enemy", reason: "turnLimit" },
      })
    ).toBe("defeat");
    expect(eventSound({ _tag: "TurnEnded", side: "player" })).toBeNull();
    expect(eventSound(played("mage.fireball"))).toBe("cast");
    expect(eventSound(played("human.militiaRecruit"))).toBeNull();
    const [unit] = startSession({
      stageId: "1-10",
      deck: getStarterDeck("vanguard"),
      player: NEW_PLAYER,
      seed: 1,
    }).view.units;
    // SAFETY: Stage 1-10 starts with one Unit on the Board, so `unit` is defined.
    expect(eventSound({ _tag: "UnitSummoned", unit: unit as never })).toBe(
      "summon"
    );
    expect(
      eventSound({ _tag: "UnitMoved", unitId: 1, lane: 0, from: 0, to: 1 })
    ).toBe("step");
    expect(
      eventSound({ _tag: "UnitHealed", unitId: 1, amount: 1, hp: 2 })
    ).toBe("heal");
    expect(
      eventSound({ _tag: "TurnStarted", side: "enemy", turnNumber: 2 })
    ).toBe("turn");
  });

  it("gives a Block sound to a hit that a Ward absorbs fully, and to Steadfast", () => {
    expect(
      eventSound({
        _tag: "DamageDealt",
        target: { _tag: "Unit", unitId: 1 },
        amount: 0,
        damageType: "physical",
        source: "attack",
        dealer: null,
        crit: false,
        blocked: false,
        trueDamage: false,
        absorbed: 3,
        ward: 0,
        hp: 5,
      })
    ).toBe("block");
    expect(eventSound({ _tag: "SteadfastHeld", unitId: 1 })).toBe("block");
  });

  it("plays the Boss sounds only in a Battle with many Heroes on a Side", () => {
    const boss = { side: "enemy", hero: 0 } as const;
    const defeated = { _tag: "HeroDefeated", hero: boss } as const;
    const dungeon = startDungeon(qaTwoBossDungeon(), 1).view;
    const stage = startSession({
      stageId: "1-1",
      deck: getStarterDeck("vanguard"),
      player: NEW_PLAYER,
      seed: 1,
    }).view;
    expect(eventSound(defeated, dungeon)).toBe("bossDefeated");
    // In a Stage, the Battle ends on the defeat: the end sound plays instead.
    expect(eventSound(defeated, stage)).toBeNull();
    expect(eventSound(defeated)).toBeNull();
    expect(
      eventSound({
        _tag: "FrontMoved",
        from: boss,
        to: { side: "enemy", hero: 1 },
        lanes: [0, 1],
      })
    ).toBe("frontMoved");
    expect(
      eventSound({
        _tag: "BossRuleActivated",
        hero: boss,
        rule: 0,
        threshold: 50,
      })
    ).toBe("bossRule");
  });
});
