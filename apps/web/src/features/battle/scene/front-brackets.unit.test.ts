import type { BattleEvent, HeroRef } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { PlayingEvent } from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import type { BattleView, HeroView } from "@/features/battle/battle-view";
import { qaTwoBossDungeon, startDungeon } from "@/features/battle/qa-dungeons";
import { bracketSpot } from "@/features/battle/scene/front-brackets";
import { frontZ } from "@/features/battle/scene/layout";

const { view } = startDungeon(qaTwoBossDungeon(), 1);
const first = { side: "enemy", hero: 0 } as const;
const second = { side: "enemy", hero: 1 } as const;
const player = { side: "player", hero: 0 } as const;

/** `base` with the enemy Heroes changed by `change`. */
const withEnemies = (
  base: BattleView,
  change: (heroes: readonly HeroView[]) => readonly HeroView[]
): BattleView => ({
  ...base,
  sides: {
    ...base.sides,
    enemy: { heroes: change(base.sides.enemy.heroes) },
  },
});

/** `base` with the first Boss at 0 HP. */
const fallen = withEnemies(view, (heroes) =>
  heroes.map((hero, index) => (index === 0 ? { ...hero, hp: 0 } : hero))
);

const playing = (event: BattleEvent, before: BattleView): PlayingEvent => ({
  event,
  duration: 700,
  before,
});

const frontMoved = (from: HeroRef, to: HeroRef) =>
  ({
    _tag: "FrontMoved",
    from,
    to,
    lanes: [0, 1],
  }) as const satisfies BattleEvent;

describe("bracketSpot of a Defeated Hero", () => {
  const defeated = playing({ _tag: "HeroDefeated", hero: first }, view);

  it("dims the Bracket while the Hero falls", () => {
    expect(bracketSpot(first, defeated, fallen, 0)?.opacity).toBe(1);
    // The fall eases out: at half time, 1 - 0.6 × 0.875 of the light stays.
    expect(bracketSpot(first, defeated, fallen, 0.5)?.opacity).toBeCloseTo(
      0.475
    );
    expect(bracketSpot(first, defeated, fallen, 1)?.opacity).toBeCloseTo(0.4);
  });

  it("shows the dim Bracket at once with reduced motion", () => {
    expect(bracketSpot(first, defeated, fallen, 0, true)?.opacity).toBeCloseTo(
      0.4
    );
  });

  it("keeps the Bracket dim after the fall, and while another Hero falls", () => {
    expect(bracketSpot(first, null, fallen, 0)?.opacity).toBe(0.4);
    const other = playing({ _tag: "HeroDefeated", hero: second }, view);
    expect(bracketSpot(first, other, fallen, 0)?.opacity).toBe(0.4);
    expect(bracketSpot(first, other, fallen, 0)?.z).toBeCloseTo(
      frontZ([0, 1], 4)
    );
  });
});

describe("bracketSpot while a Front moves", () => {
  const event = frontMoved(first, second);
  const after = applyEvent(fallen, event);
  const current = playing(event, fallen);

  it("shows the end of the move at once with reduced motion", () => {
    expect(bracketSpot(second, current, after, 0, true)?.z).toBeCloseTo(
      frontZ([0, 1, 2, 3], 4)
    );
    expect(bracketSpot(first, current, after, 0, true)).toBeNull();
  });

  it("does not change the Bracket of a Hero that is not in the move", () => {
    expect(bracketSpot(player, current, after, 0.5)).toEqual(
      bracketSpot(player, null, after, 0.5)
    );
  });

  it("shows no Bracket for a Hero that has no Front before the move", () => {
    const empty = withEnemies(fallen, (heroes) =>
      heroes.map((hero) => ({ ...hero, front: [] }))
    );
    const noFront = playing(event, empty);
    expect(bracketSpot(first, noFront, after, 0.5)).toBeNull();
    // The receiver has no Front to grow from, so it shows its new Front.
    expect(bracketSpot(second, noFront, after, 0.5)?.z).toBeCloseTo(
      frontZ([0, 1, 2, 3], 4)
    );
  });

  it("shows no Bracket for a Hero that is not on the Board", () => {
    const ghost = { side: "enemy", hero: 4 } as const;
    expect(bracketSpot(ghost, current, after, 0.5)).toBeNull();
    expect(bracketSpot(ghost, null, after, 0.5)).toBeNull();
    // The receiver is gone from the view after the move.
    const gone = withEnemies(after, (heroes) => heroes.slice(0, 1));
    expect(bracketSpot(second, current, gone, 0.5)).toBeNull();
  });
});

describe("bracketSpot of a Hero with no Front", () => {
  it("shows no Bracket for a Hero with HP and an empty Front", () => {
    const empty = withEnemies(view, (heroes) =>
      heroes.map((hero) => ({ ...hero, front: [] }))
    );
    expect(bracketSpot(first, null, empty, 1)).toBeNull();
  });
});
