import type {
  ClassId,
  DeckInput,
  DeckProblem,
  DeckSlot,
} from "@workspace/rules";
import {
  countdownLimit,
  DECK_NAME_MAX,
  deckCountdown,
  deckSizeLimits,
  getCard,
} from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Label,
  Radio,
  RadioGroup,
  TextField,
} from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import type { TextRef } from "@/features/battle/card-text";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek } from "@/features/deck/components/use-card-peek";
import { useDeckFlip } from "@/features/deck/components/use-deck-flip";
import type { DeckRow } from "@/features/deck/deck";
import {
  CLASSES_WITH_CARDS,
  deckKey,
  deckRows,
  problemText,
} from "@/features/deck/deck";
import {
  cssVars,
  DECK_CSS,
  DECK_METER_FILL,
  DECK_PROBLEM_MARK,
} from "@/features/deck/tokens";
import { useCountTo } from "@/features/workshop/use-count-to";

type PeekBind = (target: Peek) => object;

/** The Card Details of a card, when they show; they come right after the card. */
type PeekAt = (target: Peek) => ReactNode;

const classOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "text-ink flex h-9 cursor-pointer items-center gap-2 rounded-lg border-2 pr-3 pl-1 text-sm font-bold transition-[transform,box-shadow] duration-100 outline-none select-none",
    "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4 data-[hovered]:-translate-y-px motion-reduce:data-[hovered]:translate-y-0",
    "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:pr-2 [@media(max-height:500px)]:text-xs",
    isSelected
      ? "border-gold-deep bg-parchment-lit shadow-selected"
      : "border-ink-faded bg-parchment"
  );

/** The name of the Deck: it reads as the page title, and the Player can change it. */
const DeckName = ({
  slot,
  fallback,
  onRename,
}: {
  readonly slot: DeckSlot;
  readonly fallback: string;
  readonly onRename: (name: string) => void;
}) => {
  const { tr } = useGameText();
  return (
    <TextField
      value={slot.name}
      onChange={onRename}
      maxLength={DECK_NAME_MAX}
      className="min-w-0 flex-1"
    >
      <Label className="sr-only">{tr("deckBuilder.nameLabel")}</Label>
      <Input
        placeholder={fallback}
        spellCheck={false}
        className={cn(
          "font-display text-ink placeholder:text-ink w-full truncate rounded-md border-b border-dashed border-transparent bg-transparent px-1 py-0.5 text-2xl font-black outline-none",
          "data-[focused]:border-gold data-[focused]:bg-parchment-lit data-[hovered]:border-parchment-rule data-[focused]:border-solid",
          "[@media(max-height:500px)]:text-base"
        )}
        data-testid="deck-name"
      />
    </TextField>
  );
};

/**
 * The Hero Class of the slot (GDD 5.5). The Deck builder is the only place
 * that sets it: the Class stays on the Deck Slot (ADR-0032).
 */
const ClassChoice = ({
  classId,
  onChange,
}: {
  readonly classId: ClassId;
  readonly onChange: (classId: ClassId) => void;
}) => {
  const { tr } = useGameText();
  return (
    <RadioGroup
      value={classId}
      onChange={(value) => {
        const next = CLASSES_WITH_CARDS.find((id) => id === value);
        if (next) {
          onChange(next);
        }
      }}
      orientation="horizontal"
      className="flex items-center gap-2"
    >
      <Label className="text-ink-soft mr-1 text-xs font-bold [@media(max-height:500px)]:sr-only">
        {tr("deckBuilder.heroClass")}
      </Label>
      {CLASSES_WITH_CARDS.map((id) => (
        <Radio
          key={id}
          value={id}
          className={classOption}
          data-testid={`deck-class-${id}`}
        >
          <span
            className="bg-frame-wood text-cream grid size-7 place-items-center rounded-md [@media(max-height:500px)]:size-5"
            aria-hidden
          >
            <GlyphIcon
              glyph={classGlyph(id)}
              className="size-[18px] [@media(max-height:500px)]:size-3.5"
            />
          </span>
          <span className="[@media(max-height:500px)]:sr-only">
            {tr(`classes.${id}`)}
          </span>
        </Radio>
      ))}
    </RadioGroup>
  );
};

/**
 * How long the last copy of a card takes to leave the grid. It is the time of
 * `deck-card-lift`, so the other cards close the gap as it goes.
 */
const REMOVE_MS = 160;

