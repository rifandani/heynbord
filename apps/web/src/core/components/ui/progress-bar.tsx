'use client'

import { createContext, use } from "react"
import {
  ProgressBar as ProgressBarPrimitive,
  type ProgressBarProps,
  type ProgressBarRenderProps,
} from "react-aria-components/ProgressBar"
import { cn } from "cn"
import { gameText } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"

const ProgressBarContext = createContext<ProgressBarRenderProps | null>(null)

export function ProgressBar({ className, children, ...props }: ProgressBarProps) {
  return (
    <ProgressBarPrimitive
      data-slot="control"
      className={cx(
        "w-full",
        "[&>[data-slot=progress-bar-header]+[data-slot=progress-bar-track]]:mt-2",
        "[&>[data-slot=progress-bar-header]+[data-slot=progress-bar-track]]:mt-2",
        "[&>[data-slot=progress-bar-header]+[slot='description']]:mt-1",
        "[&>[slot='description']+[data-slot=progress-bar-track]]:mt-2",
        "[&>[data-slot=progress-bar-track]+[slot=description]]:mt-2",
        "[&>[data-slot=progress-bar-track]+[slot=errorMessage]]:mt-2",
        "*:data-[slot=progress-bar-header]:font-medium",
        className
      )}
      {...props}
    >
      {(values) => (
        <ProgressBarContext value={{ ...values }}>
          {typeof children === "function" ? children(values) : children}
        </ProgressBarContext>
      )}
    </ProgressBarPrimitive>
  )
}

export function ProgressBarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-bar-header"
      className={cn("flex items-center justify-between", className)}
      {...props}
    />
  )
}

export function ProgressBarValue({
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children">) {
  const { valueText } = use(ProgressBarContext)!
  return (
    <span
      data-slot="progress-bar-value"
      className={cn(
        gameText({ role: "number", tone: "inherit" }),
        "text-sm",
        className
      )}
      {...props}
    >
      {valueText}
    </span>
  )
}

export function ProgressBarTrack({ className, ref, ...props }: React.ComponentProps<"div">) {
  const { isIndeterminate, percentage } = use(ProgressBarContext)!
  return (
    <span data-slot="progress-bar-track" className="relative block w-full">
      <style>{`
        @keyframes progress-slide {
          0% { inset-inline-start: 0% }
          50% { inset-inline-start: 100% }
          100% { inset-inline-start: 0% }
        }
      `}</style>
      <div ref={ref} className="flex w-full items-center gap-x-2" {...props}>
        <div
          data-slot="progress-container"
          className={cn(
            "relative h-3 w-full min-w-52 overflow-hidden rounded-full border-2 border-input bg-(--control-bg) shadow-well outline-hidden will-change-transform",
            className
          )}
        >
          {!isIndeterminate ? (
            <div
              data-slot="progress-content"
              className="from-gold-light to-gold absolute start-0 top-0 h-full rounded-full bg-gradient-to-r transition-[width] duration-200 ease-linear will-change-[width] motion-reduce:transition-none forced-colors:bg-[Highlight]"
              style={{ width: `${percentage}%` }}
            />
          ) : (
            <div
              data-slot="progress-content"
              className="from-gold-light to-gold absolute top-0 h-full animate-[progress-slide_2000ms_ease-in-out_infinite] rounded-full bg-gradient-to-r forced-colors:bg-[Highlight]"
              style={{ width: "40%" }}
            />
          )}
        </div>
      </div>
    </span>
  )
}
