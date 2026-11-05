import type { AchievementState } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";
import { Button, Meter } from "react-aria-components";
import { tv } from "tailwind-variants";

import type { AchievementFrame } from "@/features/achievements/achievements";
import {
  ACHIEVEMENTS_CLAIM_PRESS_SHADOW,
  ACHIEVEMENTS_CLAIM_SHADOW,
  ACHIEVEMENTS_PROGRESS_TRACK_SHADOW,
} from "@/features/achievements/tokens";
import { useGameText } from "@/features/battle/use-game-text";
import {
  OBJECTIVES_CLAIMED_TINT,
  OBJECTIVES_EMERALD_FILL,
  OBJECTIVES_EMERALD_GLOW,
  OBJECTIVES_SILVER_TINT,
  OBJECTIVES_TRAY_CARVE,
  OBJECTIVES_TRAY_WELL,
  OBJECTIVES_WAX,
  OBJECTIVES_WAX_SHADOW,
} from "@/features/objectives/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";

/** The wait between 2 cards of a cascade. */
const CARD_DROP_MS = 15;

/** The cards after this one drop with the last delay: all land in 150ms. */
const CARD_DROP_LAST = 4;

/** The tint of a card, for the tints that have no token utility. */
const cardTint = (
  state: AchievementState,
  frame: AchievementFrame
): string | undefined => {
  if (frame === "gold") {
    return undefined;
  }
  if (state === "claimed") {
    return OBJECTIVES_CLAIMED_TINT;
  }
  return state === "inProgress" && frame === "silver"
    ? OBJECTIVES_SILVER_TINT
    : undefined;
};

/** The style of a card: its tint, and its wait in the cascade of a list. */
export const objectiveCardStyle = (
  index: number,
  state: AchievementState,
  frame: AchievementFrame = "plain"
): CSSProperties => ({
  animationDelay: `${Math.min(index, CARD_DROP_LAST) * CARD_DROP_MS}ms`,
  backgroundColor: cardTint(state, frame),
});

/**
 * One objective, as a card on the parchment (DESIGN.md, Objectives dialog). An
 * In progress card is pressed into the paper. A Completed card comes up out of
 * the paper, lit and with a gold edge. A Claimed card goes flat and grey, so
 * the open goals are in front. An earn-only Cosmetic is a dark Night Plate
 * card and a Feat has a silver edge.
 */
export const objectiveCard = tv({
  base: [
    "relative shrink-0 rounded-xl",
    "transition-[scale,box-shadow,border-color] duration-150",
    "motion-safe:animate-[objectives-card-drop_90ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
  ],
  variants: {
    state: {
      inProgress:
        "shadow-inset-paper hover:shadow-[0_0_0_1px_var(--color-gold-trim),0_4px_12px_color-mix(in_srgb,var(--color-gold)_40%,transparent)] motion-safe:hover:scale-[1.02]",
      completed:
        "shadow-[0_0_0_1px_var(--color-gold),0_3px_0_var(--color-gold-deep),0_7px_14px_color-mix(in_srgb,var(--color-gold-deep)_40%,transparent)] motion-safe:hover:scale-[1.02]",
      claimed: "",
    },
    frame: {
      plain: "",
      silver: "",
      gold: "bg-night-plate text-cream",
    },
  },
  compoundVariants: [
    {
      state: "inProgress",
      frame: "plain",
      class: "border-frame-wood/50 bg-parchment-deep border",
    },
    {
      state: "completed",
      frame: "plain",
      class: "border-gold bg-parchment-lit border",
    },
    {
      state: "completed",
      frame: "silver",
      class: "border-gold bg-parchment-lit border-2",
    },
    {
      state: "claimed",
      frame: "plain",
      class: "border-parchment-rule border",
    },
    {
      state: "inProgress",
      frame: "silver",
      class: "border-pewter border-2",
    },
    {
      state: "claimed",
      frame: "silver",
      class: "border-pewter/60 border-2",
    },
    { state: "inProgress", frame: "gold", class: "border-gold-trim border-2" },
    {
      state: "completed",
      frame: "gold",
      class: "border-ready-gold shadow-ready border-2",
    },
    {
      state: "claimed",
      frame: "gold",
      class: "border-gold-trim/50 bg-plate-socket border-2",
    },
  ],
  defaultVariants: { frame: "plain" },
});

