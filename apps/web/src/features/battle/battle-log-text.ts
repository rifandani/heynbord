import type {
  BattleEvent,
  DamageType,
  HeroRef,
  RankId,
  Side,
  TargetRef,
} from "@workspace/rules";
import { getCard, keywordValue, unitRank } from "@workspace/rules";

import type {
  BattleLogBook,
  LogEntry,
  LogEntryKind,
} from "@/features/battle/battle-log";
import type {
  BattleView,
  UnitSourceView,
  UnitView,
} from "@/features/battle/battle-view";
import { applyEvent } from "@/features/battle/battle-view";
import type { Keyword, TextRef } from "@/features/battle/card-text";
import {
  STATUS_TEXT,
  tokenNameKey,
  VALUE_KEYWORDS,
} from "@/features/battle/card-text";
import type { Status } from "@/features/battle/scene/status-visuals";

/** A Unit of the Battle, as the Battle Log names it. */
export interface LogUnit {
  readonly id: number;
  readonly owner: Side;
  readonly source: UnitSourceView;
  readonly rank: RankId;
}

/**
 * One value in a line of the Battle Log. A Unit, a card, a Keyword, a Status
 * and a Damage Type are links (GDD 11.2): a Unit or a card opens its Card
 * Details, and a Keyword, a Status or a Damage Type opens its Handbook Entry.
 */
export type LogArg =
  | number
  | { readonly _tag: "Text"; readonly ref: TextRef }
  | { readonly _tag: "Unit"; readonly unit: LogUnit }
  | { readonly _tag: "Card"; readonly cardId: string; readonly rank: RankId }
  | {
      readonly _tag: "Keyword";
      readonly keyword: Keyword;
      /** The name with its value, for example "Heroic 2" or "Summon Skeleton". */
      readonly name: TextRef;
    }
  | {
      readonly _tag: "Status";
      readonly status: Status;
      /** The name with its count, for example "Poison 2". */
      readonly name: TextRef;
    }
  | { readonly _tag: "Damage"; readonly damageType: DamageType }
  | { readonly _tag: "Hero"; readonly side: Side; readonly hero: number };

/** The roll results and the defense of one hit: they show as small chips after the line. */
export type LogFlag =
  | { readonly _tag: "Crit" }
  | { readonly _tag: "Block" }
  | { readonly _tag: "TrueDamage" }
  | { readonly _tag: "Ward"; readonly absorbed: number };

/** One line of a Log Entry: a Translation Key of `battleLog.line` and its values. */
export interface LogLine {
  readonly key: string;
  readonly args: Readonly<Record<string, LogArg>>;
  readonly flags: readonly LogFlag[];
}

/** The text of one Log Entry: one short summary, and one line for each result. */
export interface LogEntryText {
  readonly summary: LogLine;
  readonly lines: readonly LogLine[];
  /** All damage of the entry, to Units and Heroes. */
  readonly damage: number;
  /** The Units that died and did not come back. */
  readonly deaths: number;
}

const line = (
  key: string,
  args: Readonly<Record<string, LogArg>> = {},
  flags: readonly LogFlag[] = []
): LogLine => ({ key: `battleLog.line.${key}`, args, flags });

/** The Square of a Unit, from the view of the Player: Lane 1 is the far Lane, Column 1 is next to the Player's Hero. */
const square = (lane: number, position: number): LogArg => ({
  _tag: "Text",
  ref: {
    key: "battleLog.square",
    args: { lane: lane + 1, column: position + 1 },
  },
});

const unitOf = (unit: {
  readonly id: number;
  readonly owner: Side;
  readonly source: UnitSourceView;
  readonly rank: RankId;
}): LogUnit => ({
  id: unit.id,
  owner: unit.owner,
  source: unit.source,
  rank: unit.rank,
});

/** The Units of the Battle by id: the Units at the start, and each summon and Token. */
export const logRoster = (
  book: BattleLogBook
): ReadonlyMap<number, LogUnit> => {
  const roster = new Map<number, LogUnit>();
  for (const unit of book.start.units) {
    roster.set(unit.id, unitOf(unit));
  }
  for (const event of book.events) {
    if (event._tag === "UnitSummoned" || event._tag === "TokenSummoned") {
      const { unit } = event;
      roster.set(unit.id, {
        id: unit.id,
        owner: unit.owner,
        source:
          unit.source._tag === "Card"
            ? { _tag: "Card", cardId: unit.source.card.cardId }
            : { _tag: "Token", tokenId: unit.source.tokenId },
        rank: unitRank(unit.source),
      });
    }
  }
  return roster;
};

