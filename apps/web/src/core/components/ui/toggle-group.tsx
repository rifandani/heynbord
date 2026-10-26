'use client'

import { createContext, use } from "react"
import { composeRenderProps } from "react-aria-components/composeRenderProps"
import { ToggleButton, type ToggleButtonProps } from "react-aria-components/ToggleButton"
import {
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "react-aria-components/ToggleButtonGroup"
import { cn } from "cn"
import { tv } from "tailwind-variants"
import { cx } from "@/core/utils/primitive"
import { controlFace, wellFace } from "@/core/components/game/surfaces"

type ToggleSize = "xs" | "sm" | "md" | "lg" | "sq-xs" | "sq-sm" | "sq-md" | "sq-lg"

interface ToggleGroupContextValue extends Pick<
  ToggleButtonGroupProps,
  "selectionMode" | "orientation"
> {
  size?: ToggleSize
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: "md",
  selectionMode: "single",
  orientation: "horizontal",
})

const useToggleGroupContext = () => use(ToggleGroupContext)

interface ToggleGroupProps extends ToggleButtonGroupProps {
  size?: ToggleSize
  isCircle?: boolean
}

const ToggleGroup = ({
  size = "md",
  orientation = "horizontal",
  selectionMode = "single",
  isCircle,
  className,
  ...props
}: ToggleGroupProps) => {
  return (
    <ToggleGroupContext value={{ size, selectionMode, orientation }}>
      <ToggleButtonGroup
        data-slot="control"
        selectionMode={selectionMode}
        orientation={orientation}
        className={cx(
          [
            wellFace,
            "inline-flex p-1",
            orientation === "horizontal" ? "flex-row" : "flex-col",
            selectionMode === "single" ? "gap-1" : "gap-0",
            isCircle ? "rounded-full" : "rounded-xl",
            selectionMode === "single" &&
              isCircle &&
              "*:data-[slot=toggle-group-item]:rounded-full",
            selectionMode === "multiple" &&
              isCircle &&
              "*:data-[slot=toggle-group-item]:last:rounded-e-full *:data-[slot=toggle-group-item]:first:rounded-s-full",
          ],
          className
        )}
        {...props}
      />
    </ToggleGroupContext>
  )
}

interface ToggleGroupItemProps extends ToggleButtonProps {
  size?: ToggleSize
}

const toggleGroupItemStyles = tv({
  base: [
    controlFace,
    "relative isolate inline-flex flex-row items-center text-base forced-colors:text-[ButtonText]",
    "*:[svg]:-mx-0.5 *:[svg]:shrink-0 *:[svg]:self-center *:[svg]:opacity-80",
  ],
  variants: {
    orientation: {
      horizontal: "justify-center",
      vertical: "justify-start",
    },
    selectionMode: {
      single: "rounded-lg",
      multiple: "rounded-none",
    },
    size: {
      xs: "min-h-8 gap-x-1.5 px-2.5 py-1 text-sm *:[svg]:size-3.5",
      sm: "min-h-9 gap-x-1.5 px-3 py-1.5 text-sm *:[svg]:size-4",
      md: "min-h-11 gap-x-2 px-4 py-2 text-base *:[svg]:size-5",
      lg: "min-h-12 gap-x-2 px-6 py-2.5 text-base *:[svg]:size-5",
      "sq-xs": "touch-target size-8 shrink-0 *:[svg]:size-3.5",
      "sq-sm": "touch-target size-10 shrink-0 *:[svg]:size-4",
      "sq-md": "touch-target size-11 shrink-0 *:[svg]:size-5",
      "sq-lg": "touch-target size-12 shrink-0 *:[svg]:size-6",
    },
    isSelected: {
      true: "border-gold-deep bg-gradient-to-b from-gold-light to-gold text-ink-on-gold shadow-piece",
    },
    isFocused: {
      true: "not-selected:bg-accent/30",
    },
    isHovered: {
      true: "enabled:not-selected:bg-accent/30",
    },
    isDisabled: {
      true: "forced-colors:text-[GrayText]",
    },
  },
  defaultVariants: {
    size: "md",
  },
  compoundVariants: [
    {
      selectionMode: "multiple",
      orientation: "horizontal",
      className: "first:rounded-s-lg last:rounded-e-lg not-first:-ms-px",
    },
    {
      selectionMode: "multiple",
      orientation: "vertical",
      className: "first:rounded-t-lg last:rounded-b-lg not-first:-mt-px",
    },
  ],
})

const ToggleGroupItem = ({ className, ...props }: ToggleGroupItemProps) => {
  const { size, selectionMode, orientation } = useToggleGroupContext()

  return (
    <ToggleButton
      data-slot="toggle-group-item"
      className={composeRenderProps(className, (className, renderProps) =>
        cn(
          toggleGroupItemStyles({
            ...renderProps,
            size,
            orientation,
            selectionMode,
            className,
          })
        )
      )}
      {...props}
    />
  )
}

export type { ToggleGroupItemProps, ToggleGroupProps }
export { ToggleGroup, ToggleGroupItem }
