import type { BattleEvent, FieldEffect, UnitSnapshot } from "@workspace/rules";
import { BattleEvent as Event, getStarterDeck, Target } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { LogEntry, LogEntryKind } from "@/features/battle/battle-log";
import { buildBattleLog } from "@/features/battle/battle-log";
import type {
  LogArg,
  LogLine,
  LogUnit,
} from "@/features/battle/battle-log-text";
import {
  entryText,
  keywordName,
  logRoster,
  logUnitName,
} from "@/features/battle/battle-log-text";
import { startSession } from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import { NEW_PLAYER } from "@/features/profile/profile";

const PLAYER = { side: "player", hero: 0 } as const;
const ENEMY = { side: "enemy", hero: 0 } as const;

/**
 * Stage 1-10 at the start: one enemy Unit (id 1) on the Board. The Player Hand
 * has the card with instance 1, and the enemy Hand the hidden card with
 * instance 11.
 */
const session = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});

const [base] = session.rules.units;
if (!base) {
  throw new Error("Stage 1-10 starts with no Unit");
}

const unitOf = (
  id: number,
  source: UnitSnapshot["source"],
  extra: Partial<UnitSnapshot> = {}
): UnitSnapshot => ({
  ...base,
  id,
  owner: "player",
  source,
  lane: 1,
  position: 2,
  ...extra,
});

/** A Rare Scrap Raider (Heroic 2 at Rare) with some Status counts. */
const raider = unitOf(
  20,
  {
    _tag: "Card",
    card: { instanceId: 120, cardId: "orc.scrapRaider", rank: "rare" },
  },
  { hobbled: 2, bleeding: 3, grounded: 1, ward: 4, exposed: 2 }
);

/** A Hushbow: it summons a Skeleton. */
const hushbow = unitOf(22, {
  _tag: "Card",
  card: { instanceId: 122, cardId: "undead.hushbow", rank: "common" },
});

const skeleton = unitOf(
  21,
  { _tag: "Token", tokenId: "token.skeleton", rank: "epic" },
  { position: 3 }
);

const start = [raider, hushbow]
  .map((unit) => Event.UnitSummoned({ unit }))
  .reduce(applyEvent, session.view);

const field: FieldEffect = {
  id: 7,
  owner: "player",
  hero: 0,
  card: { instanceId: 130, cardId: "mage.fireball", rank: "epic" },
  lane: 0,
  position: 6,
  lanes: 1,
  columns: 1,
  amount: 2,
  damageType: "fire",
  turns: 2,
};

/** The text of one Log Entry of kind `kind` that holds all of `events`. */
const textOf = (
  kind: LogEntryKind,
  events: readonly BattleEvent[],
  fallen: LogEntry["fallen"] = []
) => {
  const book = buildBattleLog(start, events);
  return entryText(book, {
    index: 0,
    kind,
    turn: 0,
    start: 0,
    end: events.length,
    actor: null,
    changed: [],
    fallen,
  });
};

/**
 * The line of one event. A `field` entry with no Field Effect hit uses its
 * first line (a skip) as the summary, so the line of `event` comes next.
 */
const lineOf = (event: BattleEvent): LogLine | undefined =>
  textOf("field", [Event.UnitSkipped({ unitId: 20 }), event]).lines[0];

/** A Unit as the Battle Log names it. */
const logUnit = (unit: UnitSnapshot): LogUnit => ({
  id: unit.id,
  owner: unit.owner,
  source:
    unit.source._tag === "Card"
      ? { _tag: "Card", cardId: unit.source.card.cardId }
      : { _tag: "Token", tokenId: unit.source.tokenId },
  rank: unit.source._tag === "Card" ? unit.source.card.rank : unit.source.rank,
});

const unitArg = (unit: UnitSnapshot): LogArg => ({
  _tag: "Unit",
  unit: logUnit(unit),
});

const damage = (
  extra: Partial<Extract<BattleEvent, { readonly _tag: "DamageDealt" }>> = {}
) =>
  Event.DamageDealt({
    target: { _tag: "Unit", unitId: 20 },
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
    ...extra,
  });

