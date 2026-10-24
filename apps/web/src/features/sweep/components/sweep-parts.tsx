import { RegistryContext, useAtomValue } from "@effect/atom-react";
import {
  CAMPAIGN_SWEEP_TICKETS_PER_WIN,
  DUNGEON_SWEEP_TICKETS_PER_WIN,
  getCard,
  MAX_SWEEP_TICKETS,
} from "@workspace/rules";
import type { ClassId } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, KeyboardEvent } from "react";
import { useContext, useRef, useState } from "react";
import { Button } from "react-aria-components";
import { HiMinus, HiPlus } from "react-icons/hi2";

import { GameButton } from "@/core/components/game/game-button";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import {
  NewChip,
  ResultCoin,
  ResultEssence,
  ResultForgeStones,
  ResultXp,
} from "@/features/battle/components/result-rewards";
import { useGameText } from "@/features/battle/use-game-text";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import type { Peek } from "@/features/deck/components/use-card-peek";
import { useNumberFormat as useCount } from "@/features/i18n/use-number-format";
import type { GridCard } from "@/features/packs/packs";
import { cardPlaces } from "@/features/packs/packs";
import { profileAtom } from "@/features/profile/profile.atoms";
import type { ShownSweep, SweepKind } from "@/features/sweep/sweep";
import {
  canSweep,
  clampTickets,
  maxTickets,
  ownedTickets,
  recordSweep,
  stepTickets,
  TICKET_GLYPH,
} from "@/features/sweep/sweep";

/** The Sweep Tickets of `kind` that each win gives (ADR-0039). */
const TICKETS_PER_WIN: Readonly<Record<SweepKind, number>> = {
  campaign: CAMPAIGN_SWEEP_TICKETS_PER_WIN,
  dungeon: DUNGEON_SWEEP_TICKETS_PER_WIN,
};

/** The source of the Card Details of a Sweep card. */
const PEEK_FROM: Readonly<Record<SweepKind, Peek["from"]>> = {
  campaign: "campaign",
  dungeon: "dungeons",
};

/** A Sweep Ticket of `kind` in Ready Gold on a small Frame Wood tile, as the Class icon of a Deck. */
const TicketTile = ({ kind }: { readonly kind: SweepKind }) => (
  <span
    className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#5b3a1e] text-[#ffd75a] [@media(max-height:500px)]:size-6"
    aria-hidden
  >
    <GlyphIcon glyph={TICKET_GLYPH[kind]} className="size-5 -rotate-8" />
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
  kind,
  value,
  owned,
  onChange,
}: {
  readonly kind: SweepKind;
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
        aria-label={tr("sweep.fewer")}
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
        aria-label={tr(`sweep.${kind}.control`)}
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
        aria-label={tr("sweep.more")}
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
        aria-label={tr("sweep.maxLabel", { count: max })}
        isDisabled={value >= max}
        onPress={() => onChange(max)}
        className="ml-0.5 px-2.5 [@media(max-height:500px)]:min-h-8"
        data-testid="sweep-max"
      >
        {tr("sweep.max")}
      </GameButton>
    </div>
  );
};

/**
 * The content of the Sweep row (GDD 4.12): the Sweep Tickets of `kind` that
 * the Player has and the Ticket control. With no Tickets, a line tells the
 * Player how to get them. The Stage Panel and the Dungeons screen put it in
 * their own row.
 */
export const SweepTickets = ({
  kind,
  owned,
  value,
  onChange,
}: {
  readonly kind: SweepKind;
  readonly owned: number;
  readonly value: number;
  readonly onChange: (tickets: number) => void;
}) => {
  const { tr } = useGameText();
  const count = useCount();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p
          className="flex items-center gap-2 text-sm font-bold"
          data-testid="sweep-owned"
          data-kind={kind}
          data-tickets={owned}
        >
          <TicketTile kind={kind} />
          <span aria-hidden className="tabular-nums">
            {tr("sweep.tickets", { count: count(owned) })}
          </span>
          <span className="sr-only">
            {tr(`sweep.${kind}.ticketsLabel`, { count: owned })}
          </span>
        </p>
        {owned > 0 ? (
          <TicketControl
            kind={kind}
            value={value}
            owned={owned}
            onChange={onChange}
          />
        ) : null}
      </div>
      {owned > 0 ? null : (
        <p
          className="mt-1.5 text-xs leading-snug text-[#5b4632]"
          data-testid="sweep-no-tickets"
        >
          {tr(`sweep.${kind}.noTickets`, { count: TICKETS_PER_WIN[kind] })}
        </p>
      )}
    </>
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
  kind,
  place,
  index,
  count,
  named,
  peek,
}: {
  readonly kind: SweepKind;
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
    from: PEEK_FROM[kind],
  };
  const name = tr(`cards.${place.cardId}.name`);
  const rank = tr(`ranks.${place.rank}`);
  const label =
    place.copies > 1
      ? tr(place.isNew ? "sweep.newCardCopies" : "sweep.cardCopies", {
          name,
          rank,
          count: place.copies,
        })
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
        {tr("sweep.noCard")}
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
          kind={shown.kind}
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
 * The 2 actions of the Sweep Result. "Sweep Again" uses the same number of
 * Tickets and is the gold action; when the Player has too few Tickets, it is
 * off and "Close" is the gold action. "Close" turns the page back.
 */
