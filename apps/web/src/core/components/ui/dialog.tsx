'use client'

import { HiXMark } from "react-icons/hi2"
import { Button as PrimitiveButton } from "react-aria-components/Button"
import { Dialog as PrimitiveDialog } from "react-aria-components/Dialog"
import { Heading, type HeadingProps } from "react-aria-components/Heading"
import type { TextProps } from "react-aria-components/Text"
import { cn } from "cn"
import { gameText } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"
import { Button, type ButtonProps } from "./button"

const Dialog = ({
  role = "dialog",
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveDialog>) => {
  return (
    <PrimitiveDialog
      data-slot="dialog"
      role={role}
      className={cn(
        "peer/dialog group/dialog relative flex max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] flex-col overflow-hidden outline-hidden [--gutter:--spacing(6)] sm:[--gutter:--spacing(8)]",
        className
      )}
      {...props}
    />
  )
}

const DialogTrigger = ({ className, ...props }: ButtonProps) => (
  <PrimitiveButton className={cx("cursor-pointer", className)} {...props} />
)

interface DialogHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title?: string
  description?: string
}

const DialogHeader = ({ className, ...props }: DialogHeaderProps) => {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "border-parchment-rule relative space-y-1 border-b-2 p-(--gutter) pb-[calc(var(--gutter)---spacing(3))]",
        className
      )}
    >
      {props.title && <DialogTitle>{props.title}</DialogTitle>}
      {props.description && <DialogDescription>{props.description}</DialogDescription>}
      {!props.title && typeof props.children === "string" ? (
        <DialogTitle>{props.children}</DialogTitle>
      ) : (
        props.children
      )}
    </div>
  )
}

interface DialogTitleProps extends HeadingProps {
  ref?: React.Ref<HTMLHeadingElement>
}
const DialogTitle = ({ className, ref, ...props }: DialogTitleProps) => (
  <Heading
    slot="title"
    ref={ref}
    className={cn(
      gameText({ role: "title", tone: "inherit" }),
      "text-balance text-overlay-fg",
      className
    )}
    {...props}
  />
)

interface DialogDescriptionProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>
}
const DialogDescription = ({ className, ref, ...props }: DialogDescriptionProps) => (
  <p
    data-slot="description"
    className={cn(
      gameText({ role: "body", tone: "inherit" }),
      "text-pretty text-muted-fg group-disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
)

interface DialogBodyProps extends React.ComponentProps<"div"> {}
const DialogBody = ({ className, ...props }: DialogBodyProps) => (
  <div
    data-slot="dialog-body"
    className={cn(
      "isolate flex min-h-0 flex-1 flex-col overflow-auto px-(--gutter) py-1",
      "**:data-[slot=dialog-footer]:px-0 **:data-[slot=dialog-footer]:pt-0",
      className
    )}
    {...props}
  />
)

interface DialogFooterProps extends React.ComponentProps<"div"> {}
const DialogFooter = ({ className, ...props }: DialogFooterProps) => {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "isolate mt-auto flex flex-col-reverse justify-end gap-3 p-(--gutter) pt-[calc(var(--gutter)---spacing(2))] group-not-has-data-[slot=dialog-body]/dialog:pt-0 group-not-has-data-[slot=dialog-body]/popover:pt-0 sm:flex-row",
        className
      )}
      {...props}
    />
  )
}

const DialogClose = ({ intent = "secondary", ref, ...props }: ButtonProps) => {
  return <Button slot="close" ref={ref} intent={intent} {...props} />
}

interface CloseButtonIndicatorProps extends Omit<ButtonProps, "children"> {
  className?: string
  isDismissable?: boolean | undefined
}

const DialogCloseIcon = ({ className, ...props }: CloseButtonIndicatorProps) => {
  return props.isDismissable ? (
    <PrimitiveButton
      slot="close"
      className={cx(
        "close absolute end-2 top-2 z-50 grid size-10 place-content-center rounded-lg border-2 border-wood-edge bg-wood text-cream shadow-piece outline-none hover:brightness-110 focus-visible:ring-4 focus-visible:ring-(--ring) data-[pressed]:translate-y-px data-[pressed]:shadow-piece-press sm:size-9",
        className
      )}
    >
      <HiXMark className="size-4" />
    </PrimitiveButton>
  ) : null
}

export type {
  CloseButtonIndicatorProps,
  DialogBodyProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogTitleProps,
}
export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseIcon,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