describe("logRoster and logUnitName", () => {
  it("knows the Units at the start and each Token, and names them", () => {
    const summoned = unitOf(23, {
      _tag: "Card",
      card: { instanceId: 123, cardId: "human.halberdier", rank: "uncommon" },
    });
    const book = buildBattleLog(start, [
      Event.UnitSummoned({ unit: summoned }),
      Event.TokenSummoned({ unit: skeleton, sourceUnitId: 22 }),
    ]);
    const roster = logRoster(book);
    expect(roster.get(23)).toEqual(logUnit(summoned));
    expect(roster.get(20)).toEqual(logUnit(raider));
    const token = roster.get(21);
    expect(token).toEqual({
      id: 21,
      owner: "player",
      source: { _tag: "Token", tokenId: "token.skeleton" },
      rank: "epic",
    });
    expect(token && logUnitName(token)).toEqual({
      key: "tokens.skeleton.name",
    });
    const card = roster.get(20);
    expect(card && logUnitName(card)).toEqual({
      key: "cards.orc.scrapRaider.name",
    });
  });
});

describe("keywordName", () => {
  /** A Unit that the Battle Log does not know: `undefined`. */
  const unknownUnit = logRoster(buildBattleLog(start, [])).get(99);

  const raiderUnit = {
    source: { _tag: "Card", cardId: "orc.scrapRaider" },
    rank: "rare",
  } as const;

  it("names the Token of Summon, or a general Token when the Unit is not known", () => {
    expect(
      keywordName("summon", undefined, {
        source: { _tag: "Card", cardId: "undead.hushbow" },
        rank: "common",
      })
    ).toEqual({
      key: "keywords.summon",
      args: { token: { key: "tokens.skeleton.name" } },
    });
    expect(keywordName("summon", undefined, unknownUnit)).toEqual({
      key: "keywords.summon",
      args: { token: { key: "battleLog.token" } },
    });
  });

  it("takes the value from the event, else from the card at the Rank of the Unit", () => {
    expect(keywordName("heroic", 5, raiderUnit)).toEqual({
      key: "keywords.heroic",
      args: { value: 5 },
    });
    expect(keywordName("heroic", undefined, raiderUnit)).toEqual({
      key: "keywords.heroic",
      args: { value: 2 },
    });
  });

  it("gives no value for a flag Keyword, a Token Unit, a Skill Card or no Unit", () => {
    expect(keywordName("flying", undefined, raiderUnit)).toEqual({
      key: "keywords.flying",
    });
    expect(
      keywordName("heroic", undefined, {
        source: { _tag: "Token", tokenId: "token.skeleton" },
        rank: "common",
      })
    ).toEqual({ key: "keywords.heroic" });
    expect(
      keywordName("heroic", undefined, {
        source: { _tag: "Card", cardId: "mage.fireball" },
        rank: "common",
      })
    ).toEqual({ key: "keywords.heroic" });
    expect(keywordName("heroic", undefined, unknownUnit)).toEqual({
      key: "keywords.heroic",
    });
  });
});

type StatusId = Extract<
  BattleEvent,
  { readonly _tag: "StatusApplied" }
>["status"];

/** The Status value of the line of a Status with no count in the event. */
const statusOf = (status: StatusId, unitId = 20) =>
  lineOf(Event.StatusApplied({ unitId, status }))?.args.status;

/** The Status value that the line must have. */
const statusArg = (status: StatusId, key: string, value?: number): LogArg => ({
  _tag: "Status",
  status,
  name: value === undefined ? { key } : { key, args: { value } },
});

