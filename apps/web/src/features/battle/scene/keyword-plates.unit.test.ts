import type { ActivatedKeyword, BattleEvent } from "@workspace/rules";
import { getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { initI18n } from "@/core/libs/i18n/init";
import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";
import type { BattleSession } from "@/features/battle/battle-session";
import { skip, startSession } from "@/features/battle/battle-session";
import type { BattleView, UnitView } from "@/features/battle/battle-view";
import type { TextRef } from "@/features/battle/card-text";
import { resolveText } from "@/features/battle/card-text";
import type { Fx } from "@/features/battle/scene/fx";
import type { KeywordPlate } from "@/features/battle/scene/keyword-plates";
import {
  keywordPlate,
  MAX_PLATES,
  PLATE_STEP,
  shownPlates,
  withoutPlates,
} from "@/features/battle/scene/keyword-plates";
import { laneZ, squareX } from "@/features/battle/scene/layout";
import { keptFx, startedEvents } from "@/features/battle/scene/started-events";
import { badgeHeight } from "@/features/battle/scene/unit-models";
import { SCENE_WHITE } from "@/features/battle/tokens";
import { NEW_PLAYER } from "@/features/profile/profile";

const session = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});
const { view } = session;
const [first] = view.units;
if (!first) {
  throw new Error("Stage 1-10 starts with a Unit on the Board");
}

/** A second Unit of the player, so that a test has an attacker and a defender. */
const ally: UnitView = { ...first, id: 900, owner: "player", position: 2 };
const board: BattleView = { ...view, units: [...view.units, ally] };

const activated = (
  unit: UnitView,
  keyword: ActivatedKeyword,
  value?: number
): BattleEvent => ({
  _tag: "KeywordActivated",
  unitId: unit.id,
  keyword,
  hero: { side: unit.owner, hero: 0 },
  value,
});

const plateOf = (fx: readonly Fx[]): KeywordPlate[] =>
  fx.filter((each): each is KeywordPlate => each.kind === "plate");

/** A session that shows `log` as new events after `before`. */
const withNew = (
  before: BattleSession,
  events: readonly BattleEvent[]
): BattleSession => ({ ...before, log: [...before.log, ...events] });

const textIn = (locale: "en-us" | "id-id") => {
  const { t } = initI18n({
    locale,
    fallbackLocale: [],
    translations: { "en-us": enUS, "id-id": idID },
  });
  // SAFETY: the keys come from game data, as in `useGameText`.
  const translate = (key: string, args?: Record<string, string | number>) =>
    t(key as never, args as never);
  return (ref: TextRef) => resolveText(translate, ref);
};

describe("keywordPlate", () => {
  it("makes one plate for each KeywordActivated, over the Unit that has the Keyword", () => {
    const before = { ...session, view: board };
    const next = withNew(before, [
      activated(ally, "swarm", 2),
      activated(first, "retaliate"),
      activated(ally, "knockback", 1),
    ]);
    const plates = plateOf(startedEvents(before, next, 3).fx);
    expect(plates.map((plate) => [plate.unitId, plate.keyword])).toEqual([
      [ally.id, "swarm"],
      [first.id, "retaliate"],
      [ally.id, "knockback"],
    ]);
    expect(plates[0]).toMatchObject({
      kind: "plate",
      side: ally.owner,
      follow: true,
      x: squareX(ally.position),
      z: laneZ(ally.lane, board.lanes),
      height: badgeHeight(ally.source),
      start: 3,
    });
    expect(textIn("en-us")(plates[0]?.label ?? { key: "" })).toBe("Swarm 2");
  });

  it("makes no plate for other events, or for a Unit that is not on the Board", () => {
    expect(
      keywordPlate({ _tag: "TurnEnded", side: "player" }, board, null, 0, 1)
    ).toBeNull();
    expect(
      keywordPlate(
        activated({ ...ally, id: 999 }, "heroic", 1),
        board,
        null,
        0,
        1
      )
    ).toBeNull();
  });

  it("puts the Last Breath plate on the last Square of its Unit, which died just before", () => {
    const dead = { ...ally, position: 4 };
    const alive: BattleView = { ...view, units: [...view.units, dead] };
    // The Unit died in the current event: the view has no Unit now.
    const before: BattleSession = {
      ...session,
      view,
      current: {
        event: { _tag: "UnitDied", unitId: dead.id },
        duration: 460,
        before: alive,
      },
    };
    const [plate] = plateOf(
      startedEvents(
        before,
        withNew(before, [activated(dead, "lastBreath", 2)]),
        1
      ).fx
    );
    expect(plate).toMatchObject({
      unitId: dead.id,
      follow: false,
      x: squareX(4),
      z: laneZ(dead.lane, view.lanes),
    });
    expect(textIn("id-id")(plate?.label ?? { key: "" })).toBe(
      "Nafas Terakhir 2"
    );
  });

  it("finds the dead Unit also when its death and its Last Breath start in one frame", () => {
    const dead = { ...ally, position: 5 };
    const before = {
      ...session,
      view: { ...view, units: [...view.units, dead] },
    };
    const next = withNew(before, [
      { _tag: "UnitDied", unitId: dead.id },
      activated(dead, "lastBreath", 1),
    ]);
    expect(plateOf(startedEvents(before, next, 0).fx)).toEqual([
      expect.objectContaining({ unitId: dead.id, x: squareX(5) }),
    ]);
  });

  it("lives 1.1 s at speed ×1 and 0.7 s at speed ×2", () => {
    const event = activated(ally, "heroic", 1);
    expect(keywordPlate(event, board, null, 0, 1)?.duration).toBe(1.1);
    expect(keywordPlate(event, board, null, 0, 2)?.duration).toBe(0.7);
  });
});

