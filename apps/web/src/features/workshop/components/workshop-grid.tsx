import type { RankId } from "@workspace/rules";
import { getCard } from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useRef } from "react";
import { GridList, GridListItem, Popover } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { CardDetails } from "@/features/battle/components/card-details";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek, ShownPeek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import type { PoolFilter } from "@/features/deck/deck";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import type {
  Station,
  StationContext,
  WorkshopTile,
} from "@/features/workshop/workshop";
import { craftState, isTileReady } from "@/features/workshop/workshop";

/**
 * The gold chip of a tile that the station can act on. It sits in the strip
 * under the frame, so that it never covers the Attack, the HP or the art.
 */
const markClassName =
  "flex h-[1.75em] items-center gap-[0.3em] rounded-full border-[0.14em] border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-[0.6em] text-[1.05em] leading-none font-black whitespace-nowrap text-[#2a1a05] tabular-nums shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6)]";

/** A pair below Legendary: the Combine station can act. */
const PairMark = () => {
  const { tr } = useGameText();
  return (
    <span className={markClassName} data-testid="workshop-pair" aria-hidden>
      <GlyphIcon glyph="anvil" className="size-[1.2em] shrink-0" />
      {tr("workshop.pairMark")}
    </span>
  );
};

/** The Essence cost of a Craft that the Player can do now. */
const CraftMark = ({ cost }: { readonly cost: number }) => {
  const { format } = useCoinFormat();
  return (
    <span
      className={markClassName}
      data-testid="workshop-craft-mark"
      aria-hidden
    >
      <BalanceIcon kind="essence" className="size-[1.2em] shrink-0" />
      {format(cost)}
    </span>
  );
};

/** The spare copies that the Extract station can melt without a change to a Deck. */
const SpareMark = ({ count }: { readonly count: number }) => {
  const { tr } = useGameText();
  return (
    <span
      className={markClassName}
      data-testid="workshop-spare-mark"
      aria-hidden
    >
      <GlyphIcon glyph="melt" className="size-[1.15em] shrink-0" />
      {tr("workshop.spareMark", { count })}
    </span>
  );
};

/** The copies of a card that can go into a Fuse now. */
const FuseMark = ({ count }: { readonly count: number }) => (
  <span className={markClassName} data-testid="workshop-fuse-mark" aria-hidden>
    <GlyphIcon glyph="crucible" className="size-[1.2em] shrink-0" />×{count}
  </span>
);

/**
 * The Fuse state that the grid shows: the copies of each card that can go in
 * now (`fuseMark`), the Rank of the slots, and the press that puts a copy in.
 */
export interface GridFuse {
  readonly marks: ReadonlyMap<string, number>;
  /** The Rank of the copies in the slots, or `null` before the first copy. */
  readonly rank: RankId | null;
  /** A press on a tile, with the tile frame for the Rank chooser. */
  readonly onPut: (cardId: string, anchor: HTMLElement | null) => void;
}

/** True when the station can act on the tile: in Fuse, when a copy can go in now. */
const tileReady = (
  tile: WorkshopTile,
  station: Station,
  context: StationContext,
  fuse: GridFuse | null
): boolean =>
  station === "fuse" && fuse
    ? (fuse.marks.get(tile.cardId) ?? 0) > 0
    : isTileReady(tile, station, context);

/**
 * The Rank that a tile shows. In Fuse after the first copy: the Rank of the
 * slots, when the card has a copy of it. Else its highest owned Rank.
 */
const tileRank = (
  tile: WorkshopTile,
  station: Station,
  fuse: GridFuse | null
): RankId => {
  const rank = station === "fuse" ? fuse?.rank : null;
  return rank && tile.copies.some((row) => row.rank === rank && row.copies > 0)
    ? rank
    : tile.rank;
};

/** The mark of a tile in a station, or `null` when the station cannot act on it. */
const StationMark = ({
  tile,
  station,
  context,
  fuse,
}: {
  readonly tile: WorkshopTile;
  readonly station: Station;
  readonly context: StationContext;
  readonly fuse: GridFuse | null;
}) => {
  if (!tileReady(tile, station, context, fuse)) {
    return null;
  }
  if (station === "fuse") {
    return <FuseMark count={fuse?.marks.get(tile.cardId) ?? 0} />;
  }
  if (station === "combine") {
    return <PairMark />;
  }
  if (station === "extract") {
    return <SpareMark count={tile.spare} />;
  }
  const craft = craftState(
    getCard(tile.cardId),
    context.level,
    context.essence
  );
  return craft.kind === "ready" ? <CraftMark cost={craft.cost} /> : null;
};

