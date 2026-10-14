import type { BattleEvent, HeroRef, UnitSnapshot } from "@workspace/rules";
import {
  BattleEvent as Event,
  createBattle,
  getStage,
  getStarterDeck,
  Target,
} from "@workspace/rules";
import { describe, expect, it } from "vitest";

import type { BattleLogBook } from "@/features/battle/battle-log";
import {
  buildBattleLog,
  entryOfEvent,
  stepEntry,
  stepTurn,
} from "@/features/battle/battle-log";
import type { LogArg, LogLine } from "@/features/battle/battle-log-text";
import { entryText } from "@/features/battle/battle-log-text";
import type { BattleSession } from "@/features/battle/battle-session";
import {
  autoPlayTurn,
  skip,
  startSession,
  tick,
} from "@/features/battle/battle-session";
import type { BattleView } from "@/features/battle/battle-view";
import { applyEvent, viewFromState } from "@/features/battle/battle-view";

const PLAYER = { side: "player", hero: 0 } as const;
const ENEMY = { side: "enemy", hero: 0 } as const;

const snapshot = (
  id: number,
  owner: "player" | "enemy",
  lane: number,
  position: number,
  cardId: string,
  extra: Partial<UnitSnapshot> = {}
): UnitSnapshot => ({
  id,
  owner,
  source: {
    _tag: "Card",
    card: { instanceId: 100 + id, cardId, rank: "common" },
  },
  lane,
  position,
  attack: 3,
  hp: 5,
  maxHp: 5,
  speed: 1,
  range: 0,
  damageType: "physical",
  bulwark: 0,
  charge: 0,
  entangle: false,
  firstStrike: false,
  flying: false,
  heroic: 0,
  lastBreath: 0,
  pivot: false,
  poison: false,
  hobble: 0,
  bleed: 0,
  knockback: 0,
  rally: 0,
  rebirth: false,
  regenerate: 0,
  retaliate: false,
  swarm: 0,
  trample: false,
  wall: false,
  summonedTurn: 1,
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  grounded: 0,
  frozen: false,
  paralyzed: false,
  entangled: false,
  ward: 0,
  steadfast: false,
  rallied: 0,
  bonusBulwark: 0,
  bonusBulwarkTurns: 0,
  bonusAttack: 0,
  bonusAttackTurns: 0,
  bonusRange: 0,
  bonusRangeTurns: 0,
  exposed: 0,
  exposedTurns: 0,
  ...extra,
});

const UNITS = [
  snapshot(1, "player", 0, 4, "human.militiaRecruit"),
  snapshot(2, "enemy", 0, 5, "orc.badlandRunt"),
  snapshot(3, "player", 1, 3, "human.shieldbearer"),
  snapshot(4, "enemy", 0, 6, "orc.scrapRaider"),
  snapshot(5, "enemy", 1, 8, "human.halberdier"),
];

/** A Battle of Stage 1-1 at the Player's Play Phase of Turn 1, with the test Units on the Board. */
const startView = (): BattleView => {
  const deck = getStarterDeck("vanguard");
  const { state } = createBattle({
    seed: 3,
    stage: getStage("1-1"),
    player: {
      classId: deck.classId,
      deck: deck.deck,
      level: 1,
      gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 },
    },
  });
  const empty = { ...viewFromState(state), units: [] };
  return UNITS.map((unit) => Event.UnitSummoned({ unit })).reduce(
    applyEvent,
    empty
  );
};

const hit = (
  unitId: number,
  amount: number,
  hp: number,
  source: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>["source"],
  extra: Partial<Extract<BattleEvent, { readonly _tag: "DamageDealt" }>> = {}
) =>
  Event.DamageDealt({
    target: { _tag: "Unit", unitId },
    amount,
    damageType: "physical",
    source,
    dealer: null,
    crit: false,
    blocked: false,
    trueDamage: false,
    absorbed: 0,
    ward: 0,
    hp,
    ...extra,
  });

const attack = (unitId: number, target: number) =>
  Event.UnitAttacked({
    unitId,
    target: { _tag: "Unit", unitId: target },
    ranged: false,
  });

const move = (unitId: number, lane: number, from: number, to: number) =>
  Event.UnitMoved({ unitId, lane, from, to });

const keyword = (
  unitId: number,
  name: Extract<BattleEvent, { readonly _tag: "KeywordActivated" }>["keyword"],
  hero: HeroRef = PLAYER
) => Event.KeywordActivated({ unitId, keyword: name, hero });

