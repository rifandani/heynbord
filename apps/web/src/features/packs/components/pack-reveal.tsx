import type { RankId } from "@workspace/rules";
import { getCard, TEN_PACKS } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Button, Dialog, Modal, ModalOverlay } from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { CardBack } from "@/features/battle/components/card-back";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { RANK_COLORS } from "@/features/battle/palette";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { PackArt } from "@/features/packs/components/pack-art";
import type {
  GridCard,
  PackOrder,
  RevealedCard,
  RevealedPack,
} from "@/features/packs/packs";
import { tenPackGrid, tenPackHighlights } from "@/features/packs/packs";

/** The Pack lifts, shakes and fades before the cards come in (`pack-open`). */
const OPEN_MS = 700;

/** The time between two cards of "Reveal all". */
const REVEAL_STEP_MS = 140;

/**
 * The glow on the back of a card before its flip: Rare blue, Epic purple and
 * Legendary gold. Common and Uncommon have no glow.
 */
const BACK_GLOW: Readonly<Partial<Record<RankId, string>>> = {
  rare: RANK_COLORS.rare,
  epic: RANK_COLORS.epic,
  legendary: "#ffc94a",
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

const NewBadge = () => {
  const { tr } = useGameText();
  return (
    <span
      className="absolute -top-[0.7em] left-1/2 z-20 -translate-x-1/2 rounded-[4px] border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1.5 py-px text-[max(10px,0.85em)] leading-tight font-black tracking-wide text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.45)]"
      data-testid="card-new"
      aria-hidden
    >
      {tr("packs.reveal.new")}
    </span>
  );
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
 * the Card Frame. The size is in `em`, as the Card Frame: the parent font size
 * sets it. Before the flip, a press flips it.
 */
const FlipCard = ({
  card,
  flipped,
  instant,
  delay,
  label,
  onFlip,
  testId,
}: {
  readonly card: RevealedCard;
  readonly flipped: boolean;
  readonly instant: boolean;
  readonly delay: number;
  readonly label: string;
  readonly onFlip: () => void;
  readonly testId: string;
}) => (
  <Button
    onPress={onFlip}
    isDisabled={flipped}
    aria-label={label}
    className="group relative block h-[12.6em] w-[9em] cursor-pointer rounded-[0.85em] outline-none [perspective:60em] data-[disabled]:cursor-default data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
    data-testid={testId}
    data-card={card.cardId}
    data-rank={card.rank}
    data-flipped={flipped || undefined}
  >
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
        <CardBack className="relative transition-transform duration-150 group-data-[hovered]:-translate-y-[0.3em]" />
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
        {card.isNew ? <NewBadge /> : null}
      </span>
    </span>
  </Button>
);

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
  "flex flex-wrap justify-center gap-2 [@media(max-height:500px)]:gap-1.5";

/** One Pack: 5 face-down cards in a row, with the best card last. */
const SingleReveal = ({
  pack,
  phase,
  setPhase,
  onClose,
}: {
  readonly pack: RevealedPack;
  readonly phase: Extract<Phase, { kind: "cards" }>;
  readonly setPhase: (phase: Phase) => void;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const words = useCardWords();
  const [delays, setDelays] = useState<readonly number[]>([]);
  const shown = new Set(phase.flipped);
  const allShown = shown.size === pack.cards.length;

  const flip = (index: number) => {
    unlockAudio();
    playSound("select", 0);
    setDelays([]);
    setPhase({ ...phase, flipped: [...phase.flipped, index] });
  };

  /** The face-down cards flip one after the other, from the first. */
  const revealAll = () => {
    const hidden: number[] = [];
    const next: number[] = [];
    for (const [index] of pack.cards.entries()) {
      next.push(shown.has(index) ? 0 : hidden.length * REVEAL_STEP_MS);
      if (!shown.has(index)) {
        hidden.push(index);
      }
    }
    setDelays(next);
    setPhase({ ...phase, flipped: [...phase.flipped, ...hidden] });
  };

  return (
    <>
      <ol
        className="flex items-start justify-center gap-[1em] text-[13px] [@media(max-height:500px)]:gap-[0.8em] [@media(max-height:500px)]:text-[8.5px]"
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
              className="flex flex-col items-center motion-safe:animate-[pack-deal_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
              style={{ animationDelay: `${index * 80}ms` }}
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
                testId={`reveal-card-${index}`}
              />
              <CardName card={card} shown={flipped} delay={delay} />
            </li>
          );
        })}
      </ol>
      {allShown ? <GuaranteeNote pack={pack} /> : null}
      <div className={ACTIONS}>
        {allShown ? (
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
        ) : (
          <>
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
          </>
        )}
      </div>
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
  const card = cards[phase.index];
  if (!card) {
    return null;
  }
  const last = phase.index === cards.length - 1;
  const flip = () => {
    unlockAudio();
    playSound("select", 0);
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

/** One place in the Open ×10 grid: the card, its copies and the NEW badge. */
const GridPlace = ({ card }: { readonly card: GridCard }) => {
  const { tr } = useGameText();
  const words = useCardWords();
  return (
    <li
      className="relative flex flex-col items-center"
      data-testid="grid-card"
      data-card={card.cardId}
      data-rank={card.rank}
      data-new={card.isNew || undefined}
    >
      <span className="sr-only">{words(card, card.copies)}</span>
      <span className="relative" aria-hidden>
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
      </span>
    </li>
  );
};

/** Open ×10: all the cards, from the highest Rank, with NEW badges. */
const Grid = ({
  packs,
  onClose,
}: {
  readonly packs: readonly RevealedPack[];
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const places = tenPackGrid(packs);
  const cards = packs.flatMap((pack) => pack.cards);
  const fresh = new Set(
    cards.flatMap((card) => (card.isNew ? [card.cardId] : []))
  ).size;
  return (
    <>
      <p
        className="text-sm font-bold text-[#e8d9bb]"
        data-testid="grid-summary"
      >
        {tr("packs.reveal.summary", { cards: cards.length, fresh })}
      </p>
      {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the Card Frame size (em); the text in the frame has its own size */}
      <ol
        className="grid min-h-0 w-full max-w-[1100px] grid-cols-[repeat(auto-fill,9em)] justify-center gap-x-[0.8em] gap-y-[1.4em] overflow-y-auto px-[1em] pt-[1.2em] pb-[0.8em] text-[7.5px] [@media(max-height:500px)]:text-[6px]"
        data-testid="reveal-grid"
      >
        {places.map((card) => (
          <GridPlace key={`${card.cardId}:${card.rank}`} card={card} />
        ))}
      </ol>
      <div className={ACTIONS}>
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
 * The reveal of opened Packs, over the full screen. One Pack: the Pack opens,
 * then 5 face-down cards come in, with the best card last. A Rare, Epic or
 * Legendary card glows on its back. A press flips one card; "Reveal all"
 * flips the others one after the other; "Skip" shows them at once. Open ×10:
 * a full flip for each Epic and Legendary card, then a grid of all the cards.
 * With reduced motion, the cards show at once, with no glow and no flip. Esc
 * closes it: the cards are in the Collection already.
 */
export const PackReveal = ({
  order,
  packs,
  onClose,
}: {
  readonly order: PackOrder;
  readonly packs: readonly RevealedPack[];
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
      className="motion-safe:animate-in motion-safe:fade-in fixed inset-0 z-[60] bg-[radial-gradient(ellipse_at_50%_40%,rgba(74,53,36,0.96),rgba(18,11,8,0.98)_70%)] motion-safe:duration-200"
    >
      <Modal className="size-full">
        <Dialog
          aria-label={tr("packs.reveal.label", { pack: name })}
          className="flex size-full flex-col items-center justify-center gap-4 p-4 text-[#fff6df] outline-none [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-2"
          data-testid="pack-reveal"
          data-phase={phase.kind}
        >
          <h2 className="font-display text-2xl font-black text-[#ffe08a] [text-shadow:0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:text-lg">
            {ten
              ? tr("packs.reveal.tenTitle", { pack: name, count: packs.length })
              : name}
          </h2>
          {phase.kind === "opening" ? (
            <div
              className="relative w-44 motion-safe:animate-[pack-open_700ms_cubic-bezier(0.3,0.7,0.2,1)_both] [@media(max-height:500px)]:w-24"
              style={{ animationDuration: `${OPEN_MS}ms` }}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                  setPhase(afterOpening(ten, highlights.length));
                }
              }}
              data-testid="pack-opening"
            >
              <PackArt pack={order.pack} race={order.race} />
            </div>
          ) : null}
          {phase.kind === "cards" && first ? (
            <SingleReveal
              pack={first}
              phase={phase}
              setPhase={setPhase}
              onClose={onClose}
            />
          ) : null}
          {phase.kind === "highlight" ? (
            <Highlight cards={highlights} phase={phase} setPhase={setPhase} />
          ) : null}
          {phase.kind === "grid" ? (
            <Grid packs={packs} onClose={onClose} />
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
