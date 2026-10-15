import { RegistryContext, useAtom, useAtomValue } from "@effect/atom-react";
import {
  deckProblems,
  getCard,
  MAX_SWEEP_TICKETS,
  SWEEP_TICKETS_PER_WIN,
} from "@workspace/rules";
import type { ClassId } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react";
import { useContext, useMemo, useRef, useState } from "react";
import {
  Button,
  Dialog,
  Heading,
  Label,
  Modal,
  ModalOverlay,
  Popover,
  Radio,
  RadioGroup,
} from "react-aria-components";
import { HiMinus, HiPlus, HiXMark } from "react-icons/hi2";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import type { BattleOptions } from "@/features/battle/battle-session";
import { CardDetails } from "@/features/battle/components/card-details";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import {
  NewChip,
  ResultCoin,
  ResultForgeStones,
  ResultXp,
} from "@/features/battle/components/result-rewards";
import { classGlyph } from "@/features/battle/glyphs";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import {
  StageShield,
  StarRow,
} from "@/features/campaign/components/campaign-icons";
import type { TrailStage } from "@/features/campaign/region-map";
import type { ShownSweep } from "@/features/campaign/sweep";
import {
  canSweep,
  clampTickets,
  isSweepable,
  maxTickets,
  recordSweep,
  stepTickets,
} from "@/features/campaign/sweep";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import type { Peek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import {
  classText,
  defaultSlotName,
  problemText,
  slotInput,
} from "@/features/deck/deck";
import {
  activeDeckIdAtom,
  collectionAtom,
  deckSlotsAtom,
} from "@/features/deck/deck.atoms";
import { useStagePanelHints } from "@/features/hint/use-hints";
import type { GridCard } from "@/features/packs/packs";
import { cardPlaces } from "@/features/packs/packs";
import {
  battlePlayerAtom,
  playerLevelAtom,
  profileAtom,
} from "@/features/profile/profile.atoms";
import {
  clearSheetOrigin,
  placeSheetOrigin,
  SHEET_MOTION,
  SHEET_PATH_MOTION,
  SHEET_SCRIM_MOTION,
} from "@/features/town/sheet-motion";

/**
 * The parts of the panel ink in from the top while the sheet comes up out of
 * the Stage Marker: the header, the enemy, the reward, the Deck, the Sweep,
 * then the buttons.
 */
const INK = [
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_140ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_190ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_240ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_290ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_340ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_390ms_both]",
] as const;

/** The reward card is dealt onto the page after its row inks in. */
const DEAL =
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-deal_440ms_cubic-bezier(0.2,0.8,0.2,1)_300ms_both]";

/** The text goes before the sheet goes back into the Stage Marker. */
const INK_OUT =
  "motion-safe:group-data-[exiting]/sheet:animate-[settings-sheet-ink_260ms_ease-out_reverse_both]";

/** One row of the panel: a Cinzel label at the left, its content at the right (as in Settings). */
const Row = ({
  label,
  children,
  className,
  anchor,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
  /** A Hint can point at the label (`data-hint-anchor`). */
  readonly anchor?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:py-1.5",
      className
    )}
  >
    <p
      className="font-display pt-0.5 text-sm font-bold text-[#2a1d12]"
      data-hint-anchor={anchor}
    >
      {label}
    </p>
    <div className="min-w-0">{children}</div>
  </div>
);

const deckOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left transition-[transform,box-shadow] outline-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:-translate-y-0.5 motion-reduce:data-[hovered]:translate-y-0",
    "[@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:py-1",
    isSelected
      ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.45)]"
      : "border-[#c9b48c] bg-[#f6ead0]"
  );

/** The enemy Hero of the Stage, its HP and the Recommended level. */
const EnemyRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr, text } = useGameText();
  const { stage } = stop;
  return (
    <Row label={tr("campaign.panel.enemy")} className={INK[1]}>
      <p className="flex items-center gap-2 font-bold">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#6b1610] text-[#fff6df] [@media(max-height:500px)]:size-6"
          aria-hidden
        >
          <GlyphIcon
            glyph={classGlyph(stage.enemy.classId)}
            className="size-4"
          />
        </span>
        <span className="min-w-0 leading-tight [@media(max-height:500px)]:text-sm">
          {tr("campaign.panel.enemyLine", {
            name: tr(`stages.${stage.id}.enemy`),
            className: text(classText(stage.enemy.classId)),
          })}
        </span>
      </p>
      <p className="mt-1 text-xs text-[#5b4632]">
        {tr("campaign.panel.heroHp", { hp: stage.enemy.heroHp })} ·{" "}
        {tr("campaign.panel.level", { level: stage.recommendedLevel })}
      </p>
    </Row>
  );
};

