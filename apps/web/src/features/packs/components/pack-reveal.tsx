import type { RankId } from "@workspace/rules";
import { coinDenominations, getCard, TEN_PACKS } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  Modal,
  ModalOverlay,
  Popover,
} from "react-aria-components";

import type { SoundName } from "@/features/battle/battle-audio";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { CardBack } from "@/features/battle/components/card-back";
import { CardDetails } from "@/features/battle/components/card-details";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { RANK_COLORS } from "@/features/battle/palette";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import { FoundMeter } from "@/features/packs/components/found-meter";
import { CoinPrice, PackArt } from "@/features/packs/components/pack-art";
import type {
  GridCard,
  PackOrder,
  PoolProgress,
  RevealedCard,
  RevealedPack,
} from "@/features/packs/packs";
import {
  bestRank,
  newCardCount,
  tenPackGrid,
  tenPackHighlights,
} from "@/features/packs/packs";
import { useCoinFormat } from "@/features/packs/use-coin-format";

/** The Pack lifts and shakes (`pack-shake`), then it tears open (`pack-tear-*`). */
const SHAKE_MS = 520;

/** The time between two cards of "Reveal all". */
const REVEAL_STEP_MS = 140;

/** The time between two face-down cards that fan out of the Pack. */
const FAN_STEP_MS = 90;

/**
 * The flip has turned past its middle at this time, so the face shows: the
 * Rank burst and the Rank chime start here.
 */
const FACE_MS = 200;

/** The light of each Rank. Legendary is a warm gold, so it reads as treasure. */
const RANK_LIGHT: Readonly<Record<RankId, string>> = {
  common: "#ffe6b0",
  uncommon: RANK_COLORS.uncommon,
  rare: RANK_COLORS.rare,
  epic: RANK_COLORS.epic,
  legendary: "#ffc94a",
};

/**
 * The glow on the back of a card before its flip: Rare blue, Epic purple and
 * Legendary gold. Common and Uncommon have no glow.
 */
const BACK_GLOW: Readonly<Partial<Record<RankId, string>>> = {
  rare: RANK_LIGHT.rare,
  epic: RANK_LIGHT.epic,
  legendary: RANK_LIGHT.legendary,
};

/** The chime of a revealed card. Common and Uncommon have only the turn. */
const RANK_CHIME: Readonly<Partial<Record<RankId, SoundName>>> = {
  rare: "revealRare",
  epic: "revealEpic",
  legendary: "revealLegendary",
};

/**
 * The light out of the tear: the color of the best card in the Pack when it is
 * Rare or higher, else a warm lamp light. It tells the Player what is coming.
 */
const tearLight = (rank: RankId): string =>
  BACK_GLOW[rank] ?? RANK_LIGHT.common;

/**
 * The sounds of a flip, in time with it: the turn, then the chime of a Rare+
 * card when its face shows. The timers stop when the reveal closes. The
 * sounds follow the Sound setting.
 */
const useFlipSounds = () => {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  const later = (ms: number, sound: SoundName) => {
    timers.current.push(window.setTimeout(() => playSound(sound, 0), ms));
  };
  return (rank: RankId, delay: number) => {
    unlockAudio();
    later(delay, "cardFlip");
    const chime = RANK_CHIME[rank];
    if (chime) {
      later(delay + FACE_MS, chime);
    }
  };
};

/** Each side of a card in its flip: the side that faces away does not show. */
const FACE: CSSProperties = { backfaceVisibility: "hidden" };

/** The state of one reveal. */
type Phase =
  | { readonly kind: "opening" }
  /** One Pack: the 5 cards, and the cards that show their face. */
  | {
      readonly kind: "cards";
      readonly flipped: readonly number[];
      /** Skip: the faces show at once, with no flip. */
      readonly instant: boolean;
    }
  /** Open ×10: one Epic or Legendary card at a time, before the grid. */
  | {
      readonly kind: "highlight";
      readonly index: number;
      readonly flipped: boolean;
    }
  | { readonly kind: "grid" };

