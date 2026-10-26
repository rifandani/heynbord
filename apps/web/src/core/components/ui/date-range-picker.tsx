'use client'

import { HiCalendarDateRange } from "react-icons/hi2"
import type { DateDuration } from "@internationalized/date"
import { Button } from "react-aria-components/Button"
import type { DateValue } from "react-aria-components/DateField"
import {
  DateRangePicker as DateRangePickerPrimitive,
  type DateRangePickerProps as DateRangePickerPrimitiveProps,
} from "react-aria-components/DateRangePicker"
import type { PopoverProps } from "react-aria-components/Popover"
import { twJoin } from "cn"
import { cx } from "@/core/utils/primitive"
import { DateInput as PrimitiveDateInput } from "./date-field"
import { DatePickerOverlay } from "./date-picker"
import { wellFace } from "@/core/components/game/surfaces"
import { fieldStyles } from "./field"
import { InputGroup } from "./input"

export interface DateRangePickerProps<
  T extends DateValue,
> extends DateRangePickerPrimitiveProps<T> {
  visibleDuration?: DateDuration
  pageBehavior?: "visible" | "single"
  popover?: Omit<PopoverProps, "children">
}

export function DateRangePicker<T extends DateValue>({
  className,
  popover,
  children,
  visibleDuration = { months: 1 },
  ...props
}: DateRangePickerProps<T>) {
  return (
    <DateRangePickerPrimitive
      data-slot="control"
      className={cx(fieldStyles({ className: "group/date-range-picker" }), className)}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function" ? children(values) : children}
          <DatePickerOverlay {...popover} visibleDuration={visibleDuration} range />
        </>
      )}
    </DateRangePickerPrimitive>
  )
}

export function DateRangePickerTrigger({
  className,
  ...props
}: React.ComponentProps<typeof InputGroup>) {
  return (
    <InputGroup
      className={cx(
        wellFace,
        "flex items-center overflow-hidden pe-6",
        "hover:enabled:border-bronze-rim",
        "group-open/date-range-picker:border-ring group-open/date-range-picker:ring-4 group-open/date-range-picker:ring-(--ring)",
        "focus-within:border-ring focus-within:ring-4 focus-within:ring-(--ring)",
        "invalid:border-danger-subtle-fg/70 invalid:bg-danger-subtle/5 focus-within:invalid:border-danger-subtle-fg/70 focus-within:invalid:bg-danger-subtle/5 focus-within:invalid:ring-danger-subtle-fg/20 invalid:hover:border-danger-subtle-fg/80 focus-within:invalid:hover:border-danger-subtle-fg/80",
        "disabled:bg-muted disabled:opacity-70",
        className
      )}
      {...props}
    >
      <DateInput slot="start" />
      <span
        aria-hidden="true"
        className="pointer-events-none z-10 -mx-3 block h-0.5 w-2 shrink-0 self-center rounded-full bg-fg group-disabled/date-range-picker:text-opacity-50 sm:-mx-2 forced-colors:text-[ButtonText] forced-colors:group-disabled/date-range-picker:text-[GrayText]"
      />
      <DateInput slot="end" />
      <Button
        data-slot="date-picker-trigger"
        className={twJoin(
          "touch-target grid place-content-center outline-hidden focus-visible:text-fg",
          "pressed:text-fg text-muted-fg hover:text-fg focus-visible:text-fg",
          "px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",
          "*:-me-px *:-mt-0.5 *:size-5 sm:*:size-4"
        )}
      >
        <HiCalendarDateRange />
      </Button>
    </InputGroup>
  )
}

function DateInput({ className, ...props }: React.ComponentProps<typeof PrimitiveDateInput>) {
  return (
    <PrimitiveDateInput
      className={cx(
        "rounded-none border-none bg-transparent shadow-none focus-within:ring-0",
        className
      )}
      {...props}
    />
  )
}
