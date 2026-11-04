import { cn } from "cn";
import type { CSSProperties } from "react";
import { Button, Meter } from "react-aria-components";

import {
  ACHIEVEMENTS_CLAIM_PRESS_SHADOW,
  ACHIEVEMENTS_CLAIM_SHADOW,
  ACHIEVEMENTS_CLAIMED_SHADOW,
  ACHIEVEMENTS_PROGRESS_TRACK_SHADOW,
  ACHIEVEMENTS_SEAL_FACE,
  ACHIEVEMENTS_SEAL_SHADOW,
} from "@/features/achievements/tokens";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { useCoinFormat } from "@/features/packs/use-coin-format";

/** The width of the state slot at the right of each row: the bar, Claim or the Claimed badge. */
export const STATE_SLOT =
  "w-40 [@media(max-height:500px)]:w-[7.5rem] max-[720px]:w-[7.5rem]";

/** The progress bar of an In progress row: a socket with a gold fill, and "41 / 65". */
export const RowProgress = ({
  current,
  target,
  testId,
}: {
  readonly current: number;
  readonly target: number;
  readonly testId: string;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  return (
    <Meter
      value={current}
      maxValue={target}
      aria-label={tr("objectives.progress")}
      valueLabel={tr("objectives.progressLabel", {
        current: format(current),
        target: format(target),
      })}
      className={cn("flex items-center gap-2", STATE_SLOT)}
      data-testid={testId}
      data-current={current}
      data-target={target}
    >
      {({ percentage }) => (
        <>
          <span
            className="bg-plate-socket relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full [@media(max-height:500px)]:h-2"
            style={{ boxShadow: ACHIEVEMENTS_PROGRESS_TRACK_SHADOW }}
          >
            <span
              className="from-gold to-gold-light absolute inset-y-0 left-0 rounded-full bg-gradient-to-r"
              style={{ width: `${percentage}%` }}
            />
          </span>
          <span
            aria-hidden
            className="text-ink shrink-0 text-[13px] font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-[11px]"
          >
            {tr("objectives.count", {
              current: format(current),
              target: format(target),
            })}
          </span>
        </>
      )}
    </Meter>
  );
};

/**
 * The Claimed badge of a Claimed row: a parchment pill with the shape of the
 * Claim token, with the gold check seal where the token has its star, and
 * "Claimed". It is parchment, because it is not an action (The Gold Means Act
 * Rule). It stamps onto the parchment when the Player claims the row while the
 * dialog is open (`stamp` is its wait in ms), and it is still when the row was
 * Claimed before. With reduced motion, it shows at once.
 */
export const ClaimedBadge = ({
  stamp,
  testId,
}: {
  readonly stamp: number | null;
  readonly testId: string;
}) => {
  const { tr } = useGameText();
  return (
    <span className={cn("flex", STATE_SLOT)}>
      <span
        className={cn(
          "border-parchment-rule bg-parchment-deep text-ink-soft flex h-8 items-center gap-1.5 rounded-full border-2 py-0 pr-3.5 pl-1 text-[13px] font-bold",
          "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:pr-2.5 [@media(max-height:500px)]:text-xs",
          stamp !== null &&
            "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={
          stamp === null
            ? { boxShadow: ACHIEVEMENTS_CLAIMED_SHADOW }
            : ({
                animationDelay: `${stamp}ms`,
                boxShadow: ACHIEVEMENTS_CLAIMED_SHADOW,
              } satisfies CSSProperties)
        }
        data-testid={testId}
      >
        <span
          aria-hidden
          className="border-gold-deep text-ink-on-gold grid size-6 shrink-0 place-items-center rounded-full border [@media(max-height:500px)]:size-5"
          style={{
            background: ACHIEVEMENTS_SEAL_FACE,
            boxShadow: ACHIEVEMENTS_SEAL_SHADOW,
          }}
        >
          <GlyphIcon
            glyph="check"
            className="size-3.5 [@media(max-height:500px)]:size-3"
          />
        </span>
        {tr("objectives.claimed")}
      </span>
    </span>
  );
};

/** The gold Claim token of a Completed row. `claimId` is the target of the focus after a Claim. */
export const ClaimToken = ({
  label,
  claimId,
  testId,
  onClaim,
}: {
  readonly label: string;
  readonly claimId: string;
  readonly testId: string;
  readonly onClaim: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <span className={cn("flex", STATE_SLOT)}>
      <Button
        onPress={onClaim}
        aria-label={label}
        className={cn(
          "border-gold-deep from-gold-light to-gold text-ink-on-gold flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-2 bg-gradient-to-b py-0 pr-3.5 pl-1.5 text-[13px] font-bold outline-none select-none",
          "shadow-[var(--claim-shadow)] transition-[transform,filter] duration-100",
          "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4 data-[hovered]:brightness-110 data-[pressed]:translate-y-px data-[pressed]:shadow-[var(--claim-press-shadow)]",
          "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:pr-2.5 [@media(max-height:500px)]:text-xs"
        )}
        // SAFETY: two CSS custom properties for the drop of the Claim
        // button. React's `CSSProperties` does not model custom properties.
        style={
          {
            "--claim-shadow": ACHIEVEMENTS_CLAIM_SHADOW,
            "--claim-press-shadow": ACHIEVEMENTS_CLAIM_PRESS_SHADOW,
          } as CSSProperties
        }
        data-testid={testId}
        data-claim={claimId}
      >
        {/* The four-point star of the Heynbord emblem, struck on the token. */}
        <span
          aria-hidden
          className="bg-ink-on-gold text-gold-light grid size-5 place-items-center rounded-full [@media(max-height:500px)]:size-4"
        >
          <svg
            viewBox="-10 -10 20 20"
            className="size-3 [@media(max-height:500px)]:size-2.5"
          >
            <path
              d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
        {tr("objectives.claim")}
      </Button>
    </span>
  );
};
