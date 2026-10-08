import type { ClassId, DeckInput, DeckProblem } from "@workspace/rules";
import {
  countdownLimit,
  deckCountdown,
  deckSizeLimits,
  getCard,
} from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import {
  Button,
  Input,
  Label,
  Radio,
  RadioGroup,
  TextField,
} from "react-aria-components";
import { HiMinus } from "react-icons/hi2";

import { cardIllustration } from "@/features/battle/card-art";
import type { TextRef } from "@/features/battle/card-text";
import { RankGems } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { CountdownCurve } from "@/features/deck/components/countdown-curve";
import type { Peek } from "@/features/deck/components/use-card-peek";
import type { DeckRow, DeckSlot } from "@/features/deck/deck";
import {
  CLASSES_WITH_CARDS,
  DECK_NAME_MAX,
  deckRows,
  problemText,
} from "@/features/deck/deck";

type PeekBind = (target: Peek) => object;

const classOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "flex h-9 cursor-pointer items-center gap-2 rounded-lg border-2 pr-3 pl-1 text-sm font-bold text-[#2a1d12] transition-[transform,box-shadow] duration-100 outline-none select-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:-translate-y-px motion-reduce:data-[hovered]:translate-y-0",
    "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:pr-2 [@media(max-height:500px)]:text-xs",
    isSelected
      ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.45)]"
      : "border-[#c9b48c] bg-[#f6ead0]"
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
          "font-display w-full truncate rounded-md border-b border-dashed border-transparent bg-transparent px-1 py-0.5 text-2xl font-black text-[#2a1d12] outline-none placeholder:text-[#2a1d12]",
          "data-[focused]:border-solid data-[focused]:border-[#e2a93b] data-[focused]:bg-[#fff3d1] data-[hovered]:border-[#c9b48c]",
          "[@media(max-height:500px)]:text-base"
        )}
        data-testid="deck-name"
      />
    </TextField>
  );
};

/** The Hero Class of the slot (GDD 5.5), until the Hero screen exists. */
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
      <Label className="mr-1 text-xs font-bold text-[#5b4632] [@media(max-height:500px)]:sr-only">
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
            className="grid size-7 place-items-center rounded-md bg-[#5b3a1e] text-[#fff6df] [@media(max-height:500px)]:size-5"
            aria-hidden
          >
            <GlyphIcon
              glyph={classGlyph(id)}
              className="size-[18px] [@media(max-height:500px)]:size-3.5"
            />
          </span>
          {tr(`classes.${id}`)}
        </Radio>
      ))}
    </RadioGroup>
  );
};

/**
 * One line of the Deck list, ruled as a ledger: the Countdown, a strip of the
 * card art, the name, the Rank Gems and the copies. A press removes one copy.
 */
