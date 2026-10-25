import type { RankId } from "@workspace/rules";
import type { CSSProperties } from "react";
import { useEffect } from "react";

import { RANK_LIGHT } from "@/features/packs/components/pack-reveal";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import {
  craftTimeline,
  ESSENCE_FLY_MS,
  extractTimeline,
} from "@/features/workshop/workshop";

/** A point or a box on the screen, in CSS px. */
interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The Essence drops of one action. An Extract sends them `out`, from the
 * panel card to the Essence balance. A Craft sends them `in`, from the
 * balance to the panel card.
 */
export interface Flight {
  readonly serial: number;
  readonly rank: RankId;
  readonly direction: "out" | "in";
  /** The panel card. */
  readonly card: Box;
  /** The Essence icon on the Balance Plate. */
  readonly balance: Box;
}

const boxOf = (element: Element | null): Box | null => {
  if (!element) {
    return null;
  }
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
};

/**
 * The places of the Essence drops of an Extract or a Craft: the panel card and
 * the Essence icon on the Balance Plate. `null` when one of them is not on the
 * screen. Read them before the action, because the panel can change after it.
 */
export const measureFlight = (
  rank: RankId,
  serial: number,
  direction: Flight["direction"]
): Flight | null => {
  const card = boxOf(
    document.querySelector('[data-testid="workshop-preview"]')
  );
  const balance = boxOf(
    document.querySelector('[data-testid="balance-essence"] svg')
  );
  return card && balance ? { serial, rank, direction, card, balance } : null;
};

/**
 * A slow start and a fast start. Out of the card, the X starts slowly and the
 * Y quickly, so the path rises first and then goes across. Into the card, the
 * axes change places, so the path goes across first and then down.
 */
const SLOW_START = "cubic-bezier(0.5, 0, 0.75, 0)";
const FAST_START = "cubic-bezier(0.25, 0.6, 0.35, 1)";

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

/** A point on the screen, in CSS px. */
interface Point {
  readonly x: number;
  readonly y: number;
}

/** One drop: where it leaves, where it goes, and when it leaves. */
interface Drop {
  readonly at: number;
  readonly from: Point;
  readonly to: Point;
}

/**
 * The drops of a flight, and the times of the light at the balance. A drop
 * out of the card leaves the melt line where it is at that time: the first one
 * at the bottom of the card, the last one at the top. A drop into the card
 * goes to the form line where it will be when the drop gets there, so the copy
 * forms out of the drops in the same order.
 */
const flightDrops = (
  flight: Flight
): {
  readonly drops: readonly Drop[];
  readonly lightAt: number;
  readonly lightMs: number;
  readonly doneAt: number;
} => {
  const { rank, card, balance, direction } = flight;
  const center = {
    x: balance.x + balance.width / 2,
    y: balance.y + balance.height / 2,
  };
  const timeline =
    direction === "out" ? extractTimeline(rank) : craftTimeline(rank);
  const count = timeline.dropAt.length;
  const onCard = (index: number): Point => ({
    x: card.x + card.width * (0.18 + 0.64 * spread(index)),
    y: card.y + card.height * (1 - (index + 0.5) / count),
  });
  const drops = timeline.dropAt.map((at, index) =>
    direction === "out"
      ? { at, from: onCard(index), to: center }
      : { at, from: center, to: onCard(index) }
  );
  const first = timeline.dropAt[0] ?? 0;
  const last = timeline.dropAt.at(-1) ?? first;
  // Out: the balance takes the drops in. In: the balance lets them go.
  return direction === "out"
    ? {
        drops,
        lightAt: first + ESSENCE_FLY_MS - 60,
        lightMs: last - first + CATCH_TAIL_MS,
        doneAt: last + ESSENCE_FLY_MS + CATCH_TAIL_MS + 100,
      }
    : {
        drops,
        lightAt: 0,
        lightMs: last + CATCH_TAIL_MS,
        doneAt: last + ESSENCE_FLY_MS + 100,
      };
};

/**
 * The Essence drops of an Extract or a Craft (GDD 7.4). Out: each drop forms
 * on the melt line of the copy while the line goes up the card, rises out of
 * it, and flies on a curve into the Essence balance, with a glow in the Rank
 * light. The balance takes them in with a light that comes up and fades; an
 * Epic or a Legendary Extract sends a ring out of it too. In: the balance lets
 * the drops go with the same light, and each one flies on a curve into the
 * form line of the new copy. The layer covers the screen and lets the pointer
 * through. With reduced motion, it does not show.
 */
export const EssenceFlight = ({
  flight,
  onDone,
}: {
  readonly flight: Flight;
  readonly onDone: (serial: number) => void;
}) => {
  const { rank, balance, serial, direction } = flight;
  const { drops, lightAt, lightMs, doneAt } = flightDrops(flight);
  const light = RANK_LIGHT[rank];
  const target = {
    x: balance.x + balance.width / 2,
    y: balance.y + balance.height / 2,
  };
  const [xEase, yEase] =
    direction === "out" ? [SLOW_START, FAST_START] : [FAST_START, SLOW_START];

  useEffect(() => {
    const timer = window.setTimeout(() => onDone(serial), doneAt);
    return () => window.clearTimeout(timer);
  }, [doneAt, onDone, serial]);

  return (
    <span
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden motion-reduce:hidden"
      data-testid="essence-flight"
      data-rank={rank}
      data-direction={direction}
      data-drops={drops.length}
      aria-hidden
    >
      <span
        className="absolute size-11 -translate-1/2 animate-[essence-catch_ease-out_both] rounded-full opacity-0 [@media(max-height:500px)]:size-9"
        style={{
          left: target.x,
          top: target.y,
          animationDuration: `${lightMs}ms`,
          animationDelay: `${lightAt}ms`,
          background: `radial-gradient(closest-side, #fff6df, ${light}cc 45%, transparent)`,
        }}
      />
      {direction === "out" && (rank === "epic" || rank === "legendary") ? (
        <span
          className="absolute size-10 -translate-1/2 animate-[pack-ring_700ms_cubic-bezier(0.2,0.8,0.2,1)_both] rounded-full border-2 opacity-0 [@media(max-height:500px)]:size-8"
          style={{
            left: target.x,
            top: target.y,
            borderColor: light,
            animationDelay: `${doneAt - CATCH_TAIL_MS - 140}ms`,
          }}
        />
      ) : null}
      {drops.map(({ at, from, to }) => (
        <span
          key={at}
          className="absolute"
          style={{
            left: from.x,
            top: from.y,
            ...fly("x", xEase, at, to.x - from.x),
          }}
        >
          <span className="block" style={fly("y", yEase, at, to.y - from.y)}>
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
      ))}
    </span>
  );
};
