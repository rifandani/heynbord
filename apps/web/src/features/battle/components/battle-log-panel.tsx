import { useMediaQuery } from "@reactuses/core";
import type { RankId, Side } from "@workspace/rules";
import { getCard } from "@workspace/rules";
import { cn } from "cn";
import { Predicate } from "effect";
import type { ReactNode } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react-aria-components";
import { Button, ToggleButton } from "react-aria-components";

import type {
  BattleLogBook,
  LogEntry,
  LogTurn,
} from "@/features/battle/battle-log";
import { turnOfEntry } from "@/features/battle/battle-log";
import type { BattleLogState } from "@/features/battle/battle-log-session";
import { canPlayLog } from "@/features/battle/battle-log-session";
import type {
  LogArg,
  LogEntryText,
  LogFlag,
  LogLine,
  LogUnit,
} from "@/features/battle/battle-log-text";
import {
  entryText,
  logRoster,
  logUnitName,
} from "@/features/battle/battle-log-text";
import type { UnitView } from "@/features/battle/battle-view";
import {
  CardDetails,
  TokenDetails,
} from "@/features/battle/components/card-details";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { cardGlyph, DAMAGE_GLYPH } from "@/features/battle/glyphs";
import { SIDE_COLORS } from "@/features/battle/palette";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import type { EntryId } from "@/features/handbook/handbook";
import {
  damageEntryId,
  keywordEntryId,
  statusEntryId,
} from "@/features/handbook/handbook";
import { useHandbook } from "@/features/handbook/use-handbook";

type Battle = ReturnType<typeof useBattle>;

/** A phone in landscape, or a narrow window: the Battle Log is a sheet over the bottom of the Board. */
const SHEET_SCREEN = "(max-height: 500px), (max-width: 760px)";

/** The Card Details that a Unit or a card name opens. A Unit on the Board shows its values at that moment. */
type LogDetails =
  | {
      readonly _tag: "Unit";
      readonly unit: LogUnit;
      readonly view: UnitView | undefined;
    }
  | { readonly _tag: "Card"; readonly cardId: string; readonly rank: RankId };

interface LinkActions {
  readonly openDetails: (details: LogDetails) => void;
  readonly openEntry: (entry: EntryId) => void;
  readonly unitView: (unitId: number) => UnitView | undefined;
}

/** The texts of all Log Entries of the Battle Log, one time for each Battle Log. */
const useEntryTexts = (book: BattleLogBook): readonly LogEntryText[] =>
  useMemo(() => {
    const roster = logRoster(book);
    return book.entries.map((entry) => entryText(book, entry, roster));
  }, [book]);

/** The name of a Hero: "Your Hero", or the enemy of the Stage. */
const useHeroName = (battle: Battle) => {
  const { tr } = useGameText();
  const stageId = battle.liveSession?.options.stageId ?? "";
  return (side: Side) =>
    side === "player"
      ? tr("battleLog.yourHero")
      : tr(`stages.${stageId}.enemy`);
};

const LINK =
  "pointer-events-auto cursor-pointer rounded-sm font-semibold text-[#2a1d12] underline decoration-[#5b3a1e]/45 underline-offset-2 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-[#5b3a1e]";

const TERM =
  "pointer-events-auto cursor-pointer rounded-sm font-bold text-[#b4521a] underline decoration-[#b4521a]/50 decoration-dotted underline-offset-2 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-solid";

