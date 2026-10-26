'use client'

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from "react-aria-components/Button"
import { tv, type VariantProps } from "tailwind-variants"
import { cx } from "@/core/utils/primitive"
import { controlFace, goldFace, woodFace } from "@/core/components/game/surfaces"

export const buttonStyles = tv({
  base: [
    controlFace,
    "pending:opacity-50 disabled:cursor-not-allowed data-[disabled]:opacity-100",
    "forced-colors:border-[ButtonBorder] forced-colors:text-[ButtonText]",
    "*:[svg]:shrink-0 *:[svg]:self-center *:[svg]:opacity-80",
    "*:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center",
    "*:data-[slot=color-swatch]:shrink-0 *:data-[slot=color-swatch]:self-center *:data-[slot=color-swatch]:[--size:--spacing(5)]",
  ],
  variants: {
    intent: {
      primary: goldFace,
      secondary: woodFace,
      warning: "border-warning bg-warning text-warning-fg",
      danger: "border-danger bg-danger text-danger-fg",
      success: "border-success bg-success text-success-fg",
      outline:
        "border-input bg-(--control-bg) text-fg data-[hovered]:border-bronze-rim data-[hovered]:brightness-100",
      plain:
        "border-transparent bg-transparent text-fg shadow-none! data-[hovered]:bg-accent/40 data-[hovered]:brightness-100 data-[pressed]:shadow-none!",
    },
    size: {
      xs: [
        "min-h-8 gap-x-1.5 px-2.5 py-1 text-sm",
        "*:[svg]:size-3.5",
        "*:data-[slot=loader]:size-3.5",
      ],
      sm: [
        "min-h-9 gap-x-1.5 px-3 py-1.5 text-sm",
        "*:[svg]:size-4",
        "*:data-[slot=loader]:size-4",
      ],
      md: [
        "min-h-11 gap-x-2 px-4 py-2 text-base",
        "*:[svg]:size-5",
        "*:data-[slot=loader]:size-5",
      ],
      lg: [
        "min-h-12 gap-x-2 px-6 py-2.5 text-base",
        "*:[svg]:size-5",
        "*:data-[slot=loader]:size-5",
      ],
      "sq-xs": [
        "touch-target size-8 shrink-0",
        "*:[svg]:size-3.5",
        "*:data-[slot=loader]:size-3.5",
      ],
      "sq-sm": [
        "touch-target size-10 shrink-0",
        "*:[svg]:size-4",
        "*:data-[slot=loader]:size-4",
      ],
      "sq-md": [
        "touch-target size-11 shrink-0",
        "*:[svg]:size-5",
        "*:data-[slot=loader]:size-5",
      ],
      "sq-lg": [
        "touch-target size-12 shrink-0",
        "*:[svg]:size-6",
        "*:data-[slot=loader]:size-6",
      ],
    },
    isCircle: {
      true: "rounded-full",
      false: "rounded-lg",
    },
  },
  compoundVariants: [
    {
      intent: "primary",
      size: "lg",
      className: "font-display text-lg",
    },
  ],
  defaultVariants: {
    intent: "primary",
    size: "md",
    isCircle: false,
  },
})

export interface ButtonProps extends ButtonPrimitiveProps, VariantProps<typeof buttonStyles> {
  ref?: React.Ref<HTMLButtonElement>
}

export function Button({ className, intent, size, isCircle, ref, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      {...props}
      className={cx(
        buttonStyles({
          intent,
          size,
          isCircle,
        }),
        className
      )}
    />
  )
}
