'use client'

import { HiChevronUpDown } from "react-icons/hi2"
import { Button } from "react-aria-components/Button"
import { ListBox, type ListBoxProps } from "react-aria-components/ListBox"
import type { PopoverProps } from "react-aria-components/Popover"
import {
  Select as SelectPrimitive,
  type SelectProps as SelectPrimitiveProps,
  SelectValue,
} from "react-aria-components/Select"
import { twJoin } from "cn"
import { wellFace, wellFocusRing } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
  DropdownSection,
  DropdownSeparator,
} from "./dropdown"
import { fieldStyles } from "./field"
import { PopoverContent } from "./popover"

interface SelectProps<
  T extends object,
  M extends "single" | "multiple" = "single",
> extends SelectPrimitiveProps<T, M> {
  items?: Iterable<T, M>
}

const Select = <T extends object, M extends "single" | "multiple" = "single">({
  className,
  ...props
}: SelectProps<T, M>) => {
  return (
    <SelectPrimitive
      data-slot="control"
      className={cx(fieldStyles({ className: "group/select" }), className)}
      {...props}
    />
  )
}

interface SelectListProps<T extends object> extends Omit<
  ListBoxProps<T>,
  "layout" | "orientation"
> {
  items?: Iterable<T>
  popover?: Omit<PopoverProps, "children">
}

const SelectContent = <T extends object>({
  items,
  className,
  popover,
  ...props
}: SelectListProps<T>) => {
  return (
    <PopoverContent
      placement={popover?.placement ?? "bottom"}
      className={cx(
        "min-w-(--trigger-width) overflow-hidden *:data-[slot=popover-inner]:overflow-hidden",
        popover?.className
      )}
      {...popover}
    >
      <ListBox
        layout="stack"
        orientation="vertical"
        className={cx(
          "grid max-h-[inherit] w-full grid-cols-[auto_1fr] flex-col gap-y-1 overflow-y-auto p-1 outline-hidden *:[[role='group']+[role=group]]:mt-4 *:[[role='group']+[role=separator]]:mt-1",
          className
        )}
        items={items}
        {...props}
      />
    </PopoverContent>
  )
}

interface SelectTriggerProps extends React.ComponentProps<typeof Button> {
  prefix?: React.ReactNode
  className?: string
}

const SelectTrigger = ({ children, className, ...props }: SelectTriggerProps) => {
  return (
    <span data-slot="control" className="relative block w-full">
      <Button
        className={cx(
          wellFace,
          wellFocusRing,
          "group/select-trigger flex w-full min-w-0 cursor-default items-center gap-x-2 px-3 py-2.5 text-start text-base/6 sm:py-2 sm:text-sm/6 sm:*:text-sm/6",
          "enabled:hover:border-bronze-rim",
          "group-open/select:border-ring group-open/select:ring-4 group-open/select:ring-(--ring)",
          "group-open/select:invalid:border-danger-subtle-fg/70 group-open/select:invalid:ring-danger-subtle-fg/20 group-invalid/select:border-danger-subtle-fg/70 group-invalid/select:ring-danger-subtle-fg/20 group-invalid/select:enabled:hover:border-danger-subtle-fg/80 group-focus/select:group-invalid/select:border-danger-subtle-fg/70 group-focus/select:group-invalid/select:ring-danger-subtle-fg/20 group-focus/select:group-invalid/select:enabled:hover:border-danger-subtle-fg/80",
          "forced-colors:border-[ButtonBorder] forced-colors:text-[ButtonText] *:[svg]:size-5 *:[svg]:shrink-0 *:[svg]:self-center *:[svg]:text-muted-fg sm:*:[svg]:size-4",
          "*:data-[slot=loader]:size-5 *:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center *:data-[slot=loader]:text-muted-fg sm:*:data-[slot=loader]:size-4",
          "forced-colors:group-focus/select:border-[Highlight] forced-colors:group-invalid/select:border-[Mark] forced-colors:group-focus/select:group-invalid/select:border-[Mark]",
          "group-disabled/select:bg-muted group-disabled/select:opacity-70 forced-colors:group-disabled/select:border-[GrayText] forced-colors:group-disabled/select:text-[GrayText]",
          "in-disabled:bg-muted in-disabled:opacity-70 forced-colors:in-disabled:border-[GrayText] forced-colors:in-disabled:text-[GrayText]",
          className
        )}
      >
        {(values) => (
          <>
            {props.prefix && <span className="text-muted-fg">{props.prefix}</span>}
            {typeof children === "function" ? children(values) : children}

            {!children && (
              <>
                <SelectValue
                  data-slot="select-value"
                  className={twJoin([
                    "truncate text-start data-placeholder:text-muted-fg sm:text-sm/6 **:[[slot=description]]:hidden",
                    "has-data-[slot=avatar]:grid has-data-[slot=avatar]:grid-cols-[1fr_auto] has-data-[slot=avatar]:items-center has-data-[slot=avatar]:gap-x-2",
                    "has-[svg]:grid has-[svg]:grid-cols-[1fr_auto] has-[svg]:items-center has-[svg]:gap-x-2",
                    "*:[svg]:size-5 sm:*:[svg]:size-4",
                    "*:mt-0 *:data-[slot=avatar]:[--avatar-size:--spacing(5)] sm:*:data-[slot=avatar]:[--avatar-size:--spacing(4.5)]",
                  ])}
                />
                <HiChevronUpDown
                  data-slot="chevron"
                  className="ms-auto -me-1 size-5 shrink-0 text-muted-fg sm:size-4"
                />
              </>
            )}
          </>
        )}
      </Button>
    </span>
  )
}

const SelectSection = DropdownSection
const SelectSeparator = DropdownSeparator
const SelectLabel = DropdownLabel
const SelectDescription = DropdownDescription
const SelectItem = DropdownItem

export type { SelectProps, SelectTriggerProps }
export {
  Select,
  SelectContent,
  SelectDescription,
  SelectItem,
  SelectLabel,
  SelectSection,
  SelectSeparator,
  SelectTrigger,
}
