'use client'

import type { DateFieldProps, DateInputProps, DateValue } from "react-aria-components/DateField"
import {
  DateField as DateFieldPrimitive,
  DateInput as DateInputPrimitive,
  DateSegment,
} from "react-aria-components/DateField"
import { twJoin } from "cn"
import { cx } from "@/core/utils/primitive"
import { wellFace } from "@/core/components/game/surfaces"
import { fieldStyles } from "./field"

export function DateField<T extends DateValue>({ className, ...props }: DateFieldProps<T>) {
  return (
    <DateFieldPrimitive
      {...props}
      data-slot="control"
      className={cx(fieldStyles({ className: "w-fit" }), className)}
    />
  )
}

export function DateInput({ className, ...props }: Omit<DateInputProps, "children">) {
  return (
    <span data-slot="control" className="relative block">
      <DateInputPrimitive
        className={cx(
          wellFace,
          "relative block appearance-none px-3 py-2.5 text-base/6 sm:py-2 sm:text-sm/6",
          "placeholder:text-muted-fg",
          "enabled:hover:border-bronze-rim",
          "focus-within:border-ring focus-within:ring-4 focus-within:ring-(--ring)",
          "group-open:border-ring group-open:ring-4 group-open:ring-(--ring)",
          "invalid:border-danger-subtle-fg/70 invalid:bg-danger-subtle/5 focus-within:invalid:border-danger-subtle-fg/70 focus-within:invalid:bg-danger-subtle/5 focus-within:invalid:ring-danger-subtle-fg/20 focus-within:invalid:hover:border-danger-subtle-fg/80 invalid:enabled:hover:border-danger-subtle-fg/80",
          "in-disabled:bg-muted in-disabled:opacity-70 disabled:bg-muted disabled:opacity-70 forced-colors:in-disabled:text-[GrayText] forced-colors:disabled:text-[GrayText]",
          className
        )}
        {...props}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className={twJoin(
              "inline shrink-0 rounded px-1 type-literal:px-0 py-0.5 text-fg tracking-wider caret-transparent outline-0 data-placeholder:not-data-focused:text-muted-fg sm:text-sm",
              "focus:bg-primary-subtle focus:text-primary-subtle-fg focus:data-invalid:bg-danger-subtle focus:data-invalid:text-danger-subtle-fg forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]",
              "forced-color-adjust-none forced-colors:text-[ButtonText]",
              "in-disabled:bg-muted disabled:bg-muted forced-colors:disabled:text-[GrayText]"
            )}
          />
        )}
      </DateInputPrimitive>
    </span>
  )
}