/** The Translation Key of the name of a Unit. */
export const logUnitName = (unit: LogUnit): TextRef =>
  unit.source._tag === "Card"
    ? { key: `cards.${unit.source.cardId}.name` }
    : { key: tokenNameKey(unit.source.tokenId) };

/** The Field Effects of the Battle by id, with the Skill Card that made them. */
const fieldCards = (
  events: readonly BattleEvent[]
): ReadonlyMap<number, { readonly cardId: string; readonly rank: RankId }> => {
  const fields = new Map<
    number,
    { readonly cardId: string; readonly rank: RankId }
  >();
  for (const event of events) {
    if (event._tag === "FieldEffectPlaced") {
      fields.set(event.field.id, {
        cardId: event.field.card.cardId,
        rank: event.field.card.rank,
      });
    }
  }
  return fields;
};

/** What the line builders read: the Units, the Field Effects and the view before the event. */
interface LineContext {
  readonly roster: ReadonlyMap<number, LogUnit>;
  readonly fields: ReadonlyMap<
    number,
    { readonly cardId: string; readonly rank: RankId }
  >;
  readonly view: BattleView;
}

const isValueKeyword = (
  keyword: Keyword
): keyword is (typeof VALUE_KEYWORDS)[number] =>
  VALUE_KEYWORDS.some((name) => name === keyword);

/**
 * The name of a Keyword with its value. The event gives the value of a value
 * Keyword; else it comes from the card of the Unit. Summon names its Token.
 * The Battle Log and the Keyword Plate in Live use it.
 */
export const keywordName = (
  keyword: Keyword,
  value: number | undefined,
  unit: Pick<LogUnit, "source" | "rank"> | undefined
): TextRef => {
  const card =
    unit?.source._tag === "Card" ? getCard(unit.source.cardId) : undefined;
  const keywords = card?.kind === "creature" ? card.keywords : undefined;
  if (keyword === "summon") {
    const token = keywords?.summon;
    return {
      key: "keywords.summon",
      args: {
        token: token
          ? { key: tokenNameKey(token) }
          : { key: "battleLog.token" },
      },
    };
  }
  const known =
    value ??
    (unit && keywords && isValueKeyword(keyword)
      ? keywordValue(keywords[keyword], unit.rank)
      : undefined);
  return known === undefined
    ? { key: `keywords.${keyword}` }
    : { key: `keywords.${keyword}`, args: { value: known } };
};

/** The count of each Status with a count, as the Unit has it after the event. */
const STATUS_COUNT: Partial<Record<Status, (unit: UnitView) => number>> = {
  poison: (unit) => unit.poisoned,
  hobble: (unit) => unit.hobbled,
  bleed: (unit) => unit.bleeding,
  grounded: (unit) => unit.grounded,
  ward: (unit) => unit.ward,
  exposed: (unit) => unit.exposed,
};

/** The name of a Status with its count, for example "Poison 2". */
const statusName = (
  event: Extract<BattleEvent, { readonly _tag: "StatusApplied" }>,
  view: BattleView
): TextRef => {
  const { name } = STATUS_TEXT[event.status];
  const count = STATUS_COUNT[event.status];
  if (!count) {
    return { key: name };
  }
  const unit = applyEvent(view, event).units.find(
    (candidate) => candidate.id === event.unitId
  );
  return {
    key: name,
    args: { value: event.count ?? (unit ? count(unit) : 0) },
  };
};

const unitArg = (context: LineContext, unitId: number): LogArg => {
  const unit = context.roster.get(unitId);
  return unit
    ? { _tag: "Unit", unit }
    : { _tag: "Text", ref: { key: "battleLog.unknownUnit" } };
};

const targetArg = (context: LineContext, target: TargetRef): LogArg =>
  target._tag === "Hero"
    ? { _tag: "Hero", side: target.side, hero: target.hero }
    : unitArg(context, target.unitId);

const damageFlags = (
  event: Extract<BattleEvent, { readonly _tag: "DamageDealt" }>
): LogFlag[] => [
  ...(event.crit ? [{ _tag: "Crit" } as const] : []),
  ...(event.blocked ? [{ _tag: "Block" } as const] : []),
  ...(event.absorbed > 0
    ? [{ _tag: "Ward", absorbed: event.absorbed } as const]
    : []),
  ...(event.trueDamage ? [{ _tag: "TrueDamage" } as const] : []),
];