/** One value of a line, as text or as a link. */
const ArgNode = ({
  arg,
  links,
  heroName,
}: {
  readonly arg: LogArg;
  readonly links: LinkActions | null;
  readonly heroName: (side: Side) => string;
}) => {
  const { text, tr } = useGameText();
  if (Predicate.isNumber(arg)) {
    return <span className="font-bold tabular-nums">{arg}</span>;
  }
  switch (arg._tag) {
    case "Text": {
      return <>{text(arg.ref)}</>;
    }
    case "Hero": {
      return <span className="font-semibold">{heroName(arg.side)}</span>;
    }
    case "Unit": {
      const name = text(logUnitName(arg.unit));
      // A Token is not a card: after its death, it has no Card Details.
      const linked =
        links !== null &&
        (arg.unit.source._tag === "Card" ||
          links.unitView(arg.unit.id) !== undefined);
      return links && linked ? (
        <Button
          className={LINK}
          onPress={() =>
            links.openDetails({
              _tag: "Unit",
              unit: arg.unit,
              view: links.unitView(arg.unit.id),
            })
          }
          data-testid="log-unit-link"
        >
          {name}
        </Button>
      ) : (
        <span className="font-semibold">{name}</span>
      );
    }
    case "Card": {
      const name = tr(`cards.${arg.cardId}.name`);
      return links ? (
        <Button
          className={cn(LINK, "italic")}
          onPress={() =>
            links.openDetails({
              _tag: "Card",
              cardId: arg.cardId,
              rank: arg.rank,
            })
          }
          data-testid="log-card-link"
        >
          {name}
        </Button>
      ) : (
        <span className="font-semibold italic">{name}</span>
      );
    }
    case "Keyword":
    case "Status": {
      const name = text(arg.name).trim();
      const entry =
        arg._tag === "Keyword"
          ? keywordEntryId(arg.keyword)
          : statusEntryId(arg.status);
      return links ? (
        <Button
          className={TERM}
          onPress={() => links.openEntry(entry)}
          data-entry={entry}
          data-testid="log-entry-link"
        >
          {name}
        </Button>
      ) : (
        <span className="font-bold text-[#b4521a]">{name}</span>
      );
    }
    case "Damage": {
      const name = tr(`damageTypes.${arg.damageType}`);
      const entry = damageEntryId(arg.damageType);
      const label = (
        <span className="inline-flex items-baseline gap-0.5">
          <GlyphIcon
            glyph={DAMAGE_GLYPH[arg.damageType]}
            className="size-3.5 self-center text-[#7a4c1a]"
          />
          {name}
        </span>
      );
      return links ? (
        <Button
          className={cn(TERM, "text-[#2a1d12] decoration-[#5b3a1e]/45")}
          onPress={() => links.openEntry(entry)}
          data-entry={entry}
          data-testid="log-entry-link"
        >
          {label}
        </Button>
      ) : (
        label
      );
    }
    default: {
      return arg satisfies never;
    }
  }
};

const FLAG_STYLE: Readonly<Record<LogFlag["_tag"], string>> = {
  Crit: "border-[#7a5310] bg-[#ffd75a] text-[#2a1a05]",
  Block: "border-[#c9b48c] bg-[#ead9b4] text-[#2a1d12]",
  Ward: "border-[#c9b48c] bg-[#ead9b4] text-[#2a1d12]",
  TrueDamage: "border-[#2a1d12] bg-[#2a1d12] text-[#fff6df]",
};

/** A roll result or a defense of one hit: Crit, Block, Ward, True Damage. */
const FlagChip = ({ flag }: { readonly flag: LogFlag }) => {
  const { tr } = useGameText();
  const label =
    flag._tag === "Ward"
      ? tr("battleLog.flags.ward", { amount: flag.absorbed })
      : tr(
          `battleLog.flags.${flag._tag === "TrueDamage" ? "trueDamage" : flag._tag.toLowerCase()}`
        );
  return (
    <span
      className={cn(
        "ml-1 inline-block rounded border px-1 align-[1px] text-xs leading-[1.35] font-bold whitespace-nowrap",
        FLAG_STYLE[flag._tag]
      )}
    >
      {label}
    </span>
  );
};

/** A marker that the translated text keeps, so that a link can go in its place. */
const marker = (index: number) => `\uE000${index}\uE001`;
const MARKERS = /\uE000(?<index>\d+)\uE001/u;

/**
 * A line of the Battle Log in the current Locale. The Translation Key holds
 * the word order; each Unit, card, Keyword, Status and Damage Type goes into
 * it as a link.
 */
const RichLine = ({
  line,
  links,
  heroName,
}: {
  readonly line: LogLine;
  readonly links: LinkActions | null;
  readonly heroName: (side: Side) => string;
}) => {
  const { tr } = useGameText();
  const nodes: ReactNode[] = [];
  const args: Record<string, string | number> = {};
  for (const [name, arg] of Object.entries(line.args)) {
    if (Predicate.isNumber(arg)) {
      args[name] = arg;
      continue;
    }
    args[name] = marker(nodes.length);
    nodes.push(
      <ArgNode key={name} arg={arg} links={links} heroName={heroName} />
    );
  }
  const parts = tr(line.key, args).split(MARKERS);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Fragment key={`arg-${part}`}>{nodes[Number(part)]}</Fragment>
        ) : (
          part
        )
      )}
      {line.flags.map((flag) => (
        <FlagChip key={flag._tag} flag={flag} />
      ))}
    </>
  );
};

