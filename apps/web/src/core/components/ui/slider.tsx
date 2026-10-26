"use client"

import type { ComponentProps } from "react"
import {
  Slider as PrimitiveSlider,
  SliderFill as PrimitiveSliderFill,
  type SliderFillProps,
  SliderOutput as PrimitiveSliderOutput,
  SliderThumb as PrimitiveSliderThumb,
  SliderTrack as PrimitiveSliderTrack,
} from "react-aria-components/Slider"
import { cn } from "cn"
import { gameText } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"

export function SliderGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-x-3 *:data-[slot=icon]:size-5", className)}
      {...props}
    />
  )
}

export function Slider({ className, ...props }: ComponentProps<typeof PrimitiveSlider>) {
  return (
    <PrimitiveSlider
      data-slot="control"
      className={cx(
        "group relative flex touch-none select-none flex-col disabled:opacity-50",
        "orientation-horizontal:w-full orientation-horizontal:min-w-fit orientation-horizontal:gap-y-2",
        "orientation-vertical:h-full orientation-vertical:min-h-fit orientation-vertical:w-3 orientation-vertical:items-center orientation-vertical:gap-y-2",
        className
      )}
      {...props}
    />
  )
}

export function SliderOutput({
  className,
  ...props
}: ComponentProps<typeof PrimitiveSliderOutput>) {
  return (
    <PrimitiveSliderOutput
      className={cx(
        gameText({ role: "number", tone: "inherit" }),
        "text-sm",
        className
      )}
      {...props}
    />
  )
}

export function SliderThumb({ className, ...props }: ComponentProps<typeof PrimitiveSliderThumb>) {
  return (
    <PrimitiveSliderThumb
      className={cx(
        "top-[50%] left-[50%] size-5 rounded-full border-2 border-wood-edge bg-gradient-to-b from-bronze-rim to-bronze shadow-piece outline-none transition-[transform,filter] duration-100 data-[pressed]:translate-y-px data-[focus-visible]:ring-4 data-[focus-visible]:ring-(--ring) data-[hovered]:brightness-110",
        className
      )}
      {...props}
    />
  )
}

export function SliderTrack({
  className,
  children,
  ...props
}: ComponentProps<typeof PrimitiveSliderTrack>) {
  return (
    <PrimitiveSliderTrack
      className={cx(
        "border-2 border-input bg-(--control-bg) shadow-well",
        "group/track relative cursor-default rounded-full",
        "grow group-orientation-horizontal:h-3 group-orientation-horizontal:w-full group-orientation-vertical:w-3 group-orientation-vertical:flex-1",
        "disabled:cursor-default disabled:opacity-60",
        className
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function"
            ? children(values)
            : (children ?? (
                <>
                  <SliderFill />
                  <SliderThumb />
                </>
              ))}
        </>
      )}
    </PrimitiveSliderTrack>
  )
}

export function SliderFill({ className, ...props }: SliderFillProps) {
  return (
    <PrimitiveSliderFill
      className={cx(
        "pointer-events-none rounded-full bg-gradient-to-r from-gold-light to-gold disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}
