"use client"

import {
  TextArea,
  type TextAreaProps as TextAreaPrimitiveProps,
} from "react-aria-components/TextArea"
import { wellFace, wellFocusRing } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"

interface TextAreaProps extends TextAreaPrimitiveProps {
  ref?: React.Ref<HTMLTextAreaElement>
}
export function Textarea({ className, ref, ...props }: TextAreaProps) {
  return (
    <span data-slot="control" className="relative block w-full">
      <TextArea
        {...props}
        ref={ref}
        className={cx(
          wellFace,
          wellFocusRing,
          "field-sizing-content relative block min-h-16 w-full appearance-none px-3 py-2.5 text-base/6 sm:py-2 sm:text-sm/6",
          "placeholder:text-muted-fg",
          "enabled:hover:border-bronze-rim",
          "invalid:border-danger-subtle-fg/70 focus:invalid:border-danger-subtle-fg/70 focus:invalid:ring-danger-subtle-fg/20 invalid:enabled:hover:border-danger-subtle-fg/80 invalid:focus:enabled:hover:border-danger-subtle-fg/80",
          "disabled:bg-muted disabled:opacity-70 forced-colors:in-disabled:text-[GrayText]",
          "in-disabled:bg-muted in-disabled:opacity-70 forced-colors:in-disabled:text-[GrayText]",
          className
        )}
      />
    </span>
  )
}