/** The glyph of a Log Entry: what kind of moment it is. */
const entryGlyph = (book: BattleLogBook, entry: LogEntry): Glyph => {
  const events = book.events.slice(entry.start, entry.end);
  switch (entry.kind) {
    case "card": {
      const played = events.find((event) => event._tag === "CardPlayed");
      return played?._tag === "CardPlayed"
        ? cardGlyph(getCard(played.card.cardId))
        : "cards";
    }
    case "action": {
      return events.some((event) => event._tag === "UnitAttacked")
        ? "crossedSwords"
        : "speed";
    }
    case "cards": {
      return "cards";
    }
    case "lanes": {
      return "gate";
    }
    case "regenerate": {
      return "heart";
    }
    case "rally": {
      return "banner";
    }
    case "suddenDeath": {
      return "hourglass";
    }
    case "field": {
      return "range";
    }
    case "burn": {
      return "flame";
    }
    case "poison": {
      return "skull";
    }
    default: {
      return entry.kind satisfies never;
    }
  }
};

/** The Side of a Log Entry: the Side whose Turn it is. */
const entrySide = (book: BattleLogBook, entry: LogEntry): Side =>
  turnOfEntry(book, entry.index)?.side ?? "player";

/** The total damage and the deaths of an entry, as small marks after its summary. */
const EntryTotals = ({ text }: { readonly text: LogEntryText }) => {
  const { tr } = useGameText();
  if (text.damage === 0 && text.deaths === 0) {
    return null;
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5 pt-px text-xs font-black text-[#2a1d12] tabular-nums">
      {text.damage > 0 ? (
        <span
          className="inline-flex items-center gap-0.5"
          title={tr("battleLog.damage", { amount: text.damage })}
        >
          <GlyphIcon glyph="heart" className="size-3 text-[#c2302a]" />
          <span className="sr-only">
            {tr("battleLog.damage", { amount: text.damage })}
          </span>
          <span aria-hidden>−{text.damage}</span>
        </span>
      ) : null}
      {text.deaths > 0 ? (
        <span
          className="inline-flex items-center gap-0.5"
          title={tr("battleLog.deaths", { count: text.deaths })}
        >
          <GlyphIcon glyph="skull" className="size-3 text-[#5b4632]" />
          <span className="sr-only">
            {tr("battleLog.deaths", { count: text.deaths })}
          </span>
          <span aria-hidden>{text.deaths}</span>
        </span>
      ) : null}
    </span>
  );
};

/**
 * A key for each line from its text. Two lines with the same text (two equal
 * hits) get a count.
 */
const lineKeys = (lines: readonly LogLine[]) => {
  const seen = new Map<string, number>();
  return lines.map((line) => {
    const text = `${line.key}|${JSON.stringify(line.args)}`;
    const count = seen.get(text) ?? 0;
    seen.set(text, count + 1);
    return { line, key: `${text}|${count}` };
  });
};

const EntryRow = ({
  book,
  entry,
  text,
  selected,
  onSelect,
  onStep,
  links,
  heroName,
}: {
  readonly book: BattleLogBook;
  readonly entry: LogEntry;
  readonly text: LogEntryText;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly onStep: (step: 1 | -1) => void;
  readonly links: LinkActions;
  readonly heroName: (side: Side) => string;
}) => {
  const side = entrySide(book, entry);
  // React Aria stops each key at the button: only ↑/↓ stay here, and the
  // other keys go on to the Battle keys (←/→, Esc).
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onStep(event.key === "ArrowUp" ? -1 : 1);
      return;
    }
    event.continuePropagation();
  };
  return (
    <li
      className={cn(
        // The sticky Turn header must not cover the selected entry.
        "scroll-mt-16 scroll-mb-2 rounded-xl border-2 transition-colors duration-150",
        selected
          ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.25)]"
          : "border-transparent"
      )}
      data-testid="log-entry"
      data-entry={entry.index}
      data-kind={entry.kind}
      data-current={selected || undefined}
    >
      <Button
        onPress={onSelect}
        onKeyDown={onKeyDown}
        excludeFromTabOrder={!selected}
        aria-current={selected || undefined}
        // Only the selected entry takes the focus, so its brown border is the
        // focus ring.
        className="group flex w-full items-start gap-2 rounded-[10px] px-2 py-1.5 text-left outline-none data-[hovered]:bg-[#fff3d1]/70"
        data-testid="log-entry-button"
      >
        <span
          className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df]"
          style={{ borderColor: SIDE_COLORS[side].main }}
          aria-hidden
        >
          <GlyphIcon glyph={entryGlyph(book, entry)} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 text-[13px] leading-snug text-[#2a1d12]">
          <RichLine line={text.summary} links={null} heroName={heroName} />
        </span>
        <EntryTotals text={text} />
      </Button>
      {selected && text.lines.length > 0 ? (
        <ul
          className="mr-2 mb-2 ml-[2.4rem] space-y-1 border-t border-[#c9b48c] pt-1.5 text-xs leading-snug text-[#2a1d12] motion-safe:animate-[log-lines_180ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          data-testid="log-entry-lines"
        >
          {lineKeys(text.lines).map(({ line, key }) => (
            <li key={key}>
              <RichLine line={line} links={links} heroName={heroName} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
};

/** The Side chip of a Turn header, the same as the chip of the Turn badge. */
const SideChip = ({ side }: { readonly side: Side }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-sans text-xs leading-none font-semibold",
        side === "player"
          ? "bg-[#ffd75a] text-[#2a1a05]"
          : "bg-[#d9463b] text-white"
      )}
    >
      {side === "player" ? tr("battle.player") : tr("battle.enemy")}
    </span>
  );
};

/** "Turn 4 · Enemy", and the HP of each Hero at the end of that Turn. */
const TurnHeader = ({
  turn,
  enemyName,
}: {
  readonly turn: LogTurn;
  readonly enemyName: string;
}) => {
  const { tr } = useGameText();
  return (
    <div
      className="sticky top-0 z-10 -mx-1 mb-1 border-b border-[#c9b48c] bg-[#ead9b4] px-3 pt-2 pb-1.5"
      data-testid="log-turn"
    >
      <h3 className="font-display flex items-center gap-2 text-sm leading-tight font-bold text-[#2a1d12]">
        {tr("battleLog.turn", {
          number: turn.turnNumber,
          side:
            turn.side === "player" ? tr("battle.player") : tr("battle.enemy"),
        })
          .split(" · ")
          .at(0)}
        <SideChip side={turn.side} />
      </h3>
      <p className="mt-0.5 text-xs leading-tight text-[#5b4632] tabular-nums">
        {tr("battleLog.turnHp", {
          playerHp: turn.hp.player,
          enemy: enemyName,
          enemyHp: turn.hp.enemy,
        })}
      </p>
    </div>
  );
};

/** ◀, Play or Pause, and ▶: square wood buttons, because ghost buttons look grey on parchment. */
const Transport = ({
  battle,
  log,
}: {
  readonly battle: Battle;
  readonly log: BattleLogState;
}) => {
  const { tr } = useGameText();
  const empty = log.selected < 0;
  const square =
    "size-9 min-h-9 px-0 [@media(max-height:500px)]:size-8 [@media(max-height:500px)]:min-h-8";
  return (
    <div className="flex items-center gap-1" data-testid="log-transport">
      <GameButton
        intent="wood"
        size="sm"
        className={square}
        aria-label={tr("battleLog.previous")}
        isDisabled={empty || log.selected === 0}
        onPress={() => battle.stepLog(-1, false)}
        data-testid="log-previous"
      >
        <GlyphIcon glyph="step" className="size-3.5 -scale-x-100" />
      </GameButton>
      <GameButton
        intent="wood"
        size="sm"
        className={square}
        aria-label={log.playing ? tr("battleLog.pause") : tr("battleLog.play")}
        isDisabled={!log.playing && !canPlayLog(log)}
        onPress={() => battle.toggleLogPlay()}
        data-testid="log-play"
        data-playing={log.playing || undefined}
      >
        <GlyphIcon
          glyph={log.playing ? "pause" : "play"}
          className="size-3.5"
        />
      </GameButton>
      <GameButton
        intent="wood"
        size="sm"
        className={square}
        aria-label={tr("battleLog.next")}
        isDisabled={empty || log.selected >= log.book.entries.length - 1}
        onPress={() => battle.stepLog(1, false)}
        data-testid="log-next"
      >
        <GlyphIcon glyph="step" className="size-3.5" />
      </GameButton>
    </div>
  );
};

/** Back to Live: the one gold action of the Battle Log. */
const BackToLive = ({
  battle,
  compact,
}: {
  readonly battle: Battle;
  readonly compact: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <GameButton
      intent="gold"
      size="sm"
      onPress={() => battle.closeLog()}
      className={cn("font-display", compact ? "px-3" : "w-full")}
      data-testid="back-to-live"
    >
      {tr("battleLog.backToLive")}
      {compact ? null : (
        <kbd className="rounded border border-[#7a5310]/60 bg-[#fff3d1]/60 px-1 font-sans text-xs leading-4 font-bold">
          Esc
        </kbd>
      )}
    </GameButton>
  );
};

/** The Card Details of a name in the Battle Log. */
const DetailsCard = ({
  details,
  onEntry,
}: {
  readonly details: LogDetails;
  readonly onEntry: (entry: EntryId) => void;
}) => {
  if (details._tag === "Card") {
    return (
      <CardDetails
        cardId={details.cardId}
        rank={details.rank}
        panelSide="left"
        onEntry={onEntry}
      />
    );
  }
  const { unit, view } = details;
  return unit.source._tag === "Card" ? (
    <CardDetails
      cardId={unit.source.cardId}
      rank={unit.rank}
      unit={view}
      panelSide="left"
      onEntry={onEntry}
    />
  ) : view ? (
    <TokenDetails
      tokenId={unit.source.tokenId}
      unit={view}
      panelSide="left"
      onEntry={onEntry}
    />
  ) : null;
};

const sameDetails = (a: LogDetails | null, b: LogDetails): boolean => {
  if (!a || a._tag !== b._tag) {
    return false;
  }
  if (a._tag === "Unit" && b._tag === "Unit") {
    return a.unit.id === b.unit.id;
  }
  return a._tag === "Card" && b._tag === "Card" && a.cardId === b.cardId;
};

/** The Card Details of a link, until Esc, the same link, or another Log Entry closes them. */
const useLogDetails = (selected: number) => {
  const [details, setDetails] = useState<LogDetails | null>(null);
  const [shownFor, setShownFor] = useState(selected);
  if (shownFor !== selected) {
    setShownFor(selected);
    setDetails(null);
  }
  useEffect(() => {
    if (!details) {
      return;
    }
    // Esc closes the Card Details first, before Back to Live.
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setDetails(null);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [details]);
  return {
    details,
    toggle: (next: LogDetails) =>
      setDetails((current) => (sameDetails(current, next) ? null : next)),
    close: () => setDetails(null),
  };
};

/**
 * Scrolls only the list so that `row` is in view under the sticky Turn
 * header. `scrollIntoView` also scrolls the panel and the Battle screen, which
 * hide their overflow, and so moves them.
 */
/** The height of a sticky Turn header, and the gap under the last row (`scroll-mt-16`, `scroll-mb-2`). */
const STICKY_HEADER_PX = 64;
const ROW_GAP_PX = 8;

const scrollIntoList = (list: HTMLElement, row: HTMLElement) => {
  const box = list.getBoundingClientRect();
  const place = row.getBoundingClientRect();
  const top = place.top - STICKY_HEADER_PX;
  const bottom = place.bottom + ROW_GAP_PX;
  if (top < box.top) {
    list.scrollTop -= box.top - top;
  } else if (bottom > box.bottom) {
    list.scrollTop += Math.min(bottom - box.bottom, top - box.top);
  }
};

/**
 * The list of Log Entries under one header for each Turn of a Side. The
 * selected entry opens and shows each result. Only the selected entry is in
 * the Tab order; ↑/↓ on it go to the entry before or after.
 */
const EntryList = ({
  battle,
  log,
  links,
}: {
  readonly battle: Battle;
  readonly log: BattleLogState;
  readonly links: LinkActions;
}) => {
  const { tr } = useGameText();
  const texts = useEntryTexts(log.book);
  const heroName = useHeroName(battle);
  const list = useRef<HTMLDivElement>(null);
  const { book, selected } = log;

  // The selected entry stays in view, and keeps the focus when the list has it.
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>(
      `[data-entry="${selected}"]`
    );
    if (!row) {
      return;
    }
    if (list.current) {
      scrollIntoList(list.current, row);
    }
    if (list.current?.contains(document.activeElement)) {
      row
        .querySelector<HTMLElement>('[data-testid="log-entry-button"]')
        ?.focus();
    }
  }, [selected]);

  if (book.entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
        <GlyphIcon glyph="scroll" className="size-8 text-[#5b3a1e]/60" />
        <p className="max-w-[28ch] text-sm text-[#5b4632]">
          {tr("battleLog.empty")}
        </p>
      </div>
    );
  }
  return (
    <div
      ref={list}
      className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#b47f36_transparent] overflow-y-auto overscroll-contain px-1 pb-2"
      data-testid="log-entries"
    >
      {book.turns.map((turn) => (
        <section
          key={turn.index}
          aria-label={tr("battleLog.turn", {
            number: turn.turnNumber,
            side:
              turn.side === "player" ? tr("battle.player") : tr("battle.enemy"),
          })}
        >
          <TurnHeader turn={turn} enemyName={heroName("enemy")} />
          <ol className="space-y-0.5 px-1">
            {book.entries.slice(turn.first, turn.end).map((entry) => {
              const text = texts[entry.index];
              return text ? (
                <EntryRow
                  key={entry.index}
                  book={book}
                  entry={entry}
                  text={text}
                  selected={entry.index === selected}
                  onSelect={() => battle.selectLogEntry(entry.index)}
                  onStep={(step) => battle.stepLog(step, false)}
                  links={links}
                  heroName={heroName}
                />
              ) : null;
            })}
          </ol>
        </section>
      ))}
    </div>
  );
};

