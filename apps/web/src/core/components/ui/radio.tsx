"use client"

import { composeRenderProps } from "react-aria-components/composeRenderProps"
import {
  RadioButton,
  type RadioButtonProps,
  RadioField as RadioFieldPrimitive,
  type RadioFieldProps,
  RadioGroup as RadioGroupPrimitive,
  type RadioGroupProps,
} from "react-aria-components/RadioGroup"
import { cn } from "cn"
import { cx } from "@/core/utils/primitive"
import { Label } from "@/core/components/ui/field"

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      {...props}
      data-slot="control"
      className={cx(
        "space-y-3 has-[[slot=description]]:not-has-[[slot=errorMessage]]:space-y-6 *:data-[slot=label]:font-medium",
        className
      )}
    />
  )
}

export function RadioField({ className, ...props }: RadioFieldProps) {
  return (
    <RadioFieldPrimitive
      {...props}
      className={cx(
        "grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-1",
        "*:data-[slot=control]:col-start-1 *:data-[slot=control]:row-start-1 *:data-[slot=control]:mt-0.5",
        "**:data-[slot=control-label]:col-start-2 **:data-[slot=control-label]:row-start-1",
        "*:[[slot=description]]:col-start-2 *:[[slot=description]]:row-start-2",
        "has-[[slot=description]]:**:data-[slot=control-label]:font-medium",
        className
      )}
      data-slot="control"
    />
  )
}

export function Radio({ className, children, ...props }: RadioButtonProps) {
  return (
    <RadioButton
      data-slot="control"
      className={cx("group gap-x-3 inline-flex col-span-full focus:outline-hidden ", className)}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected, isInvalid }) => {
        return (
          <>
            <span
              data-slot="indicator"
              className={cn([
                "relative col-start-1 row-start-1 mt-0.5 isolate flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-input bg-(--control-bg) text-transparent shadow-well transition-[transform,filter,background-color,border-color] duration-100 before:absolute before:size-2 before:shrink-0 before:rounded-full before:content-[''] group-hover:border-bronze-rim",
                "group-focus-visible:border-ring group-focus-visible:ring-4 group-focus-visible:ring-(--ring)",
                "data-[pressed]:translate-y-px",
                "in-disabled:bg-muted in-disabled:opacity-70",
                isSelected && [
                  "border-gold-deep bg-gradient-to-b from-gold-light to-gold text-ink-on-gold shadow-piece before:bg-ink-on-gold",
                  "group-invalid:border-danger-subtle-fg/70 group-invalid:bg-danger group-invalid:text-danger-fg",
                ],
                isInvalid &&
                  "border-danger-subtle-fg/70 bg-danger-subtle/5 text-danger-fg group-hover:border-danger-subtle-fg/70",
              ])}
            />
            <Label data-slot="control-label" elementType="span">
              {children}
            </Label>
          </>
        )
      })}
    </RadioButton>
  )
}
