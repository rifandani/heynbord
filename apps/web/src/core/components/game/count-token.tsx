import { cn } from "cn";
import type { ReactNode } from "react";

export type CountTokenTone = "gold" | "ink";
export type CountTokenSize = "sm" | "md" | "lg";

const SIZE: Readonly<Record<CountTokenSize, string>> = {
  sm: "text-micro h-[18px] min-w-[18px] border",
  md: "h-5 min-w-5 border-2 text-[11px]",
  lg: "h-6 min-w-6 border-2 text-xs",
};

const TONE: Readonly<Record<CountTokenTone, string>> = {
  /* The gold count token of the Town Bar: a calm count, never red. */
  gold: "border-gold-deep bg-gradient-to-b from-gold-light to-gold text-ink-on-gold shadow-piece-press",
  /* The same token on a gold button: a dark plate, so the number stays legible. */
  ink: "border-gold-deep bg-ink-on-gold text-gold-light",
};

/**
 * The small count token of the game (DESIGN.md, Achievements badge): a gold
 * pill with an Inter 900 number. It shows the number of things that wait
 * (unclaimed Achievements, cards that a Claim all covers, copies in a slot).
 *
 * It is decorative unless it has a `label`; the control that holds it names
 * the count in its own accessible name.
 */
export const CountToken = ({
  count,
  max = 99,
  tone = "gold",
  size = "md",
  label,
  className,
  children,
}: {
  readonly count: number;
  /** Above this count the token shows "N+", so it never grows the piece. */
  readonly max?: number;
  readonly tone?: CountTokenTone;
  readonly size?: CountTokenSize;
  readonly label?: string;
  readonly className?: string;
  /** A different mark from the count, e.g. a lock and a level. */
  readonly children?: ReactNode;
}) => {
  if (children === undefined && count <= 0) {
    return null;
  }
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "grid place-items-center rounded-full px-1 leading-none font-black tabular-nums",
        SIZE[size],
        TONE[tone],
        className
      )}
    >
      {children ?? (count > max ? `${max}+` : count)}
    </span>
  );
};