/** The summary of the selected Log Entry, for screen readers. */
const SelectedAnnouncement = ({ log }: { readonly log: BattleLogState }) => {
  const { tr } = useGameText();
  const texts = useEntryTexts(log.book);
  const { stageId } = log.shown.options;
  const text = texts[log.selected];
  const heroName = (side: Side) =>
    side === "player"
      ? tr("battleLog.yourHero")
      : tr(`stages.${stageId}.enemy`);
  return (
    <p className="sr-only" aria-live="polite" data-testid="log-announcement">
      {text ? (
        <RichLine line={text.summary} links={null} heroName={heroName} />
      ) : null}
    </p>
  );
};

const PANEL =
  "pointer-events-auto flex flex-col overflow-hidden rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.35),0_14px_32px_rgba(0,0,0,0.45)] selection:bg-[#ffe08a] motion-safe:animate-[log-panel_260ms_cubic-bezier(0.2,0.8,0.2,1)_both]";

/** The open Battle Log. Each opening starts with the Board folded away and no Card Details. */
const OpenBattleLog = ({
  battle,
  log,
}: {
  readonly battle: Battle;
  readonly log: BattleLogState;
}) => {
  const { tr } = useGameText();
  const handbook = useHandbook();
  const sheet = useMediaQuery(SHEET_SCREEN, false);
  const [boardShown, setBoardShown] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const logDetails = useLogDetails(log.selected);
  const handleEntry = handbook.openAt;

  // The Battle Log takes the focus when it opens, at the selected entry. Back
  // to Live gives it back to the Battle Log button of the Top Bar.
  useEffect(() => {
    const target =
      panel.current?.querySelector<HTMLElement>(
        '[data-current] [data-testid="log-entry-button"]'
      ) ??
      panel.current?.querySelector<HTMLElement>('[data-testid="back-to-live"]');
    target?.focus();
    return () => {
      document
        .querySelector<HTMLElement>('[data-testid="battle-log-button"]')
        ?.focus();
    };
  }, []);

  const links: LinkActions = {
    openDetails: logDetails.toggle,
    openEntry: handleEntry,
    unitView: (unitId) =>
      log.shown.view.units.find((unit) => unit.id === unitId),
  };
  const folded = sheet && boardShown;
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30",
        sheet
          ? "inset-x-0 bottom-[calc(max(0.5rem,env(safe-area-inset-bottom))+14.4*min(7px,(100vw-40px)/101)+0.75rem)] mx-auto w-[min(36rem,calc(100vw-1rem))] [@media(min-height:501px)]:bottom-[calc(max(0.5rem,env(safe-area-inset-bottom))+14.4*min(10px,(100vw-40px)/101)+0.75rem)]"
          : "top-[calc(max(0.5rem,env(safe-area-inset-top))+7.25rem)] right-[max(0.5rem,env(safe-area-inset-right))] bottom-[calc(max(0.5rem,env(safe-area-inset-bottom))+14.4*min(10px,(100vw-40px)/101)+1.25rem)] w-[min(24rem,38vw)]"
      )}
      data-testid="battle-log-dock"
    >
      <aside
        ref={panel}
        aria-label={tr("battleLog.title")}
        className={cn(PANEL, !sheet && "h-full")}
        data-testid="battle-log"
        data-form={sheet ? "sheet" : "side"}
        data-folded={folded || undefined}
      >
        <header className="flex shrink-0 items-center gap-2 border-b-2 border-[#c9b48c] px-3 py-2 [@media(max-height:500px)]:py-1.5">
          <GlyphIcon
            glyph="scroll"
            className="size-5 shrink-0 text-[#5b3a1e]"
          />
          <h2 className="font-display min-w-0 flex-1 truncate text-lg leading-tight font-bold [@media(max-height:500px)]:text-base">
            {tr("battleLog.title")}
          </h2>
          <Transport battle={battle} log={log} />
          {sheet ? (
            <>
              <ToggleButton
                isSelected={boardShown}
                onChange={setBoardShown}
                className="min-h-8 rounded-lg border-2 border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] px-2 text-xs font-semibold whitespace-nowrap text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[pressed]:translate-y-px"
                data-testid="log-show-board"
              >
                {boardShown
                  ? tr("battleLog.showLog")
                  : tr("battleLog.showBoard")}
              </ToggleButton>
              <BackToLive battle={battle} compact />
            </>
          ) : null}
        </header>
        {folded ? null : (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              sheet && "max-h-[min(calc(100svh-18rem),15rem)]"
            )}
          >
            <EntryList battle={battle} log={log} links={links} />
          </div>
        )}
        {sheet ? null : (
          <footer className="shrink-0 border-t-2 border-[#c9b48c] bg-[#ead9b4] p-2">
            <BackToLive battle={battle} compact={false} />
          </footer>
        )}
        <SelectedAnnouncement log={log} />
      </aside>
      {logDetails.details ? (
        <div
          className={cn(
            "fade-in zoom-in-95 animate-in pointer-events-none absolute z-40 duration-150 motion-reduce:animate-none",
            sheet
              ? "bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 text-[length:8px]"
              : "top-1/2 right-[calc(100%+0.75rem)] -translate-y-1/2"
          )}
          data-testid="log-details"
        >
          <DetailsCard details={logDetails.details} onEntry={handleEntry} />
        </div>
      ) : null}
    </div>
  );
};

