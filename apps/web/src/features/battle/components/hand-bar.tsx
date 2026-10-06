import { useAtomValue } from "@effect/atom-react";
import { getCard, HAND_LIMIT } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type { PlayingEvent } from "@/features/battle/battle-session";
import type { BattleSpeed } from "@/features/battle/battle-timeline";
import type {
  GraveyardCardView,
  HandCardView,
} from "@/features/battle/battle-view";
import {
  detailsUnitAtom,
  tutorialMarksAtom,
} from "@/features/battle/battle.atoms";
import { cardText } from "@/features/battle/card-text";
import {
  CardBack,
  EmptyCardPlace,
} from "@/features/battle/components/card-back";
import { CardDetails } from "@/features/battle/components/card-details";
import { BRONZE, CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { HandCard } from "@/features/battle/components/hand-card";
import type { Drag } from "@/features/battle/components/hand-input";
import {
  activeDragIndex,
  draggedCard,
  dragMove,
  handHint,
  pressAction,
  startDrag,
} from "@/features/battle/components/hand-input";
import { scenePicker } from "@/features/battle/scene/scene-picker";
import { LONG_PRESS_MS } from "@/features/battle/unit-inspect";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

type Battle = ReturnType<typeof useBattle>;
type SetInspected = Dispatch<SetStateAction<number | null>>;

/** The card drag, and the long-press timer that a drag cancels. */
const useCardDrag = (battle: Battle) => {
  const [drag, setDrag] = useState<Drag | null>(null);
  // Timer IDs are greater than 0, so `clearTimeout(0)` does nothing.
  const longPress = useRef(0);

  // Window listeners follow the pointer outside the card while it drags.
  useEffect(() => {
    if (!drag) {
      return;
    }
    const move = (event: PointerEvent) => {
      setDrag((current) => {
        if (!current) {
          return current;
        }
        const next = dragMove(current, event.clientX, event.clientY);
        if (next.started) {
          window.clearTimeout(longPress.current);
          battle.select(current.index);
        }
        return next.drag;
      });
    };
    const up = (event: PointerEvent) => {
      if (drag.active) {
        const target = scenePicker.pick(event.clientX, event.clientY);
        if (target) {
          battle.play(target, drag.index);
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag, battle]);

  return {
    drag,
    setDrag,
    /** Touch: runs `inspect` when the press is held long enough. */
    holdToInspect: (inspect: () => void) => {
      longPress.current = window.setTimeout(inspect, LONG_PRESS_MS);
    },
    cancelHold: () => window.clearTimeout(longPress.current),
  };
};

/** The space between a pile and the Hand Slots, in `em` of the Hand Bar. */
const PILE_GAP_EM = 2.4;

/** One Hand Slot and the gap after it, in `em` of the Hand Bar. */
const SLOT_PITCH_EM = 9.6;

/** At speed ×1, a card drops onto the Graveyard Pile this long. */
const DROP_MS = 360;

/**
 * The count of a pile: a round dark plate with a bronze rim. It sits on the
 * gap between the pile and the Hand Slots.
 */
const PileBadge = ({
  count,
  side,
}: {
  readonly count: number;
  readonly side: "left" | "right";
}) => (
  <span
    className={cn(
      "absolute top-1/2 z-10 flex size-[2.6em] -translate-y-1/2 items-center justify-center rounded-full border-[0.18em] border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df] shadow-[0_0.12em_0.3em_rgba(0,0,0,0.7)]",
      side === "right" ? "-right-[1.3em]" : "-left-[1.3em]"
    )}
    aria-hidden
  >
    <span className="text-[1.3em] leading-none font-black tabular-nums">
      {count}
    </span>
  </span>
);

/** The bronze edges of the cards under the top card of a pile. */
const PileEdges = ({ count }: { readonly count: number }) => (
  <>
    {count > 6 ? (
      <span
        className="absolute inset-0 -translate-x-[0.5em] -translate-y-[0.5em] rounded-[0.85em] brightness-50"
        style={{ background: BRONZE }}
      />
    ) : null}
    {count > 1 ? (
      <span
        className="absolute inset-0 -translate-x-[0.25em] -translate-y-[0.25em] rounded-[0.85em] brightness-75"
        style={{ background: BRONZE }}
      />
    ) : null}
  </>
);

/** The Deck Pile: Card Backs and the number of cards. It never shows which cards they are. */
const DeckPile = ({ count }: { readonly count: number }) => {
  const { tr } = useGameText();
  const label = tr("battle.deckCount", { count });
  return (
    <div
      title={label}
      className="relative w-[9em] shrink-0"
      data-testid="deck-pile"
      data-count={count}
    >
      <span className="sr-only">{label}</span>
      {count === 0 ? (
        <EmptyCardPlace />
      ) : (
        <>
          <PileEdges count={count} />
          <CardBack className="relative" />
        </>
      )}
      <PileBadge count={count} side="right" />
    </div>
  );
};

/**
 * The Graveyard Pile: the last card that went into the Graveyard, and the
 * number of cards. Hover, focus or a tap shows its Card Details.
 */
const GraveyardPile = ({
  cards,
  speed,
}: {
  readonly cards: readonly GraveyardCardView[];
  readonly speed: BattleSpeed;
}) => {
  const { tr, text } = useGameText();
  const [inspected, setInspected] = useState(false);
  const top = cards.at(-1);
  if (!top) {
    const label = tr("battle.graveyardCount", { count: 0 });
    return (
      <div
        title={label}
        className="relative w-[9em] shrink-0"
        data-testid="graveyard-pile"
        data-count={0}
      >
        <span className="sr-only">{label}</span>
        <EmptyCardPlace />
        <PileBadge count={0} side="left" />
      </div>
    );
  }
  const { countdown } = getCard(top.cardId);
  const label = tr("battle.graveyardTop", {
    count: cards.length,
    name: text(cardText(top.cardId, top.rank).name),
  });
  return (
    <div className="relative w-[9em] shrink-0">
      {inspected ? (
        <div className="pointer-events-none absolute right-0 bottom-full z-40 mb-16">
          <CardDetails
            cardId={top.cardId}
            rank={top.rank}
            countdown={countdown}
          />
        </div>
      ) : null}
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={inspected}
        className="relative block cursor-help rounded-[0.85em] outline-none focus-visible:ring-4 focus-visible:ring-[#fff2a8]"
        data-testid="graveyard-pile"
        data-count={cards.length}
        data-top-card={top.cardId}
        onClick={() => setInspected((open) => !open)}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            setInspected(true);
          }
        }}
        onPointerLeave={() => setInspected(false)}
        onFocus={() => setInspected(true)}
        onBlur={() => setInspected(false)}
      >
        <PileEdges count={cards.length} />
        {/* A new key for each new card replays the drop. */}
        <span
          key={cards.length}
          className="relative block animate-[graveyard-drop_var(--drop-ms)_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none"
          // SAFETY: a CSS custom property for the keyframes. React's
          // `CSSProperties` does not model custom properties.
          style={{ "--drop-ms": `${DROP_MS / speed}ms` } as CSSProperties}
        >
          <CardFrame
            cardId={top.cardId}
            rank={top.rank}
            countdown={countdown}
          />
        </span>
      </button>
      <PileBadge count={cards.length} side="left" />
    </div>
  );
};

/** The numbers of the empty Hand Slots after a Hand of `handSize` cards. */
const emptySlots = (handSize: number): readonly number[] =>
  Array.from(
    { length: Math.max(0, HAND_LIMIT - handSize) },
    (_, offset) => handSize + offset
  );

/** An empty Hand Slot. */
const EmptySlot = () => (
  <li className="w-[9em] shrink-0" data-testid="hand-slot-empty">
    <EmptyCardPlace />
  </li>
);

/** The details of the card under the pointer or the focus. */
const InspectedCard = ({
  card,
}: {
  readonly card: HandCardView | undefined;
}) =>
  card?.cardId && card.rank ? (
    <CardDetails
      cardId={card.cardId}
      rank={card.rank}
      countdown={card.countdown}
    />
  ) : null;

const HandHint = ({
  card,
  targetCount,
}: {
  readonly card: HandCardView | undefined;
  readonly targetCount: number;
}) => {
  const { tr } = useGameText();
  const hint = handHint(card, targetCount);
  return (
    <p
      className="pointer-events-none rounded bg-[#1c140e]/80 px-2 py-0.5 text-xs text-[#fff6df] empty:hidden"
      aria-live="polite"
    >
      {hint ? tr(hint) : null}
    </p>
  );
};

/**
 * One Hand Slot with a card. A card that the player cannot see shows nothing.
 * While its `CardDrawn` event plays, the card flies in from the Deck Pile. The
 * flight takes the time of the event, so it ends before the class goes away.
 */
const shownCard = (
  card: HandCardView
): card is HandCardView & {
  readonly cardId: string;
  readonly rank: NonNullable<HandCardView["rank"]>;
} => Boolean(card.cardId && card.rank);

const DRAW_CLASS =
  "animate-[hand-draw_var(--draw-ms)_cubic-bezier(0.2,0.8,0.2,1)_both] motion-reduce:animate-none";

const drawMotion = (drawMs: number | null) => drawMs !== null && DRAW_CLASS;

const drawStyle = (
  index: number,
  drawMs: number | null
): CSSProperties | undefined => {
  if (drawMs === null) {
    return undefined;
  }
  // SAFETY: CSS custom properties for the keyframes. React's
  // `CSSProperties` does not model custom properties.
  return {
    "--draw-from": `${-(index * SLOT_PITCH_EM + 9 + PILE_GAP_EM)}em`,
    "--draw-ms": `${drawMs}ms`,
  } as CSSProperties;
};

const dimmedCard = (dimmed: boolean) => dimmed && "opacity-40";

const HandSlot = ({
  card,
  index,
  drawMs,
  selected,
  dimmed,
  battle,
  onPress,
  setInspected,
  holdToInspect,
  cancelHold,
  onDragStart,
}: {
  readonly card: HandCardView;
  readonly index: number;
  /** The time of the `CardDrawn` event of this card, while it plays. */
  readonly drawMs: number | null;
  readonly selected: boolean;
  readonly dimmed: boolean;
  readonly battle: Battle;
  readonly onPress: (index: number, keyboard: boolean) => void;
  readonly setInspected: SetInspected;
  readonly holdToInspect: (inspect: () => void) => void;
  readonly cancelHold: () => void;
  readonly onDragStart: (drag: Drag) => void;
}) => {
  if (!shownCard(card)) {
    return null;
  }
  const forget = () =>
    setInspected((current) => (current === index ? null : current));
  return (
    <li
      className={cn("shrink-0", drawMotion(drawMs))}
      // SAFETY: CSS custom properties for the keyframes. React's
      // `CSSProperties` does not model custom properties.
      style={drawStyle(index, drawMs)}
    >
      <HandCard
        cardId={card.cardId}
        rank={card.rank}
        countdown={card.countdown}
        selected={selected}
        data-testid={`hand-card-${index}`}
        className={cn(dimmedCard(dimmed))}
        onClick={(event) => onPress(index, event.detail === 0)}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") {
            holdToInspect(() => setInspected(index));
          }
          if (card.countdown === 0 && battle.canAct) {
            onDragStart(startDrag(index, event.clientX, event.clientY));
          }
        }}
        onPointerUp={cancelHold}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            setInspected(index);
          }
        }}
        onPointerLeave={() => {
          cancelHold();
          forget();
        }}
        onFocus={() => setInspected(index)}
        onBlur={forget}
      />
    </li>
  );
};

