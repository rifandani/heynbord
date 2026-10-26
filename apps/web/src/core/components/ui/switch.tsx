import {
  SwitchButton,
  type SwitchButtonProps,
  SwitchField as SwitchFieldPrimitive,
  type SwitchFieldProps,
} from "react-aria-components/Switch"
import { twJoin, cn } from "cn"
import { Label } from "@/core/components/ui/field"
import { cx } from "@/core/utils/primitive"

export function SwitchField({ className, ...props }: SwitchFieldProps) {
  return (
    <SwitchFieldPrimitive
      {...props}
      data-slot="control"
      className={cx("has-[[slot=description]]:**:data-[slot=control-label]:font-medium", className)}
      style={({ defaultStyle }) => ({
        ...defaultStyle,
        WebkitTapHighlightColor: "transparent",
      })}
    />
  )
}

export function Switch({ children, className, ...props }: SwitchButtonProps) {
  return (
    <SwitchButton
      className={cx(
        "group relative grid cursor-default gap-x-6 gap-y-1 ltr:grid-cols-[1fr_auto] rtl:grid-cols-[auto_1fr]",
        "*:data-[slot=control-label]:row-start-1 ltr:*:data-[slot=control-label]:col-start-1 rtl:*:data-[slot=control-label]:col-start-2",
        "*:[[slot=description]]:row-start-2 ltr:*:[[slot=description]]:col-start-1 rtl:*:[[slot=description]]:col-start-2",
        "disabled:opacity-70 disabled:grayscale forced-colors:disabled:text-[GrayText]",
        className
      )}
      {...props}
    >
      {(values) => (
        <>
          <span
            data-slot="indicator"
            className={cn(
              "relative isolate inline-flex h-6 w-11 cursor-default self-start rounded-full border-2 border-input bg-(--control-bg) p-0.5 shadow-well transition duration-200 ease-in-out sm:mt-0.5",
              values.isHovered && "border-bronze-rim",
              values.isFocusVisible &&
                "border-ring ring-4 ring-(--ring)",
              values.isSelected && "border-gold-deep bg-gold/35",
              values.isPressed && "translate-y-px",
              values.isDisabled && "opacity-70 grayscale"
            )}
          >
            <span
              aria-hidden="true"
              className={twJoin(
                "pointer-events-none relative inline-block size-4 rounded-full border-2 border-wood-edge bg-cream shadow-piece transition duration-200 ease-in-out",
                values.isSelected &&
                  "bg-gradient-to-b from-gold-light to-gold ltr:translate-x-5 rtl:-translate-x-5"
              )}
            />
          </span>
          {typeof children === "function" ? (
            children(values)
          ) : typeof children === "string" ? (
            <Label elementType="span" data-slot="control-label">
              {children}
            </Label>
          ) : (
            children
          )}
        </>
      )}
    </SwitchButton>
  )
}
