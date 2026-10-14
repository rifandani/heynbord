import type { DeckInput } from "@workspace/rules";
import { copiesLeft, getCard, ownedCopies } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { Button } from "react-aria-components";

import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { PoolFilters } from "@/features/deck/components/pool-filters";
import type { Peek } from "@/features/deck/components/use-card-peek";
import type { PoolBlock, PoolFilter, PoolTile } from "@/features/deck/deck";
import {
  classText,
  DEFAULT_POOL_FILTER,
  emptyPoolText,
  poolBlock,
  poolEntries,
} from "@/features/deck/deck";

type PeekBind = (target: Peek) => object;

/** The Card Details of a card, when they show; they come right after the card. */
type PeekAt = (target: Peek) => ReactNode;

const plate =
  "flex h-6 max-w-full items-center rounded-lg border-2 px-2 text-xs leading-none font-bold [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px]";

/** The plate under a card: the owned and free copies, or why the card cannot go in now. */
const CopiesPlate = ({
  owned,
  left,
  block,
  classLabel,
}: {
  readonly owned: number;
  readonly left: number;
  readonly block: PoolBlock | null;
  readonly classLabel: string;
}) => {
  const { tr } = useGameText();
  if (block === null) {
    return (
      <span className="flex h-6 max-w-full min-w-9 items-center justify-center rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-2 text-xs leading-none font-black text-[#fff6df] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.35)] [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px]">
        <span className="truncate">
          {tr("deckBuilder.left", { owned, left })}
        </span>
      </span>
    );
  }
  if (block === "notOwned") {
    return (
      <span
        className={cn(
          plate,
          "border-dashed border-[#a8916a] bg-transparent text-[#5b4632]"
        )}
      >
        <span className="truncate">{tr("deckBuilder.notOwned")}</span>
      </span>
    );
  }
  return (
    <span className={cn(plate, "border-[#c9b48c] bg-[#ead9b4] text-[#5b4632]")}>
      <span className="truncate">
        {block === "class"
          ? tr("deckBuilder.blocked.class", { className: classLabel })
          : tr(`deckBuilder.blocked.${block}`)}
      </span>
    </span>
  );
};

const PoolCard = ({
  tile,
  input,
  onAdd,
  bind,
  wasLongPress,
  peekAt,
}: {
  readonly tile: PoolTile;
  readonly input: DeckInput;
  readonly onAdd: (tile: PoolTile) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
  readonly peekAt: PeekAt;
}) => {
  const { tr, text } = useGameText();
  const card = getCard(tile.cardId);
  const block = poolBlock(input, tile.cardId, tile.rank);
  const owned = ownedCopies(input.collection, tile.cardId, tile.rank);
  const left = copiesLeft(input, tile.cardId, tile.rank);
  const classLabel = card.kind === "skill" ? text(classText(card.class)) : "";
  const label = {
    name: tr(`cards.${tile.cardId}.name`),
    rank: tr(`ranks.${tile.rank}`),
    countdown: card.countdown,
  };
  return (
    <li className="flex justify-center">
      <Button
        {...bind({ cardId: tile.cardId, rank: tile.rank, from: "pool" })}
        onPress={() => {
          if (!wasLongPress() && block === null) {
            onAdd(tile);
          }
        }}
        aria-label={
          block === "notOwned"
            ? tr("deckBuilder.notOwnedCard", label)
            : tr("deckBuilder.add", {
                ...label,
                owned,
                left: Math.max(left, 0),
              })
        }
        aria-disabled={block === null ? undefined : true}
        className={cn(
          "group flex flex-col items-center gap-1.5 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          block === null ? "cursor-pointer" : "cursor-default"
        )}
        data-testid={`pool-${tile.cardId}-${tile.rank}`}
        data-blocked={block ?? undefined}
      >
        <CardFrame
          cardId={tile.cardId}
          rank={tile.rank}
          countdown={card.countdown}
          className={cn(
            "transition-[transform,filter,opacity] duration-150 ease-out",
            block === null &&
              "group-data-[hovered]:-translate-y-1.5 group-data-[pressed]:translate-y-0 motion-reduce:group-data-[hovered]:translate-y-0",
            block === "notOwned" &&
              "opacity-60 grayscale group-data-[hovered]:opacity-80",
            block !== null &&
              block !== "notOwned" &&
              "brightness-[0.82] saturate-[0.55]"
          )}
        />
        <CopiesPlate
          owned={owned}
          left={left}
          block={block}
          classLabel={classLabel}
        />
      </Button>
      {peekAt({ cardId: tile.cardId, rank: tile.rank, from: "pool" })}
    </li>
  );
};

const grid = cn(
  "-mx-2 grid auto-rows-max grid-cols-[repeat(auto-fill,minmax(10em,1fr))] gap-x-1 gap-y-3 px-2",
  "[@media(max-height:500px)]:gap-y-1.5"
);

