import type { RankId } from "@workspace/rules";
import { getCard, RANKS } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Label, Meter } from "react-aria-components";

import { RankGems } from "@/core/components/game/rank-gems";
import { nightPlateStyles } from "@/core/components/game/surfaces";
import { CardFrame } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";
import { RankBurst } from "@/features/packs/components/pack-reveal";
import { RANK_LIGHT } from "@/features/packs/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import {
  WORKSHOP_SMALL_DROP,
  WORKSHOP_WELL_DROP,
} from "@/features/workshop/tokens";
import type { LegendaryPath } from "@/features/workshop/workshop";
import {
  craftTimeline,
  EXTRACT_MOTION,
  extractTimeline,
} from "@/features/workshop/workshop";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE = nightPlateStyles({ padding: "none" });

/** Compact sizes of a panel button on a short screen (The Short Screen Rule). */
export const SMALL = cn(
  "min-h-8 gap-1 px-2 text-xs [@media(max-height:500px)]:min-h-5 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:border [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px]",
  WORKSHOP_SMALL_DROP
);

/** The new copy of the last Combine: the panel card turns over to it with the Rank burst. */
export interface Burst {
  readonly cardId: string;
  readonly rank: RankId;
  /** A new number for each action, so that the turn and the burst start again. */
  readonly serial: number;
}

/** The copy of the last Extract: it lifts off the panel card and melts into Essence. */
export type Extraction = Burst;

/** The copy of the last Craft: it forms on the panel card out of the Essence drops. */
export type Forming = Burst;

/** An Essence amount with its icon. */
export const Essence = ({
  amount,
  amountClassName,
}: {
  readonly amount: string;
  /** The width and the alignment of the number, so that a column of amounts lines up. */
  readonly amountClassName?: string;
}) => (
  <span className="inline-flex items-center gap-0.5 tabular-nums">
    <BalanceIcon kind="essence" className="size-[1.15em] shrink-0" />
    <span className={amountClassName}>{amount}</span>
  </span>
);

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

/** The melt and the form go up the card slowly at the start and at the end. */
const MELT_EASE = "cubic-bezier(0.45, 0, 0.55, 1)";

/** The bright line at the edge of a melt or a form, in the Rank light. */
const RankLine = ({
  light,
  animation,
}: {
  readonly light: string;
  readonly animation: string;
}) => (
  <span
    className="absolute inset-x-[0.2em] top-[-0.11em] h-[0.22em] rounded-full opacity-0"
    style={{
      animation: `workshop-extract-line ${animation}`,
      background: `linear-gradient(90deg, transparent, ${light} 18%, var(--color-cream) 50%, ${light} 82%, transparent)`,
      boxShadow: `0 0 0.7em 0.2em ${light}b3`,
    }}
  />
);

/**
 * The copy of an Extract (GDD 7.4): it lifts off the panel card, which goes
 * dark under it, and melts from the bottom up behind a bright line in its Rank
 * light, while the Essence drops come out of the line. An Epic or a Legendary
 * copy trembles first. With reduced motion, it does not show.
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
    <span
      className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden"
      data-testid="workshop-extract-ghost"
      data-rank={rank}
      aria-hidden
    >
      {/* The card under the copy goes dark while the copy is off it. */}
      <span
        className="bg-night-plate absolute inset-0 rounded-[0.85em] opacity-0"
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
        <RankLine light={light} animation={melt} />
      </span>
    </span>
  );
};

/**
 * The copy of a Craft (GDD 7.4), the opposite of an Extract: the panel card
 * goes dark, and the new copy forms from the bottom up behind a bright line in
 * its Rank light, where the Essence drops go in. When it is complete, the
 * Rank burst of the Pack reveal starts behind it. With reduced motion, it does
 * not show.
 */
const CraftGhost = ({
  cardId,
  rank,
}: {
  readonly cardId: string;
  readonly rank: RankId;
}) => {
  const { formAt, formMs, formed } = craftTimeline(rank);
  const light = RANK_LIGHT[rank];
  const form = `${formMs}ms ${MELT_EASE} ${formAt}ms both`;
  return (
    <>
      <RankBurst rank={rank} delay={formed - 200} />
      <span
        className="pointer-events-none absolute inset-0 z-10 motion-reduce:hidden"
        style={{
          animation: `workshop-craft-settle ${formed + 320}ms linear both`,
        }}
        data-testid="workshop-craft-ghost"
        data-rank={rank}
        aria-hidden
      >
        <span
          className="bg-night-plate absolute inset-0 rounded-[0.85em] opacity-0"
          style={{
            animation: `workshop-extract-shade ${formed + 240}ms ease-out both`,
          }}
        />
        {/* The glow is outside the clip, so it follows the part that formed. */}
        <span
          className="absolute inset-0"
          style={{ filter: `drop-shadow(0 0 0.5em ${light}66)` }}
        >
          <span
            className="absolute inset-0"
            style={{ animation: `workshop-craft-form ${form}` }}
          >
            <CardFrame
              cardId={cardId}
              rank={rank}
              countdown={getCard(cardId).countdown}
            />
          </span>
        </span>
        <RankLine light={light} animation={form} />
      </span>
    </>
  );
};

