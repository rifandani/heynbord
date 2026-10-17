import type { RankId } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";
import { useLayoutEffect, useRef } from "react";

import { RankGems } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import type { Burst } from "@/features/workshop/components/panel-parts";
import {
  CardPreview,
  PanelHeader,
  panelClassName,
  StationEdge,
  PathTrack,
  rowsClassName,
  SMALL,
  usePanelPeek,
} from "@/features/workshop/components/panel-parts";
import type { RankCopies, WorkshopTile } from "@/features/workshop/workshop";
import {
  combineFocusAfter,
  combineState,
  legendaryPath,
} from "@/features/workshop/workshop";

/**
 * The Combine on the rung between two Rank rows: 2 copies of the lower Rank
 * become 1 copy of the upper Rank, for Coin. It is the gold button of the
 * panel. When it is off, it says why.
 */
const CombineRung = ({
  row,
  coin,
  onCombine,
  onPeek,
}: {
  readonly row: RankCopies;
  readonly coin: number;
  readonly onCombine: (rank: RankId) => void;
  readonly onPeek: (rank: RankId | null) => void;
}) => {
  const { tr } = useGameText();
  const { format, words, short } = useCoinFormat();
  const state = combineState(row, coin);
  if (!state) {
    return null;
  }
  const from = tr(`ranks.${row.rank}`);
  const to = tr(`ranks.${state.to}`);
  const label =
    state.kind === "ready"
      ? tr("workshop.combineLabel", { from, to, price: words(state.coin) })
      : state.kind === "copies"
        ? tr("workshop.combineCopiesLabel", { from, to })
        : tr("workshop.combineCoinLabel", {
            from,
            to,
            amount: words(state.missing),
          });
  return (
    <div
      className="relative flex h-10 items-center justify-center [@media(max-height:500px)]:h-[22px]"
      data-peek={state.to}
      onPointerEnter={() => onPeek(state.to)}
      onPointerLeave={() => onPeek(null)}
    >
      {/* The ladder rails: the rung joins the two rows. */}
      <span
        className="absolute inset-y-0 left-[18%] w-1 rounded-full bg-gradient-to-b from-[#7a5233] to-[#563720]"
        aria-hidden
      />
      <span
        className="absolute inset-y-0 right-[18%] w-1 rounded-full bg-gradient-to-b from-[#7a5233] to-[#563720]"
        aria-hidden
      />
      <GameButton
        intent="gold"
        isDisabled={state.kind !== "ready"}
        onPress={() => onCombine(row.rank)}
        aria-label={label}
        className={cn(SMALL, "relative leading-none whitespace-nowrap")}
        data-testid={`workshop-combine-${row.rank}`}
        data-rung={row.rank}
        data-state={state.kind}
      >
        <GlyphIcon glyph="anvil" className="size-3.5 shrink-0" />
        {state.kind === "ready" ? (
          <>
            <span className="font-display font-bold">
              {tr("workshop.station.combine.name")}
            </span>
            <CoinPrice parts={coinDenominations(state.coin)} format={format} />
          </>
        ) : (
          <span className="font-semibold">
            {state.kind === "copies"
              ? tr("workshop.needCopies")
              : tr("packs.need", { amount: short(state.missing) })}
          </span>
        )}
      </GameButton>
    </div>
  );
};

