"use client"

import {
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components/Link"
import { cx } from "@/core/utils/primitive"

export interface LinkProps extends LinkPrimitiveProps {
  ref?: React.RefObject<HTMLAnchorElement>
}

export function Link({ className, ref, ...props }: LinkProps) {
  return (
    <LinkPrimitive
      ref={ref}
      className={cx(
        "font-semibold text-(--link) underline-offset-4",
        "outline-none focus-visible:ring-4 focus-visible:ring-(--ring) forced-colors:outline-[Highlight]",
        "hover:underline hover:decoration-2",
        "disabled:cursor-default disabled:opacity-50 disabled:no-underline forced-colors:disabled:text-[GrayText]",
        "href" in props && "cursor-pointer",
        className
      )}
      {...props}
    />
  )
}