/**
 * The Card Details of a reward card: hover after a short delay, keyboard
 * focus, or a long press, as in the Deck builder. They open beside the card,
 * out of the panel, so that the scroll of the panel never cuts them.
 */
const useRewardPeek = ({
  placement,
  testId,
}: {
  readonly placement: "right" | "top";
  readonly testId: string;
}) => {
  const { peek, bind, hide } = useCardPeek();
  const details = (target: Peek, anchor: RefObject<HTMLElement | null>) =>
    peek && isSamePeek(peek, target) ? (
      <Popover
        triggerRef={anchor}
        isOpen
        isNonModal
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        placement={placement}
        offset={12}
        className="fade-in animate-in pointer-events-none duration-150 motion-reduce:animate-none"
        data-testid={testId}
      >
        <CardDetails cardId={target.cardId} rank={target.rank} />
      </Popover>
    ) : null;
  return { bind, details };
};

/** The ring of a reward card button with keyboard focus. */
const PEEK_BUTTON =
  "cursor-default rounded-[0.85em] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]";

/**
 * The first-win card before the first win; the repeat-win reward after it (GDD 8.1).
 * Hover, keyboard focus or a long press on the card shows its Card Details, as
 * in the Deck builder.
 */
const RewardRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr } = useGameText();
  const { cardId, rank } = stop.stage.firstWinCard;
  const card = getCard(cardId);
  const won = stop.state === "done";
  const { bind, details } = useRewardPeek({
    placement: "right",
    testId: "stage-reward-peek",
  });
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = { cardId, rank, from: "campaign" };
  return (
    <Row label={tr("campaign.panel.reward")} className={INK[2]}>
      <div className="flex items-center gap-3">
        <Button
          ref={trigger}
          {...bind(target)}
          aria-label={`${tr(`cards.${cardId}.name`)}, ${tr(`ranks.${rank}`)}`}
          className={cn("shrink-0", PEEK_BUTTON)}
          data-testid="stage-reward-frame"
        >
          <CardFrame
            cardId={cardId}
            rank={rank}
            countdown={card.countdown}
            className={cn(
              "-rotate-2 text-[6px] [@media(max-height:500px)]:text-[4.5px]",
              won && "opacity-70 saturate-[0.7]",
              DEAL
            )}
          />
        </Button>
        {details(target, trigger)}
        <div className="min-w-0">
          <p
            className="font-display leading-tight font-bold [@media(max-height:500px)]:text-sm"
            data-testid="stage-reward-card"
          >
            {tr(`cards.${cardId}.name`)}
          </p>
          <p className="text-xs font-bold text-[#6b5238]">
            {tr(`ranks.${rank}`)}
          </p>
          <p className="mt-1 text-xs leading-snug text-[#5b4632]">
            {won
              ? tr("campaign.panel.repeatWin")
              : tr("campaign.panel.firstWin")}
          </p>
        </div>
      </div>
    </Row>
  );
};

/**
 * The Deck choice: the Deck slots that have cards, with the active Deck
 * selected (GDD 11.5). "Edit Decks" opens the Deck builder. A Deck that is not
 * valid cannot start a Battle, and its first reason shows (CRD-04).
 */
