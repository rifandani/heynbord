import type { RankId } from "@workspace/rules";
import {
  coinDenominations,
  EXTRACT_ESSENCE,
  getCard,
  RANKS,
} from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Label, Meter } from "react-aria-components";

import { CardFrame, RankGems } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { RANK_LIGHT, RankBurst } from "@/features/packs/components/pack-reveal";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import type {
  CraftState,
  LegendaryPath,
  RankCopies,
  WorkshopTile,
} from "@/features/workshop/workshop";
import {
  combineFocusAfter,
  combineState,
  craftState,
  EXTRACT_MOTION,
  extractTimeline,
  legendaryPath,
} from "@/features/workshop/workshop";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** The new copy of the last Combine or Craft: the panel card turns over to it with the Rank burst. */
export interface Burst {
  readonly cardId: string;
  readonly rank: RankId;
  /** A new number for each action, so that the turn and the burst start again. */
  readonly serial: number;
}

/** The copy of the last Extract: it lifts off the panel card and melts into Essence. */
export interface Extraction {
  readonly cardId: string;
  readonly rank: RankId;
  /** A new number for each Extract, so that the melt starts again. */
  readonly serial: number;
}

/** The mask of the melt: twice the card height, opaque at the top half. */
const MELT_MASK: CSSProperties = {
  maskImage: "linear-gradient(to top, transparent 46%, black 54%)",
  WebkitMaskImage: "linear-gradient(to top, transparent 46%, black 54%)",
  maskSize: "100% 200%",
  WebkitMaskSize: "100% 200%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "0 -12%",
  WebkitMaskPosition: "0 -12%",
};

/** The melt goes up the card slowly at the start and at the end. */
const MELT_EASE = "cubic-bezier(0.45, 0, 0.55, 1)";

/**
 * The copy of an Extract (GDD 7.4): it lifts off the panel card, which goes
 * dark under it, and melts from the bottom up behind a bright line in its Rank light, while the Essence
 * drops come out of the line. An Epic or a Legendary copy trembles first. The
 * Rank burst of the Pack reveal starts with the melt, so a higher Rank gives
 * more light, as a Combine does. With reduced motion, it does not show.
 */
const ExtractGhost = ({
  cardId,
  rank,
}: {
  readonly cardId: string;
  readonly rank: RankId;
}) => {
  const { meltMs, liftScale, trembleMs } = EXTRACT_MOTION[rank];
  const { liftAt, meltAt } = extractTimeline(rank);
  const light = RANK_LIGHT[rank];
  const melt = `${meltMs}ms ${MELT_EASE} ${meltAt}ms both`;
  return (
    <>
      {/* Behind the card. The burst starts its light 200ms after its delay, at
          the face of a Pack flip. */}
      <RankBurst rank={rank} delay={meltAt - 200} />
      <span
        className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden"
        data-testid="workshop-extract-ghost"
        data-rank={rank}
        aria-hidden
      >
        {/* The card under the copy goes dark while the copy is off it. */}
        <span
          className="absolute inset-0 rounded-[0.85em] bg-[#1c140e] opacity-0"
          style={{
            animation: `workshop-extract-shade ${meltAt + meltMs + 240}ms ease-out both`,
          }}
        />
        <span
          className="absolute inset-0"
          // SAFETY: a CSS custom property for the keyframes. React's
          // `CSSProperties` does not model custom properties.
          style={
            {
              "--lift-scale": liftScale,
              animation: [
                trembleMs > 0
                  ? `workshop-extract-tremble ${trembleMs}ms linear both`
                  : null,
                `workshop-extract-lift 260ms cubic-bezier(0.16, 1, 0.3, 1) ${liftAt}ms both`,
              ]
                .filter(Boolean)
                .join(", "),
            } as CSSProperties
          }
        >
          <span
            className="absolute inset-0"
            style={{
              ...MELT_MASK,
              animation: `workshop-extract-melt ${melt}`,
              filter: `drop-shadow(0 0 0.5em ${light}66)`,
            }}
          >
            <CardFrame
              cardId={cardId}
              rank={rank}
              countdown={getCard(cardId).countdown}
            />
          </span>
          <span
            className="absolute inset-x-[0.2em] top-[-0.11em] h-[0.22em] rounded-full opacity-0"
            style={{
              animation: `workshop-extract-line ${melt}`,
              background: `linear-gradient(90deg, transparent, ${light} 18%, #fff6df 50%, ${light} 82%, transparent)`,
              boxShadow: `0 0 0.7em 0.2em ${light}b3`,
            }}
          />
        </span>
      </span>
    </>
  );
};