export const SweepResultActions = ({
  shown,
  owned,
  onAgain,
  onClose,
  className,
}: {
  readonly shown: ShownSweep;
  readonly owned: number;
  readonly onAgain: () => void;
  readonly onClose: () => void;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  const again = canSweep(shown.tickets, owned);
  return (
    <div className={cn("grid grid-cols-2 gap-2", resultInk(3), className)}>
      <GameButton
        intent={again ? "wood" : "gold"}
        size="lg"
        autoFocus={!again}
        onPress={onClose}
        className="font-display w-full px-3 tracking-[0.04em] [@media(max-height:500px)]:min-h-11"
        data-testid="sweep-close"
      >
        {tr("sweep.close")}
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
        {tr("sweep.again", { count: shown.tickets })}
      </GameButton>
    </div>
  );
};

/**
 * The Sweep Result (GDD 4.12): the page after a Sweep, on the Stage Panel or
 * on the Dungeons screen. "Victory" with a gold stamp of the Tickets, the
 * cards in a fan, the total Coin, Essence, Forge Stones and XP (as the Battle
 * result), and the Tickets of that type that stay. The rewards are already in
 * the Profile. The actions are at the bottom (`SweepResultActions`). On a
 * short screen, the page has 2 columns. A narrow place that scrolls is
 * `stacked`: the page has 1 column and no actions, and the place puts the
 * actions under its scroll area, so that they are always in view.
 */
export const SweepResult = ({
  shown,
  owned,
  stacked = false,
  onAgain,
  onClose,
}: {
  readonly shown: ShownSweep;
  readonly owned: number;
  readonly stacked?: boolean;
  readonly onAgain: () => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const count = useCount();
  return (
    <section
      aria-labelledby="sweep-result-title"
      className={cn(
        "grid gap-y-3 pt-3 [@media(max-height:500px)]:gap-y-2 [@media(max-height:500px)]:pt-2",
        !stacked &&
          "[@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-x-5"
      )}
      data-testid="sweep-result"
      data-kind={shown.kind}
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
            <GlyphIcon glyph={TICKET_GLYPH[shown.kind]} className="size-5" />×
            {shown.tickets}
          </span>
        </h3>
        <p className="sr-only">
          {tr("sweep.resultLabel", { count: shown.tickets })}
        </p>
        <SweepCards shown={shown} />
      </div>
      <div className="flex min-w-0 flex-col gap-3 [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:gap-2">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#c9b48c]/70 pt-3",
            !stacked &&
              "[@media(max-height:500px)]:border-t-0 [@media(max-height:500px)]:pt-0",
            resultInk(2)
          )}
        >
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              <ResultCoin coin={shown.rewards.coin} />
              <ResultEssence essence={shown.rewards.essence} />
              <ResultForgeStones stones={shown.rewards.forgeStones} />
            </div>
            <p
              className="flex items-center gap-1.5 text-xs font-bold text-[#5b4632]"
              data-testid="sweep-tickets-left"
              data-tickets={shown.rewards.ticketsLeft}
            >
              <GlyphIcon
                glyph={TICKET_GLYPH[shown.kind]}
                className="size-4 text-[#7a5310]"
              />
              {tr(`sweep.${shown.kind}.ticketsLeft`, {
                count: count(shown.rewards.ticketsLeft),
              })}
            </p>
          </div>
          <ResultXp shown={shown} className="max-w-48 flex-1" />
        </div>
        {stacked ? null : (
          <SweepResultActions
            shown={shown}
            owned={owned}
            onAgain={onAgain}
            onClose={onClose}
          />
        )}
      </div>
    </section>
  );
};

/**
 * A Sweep of `kind` on the Stage or the Dungeon `targetId` (GDD 4.12): the
 * Tickets in the Ticket control, and the Sweep Result that shows now. A Sweep
 * uses the rules action with the Class of the Active Deck and saves the
 * Profile at once, so that a page load does not lose the rewards; a page load
 * on the Sweep Result does not Sweep again, because the result is not saved.
 * When `isOpen` becomes true again, it starts with the most Tickets and no
 * result.
 */
export const useSweep = (
  kind: SweepKind,
  targetId: string | null,
  isOpen: boolean
) => {
  const registry = useContext(RegistryContext);
  const owned = ownedTickets(useAtomValue(profileAtom), kind);
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
    if (targetId === null || !canSweep(tickets, ownedTickets(profile, kind))) {
      return;
    }
    const recorded = recordSweep(profile, { kind, targetId, tickets, classId });
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
    result: result?.targetId === targetId ? result : null,
    resultKey: count,
    sweep,
    handleResultClose: () => setResult(null),
  };
};