describe("the Status line", () => {
  it("reads the count of the Status from the Unit after the event", () => {
    // Poison with no count adds 1 to the Poisoned count of 0.
    expect(statusOf("poison")).toEqual(
      statusArg("poison", "battle.status.poisoned", 1)
    );
    expect(statusOf("hobble")).toEqual(
      statusArg("hobble", "battle.status.hobbled", 2)
    );
    expect(statusOf("bleed")).toEqual(
      statusArg("bleed", "battle.status.bleeding", 3)
    );
    expect(statusOf("grounded")).toEqual(
      statusArg("grounded", "battle.status.grounded", 1)
    );
    expect(statusOf("ward")).toEqual(
      statusArg("ward", "battle.status.ward", 4)
    );
    expect(statusOf("exposed")).toEqual(
      statusArg("exposed", "battle.status.exposed", 2)
    );
  });

  it("gives no count to a Status with no count, and 0 for a Unit that is not on the Board", () => {
    expect(statusOf("burn")).toEqual(statusArg("burn", "battle.status.burn"));
    expect(statusOf("poison", 99)).toEqual(
      statusArg("poison", "battle.status.poisoned", 0)
    );
  });
});

/** The line key of a Recall roll of a River Knight. */
const recall = (success: boolean) =>
  lineOf(
    Event.RecallRolled({
      side: "player",
      hero: 0,
      card: { instanceId: 4, cardId: "human.riverKnight", rank: "uncommon" },
      success,
    })
  )?.key;

describe("the card lines", () => {
  it("names the card of a Player draw, and the Hero of the Countdowns", () => {
    const text = textOf("cards", [
      Event.CountdownsTicked({ side: "player", hero: 0, countdowns: [1] }),
      Event.CardDrawn({
        side: "player",
        hero: 0,
        card: {
          instanceId: 50,
          cardId: "human.halberdier",
          rank: "rare",
          countdown: 2,
        },
      }),
    ]);
    expect(text.summary).toEqual({
      key: "battleLog.line.drawYou",
      args: {
        card: { _tag: "Card", cardId: "human.halberdier", rank: "rare" },
      },
      flags: [],
    });
    expect(text.lines.map((each) => each.key)).toEqual([
      "battleLog.line.countdownsYou",
    ]);
    expect(
      lineOf(Event.CountdownsTicked({ side: "enemy", hero: 0, countdowns: [] }))
    ).toMatchObject({
      key: "battleLog.line.countdownsEnemy",
      args: { hero: { _tag: "Hero", side: "enemy", hero: 0 } },
    });
  });

  it("hides the card of an enemy draw", () => {
    expect(
      lineOf(
        Event.CardDrawn({
          side: "enemy",
          hero: 0,
          card: {
            instanceId: 60,
            cardId: "orc.badlandRunt",
            rank: "common",
            countdown: 1,
          },
        })
      )
    ).toEqual({
      key: "battleLog.line.drawEnemy",
      args: { hero: { _tag: "Hero", side: "enemy", hero: 0 } },
      flags: [],
    });
  });

  it("tells a Recall to the Hand from a card that goes to the Graveyard", () => {
    expect(recall(true)).toBe("battleLog.line.recalled");
    expect(recall(false)).toBe("battleLog.line.toGraveyard");
  });

  it("names a changed card of the Player Hand, but hides a card of the enemy Hand", () => {
    expect(
      lineOf(
        Event.CountdownChanged({
          side: "player",
          hero: 0,
          instanceId: 1,
          countdown: 3,
        })
      )
    ).toMatchObject({
      key: "battleLog.line.countdownYours",
      args: {
        card: { _tag: "Card", cardId: "human.crossbowGuard", rank: "common" },
        countdown: 3,
      },
    });
    expect(
      lineOf(
        Event.CardSabotaged({
          unitId: 20,
          side: "enemy",
          hero: 0,
          instanceId: 11,
          countdown: 5,
        })
      )
    ).toEqual({
      key: "battleLog.line.countdownHidden",
      args: { hero: { _tag: "Hero", side: "enemy", hero: 0 }, countdown: 5 },
      flags: [],
    });
    // A Player card that is not in the Hand is hidden too.
    expect(
      lineOf(
        Event.CountdownChanged({
          side: "player",
          hero: 0,
          instanceId: 999,
          countdown: 1,
        })
      )?.key
    ).toBe("battleLog.line.countdownHidden");
  });
});