/**
 * The Night Plate under a Deck card: the copies in the Deck, as on the
 * copies chip of the card pool. Under the pointer or the focus, it shows the
 * minus glyph that the press does, so the count and the action never need
 * two controls.
 */
const copiesPlate = cn(
  "border-gold-trim/70 bg-night-plate/90 text-cream relative flex h-6 max-w-full min-w-[3.75rem] items-center justify-center rounded-lg border-2 px-2 text-xs leading-none font-black tabular-nums shadow-(--copy-plate)",
  "transition-[border-color,background-color] duration-100",
  "group-data-[hovered]:border-wood-edge group-data-[hovered]:from-wood-light group-data-[hovered]:to-wood group-data-[hovered]:bg-gradient-to-b group-data-[hovered]:shadow-(--copy-plate-lift)",
  "group-data-[focus-visible]:border-wood-edge group-data-[focus-visible]:from-wood-light group-data-[focus-visible]:to-wood group-data-[focus-visible]:bg-gradient-to-b group-data-[focus-visible]:shadow-(--copy-plate-lift)",
  "[@media(max-height:500px)]:h-5 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px]"
);

/**
 * One card of the Deck grid: the card and its copies. A press removes one
 * copy; the last copy lifts off the page and is gone. A press that stays down
 * on a touch device shows the Card Details instead, as on the card pool. A
 * card that just came into the Deck lands on the page, and its copies plate
 * ticks to the new count.
 */
const DeckCard = ({
  row,
  landDelay,
  onRemove,
  bind,
  wasLongPress,
  peekAt,
}: {
  readonly row: DeckRow;
  /** The wait before the card lands, when it just came into the Deck. */
  readonly landDelay: number | undefined;
  readonly onRemove: (row: DeckRow) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
  readonly peekAt: PeekAt;
}) => {
  const { tr } = useGameText();
  const still = useReducedMotion();
  const card = getCard(row.cardId);
  const name = tr(`cards.${row.cardId}.name`);
  const rank = tr(`ranks.${row.rank}`);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );
  const remove = () => {
    if (leaving) {
      return;
    }
    if (still || row.count > 1) {
      onRemove(row);
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(() => onRemove(row), REMOVE_MS);
  };

  return (
    <li
      className={cn("flex justify-center", leaving && "pointer-events-none")}
      data-testid={`deck-row-${row.cardId}-${row.rank}`}
      data-deck-place={deckKey(row)}
      data-leaving={leaving || undefined}
    >
      <Button
        {...bind({ cardId: row.cardId, rank: row.rank, from: "deck" })}
        onPress={() => {
          if (!wasLongPress()) {
            remove();
          }
        }}
        aria-label={tr("deckBuilder.remove", {
          name,
          rank,
          count: row.count,
        })}
        className={cn(
          "group data-[focus-visible]:ring-focus-cream flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4",
          landDelay !== undefined &&
            !leaving &&
            "motion-safe:animate-[deck-card-land_360ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
          leaving &&
            "motion-safe:animate-[deck-card-lift_160ms_cubic-bezier(0.4,0,1,1)_both]"
        )}
        style={
          landDelay === undefined || leaving
            ? undefined
            : { animationDelay: `${landDelay}ms` }
        }
        data-testid={`deck-remove-${row.cardId}-${row.rank}`}
      >
        <CardFrame
          cardId={row.cardId}
          rank={row.rank}
          countdown={card.countdown}
          className="transition-transform duration-150 ease-out group-data-[hovered]:-translate-y-1.5 group-data-[pressed]:translate-y-0 motion-reduce:transition-none"
        />
        <span
          className={copiesPlate}
          style={cssVars({
            "--copy-plate": DECK_CSS.copyPlate,
            "--copy-plate-lift": DECK_CSS.copyPlateLift,
          })}
          aria-hidden
        >
          <span className="block overflow-hidden">
            <span
              key={row.count}
              className={cn(
                "block transition-opacity duration-100 motion-safe:animate-[deck-count-tick_180ms_cubic-bezier(0.2,0.8,0.2,1)]",
                "group-data-[focus-visible]:opacity-0 group-data-[hovered]:opacity-0"
              )}
            >
              ×{row.count}
            </span>
          </span>
          <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-100 group-data-[focus-visible]:opacity-100 group-data-[hovered]:opacity-100">
            {tr("deckBuilder.removeAction")}
          </span>
        </span>
      </Button>
      {peekAt({ cardId: row.cardId, rank: row.rank, from: "deck" })}
    </li>
  );
};

/**
 * The Deck grid with no cards: it keeps the place of the cards, so that the
 * footer and the card pool stay where they are.
 */