/**
 * End Turn, a small gold button just above the Hand Bar.
 * Its right edge matches the outer edge of the bar (past the 0.2em border),
 * so a long label grows to the left and stays on the screen.
 */
const EndTurnPanel = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  return (
    <div className="pointer-events-auto absolute right-[-0.2em] bottom-full z-30 mb-3">
      <GameButton
        intent="gold"
        size="sm"
        isDisabled={!battle.canEndTurn}
        onPress={() => battle.endTurn()}
        data-testid="end-turn"
        className="font-display whitespace-nowrap"
      >
        <GlyphIcon glyph="speed" className="size-3.5" />
        {tr("battle.endTurn")}
      </GameButton>
    </div>
  );
};

/** The card that follows the pointer while it drags. */
const DragGhost = ({
  drag,
  hand,
}: {
  readonly drag: Drag | null;
  readonly hand: readonly HandCardView[];
}) => {
  const ghost = draggedCard(drag, hand);
  if (!ghost) {
    return null;
  }
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-3/4 scale-90 opacity-90"
      style={{ left: ghost.x, top: ghost.y }}
      aria-hidden
    >
      <HandCard
        cardId={ghost.cardId}
        rank={ghost.rank}
        countdown={0}
        selected
        tabIndex={-1}
      />
    </div>
  );
};