describe("the Unit lines", () => {
  it("names the Unit, the Square and the values of each Unit event", () => {
    expect(
      lineOf(Event.TokenSummoned({ unit: skeleton, sourceUnitId: 22 }))
    ).toEqual({
      key: "battleLog.line.summon",
      args: {
        unit: unitArg(skeleton),
        square: {
          _tag: "Text",
          ref: { key: "battleLog.square", args: { lane: 2, column: 4 } },
        },
      },
      flags: [],
    });
    expect(
      lineOf(Event.UnitMoved({ unitId: 20, lane: 1, from: 2, to: 3 }))?.args
    ).toEqual({ unit: unitArg(raider), from: 3, to: 4 });
    expect(
      lineOf(Event.UnitPushed({ unitId: 20, lane: 1, from: 2, to: 1 }))
    ).toEqual({
      key: "battleLog.line.push",
      args: { unit: unitArg(raider), from: 3, to: 2 },
      flags: [],
    });
    expect(lineOf(Event.AttackSkipped({ unitId: 22 }))).toEqual({
      key: "battleLog.line.noAttack",
      args: { unit: unitArg(hushbow) },
      flags: [],
    });
    expect(
      lineOf(Event.UnitHealed({ unitId: 20, amount: 2, hp: 5 }))?.args
    ).toEqual({ unit: unitArg(raider), amount: 2 });
    expect(
      lineOf(
        Event.UnitsRallied({
          unitId: 20,
          targets: [
            { unitId: 22, rallied: 1 },
            { unitId: 1, rallied: 1 },
          ],
        })
      )?.args
    ).toEqual({ unit: unitArg(raider), count: 2 });
    expect(lineOf(Event.UnitReborn({ unitId: 20, hp: 4 }))?.args).toEqual({
      unit: unitArg(raider),
      hp: 4,
    });
  });

  it("names a Hero target, and an unknown Unit", () => {
    expect(
      lineOf(
        Event.UnitAttacked({
          unitId: 99,
          target: { _tag: "Hero", side: "enemy", hero: 0 },
          ranged: true,
        })
      )?.args
    ).toEqual({
      unit: { _tag: "Text", ref: { key: "battleLog.unknownUnit" } },
      target: { _tag: "Hero", side: "enemy", hero: 0 },
    });
  });

  it("names the summoned Unit and its Square", () => {
    expect(lineOf(Event.UnitSummoned({ unit: hushbow }))?.args).toEqual({
      unit: unitArg(hushbow),
      square: {
        _tag: "Text",
        ref: { key: "battleLog.square", args: { lane: 2, column: 3 } },
      },
    });
  });

  it("shows the Crit, the Block, the Ward and the True Damage of a hit as flags", () => {
    expect(lineOf(damage({ crit: true, absorbed: 2 }))?.flags).toEqual([
      { _tag: "Crit" },
      { _tag: "Ward", absorbed: 2 },
    ]);
    expect(lineOf(damage({ blocked: true }))?.flags).toEqual([
      { _tag: "Block" },
    ]);
    expect(lineOf(damage({ trueDamage: true }))?.flags).toEqual([
      { _tag: "TrueDamage" },
    ]);
  });
});

/** The key and the values of the line of one event, with no flags. */
const keyed = (event: BattleEvent) => {
  const result = lineOf(event);
  return result && { key: result.key, args: result.args };
};

/** The line key of the end of the Battle. */
const end = (winner: "player" | "enemy") =>
  lineOf(Event.BattleEnded({ result: { winner, reason: "heroDefeated" } }))
    ?.key;

