import { BattleEvent, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { BattleSession } from "@/features/battle/battle-session";
import { startSession } from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import { heroAnimation } from "@/features/battle/scene/hero-animation";
import { NEW_PLAYER } from "@/features/profile/profile";

const session = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});
const card = BattleEvent.CardPlayed({
  side: "player",
  hero: { side: "player", hero: 0 },
  handIndex: 0,
  card: { instanceId: 123, cardId: "human.militiaRecruit", rank: "common" },
  target: { _tag: "NoTarget" },
});
const playing = (
  event: BattleEvent,
  log: readonly BattleEvent[] = [event]
): BattleSession => ({
  ...session,
  current: { event, duration: 100, before: session.view },
  view: applyEvent(session.view, event),
  log,
});
const clip = (battle: BattleSession, progress = 0.5, reduced = false) =>
  heroAnimation(battle, progress, 1, 2, reduced);

describe("heroAnimation", () => {
  it("spans the card play and its matching summon, but ignores other summons", () => {
    const [first] = session.rules.units;
    if (!first) {
      throw new Error("The Stage has no start Unit");
    }
    const unit = {
      ...first,
      source: { _tag: "Card" as const, card: card.card },
      owner: "player" as const,
      hero: 0,
    };
    const summon = BattleEvent.UnitSummoned({ unit });
    expect(clip(playing(card)).name).toBe("summon");
    const duringSummon = clip(playing(summon, [card, summon]));
    expect(duringSummon.name).toBe("summon");
    expect(duringSummon.phase).toBeCloseTo(0.65);
    expect(clip(playing(summon)).name).toBe("idle");
  });

  it("uses the Class gesture and freezes rest with reduced motion", () => {
    const skill = BattleEvent.CardPlayed({
      ...card,
      card: { ...card.card, cardId: "mage.fireball" },
    });
    const battle = playing(skill);
    const [hero] = battle.view.sides.player.heroes;
    if (!hero) {
      throw new Error("The Player has no Hero");
    }
    for (const [classId, expected] of [
      ["warrior", "castWarrior"],
      ["ranger", "castRanger"],
      ["mage", "castMage"],
      ["priest", "castPriest"],
    ] as const) {
      const view = {
        ...battle.view,
        sides: {
          ...battle.view.sides,
          player: {
            ...battle.view.sides.player,
            heroes: [{ ...hero, classId }],
          },
        },
      };
      expect(clip({ ...battle, view }).name).toBe(expected);
    }
    expect(clip(session, 0, true)).toEqual({ name: "idle", phase: 0 });
  });

  it("starts the tired loop at one third HP", () => {
    const [hero] = session.view.sides.player.heroes;
    if (!hero) {
      throw new Error("The Player has no Hero");
    }
    const atHp = (hp: number) => ({
      ...session,
      view: {
        ...session.view,
        sides: {
          ...session.view.sides,
          player: {
            ...session.view.sides.player,
            heroes: [{ ...hero, hp, maxHp: 6 }],
          },
        },
      },
    });
    expect(clip(atHp(2)).name).toBe("lowHp");
    expect(clip(atHp(3)).name).toBe("idle");
  });

  it("uses hurt only for HP loss and gives the result priority", () => {
    const hp = session.view.sides.player.heroes[0]?.hp ?? 1;
    const hit = BattleEvent.DamageDealt({
      target: { _tag: "Hero", side: "player", hero: 0 },
      amount: 1,
      damageType: "physical",
      source: "skill",
      dealer: null,
      crit: false,
      blocked: false,
      trueDamage: false,
      absorbed: 0,
      ward: 0,
      hp: hp - 1,
    });
    expect(clip(playing(hit)).name).toBe("hurt");
    expect(clip(playing({ ...hit, hp })).name).toBe("idle");
    const ended = {
      ...playing(hit),
      view: {
        ...playing(hit).view,
        result: { winner: "player" as const, reason: "routed" as const },
      },
    };
    expect(clip(ended)).toEqual({ name: "victory", phase: 1 });
  });
});