/** The pool with no cards: the Player owns all the cards of the filters, or none. */
const EmptyPool = ({
  filter,
  onShowAll,
}: {
  readonly filter: PoolFilter;
  readonly onShowAll: () => void;
}) => {
  const { tr, text } = useGameText();
  const ownsAll = filter.ownership === "notOwned";
  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-12 text-center [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:py-4"
      data-testid="pool-empty"
    >
      {ownsAll ? (
        <span
          className="grid size-10 place-items-center rounded-full border-2 border-[#e9c46a]/80 bg-[#1c140e]/90 text-[#ffd75a] [@media(max-height:500px)]:size-7"
          aria-hidden
        >
          <GlyphIcon
            glyph="check"
            className="size-5 [@media(max-height:500px)]:size-3.5"
          />
        </span>
      ) : null}
      <p className="max-w-[32ch] text-sm font-semibold text-balance text-[#2a1d12] [@media(max-height:500px)]:text-xs">
        {text(emptyPoolText(filter))}
      </p>
      <GameButton
        intent="wood"
        size="sm"
        onPress={onShowAll}
        data-testid="pool-show-all"
      >
        {tr("deckBuilder.showAll")}
      </GameButton>
    </div>
  );
};

/**
 * The left page: all the cards of the game (GDD 6). The cards that the
 * Player owns come first, one for each card and Rank; a press adds one copy
 * to the Deck. Then the cards that the Player does not own, in grey.
 */
export const CardPool = ({
  input,
  filter,
  onFilter,
  onAdd,
  bind,
  wasLongPress,
  peekAt,
}: {
  readonly input: DeckInput;
  readonly filter: PoolFilter;
  readonly onFilter: (filter: PoolFilter) => void;
  readonly onAdd: (tile: PoolTile) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
  readonly peekAt: PeekAt;
}) => {
  const { tr } = useGameText();
  const pool = poolEntries(input.collection, filter);
  const both = pool.owned.length > 0 && pool.notOwned.length > 0;
  const card = (tile: PoolTile) => (
    <PoolCard
      key={`${tile.cardId}:${tile.rank}`}
      tile={tile}
      input={input}
      onAdd={onAdd}
      bind={bind}
      wasLongPress={wasLongPress}
      peekAt={peekAt}
    />
  );
  return (
    <section
      aria-labelledby="deck-pool-title"
      className="flex min-h-0 flex-col gap-3 py-4 pr-9 pl-5 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:pr-6 [@media(max-height:500px)]:pl-3"
    >
      <header className="flex flex-col gap-2 [@media(max-height:500px)]:gap-1">
        <h3
          id="deck-pool-title"
          className="font-display flex items-baseline gap-2 text-lg font-bold [@media(max-height:500px)]:text-sm"
        >
          {tr("deckBuilder.cards")}
          <span
            className="font-sans text-xs font-semibold text-[#5b4632] tabular-nums"
            data-testid="pool-count"
          >
            {tr("deckBuilder.ownedOf", {
              owned: pool.ownedCards,
              total: pool.totalCards,
            })}
          </span>
        </h3>
        <PoolFilters filter={filter} onFilter={onFilter} />
      </header>
      {/* A new key for each filter, so that the list starts at the top. */}
      <div
        key={`${filter.ownership}:${filter.kind}:${filter.race}:${filter.classId}`}
        className={cn(
          "-mx-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-2 pt-2 pb-4 text-[11px]",
          "[scrollbar-width:thin] [scrollbar-color:#b9a175_transparent]",
          "max-[1100px]:text-[10px] [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:text-[7px]"
        )}
        data-testid="deck-pool"
      >
        {pool.owned.length > 0 ? (
          <ul
            className={grid}
            aria-label={tr("deckBuilder.filters.owned")}
            data-testid="pool-owned"
          >
            {pool.owned.map(card)}
          </ul>
        ) : null}
        {both ? (
          <h4
            id="deck-pool-not-owned"
            className="flex items-center gap-3 pt-1 font-sans text-xs font-bold text-[#5b4632] [@media(max-height:500px)]:text-[10px]"
          >
            <span className="h-px flex-1 bg-[#c9b48c]" aria-hidden />
            {tr("deckBuilder.notOwnedGroup", { count: pool.notOwned.length })}
            <span className="h-px flex-1 bg-[#c9b48c]" aria-hidden />
          </h4>
        ) : null}
        {pool.notOwned.length > 0 ? (
          <ul
            className={grid}
            aria-labelledby={both ? "deck-pool-not-owned" : undefined}
            aria-label={both ? undefined : tr("deckBuilder.filters.notOwned")}
            data-testid="pool-not-owned"
          >
            {pool.notOwned.map(card)}
          </ul>
        ) : null}
        {pool.owned.length === 0 && pool.notOwned.length === 0 ? (
          <EmptyPool
            filter={filter}
            onShowAll={() =>
              onFilter({ ...DEFAULT_POOL_FILTER, classId: filter.classId })
            }
          />
        ) : null}
      </div>
    </section>
  );
};