const useDeckChoice = () => {
  const [deckId, setDeckId] = useAtom(activeDeckIdAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const collection = useAtomValue(collectionAtom);
  const level = useAtomValue(playerLevelAtom);
  const decks = slots.filter((slot) => slot.deck.length > 0);
  const chosen = decks.find((slot) => slot.id === deckId) ?? decks[0];
  const problems = chosen
    ? deckProblems(slotInput(chosen, collection, level))
    : [];
  return { slots, decks, chosen, setDeckId, problem: problems[0] };
};

const DeckRow = ({
  choice,
  onEdit,
}: {
  readonly choice: ReturnType<typeof useDeckChoice>;
  readonly onEdit: () => void;
}) => {
  const { tr, text } = useGameText();
  const { slots, decks, chosen, setDeckId, problem } = choice;
  return (
    <RadioGroup
      value={chosen?.id ?? null}
      onChange={setDeckId}
      className={cn(
        "grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:py-1.5",
        INK[3]
      )}
    >
      <Label className="font-display pt-0.5 text-sm font-bold text-[#2a1d12]">
        {tr("campaign.panel.deck")}
      </Label>
      <div className="flex min-w-0 flex-col gap-1.5">
        {decks.map((slot) => (
          <Radio
            key={slot.id}
            value={slot.id}
            className={deckOption}
            data-testid={`deck-${slot.id}`}
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#5b3a1e] text-[#fff6df]"
              aria-hidden
            >
              <GlyphIcon glyph={classGlyph(slot.classId)} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate text-sm leading-tight font-bold">
                {slot.name || text(defaultSlotName(slot, slots.indexOf(slot)))}
              </span>
              <span className="block text-xs text-[#5b4632] [@media(max-height:500px)]:sr-only">
                {tr("battle.deckLine", {
                  className: text(classText(slot.classId)),
                  count: slot.deck.length,
                })}
              </span>
            </span>
          </Radio>
        ))}
        <GameButton
          intent="wood"
          size="sm"
          onPress={onEdit}
          className="self-start whitespace-nowrap [@media(max-height:500px)]:min-h-8"
          data-testid="edit-decks"
        >
          {tr("battle.editDecks")}
        </GameButton>
        {problem ? (
          <output
            className="flex items-start gap-2 text-xs leading-snug"
            data-testid="deck-problem"
          >
            <span
              className="mt-[0.4em] size-2 shrink-0 rotate-45 border border-[#5b2a0c] bg-[#b4521a]"
              aria-hidden
            />
            {text(problemText(problem))}
          </output>
        ) : null}
      </div>
    </RadioGroup>
  );
};

/** Formats a count in the Locale of the Player. */
const useCount = () => {
  const { locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return (value: number) => number.format(value);
};

/** A Sweep Ticket in Ready Gold on a small Frame Wood tile, as the Class icon of a Deck. */
const TicketTile = () => (
  <span
    className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#5b3a1e] text-[#ffd75a] [@media(max-height:500px)]:size-6"
    aria-hidden
  >
    <GlyphIcon glyph="ticket" className="size-5 -rotate-8" />
  </span>
);

/** The − and + keys of the Ticket control: square wood keys. */
const STEP_KEY =
  "size-10 shrink-0 [@media(max-height:500px)]:size-8 [@media(max-height:500px)]:min-h-8";

/**
 * The Ticket control (WAI-ARIA spinbutton): − and + keys around the number of
 * Tickets in Inter 900, and a "Max" key. The arrow keys, the page keys, Home
 * and End change the number on the focused number. It is 1 to 10, and not
 * more than the Player has.
 */
const TicketControl = ({
  value,
  owned,
  onChange,
}: {
  readonly value: number;
  readonly owned: number;
  readonly onChange: (tickets: number) => void;
}) => {
  const { tr } = useGameText();
  const count = useCount();
  const max = maxTickets(owned);
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const next = stepTickets(event.key, value, owned);
    if (next !== null) {
      event.preventDefault();
      onChange(next);
    }
  };
  return (
    <div className="flex items-center gap-1.5" data-testid="sweep-control">
      <GameButton
        intent="wood"
        size="icon"
        aria-label={tr("campaign.sweep.fewer")}
        excludeFromTabOrder
        isDisabled={value <= 1}
        onPress={() => onChange(clampTickets(value - 1, owned))}
        className={STEP_KEY}
        data-testid="sweep-fewer"
      >
        <HiMinus className="size-4" aria-hidden />
      </GameButton>
      <span
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a text input opens the phone keyboard over the landscape screen; the − and + keys and the arrow keys set the number (WAI-ARIA spinbutton)
        role="spinbutton"
        tabIndex={0}
        aria-label={tr("campaign.sweep.control")}
        aria-valuemin={1}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={count(value)}
        onKeyDown={onKeyDown}
        className="grid h-10 min-w-12 cursor-default place-items-center rounded-lg border-2 border-[#c9b48c] bg-[#fff3d1] px-2 text-2xl leading-none font-black text-[#2a1d12] tabular-nums shadow-[inset_0_2px_3px_rgba(42,29,18,0.18)] outline-none focus-visible:ring-4 focus-visible:ring-[#fff2a8] [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:min-w-10 [@media(max-height:500px)]:text-xl"
        data-testid="sweep-tickets"
      >
        {count(value)}
      </span>
      <GameButton
        intent="wood"
        size="icon"
        aria-label={tr("campaign.sweep.more")}
        excludeFromTabOrder
        isDisabled={value >= max}
        onPress={() => onChange(clampTickets(value + 1, owned))}
        className={STEP_KEY}
        data-testid="sweep-more"
      >
        <HiPlus className="size-4" aria-hidden />
      </GameButton>
      <GameButton
        intent="wood"
        size="sm"
        aria-label={tr("campaign.sweep.maxLabel", { count: max })}
        isDisabled={value >= max}
        onPress={() => onChange(max)}
        className="ml-0.5 px-2.5 [@media(max-height:500px)]:min-h-8"
        data-testid="sweep-max"
      >
        {tr("campaign.sweep.max")}
      </GameButton>
    </div>
  );
};

/**
 * The Sweep row (GDD 4.12): only on a Stage with 3 best Stars. It shows the
 * Sweep Tickets of the Player and the Ticket control. With no Tickets, a
 * line tells the Player how to get them.
 */
const SweepRow = ({
  owned,
  value,
  onChange,
}: {
  readonly owned: number;
  readonly value: number;
  readonly onChange: (tickets: number) => void;
}) => {
  const { tr } = useGameText();
  const count = useCount();
  return (
    <Row
      label={tr("campaign.sweep.label")}
      className={cn("border-t border-[#c9b48c]/70", INK[4])}
      anchor="sweep-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p
          className="flex items-center gap-2 text-sm font-bold"
          data-testid="sweep-owned"
          data-tickets={owned}
        >
          <TicketTile />
          <span aria-hidden className="tabular-nums">
            {tr("campaign.sweep.tickets", { count: count(owned) })}
          </span>
          <span className="sr-only">
            {tr("campaign.sweep.ticketsLabel", { count: owned })}
          </span>
        </p>
        {owned > 0 ? (
          <TicketControl value={value} owned={owned} onChange={onChange} />
        ) : null}
      </div>
      {owned > 0 ? null : (
        <p
          className="mt-1.5 text-xs leading-snug text-[#5b4632]"
          data-testid="sweep-no-tickets"
        >
          {tr("campaign.sweep.noTickets", { count: SWEEP_TICKETS_PER_WIN })}
        </p>
      )}
    </Row>
  );
};

/** The parts of the Sweep Result ink in one after the other when the page turns. */
const resultInk = (step: number) =>
  `motion-safe:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_${String(40 + step * 60)}ms_both]`;

/** The time between two cards that are dealt into the fan. */
const DEAL_STEP_MS = 70;

/**
 * The tilt and the deal delay of each card in the fan: the cards turn out
 * from the center, and each one is dealt after the one before it.
 */
const fanTilt = (index: number, count: number): CSSProperties => {
  const offset = index - (count - 1) / 2;
  const spread = Math.min(4, 14 / count);
  return {
    rotate: `${(offset * spread).toFixed(2)}deg`,
    translate: `0 ${(Math.abs(offset) * 1.5).toFixed(1)}px`,
    animationDelay: `${260 + index * DEAL_STEP_MS}ms`,
  };
};

/**
 * Each card after the first moves left over the one before it when the fan
 * is wider than the page, so that all cards stay on the page. A card is 9
 * times its font size (`--card`) wide.
 */
const fanOverlap = (index: number, count: number): CSSProperties =>
  index === 0
    ? {}
    : {
        marginLeft: `min(calc(0.5 * var(--card)), calc((100% - ${count} * 9 * var(--card)) / ${count - 1}))`,
      };

/** One card of a Sweep. Hover, keyboard focus or a long press shows its Card Details. */
const SweepCard = ({
  place,
  index,
  count,
  named,
  peek,
}: {
  readonly place: GridCard;
  readonly index: number;
  readonly count: number;
  readonly named: boolean;
  readonly peek: ReturnType<typeof useRewardPeek>;
}) => {
  const { tr } = useGameText();
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = {
    cardId: place.cardId,
    rank: place.rank,
    from: "campaign",
  };
  const name = tr(`cards.${place.cardId}.name`);
  const rank = tr(`ranks.${place.rank}`);
  const label =
    place.copies > 1
      ? tr(
          place.isNew
            ? "campaign.sweep.newCardCopies"
            : "campaign.sweep.cardCopies",
          { name, rank, count: place.copies }
        )
      : tr(place.isNew ? "battle.newCardWon" : "battle.cardWon", {
          name,
          rank,
        });
  return (
    <li
      className={cn(
        "relative flex shrink-0 flex-col items-center",
        // A name is wider than its card: it gets its own place.
        named ? "w-24 [&+&]:ml-1" : "w-[calc(9*var(--card))]"
      )}
      style={named ? undefined : fanOverlap(index, count)}
      data-testid="sweep-card"
      data-card={place.cardId}
      data-copies={place.copies}
      data-new={place.isNew || undefined}
    >
      <Button
        ref={trigger}
        {...peek.bind(target)}
        aria-label={label}
        className={cn(
          "relative text-[length:var(--card)] motion-safe:animate-[stage-panel-deal_440ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
          PEEK_BUTTON
        )}
        style={fanTilt(index, count)}
        data-testid="sweep-card-frame"
      >
        <CardFrame
          cardId={place.cardId}
          rank={place.rank}
          countdown={getCard(place.cardId).countdown}
        />
        {place.copies > 1 ? (
          // The `×N` plate of the Open ×10 grid.
          <span className="absolute -right-[0.4em] -bottom-[0.4em] z-20 flex h-[2em] min-w-[2.4em] items-center justify-center rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e] px-[0.4em] text-[max(10px,1.1em)] leading-none font-black text-[#fff6df] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.45)]">
            {tr("packs.reveal.copies", { count: place.copies })}
          </span>
        ) : null}
        {place.isNew ? (
          <NewChip
            style={{
              animationDelay: `${560 + index * DEAL_STEP_MS}ms`,
            }}
          />
        ) : null}
      </Button>
      {peek.details(target, trigger)}
      {named ? (
        <span
          className="mt-1.5 max-w-full truncate text-xs font-bold text-[#2a1d12]"
          aria-hidden
        >
          {name}
        </span>
      ) : null}
    </li>
  );
};

/**
 * The cards of a Sweep (GDD 4.12): one Card Frame for each card and Rank,
 * from the highest Rank, dealt into a fan. More copies of one card show a
 * `×N` plate, as in the Open ×10 grid, and a card that was not Discovered
 * gets the gold "New" chip. With 3 cards or fewer, the names show under the
 * cards; a screen reader always reads each card. Hover, keyboard focus or a
 * long press on a card shows its Card Details over the fan.
 */
const SweepCards = ({ shown }: { readonly shown: ShownSweep }) => {
  const { tr } = useGameText();
  const peek = useRewardPeek({ placement: "top", testId: "sweep-card-peek" });
  const places = cardPlaces(shown.rewards.cards);
  if (places.length === 0) {
    return (
      <p
        className={cn(
          "py-3 text-center text-sm text-[#6b5238] italic [@media(max-height:500px)]:py-1",
          resultInk(1)
        )}
        data-testid="sweep-no-card"
      >
        {tr("campaign.sweep.noCard")}
      </p>
    );
  }
  const named = places.length <= 3;
  return (
    <ul
      // The font size of a Card Frame sets its size (DESIGN.md, Card Frame).
      className="flex w-full justify-center px-2 pt-3 pb-1 [--card:7px] [@media(max-height:500px)]:pt-2.5 [@media(max-height:500px)]:[--card:5.5px]"
      data-testid="sweep-cards"
    >
      {places.map((place, index) => (
        <SweepCard
          key={`${place.cardId}:${place.rank}`}
          place={place}
          index={index}
          count={places.length}
          named={named}
          peek={peek}
        />
      ))}
    </ul>
  );
};

/**
 * The Sweep Result (GDD 4.12): the page of the Stage Panel after a Sweep.
 * "Victory" with a gold stamp of the Tickets, the cards in a fan, the total
 * Coin, Forge Stones and XP (as the Battle result), and the Sweep Tickets
 * that stay. The
 * rewards are already in the Profile. "Sweep Again" uses the same number of
 * Tickets and is the gold action; when the Player has too few Tickets, it is
 * off and "Close" is the gold action. "Close" turns the page back.
 */
const SweepResult = ({
  shown,
  owned,
  onAgain,
  onClose,
}: {
  readonly shown: ShownSweep;
  readonly owned: number;
  readonly onAgain: () => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const count = useCount();
  const again = canSweep(shown.tickets, owned);
  return (
    <section
      aria-labelledby="sweep-result-title"
      className="grid gap-y-3 pt-3 [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-x-5 [@media(max-height:500px)]:gap-y-2 [@media(max-height:500px)]:pt-2"
      data-testid="sweep-result"
      data-tickets={shown.tickets}
    >
      <div className="flex min-w-0 flex-col items-center">
        <h3
          id="sweep-result-title"
          className={cn(
            "font-display flex items-center gap-3 text-4xl font-black text-[#8a5a12] [@media(max-height:500px)]:text-2xl",
            resultInk(0)
          )}
        >
          {tr("battle.victory")}
          <span
            className="flex -rotate-6 items-center gap-1 rounded-[4px] border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-2 py-1 font-sans text-lg leading-none font-black text-[#2a1a05] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.35)] motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_200ms_both] [@media(max-height:500px)]:text-base"
            aria-hidden
            data-testid="sweep-stamp"
          >
            <GlyphIcon glyph="ticket" className="size-5" />×{shown.tickets}
          </span>
        </h3>
        <p className="sr-only">
          {tr("campaign.sweep.resultLabel", { count: shown.tickets })}
        </p>
        <SweepCards shown={shown} />
      </div>
      <div className="flex min-w-0 flex-col gap-3 [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:gap-2">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#c9b48c]/70 pt-3 [@media(max-height:500px)]:border-t-0 [@media(max-height:500px)]:pt-0",
            resultInk(2)
          )}
        >
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              <ResultCoin coin={shown.rewards.coin} />
              <ResultForgeStones stones={shown.rewards.forgeStones} />
            </div>
            <p
              className="flex items-center gap-1.5 text-xs font-bold text-[#5b4632]"
              data-testid="sweep-tickets-left"
              data-tickets={shown.rewards.sweepTicketsLeft}
            >
              <GlyphIcon glyph="ticket" className="size-4 text-[#7a5310]" />
              {tr("campaign.sweep.ticketsLeft", {
                count: count(shown.rewards.sweepTicketsLeft),
              })}
            </p>
          </div>
          <ResultXp shown={shown} className="max-w-48 flex-1" />
        </div>
        <div className={cn("grid grid-cols-2 gap-2", resultInk(3))}>
          <GameButton
            intent={again ? "wood" : "gold"}
            size="lg"
            autoFocus={!again}
            onPress={onClose}
            className="font-display w-full px-3 tracking-[0.04em] [@media(max-height:500px)]:min-h-11"
            data-testid="sweep-close"
          >
            {tr("campaign.sweep.close")}
          </GameButton>
          <GameButton
            intent={again ? "gold" : "wood"}
            size="lg"
            autoFocus={again}
            isDisabled={!again}
            onPress={onAgain}
            className="font-display w-full px-3 tracking-[0.04em] whitespace-nowrap [@media(max-height:500px)]:min-h-11 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-base"
            data-testid="sweep-again"
          >
            {tr("campaign.sweep.again", { count: shown.tickets })}
          </GameButton>
        </div>
      </div>
    </section>
  );
};