/** All the cards of one Pack show their face. */
const ALL_FACES: Phase = {
  kind: "cards",
  flipped: [0, 1, 2, 3, 4],
  instant: true,
};

/** Reduced motion: the cards show at once, with no glow and no flip. */
const firstPhase = (ten: boolean, reduced: boolean): Phase => {
  if (!reduced) {
    return { kind: "opening" };
  }
  return ten ? { kind: "grid" } : ALL_FACES;
};

const afterOpening = (ten: boolean, highlights: number): Phase => {
  if (!ten) {
    return { kind: "cards", flipped: [], instant: false };
  }
  return highlights > 0
    ? { kind: "highlight", index: 0, flipped: false }
    : { kind: "grid" };
};

/** The glow behind a face-down card, in its Rank color. */
const Glow = ({ rank }: { readonly rank: RankId }) => {
  const color = BACK_GLOW[rank];
  if (!color) {
    return null;
  }
  return (
    <span
      className="absolute inset-0 rounded-[0.85em] motion-safe:animate-[pack-glow_1.6s_ease-in-out_infinite]"
      style={{
        boxShadow: `0 0 1em 0.35em ${color}, 0 0 2.6em 0.9em ${color}99`,
      }}
      data-testid="pack-glow"
      data-rank={rank}
      aria-hidden
    />
  );
};

/** The NEW chip. After a flip, it stamps onto the card (`stamp` is its delay). */
const NewBadge = ({ stamp }: { readonly stamp?: number }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "absolute -top-[0.7em] left-1/2 z-20 -translate-x-1/2 rounded-[4px] border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1.5 py-px text-[max(10px,0.85em)] leading-tight font-black tracking-wide text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.45)]",
        stamp !== undefined &&
          "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      )}
      style={stamp === undefined ? undefined : { animationDelay: `${stamp}ms` }}
      data-testid="card-new"
      aria-hidden
    >
      {tr("packs.reveal.new")}
    </span>
  );
};

/**
 * The light of a flip, behind the card, when its face shows. It grows with
 * the Rank: Uncommon has a ring; Rare a ring and a burst; Epic adds turning
 * rays; Legendary has all of them larger, with a second ring. Common has
 * none: the turn is enough.
 */