const DeckLine = ({
  row,
  onRemove,
  bind,
  wasLongPress,
}: {
  readonly row: DeckRow;
  readonly onRemove: (row: DeckRow) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
}) => {
  const { tr } = useGameText();
  const card = getCard(row.cardId);
  const name = tr(`cards.${row.cardId}.name`);
  return (
    <li className="border-b border-[#c9b48c]/80 last:border-b-0">
      <Button
        {...bind({ cardId: row.cardId, rank: row.rank, from: "deck" })}
        onPress={() => {
          if (!wasLongPress()) {
            onRemove(row);
          }
        }}
        aria-label={tr("deckBuilder.remove", {
          name,
          rank: tr(`ranks.${row.rank}`),
          count: row.count,
        })}
        className={cn(
          "group grid h-11 w-full cursor-pointer grid-cols-[1.75rem_3rem_minmax(0,1fr)_auto_2.25rem] items-center gap-2.5 rounded-lg px-1.5 text-left outline-none select-none",
          "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#fff3d1] data-[pressed]:translate-y-px",
          "[@media(max-height:500px)]:h-8 [@media(max-height:500px)]:grid-cols-[1.25rem_2.25rem_minmax(0,1fr)_auto_1.75rem] [@media(max-height:500px)]:gap-1.5"
        )}
        data-testid={`deck-row-${row.cardId}-${row.rank}`}
      >
        <span
          className="grid size-7 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-sm leading-none font-black text-[#fff6df] tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.5)] [@media(max-height:500px)]:size-5 [@media(max-height:500px)]:border [@media(max-height:500px)]:text-xs"
          aria-hidden
        >
          {card.countdown}
        </span>
        <span
          className="h-7 overflow-hidden rounded-md border-2 [@media(max-height:500px)]:h-5"
          style={{ borderColor: RANK_COLORS[row.rank] }}
          aria-hidden
        >
          <img
            src={cardIllustration(row.cardId)}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-[50%_30%]"
          />
        </span>
        <span className="truncate text-sm font-semibold text-[#2a1d12] [@media(max-height:500px)]:text-xs">
          {name}
        </span>
        <span className="text-[11px]" aria-hidden>
          <RankGems rank={row.rank} />
        </span>
        <span className="relative flex h-full items-center justify-end">
          <span
            className="text-base leading-none font-black text-[#2a1d12] tabular-nums transition-opacity group-data-[hovered]:opacity-0 [@media(max-height:500px)]:text-xs"
            aria-hidden
          >
            ×{row.count}
          </span>
          {/* Under the pointer, the copy count shows what a press does. */}
          <span
            className="absolute inset-y-0 right-0 grid place-items-center opacity-0 transition-opacity group-data-[focus-visible]:opacity-100 group-data-[hovered]:opacity-100"
            aria-hidden
          >
            <span className="grid size-6 place-items-center rounded-md border-2 border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] text-[#fff6df] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-5">
              <HiMinus className="size-3.5" />
            </span>
          </span>
        </span>
      </Button>
    </li>
  );
};

const meterValue =
  "text-base font-black whitespace-nowrap text-[#2a1d12] tabular-nums [@media(max-height:500px)]:text-xs";

const GOLD_FILL =
  "bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";

/** The groove of a meter, filled to `share` (0 to 1). */
const MeterGroove = ({
  share,
  fill,
  children,
}: {
  readonly share: number;
  readonly fill: string;
  readonly children?: ReactNode;
}) => (
  <span
    className="relative h-2.5 min-w-0 flex-1 rounded-full bg-[#5b3a1e] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.7)] [@media(max-height:500px)]:h-2"
    aria-hidden
  >
    <span
      className={cn(
        "absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
        fill
      )}
      style={{ width: `${Math.min(share, 1) * 100}%` }}
    />
    {children}
  </span>
);

/**
 * The sum of the Countdowns against the Countdown Limit (ADR-0021). A Deck
 * over the limit is red, at the full width.
 */
const CountdownMeter = ({ input }: { readonly input: DeckInput }) => {
  const { tr } = useGameText();
  const limit = countdownLimit(input.level);
  const sum = deckCountdown(input.deck);
  const over = sum > limit;
  return (
    <div
      className="flex items-center gap-3 [@media(max-height:500px)]:gap-2"
      data-over={over || undefined}
    >
      <span className={meterValue} data-testid="deck-countdown">
        {tr("deckBuilder.countdownSum", { sum, limit })}
      </span>
      <MeterGroove
        share={sum / limit}
        fill={over ? "bg-[#c0392b]" : GOLD_FILL}
      />
    </div>
  );
};