/** The header of the panel: the shield, the Stage ID, the best Stars and the close button. */
const PanelHeader = ({
  shown,
  close,
}: {
  readonly shown: TrailStage;
  readonly close: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <header
      className={cn(
        "flex items-center gap-3 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:pb-2",
        INK[0]
      )}
    >
      <StageShield
        state={shown.state}
        className="-my-1 h-12 w-[42px] shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-8"
      />
      <div className="min-w-0">
        <Heading
          slot="title"
          className="font-display flex items-center gap-2 text-2xl leading-none font-black [@media(max-height:500px)]:text-xl"
        >
          {tr("battle.stageLabel", { id: shown.stage.id })}
          {shown.stage.boss ? (
            <span className="rounded-[4px] bg-[#8e1f1f] px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] text-white uppercase">
              {tr("battle.boss")}
            </span>
          ) : null}
        </Heading>
        <p
          className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#5b4632]"
          data-testid="stage-best-stars"
          data-stars={shown.stars}
        >
          <span>{tr("campaign.panel.bestStars")}</span>
          {shown.stars > 0 ? (
            <>
              <StarRow
                stars={shown.stars}
                className="gap-0.5"
                tone="parchment"
                starClassName="size-4"
              />
              <span className="sr-only">
                {tr("battle.starsLabel", { count: shown.stars })}
              </span>
            </>
          ) : (
            <span className="font-semibold text-[#6b5238]">
              {tr("campaign.panel.notWon")}
            </span>
          )}
        </p>
      </div>
      <GameButton
        intent="wood"
        size="icon"
        aria-label={tr("campaign.panel.close")}
        onPress={close}
        className="ml-auto shrink-0 self-start [@media(max-height:500px)]:size-9"
        data-testid="stage-panel-close"
      >
        <HiXMark className="size-5" aria-hidden />
      </GameButton>
    </header>
  );
};

