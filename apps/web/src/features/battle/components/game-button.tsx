import type { ButtonProps } from "react-aria-components";
import { Button } from "react-aria-components";
import { tv } from "tailwind-variants";

/** Heynbord buttons: wood and gold, with high-contrast text (art direction 6, WCAG 2.2 AA). */
export const gameButtonStyles = tv({
  base: [
    "relative inline-flex items-center justify-center gap-2 rounded-lg border-2 font-semibold select-none",
    "shadow-[0_3px_0_rgba(0,0,0,0.45)] transition-[transform,filter] duration-100 outline-none",
    "data-[hovered]:brightness-110 data-[pressed]:translate-y-px data-[pressed]:shadow-[0_1px_0_rgba(0,0,0,0.45)]",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[disabled]:grayscale",
  ],
  variants: {
    intent: {
      gold: "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]",
      wood: "border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] text-[#fff6df]",
      ghost: "border-[#fff6df]/30 bg-[#1c140e]/70 text-[#fff6df]",
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

export const GameButton = ({
  intent,
  size,
  className,
  ...props
}: ButtonProps & {
  readonly intent?: "gold" | "wood" | "ghost";
  readonly size?: "sm" | "md" | "lg" | "icon";
  readonly className?: string;
}) => (
  <Button
    {...props}
    className={gameButtonStyles({ intent, size, className })}
  />
);