/** The number of cards against the size limits: a groove with a notch at the minimum. */
const SizeMeter = ({ input }: { readonly input: DeckInput }) => {
  const { tr } = useGameText();
  const { min, max } = deckSizeLimits(input.level);
  const count = input.deck.length;
  const enough = count >= min && count <= max;
  return (
    <div className="flex items-center gap-3 [@media(max-height:500px)]:gap-2">
      <span className={meterValue} data-testid="deck-size">
        {tr("deckBuilder.size", { count, max })}
      </span>
      <MeterGroove
        share={count / max}
        fill={enough ? GOLD_FILL : "bg-[#c9a46a]"}
      >
        <span
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-[#2a1d12]"
          style={{ left: `${(min / max) * 100}%` }}
        />
      </MeterGroove>
      <span className="text-xs whitespace-nowrap text-[#5b4632]">
        {tr("deckBuilder.sizeMin", { min })}
      </span>
    </div>
  );
};

/** The reasons when the Deck is not valid (CRD-04). */
const Problems = ({
  problems,
}: {
  readonly problems: readonly DeckProblem[];
}) => {
  const { text } = useGameText();
  if (problems.length === 0) {
    return null;
  }
  return (
    <output className="block" data-testid="deck-problems">
      <ul className="flex flex-col gap-1">
        {problems.map((problem) => {
          const reason: TextRef = problemText(problem);
          return (
            <li
              key={text(reason)}
              className="flex items-start gap-2 text-sm leading-snug text-[#2a1d12] [@media(max-height:500px)]:text-xs"
            >
              <span
                className="mt-[0.4em] size-2 shrink-0 rotate-45 border border-[#5b2a0c] bg-[#b4521a]"
                aria-hidden
              />
              {text(reason)}
            </li>
          );
        })}
      </ul>
    </output>
  );
};

/**
 * The right page: the Deck name and Hero Class, the Countdown curve, the Deck
 * list, then the size, the reasons and the actions.
 */
export const DeckPage = ({
  slot,
  input,
  fallbackName,
  problems,
  active,
  canFill,
  onRename,
  onClass,
  onRemove,
  onClear,
  onFill,
  onUse,
  bind,
  wasLongPress,
}: {
  readonly slot: DeckSlot;
  readonly input: DeckInput;
  readonly fallbackName: string;
  readonly problems: readonly DeckProblem[];
  readonly active: boolean;
  readonly canFill: boolean;
  readonly onRename: (name: string) => void;
  readonly onClass: (classId: ClassId) => void;
  readonly onRemove: (row: DeckRow) => void;
  readonly onClear: () => void;
  readonly onFill: () => void;
  readonly onUse: () => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
}) => {
  const { tr } = useGameText();
  const rows = deckRows(slot.deck);
  return (
    <section
      aria-label={slot.name || fallbackName}
      className="flex min-h-0 flex-col gap-3 py-4 pr-5 pl-9 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:pr-3 [@media(max-height:500px)]:pl-6"
    >
      <header className="flex flex-col gap-2 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pb-1.5">
        <DeckName slot={slot} fallback={fallbackName} onRename={onRename} />
        <ClassChoice classId={slot.classId} onChange={onClass} />
      </header>

      <CountdownCurve deck={slot.deck} />
      <CountdownMeter input={input} />

      <div className="flex min-h-0 flex-1 flex-col">
        <h4 className="font-display mb-1 text-base font-bold [@media(max-height:500px)]:sr-only">
          {tr("deckBuilder.thisDeck")}
        </h4>
        {rows.length === 0 ? (
          <p className="m-auto max-w-[34ch] text-center text-sm text-balance text-[#5b4632] [@media(max-height:500px)]:text-xs">
            {tr("deckBuilder.empty")}
          </p>
        ) : (
          <ul
            className="-mx-1.5 min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:#b9a175_transparent] overflow-y-auto overscroll-contain px-1.5"
            data-testid="deck-list"
          >
            {rows.map((row) => (
              <DeckLine
                key={`${row.cardId}:${row.rank}`}
                row={row}
                onRemove={onRemove}
                bind={bind}
                wasLongPress={wasLongPress}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="flex flex-col gap-2.5 border-t-2 border-[#c9b48c] pt-3 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:pt-1.5">
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
            {tr("deckBuilder.autoFill")}
          </GameButton>
          <span className="flex-1" />
          {active ? (
            <span
              className="font-display inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-[#e2a93b] bg-[#fff3d1] px-3 font-bold text-[#7a5310] [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:text-sm"
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