/** The words that a screen reader says for a tile in a station. */
const useTileWords = (
  station: Station,
  context: StationContext,
  fuse: GridFuse | null
) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  const stationWords = (tile: WorkshopTile): string | null => {
    if (!tileReady(tile, station, context, fuse)) {
      return null;
    }
    if (station === "fuse") {
      return tr("workshop.fuseMark", {
        count: fuse?.marks.get(tile.cardId) ?? 0,
      });
    }
    if (station === "combine") {
      return tr("workshop.pairReady");
    }
    if (station === "extract") {
      return tr("workshop.spareCopies", { count: tile.spare });
    }
    const craft = craftState(
      getCard(tile.cardId),
      context.level,
      context.essence
    );
    return craft.kind === "ready"
      ? tr("workshop.craftMark", { essence: format(craft.cost) })
      : null;
  };
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
    return [tr(`cards.${tile.cardId}.name`), copies, stationWords(tile)]
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
 * One tile of the grid. A tile that the station cannot act on is darker and
 * less saturated; a tile that it can act on has the mark of the station. Hover,
 * keyboard focus or a long press shows its Card Details at its highest owned
 * Rank, as in the Deck builder. They open beside the card, out of the grid, so
 * that the scroll of the grid never cuts them. In Fuse, a press puts a copy
 * in a slot; a long press only shows the Card Details.
 */
const Tile = ({
  tile,
  station,
  context,
  fuse,
  words,
  bind,
  wasLongPress,
  peek,
  onHide,
}: {
  readonly tile: WorkshopTile;
  readonly station: Station;
  readonly context: StationContext;
  readonly fuse: GridFuse | null;
  readonly words: string;
  readonly bind: (target: Peek) => object;
  readonly wasLongPress: () => boolean;
  readonly peek: ShownPeek | null;
  readonly onHide: () => void;
}) => {
  const frame = useRef<HTMLSpanElement>(null);
  const ready = tileReady(tile, station, context, fuse);
  const rank = tileRank(tile, station, fuse);
  const target: Peek = {
    cardId: tile.cardId,
    rank,
    from: "workshop",
  };
  return (
    <GridListItem
      id={tile.cardId}
      textValue={words}
      {...bind(target)}
      onAction={
        station === "fuse" && fuse
          ? () => {
              if (!wasLongPress()) {
                onHide();
                fuse.onPut(tile.cardId, frame.current);
              }
            }
          : undefined
      }
      className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      data-testid={`workshop-tile-${tile.cardId}`}
      data-rank={rank}
      data-ready={ready || undefined}
    >
      <span
        ref={frame}
        className="relative rounded-[0.85em] transition-[translate,box-shadow] duration-150 ease-out group-data-[hovered]:-translate-y-1 group-data-[selected]:shadow-[0_0_0_0.25em_#ffd75a,0_0_1.4em_0.35em_rgba(255,215,90,0.55)] motion-reduce:group-data-[hovered]:translate-y-0"
      >
        <CardFrame
          cardId={tile.cardId}
          rank={rank}
          countdown={getCard(tile.cardId).countdown}
          className={cn(
            "transition-[filter] duration-300",
            !ready && "brightness-[0.82] saturate-[0.55]"
          )}
        />
      </span>
      {/* The strip of the station mark: the same height on each tile, so
          that the rows stay even. */}
      <span className="flex h-[1.9em] items-center justify-center">
        <StationMark
          tile={tile}
          station={station}
          context={context}
          fuse={fuse}
        />
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
          <CardDetails cardId={tile.cardId} rank={rank} />
        </Popover>
      ) : null}
    </GridListItem>
  );
};

/**
 * The Workshop grid (GDD 7.4): one tile for each Discovered card, at its
 * highest owned Rank, in the same order in all the stations. The station
 * marks the tiles that it can act on and darkens the others. The arrow keys
 * move in the grid, and Enter or a press selects a card for the panel of the
 * station; in Fuse, Enter or a press puts a copy in a Fuse slot. Hover,
 * keyboard focus or a long press shows the Card Details of a tile.
 */
export const WorkshopGrid = ({
  tiles,
  station,
  context,
  fuse = null,
  selected,
  onSelect,
  filter,
  emptyText,
  onShowAll,
}: {
  readonly tiles: readonly WorkshopTile[];
  readonly station: Station;
  readonly context: StationContext;
  /** The Fuse state, in the Fuse station. */
  readonly fuse?: GridFuse | null;
  readonly selected: string | null;
  readonly onSelect: (cardId: string) => void;
  readonly filter: PoolFilter;
  readonly emptyText: string;
  readonly onShowAll: () => void;
}) => {
  const { tr } = useGameText();
  const fusing = station === "fuse" && fuse !== null;
  const words = useTileWords(station, context, fuse);
  const { peek, bind, hide, wasLongPress } = useCardPeek();
  // Each item has its card as its `id`, so React Aria keeps each tile when a
  // tile comes in between: a Fuse adds the tile of a new card.
  const items = useMemo(
    () => tiles.map((tile) => ({ ...tile, id: tile.cardId })),
    [tiles]
  );
  return (
    <GridList
      // A new key for each filter, so that the list starts at the top.
      key={`${filter.ownership}:${filter.kind}:${filter.race}:${filter.classId}`}
      aria-label={tr("workshop.grid")}
      layout="grid"
      items={items}
      // The tiles render again when the Card Details, the station or the
      // balances change.
      dependencies={[peek, station, context, fuse]}
      // In Fuse a press puts a copy in a slot (`onAction`): no card is selected.
      selectionMode={fusing ? "none" : "single"}
      disallowEmptySelection={!fusing}
      selectedKeys={selected === null || fusing ? [] : [selected]}
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
          station={station}
          context={context}
          fuse={fuse}
          words={words(tile)}
          bind={bind}
          wasLongPress={wasLongPress}
          peek={peek}
          onHide={hide}
        />
      )}
    </GridList>
  );
};
