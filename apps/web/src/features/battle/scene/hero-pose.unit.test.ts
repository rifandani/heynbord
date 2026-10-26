import { BattleEvent } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { DAMAGE_COLORS } from "@/core/components/game/tokens";
import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleView, HeroView } from "@/features/battle/battle-view";
import { applyEvent } from "@/features/battle/battle-view";
import { heroPose } from "@/features/battle/scene/hero-pose";
import {
  frontZ,
  HERO_FIGURE_Y,
  heroX,
  laneZ,
} from "@/features/battle/scene/layout";
import { RALLY_TINT } from "@/features/battle/tokens";

const hero = (front: readonly number[], hp = 20): HeroView => ({
  hp,
  maxHp: 20,
  classId: "warrior",
  front,
  bossRules: [],
  hand: [],
  deck: 0,
  graveyard: [],
});

/** A Battle view with the enemy Heroes of `fronts`: one for a Stage, more for a Dungeon. */
const viewOf = (
  lanes: number,
  enemies: readonly HeroView[] = [hero([0, 1, 2])]
): BattleView => ({
  lanes,
  closedLanes: [],
  turnNumber: 1,
  activeSide: "player",
  sides: {
    player: {
      heroes: [hero(Array.from({ length: lanes }, (_, lane) => lane))],
    },
    enemy: { heroes: enemies },
  },
  units: [],
  fieldEffects: [],
  result: null,
});

const STAGE = viewOf(3);
const DUNGEON = viewOf(4, [hero([0, 1]), hero([2, 3])]);

const ENEMY = { side: "enemy", hero: 0 } as const;
const PLAYER = { side: "player", hero: 0 } as const;

/** The event `event` playing from the view `before`. */
const playing = (event: BattleEvent, before: BattleView): PlayingEvent => ({
  event,
  duration: 900,
  before,
});

const damage = (
  target: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>["target"]
) =>
  BattleEvent.DamageDealt({
    target,
    amount: 2,
    damageType: "physical",
    source: "attack",
    dealer: null,
    crit: false,
    blocked: false,
    trueDamage: false,
    absorbed: 0,
    ward: 0,
    hp: 10,
  });

const cast = (side: "player" | "enemy", cardId: string, index = 0) =>
  BattleEvent.CardPlayed({
    side,
    hero: { side, hero: index },
    handIndex: 0,
    card: { instanceId: 1, cardId, rank: "common" },
    target: { _tag: "NoTarget" },
  });

