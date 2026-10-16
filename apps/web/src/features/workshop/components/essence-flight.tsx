import type { RankId } from "@workspace/rules";
import type { CSSProperties } from "react";
import { useEffect } from "react";

import { RANK_LIGHT } from "@/features/packs/components/pack-reveal";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { ESSENCE_FLY_MS, extractTimeline } from "@/features/workshop/workshop";

/** A point or a box on the screen, in CSS px. */
interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The Essence drops of one Extract, from the panel card to the Essence balance. */
export interface Flight {
  readonly serial: number;
  readonly rank: RankId;
  /** The panel card. */
  readonly from: Box;
  /** The Essence icon on the Balance Plate. */
  readonly to: Box;
}

const boxOf = (element: Element | null): Box | null => {
  if (!element) {
    return null;
  }
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
};

/**
 * The places of the Essence drops of an Extract: the panel card and the
 * Essence icon on the Balance Plate. `null` when one of them is not on the
 * screen. Read them before the Extract, because the panel can change after it.
 */
export const measureFlight = (rank: RankId, serial: number): Flight | null => {
  const from = boxOf(
    document.querySelector('[data-testid="workshop-preview"]')
  );
  const to = boxOf(
    document.querySelector('[data-testid="balance-essence"] svg')
  );
  return from && to ? { serial, rank, from, to } : null;
};

/** The X of each drop goes slowly at the start, and its Y quickly, so the path curves up and across. */
const FLY_X = "cubic-bezier(0.5, 0, 0.75, 0)";
const FLY_Y = "cubic-bezier(0.25, 0.6, 0.35, 1)";

/** One axis of the flight of a drop, `distance` px long. */
const fly = (
  axis: "x" | "y",
  ease: string,
  at: number,
  distance: number
): CSSProperties =>
  // SAFETY: a CSS custom property for the keyframes. React's `CSSProperties`
  // does not model custom properties.
  ({
    animation: `essence-fly-${axis} ${ESSENCE_FLY_MS}ms ${ease} ${at}ms both`,
    [`--fly-${axis}`]: `${distance}px`,
  }) as CSSProperties;

/** A spread over the card that looks random but is the same each time. */
const spread = (index: number) => (index * 0.618 + 0.31) % 1;

/** The time that the catch light stays after the last drop. */
const CATCH_TAIL_MS = 420;

/**
 * The Essence drops of an Extract (GDD 7.4): each drop forms on the melt line
 * of the copy while the line goes up the card, rises out of it, and flies on a
 * curve into the Essence balance, with a glow in the Rank light. The balance
 * takes them in with a light that comes up and fades; an Epic or a Legendary
 * Extract sends a ring out of it too. The layer covers the screen and lets
 * the pointer through. With reduced motion, it does not show.
 */
export const EssenceFlight = ({
  flight,
  onDone,
}: {
  readonly flight: Flight;
  readonly onDone: (serial: number) => void;
}) => {
  const { rank, from, to, serial } = flight;
  const { dropAt, firstArrival, lastArrival } = extractTimeline(rank);
  const light = RANK_LIGHT[rank];
  const target = { x: to.x + to.width / 2, y: to.y + to.height / 2 };

  useEffect(() => {
    const timer = window.setTimeout(
      () => onDone(serial),
      lastArrival + CATCH_TAIL_MS + 100
    );
    return () => window.clearTimeout(timer);
  }, [lastArrival, onDone, serial]);

  return (
    <span
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden motion-reduce:hidden"
      data-testid="essence-flight"
      data-rank={rank}
      data-drops={dropAt.length}
      aria-hidden
    >
      <span
        className="absolute size-11 -translate-1/2 animate-[essence-catch_ease-out_both] rounded-full opacity-0 [@media(max-height:500px)]:size-9"
        style={{
          left: target.x,
          top: target.y,
          animationDuration: `${lastArrival - firstArrival + CATCH_TAIL_MS}ms`,
          animationDelay: `${firstArrival - 60}ms`,
          background: `radial-gradient(closest-side, #fff6df, ${light}cc 45%, transparent)`,
        }}
      />
      {rank === "epic" || rank === "legendary" ? (
        <span
          className="absolute size-10 -translate-1/2 animate-[pack-ring_700ms_cubic-bezier(0.2,0.8,0.2,1)_both] rounded-full border-2 opacity-0 [@media(max-height:500px)]:size-8"
          style={{
            left: target.x,
            top: target.y,
            borderColor: light,
            animationDelay: `${lastArrival - 40}ms`,
          }}
        />
      ) : null}
      {dropAt.map((at, index) => {
        // Each drop leaves the line where it is at that time: the first one
        // at the bottom of the card, the last one at the top.
        const x = from.x + from.width * (0.18 + 0.64 * spread(index));
        const y = from.y + from.height * (1 - (index + 0.5) / dropAt.length);
        return (
          <span
            key={at}
            className="absolute"
            style={{ left: x, top: y, ...fly("x", FLY_X, at, target.x - x) }}
          >
            <span className="block" style={fly("y", FLY_Y, at, target.y - y)}>
              <span
                className="block size-5 -translate-1/2 [@media(max-height:500px)]:size-4"
                style={{
                  animation: `essence-drop ${ESSENCE_FLY_MS}ms linear ${at}ms both`,
                  filter: `drop-shadow(0 0 4px ${light}) drop-shadow(0 0 1px #fff6df)`,
                }}
              >
                <BalanceIcon kind="essence" className="size-full" />
              </span>
            </span>
          </span>
        );
      })}
    </span>
  );
};