const played = (side: "player" | "enemy", cardId: string, target: Target) =>
  Event.CardPlayed({
    side,
    hero: side === "player" ? PLAYER : ENEMY,
    handIndex: 0,
    card: { instanceId: 900, cardId, rank: "common" },
    target,
  });

const book = (events: readonly BattleEvent[]): BattleLogBook =>
  buildBattleLog(startView(), events);

/** Each Log Entry as its kind, its actor and its events. */
const entriesOf = (log: BattleLogBook) =>
  log.entries.map((entry) => ({
    kind: entry.kind,
    actor: entry.actor,
    events: log.events.slice(entry.start, entry.end).map((event) => event._tag),
  }));

describe("buildBattleLog: the Log Entries", () => {
  it("keeps a Token Summon in the card play of its Unit", () => {
    const token = snapshot(11, "player", 2, 3, "human.militiaRecruit", {
      source: { _tag: "Token", tokenId: "token.skeleton", rank: "common" },
    });
    const log = book([
      played(
        "player",
        "undead.graveBellTender",
        Target.Square({ lane: 2, position: 2 })
      ),
      Event.UnitSummoned({
        unit: snapshot(10, "player", 2, 2, "undead.graveBellTender"),
      }),
      keyword(10, "summon"),
      Event.TokenSummoned({ unit: token, sourceUnitId: 10 }),
      played(
        "player",
        "human.shieldbearer",
        Target.Square({ lane: 0, position: 1 })
      ),
    ]);
    expect(entriesOf(log)).toEqual([
      {
        kind: "card",
        actor: null,
        events: [
          "CardPlayed",
          "UnitSummoned",
          "KeywordActivated",
          "TokenSummoned",
        ],
      },
      { kind: "card", actor: null, events: ["CardPlayed"] },
    ]);
    expect(log.entries[0]?.changed).toEqual([10, 11]);
  });

  it("puts an attack, its Retaliate and the death of the attacker in one Unit Action", () => {
    const log = book([
      move(1, 0, 4, 4),
      attack(1, 2),
      hit(2, 3, 2, "attack"),
      keyword(2, "retaliate", ENEMY),
      hit(1, 5, 0, "retaliate"),
      Event.UnitDied({ unitId: 1 }),
      move(3, 1, 3, 4),
    ]);
    expect(entriesOf(log)).toEqual([
      {
        kind: "action",
        actor: 1,
        events: [
          "UnitMoved",
          "UnitAttacked",
          "DamageDealt",
          "KeywordActivated",
          "DamageDealt",
          "UnitDied",
        ],
      },
      { kind: "action", actor: 3, events: ["UnitMoved"] },
    ]);
    expect(log.entries[0]?.fallen).toEqual([
      { unitId: 1, owner: "player", lane: 0, position: 4 },
    ]);
    expect(log.entries[0]?.changed).toEqual([2]);
  });

  it("keeps Knockback and Trample in the action of the attacker", () => {
    const log = book([
      attack(1, 2),
      hit(2, 3, 2, "attack"),
      keyword(1, "knockback"),
      Event.UnitPushed({ unitId: 2, lane: 0, from: 5, to: 6 }),
      attack(3, 5),
      hit(5, 5, 0, "attack"),
      Event.UnitDied({ unitId: 5 }),
      keyword(3, "trample"),
      hit(4, 2, 3, "trample"),
    ]);
    expect(entriesOf(log)).toEqual([
      {
        kind: "action",
        actor: 1,
        events: [
          "UnitAttacked",
          "DamageDealt",
          "KeywordActivated",
          "UnitPushed",
        ],
      },
      {
        kind: "action",
        actor: 3,
        events: [
          "UnitAttacked",
          "DamageDealt",
          "UnitDied",
          "KeywordActivated",
          "DamageDealt",
        ],
      },
    ]);
  });

  it("gives Burn and Poison in the End Phase their own entries, and starts the next Turn", () => {
    const log = book([
      move(1, 0, 4, 4),
      hit(1, 1, 4, "burn", { damageType: "fire" }),
      hit(3, 1, 4, "burn", { damageType: "fire" }),
      hit(3, 4, 0, "poison"),
      Event.UnitDied({ unitId: 3 }),
      Event.TurnEnded({ side: "player" }),
      Event.TurnStarted({ side: "enemy", turnNumber: 1 }),
      Event.CountdownsTicked({ side: "enemy", countdowns: [1, 2] }),
      Event.CardDrawn({
        side: "enemy",
        card: {
          instanceId: 77,
          cardId: "orc.badlandRunt",
          rank: "common",
          countdown: 2,
        },
      }),
    ]);
    expect(entriesOf(log)).toEqual([
      { kind: "action", actor: 1, events: ["UnitMoved"] },
      { kind: "burn", actor: null, events: ["DamageDealt", "DamageDealt"] },
      { kind: "poison", actor: null, events: ["DamageDealt", "UnitDied"] },
      {
        kind: "cards",
        actor: null,
        events: ["TurnEnded", "TurnStarted", "CountdownsTicked", "CardDrawn"],
      },
    ]);
    expect(
      log.turns.map(({ turnNumber, side, first, end }) => ({
        turnNumber,
        side,
        first,
        end,
      }))
    ).toEqual([
      { turnNumber: 1, side: "player", first: 0, end: 3 },
      { turnNumber: 1, side: "enemy", first: 3, end: 4 },
    ]);
  });

  it("gives each Field Effect hit its own entry", () => {
    const log = book([
      Event.FieldEffectStruck({ fieldId: 1, turns: 1 }),
      hit(2, 2, 3, "field", { damageType: "fire" }),
      Event.FieldEffectStruck({ fieldId: 2, turns: 0 }),
      hit(4, 2, 3, "field", { damageType: "frost" }),
      Event.FieldEffectEnded({ fieldId: 2 }),
      Event.TurnEnded({ side: "player" }),
    ]);
    expect(entriesOf(log).map((entry) => entry.kind)).toEqual([
      "field",
      "field",
    ]);
    // The end of the Field Effect and of the Turn wait for a next entry. With none, they stay in the last one.
    expect(log.entries.at(-1)?.end).toBe(6);
  });

  it("gives Sudden Death its own entry in the Start Phase", () => {
    const log = book([
      Event.TurnStarted({ side: "player", turnNumber: 41 }),
      Event.DamageDealt({
        target: { _tag: "Hero", side: "player" },
        amount: 1,
        damageType: "physical",
        source: "suddenDeath",
        dealer: null,
        crit: false,
        blocked: false,
        trueDamage: false,
        absorbed: 0,
        ward: 0,
        hp: 9,
      }),
      Event.CountdownsTicked({ side: "player", countdowns: [0] }),
    ]);
    expect(entriesOf(log)).toEqual([
      {
        kind: "suddenDeath",
        actor: null,
        events: ["TurnStarted", "DamageDealt"],
      },
      { kind: "cards", actor: null, events: ["CountdownsTicked"] },
    ]);
  });

  it("keeps the extra actions of a Skill Card in its card play", () => {
    const log = book([
      played("player", "warrior.onslaught", Target.Lane({ lane: 0 })),
      move(1, 0, 4, 4),
      attack(1, 2),
      hit(2, 3, 2, "attack"),
      Event.RecallRolled({
        side: "player",
        card: { instanceId: 900, cardId: "warrior.onslaught", rank: "common" },
        success: false,
      }),
      move(1, 0, 4, 4),
    ]);
    expect(entriesOf(log)).toEqual([
      {
        kind: "card",
        actor: null,
        events: [
          "CardPlayed",
          "UnitMoved",
          "UnitAttacked",
          "DamageDealt",
          "RecallRolled",
        ],
      },
      { kind: "action", actor: 1, events: ["UnitMoved"] },
    ]);
  });

  it("keeps a Rebirth in the action that killed the Unit, and the Unit is not fallen", () => {
    const log = book([
      attack(1, 2),
      hit(2, 5, 0, "attack"),
      keyword(2, "rebirth", ENEMY),
      Event.UnitReborn({ unitId: 2, hp: 2 }),
    ]);
    expect(entriesOf(log)).toEqual([
      {
        kind: "action",
        actor: 1,
        events: [
          "UnitAttacked",
          "DamageDealt",
          "KeywordActivated",
          "UnitReborn",
        ],
      },
    ]);
    expect(log.entries[0]?.fallen).toEqual([]);
    expect(log.entries[0]?.changed).toEqual([1, 2]);
  });

  it("starts a Unit Action at the Charge or the Pivot of a new Unit", () => {
    const log = book([
      attack(1, 2),
      keyword(3, "charge"),
      move(3, 1, 3, 6),
      keyword(3, "pivot"),
      attack(3, 5),
    ]);
    expect(entriesOf(log)).toEqual([
      { kind: "action", actor: 1, events: ["UnitAttacked"] },
      {
        kind: "action",
        actor: 3,
        events: [
          "KeywordActivated",
          "UnitMoved",
          "KeywordActivated",
          "UnitAttacked",
        ],
      },
    ]);
  });

  it("gives the Start Phase effects one entry each: Lanes, Regenerate, Rally, Countdowns and draw", () => {
    const log = book([
      Event.TurnStarted({ side: "player", turnNumber: 2 }),
      Event.LaneOpened({ lane: 3 }),
      keyword(1, "regenerate"),
      Event.UnitHealed({ unitId: 1, amount: 1, hp: 5 }),
      keyword(3, "rally"),
      Event.UnitsRallied({ unitId: 3, targets: [{ unitId: 1, rallied: 1 }] }),
      Event.CountdownsTicked({ side: "player", countdowns: [0] }),
      Event.CardDrawn({
        side: "player",
        card: {
          instanceId: 78,
          cardId: "human.militiaRecruit",
          rank: "common",
          countdown: 1,
        },
      }),
    ]);
    expect(entriesOf(log).map((entry) => entry.kind)).toEqual([
      "lanes",
      "regenerate",
      "rally",
      "cards",
    ]);
  });
});