describe("heroPose", () => {
  it("bobs in place when nothing hits it", () => {
    expect(heroPose(PLAYER, null, STAGE, 0.5, 1)).toEqual({
      x: heroX("player"),
      y: HERO_FIGURE_Y + Math.sin(1.4) * 0.03,
      z: 0,
      lean: 0,
      opacity: 1,
      hitTint: null,
      cast: null,
    });
    expect(heroPose(ENEMY, null, STAGE, 0.5, 1).y).toBe(
      HERO_FIGURE_Y + Math.sin(1.4 + 2) * 0.03
    );
  });

  it("shakes red while damage hits it", () => {
    const event = damage({ _tag: "Hero", side: "enemy", hero: 0 });
    const hit = heroPose(ENEMY, playing(event, STAGE), STAGE, 0.5, 0);
    expect(hit.x).toBeCloseTo(heroX("enemy") + Math.sin(20) * 0.04);
    expect(hit.hitTint).toBeCloseTo(0.35);
  });

  it("ignores damage to the other Hero, to a Unit, and other events", () => {
    for (const event of [
      damage({ _tag: "Hero", side: "player", hero: 0 }),
      damage({ _tag: "Hero", side: "enemy", hero: 1 }),
      damage({ _tag: "Unit", unitId: 1 }),
      BattleEvent.UnitDied({ unitId: 1 }),
    ]) {
      expect(
        heroPose(ENEMY, playing(event, DUNGEON), DUNGEON, 0.5, 0).hitTint
      ).toBeNull();
    }
  });

  it("rises toward the Board in the effect color while it casts a Skill Card", () => {
    const fireball = playing(cast("enemy", "mage.fireball"), STAGE);
    const enemy = heroPose(ENEMY, fireball, STAGE, 0.3, 0);
    expect(enemy.y).toBeGreaterThan(HERO_FIGURE_Y + 0.25);
    expect(enemy.x).toBeLessThan(heroX("enemy"));
    expect(enemy.cast?.color).toBe(DAMAGE_COLORS.fire);
    expect(heroPose(PLAYER, fireball, STAGE, 0.3, 0).cast).toBeNull();
    expect(
      heroPose(
        ENEMY,
        playing(cast("enemy", "human.militiaRecruit"), STAGE),
        STAGE,
        0.3,
        0
      ).cast
    ).toBeNull();
    const still = heroPose(ENEMY, fireball, STAGE, 0.3, 0, true);
    expect(still.y).toBe(HERO_FIGURE_Y + Math.sin(2) * 0.03);
    expect(still.cast?.amount).toBeGreaterThan(0);
  });

  it("casts only from the Boss that plays the card", () => {
    const second = playing(cast("enemy", "mage.fireball", 1), DUNGEON);
    expect(heroPose(ENEMY, second, DUNGEON, 0.3, 0).cast).toBeNull();
    expect(
      heroPose({ side: "enemy", hero: 1 }, second, DUNGEON, 0.3, 0).cast?.color
    ).toBe(DAMAGE_COLORS.fire);
  });

  it("stands each Boss at the middle of its Front", () => {
    expect(heroPose(ENEMY, null, DUNGEON, 1, 0).z).toBeCloseTo(
      (laneZ(0, 4) + laneZ(1, 4)) / 2
    );
    expect(
      heroPose({ side: "enemy", hero: 1 }, null, DUNGEON, 1, 0).z
    ).toBeCloseTo((laneZ(2, 4) + laneZ(3, 4)) / 2);
  });

  it("glows gold while its Boss Rule activates", () => {
    const rule = playing(
      BattleEvent.BossRuleActivated({ hero: ENEMY, rule: 0, threshold: 50 }),
      DUNGEON
    );
    expect(heroPose(ENEMY, rule, DUNGEON, 0.3, 0).cast?.color).toBe(RALLY_TINT);
    expect(
      heroPose({ side: "enemy", hero: 1 }, rule, DUNGEON, 0.3, 0).cast
    ).toBeNull();
  });

  it("falls back and fades when a Boss is Defeated, and is then gone", () => {
    const defeated = viewOf(4, [hero([0, 1], 0), hero([2, 3])]);
    const fall = playing(BattleEvent.HeroDefeated({ hero: ENEMY }), defeated);
    const start = heroPose(ENEMY, fall, defeated, 0, 0);
    const end = heroPose(ENEMY, fall, defeated, 1, 0);
    expect(start.opacity).toBe(1);
    // The enemy faces the Board on the left, so it falls back to the right.
    expect(end.lean).toBeLessThan(-1);
    expect(end.opacity).toBe(0);
    expect(heroPose(ENEMY, null, defeated, 1, 0).opacity).toBe(0);
    // With reduced motion, it is gone at once.
    expect(heroPose(ENEMY, fall, defeated, 0.2, 0, true)).toMatchObject({
      lean: 0,
      opacity: 0,
    });
  });

  it("stays in view at 0 HP in a Stage, where the Battle ends", () => {
    const won = viewOf(3, [hero([0, 1, 2], 0)]);
    expect(
      heroPose(
        ENEMY,
        playing(BattleEvent.HeroDefeated({ hero: ENEMY }), won),
        won,
        1,
        0
      )
    ).toMatchObject({ lean: 0, opacity: 1 });
  });

  it("walks to the middle of its new Front when a Front moves to it", () => {
    const before = viewOf(4, [hero([0, 1], 0), hero([2, 3])]);
    const event = BattleEvent.FrontMoved({
      from: ENEMY,
      to: { side: "enemy", hero: 1 },
      lanes: [0, 1],
    });
    const after = applyEvent(before, event);
    const receiver = { side: "enemy", hero: 1 } as const;
    const moving = playing(event, before);
    expect(heroPose(receiver, moving, after, 0, 0).z).toBeCloseTo(
      frontZ([2, 3], 4)
    );
    expect(heroPose(receiver, moving, after, 1, 0).z).toBeCloseTo(
      frontZ([0, 1, 2, 3], 4)
    );
    expect(heroPose(receiver, moving, after, 0, 0, true).z).toBeCloseTo(0);
  });
});