const EmptyDeck = () => {
  const { tr } = useGameText();
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <p className="border-parchment-rule text-ink-soft max-w-[32ch] rounded-xl border-2 border-dashed px-4 py-3 text-center text-sm text-balance [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:text-xs">
        {tr("deckBuilder.empty")}
      </p>
    </div>
  );
};

const meterValue =
  "text-base font-black whitespace-nowrap text-ink tabular-nums [@media(max-height:500px)]:text-xs";

/** The time of a meter: the number counts and the groove fills in step. */
const METER_MS = 260;

const GOLD_FILL = DECK_METER_FILL.gold;

/** The groove of a meter, filled to `share` (0 to 1). */
const MeterGroove = ({
  share,
  fill,
  children,
}: {
  readonly share: number;
  readonly fill: CSSProperties;
  readonly children?: ReactNode;
}) => (
  <span
    className="bg-frame-wood relative h-2.5 min-w-0 flex-1 rounded-full [@media(max-height:500px)]:h-2"
    style={{ boxShadow: DECK_CSS.meterGroove }}
    aria-hidden
  >
    <span
      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[260ms] ease-out motion-reduce:transition-none"
      style={{ ...fill, width: `${Math.min(share, 1) * 100}%` }}
    />
    {children}
  </span>
);

/**
 * The sum of the Countdowns against the Countdown Limit (ADR-0021). A Deck
 * over the limit is red, at the full width. The sum counts to its new value,
 * as the Coin on the Balance Plate does.
 */
const CountdownMeter = ({ input }: { readonly input: DeckInput }) => {
  const { tr } = useGameText();
  const limit = countdownLimit(input.level);
  const sum = deckCountdown(input.deck);
  const shown = useCountTo(sum, 0, sum, METER_MS);
  const over = sum > limit;
  return (
    <div
      className="flex items-center gap-3 [@media(max-height:500px)]:gap-2"
      data-over={over || undefined}
    >
      <span className={meterValue} data-testid="deck-countdown">
        {tr("deckBuilder.countdownSum", { sum: shown, limit })}
      </span>
      <MeterGroove
        share={sum / limit}
        fill={over ? DECK_METER_FILL.over : GOLD_FILL}
      />
    </div>
  );
};

/** The number of cards against the size limits: a groove with a notch at the minimum. */
const SizeMeter = ({ input }: { readonly input: DeckInput }) => {
  const { tr } = useGameText();
  const { min, max } = deckSizeLimits(input.level);
  const count = input.deck.length;
  const shown = useCountTo(count, 0, count, METER_MS);
  const enough = count >= min && count <= max;
  return (
    <div className="flex items-center gap-3 [@media(max-height:500px)]:gap-2">
      <span className={meterValue} data-testid="deck-size">
        {tr("deckBuilder.size", { count: shown, max })}
      </span>
      <MeterGroove
        share={count / max}
        fill={enough ? GOLD_FILL : DECK_METER_FILL.under}
      >
        <span
          className="bg-ink absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full"
          style={{ left: `${(min / max) * 100}%` }}
        />
      </MeterGroove>
      {/* The minimum stays for screen readers: the notch shows it on the screen. */}
      <span className="sr-only">{tr("deckBuilder.sizeMin", { min })}</span>
    </div>
  );
};

/** Only the first reasons show, so that the list cannot hide the Deck list. */
const MAX_PROBLEMS = 3;

