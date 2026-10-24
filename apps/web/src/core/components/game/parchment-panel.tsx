import { cn } from "cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { gameText, parchmentStyles } from "./surfaces";

/**
 * A parchment panel (DESIGN.md, Parchment panel): parchment-deep with a 4px
 * frame-wood border and a 16px corner. It holds a Cinzel label and a group of
 * options; all text on it is ink.
 */
export const ParchmentPanel = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) => (
  <div {...props} className={cn(parchmentStyles({ kind: "panel" }), className)}>
    {children}
  </div>
);

/** The label of a parchment panel: Cinzel 700 at 18px, ink. */
export const ParchmentLabel = ({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <h2 className={gameText({ role: "title", tone: "ink", className })}>
    {children}
  </h2>
);

/**
 * The well cut into parchment (a list, a reward box, a lane strip): parchment
 * deep with a 2px parchment-rule border and an inner shadow.
 */
export const ParchmentWell = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) => (
  <div
    {...props}
    className={cn(
      parchmentStyles({ kind: "well" }),
      "shadow-inset-paper",
      className
    )}
  >
    {children}
  </div>
);

/** The thin rule that divides two rows of parchment. */
export const ParchmentRule = ({
  className,
}: {
  readonly className?: string;
}) => (
  <span
    aria-hidden
    className={cn("bg-parchment-rule/70 block h-px w-full", className)}
  />
);

/**
 * A small label on parchment that is not a heading: Inter 700 at 11px,
 * uppercase, ink-soft (DESIGN.md, Label).
 */
export const ParchmentOverline = ({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <span
    className={gameText({
      role: "label",
      tone: "soft",
      className: cn("text-[0.6875rem] tracking-[0.04em]", className),
    })}
  >
    {children}
  </span>
);

/** The short gold divider of a Night Plate. */
export const NightPlateRule = ({
  className,
}: {
  readonly className?: string;
}) => (
  <span
    aria-hidden
    className={cn("bg-gold-trim/25 h-5 w-0.5 shrink-0 rounded-full", className)}
  />
);