/** The large buttons of the panel, in Cinzel. */
const ACTION =
  "font-display w-full tracking-[0.04em] [@media(max-height:500px)]:min-h-11";

/**
 * The actions of the panel. On a Stage with 3 best Stars, Sweep is the gold
 * action at the right and takes the focus, and Fight is wood at its left.
 * When the Player cannot Sweep, Fight is gold and takes the focus again.
 * On any other Stage, Fight is the one gold button across the full width.
 */
const PanelActions = ({
  sweepable,
  tickets,
  canFight,
  onFight,
  onSweep,
}: {
  readonly sweepable: boolean;
  readonly tickets: number;
  readonly canFight: boolean;
  readonly onFight: () => void;
  readonly onSweep: () => void;
}) => {
  const { tr } = useGameText();
  const sweepNow = sweepable && tickets > 0;
  return (
    <div
      className={cn(
        "mt-1 grid gap-2 [@media(max-height:500px)]:mt-auto",
        sweepable && "grid-cols-2",
        INK[5]
      )}
    >
      <GameButton
        intent={sweepNow ? "wood" : "gold"}
        size="lg"
        autoFocus={!sweepNow}
        className={ACTION}
        data-testid="start-battle"
        isDisabled={!canFight}
        onPress={onFight}
      >
        {tr("campaign.panel.fight")}
      </GameButton>
      {sweepable ? (
        <GameButton
          intent={sweepNow ? "gold" : "wood"}
          size="lg"
          autoFocus={sweepNow}
          className={cn(ACTION, "px-3 whitespace-nowrap")}
          data-testid="sweep"
          isDisabled={!sweepNow}
          onPress={onSweep}
        >
          <GlyphIcon glyph="ticket" className="size-5 shrink-0 -rotate-8" />
          {sweepNow
            ? tr("campaign.sweep.button", { count: tickets })
            : tr("campaign.sweep.label")}
        </GameButton>
      ) : null}
    </div>
  );
};

