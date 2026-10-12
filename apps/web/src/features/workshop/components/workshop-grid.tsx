import { getCard } from "@workspace/rules";
import { cn } from "cn";
import { GridList, GridListItem } from "react-aria-components";

import { CardFrame, RankGems } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { PoolFilter } from "@/features/deck/deck";
import type { RankCopies, WorkshopTile } from "@/features/workshop/workshop";

/**
 * The copies of each Rank under a tile: the Rank Gems and the count, for each
 * Rank with a copy (never the color alone). "0 copies" for a card with none.
 */
const CopyStrip = ({ copies }: { readonly copies: readonly RankCopies[] }) => {
  const { tr } = useGameText();
  const owned = copies.filter((row) => row.copies > 0);
  return (
    <span
      className="flex min-h-5 max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:min-h-4 [@media(max-height:500px)]:text-[10px]"
      aria-hidden
    >
      {owned.length === 0 ? (
        <span className="font-semibold text-[#e8d9bb]/75">
          {tr("workshop.noCopies")}
        </span>
      ) : (
        owned.map((row) => (
          <span
            key={row.rank}
            className="flex items-center gap-1 rounded-md bg-[#1c140e]/80 px-1 py-0.5"
          >
            <span className="text-[8px] [@media(max-height:500px)]:text-[6px]">
              <RankGems rank={row.rank} />
            </span>
            {tr("workshop.copies", { count: row.copies })}
          </span>
        ))
      )}
    </span>
  );
};

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
 * The Workshop grid (GDD 7.4): one tile for each Discovered card, at its
 * highest owned Rank, with the copies of each Rank under it. The arrow keys
 * move in the grid, and Enter or a press selects a card for the Rank panel.
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
  return (
    <GridList
      // A new key for each filter, so that the list starts at the top.
      key={`${filter.ownership}:${filter.kind}:${filter.race}:${filter.classId}`}
      aria-label={tr("workshop.grid")}
      layout="grid"
      items={tiles}
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
        <GridListItem
          id={tile.cardId}
          textValue={words(tile)}
          className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
          data-testid={`workshop-tile-${tile.cardId}`}
          data-rank={tile.rank}
        >
          <span className="relative rounded-[0.85em] transition-[translate,box-shadow] duration-150 ease-out group-data-[hovered]:-translate-y-1 group-data-[selected]:shadow-[0_0_0_0.25em_#ffd75a,0_0_1.4em_0.35em_rgba(255,215,90,0.55)] motion-reduce:group-data-[hovered]:translate-y-0">
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
          <CopyStrip copies={tile.copies} />
        </GridListItem>
      )}
    </GridList>
  );
};