/** All values of the lines of a Log Entry, also in the summary. */
const argsOf = (lines: readonly LogLine[]): LogArg[] =>
  lines.flatMap((line) => Object.values(line.args));

describe("entryText", () => {
  it("never names the card of an enemy draw", () => {
    const log = book([
      Event.TurnStarted({ side: "enemy", turnNumber: 1 }),
      Event.CountdownsTicked({ side: "enemy", countdowns: [1] }),
      Event.CardDrawn({
        side: "enemy",
        card: {
          instanceId: 77,
          cardId: "orc.skyreaver",
          rank: "rare",
          countdown: 3,
        },
      }),
    ]);
    const [entry] = log.entries;
    if (!entry) {
      throw new Error("No Log Entry");
    }
    const text = entryText(log, entry);
    const args = argsOf([text.summary, ...text.lines]);
    expect(JSON.stringify(args)).not.toContain("orc.skyreaver");
    expect(text.summary.key).toBe("battleLog.line.drawEnemy");
    expect(log.views[0]?.sides.enemy.hand.at(-1)).toMatchObject({
      cardId: null,
      rank: null,
      countdown: 3,
    });
  });

  it("names the card, its target and its results in a card play", () => {
    const log = book([
      played(
        "player",
        "mage.fireball",
        Target.Square({ lane: 0, position: 5 })
      ),
      hit(2, 4, 0, "skill", { damageType: "fire", crit: true }),
      Event.UnitDied({ unitId: 2 }),
    ]);
    const [entry] = log.entries;
    if (!entry) {
      throw new Error("No Log Entry");
    }
    const text = entryText(log, entry);
    expect(text.summary).toMatchObject({
      key: "battleLog.line.playYou",
      args: { card: { _tag: "Card", cardId: "mage.fireball" } },
    });
    expect(text.lines.map((line) => line.key)).toEqual([
      "battleLog.line.target",
      "battleLog.line.damage",
      "battleLog.line.died",
    ]);
    expect(text.lines[0]?.args.target).toEqual({
      _tag: "Text",
      ref: { key: "battleLog.square", args: { lane: 1, column: 6 } },
    });
    expect(text.lines[1]?.flags).toEqual([{ _tag: "Crit" }]);
    expect(text.damage).toBe(4);
    expect(text.deaths).toBe(1);
  });

  it("names the Keyword with its value and the Status with its count", () => {
    const log = book([
      attack(1, 2),
      Event.KeywordActivated({
        unitId: 1,
        keyword: "heroic",
        hero: PLAYER,
        value: 2,
      }),
      hit(2, 5, 0, "attack", { absorbed: 1, ward: 0 }),
      Event.StatusApplied({ unitId: 4, status: "poison", count: 2 }),
    ]);
    const [entry] = log.entries;
    if (!entry) {
      throw new Error("No Log Entry");
    }
    const text = entryText(log, entry);
    expect(text.summary.key).toBe("battleLog.line.attack");
    expect(argsOf(text.lines)).toEqual(
      expect.arrayContaining([
        {
          _tag: "Keyword",
          keyword: "heroic",
          name: { key: "keywords.heroic", args: { value: 2 } },
        },
        {
          _tag: "Status",
          status: "poison",
          name: { key: "battle.status.poisoned", args: { value: 2 } },
        },
      ])
    );
    expect(text.lines[1]?.flags).toEqual([{ _tag: "Ward", absorbed: 1 }]);
  });
});

