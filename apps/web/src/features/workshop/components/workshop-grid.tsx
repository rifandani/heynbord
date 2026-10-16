import { getCard } from "@workspace/rules";
import { cn } from "cn";
import { useRef } from "react";
import { GridList, GridListItem, Popover } from "react-aria-components";

import { CardDetails } from "@/features/battle/components/card-details";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek, ShownPeek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import type { PoolFilter } from "@/features/deck/deck";
import type { WorkshopTile } from "@/features/workshop/workshop";

/**
 * The small anvil on a tile with a pair below Legendary: a Combine is near.
 * It sits on the bottom edge of the frame, between Attack and HP, so that it
 * never covers the Countdown or the emblem.
 */
const PairMark = () => (
  <span
    className="absolute -bottom-[0.5em] left-1/2 z-10 grid size-[2.2em] -translate-x-1/2 place-items-center rounded-full border-[0.16em] border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05] shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6)]"
    data-testid="workshop-pair"
    aria-hidden
  >
    <GlyphIcon glyph="anvil" className="size-[1.45em]" />
  </span>
);

/** The words that a screen reader says for a tile. */
const useTileWords = () => {
  const { tr } = useGameText();
  return (tile: WorkshopTile) => {
    const owned = tile.copies.filter((row) => row.copies > 0);
    const copies =
      owned.length === 0
        ? tr("workshop.noCopies")
        : owned
            .map((row) =>
              tr("workshop.rankCopies", {
                rank: tr(`ranks.${row.rank}`),
                count: row.copies,
              })
            )
            .join(", ");
    return [
      tr(`cards.${tile.cardId}.name`),
      copies,
      tile.pairReady ? tr("workshop.pairReady") : null,
    ]
      .filter((part) => part !== null)
      .join(". ");
  };
};

/** The grid with no cards: the same shape as the empty Deck builder pool. */
const EmptyGrid = ({
  text,
  onShowAll,
}: {
  readonly text: string;
  readonly onShowAll: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-12 text-center [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:py-4"
      data-testid="workshop-empty"
    >
      <p className="max-w-[32ch] text-sm font-semibold text-balance text-[#fff6df] [@media(max-height:500px)]:text-xs">
        {text}
      </p>
      <GameButton intent="wood" size="sm" onPress={onShowAll}>
        {tr("deckBuilder.showAll")}
      </GameButton>
    </div>
  );
};

/**
 * One tile of the grid. Hover, keyboard focus or a long press shows its Card
 * Details at its highest owned Rank, as in the Deck builder. They open beside
 * the card, out of the grid, so that the scroll of the grid never cuts them.
 */
const Tile = ({
  tile,
  words,
  bind,
  peek,
  onHide,
}: {
  readonly tile: WorkshopTile;
  readonly words: string;
  readonly bind: (target: Peek) => object;
  readonly peek: ShownPeek | null;
  readonly onHide: () => void;
}) => {
  const frame = useRef<HTMLSpanElement>(null);
  const target: Peek = {
    cardId: tile.cardId,
    rank: tile.rank,
    from: "workshop",
  };
  return (
    <GridListItem
      id={tile.cardId}
      textValue={words}
      {...bind(target)}
      className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      data-testid={`workshop-tile-${tile.cardId}`}
      data-rank={tile.rank}
    >
      <span
        ref={frame}
        className="relative rounded-[0.85em] transition-[translate,box-shadow] duration-150 ease-out group-data-[hovered]:-translate-y-1 group-data-[selected]:shadow-[0_0_0_0.25em_#ffd75a,0_0_1.4em_0.35em_rgba(255,215,90,0.55)] motion-reduce:group-data-[hovered]:translate-y-0"
      >
        <CardFrame
          cardId={tile.cardId}
          rank={tile.rank}
          countdown={getCard(tile.cardId).countdown}
          className={cn(
            tile.copies.every((row) => row.copies === 0) &&
              "brightness-[0.82] saturate-[0.55]"
          )}
        />
        {tile.pairReady ? <PairMark /> : null}
      </span>
      {peek && isSamePeek(peek, target) ? (
        <Popover
          triggerRef={frame}
          isOpen
          isNonModal
          onOpenChange={(open) => {
            if (!open) {
              onHide();
            }
          }}
          placement="right"
          offset={12}
          className="fade-in animate-in pointer-events-none duration-150 motion-reduce:animate-none"
          data-testid="workshop-peek"
        >
          <CardDetails cardId={tile.cardId} rank={tile.rank} />
        </Popover>
      ) : null}
    </GridListItem>
  );
};

/**
 * The Workshop grid (GDD 7.4): one tile for each Discovered card, at its
 * highest owned Rank. The Rank panel shows its copies of each Rank. The arrow
 * keys move in the grid, and Enter or a press selects a card for the Rank panel.
 * Hover, keyboard focus or a long press shows the Card Details of a tile.
 */
export const WorkshopGrid = ({
  tiles,
  selected,
  onSelect,
  filter,
  emptyText,
  onShowAll,
}: {
  readonly tiles: readonly WorkshopTile[];
  readonly selected: string | null;
  readonly onSelect: (cardId: string) => void;
  readonly filter: PoolFilter;
  readonly emptyText: string;
  readonly onShowAll: () => void;
}) => {
  const { tr } = useGameText();
  const words = useTileWords();
  const { peek, bind, hide } = useCardPeek();
  return (
    <GridList
      // A new key for each filter, so that the list starts at the top.
      key={`${filter.ownership}:${filter.kind}:${filter.race}:${filter.classId}`}
      aria-label={tr("workshop.grid")}
      layout="grid"
      items={tiles}
      // The tiles render again when the Card Details change.
      dependencies={[peek]}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selected === null ? [] : [selected]}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return;
        }
        const [key] = keys;
        const tile = tiles.find((item) => item.cardId === key);
        if (tile) {
          onSelect(tile.cardId);
        }
      }}
      renderEmptyState={() => (
        <EmptyGrid text={emptyText} onShowAll={onShowAll} />
      )}
      className={cn(
        "-mx-2 grid min-h-0 flex-1 auto-rows-max grid-cols-[repeat(auto-fill,minmax(10.4em,1fr))] gap-x-1 gap-y-2.5 overflow-y-auto overscroll-contain px-2 pt-2 pb-4 text-[11px] outline-none",
        "[scrollbar-width:thin] [scrollbar-color:#7a5233_transparent]",
        "max-[1100px]:text-[10px] [@media(max-height:500px)]:gap-y-1.5 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-2 [@media(max-height:500px)]:text-[7px]",
        "data-[empty]:flex data-[empty]:justify-center"
      )}
      data-testid="workshop-grid"
    >
      {(tile) => (
        <Tile
          tile={tile}
          words={words(tile)}
          bind={bind}
          peek={peek}
          onHide={hide}
        />
      )}
    </GridList>
  );
};