/**
 * The Sweep of the Stage Panel (GDD 4.12, ADR-0035): the Tickets in the
 * Ticket control, and the Sweep Result that shows now. A Sweep uses the rules
 * action with the Class of the Active Deck and saves the Profile at once, so
 * that a page load does not lose the rewards; a page load on the Sweep Result
 * does not Sweep again, because the result is not saved. A new open of the
 * panel starts on its first page with the most Tickets.
 */
const useSweep = (stageId: string | null, isOpen: boolean) => {
  const registry = useContext(RegistryContext);
  const owned = useAtomValue(profileAtom).sweepTickets;
  const [wanted, setWanted] = useState<number>(MAX_SWEEP_TICKETS);
  const [result, setResult] = useState<ShownSweep | null>(null);
  // Each Sweep turns the page again, so its parts ink in again.
  const [count, setCount] = useState(0);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setWanted(MAX_SWEEP_TICKETS);
      setResult(null);
    }
  }
  const sweep = (tickets: number, classId: ClassId) => {
    const profile = registry.get(profileAtom);
    if (stageId === null || !canSweep(tickets, profile.sweepTickets)) {
      return;
    }
    const recorded = recordSweep(profile, { stageId, tickets, classId });
    unlockAudio();
    playSound("victory");
    registry.set(profileAtom, recorded.profile);
    setResult(recorded.shown);
    setCount((value) => value + 1);
  };
  return {
    owned,
    tickets: clampTickets(wanted, owned),
    handleTicketsChange: setWanted,
    result: result?.stageId === stageId ? result : null,
    resultKey: count,
    sweep,
    handleResultClose: () => setResult(null),
  };
};

