import type { CSSProperties } from "react";
import { useEffect } from "react";

import {
  CAST_COLOR,
  ESSENCE_METAL,
  HEYNSTONE_METAL,
  SIDE_COLORS,
} from "@/core/components/game/tokens";
import type { RewardBalance } from "@/features/achievements/achievements";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** The time of the flight of a claimed reward to its balance. */
export const REWARD_FLY_MS = 620;

/** A box on the screen, in CSS px. */
interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** One claimed reward on its way from its row to its balance on the Balance Plate. */
export interface RewardFlightPath {
  readonly serial: number;
  readonly kind: RewardBalance;
  readonly from: Box;
  readonly to: Box;
  /** The wait before the flight starts, for the flights of a Claim all. */
  readonly delay: number;
}

const boxOf = (element: Element | null): Box | null => {
  if (!element) {
    return null;
  }
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
};

/**
 * The path of a reward from `from` (its reward chip, or the Claim all
 * button) to its icon on the Balance Plate. `null` when one of them is not on
 * the screen. Read it before the Claim, because the row changes after it.
 */
export const measureRewardFlight = (
  from: Element | null,
  kind: RewardBalance,
  serial: number,
  delay = 0
): RewardFlightPath | null => {
  const start = boxOf(from);
  const end = boxOf(
    document.querySelector(`[data-testid="balance-${kind}"] svg`)
  );
  return start && end ? { serial, kind, from: start, to: end, delay } : null;
};

/** The X goes slowly at the start and the Y quickly, so the path curves up and across. */
const FLY_X = "cubic-bezier(0.5, 0, 0.75, 0)";
const FLY_Y = "cubic-bezier(0.25, 0.6, 0.35, 1)";

/** One axis of the flight, `distance` px long, with the keyframes of the Essence drops. */
const fly = (
  axis: "x" | "y",
  ease: string,
  delay: number,
  distance: number
): CSSProperties =>
  // SAFETY: a CSS custom property for the keyframes. React's `CSSProperties`
  // does not model custom properties.
  ({
    animation: `essence-fly-${axis} ${REWARD_FLY_MS}ms ${ease} ${delay}ms both`,
    [`--fly-${axis}`]: `${distance}px`,
  }) as CSSProperties;

/** The time that the catch light stays after the reward gets to its balance. */
const CATCH_MS = 420;

/** The light of each balance when it takes a reward in. */
const CATCH_LIGHT: Readonly<Record<RewardBalance, string>> = {
  heynstones: HEYNSTONE_METAL.face,
  coin: SIDE_COLORS.player.main,
  essence: ESSENCE_METAL.face,
};

/**
 * A claimed reward (Achievements 4): its icon rises out of its row and flies
 * on a curve into its balance on the Balance Plate, which takes it in with a
 * light that comes up and fades. The layer covers the screen and lets the
 * pointer through. With reduced motion, it does not show.
 */
export const RewardFlight = ({
  flight,
  onDone,
}: {
  readonly flight: RewardFlightPath;
  readonly onDone: (serial: number) => void;
}) => {
  const { kind, from, to, serial, delay } = flight;
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const target = { x: to.x + to.width / 2, y: to.y + to.height / 2 };

  useEffect(() => {
    const timer = window.setTimeout(
      () => onDone(serial),
      delay + REWARD_FLY_MS + CATCH_MS + 100
    );
    return () => window.clearTimeout(timer);
  }, [delay, onDone, serial]);

  return (
    <span
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden motion-reduce:hidden"
      data-testid="reward-flight"
      data-kind={kind}
      aria-hidden
    >
      <span
        className="absolute size-11 -translate-1/2 animate-[essence-catch_ease-out_both] rounded-full opacity-0 [@media(max-height:500px)]:size-9"
        style={{
          left: target.x,
          top: target.y,
          animationDuration: `${CATCH_MS + 160}ms`,
          animationDelay: `${delay + REWARD_FLY_MS - 80}ms`,
          background: `radial-gradient(closest-side, ${CAST_COLOR}, ${CATCH_LIGHT[kind]}cc 45%, transparent)`,
        }}
      />
      <span
        className="absolute"
        style={{
          left: start.x,
          top: start.y,
          ...fly("x", FLY_X, delay, target.x - start.x),
        }}
      >
        <span
          className="block"
          style={fly("y", FLY_Y, delay, target.y - start.y)}
        >
          <span
            className="block size-7 -translate-1/2 [@media(max-height:500px)]:size-5"
            style={{
              animation: `essence-drop ${REWARD_FLY_MS}ms linear ${delay}ms both`,
              filter: `drop-shadow(0 0 5px ${CATCH_LIGHT[kind]}) drop-shadow(0 0 1px ${CAST_COLOR})`,
            }}
          >
            <BalanceIcon kind={kind} className="size-full" />
          </span>
        </span>
      </span>
    </span>
  );
};