const RankBurst = ({
  rank,
  delay,
}: {
  readonly rank: RankId;
  readonly delay: number;
}) => {
  if (rank === "common") {
    return null;
  }
  const color = RANK_LIGHT[rank];
  const legendary = rank === "legendary";
  const start = (extra = 0): CSSProperties => ({
    animationDelay: `${delay + FACE_MS + extra}ms`,
  });
  const ring =
    "absolute top-1/2 left-1/2 h-[12.6em] w-[9em] -translate-1/2 rounded-[0.85em] border-[0.22em] opacity-0";
  return (
    <span
      className="pointer-events-none absolute inset-0 -z-10"
      data-testid="pack-burst"
      data-rank={rank}
      aria-hidden
    >
      {rank === "uncommon" ? null : (
        <span
          className={cn(
            "absolute top-1/2 left-1/2 aspect-square -translate-1/2 rounded-full opacity-0 motion-safe:animate-[pack-burst_900ms_ease-out_both]",
            legendary ? "w-[36em]" : "w-[24em]"
          )}
          style={{
            ...start(),
            background: `radial-gradient(closest-side, ${color}d9, ${color}4d 45%, transparent)`,
          }}
        />
      )}
      {rank === "epic" || legendary ? (
        <span
          className={cn(
            "absolute top-1/2 left-1/2 aspect-square -translate-1/2 rounded-full opacity-0 motion-safe:animate-[pack-rays_1300ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
            legendary ? "w-[44em]" : "w-[30em]"
          )}
          style={{
            ...start(),
            background: `repeating-conic-gradient(from 4deg, ${color}b3 0deg 5deg, transparent 5deg 22deg)`,
            maskImage: "radial-gradient(closest-side, black 22%, transparent)",
          }}
        />
      ) : null}
      <span
        className={cn(
          ring,
          "motion-safe:animate-[pack-ring_700ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={{ ...start(), borderColor: color }}
      />
      {legendary ? (
        <span
          className={cn(
            ring,
            "motion-safe:animate-[pack-ring_900ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          )}
          style={{ ...start(220), borderColor: color }}
        />
      ) : null}
    </span>
  );
};

/**
 * The Card Details of a revealed card: hover after a short delay, keyboard
 * focus, or a long press, as in the Deck builder. They open beside the card,
 * out of the reveal, so that the scroll of the grid never cuts them. A
 * face-down card has no Card Details.
 */
interface RevealPeek {
  readonly bind: (target: Peek) => object;
  readonly details: (
    target: Peek,
    anchor: RefObject<HTMLElement | null>
  ) => ReactNode;
}

const useRevealPeek = (): RevealPeek => {
  const { peek, bind, hide } = useCardPeek();
  const details: RevealPeek["details"] = (target, anchor) =>
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
        placement="right"
        offset={12}
        className="fade-in animate-in pointer-events-none duration-150 motion-reduce:animate-none"
        data-testid="reveal-peek"
      >
        <CardDetails cardId={target.cardId} rank={target.rank} />
      </Popover>
    ) : null;
  return { bind, details };
};

/** The words that a screen reader says for a revealed card. */
const useCardWords = () => {
  const { tr } = useGameText();
  return (card: RevealedCard, copies = 1) =>
    [
      tr(`cards.${card.cardId}.name`),
      tr(`ranks.${card.rank}`),
      copies > 1 ? tr("packs.reveal.copies", { count: copies }) : null,
      card.isNew ? tr("packs.reveal.newCard") : null,
    ]
      .filter((part) => part !== null)
      .join(", ");
};

/**
 * One card of the reveal: the Card Back with its Rank glow, then the flip to
 * the Card Frame, with the Rank burst behind it and the NEW chip stamped on
 * it. A Legendary card jumps a little toward the Player. The size is in `em`,
 * as the Card Frame: the parent font size sets it. Before the flip, a press
 * flips it. After the flip, hover, keyboard focus or a long press shows its
 * Card Details.
 */
const FlipCard = ({
  card,
  flipped,
  instant,
  delay,
  label,
  onFlip,
  peek,
  place,
  testId,
}: {
  readonly card: RevealedCard;
  readonly flipped: boolean;
  readonly instant: boolean;
  readonly delay: number;
  readonly label: string;
  readonly onFlip: () => void;
  readonly peek: RevealPeek;
  readonly place: string;
  readonly testId: string;
}) => {
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = {
    cardId: card.cardId,
    rank: card.rank,
    from: "packs",
    place,
  };
  return (
    <>
      <Button
        ref={trigger}
        {...(flipped ? peek.bind(target) : { onPress: onFlip })}
        aria-label={label}
        className={cn(
          "group relative isolate block h-[12.6em] w-[9em] rounded-[0.85em] outline-none [perspective:60em] data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          flipped ? "cursor-default" : "cursor-pointer",
          flipped &&
            !instant &&
            card.rank === "legendary" &&
            "motion-safe:animate-[pack-pop_560ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={{ animationDelay: `${delay + FACE_MS}ms` }}
        data-testid={testId}
        data-card={card.cardId}
        data-rank={card.rank}
        data-flipped={flipped || undefined}
      >
        {flipped && !instant ? (
          <RankBurst rank={card.rank} delay={delay} />
        ) : null}
        <span
          className={cn(
            "relative block size-full [transform-style:preserve-3d]",
            !instant &&
              "transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
            flipped && "[transform:rotateY(180deg)]"
          )}
          style={{ transitionDelay: `${delay}ms` }}
        >
          <span className="absolute inset-0" style={FACE}>
            {flipped ? null : <Glow rank={card.rank} />}
            <CardBack className="relative transition-transform duration-150 ease-out group-data-[hovered]:-translate-y-[0.4em] group-data-[hovered]:-rotate-2" />
          </span>
          <span
            className="absolute inset-0 [transform:rotateY(180deg)]"
            style={FACE}
          >
            <CardFrame
              cardId={card.cardId}
              rank={card.rank}
              countdown={getCard(card.cardId).countdown}
            />
            {card.isNew && flipped ? (
              <NewBadge stamp={instant ? 0 : delay + FACE_MS + 260} />
            ) : null}
          </span>
        </span>
      </Button>
      {/* Only a flipped card binds the peek, so a face-down card has no Card Details. */}
      {peek.details(target, trigger)}
    </>
  );
};

/** The name and the Rank under a card, after its flip. */
const CardName = ({
  card,
  shown,
  delay,
}: {
  readonly card: RevealedCard;
  readonly shown: boolean;
  readonly delay: number;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "mt-2 flex w-[9em] flex-col items-center text-center leading-tight",
        shown
          ? "motion-safe:animate-[pack-name_300ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          : "invisible"
      )}
      style={{ animationDelay: `${delay + 350}ms` }}
      aria-hidden
    >
      <span className="font-display text-[max(12px,1.05em)] font-bold text-[#fff6df]">
        {tr(`cards.${card.cardId}.name`)}
      </span>
      <span
        className="text-[max(10px,0.85em)] font-bold"
        style={{ color: RANK_COLORS[card.rank] }}
      >
        {tr(`ranks.${card.rank}`)}
      </span>
    </span>
  );
};

/** A line under the cards when a rule gave a card of the Guarantee Rank. */
const GuaranteeNote = ({ pack }: { readonly pack: RevealedPack }) => {
  const { tr } = useGameText();
  if (pack.guaranteedBy === null) {
    return null;
  }
  return (
    <p
      className="rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-3 py-1 text-xs font-bold text-[#fff6df]"
      data-testid="guarantee-note"
    >
      {tr(
        pack.guaranteedBy === "packGuarantee"
          ? "packs.reveal.byGuarantee"
          : "packs.reveal.byTenBonus"
      )}
    </p>
  );
};

/**
 * A key for each card of a Pack. A Pack can have two copies of one card in one
 * Rank, so the second copy gets its count.
 */
const placeKeys = (cards: readonly RevealedCard[]): readonly string[] => {
  const counts = new Map<string, number>();
  return cards.map((card) => {
    const id = `${card.cardId}:${card.rank}`;
    const count = (counts.get(id) ?? 0) + 1;
    counts.set(id, count);
    return `${id}:${count}`;
  });
};

const ACTIONS =
  "flex flex-wrap items-center justify-center gap-2 [@media(max-height:500px)]:gap-1.5";

/** The same Pack again: its price, or `null` when the Coin is not enough. */
export interface AgainOffer {
  readonly price: number;
}

/**
 * The end of a reveal: what the Pack gave the Collection ("New cards: 3",
 * and the "Cards found" groove that fills from the count before the Pack),
 * then Open another (wood, with its price) and Done (gold).
 */
const RevealEnd = ({
  name,
  packs,
  progress,
  again,
  onAgain,
  onClose,
  testId,
}: {
  readonly name: string;
  readonly packs: readonly RevealedPack[];
  readonly progress: PoolProgress;
  readonly again: AgainOffer | null;
  readonly onAgain: () => void;
  readonly onClose: () => void;
  readonly testId: string;
}) => {
  const { tr } = useGameText();
  const { format, words } = useCoinFormat();
  const fresh = newCardCount(packs);
  const after: PoolProgress = {
    found: Math.min(progress.total, progress.found + fresh),
    total: progress.total,
  };
  return (
    <>
      <div
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-4 py-2 shadow-[0_3px_0_rgba(0,0,0,0.45)] motion-safe:duration-300 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-1"
        data-testid={testId}
        data-fresh={fresh}
      >
        <p
          className={cn(
            "text-sm leading-tight font-bold",
            fresh > 0 ? "text-[#ffe08a]" : "text-[#e8d9bb]"
          )}
          data-testid="collection-gain"
        >
          {fresh > 0
            ? tr("packs.reveal.gain", { count: fresh })
            : tr("packs.reveal.noneNew")}
        </p>
        <FoundMeter progress={after} from={progress.found} />
      </div>
      <div className={ACTIONS}>
        {again ? (
          <GameButton
            intent="wood"
            size="lg"
            onPress={onAgain}
            aria-label={tr("packs.againLabel", {
              pack: name,
              price: words(again.price),
            })}
            className="gap-3 text-base"
            data-testid="reveal-again"
          >
            {tr("packs.again")}
            <CoinPrice
              parts={coinDenominations(again.price)}
              format={format}
              className="text-sm font-bold"
            />
          </GameButton>
        ) : null}
        <GameButton
          intent="gold"
          size="lg"
          autoFocus
          onPress={onClose}
          className="font-display min-w-40"
          data-testid="reveal-done"
        >
          {tr("packs.reveal.done")}
        </GameButton>
      </div>
    </>
  );
};

/**
 * One Pack: 5 face-down cards fan out of the Pack into a row, with the best
 * card last.
 */
const SingleReveal = ({
  name,
  pack,
  phase,
  setPhase,
  progress,
  again,
  onAgain,
  onClose,
}: {
  readonly name: string;
  readonly pack: RevealedPack;
  readonly phase: Extract<Phase, { kind: "cards" }>;
  readonly setPhase: (phase: Phase) => void;
  readonly progress: PoolProgress;
  readonly again: AgainOffer | null;
  readonly onAgain: () => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const words = useCardWords();
  const sounds = useFlipSounds();
  const peek = useRevealPeek();
  const [delays, setDelays] = useState<readonly number[]>([]);
  const shown = new Set(phase.flipped);
  const allShown = shown.size === pack.cards.length;
  const middle = (pack.cards.length - 1) / 2;

  const flip = (index: number) => {
    const card = pack.cards[index];
    if (card) {
      sounds(card.rank, 0);
    }
    setDelays([]);
    setPhase({ ...phase, flipped: [...phase.flipped, index] });
  };

  /** The face-down cards flip one after the other, from the first. */
  const revealAll = () => {
    const hidden: number[] = [];
    const next: number[] = [];
    for (const [index, card] of pack.cards.entries()) {
      const delay = shown.has(index) ? 0 : hidden.length * REVEAL_STEP_MS;
      next.push(delay);
      if (!shown.has(index)) {
        sounds(card.rank, delay);
        hidden.push(index);
      }
    }
    setDelays(next);
    setPhase({ ...phase, flipped: [...phase.flipped, ...hidden] });
  };

  return (
    <>
      <ol
        className="flex items-start justify-center gap-[1em] text-[clamp(13px,1.9dvh,17px)] [@media(max-height:500px)]:gap-[0.8em] [@media(max-height:500px)]:text-[8.5px]"
        data-testid="reveal-cards"
      >
        {placeKeys(pack.cards).map((key, index) => {
          const card = pack.cards[index];
          if (!card) {
            return null;
          }
          const flipped = shown.has(index);
          const delay = delays[index] ?? 0;
          return (
            <li
              key={key}
              className="flex flex-col items-center motion-safe:animate-[pack-fan_560ms_cubic-bezier(0.16,1,0.3,1)_both]"
              // SAFETY: CSS custom properties for the keyframes. React's
              // `CSSProperties` does not model custom properties.
              style={
                {
                  animationDelay: `${index * FAN_STEP_MS}ms`,
                  // Each card starts at the center, where the Pack was: one
                  // place is a card and a gap, 10em.
                  "--fan-x": `${(middle - index) * 10}em`,
                  "--fan-rotate": `${(index - middle) * -7}deg`,
                } as CSSProperties
              }
            >
              <FlipCard
                card={card}
                flipped={flipped}
                instant={phase.instant}
                delay={delay}
                label={
                  flipped
                    ? words(card)
                    : tr("packs.reveal.faceDown", {
                        number: index + 1,
                        count: pack.cards.length,
                      })
                }
                onFlip={() => flip(index)}
                peek={peek}
                place={key}
                testId={`reveal-card-${index}`}
              />
              <CardName card={card} shown={flipped} delay={delay} />
            </li>
          );
        })}
      </ol>
      {allShown ? <GuaranteeNote pack={pack} /> : null}
      {allShown ? (
        <RevealEnd
          name={name}
          packs={[pack]}
          progress={progress}
          again={again}
          onAgain={onAgain}
          onClose={onClose}
          testId="reveal-summary"
        />
      ) : (
        <div className={ACTIONS}>
          <GameButton
            intent="wood"
            onPress={() => setPhase(ALL_FACES)}
            data-testid="reveal-skip"
          >
            {tr("packs.reveal.skip")}
          </GameButton>
          <GameButton
            intent="gold"
            autoFocus
            onPress={revealAll}
            className="font-display"
            data-testid="reveal-all"
          >
            {tr("packs.reveal.revealAll")}
          </GameButton>
        </div>
      )}
    </>
  );
};

/** Open ×10: a full flip for each Epic and Legendary card, one at a time. */
const Highlight = ({
  cards,
  phase,
  setPhase,
}: {
  readonly cards: readonly RevealedCard[];
  readonly phase: Extract<Phase, { kind: "highlight" }>;
  readonly setPhase: (phase: Phase) => void;
}) => {
  const { tr } = useGameText();
  const words = useCardWords();
  const sounds = useFlipSounds();
  const peek = useRevealPeek();
  const card = cards[phase.index];
  if (!card) {
    return null;
  }
  const last = phase.index === cards.length - 1;
  const flip = () => {
    sounds(card.rank, 0);
    setPhase({ ...phase, flipped: true });
  };
  const next = () =>
    setPhase(
      last
        ? { kind: "grid" }
        : { kind: "highlight", index: phase.index + 1, flipped: false }
    );
  return (
    <>
      <p
        className="text-sm font-bold text-[#e8d9bb]"
        data-testid="highlight-count"
      >
        {tr("packs.reveal.highlightCount", {
          number: phase.index + 1,
          count: cards.length,
        })}
      </p>
      <div
        key={phase.index}
        className="flex flex-col items-center text-[20px] motion-safe:animate-[pack-deal_420ms_cubic-bezier(0.2,0.8,0.2,1)_both] [@media(max-height:500px)]:text-[13px]"
      >
        <FlipCard
          card={card}
          flipped={phase.flipped}
          instant={false}
          delay={0}
          label={phase.flipped ? words(card) : tr("packs.reveal.faceDownOne")}
          onFlip={flip}
          peek={peek}
          place={String(phase.index)}
          testId="highlight-card"
        />
        <CardName card={card} shown={phase.flipped} delay={0} />
      </div>
      <div className={ACTIONS}>
        <GameButton
          intent="wood"
          onPress={() => setPhase({ kind: "grid" })}
          data-testid="reveal-skip"
        >
          {tr("packs.reveal.skip")}
        </GameButton>
        <GameButton
          // The flip moves the focus here, so Enter goes on to the next card.
          key={phase.flipped ? "next" : "flip"}
          intent="gold"
          autoFocus
          onPress={phase.flipped ? next : flip}
          className="font-display"
          data-testid={phase.flipped ? "highlight-next" : "highlight-flip"}
        >
          {phase.flipped
            ? last
              ? tr("packs.reveal.seeAll")
              : tr("packs.reveal.next")
            : tr("packs.reveal.flip")}
        </GameButton>
      </div>
    </>
  );
};

/**
 * One place in the Open ×10 grid: the card, its copies and the NEW badge.
 * Hover, keyboard focus or a long press shows its Card Details.
 */
const GridPlace = ({
  card,
  peek,
}: {
  readonly card: GridCard;
  readonly peek: RevealPeek;
}) => {
  const { tr } = useGameText();
  const words = useCardWords();
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = { cardId: card.cardId, rank: card.rank, from: "packs" };
  return (
    <li
      className="relative flex flex-col items-center"
      data-testid="grid-card"
      data-card={card.cardId}
      data-rank={card.rank}
      data-new={card.isNew || undefined}
    >
      <Button
        ref={trigger}
        {...peek.bind(target)}
        aria-label={words(card, card.copies)}
        className="relative block cursor-default rounded-[0.85em] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      >
        <CardFrame
          cardId={card.cardId}
          rank={card.rank}
          countdown={getCard(card.cardId).countdown}
        />
        {card.isNew ? <NewBadge /> : null}
        {card.copies > 1 ? (
          <span className="absolute -right-[0.4em] -bottom-[0.4em] z-20 flex h-[2em] min-w-[2.4em] items-center justify-center rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e] px-[0.4em] text-[max(10px,1.1em)] leading-none font-black text-[#fff6df] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.45)]">
            {tr("packs.reveal.copies", { count: card.copies })}
          </span>
        ) : null}
      </Button>
      {peek.details(target, trigger)}
    </li>
  );
};

/** Open ×10: all the cards, from the highest Rank, with NEW badges. */
const Grid = ({
  name,
  packs,
  progress,
  again,
  onAgain,
  onClose,
}: {
  readonly name: string;
  readonly packs: readonly RevealedPack[];
  readonly progress: PoolProgress;
  readonly again: AgainOffer | null;
  readonly onAgain: () => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const peek = useRevealPeek();
  const places = tenPackGrid(packs);
  const cards = packs.flatMap((pack) => pack.cards);
  return (
    <>
      <p className="text-sm font-bold text-[#e8d9bb]">
        {tr("packs.reveal.summary", {
          cards: cards.length,
          fresh: newCardCount(packs),
        })}
      </p>
      {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the Card Frame size (em); the text in the frame has its own size */}
      <ol
        className="grid min-h-0 w-full max-w-[1100px] grid-cols-[repeat(auto-fill,9em)] justify-center gap-x-[0.8em] gap-y-[1.4em] overflow-y-auto px-[1em] pt-[1.2em] pb-[0.8em] text-[7.5px] [@media(max-height:500px)]:text-[6px]"
        data-testid="reveal-grid"
      >
        {places.map((card) => (
          <GridPlace
            key={`${card.cardId}:${card.rank}`}
            card={card}
            peek={peek}
          />
        ))}
      </ol>
      <RevealEnd
        name={name}
        packs={packs}
        progress={progress}
        again={again}
        onAgain={onAgain}
        onClose={onClose}
        testId="grid-summary"
      />
    </>
  );
};

/** The tear of a Pack: a zigzag line near its top, in percent of the Pack. */
const TEAR_EDGE = Array.from(
  { length: 11 },
  (_, index) => `${100 - index * 10}% ${index % 2 === 0 ? 19 : 23}%`
);
const TEAR_TOP = `polygon(0% 0%, 100% 0%, ${TEAR_EDGE.join(", ")})`;
const TEAR_BODY = `polygon(${TEAR_EDGE.toReversed().join(", ")}, 100% 100%, 0% 100%)`;

/**
 * The Pack opens: it lifts and shakes, then it tears along its top. The top
 * strip flies off, the body drops away, and a light comes out of the tear in
 * the color of the best card (`light`). Then the cards come out.
 */
const PackTear = ({
  order,
  light,
  onDone,
}: {
  readonly order: PackOrder;
  readonly light: string;
  readonly onDone: () => void;
}) => {
  useEffect(() => {
    const timer = window.setTimeout(() => playSound("packTear", 0), SHAKE_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div
      className="relative w-44 text-[16px] motion-safe:animate-[pack-shake_520ms_cubic-bezier(0.3,0.7,0.2,1)_both] [@media(max-height:500px)]:w-24 [@media(max-height:500px)]:text-[9px]"
      data-testid="pack-opening"
    >
      <span
        className="pointer-events-none absolute top-[21%] left-1/2 aspect-square w-[280%] -translate-1/2 rounded-full opacity-0 motion-safe:animate-[pack-burst_800ms_ease-out_both]"
        style={{
          animationDelay: `${SHAKE_MS - 60}ms`,
          background: `radial-gradient(closest-side, ${light}, ${light}66 32%, transparent)`,
        }}
        data-testid="pack-tear-light"
        data-light={light}
        aria-hidden
      />
      <div
        className="relative motion-safe:animate-[pack-tear-body_480ms_cubic-bezier(0.5,0,0.75,0)_both]"
        style={{ clipPath: TEAR_BODY, animationDelay: `${SHAKE_MS + 60}ms` }}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) {
            onDone();
          }
        }}
      >
        <PackArt pack={order.pack} race={order.race} />
      </div>
      <div
        className="absolute inset-0 motion-safe:animate-[pack-tear-top_520ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        style={{ clipPath: TEAR_TOP, animationDelay: `${SHAKE_MS}ms` }}
      >
        <PackArt pack={order.pack} race={order.race} />
      </div>
    </div>
  );
};

/**
 * The reveal of opened Packs, on the shop counter: the shop stays in view
 * behind it, blurred and dark, under the light of the lamp. One Pack: the
 * Pack tears open, then 5 face-down cards fan out of it, with the best card
 * last. A Rare, Epic or Legendary card glows on its back. A press flips one
 * card; "Reveal all" flips the others one after the other; "Skip" shows them
 * at once. Each flip has a light and a chime that grow with the Rank. Open
 * ×10: a full flip for each Epic and Legendary card, then a grid of all the
 * cards. At the end, the Collection groove fills with the new cards, and Open
 * another buys the same Pack again. With reduced motion, the cards show at
 * once, with no glow, flip or light. Esc closes it: the cards are in the
 * Collection already.
 */
export const PackReveal = ({
  order,
  packs,
  progress,
  again,
  onAgain,
  onClose,
}: {
  readonly order: PackOrder;
  readonly packs: readonly RevealedPack[];
  /** The "Cards found" count of the pool before these Packs. */
  readonly progress: PoolProgress;
  readonly again: AgainOffer | null;
  readonly onAgain: () => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const ten = order.count === TEN_PACKS;
  const highlights = ten ? tenPackHighlights(packs) : [];
  const [phase, setPhase] = useState<Phase>(() =>
    firstPhase(ten, prefersReducedMotion())
  );
  const name = tr(`packs.names.${order.pack}`);
  const [first] = packs;

  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      className="motion-safe:animate-in motion-safe:fade-in fixed inset-0 z-[60] bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,rgba(36,22,14,0.8),rgba(20,12,8,0.9)_60%,rgba(12,8,5,0.96))] backdrop-blur-[6px] motion-safe:duration-300"
    >
      <Modal className="relative size-full">
        {/* The light of the lamp over the counter. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[85%] bg-[radial-gradient(ellipse_34%_100%_at_50%_0%,rgba(255,206,140,0.2),rgba(255,190,110,0.06)_55%,transparent_80%)] opacity-85 motion-safe:animate-[shop-lamp_5.5s_ease-in-out_infinite]"
          aria-hidden
        />
        <Dialog
          aria-label={tr("packs.reveal.label", { pack: name })}
          className="relative flex size-full flex-col items-center justify-center gap-4 p-4 text-[#fff6df] outline-none [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-2"
          data-testid="pack-reveal"
          data-phase={phase.kind}
        >
          <h2 className="font-display text-2xl font-black text-[#ffe08a] [text-shadow:0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:text-lg">
            {ten
              ? tr("packs.reveal.tenTitle", { pack: name, count: packs.length })
              : name}
          </h2>
          {phase.kind === "opening" ? (
            <PackTear
              order={order}
              light={tearLight(bestRank(packs))}
              onDone={() => setPhase(afterOpening(ten, highlights.length))}
            />
          ) : null}
          {phase.kind === "cards" && first ? (
            <SingleReveal
              name={name}
              pack={first}
              phase={phase}
              setPhase={setPhase}
              progress={progress}
              again={again}
              onAgain={onAgain}
              onClose={onClose}
            />
          ) : null}
          {phase.kind === "highlight" ? (
            <Highlight cards={highlights} phase={phase} setPhase={setPhase} />
          ) : null}
          {phase.kind === "grid" ? (
            <Grid
              name={name}
              packs={packs}
              progress={progress}
              again={again}
              onAgain={onAgain}
              onClose={onClose}
            />
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