/** One Rank row of the ladder: the Rank Gems and name, and the copies. */
const RankRow = ({
  row,
  onPeek,
}: {
  readonly row: RankCopies;
  readonly onPeek: (rank: RankId | null) => void;
}) => {
  const { tr } = useGameText();
  const name = tr(`ranks.${row.rank}`);
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a fieldset cannot be a flex row in all browsers
      role="group"
      aria-label={tr("workshop.rankCopies", { rank: name, count: row.copies })}
      className={cn(
        "flex h-10 shrink-0 items-center gap-1.5 rounded-lg border-2 px-2 transition-colors duration-150 [@media(max-height:500px)]:h-[26px] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-1",
        row.copies > 0
          ? "border-[#e9c46a]/35 bg-[#3a2a1c]/80"
          : "border-[#e9c46a]/15 bg-[#3a2a1c]/35"
      )}
      onPointerEnter={() => onPeek(row.rank)}
      onPointerLeave={() => onPeek(null)}
      data-peek={row.rank}
      data-testid={`workshop-row-${row.rank}`}
      data-copies={row.copies}
    >
      <span className="text-[10px] [@media(max-height:500px)]:text-[7px]">
        <RankGems rank={row.rank} />
      </span>
      <span
        className="shrink-0 text-sm font-bold [@media(max-height:500px)]:text-[11px]"
        style={{ color: RANK_COLORS[row.rank] }}
        aria-hidden
      >
        {name}
      </span>
      <span
        // A new element for each count, so that a change hops once.
        key={row.copies}
        className={cn(
          "ml-auto text-sm font-black tabular-nums [@media(max-height:500px)]:text-[11px]",
          row.copies > 0 ? "text-[#fff6df]" : "text-[#e8d9bb]/55",
          "motion-safe:animate-[workshop-count_320ms_cubic-bezier(0.2,0.8,0.2,1)]"
        )}
        aria-hidden
        data-testid={`workshop-copies-${row.rank}`}
      >
        {tr("workshop.copies", { count: row.copies })}
      </span>
    </div>
  );
};

/**
 * The Combine station panel (GDD 7.4, "Anvil Ladder"): the card at the top,
 * the path to Legendary, then a ladder of Rank rows with Legendary at the top
 * and the Base Rank at the bottom. A Combine sits on the rung between two
 * rows: the action goes up. A row or a rung under the pointer or the focus
 * shows its Rank on the card. After a Combine, the focus stays on that Combine
 * while it is on, else it goes to the Combine of the next rung, so that the
 * Player can Combine pair after pair with the keyboard.
 */
export const CombinePanel = ({
  tile,
  coin,
  burst,
  onCombine,
}: {
  readonly tile: WorkshopTile;
  readonly coin: number;
  readonly burst: Burst | null;
  /** True when the Combine changed the Profile. */
  readonly onCombine: (rank: RankId) => boolean;
}) => {
  const panel = useRef<HTMLElement>(null);
  const pendingFocus = useRef<RankId | null>(null);
  const { peeked, hold, setHold, focusQuietly, peek } = usePanelPeek(panel);
  const ladder = tile.copies.toReversed();
  const shown =
    hold && burst?.cardId === tile.cardId ? burst.rank : (peeked ?? tile.rank);

  // After a Combine: the focus stays on it while it is on, else it goes to
  // the next rung, else to the panel.
  useLayoutEffect(() => {
    const from = pendingFocus.current;
    if (from === null) {
      return;
    }
    pendingFocus.current = null;
    const target = combineFocusAfter(
      tile.copies.map((row) => ({
        rank: row.rank,
        ready: combineState(row, coin)?.kind === "ready",
      })),
      from
    );
    const node = panel.current;
    const button =
      target === null
        ? null
        : node?.querySelector<HTMLElement>(`[data-rung="${target}"]`);
    if (button) {
      focusQuietly(button);
    } else if (node && !node.contains(document.activeElement)) {
      focusQuietly(node);
    }
  }, [tile, coin, focusQuietly]);

  const combine = (rank: RankId) => {
    if (onCombine(rank)) {
      pendingFocus.current = rank;
      setHold(true);
    }
  };

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-labelledby="workshop-card-name"
      className={panelClassName}
      data-testid="workshop-panel"
      data-station="combine"
      data-card={tile.cardId}
    >
      <StationEdge station="combine" />
      <PanelHeader
        cardId={tile.cardId}
        rank={shown}
        preview={
          <CardPreview cardId={tile.cardId} rank={shown} burst={burst} />
        }
      >
        <PathTrack path={legendaryPath(tile.copies)} />
      </PanelHeader>
      <div className={rowsClassName} data-testid="workshop-ladder">
        {ladder.map((row) => {
          const below = tile.copies[tile.copies.indexOf(row) - 1];
          return (
            <div key={row.rank} className="flex flex-col">
              <RankRow row={row} onPeek={peek} />
              {below ? (
                <CombineRung
                  row={below}
                  coin={coin}
                  onCombine={combine}
                  onPeek={peek}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
