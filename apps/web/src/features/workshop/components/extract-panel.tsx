import type { RankId } from "@workspace/rules";
import { EXTRACT_ESSENCE, getCard, isCraftRank } from "@workspace/rules";
import { cn } from "cn";
import { useLayoutEffect, useRef } from "react";

import { GameButton } from "@/core/components/game/game-button";
import { RankGems } from "@/core/components/game/rank-gems";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import type { Extraction } from "@/features/workshop/components/panel-parts";
import {
  CardPreview,
  Essence,
  PanelHeader,
  panelClassName,
  rowsClassName,
  SMALL,
  usePanelPeek,
} from "@/features/workshop/components/panel-parts";
import type { RankCopies, WorkshopTile } from "@/features/workshop/workshop";
import { spareCopies } from "@/features/workshop/workshop";

/**
 * One Rank row of the Extract panel: the Rank Gems and name, the copies, and
 * the gold Extract with the Essence that it gives.
 */
const ExtractRow = ({
  row,
  onExtract,
  onPeek,
}: {
  readonly row: RankCopies;
  readonly onExtract: (rank: RankId) => void;
  readonly onPeek: (rank: RankId | null) => void;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  const name = tr(`ranks.${row.rank}`);
  const essence = format(EXTRACT_ESSENCE[row.rank]);
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a fieldset cannot be a flex row in all browsers
      role="group"
      aria-label={tr("workshop.rankCopies", { rank: name, count: row.copies })}
      className="border-gold-trim/35 bg-plate-socket/80 flex h-11 shrink-0 items-center gap-1.5 rounded-lg border-2 px-2 [@media(max-height:500px)]:h-[26px] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-1"
      onPointerEnter={() => onPeek(row.rank)}
      onPointerLeave={() => onPeek(null)}
      data-peek={row.rank}
      data-testid={`workshop-extract-row-${row.rank}`}
      data-copies={row.copies}
      data-spare={spareCopies(row)}
    >
      {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
      <span className="text-[10px] [@media(max-height:500px)]:text-[7px]">
        <RankGems rank={row.rank} />
      </span>
      <span
        className="text-cream shrink-0 text-sm font-bold [@media(max-height:500px)]:text-[11px]"
        aria-hidden
      >
        {name}
      </span>
      <span
        // A new element for each count, so that a change hops once.
        key={row.copies}
        className="text-cream text-sm font-black tabular-nums motion-safe:animate-[workshop-count_320ms_cubic-bezier(0.2,0.8,0.2,1)] [@media(max-height:500px)]:text-[11px]"
        aria-hidden
        data-testid={`workshop-copies-${row.rank}`}
      >
        {tr("workshop.copies", { count: row.copies })}
      </span>
      <GameButton
        intent="gold"
        onPress={() => onExtract(row.rank)}
        aria-label={tr("workshop.extractLabel", { rank: name, essence })}
        className={cn(SMALL, "ml-auto leading-none whitespace-nowrap")}
        data-testid={`workshop-extract-${row.rank}`}
        data-extract={row.rank}
      >
        <GlyphIcon glyph="melt" className="size-3.5 shrink-0" />
        <span className="font-bold">{tr("workshop.extract")}</span>
        <Essence amount={`+${essence}`} amountClassName="w-[4ch] text-right" />
      </GameButton>
    </div>
  );
};

/**
 * The Extract station panel (GDD 7.4): the card, its spare copies, then a row
 * for each Rank with a copy, from the highest Rank down. Each row has its gold
 * Extract and the Essence that it gives: the action goes out of the card into
 * the balance. A row under the pointer or the focus shows its Rank on the
 * card. After an Extract, the focus stays on the Extract of the same Rank
 * while it has a copy, else it goes to the first row, else to the panel.
 */
export const ExtractPanel = ({
  tile,
  extraction,
  onExtract,
}: {
  readonly tile: WorkshopTile;
  readonly extraction: Extraction | null;
  readonly onExtract: (rank: RankId) => void;
}) => {
  const { tr } = useGameText();
  const panel = useRef<HTMLElement>(null);
  const pendingFocus = useRef<RankId | null>(null);
  const { peeked, focusQuietly, peek } = usePanelPeek(panel);
  const rows = tile.copies.filter((row) => row.copies > 0).toReversed();
  const owned = rows.reduce((total, row) => total + row.copies, 0);
  // The copies that a saved Deck uses: the copies that are not spare.
  const inDecks = owned - tile.spare;
  const shown = peeked ?? tile.rank;
  const base = getCard(tile.cardId).baseRank;

  useLayoutEffect(() => {
    const from = pendingFocus.current;
    const node = panel.current;
    if (from === null || !node) {
      return;
    }
    pendingFocus.current = null;
    if (node.contains(document.activeElement)) {
      return;
    }
    const left = tile.copies.find((row) => row.rank === from)?.copies ?? 0;
    const button = node.querySelector<HTMLElement>(
      left > 0 ? `[data-extract="${from}"]` : "[data-extract]"
    );
    focusQuietly(button ?? node);
  }, [tile.copies, focusQuietly]);

  const extract = (rank: RankId) => {
    pendingFocus.current = rank;
    onExtract(rank);
  };

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-labelledby="workshop-card-name"
      className={panelClassName}
      data-testid="workshop-panel"
      data-station="extract"
      data-card={tile.cardId}
    >
      <PanelHeader
        cardId={tile.cardId}
        rank={shown}
        preview={
          <CardPreview
            cardId={tile.cardId}
            rank={shown}
            extraction={extraction}
          />
        }
      >
        {owned > 0 ? (
          <p
            className="text-cream-dim text-xs font-semibold [@media(max-height:500px)]:text-[10px]"
            data-testid="workshop-spare"
          >
            {inDecks > 0
              ? tr("workshop.spareInDecks", {
                  spare: tile.spare,
                  used: inDecks,
                })
              : tr("workshop.spareCopies", { count: tile.spare })}
          </p>
        ) : null}
      </PanelHeader>
      {rows.length > 0 ? (
        <div
          className={cn(rowsClassName, "gap-1.5")}
          data-testid="workshop-extract-rows"
        >
          {rows.map((row) => (
            <ExtractRow
              key={row.rank}
              row={row}
              onExtract={extract}
              onPeek={peek}
            />
          ))}
        </div>
      ) : (
        <p
          className="text-cream-dim text-sm font-semibold text-balance [@media(max-height:500px)]:text-[11px]"
          data-testid="workshop-extract-none"
        >
          {tr(
            isCraftRank(base)
              ? "workshop.extractPanel.none"
              : base === "epic"
                ? "workshop.extractPanel.excludedEpic"
                : "workshop.extractPanel.excludedLegendary"
          )}
        </p>
      )}
    </section>
  );
};