/** A bronze line between a pile and the Hand Slots. */
const PileDivider = () => (
  <span
    className="w-[0.16em] shrink-0 self-stretch rounded-full bg-[linear-gradient(180deg,transparent,rgba(231,187,106,0.55)_20%,rgba(231,187,106,0.55)_80%,transparent)]"
    style={{ marginInline: `${(PILE_GAP_EM - 0.16) / 2}em` }}
    aria-hidden
  />
);

/**
 * The Hand Bar (GDD 11.2): the Deck Pile, the Hand Slots, the Graveyard Pile,
 * and End Turn above the right end of the bar. A Ready card can be dragged
 * to a target, or tapped and then the target tapped.
 */
const drawnId = (playing: PlayingEvent | null): number | null => {
  if (playing?.event._tag === "CardDrawn" && playing.event.side === "player") {
    return playing.event.card.instanceId;
  }
  return null;
};

const cardAt = (
  hand: readonly HandCardView[],
  index: number | null,
  blocked: boolean
) => (index === null || blocked ? undefined : hand[index]);

const selectedCard = (hand: readonly HandCardView[], index: number | null) =>
  index === null ? undefined : hand[index];

const HAND_GLOW =
  "shadow-[0_0_24px_rgba(127,227,255,0.75)] ring-4 ring-[#7fe3ff]";