/** The AI plays both Sides; the screen plays all events. Each item is the session after one Turn of each Side. */
const playedTurns = (seed: number, stageId: string, turns: number) => {
  let session = startSession({
    stageId,
    deck: getStarterDeck("vanguard"),
    player: { level: 3, gear: { weapon: 0, armor: 0, trinket: 0, banner: 0 } },
    seed,
  });
  const sessions: BattleSession[] = [];
  for (
    let turn = 0;
    turn < turns && session.rules.status === "ongoing";
    turn += 1
  ) {
    session = skip(autoPlayTurn(session));
    sessions.push(session);
  }
  return sessions;
};

describe("buildBattleLog on a played Battle", () => {
  it.each([
    [1, "1-3"],
    [7, "1-5"],
    [12, "1-9"],
  ])(
    "puts each event in one entry, in order (seed %i, Stage %s)",
    (seed, stageId) => {
      const [last] = playedTurns(seed, stageId, 60).slice(-1);
      if (!last) {
        throw new Error("No Turn");
      }
      const log = buildBattleLog(last.start, last.log);
      let next = 0;
      for (const entry of log.entries) {
        expect(entry.start).toBe(next);
        expect(entry.end).toBeGreaterThan(entry.start);
        ({ end: next } = entry);
      }
      expect(next).toBe(last.log.length);
      expect(log.views.at(-1)).toEqual(last.view);
      expect(log.turns.at(-1)?.end).toBe(log.entries.length);
    }
  );

  it("shows the Hand, the Countdowns and the piles of each past Turn", () => {
    const sessions = playedTurns(5, "1-4", 6);
    const [last] = sessions.slice(-1);
    if (!last) {
      throw new Error("No Turn");
    }
    const log = buildBattleLog(last.start, last.log);
    for (const session of sessions) {
      const entry = log.entries.find(
        (candidate) => candidate.end === session.log.length
      );
      expect(
        entry,
        `an entry ends at event ${session.log.length}`
      ).toBeDefined();
      const view = entry ? log.views[entry.index] : undefined;
      expect(view?.sides.player.hand).toEqual(session.view.sides.player.hand);
      expect(view?.sides.enemy.hand).toEqual(session.view.sides.enemy.hand);
      expect(view?.sides.player.deck).toBe(session.view.sides.player.deck);
      expect(view?.sides.player.graveyard).toEqual(
        session.view.sides.player.graveyard
      );
      expect(view?.sides.enemy.hand.every((card) => card.cardId === null)).toBe(
        true
      );
    }
  });

  it("has no Log Entry after Live: the queue is not in it", () => {
    const [first] = playedTurns(9, "1-2", 1);
    if (!first) {
      throw new Error("No Turn");
    }
    // The next Turn waits in the queue, and the screen played only a part of it.
    const playing = tick(autoPlayTurn(first), 400);
    expect(playing.queue.length).toBeGreaterThan(0);
    const log = buildBattleLog(playing.start, playing.log);
    expect(log.events).toHaveLength(playing.log.length);
    expect(log.entries.at(-1)?.end).toBe(playing.log.length);
    expect(log.views.at(-1)).toEqual(playing.view);
  });
});