/**
 * A card in a Hand. The Player sees the cards of their own Hand, so the line
 * names the card. An enemy Hand card is hidden: the line names only its Hero.
 */
const handCardLine = (
  context: LineContext,
  side: Side,
  hero: number,
  instanceId: number,
  countdown: number
): LogLine => {
  const card = context.view.sides[side].heroes[hero]?.hand.find(
    (candidate) => candidate.instanceId === instanceId
  );
  return side === "player" && card?.cardId && card.rank
    ? line("countdownYours", {
        card: { _tag: "Card", cardId: card.cardId, rank: card.rank },
        countdown,
      })
    : line("countdownHidden", {
        hero: { _tag: "Hero", side, hero },
        countdown,
      });
};

const cardLine = (
  event: Extract<
    BattleEvent,
    {
      readonly _tag:
        | "CardDrawn"
        | "CountdownsTicked"
        | "RecallRolled"
        | "CardSabotaged"
        | "CountdownChanged";
    }
  >,
  context: LineContext
): LogLine => {
  switch (event._tag) {
    case "CardDrawn": {
      // The card of an enemy draw is hidden (GDD 4.12).
      return event.side === "player"
        ? line("drawYou", {
            card: {
              _tag: "Card",
              cardId: event.card.cardId,
              rank: event.card.rank,
            },
          })
        : line("drawEnemy", {
            hero: { _tag: "Hero", side: event.side, hero: event.hero },
          });
    }
    case "CountdownsTicked": {
      return event.side === "player"
        ? line("countdownsYou")
        : line("countdownsEnemy", {
            hero: { _tag: "Hero", side: event.side, hero: event.hero },
          });
    }
    case "RecallRolled": {
      const card: LogArg = {
        _tag: "Card",
        cardId: event.card.cardId,
        rank: event.card.rank,
      };
      return line(event.success ? "recalled" : "toGraveyard", { card });
    }
    case "CardSabotaged":
    case "CountdownChanged": {
      return handCardLine(
        context,
        event.side,
        event.hero,
        event.instanceId,
        event.countdown
      );
    }
    default: {
      return event satisfies never;
    }
  }
};

const unitLine = (event: BattleEvent, context: LineContext): LogLine | null => {
  switch (event._tag) {
    case "UnitSummoned":
    case "TokenSummoned": {
      return line("summon", {
        unit: unitArg(context, event.unit.id),
        square: square(event.unit.lane, event.unit.position),
      });
    }
    case "UnitMoved": {
      return line("move", {
        unit: unitArg(context, event.unitId),
        from: event.from + 1,
        to: event.to + 1,
      });
    }
    case "UnitPushed": {
      return line("push", {
        unit: unitArg(context, event.unitId),
        from: event.from + 1,
        to: event.to + 1,
      });
    }
    case "UnitSkipped": {
      return line("skip", { unit: unitArg(context, event.unitId) });
    }
    case "AttackSkipped": {
      return line("noAttack", { unit: unitArg(context, event.unitId) });
    }
    case "UnitAttacked": {
      return line("attack", {
        unit: unitArg(context, event.unitId),
        target: targetArg(context, event.target),
      });
    }
    case "DamageDealt": {
      return line(
        "damage",
        {
          target: targetArg(context, event.target),
          amount: event.amount,
          damageType: { _tag: "Damage", damageType: event.damageType },
        },
        damageFlags(event)
      );
    }
    case "UnitHealed": {
      return line("heal", {
        unit: unitArg(context, event.unitId),
        amount: event.amount,
      });
    }
    case "UnitsRallied": {
      return line("rallied", {
        unit: unitArg(context, event.unitId),
        count: event.targets.length,
      });
    }
    case "UnitDied": {
      return line("died", { unit: unitArg(context, event.unitId) });
    }
    case "UnitReborn": {
      return line("reborn", {
        unit: unitArg(context, event.unitId),
        hp: event.hp,
      });
    }
    default: {
      return null;
    }
  }
};

const heroArg = (ref: HeroRef): LogArg => ({
  _tag: "Hero",
  side: ref.side,
  hero: ref.hero,
});

/** "Lane 2" or "Lanes 1, 2", from Lane indexes. */
const lanesArg = (lanes: readonly number[]): LogArg => ({
  _tag: "Text",
  ref:
    lanes.length === 1
      ? { key: "battleLog.laneOne", args: { lane: (lanes[0] ?? 0) + 1 } }
      : {
          key: "battleLog.laneList",
          args: { lanes: lanes.map((lane) => lane + 1).join(", ") },
        },
});