/**
 * The Battle Log panel (GDD 11.2): a parchment record in a wood frame at the
 * right side of the Board, between the Top Bar and the Hand Bar, so that the
 * Heroes and the Hand Bar show the selected moment. On a phone in landscape
 * or a narrow window, it is a sheet over the bottom of the Board, and "Show
 * Board" folds it to its strip of controls.
 */
export const BattleLogPanel = ({ battle }: { readonly battle: Battle }) =>
  battle.log ? <OpenBattleLog battle={battle} log={battle.log} /> : null;

/**
 * "Turn 4 · Enemy · Battle Log": a parchment ribbon under the Turn badge, so
 * that the Player never takes a past moment for Live.
 */
export const BattleLogBanner = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const { log } = battle;
  if (!log) {
    return null;
  }
  const turn = turnOfEntry(log.book, log.selected);
  const number = turn?.turnNumber ?? log.shown.view.turnNumber;
  const side = turn?.side ?? log.shown.view.activeSide;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[calc(max(0.5rem,env(safe-area-inset-top))+5.25rem)] z-20 flex justify-center [@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+4.5rem)]"
      data-testid="battle-log-banner"
    >
      <p className="font-display flex items-center gap-2 rounded-lg border-2 border-[#5b3a1e] bg-[#f6ead0] px-3 py-1 text-sm leading-tight font-bold text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.35)] motion-safe:animate-[log-banner_320ms_cubic-bezier(0.2,0.8,0.2,1)_both] [@media(max-height:500px)]:text-xs">
        <GlyphIcon
          glyph={log.playing ? "play" : "scroll"}
          className="size-3.5 text-[#5b3a1e]"
        />
        {tr("battleLog.banner", {
          number,
          side: side === "player" ? tr("battle.player") : tr("battle.enemy"),
        })}
      </p>
    </div>
  );
};
