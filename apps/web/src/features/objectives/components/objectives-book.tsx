import { useMediaQuery } from "@reactuses/core";
import { cn } from "cn";
import type { ReactNode } from "react";

import { BRONZE } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";
import {
  OBJECTIVES_LEDGER,
  OBJECTIVES_LEDGER_CSS,
} from "@/features/objectives/tokens";
import { shortcutImage } from "@/features/town/town";

/**
 * A screen with room for 2 pages and for the bookmarks at the side of the book.
 * A smaller screen shows one page at a time.
 */
const SPREAD_SCREEN = "(min-width: 1200px) and (min-height: 501px)";

/** True when the ledger shows 2 pages. */
export const useSpread = () => useMediaQuery(SPREAD_SCREEN, false);

/** The left page of a spread. It sits on the parchment of the open book. */
export const LeftPage = ({ children }: { readonly children: ReactNode }) => (
  <div
    className="bg-parchment relative flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain rounded-l-[10px] py-5 pr-10 pl-6"
    data-testid="objectives-left-page"
  >
    {children}
  </div>
);

/** The fold between the 2 pages. */
export const LedgerSpine = () => (
  <span
    className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-20 -translate-x-1/2"
    style={{ backgroundImage: OBJECTIVES_LEDGER_CSS.spine }}
    aria-hidden
  />
);

/** The leather of the ledger, for the body and both sides of the cover. */
export const LEDGER_LEATHER = {
  borderColor: OBJECTIVES_LEDGER.edge,
  background: OBJECTIVES_LEDGER_CSS.leather,
} as const;

/** A bronze corner of the cover, as on the Deck book. */
export const LedgerCorner = ({ className }: { readonly className: string }) => (
  <span
    className={cn(
      "border-gold-deep pointer-events-none absolute size-6 [@media(max-height:500px)]:size-4",
      className
    )}
    style={{ background: BRONZE }}
    aria-hidden
  />
);

/**
 * The front cover of the closed ledger. It turns over on the spine when the
 * book opens, and back when it closes; at rest it is hidden. The outside has
 * the Objectives trophy and the title; the inside is the blank left page,
 * which gives way to the real page when the cover lies down.
 */
export const LedgerCover = () => {
  const { tr } = useGameText();
  return (
    <div
      className="pointer-events-none invisible absolute inset-y-0 right-0 left-1/2 z-20 origin-left [transform-style:preserve-3d] motion-safe:group-data-[entering]/book:animate-[deck-cover_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover_500ms_linear_reverse_both]"
      aria-hidden
    >
      <div
        className="absolute inset-0 grid place-items-center overflow-hidden rounded-l-[4px] rounded-r-[18px] border-2 border-l-0 [backface-visibility:hidden] motion-safe:group-data-[entering]/book:animate-[deck-cover-front_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover-front_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-r-xl"
        style={LEDGER_LEATHER}
      >
        <span className="border-gold-trim/35 absolute inset-1.5 left-0 rounded-r-[13px] border border-l-0 [@media(max-height:500px)]:rounded-r-lg" />
        {/* The hinge groove next to the spine. */}
        <span
          className="absolute inset-y-0 left-3 w-[3px] [@media(max-height:500px)]:left-2"
          style={{
            backgroundColor: OBJECTIVES_LEDGER.hinge,
            boxShadow: OBJECTIVES_LEDGER_CSS.hingeLight,
          }}
        />
        <LedgerCorner className="-top-px -right-px rounded-tr-[18px] rounded-bl-lg border-b-2 border-l-2" />
        <LedgerCorner className="-right-px -bottom-px rounded-tl-lg rounded-br-[18px] border-t-2 border-l-2" />
        <div
          className="border-gold-trim/45 flex flex-col items-center gap-3 rounded-xl border px-8 py-6 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-3"
          style={{ boxShadow: OBJECTIVES_LEDGER_CSS.coverWell }}
        >
          <img
            src={shortcutImage("objectives")}
            alt=""
            width={128}
            height={128}
            draggable={false}
            className="size-32 select-none [@media(max-height:500px)]:size-16"
            style={{ filter: OBJECTIVES_LEDGER_CSS.iconDrop }}
          />
          <span className="font-display text-cream text-3xl font-black tracking-wide [@media(max-height:500px)]:text-lg">
            {tr("objectives.title")}
          </span>
        </div>
      </div>
      {/* The inside of the cover: the left half of the open book, with a blank page. */}
      <div
        className="absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-l-[18px] rounded-r-[4px] border-2 border-r-0 [backface-visibility:hidden] motion-safe:group-data-[entering]/book:animate-[deck-cover-back_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover-back_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-l-xl"
        style={LEDGER_LEATHER}
      >
        <span className="border-gold-trim/35 absolute inset-1.5 right-0 rounded-l-[13px] border border-r-0 [@media(max-height:500px)]:rounded-l-lg" />
        <span
          className="bg-parchment absolute top-14 right-0 bottom-2.5 left-2.5 rounded-l-[10px] [@media(max-height:500px)]:top-9 [@media(max-height:500px)]:bottom-1.5 [@media(max-height:500px)]:left-1.5"
          style={{
            backgroundImage: OBJECTIVES_LEDGER_CSS.coverPage,
            boxShadow: OBJECTIVES_LEDGER_CSS.pageStack,
          }}
        />
      </div>
    </div>
  );
};
