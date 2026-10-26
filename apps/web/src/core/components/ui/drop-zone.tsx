"use client"

import { composeRenderProps } from "react-aria-components/composeRenderProps"
import { DropZone as DropPrimitiveZone, type DropZoneProps } from "react-aria-components/DropZone"
import { cn } from "cn"

export function DropZone({ className, ...props }: DropZoneProps) {
  return (
    <DropPrimitiveZone
      className={composeRenderProps(className, (className, { isDropTarget }) =>
        cn(
          "group/drop-zone relative z-10 flex max-h-56 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-(--control-bg) p-6 text-muted-fg",
          isDropTarget &&
            "border-solid border-gold bg-gold/10 text-fg ring-4 ring-(--ring)",
          "focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-(--ring)",
          className
        )
      )}
      {...props}
    />
  )
}