/** The lines of a Defeated Hero, its Front, and a Boss Rule (ADR-0009, ADR-0040). */
const heroLine = (
  event: Extract<
    BattleEvent,
    { readonly _tag: "HeroDefeated" | "FrontMoved" | "BossRuleActivated" }
  >
): LogLine => {
  switch (event._tag) {
    case "HeroDefeated": {
      return line("heroDefeated", { hero: heroArg(event.hero) });
    }
    case "FrontMoved": {
      return line("frontMoved", {
        from: heroArg(event.from),
        to: heroArg(event.to),
        lanes: lanesArg(event.lanes),
      });
    }
    case "BossRuleActivated": {
      return line("bossRule", {
        hero: heroArg(event.hero),
        threshold: event.threshold,
      });
    }
    default: {
      return event satisfies never;
    }
  }
};

const effectLine = (
  event: BattleEvent,
  context: LineContext
): LogLine | null => {
  switch (event._tag) {
    case "KeywordActivated": {
      return line("keyword", {
        unit: unitArg(context, event.unitId),
        keyword: {
          _tag: "Keyword",
          keyword: event.keyword,
          name: keywordName(
            event.keyword,
            event.value,
            context.roster.get(event.unitId)
          ),
        },
      });
    }
    case "StatusApplied": {
      return line("status", {
        unit: unitArg(context, event.unitId),
        status: {
          _tag: "Status",
          status: event.status,
          name: statusName(event, context.view),
        },
      });
    }
    case "SteadfastHeld": {
      return line("steadfast", { unit: unitArg(context, event.unitId) });
    }
    case "DebuffsRemoved": {
      return line("cleansed", { unit: unitArg(context, event.unitId) });
    }
    case "BulwarkGained": {
      return line("bulwark", {
        unit: unitArg(context, event.unitId),
        value: event.bulwark,
      });
    }
    case "AttackGained": {
      return line("attackBonus", {
        unit: unitArg(context, event.unitId),
        value: event.attack,
      });
    }
    case "RangeGained": {
      return line("rangeBonus", {
        unit: unitArg(context, event.unitId),
        value: event.range,
      });
    }
    case "FieldEffectPlaced": {
      return line("fieldPlaced", {
        card: {
          _tag: "Card",
          cardId: event.field.card.cardId,
          rank: event.field.card.rank,
        },
        turns: event.field.turns,
      });
    }
    case "FieldEffectStruck": {
      const card = context.fields.get(event.fieldId);
      return card
        ? line("fieldStruck", {
            card: { _tag: "Card", ...card },
            turns: event.turns,
          })
        : null;
    }
    case "LaneOpened": {
      return line("laneOpened", { lane: event.lane + 1 });
    }
    case "HeroDefeated":
    case "FrontMoved":
    case "BossRuleActivated": {
      return heroLine(event);
    }
    case "BattleEnded": {
      return line(event.result.winner === "player" ? "won" : "lost");
    }
    default: {
      return null;
    }
  }
};

/** The line of one event, or `null` for an event that shows nothing by itself. */
const eventLine = (
  event: BattleEvent,
  context: LineContext
): LogLine | null => {
  switch (event._tag) {
    case "CardDrawn":
    case "CountdownsTicked":
    case "RecallRolled":
    case "CardSabotaged":
    case "CountdownChanged": {
      return cardLine(event, context);
    }
    default: {
      return unitLine(event, context) ?? effectLine(event, context);
    }
  }
};

/** The target line of a card play: the Square, the Lane or the Hero. */
const targetLine = (
  event: Extract<BattleEvent, { readonly _tag: "CardPlayed" }>
): LogLine | null => {
  const { target } = event;
  switch (target._tag) {
    case "Square": {
      return line("target", { target: square(target.lane, target.position) });
    }
    case "Lane": {
      return line("targetLane", { lane: target.lane + 1 });
    }
    case "Hero": {
      return line("target", {
        target: { _tag: "Hero", side: target.side, hero: target.hero },
      });
    }
    default: {
      return null;
    }
  }
};
/** The summary of a Log Entry, and the index of the event whose line it repeats. */
interface Summary {
  readonly summary: LogLine;
  readonly used: number | null;
}

/**
 * The events that give the summary of each kind of Log Entry, in order of
 * choice: for a Unit Action, its attack, else its move, else its skip.
 */