/** The reasons when the Deck is not valid (CRD-04). */
const Problems = ({
  problems,
}: {
  readonly problems: readonly DeckProblem[];
}) => {
  const { text, tr } = useGameText();
  if (problems.length === 0) {
    return null;
  }
  const hidden = problems.length - MAX_PROBLEMS;
  return (
    <output className="block" data-testid="deck-problems">
      <ul className="flex flex-col gap-1">
        {problems.slice(0, MAX_PROBLEMS).map((problem) => {
          const reason: TextRef = problemText(problem);
          return (
            <li
              key={text(reason)}
              className="text-ink flex items-start gap-2 text-sm leading-snug [@media(max-height:500px)]:text-xs"
            >
              <span
                className="mt-[0.4em] size-2 shrink-0 rotate-45 border"
                style={DECK_PROBLEM_MARK}
                aria-hidden
              />
              {text(reason)}
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <p
          className="text-ink-soft mt-1 pl-4 text-sm leading-snug italic [@media(max-height:500px)]:text-xs"
          data-testid="deck-problems-more"
        >
          {tr("deckBuilder.moreProblems", { count: hidden })}
        </p>
      )}
    </output>
  );
};

/**
 * The right page: the Deck name and Hero Class, the grid of the Deck cards,
 * then the Countdown and size meters, the reasons and the actions.
 */
export const DeckPage = ({
  slot,
  input,
  fallbackName,
  problems,
  active,
  canFill,
  landing,
  onRename,
  onClass,
  onRemove,
  onClear,
  onFill,
  onUse,
  bind,
  wasLongPress,
  peekAt,
}: {
  readonly slot: DeckSlot;
  readonly input: DeckInput;
  readonly fallbackName: string;
  readonly problems: readonly DeckProblem[];
  readonly active: boolean;
  readonly canFill: boolean;
  /** The cards that just came into the Deck, and the wait before each lands. */
  readonly landing: ReadonlyMap<string, number>;
  readonly onRename: (name: string) => void;
  readonly onClass: (classId: ClassId) => void;
  readonly onRemove: (row: DeckRow) => void;
  readonly onClear: () => void;
  readonly onFill: () => void;
  readonly onUse: () => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
  readonly peekAt: PeekAt;
}) => {
  const { tr } = useGameText();
  const rows = deckRows(slot.deck);
  // The other cards slide to their new places as the cards come and go.
  const grid = useDeckFlip();
  return (
    <section
      aria-label={slot.name || fallbackName}
      className="flex min-h-0 flex-col gap-3 py-4 pr-5 pl-9 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:pr-3 [@media(max-height:500px)]:pl-6"
    >
      <header className="border-parchment-rule flex flex-col gap-2 border-b-2 pb-3 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pb-1.5">
        <DeckName slot={slot} fallback={fallbackName} onRename={onRename} />
        <ClassChoice classId={slot.classId} onChange={onClass} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {rows.length === 0 ? (
          <EmptyDeck />
        ) : (
          // oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the Card Frame size (em); the text in the frame has its own size
          <ul
            ref={grid}
            aria-label={tr("deckBuilder.thisDeck")}
            className="-mx-2 grid min-h-0 flex-1 [scrollbar-width:thin] auto-rows-max grid-cols-[repeat(auto-fill,minmax(10em,1fr))] items-start gap-x-1 gap-y-3 overflow-y-auto overscroll-contain px-2 pt-2 pb-4 text-[11px] max-[1100px]:text-[10px] [@media(max-height:500px)]:gap-y-1.5 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:text-[7px]"
            style={{ scrollbarColor: DECK_CSS.scrollbar }}
            data-testid="deck-grid"
          >
            {rows.map((row) => (
              <DeckCard
                key={deckKey(row)}
                row={row}
                landDelay={landing.get(deckKey(row))}
                onRemove={onRemove}
                bind={bind}
                wasLongPress={wasLongPress}
                peekAt={peekAt}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="border-parchment-rule flex flex-col gap-2.5 border-t-2 pt-3 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:pt-1.5">
        <CountdownMeter input={input} />
        <SizeMeter input={input} />
        <Problems problems={problems} />
        <div className="flex items-center gap-2">
          <GameButton
            intent="wood"
            size="sm"
            onPress={onClear}
            isDisabled={slot.deck.length === 0}
            className="[@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:text-xs"
            data-testid="deck-clear"
          >
            <GlyphIcon
              glyph="broom"
              className="size-4 shrink-0 [@media(max-height:500px)]:size-3"
            />
            {tr("deckBuilder.clear")}
          </GameButton>
          <GameButton
            intent="wood"
            size="sm"
            onPress={onFill}
            isDisabled={!canFill}
            className="[@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:text-xs"
            data-testid="deck-autofill"
          >
            <GlyphIcon
              glyph="sparkles"
              className="size-4 shrink-0 [@media(max-height:500px)]:size-3"
            />
            {tr("deckBuilder.autoFill")}
          </GameButton>
          <span className="flex-1" />
          {active ? (
            <span
              className="font-display border-gold-deep bg-parchment-lit text-gold-deep inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-3 font-bold [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:text-sm"
              data-testid="deck-active"
            >
              <GlyphIcon glyph="check" className="size-4" />
              {tr("deckBuilder.active")}
            </span>
          ) : (
            <GameButton
              intent="gold"
              onPress={onUse}
              isDisabled={problems.length > 0}
              className="font-display [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:text-sm"
              data-testid="deck-use"
            >
              {tr("deckBuilder.use")}
            </GameButton>
          )}
        </div>
      </footer>
    </section>
  );
};