describe("the effect lines", () => {
  it("gives each effect its line and its value", () => {
    const unit = unitArg(raider);
    expect(keyed(Event.SteadfastHeld({ unitId: 20 }))).toEqual({
      key: "battleLog.line.steadfast",
      args: { unit },
    });
    expect(keyed(Event.DebuffsRemoved({ unitId: 20 }))).toEqual({
      key: "battleLog.line.cleansed",
      args: { unit },
    });
    expect(keyed(Event.DebuffRemoved({ unitId: 20 }))).toEqual({
      key: "battleLog.line.dispelled",
      args: { unit },
    });
    expect(
      keyed(Event.BulwarkGained({ unitId: 20, bulwark: 2, turns: 1 }))
    ).toEqual({ key: "battleLog.line.bulwark", args: { unit, value: 2 } });
    expect(
      keyed(Event.AttackGained({ unitId: 20, attack: 3, turns: 1 }))
    ).toEqual({ key: "battleLog.line.attackBonus", args: { unit, value: 3 } });
    expect(keyed(Event.HeroicGained({ unitId: 20, heroicBonus: 4 }))).toEqual({
      key: "battleLog.line.heroicBonus",
      args: { unit, value: 4 },
    });
    expect(
      keyed(Event.SoulHarvestGained({ unitId: 20, soulHarvest: 1, hp: 6 }))
    ).toEqual({ key: "battleLog.line.soulHarvest", args: { unit, value: 1 } });
    expect(
      keyed(Event.RangeGained({ unitId: 20, range: 2, turns: 1 }))
    ).toEqual({ key: "battleLog.line.rangeBonus", args: { unit, value: 2 } });
    expect(keyed(Event.LaneOpened({ lane: 2 }))).toEqual({
      key: "battleLog.line.laneOpened",
      args: { lane: 3 },
    });
  });

  it("names the card of a Field Effect when it is placed and when it hits", () => {
    const card = { _tag: "Card", cardId: "mage.fireball", rank: "epic" };
    expect(lineOf(Event.FieldEffectPlaced({ field }))?.args).toEqual({
      card,
      turns: 2,
    });
    const text = textOf("field", [
      Event.FieldEffectPlaced({ field }),
      Event.FieldEffectStruck({ fieldId: 7, turns: 1 }),
    ]);
    expect(text.summary).toEqual({
      key: "battleLog.line.fieldStruck",
      args: { card, turns: 1 },
      flags: [],
    });
    // A hit of a Field Effect that the Battle Log does not know shows no line.
    expect(
      textOf("field", [Event.FieldEffectStruck({ fieldId: 8, turns: 0 })])
        .summary.key
    ).toBe("battleLog.line.nothing");
  });

  it("names the Heroes of a Defeat, a Front move and a Boss Rule", () => {
    const boss = { side: "enemy", hero: 1 } as const;
    expect(lineOf(Event.HeroDefeated({ hero: boss }))?.args).toEqual({
      hero: { _tag: "Hero", ...boss },
    });
    expect(
      lineOf(Event.FrontMoved({ from: boss, to: ENEMY, lanes: [2] }))?.args
    ).toEqual({
      from: { _tag: "Hero", ...boss },
      to: { _tag: "Hero", ...ENEMY },
      lanes: {
        _tag: "Text",
        ref: { key: "battleLog.laneOne", args: { lane: 3 } },
      },
    });
    expect(
      lineOf(Event.FrontMoved({ from: boss, to: ENEMY, lanes: [2, 3] }))?.args
        .lanes
    ).toEqual({
      _tag: "Text",
      ref: { key: "battleLog.laneList", args: { lanes: "3, 4" } },
    });
    expect(
      lineOf(Event.BossRuleActivated({ hero: boss, rule: 0, threshold: 50 }))
    ).toMatchObject({
      key: "battleLog.line.bossRule",
      args: { hero: { _tag: "Hero", ...boss }, threshold: 50 },
    });
  });

  it("tells a won Battle from a lost one", () => {
    expect(end("player")).toBe("battleLog.line.won");
    expect(end("enemy")).toBe("battleLog.line.lost");
  });
});

/** A play of a Fireball by `side` on `target`. */
const playedCard = (side: "player" | "enemy", target: Target): BattleEvent =>
  Event.CardPlayed({
    side,
    hero: side === "player" ? PLAYER : ENEMY,
    handIndex: 0,
    card: { instanceId: 900, cardId: "mage.fireball", rank: "common" },
    target,
  });