const handGlow = (on: boolean) => on && HAND_GLOW;

const tutorialFlag = (on: boolean) => on || undefined;

const slotDrawMs = (
  playing: PlayingEvent | null,
  card: HandCardView,
  drawingId: number | null
) => (playing && card.instanceId === drawingId ? playing.duration : null);

export const HandBar = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const [inspected, setInspected] = useState<number | null>(null);
  const { drag, setDrag, holdToInspect, cancelHold } = useCardDrag(battle);
  const marks = useAtomValue(tutorialMarksAtom);
  // Only one Card Details shows at a time: those of a Unit come first.
  const unitInspected = useAtomValue(detailsUnitAtom) !== null;
  const { session, selected, targets } = battle;
  if (!session) {
    return null;
  }
  const { player } = session.view.sides;
  const { hand } = player;
  const dragIndex = activeDragIndex(drag);
  const playing = session.current;
  const drawingId = drawnId(playing);

  const press = (index: number, keyboard: boolean) => {
    const action = pressAction({
      card: hand[index],
      index,
      selected,
      canAct: battle.canAct,
      keyboard,
      focusedTarget: battle.targets[battle.focused],
    });
    if (action._tag === "inspect") {
      setInspected(index);
      return;
    }
    if (action._tag === "play") {
      battle.play(action.target, index);
      return;
    }
    battle.select(action.index);
  };

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end p-2 pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))]">
      {/* 2 spacers of equal growth keep the bar at the middle of the screen. */}
      <div className="min-w-0 flex-1" aria-hidden />
      <div
        className={cn(
          "pointer-events-auto relative flex shrink-0 items-stretch rounded-[1.3em] border-[0.2em] border-[#2a170a] border-t-[#b47f36] p-[0.7em] text-[length:var(--hand-card-size)] shadow-[inset_0_0.15em_0_rgba(255,214,150,0.3),inset_0_-0.3em_0.6em_rgba(0,0,0,0.45),0_0.6em_1.6em_rgba(0,0,0,0.55)] [@media(max-height:500px)]:p-[0.5em]",
          // The card size: 10px (7px on a short screen), or less so that the
          // bar (about 101em) and the screen padding fit the screen width.
          "[--hand-card-size:min(10px,calc((100vw_-_40px)/101))] [@media(max-height:500px)]:[--hand-card-size:min(7px,calc((100vw_-_40px)/101))]"
        )}
        style={{
          // Dark wood that matches the Board rim, with a faint grain.
          background: [
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 0.15em, transparent 0.15em 1.1em)",
            "linear-gradient(180deg, #6b4423 0%, #4a2d16 45%, #2f1c0d 100%)",
          ].join(", "),
        }}
        data-testid="hand-bar"
      >
        <DeckPile count={player.deck} />
        <PileDivider />

        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-[2em] flex -translate-x-1/2 flex-col items-center gap-3">
            <InspectedCard card={cardAt(hand, inspected, unitInspected)} />
            <HandHint
              card={selectedCard(hand, selected)}
              targetCount={targets.length}
            />
          </div>
          <ol
            aria-label={tr("battle.hand")}
            className={cn(
              "flex items-end gap-[0.6em] rounded-[0.9em]",
              // Tutorial Step 1: a highlight on the Hand (GDD 8.3).
              handGlow(marks.hand)
            )}
            data-testid="hand"
            data-tutorial-highlight={tutorialFlag(marks.hand)}
          >
            {hand.map((card, index) => (
              <HandSlot
                key={card.instanceId}
                card={card}
                index={index}
                drawMs={slotDrawMs(playing, card, drawingId)}
                selected={selected === index}
                dimmed={dragIndex === index}
                battle={battle}
                onPress={press}
                setInspected={setInspected}
                holdToInspect={holdToInspect}
                cancelHold={cancelHold}
                onDragStart={setDrag}
              />
            ))}
            {emptySlots(hand.length).map((slot) => (
              <EmptySlot key={slot} />
            ))}
          </ol>
        </div>

        <PileDivider />
        <GraveyardPile cards={player.graveyard} speed={battle.speed} />
        <EndTurnPanel battle={battle} />
      </div>
      <div className="min-w-0 flex-1" aria-hidden />

      <DragGhost drag={drag} hand={hand} />
    </footer>
  );
};