describe("stepEntry, stepTurn and entryOfEvent", () => {
  const log = book([
    attack(1, 2),
    attack(3, 5),
    Event.TurnEnded({ side: "player" }),
    Event.TurnStarted({ side: "enemy", turnNumber: 1 }),
    Event.CountdownsTicked({ side: "enemy", countdowns: [1] }),
    move(2, 0, 5, 4),
    move(4, 0, 6, 5),
    Event.TurnEnded({ side: "enemy" }),
    Event.TurnStarted({ side: "player", turnNumber: 2 }),
    Event.CountdownsTicked({ side: "player", countdowns: [0] }),
  ]);

  it("goes one entry back or forward, and stops at the ends", () => {
    expect(stepEntry(log, 0, -1)).toBe(0);
    expect(stepEntry(log, 2, 1)).toBe(3);
    expect(stepEntry(log, 5, 1)).toBe(5);
  });

  it("goes to the start of the Turn, then to the Turn before or after", () => {
    expect(log.turns.map((turn) => turn.first)).toEqual([0, 2, 5]);
    expect(stepTurn(log, 3, -1)).toBe(2);
    expect(stepTurn(log, 2, -1)).toBe(0);
    expect(stepTurn(log, 0, 1)).toBe(2);
    expect(stepTurn(log, 2, 1)).toBe(5);
    expect(stepTurn(log, 5, 1)).toBe(5);
  });

  it("finds the entry of an event", () => {
    expect(entryOfEvent(log, 0)).toBe(0);
    expect(entryOfEvent(log, 3)).toBe(2);
    expect(entryOfEvent(log, 9)).toBe(5);
  });
});