/**
 * The card at the top of the panel, at the Rank that the panel shows. After a
 * Combine or a Craft, it turns over to the new Rank with the Rank burst of the
 * Pack reveal. After an Extract, the copy lifts off it and melts into Essence.
 * With reduced motion, it changes at once.
 */
const CardPreview = ({
  cardId,
  rank,
  burst,
  extraction,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly burst: Burst | null;
  readonly extraction: Extraction | null;
}) => (
  // oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the Card Frame size (em); the text in the frame has its own size
  <div
    // A new element for each action, so that the turn plays again.
    key={burst?.serial ?? 0}
    className="relative isolate h-[12.6em] w-[9em] shrink-0 text-[11px] [@media(max-height:500px)]:text-[6px] [@media(min-height:860px)]:text-[13px]"
    data-testid="workshop-preview"
    data-rank={rank}
    data-burst={burst?.rank}
  >
    {burst ? <RankBurst rank={burst.rank} delay={0} /> : null}
    {extraction?.cardId === cardId ? (
      <ExtractGhost
        // A new element for each Extract, so that the melt plays again.
        key={extraction.serial}
        cardId={cardId}
        rank={extraction.rank}
      />
    ) : null}
    <div
      className={cn(
        burst &&
          "motion-safe:animate-[workshop-flip_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      )}
    >
      <CardFrame
        cardId={cardId}
        rank={rank}
        countdown={getCard(cardId).countdown}
      />
    </div>
  </div>
);

/**
 * The path to Legendary (GDD 7.4): a gold fill in a groove, as "Cards found",
 * with each copy counted as Base Rank copies, and the copies and the Coin
 * still needed.
 */
const PathTrack = ({ path }: { readonly path: LegendaryPath }) => {
  const { tr } = useGameText();
  const { short, words } = useCoinFormat();
  const rank = tr(`ranks.${path.base}`);
  const left = path.complete
    ? tr("workshop.path.complete")
    : tr(
        path.copies === 1 ? "workshop.path.leftOne" : "workshop.path.leftOther",
        { count: path.copies, rank, coin: short(path.coin) }
      );
  return (
    <Meter
      value={path.value}
      minValue={0}
      maxValue={path.target}
      valueLabel={
        path.complete
          ? tr("workshop.path.complete")
          : tr("workshop.path.aria", {
              value: path.value,
              target: path.target,
              rank,
              coin: words(path.coin),
            })
      }
      className="flex w-full flex-col gap-1"
      data-testid="workshop-path"
      data-value={path.value}
      data-target={path.target}
      data-complete={path.complete || undefined}
    >
      {({ percentage }) => (
        <>
          <span className="flex items-baseline justify-between gap-2">
            <Label className="text-xs font-bold text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]">
              {tr("workshop.path.label")}
            </Label>
            <span className="text-xs font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-[10px]">
              {tr("workshop.path.value", {
                value: path.value,
                target: path.target,
              })}
            </span>
          </span>
          <span className="relative h-2 w-full overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.75),0_1px_0_rgba(255,226,170,0.18)] [@media(max-height:500px)]:h-1.5">
            <span
              className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#ffe08a] to-[#e2a93b] motion-safe:transition-[scale] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ scale: `${percentage / 100} 1` }}
            />
          </span>
          <span
            className="text-xs leading-snug font-semibold text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]"
            aria-hidden
            data-testid="workshop-path-left"
          >
            {left}
          </span>
        </>
      )}
    </Meter>
  );
};

/** Compact sizes of a panel button on a short screen (The Short Screen Rule). */
const SMALL =
  "min-h-8 gap-1 px-2 text-xs [@media(max-height:500px)]:min-h-5 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:border [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px] [@media(max-height:500px)]:shadow-[0_2px_0_rgba(0,0,0,0.45)]";

/** An Essence amount with its icon. */
const Essence = ({ amount }: { readonly amount: string }) => (
  <span className="inline-flex items-center gap-0.5 tabular-nums">
    <BalanceIcon kind="essence" className="size-[1.15em] shrink-0" />
    {amount}
  </span>
);

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
            <span className="font-bold">{tr("workshop.combineCount")}</span>
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

/** The Craft of the Base Rank row: its Essence cost, why it is off, or its level lock. */
const CraftControl = ({
  state,
  rank,
  onCraft,
}: {
  readonly state: CraftState;
  readonly rank: RankId;
  readonly onCraft: () => void;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  if (state.kind === "none") {
    return null;
  }
  if (state.kind === "locked") {
    return (
      <span
        className="flex items-center gap-1 rounded-full border-2 border-[#e9c46a]/50 bg-[#1c140e] py-0.5 pr-2 pl-1 text-[11px] leading-none font-bold whitespace-nowrap text-[#e8d9bb] [@media(max-height:500px)]:text-[9px]"
        data-testid="workshop-craft-locked"
      >
        <GlyphIcon glyph="lock" className="size-3 text-[#e9c46a]" />
        {tr("town.opensAtLevel", { level: state.level })}
      </span>
    );
  }
  const name = tr(`ranks.${rank}`);
  return (
    <GameButton
      intent="wood"
      isDisabled={state.kind !== "ready"}
      onPress={onCraft}
      aria-label={
        state.kind === "ready"
          ? tr("workshop.craftLabel", {
              rank: name,
              essence: format(state.cost),
            })
          : tr("workshop.craftNeedLabel", {
              rank: name,
              essence: format(state.missing),
            })
      }
      className={cn(SMALL, "leading-none whitespace-nowrap")}
      data-testid="workshop-craft"
      data-state={state.kind}
    >
      <span className="font-bold">
        {state.kind === "ready" ? tr("workshop.craft") : tr("workshop.need")}
      </span>
      <Essence
        amount={format(state.kind === "ready" ? state.cost : state.missing)}
      />
    </GameButton>
  );
};

/** One Rank row: the Rank Gems and name, the copies, Extract, and Craft on the Base Rank row. */
const RankRow = ({
  row,
  base,
  craft,
  onExtract,
  onCraft,
  onPeek,
}: {
  readonly row: RankCopies;
  readonly base: boolean;
  readonly craft: CraftState;
  readonly onExtract: (rank: RankId) => void;
  readonly onCraft: () => void;
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
          "text-sm font-black tabular-nums [@media(max-height:500px)]:text-[11px]",
          row.copies > 0 ? "text-[#fff6df]" : "text-[#e8d9bb]/55",
          "motion-safe:animate-[workshop-count_320ms_cubic-bezier(0.2,0.8,0.2,1)]"
        )}
        aria-hidden
        data-testid={`workshop-copies-${row.rank}`}
      >
        {tr("workshop.copies", { count: row.copies })}
      </span>
      <span className="ml-auto flex items-center gap-1.5 [@media(max-height:500px)]:gap-1">
        {base ? (
          <CraftControl state={craft} rank={row.rank} onCraft={onCraft} />
        ) : null}
        <GameButton
          intent="wood"
          isDisabled={row.copies === 0}
          onPress={() => onExtract(row.rank)}
          aria-label={tr("workshop.extractLabel", { rank: name, essence })}
          className={cn(SMALL, "leading-none whitespace-nowrap")}
          data-testid={`workshop-extract-${row.rank}`}
        >
          <span className="font-bold [@media(max-height:500px)]:sr-only">
            {tr("workshop.extract")}
          </span>
          <Essence amount={`+${essence}`} />
        </GameButton>
      </span>
    </div>
  );
};

/**
 * The Rank panel of the selected card (GDD 7.4, "Anvil Ladder"): the card at
 * the top, the path to Legendary, then a ladder of Rank rows with Legendary
 * at the top and the Base Rank at the bottom. A Combine sits on the rung
 * between two rows; each row has Extract, and the Base Rank row has Craft.
 * A row or a rung under the pointer or the focus shows its Rank on the card.
 * After a Combine, the focus stays on that Combine while it is on, else it
 * goes to the Combine of the next rung, so that the Player can Combine pair
 * after pair with the keyboard.
 */
export const RankPanel = ({
  tile,
  coin,
  essence,
  level,
  burst,
  extraction,
  onCombine,
  onExtract,
  onCraft,
}: {
  readonly tile: WorkshopTile;
  readonly coin: number;
  readonly essence: number;
  readonly level: number;
  readonly burst: Burst | null;
  readonly extraction: Extraction | null;
  /** True when the Combine changed the Profile. */
  readonly onCombine: (rank: RankId) => boolean;
  readonly onExtract: (rank: RankId) => void;
  /** True when the Craft changed the Profile. */
  readonly onCraft: () => boolean;
}) => {
  const { tr } = useGameText();
  const panel = useRef<HTMLElement>(null);
  const pendingFocus = useRef<RankId | null>(null);
  const movingFocus = useRef(false);
  const [hovered, setHovered] = useState<RankId | null>(null);
  const [focused, setFocused] = useState<RankId | null>(null);
  // After a Combine or a Craft, the card shows the new copy until the Player
  // moves the pointer or the focus to a row.
  const [hold, setHold] = useState(false);
  const card = getCard(tile.cardId);
  const ladder = tile.copies.toReversed();
  const base = tile.copies[0]?.rank ?? card.baseRank;
  const craft = craftState(card, level, essence);
  const shown =
    hold && burst?.cardId === tile.cardId
      ? burst.rank
      : (hovered ?? focused ?? tile.rank);

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
    movingFocus.current = true;
    if (button) {
      button.focus();
    } else if (node && !node.contains(document.activeElement)) {
      node.focus();
    }
    movingFocus.current = false;
  }, [tile, coin]);

  const combine = (rank: RankId) => {
    if (onCombine(rank)) {
      pendingFocus.current = rank;
      setHold(true);
    }
  };

  const craftCopy = () => {
    if (onCraft()) {
      setHold(true);
    }
  };

  const peek = (rank: RankId | null) => {
    setHovered(rank);
    if (rank !== null) {
      setHold(false);
    }
  };

  // The focus in a row or on a rung shows its Rank (`data-peek`), until the
  // focus leaves the panel.
  useEffect(() => {
    const node = panel.current;
    if (!node) {
      return;
    }
    const onFocusIn = (event: FocusEvent) => {
      const rank =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-peek]")?.dataset.peek
          : undefined;
      setFocused(RANKS.find((item) => item === rank) ?? null);
      if (!movingFocus.current) {
        setHold(false);
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (
        !(event.relatedTarget instanceof Node) ||
        !node.contains(event.relatedTarget)
      ) {
        setFocused(null);
      }
    };
    node.addEventListener("focusin", onFocusIn);
    node.addEventListener("focusout", onFocusOut);
    return () => {
      node.removeEventListener("focusin", onFocusIn);
      node.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-labelledby="workshop-card-name"
      className={cn(
        PLATE,
        "flex max-h-full min-h-0 w-[min(380px,40vw)] shrink-0 flex-col gap-3 p-3 outline-none",
        // On a short screen, the card and the path are a column at the left
        // of the ladder, so that all the rows show.
        "[@media(max-height:500px)]:w-[min(400px,47vw)] [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-1.5"
      )}
      data-testid="workshop-panel"
      data-card={tile.cardId}
    >
      <div className="flex gap-3 [@media(max-height:500px)]:w-[118px] [@media(max-height:500px)]:shrink-0 [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:gap-1">
        <CardPreview
          cardId={tile.cardId}
          rank={shown}
          burst={burst}
          extraction={extraction}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 [@media(max-height:500px)]:gap-0.5">
          <h2
            id="workshop-card-name"
            className="font-display text-lg leading-tight font-bold text-[#ffe08a] [@media(max-height:500px)]:text-sm"
          >
            {tr(`cards.${tile.cardId}.name`)}
          </h2>
          <p
            className="flex items-center gap-1.5 text-xs font-bold [@media(max-height:500px)]:text-[10px]"
            style={{ color: RANK_COLORS[shown] }}
            data-testid="workshop-shown-rank"
          >
            <span className="text-[9px] [@media(max-height:500px)]:text-[7px]">
              <RankGems rank={shown} />
            </span>
            {tr(`ranks.${shown}`)}
          </p>
          <div className="mt-auto">
            <PathTrack path={legendaryPath(tile.copies)} />
          </div>
        </div>
      </div>
      <div
        className="-mx-1 flex min-h-0 min-w-0 [scrollbar-width:thin] [scrollbar-color:#7a5233_transparent] flex-col overflow-y-auto overscroll-contain px-1 [@media(max-height:500px)]:flex-1"
        data-testid="workshop-ladder"
      >
        {ladder.map((row) => {
          const below = tile.copies[tile.copies.indexOf(row) - 1];
          return (
            <div key={row.rank} className="flex flex-col">
              <RankRow
                row={row}
                base={row.rank === base}
                craft={craft}
                onExtract={onExtract}
                onCraft={craftCopy}
                onPeek={peek}
              />
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
