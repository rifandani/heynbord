"use client"

import { HiXCircle } from "react-icons/hi2"
import { Button } from "react-aria-components/Button"
import type { TagGroupProps, TagListProps, TagProps } from "react-aria-components/TagGroup"
import {
  Tag as PrimitiveTag,
  TagGroup as PrimitiveTagGroup,
  TagList as PrimitiveTagList,
} from "react-aria-components/TagGroup"
import { cn } from "cn"
import { gameText } from "@/core/components/game/surfaces"
import { cx } from "@/core/utils/primitive"

export function TagGroup({ className, ...props }: TagGroupProps) {
  return (
    <PrimitiveTagGroup
      data-slot="control"
      className={cn("flex flex-col gap-y-1 *:data-[slot=label]:font-medium", className)}
      {...props}
    />
  )
}

export function TagList<T extends object>({ className, ...props }: TagListProps<T>) {
  return <PrimitiveTagList className={cx("flex flex-wrap gap-1", className)} {...props} />
}

export function Tag({ children, className, ...props }: TagProps) {
  const textValue = typeof children === "string" ? children : undefined

  return (
    <PrimitiveTag
      textValue={textValue}
      className={cx(
        gameText({ role: "small", tone: "inherit" }),
        "inline-flex items-center gap-x-1.5 rounded-sm border-2 border-input bg-(--control-bg) px-2 py-0.5 font-semibold text-fg shadow-piece forced-colors:outline",
        "*:[svg]:size-3 *:[svg]:shrink-0",
        "cursor-default data-[pressed]:translate-y-px data-[pressed]:shadow-piece-press",
        "selected:border-gold-deep selected:bg-gradient-to-b selected:from-gold-light selected:to-gold selected:text-ink-on-gold",
        "disabled:border-dashed disabled:opacity-70 disabled:grayscale disabled:forced-colors:text-[GrayText]",
        props.href && "cursor-pointer hover:border-bronze-rim hover:brightness-110",
        className
      )}
      {...props}
    >
      {({ allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && (
            <Button slot="remove" className="">
              <HiXCircle className="-me-1 size-4" />
            </Button>
          )}
        </>
      )}
    </PrimitiveTag>
  )
}