const plateAt = (unitId: number, start: number, duration = 1.1): Fx => ({
  kind: "plate",
  unitId,
  keyword: "poison",
  label: { key: "keywords.poison" },
  side: "player",
  follow: true,
  x: 0,
  z: 0,
  height: 1.33,
  start,
  duration,
});

describe("shownPlates", () => {
  it("grows a plate in, raises it a little, and fades it in the last 25% of its life", () => {
    const fx = [plateAt(1, 0)];
    const [start] = shownPlates(fx, 0, false);
    const [grown] = shownPlates(fx, 0.12, false);
    const [late] = shownPlates(fx, 1.1 * 0.9, false);
    expect(start?.scale).toBe(0.5);
    expect(grown?.scale).toBe(1);
    expect(start?.lift).toBe(0);
    expect(late?.lift).toBeGreaterThan(grown?.lift ?? 1);
    expect(grown?.opacity).toBe(1);
    expect(shownPlates(fx, 1.1 * 0.75, false)[0]?.opacity).toBeCloseTo(1);
    expect(late?.opacity).toBeCloseTo(0.4);
    expect(shownPlates(fx, 1.1, false)).toEqual([]);
  });

  it("with reduced motion, shows a plate at full size at once, does not raise it, and fades it out", () => {
    const fx = [plateAt(1, 0)];
    for (const time of [0, 0.05, 0.5, 1]) {
      const [shown] = shownPlates(fx, time, true);
      expect(shown?.scale).toBe(1);
      expect(shown?.lift).toBe(0);
    }
    expect(shownPlates(fx, 1, true)[0]?.opacity).toBeLessThan(1);
  });

  it("puts a new plate under the older plates of its Unit and pushes them up", () => {
    const fx = [plateAt(1, 0), plateAt(1, 0.2), plateAt(2, 0.2)];
    const shown = shownPlates(fx, 0.4, true);
    expect(shown.map((item) => [item.plate.unitId, item.lift])).toEqual([
      [1, PLATE_STEP],
      [1, 0],
      [2, 0],
    ]);
    // While the new plate grows in, it pushes the older plate up step by step.
    const growing = shownPlates(fx, 0.25, false);
    expect(growing[0]?.lift).toBeGreaterThan(0);
    expect(growing[0]?.lift).toBeLessThan(PLATE_STEP + 0.1);
  });

  it("shows at most 3 plates on one Unit: the oldest goes out first", () => {
    const fx = [0, 0.1, 0.2, 0.3].map((start) => plateAt(1, start));
    const shown = shownPlates(fx, 0.5, true);
    expect(MAX_PLATES).toBe(3);
    expect(shown.map((item) => item.plate)).toEqual(fx.slice(1));
    expect(shown.map((item) => item.lift)).toEqual([
      2 * PLATE_STEP,
      PLATE_STEP,
      0,
    ]);
  });
});

describe("no plates in Skip and in the Battle Log", () => {
  it("makes no plates in Skip, and the plates on the screen go", () => {
    const before = {
      ...session,
      view: board,
      queue: [activated(ally, "heroic", 1), activated(first, "pivot")],
    };
    const skipped = skip(before);
    expect(skipped.log).toHaveLength(before.log.length + 2);
    const onScreen = [plateAt(1, 0), plateAt(2, 0)];
    expect(plateOf(keptFx(onScreen, before, skipped))).toEqual([]);
    // Skip applied the events: the next frame starts no event, and no plate.
    expect(startedEvents(skipped, skipped, 0).fx).toEqual([]);
  });

  it("keeps the plates when the HUD plays a card, ends the Turn or changes the speed", () => {
    const onScreen = [plateAt(1, 0)];
    expect(keptFx(onScreen, session, { ...session, speed: 2 })).toBe(onScreen);
  });

  it("removes the plates from the effects of the Battle Log Play", () => {
    const number: Fx = {
      kind: "ring",
      color: SCENE_WHITE,
      x: 0,
      z: 0,
      start: 0,
    };
    expect(withoutPlates([plateAt(1, 0), number])).toEqual([number]);
    const none = [number];
    expect(withoutPlates(none)).toBe(none);
  });
});