describe("the summary of a Log Entry", () => {
  it("names the enemy Hero of an enemy card play, and the target Lane or Hero", () => {
    const lane = textOf("card", [
      playedCard("enemy", Target.Lane({ lane: 1 })),
    ]);
    expect(lane.summary).toEqual({
      key: "battleLog.line.playEnemy",
      args: {
        hero: { _tag: "Hero", side: "enemy", hero: 0 },
        card: { _tag: "Card", cardId: "mage.fireball", rank: "common" },
      },
      flags: [],
    });
    expect(lane.lines).toEqual([
      { key: "battleLog.line.targetLane", args: { lane: 2 }, flags: [] },
    ]);
    const square = textOf("card", [
      playedCard("player", Target.Square({ lane: 2, position: 7 })),
    ]);
    expect(square.summary.key).toBe("battleLog.line.playYou");
    expect(square.lines[0]?.args).toEqual({
      target: {
        _tag: "Text",
        ref: { key: "battleLog.square", args: { lane: 3, column: 8 } },
      },
    });
    const hero = textOf("card", [
      playedCard("player", Target.Hero({ side: "enemy", hero: 0 })),
    ]);
    expect(hero.lines[0]?.args).toEqual({
      target: { _tag: "Hero", side: "enemy", hero: 0 },
    });
    expect(
      textOf("card", [playedCard("player", Target.NoTarget())]).lines
    ).toEqual([]);
  });

  it("uses the first line when a card entry has no card play", () => {
    const text = textOf("card", [
      Event.UnitHealed({ unitId: 20, amount: 1, hp: 4 }),
      Event.UnitDied({ unitId: 22 }),
    ]);
    expect(text.summary.key).toBe("battleLog.line.heal");
    expect(text.lines.map((each) => each.key)).toEqual(["battleLog.line.died"]);
  });

  it("counts the Units that Burn or Poison hits", () => {
    const one = textOf("burn", [damage({ source: "burn", amount: 1 })]);
    expect(one.summary).toEqual({
      key: "battleLog.line.burnOne",
      args: { unit: unitArg(raider) },
      flags: [],
    });
    const many = textOf("poison", [
      damage({ source: "poison", amount: 1 }),
      damage({
        source: "poison",
        amount: 2,
        target: { _tag: "Unit", unitId: 22 },
      }),
      damage({
        source: "poison",
        amount: 3,
        target: { _tag: "Hero", side: "enemy", hero: 0 },
      }),
    ]);
    expect(many.summary).toEqual({
      key: "battleLog.line.poisonMany",
      args: { count: 2 },
      flags: [],
    });
    expect(many.lines).toHaveLength(3);
    expect(many.damage).toBe(6);
  });

  it("gives Sudden Death its own summary", () => {
    const text = textOf(
      "suddenDeath",
      [damage({ source: "suddenDeath" }), Event.UnitDied({ unitId: 20 })],
      [{ unitId: 20, owner: "player", lane: 1, position: 2 }]
    );
    expect(text.summary.key).toBe("battleLog.line.suddenDeath");
    expect(text.lines.map((each) => each.key)).toEqual([
      "battleLog.line.damage",
      "battleLog.line.died",
    ]);
    expect(text.deaths).toBe(1);
  });

  it("uses the Keyword as the summary of a Regenerate, and does not repeat it", () => {
    const text = textOf("regenerate", [
      Event.KeywordActivated({
        unitId: 20,
        keyword: "regenerate",
        hero: PLAYER,
        value: 1,
      }),
      Event.UnitHealed({ unitId: 20, amount: 1, hp: 5 }),
    ]);
    expect(text.summary.key).toBe("battleLog.line.keyword");
    expect(text.lines.map((each) => each.key)).toEqual(["battleLog.line.heal"]);
  });

  it("uses the first line when no event of the kind has a line, else 'nothing'", () => {
    expect(
      textOf("lanes", [
        Event.TurnEnded({ side: "player" }),
        Event.UnitDied({ unitId: 20 }),
      ]).summary.key
    ).toBe("battleLog.line.died");
    expect(
      textOf("rally", [Event.TurnEnded({ side: "player" })]).summary
    ).toEqual({ key: "battleLog.line.nothing", args: {}, flags: [] });
  });
});