/** The width of the state of an Achievement card: Claim, the stamp or "Not done". */
export const STATE_SLOT = "w-[6.5rem]";

/** The groove and the emerald fill of a progress bar. */
const Groove = ({
  percentage,
  dimmed = false,
  className,
}: {
  readonly percentage: number;
  readonly dimmed?: boolean;
  readonly className?: string;
}) => (
  <span
    className={cn(
      "bg-night-plate relative min-w-0 flex-1 overflow-hidden rounded-full",
      className
    )}
    style={{ boxShadow: ACHIEVEMENTS_PROGRESS_TRACK_SHADOW }}
  >
    <span
      className={cn(
        "absolute inset-y-0 left-0 rounded-full",
        dimmed && "opacity-60 saturate-50"
      )}
      style={{
        width: `${percentage}%`,
        background: OBJECTIVES_EMERALD_FILL,
        boxShadow: dimmed ? undefined : OBJECTIVES_EMERALD_GLOW,
      }}
    />
  </span>
);

/** The progress bar of a Daily Quest: a dark groove, an emerald fill and "2 / 3". */
export const RowProgress = ({
  current,
  target,
  testId,
  dimmed = false,
}: {
  readonly current: number;
  readonly target: number;
  readonly testId: string;
  readonly dimmed?: boolean;
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
      className="flex items-center gap-2.5"
      data-testid={testId}
      data-current={current}
      data-target={target}
    >
      {({ percentage }) => (
        <>
          <Groove
            percentage={percentage}
            dimmed={dimmed}
            className="h-3.5 [@media(max-height:500px)]:h-2.5"
          />
          <span
            aria-hidden
            className={cn(
              "shrink-0 text-[15px] font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-xs",
              dimmed ? "text-ink-soft" : "text-ink"
            )}
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

/** The dark floor at the bottom edge of an Achievement card. */
const FLOOR =
  "bg-plate-socket flex h-[22px] items-center gap-2.5 rounded-b-[10px] px-3 [@media(max-height:500px)]:h-[18px]";

/** The floor of an In progress Achievement: the groove, the fill and "41 / 65". */
export const FloorProgress = ({
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
      className={FLOOR}
      data-testid={testId}
      data-current={current}
      data-target={target}
    >
      {({ percentage }) => (
        <>
          <Groove
            percentage={percentage}
            className="h-2.5 [@media(max-height:500px)]:h-2"
          />
          <span
            aria-hidden
            className="text-cream shrink-0 text-xs font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-[11px]"
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

/** The full floor of a Completed or Claimed Achievement. It is decoration. */
export const FloorFull = ({ dimmed }: { readonly dimmed: boolean }) => (
  <span aria-hidden className={FLOOR}>
    <Groove
      percentage={100}
      dimmed={dimmed}
      className="h-2.5 [@media(max-height:500px)]:h-2"
    />
  </span>
);

/**
 * The Reward Tray: a carved wood frame with a dark velvet well, at the right
 * edge of a card (DESIGN.md, Objectives dialog). A Claimed reward is out of the
 * game, so its tray is an empty line on the parchment with grey icons.
 * `surface` is the card under it.
 */
export const RewardTray = ({
  claimed,
  surface = "paper",
  className,
  children,
}: {
  readonly claimed: boolean;
  readonly surface?: "paper" | "plate";
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <span
    className={cn(
      "flex h-9 shrink-0 items-stretch rounded-lg text-[14px] leading-none font-black tabular-nums",
      "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:text-xs",
      claimed
        ? cn(
            "border p-1 [&_svg]:opacity-60 [&_svg]:grayscale [@media(max-height:500px)]:p-[3px]",
            surface === "paper"
              ? "border-parchment-rule text-ink-soft"
              : "border-gold-trim/40 text-cream-dim"
          )
        : "border-wood-edge from-wood-light to-wood text-cream border-2 bg-gradient-to-b p-[3px] [@media(max-height:500px)]:p-0.5",
      className
    )}
    style={claimed ? undefined : { boxShadow: OBJECTIVES_TRAY_CARVE }}
  >
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-[5px] px-2.5 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:px-1.5",
        !claimed && "bg-night-plate"
      )}
      style={claimed ? undefined : { boxShadow: OBJECTIVES_TRAY_WELL }}
    >
      {children}
    </span>
  </span>
);

/** The points of the edge of the wax seal, in a box of -16 to 16. */
const WAX_EDGE = `${Array.from({ length: 28 }, (_, point) => {
  const angle = (point / 28) * Math.PI * 2;
  const radius = point % 2 === 0 ? 13.6 : 12.2;
  const x = (Math.cos(angle) * radius).toFixed(2);
  const y = (Math.sin(angle) * radius).toFixed(2);
  return `${point === 0 ? "M" : "L"}${x} ${y}`;
}).join(" ")} Z`;

/** The emerald wax seal with the check. It is decoration: the text says "Claimed". */
export const WaxSeal = ({ className }: { readonly className?: string }) => (
  <svg
    viewBox="-16 -16 32 32"
    aria-hidden
    className={cn("-rotate-12", className)}
    style={{ filter: OBJECTIVES_WAX_SHADOW }}
  >
    <path
      d={WAX_EDGE}
      fill={OBJECTIVES_WAX.face}
      stroke={OBJECTIVES_WAX.face}
      strokeWidth={3.5}
      strokeLinejoin="round"
    />
    <circle
      r={9.8}
      fill="none"
      stroke={OBJECTIVES_WAX.edge}
      strokeWidth={1.4}
    />
    <path
      d="M-9.5 -5.5 A11 11 0 0 1 -2 -10.8"
      fill="none"
      stroke={OBJECTIVES_WAX.light}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <path
      d="M-5.6 0.6 L-1.7 4.6 L5.9 -3.9"
      fill="none"
      stroke="var(--color-cream)"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The Claimed stamp of a Claimed card: the emerald wax seal and "Claimed". It
 * has no pill, so it does not read as an action (The Gold Means Act Rule). It
 * stamps onto the card when the Player claims the row while the dialog is open
 * (`stamp` is its wait in ms), and it is still when the row was Claimed before.
 * With reduced motion, it shows at once.
 */
export const ClaimedBadge = ({
  stamp,
  testId,
  className,
}: {
  readonly stamp: number | null;
  readonly testId: string;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  return (
    <span className={cn("flex", className)}>
      <span
        className={cn(
          "font-display flex h-9 items-center gap-1.5 text-[14px] font-bold [@media(max-height:500px)]:h-7 [@media(max-height:500px)]:text-xs",
          stamp !== null &&
            "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={
          stamp === null
            ? undefined
            : ({ animationDelay: `${stamp}ms` } satisfies CSSProperties)
        }
        data-testid={testId}
      >
        <WaxSeal className="size-8 shrink-0 [@media(max-height:500px)]:size-6" />
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
  className,
}: {
  readonly label: string;
  readonly claimId: string;
  readonly testId: string;
  readonly onClaim: () => void;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  return (
    <Button
      onPress={onClaim}
      aria-label={label}
      className={cn(
        "border-gold-deep from-gold-light to-gold text-ink-on-gold flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 bg-gradient-to-b py-0 pr-3.5 pl-1.5 text-sm font-bold outline-none select-none",
        "shadow-[var(--claim-shadow)] transition-[transform,filter] duration-100",
        "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4 data-[hovered]:brightness-110 data-[pressed]:translate-y-px data-[pressed]:shadow-[var(--claim-press-shadow)]",
        "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:pr-2.5 [@media(max-height:500px)]:text-xs",
        className
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
        className="bg-ink-on-gold text-gold-light grid size-6 place-items-center rounded-full [@media(max-height:500px)]:size-4"
      >
        <svg
          viewBox="-10 -10 20 20"
          className="size-3.5 [@media(max-height:500px)]:size-2.5"
        >
          <path
            d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {tr("objectives.claim")}
    </Button>
  );
};