/**
 * The Stage Panel (GDD 11.5): a parchment dialog in the center of the screen,
 * over the dim map. It shows the Stage ID, the enemy Hero, the reward, the
 * best Stars and the Deck, and the Fight button. Esc, the close button and a
 * click outside close it. Fight takes the focus, so Enter starts the Battle.
 * On a Stage with 3 best Stars, it also has the Sweep (GDD 4.12): the Sweep
 * row, the Sweep button, which then takes the focus, and the Sweep Result,
 * which turns the page of the same sheet.
 *
 * The panel comes up out of the Stage Marker `from` and goes back into it,
 * as the Settings dialog does with its button. It keeps the last Stage while
 * it closes. On the way to the Deck builder and back, it only zooms and
 * fades at the center, because the Deck book opens over it.
 */
export const StagePanel = ({
  stop,
  from,
  onClose,
  onStart,
}: {
  readonly stop: TrailStage | null;
  readonly from?: RefObject<Element | null>;
  readonly onClose: () => void;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const choice = useDeckChoice();
  const player = useAtomValue(battlePlayerAtom);
  const [editing, setEditing] = useState(false);
  const [last, setLast] = useState(stop);
  if (stop !== null && stop !== last) {
    setLast(stop);
  }
  const shown = stop ?? last;
  const overlay = useRef<HTMLDivElement | null>(null);
  // True from "Edit Decks" until the panel closes: the panel stays at the center.
  const atCenter = useRef(false);
  const { chosen, problem } = choice;
  const isOpen = stop !== null && !editing;
  const sweep = useSweep(shown?.stage.id ?? null, stop !== null);
  const sweepable = shown !== null && isSweepable(shown.stars);
  useStagePanelHints(
    isOpen && shown !== null && sweep.result === null ? shown.stars : null
  );
  const sweepNow = (tickets: number) => {
    if (chosen) {
      sweep.sweep(tickets, chosen.classId);
    }
  };
  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            atCenter.current = false;
            placeSheetOrigin(overlay.current, from?.current ?? null);
            onClose();
          }
        }}
        isDismissable
        // The ref runs before the first paint, so the sheet starts on the marker.
        ref={(element) => {
          overlay.current = element;
          if (!atCenter.current) {
            placeSheetOrigin(element, from?.current ?? null);
          }
        }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] [@media(max-height:500px)]:p-2",
          SHEET_SCRIM_MOTION
        )}
      >
        <Modal
          className={cn(
            "group/sheet flex max-h-full w-[min(460px,94vw)] [@media(max-height:500px)]:w-[min(720px,96vw)]",
            SHEET_PATH_MOTION
          )}
        >
          <Dialog
            className={cn(
              "max-h-full w-full overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-5 pt-4 pb-5 text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.55)] outline-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3",
              SHEET_MOTION
            )}
            data-testid="stage-panel"
          >
            {({ close }) =>
              shown ? (
                <div className={INK_OUT}>
                  <PanelHeader shown={shown} close={close} />
                  {sweep.result ? (
                    <SweepResult
                      key={sweep.resultKey}
                      shown={sweep.result}
                      owned={sweep.owned}
                      onAgain={() => sweepNow(sweep.result?.tickets ?? 0)}
                      onClose={sweep.handleResultClose}
                    />
                  ) : (
                    <div className="[@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-x-5">
                      <div className="divide-y divide-[#c9b48c]/70">
                        <EnemyRow stop={shown} />
                        <RewardRow stop={shown} />
                      </div>
                      <div className="flex flex-col border-t border-[#c9b48c]/70 [@media(max-height:500px)]:border-t-0">
                        <DeckRow
                          choice={choice}
                          onEdit={() => {
                            atCenter.current = true;
                            clearSheetOrigin(overlay.current);
                            setEditing(true);
                          }}
                        />
                        {sweepable ? (
                          <SweepRow
                            owned={sweep.owned}
                            value={sweep.tickets}
                            onChange={sweep.handleTicketsChange}
                          />
                        ) : null}
                        <PanelActions
                          sweepable={sweepable}
                          tickets={chosen ? sweep.tickets : 0}
                          canFight={
                            chosen !== undefined && problem === undefined
                          }
                          onFight={() => {
                            if (chosen) {
                              onStart({
                                stageId: shown.stage.id,
                                deck: chosen,
                                player,
                                seed: qaSeed() ?? randomSeed(),
                              });
                            }
                          }}
                          onSweep={() => sweepNow(sweep.tickets)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            }
          </Dialog>
        </Modal>
      </ModalOverlay>
      <DeckDialog isOpen={editing} onOpenChange={setEditing} />
    </>
  );
};
