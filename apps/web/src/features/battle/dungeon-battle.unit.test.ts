import type {
  BattleEvent,
  BattleState,
  DungeonDefinition,
} from "@workspace/rules";
import { chooseCommand, getStarterDeck, step } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import { battleNameRef, enemyNameRef } from "@/features/battle/battle-content";
import { buildBattleLog } from "@/features/battle/battle-log";
import { entryText } from "@/features/battle/battle-log-text";
import { startSession } from "@/features/battle/battle-session";
import { eventDuration } from "@/features/battle/battle-timeline";
import {
  applyEvent,
  hasManyHeroes,
  heroOf,
  viewFromState,
} from "@/features/battle/battle-view";
import {
  qaThreeBossDungeon,
  qaTwoBossDungeon,
  qaWeakTwoBossDungeon,
  startDungeon,
} from "@/features/battle/qa-dungeons";
import { bracketSpot } from "@/features/battle/scene/front-brackets";
import { frontZ, laneZ } from "@/features/battle/scene/layout";
import { buildQaState } from "@/features/battle/test-hooks";
import { NEW_PLAYER } from "@/features/profile/profile";

/** Each step of a whole Dungeon Battle that the AI plays for both Sides. */
const dungeonSteps = (seed: number, dungeon: DungeonDefinition) => {
  let state = startDungeon(dungeon, seed).rules;
  const result: {
    before: BattleState;
    after: BattleState;
    events: readonly BattleEvent[];
  }[] = [];
  while (state.status !== "finished") {
    const output = Result.getOrThrow(step(state, chooseCommand(state)));
    result.push({ before: state, after: output.state, events: output.events });
    ({ state } = output);
  }
  return result;
};

describe("the view of a Dungeon Battle (issue #93)", () => {
  it("has one Hero view for each Boss, with its Front and Boss Rules", () => {
    const { view } = startDungeon(qaTwoBossDungeon(), 1);
    expect(view.lanes).toBe(4);
    expect(hasManyHeroes(view, "enemy")).toBe(true);
    expect(hasManyHeroes(view, "player")).toBe(false);
    expect(view.sides.enemy.heroes.map((hero) => hero.front)).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(heroOf(view, "player").front).toEqual([0, 1, 2, 3]);
    expect(heroOf(view, "enemy", 0).bossRules).toEqual([
      {
        threshold: 50,
        effect: { type: "summon", cardId: "orc.mesaPitFighter", rank: "rare" },
        activated: false,
      },
    ]);
    // Each Boss draws its own start Hand; the Player sees only the Countdowns.
    for (const hero of view.sides.enemy.heroes) {
      expect(hero.hand.length).toBeGreaterThan(0);
      expect(hero.hand.every((card) => card.cardId === null)).toBe(true);
    }
  });

  it.each([1, 2, 3, 4])(
    "rebuilds each next state from the events, with Defeats, Front moves and Boss Rules (seed %i)",
    (seed) => {
      const all = [
        ...dungeonSteps(seed, qaWeakTwoBossDungeon()),
        ...dungeonSteps(seed, qaThreeBossDungeon()),
      ];
      for (const { before, after, events } of all) {
        expect(events.reduce(applyEvent, viewFromState(before))).toEqual(
          viewFromState(after)
        );
      }
    }
  );

  it("plays Defeats, Front moves and Boss Rules in some Battles", () => {
    const tags = new Set(
      [1, 2, 3, 4, 5, 6].flatMap((seed) =>
        dungeonSteps(seed, qaWeakTwoBossDungeon()).flatMap(({ events }) =>
          events.map((event) => event._tag)
        )
      )
    );
    expect(tags).toContain("HeroDefeated");
    expect(tags).toContain("FrontMoved");
    expect(tags).toContain("BossRuleActivated");
  });
});

describe("the time of the Dungeon events", () => {
  const stage = startSession({
    stageId: "1-1",
    deck: getStarterDeck("vanguard"),
    player: NEW_PLAYER,
    seed: 1,
  }).view;
  const dungeon = startDungeon(qaTwoBossDungeon(), 1).view;
  const enemy = { side: "enemy", hero: 0 } as const;

  it("lets a Boss fall in a Dungeon, but ends a Stage at once, as before", () => {
    const defeated = {
      _tag: "HeroDefeated",
      hero: enemy,
    } as const satisfies BattleEvent;
    expect(eventDuration(defeated, 1, stage)).toBe(0);
    expect(eventDuration(defeated, 1, dungeon)).toBe(900);
    expect(eventDuration(defeated, 2, dungeon)).toBe(450);
  });

  it("gives a Front move and a Boss Rule their own beat", () => {
    expect(
      eventDuration(
        {
          _tag: "FrontMoved",
          from: enemy,
          to: { side: "enemy", hero: 1 },
          lanes: [0, 1],
        },
        1,
        dungeon
      )
    ).toBe(700);
    expect(
      eventDuration(
        { _tag: "BossRuleActivated", hero: enemy, rule: 0, threshold: 50 },
        1,
        dungeon
      )
    ).toBe(900);
  });
});