const SUMMARY_EVENTS: Readonly<
  Record<
    Exclude<LogEntryKind, "card" | "burn" | "poison" | "suddenDeath">,
    readonly ReadonlySet<BattleEvent["_tag"]>[]
  >
> = {
  action: [
    new Set(["UnitAttacked"]),
    new Set(["UnitMoved"]),
    new Set(["UnitSkipped", "AttackSkipped"]),
  ],
  cards: [new Set(["CardDrawn"]), new Set(["CountdownsTicked"])],
  regenerate: [new Set(["KeywordActivated"]), new Set(["UnitHealed"])],
  rally: [new Set(["KeywordActivated"]), new Set(["UnitsRallied"])],
  lanes: [new Set(["LaneOpened"])],
  field: [new Set(["FieldEffectStruck"])],
};

/** "You play Fireball." or "Grukk plays Fireball.". */
const playSummary = (events: readonly BattleEvent[]): LogLine | null => {
  const played = events.find((event) => event._tag === "CardPlayed");
  if (played?._tag !== "CardPlayed") {
    return null;
  }
  const card: LogArg = {
    _tag: "Card",
    cardId: played.card.cardId,
    rank: played.card.rank,
  };
  return played.side === "player"
    ? line("playYou", { card })
    : line("playEnemy", {
        hero: { _tag: "Hero", side: played.side, hero: played.hero.hero },
        card,
      });
};

/** "Burn hits Bone Archer." for one Unit, or "Burn hits 3 Units.". */
const hitsSummary = (
  kind: "burn" | "poison",
  events: readonly BattleEvent[],
  context: LineContext
): LogLine => {
  const units = new Set(
    events.flatMap((event) =>
      event._tag === "DamageDealt" && event.target._tag === "Unit"
        ? [event.target.unitId]
        : []
    )
  );
  const [only] = units;
  return units.size === 1 && only !== undefined
    ? line(`${kind}One`, { unit: unitArg(context, only) })
    : line(`${kind}Many`, { count: units.size });
};

/** The summary of a Log Entry from its lines. */
const summaryOf = (
  entry: LogEntry,
  events: readonly BattleEvent[],
  lines: readonly (LogLine | null)[],
  context: LineContext
): Summary => {
  switch (entry.kind) {
    case "card": {
      const summary = playSummary(events);
      if (summary) {
        return { summary, used: null };
      }
      break;
    }
    case "burn":
    case "poison": {
      return { summary: hitsSummary(entry.kind, events, context), used: null };
    }
    case "suddenDeath": {
      return { summary: line("suddenDeath"), used: null };
    }
    default: {
      for (const tags of SUMMARY_EVENTS[entry.kind]) {
        const index = events.findIndex((event) => tags.has(event._tag));
        const found = lines[index];
        if (found) {
          return { summary: found, used: index };
        }
      }
    }
  }
  const index = lines.findIndex(Boolean);
  const fallback = lines[index];
  return fallback
    ? { summary: fallback, used: index }
    : { summary: line("nothing"), used: null };
};

/**
 * The text of one Log Entry (GDD 11.2): its summary, and one line for each of
 * its results. It names the Hero, the card, the Units, the Squares, the
 * damage and each Keyword and Status. It shows only what the Player saw: the
 * card of an enemy draw is never in it.
 */
export const entryText = (
  book: BattleLogBook,
  entry: LogEntry,
  roster: ReadonlyMap<number, LogUnit> = logRoster(book)
): LogEntryText => {
  const events = book.events.slice(entry.start, entry.end);
  const fields = fieldCards(book.events.slice(0, entry.end));
  // The view before each event: a Hand card line reads the Hand at that moment.
  let view = book.views[entry.index - 1] ?? book.start;
  const lines: (LogLine | null)[] = [];
  for (const event of events) {
    lines.push(eventLine(event, { roster, fields, view }));
    view = applyEvent(view, event);
  }
  const { summary, used } = summaryOf(entry, events, lines, {
    roster,
    fields,
    view,
  });
  const played = events.find((event) => event._tag === "CardPlayed");
  const target = played?._tag === "CardPlayed" ? targetLine(played) : null;
  const results = lines.flatMap((result, index) =>
    result && index !== used ? [result] : []
  );
  return {
    summary,
    lines: target ? [target, ...results] : results,
    damage: events.reduce(
      (total, event) =>
        event._tag === "DamageDealt" ? total + event.amount : total,
      0
    ),
    deaths: entry.fallen.length,
  };
};
