import type { ReactNode, Ref } from "react";
import type { ButtonProps } from "react-aria-components";
import { Button } from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing, ghostFace, goldFace, piece, woodFace } from "./surfaces";

/**
 * The Heynbord button (DESIGN.md, Buttons): a chunky wood or gold game token,
 * not a web control. Gold is the one main action of a panel; wood is every
 * other action; ghost is a small HUD control over the Board.
 *
 * It lives in the design-system layer, so a page outside `/play` (the future
 * landing page) builds its buttons from the same piece as the game.
 */
export const gameButtonStyles = tv({
  base: [
    "relative inline-flex items-center justify-center gap-2 rounded-lg border-2 font-semibold select-none",
    "transition-[transform,filter] duration-100",
    piece,
    focusRing,
    "data-[hovered]:brightness-110",
    "data-[disabled]:cursor-not-allowed data-[disabled]:border-dashed data-[disabled]:grayscale",
  ],
  variants: {
    intent: {
      gold: goldFace,
      wood: woodFace,
      ghost: ghostFace,
    },
    size: {
      sm: "min-h-9 px-3 text-sm",
      md: "min-h-11 px-4 text-base",
      lg: "min-h-12 px-6 text-lg",
      icon: "size-10 text-base",
    },
  },
  defaultVariants: { intent: "wood", size: "md" },
});

export type GameButtonIntent = "gold" | "wood" | "ghost";
export type GameButtonSize = "sm" | "md" | "lg" | "icon";

export const GameButton = ({
  intent,
  size,
  className,
  ...props
}: ButtonProps & {
  readonly intent?: GameButtonIntent;
  readonly size?: GameButtonSize;
  readonly className?: string;
  /** The button takes a ref, so that a sheet can come up out of it. */
  readonly ref?: Ref<HTMLButtonElement>;
}) => (
  <Button
    {...props}
    className={gameButtonStyles({ intent, size, className })}
  />
);

/**
 * A square button that is only an icon (a HUD control, a close, a step). The
 * icon is decorative; `aria-label` names the action.
 */
export const GameIconButton = ({
  intent = "ghost",
  className,
  ...props
}: Omit<ButtonProps, "children"> & {
  readonly intent?: GameButtonIntent;
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <Button
    {...props}
    className={gameButtonStyles({ intent, size: "icon", className })}
  />
);

/**
 * The close of a parchment dialog: a square wood button. On parchment a ghost
 * button reads grey, so the close is wood (DESIGN.md, Settings dialog).
 */
export const GameCloseButton = ({
  label,
  className,
  children,
  ...props
}: Omit<ButtonProps, "children" | "aria-label"> & {
  readonly label: string;
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <Button
    {...props}
    aria-label={label}
    className={gameButtonStyles({
      intent: "wood",
      size: "icon",
      className,
    })}
  >
    {children}
  </Button>
);