describe("bracketSpot", () => {
  const { view } = startDungeon(qaTwoBossDungeon(), 1);
  const first = { side: "enemy", hero: 0 } as const;
  const second = { side: "enemy", hero: 1 } as const;

  it("covers the Lanes of the Front of each Boss, with a gap between them", () => {
    const top = bracketSpot(first, null, view, 1);
    const bottom = bracketSpot(second, null, view, 1);
    expect(top?.z).toBeCloseTo(frontZ([0, 1], 4));
    expect(bottom?.z).toBeCloseTo(frontZ([2, 3], 4));
    const gap =
      (bottom?.z ?? 0) -
      (bottom?.depth ?? 0) / 2 -
      ((top?.z ?? 0) + (top?.depth ?? 0) / 2);
    expect(gap).toBeGreaterThan(0.1);
    expect(top?.opacity).toBe(1);
  });

  it("grows the Bracket of the receiver over the moved Lanes, and fades the other", () => {
    const fallen = {
      ...view,
      sides: {
        ...view.sides,
        enemy: {
          heroes: view.sides.enemy.heroes.map((hero, index) =>
            index === 0 ? { ...hero, hp: 0 } : hero
          ),
        },
      },
    };
    const event = {
      _tag: "FrontMoved",
      from: first,
      to: second,
      lanes: [0, 1],
    } as const satisfies BattleEvent;
    const after = applyEvent(fallen, event);
    const current = { event, duration: 700, before: fallen };
    const start = bracketSpot(second, current, after, 0);
    const end = bracketSpot(second, current, after, 1);
    expect(start?.z).toBeCloseTo(frontZ([2, 3], 4));
    expect(end?.z).toBeCloseTo(frontZ([0, 1, 2, 3], 4));
    expect(end?.depth ?? 0).toBeGreaterThan(laneZ(3, 4) - laneZ(0, 4));
    expect(bracketSpot(first, current, after, 0.5)?.opacity).toBeLessThan(1);
    expect(bracketSpot(first, current, after, 1)).toBeNull();
    expect(bracketSpot(first, null, after, 1)).toBeNull();
  });
});

describe("the Battle Log of a Dungeon", () => {
  it("lists each Defeat, Front move and Boss Rule, and the HP of each Boss", () => {
    const battle = dungeonSteps(3, qaWeakTwoBossDungeon());
    const [first] = battle;
    if (!first) {
      throw new Error("The Battle has no step");
    }
    const events = battle.flatMap((each) => each.events);
    const book = buildBattleLog(viewFromState(first.before), events);
    const keys = new Set(
      book.entries.flatMap((entry) =>
        entryText(book, entry).lines.map((line) => line.key)
      )
    );
    expect(keys).toContain("battleLog.line.heroDefeated");
    expect(keys).toContain("battleLog.line.frontMoved");
    expect(book.turns.every((turn) => turn.hp.enemy.length === 2)).toBe(true);
    expect(book.turns.every((turn) => turn.hp.player.length === 1)).toBe(true);
  });
});

describe("the names of a Dungeon Battle", () => {
  it("names each Boss and the Dungeon from the Message Catalog", () => {
    const { options } = startDungeon(qaTwoBossDungeon(), 1);
    expect(enemyNameRef(options, 1)).toEqual({
      key: "dungeons.dungeon-1.bosses.rootwardenSylla",
    });
    expect(battleNameRef(options)).toEqual({ key: "dungeons.dungeon-1.name" });
    const qa = startDungeon(qaThreeBossDungeon(), 1).options;
    expect(enemyNameRef(qa, 2)).toEqual({ key: "stages.5-10.enemy" });
    expect(battleNameRef(qa)).toEqual({
      key: "battle.dungeonName",
      args: { number: 3 },
    });
  });
});

describe("the Dungeon QA states", () => {
  it("builds 2-Boss and 3-Boss Battles, and stops before a Boss Rule and a Defeat", () => {
    expect(buildQaState("dungeon", 42)?.view.sides.enemy.heroes).toHaveLength(
      2
    );
    expect(
      buildQaState("dungeon-three", 42)?.view.sides.enemy.heroes.map(
        (hero) => hero.front
      )
    ).toEqual([[0], [1, 2], [3]]);
    expect(buildQaState("dungeon-boss-rule", 42)?.queue[0]?._tag).toBe(
      "BossRuleActivated"
    );
    expect(buildQaState("dungeon-defeat", 42)?.queue[0]?._tag).toBe(
      "HeroDefeated"
    );
  });
});