/**
 * The card at the top of a panel, at the Rank that the panel shows. After a
 * Combine, it turns over to the new Rank with the Rank burst of the Pack
 * reveal. After an Extract, the copy lifts off it and melts into Essence.
 * After a Craft, the new copy forms on it out of the Essence. With reduced
 * motion, it changes at once.
 */
export const CardPreview = ({
  cardId,
  rank,
  burst = null,
  extraction = null,
  forming = null,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly burst?: Burst | null;
  readonly extraction?: Extraction | null;
  readonly forming?: Forming | null;
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
    {forming?.cardId === cardId ? (
      <CraftGhost
        key={`craft-${forming.serial}`}
        cardId={cardId}
        rank={forming.rank}
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
 * The top of a panel: the card at the Rank that the panel shows, its name in
 * Cinzel, the Rank with its gems, and what the station adds under them.
 */
export const PanelHeader = ({
  cardId,
  rank,
  preview,
  children,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly preview: ReactNode;
  readonly children?: ReactNode;
}) => {
  const { tr } = useGameText();
  return (
    <div className="flex gap-3 [@media(max-height:500px)]:w-[118px] [@media(max-height:500px)]:shrink-0 [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:gap-1">
      {preview}
      <div className="flex min-w-0 flex-1 flex-col gap-1 [@media(max-height:500px)]:gap-0.5">
        <h2
          id="workshop-card-name"
          className="font-display text-gold-light text-lg leading-tight font-bold [@media(max-height:500px)]:text-sm"
        >
          {tr(`cards.${cardId}.name`)}
        </h2>
        <p
          className="text-cream flex items-center gap-1.5 text-xs font-bold [@media(max-height:500px)]:text-[10px]"
          data-testid="workshop-shown-rank"
        >
          {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
          <span className="text-[9px] [@media(max-height:500px)]:text-[7px]">
            <RankGems rank={rank} />
          </span>
          {tr(`ranks.${rank}`)}
        </p>
        {children ? <div className="mt-auto">{children}</div> : null}
      </div>
    </div>
  );
};

/**
 * The path to Legendary (GDD 7.4): a gold fill in a groove, as "Cards found",
 * with each copy counted as Base Rank copies, and the copies and the Coin
 * still needed.
 */
export const PathTrack = ({ path }: { readonly path: LegendaryPath }) => {
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
            <Label className="text-cream-dim text-xs font-bold [@media(max-height:500px)]:text-[10px]">
              {tr("workshop.path.label")}
            </Label>
            <span className="text-cream text-xs font-black tabular-nums [@media(max-height:500px)]:text-[10px]">
              {tr("workshop.path.value", {
                value: path.value,
                target: path.target,
              })}
            </span>
          </span>
          <span
            className={cn(
              "bg-plate-socket relative h-2 w-full overflow-hidden rounded-full [@media(max-height:500px)]:h-1.5",
              WORKSHOP_WELL_DROP
            )}
          >
            <span
              className="from-gold-light to-gold absolute inset-0 origin-left rounded-full bg-gradient-to-r motion-safe:transition-[scale] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ scale: `${percentage / 100} 1` }}
            />
          </span>
          <span
            className="text-cream-dim text-xs leading-snug font-semibold [@media(max-height:500px)]:text-[10px]"
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

/**
 * The Rank that a row or a rung of a panel shows on the card: the one under
 * the pointer, else the one with the focus, until the focus leaves the panel
 * (`data-peek`). `hold` keeps the new copy of an action on the card until the
 * Player moves the pointer or the focus to a row. `focusQuietly` moves the
 * focus for the panel itself, so that the move does not end the hold.
 */
export const usePanelPeek = (panel: RefObject<HTMLElement | null>) => {
  const moving = useRef(false);
  const [hovered, setHovered] = useState<RankId | null>(null);
  const [focused, setFocused] = useState<RankId | null>(null);
  const [hold, setHold] = useState(false);

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
      if (!moving.current) {
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
  }, [panel]);

  return {
    peeked: hovered ?? focused,
    hold,
    setHold,
    focusQuietly: (target: HTMLElement) => {
      moving.current = true;
      target.focus();
      moving.current = false;
    },
    peek: (rank: RankId | null) => {
      setHovered(rank);
      if (rank !== null) {
        setHold(false);
      }
    },
  };
};

/** The panel of a station: a HUD plate, a column on a tall screen and a row on a short one. */
export const panelClassName = cn(
  PLATE,
  "relative flex max-h-full min-h-0 w-[min(380px,40vw)] shrink-0 flex-col gap-3 p-3 outline-none",
  // On a short screen, the card and its text are a column at the left of the
  // rows, so that all the rows show.
  "[@media(max-height:500px)]:w-[min(400px,47vw)] [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-1.5"
);

/** The scroll column of the rows of a panel. */
export const rowsClassName =
  "-mx-1 flex min-h-0 min-w-0 [scrollbar-width:thin] [scrollbar-color:var(--color-wood-light)_transparent] flex-col overflow-y-auto overscroll-contain px-1 [@media(max-height:500px)]:flex-1";
