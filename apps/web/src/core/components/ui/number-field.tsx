'use client'

import { HiMinus, HiPlus } from "react-icons/hi2"
import { Button, type ButtonProps } from "react-aria-components/Button"
import type { InputProps as PrimitiveInputProps } from "react-aria-components/Input"
import {
  NumberField as NumberFieldPrimitive,
  type NumberFieldProps,
} from "react-aria-components/NumberField"
import { Input, InputGroup } from "@/core/components/ui/input"
import { cx } from "@/core/utils/primitive"
import { fieldStyles } from "./field"

const NumberField = ({ className, ...props }: NumberFieldProps) => {
  return (
    <NumberFieldPrimitive {...props} data-slot="control" className={cx(fieldStyles(), className)} />
  )
}

interface InputProps extends PrimitiveInputProps {
  ref?: React.RefObject<HTMLInputElement>
}

function NumberInput({ className, ...props }: InputProps) {
  return (
    <InputGroup className="[--input-gutter-end:--spacing(20)]">
      <Input className={cx("tabular-nums", className)} {...props} />
      <div
        data-slot="text"
        className="in-disabled:pointer-events-none pointer-events-auto end-0 p-px in-disabled:opacity-50"
      >
        <div className="flex h-full items-center divide-x divide-input overflow-hidden rounded-e-lg border-s-2 border-input">
          <StepperButton slot="decrement" />
          <StepperButton slot="increment" />
        </div>
      </div>
    </InputGroup>
  )
}

interface StepperButtonProps extends ButtonProps {
  slot: "increment" | "decrement"
  className?: string
}

const StepperButton = ({ slot, className, ...props }: StepperButtonProps) => {
  return (
    <Button
      className={cx(
        "inline-grid place-content-center bg-plate-ember text-cream outline-none",
        "size-full min-w-11 grow enabled:hover:bg-wood-light pressed:translate-y-px pressed:brightness-90",
        "focus-visible:ring-4 focus-visible:ring-(--ring)",
        "*:data-[slot=stepper-icon]:size-5 sm:*:data-[slot=stepper-icon]:size-4",
        "disabled:pointer-events-none disabled:opacity-70",
        className
      )}
      slot={slot}
      {...props}
    >
      {slot === "increment" ? (
        <HiPlus data-slot="stepper-icon" />
      ) : (
        <HiMinus data-slot="stepper-icon" />
      )}
    </Button>
  )
}

export type { NumberFieldProps }
export { NumberField, NumberInput }
