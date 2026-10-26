"use client"

import { composeRenderProps } from "react-aria-components/composeRenderProps"
import { ToggleButton, type ToggleButtonProps } from "react-aria-components/ToggleButton"
import { cn } from "cn"
import { tv, type VariantProps } from "tailwind-variants"
import { controlFace } from "@/core/components/game/surfaces"

export const toggleStyles = tv({
  base: [
    controlFace,
    "text-base forced-colors:border-[ButtonBorder] forced-colors:text-[ButtonText]",
    "*:[svg]:shrink-0 *:[svg]:self-center *:[svg]:opacity-80",
    "selected:border-gold-deep selected:bg-gradient-to-b selected:from-gold-light selected:to-gold selected:text-ink-on-gold selected:shadow-piece",
  ],
  variants: {
    intent: {
      outline:
        "border-input bg-(--control-bg) text-fg data-[hovered]:border-bronze-rim data-[hovered]:brightness-100",
      plain:
        "border-transparent bg-transparent text-fg shadow-none! data-[hovered]:bg-accent/40 data-[hovered]:brightness-100 data-[pressed]:shadow-none!",
    },
    size: {
      xs: "min-h-8 gap-x-1.5 px-2.5 py-1 text-sm",
      sm: "min-h-9 gap-x-1.5 px-3 py-1.5 text-sm",
      md: "min-h-11 gap-x-2 px-4 py-2 text-base",
      lg: "min-h-12 gap-x-2 px-6 py-2.5 text-base",
      "sq-xs": "touch-target size-8 shrink-0",
      "sq-sm": "touch-target size-10 shrink-0",
      "sq-md": "touch-target size-11 shrink-0",
      "sq-lg": "touch-target size-12 shrink-0",
    },
    isCircle: {
      true: "rounded-full",
      false: "",
    },
  },
  defaultVariants: {
    intent: "plain",
    size: "md",
    isCircle: false,
  },
})

export interface ToggleProps extends ToggleButtonProps, VariantProps<typeof toggleStyles> {
  ref?: React.Ref<HTMLButtonElement>
}
export function Toggle({ className, size, intent, isCircle, ref, ...props }: ToggleProps) {
  return (
    <ToggleButton
      ref={ref}
      className={composeRenderProps(className, (className, renderProps) =>
        cn(
          toggleStyles({
            ...renderProps,
            isCircle,
            size,
            intent,
            className,
          })
        )
      )}
      {...props}
    />
  )
}
