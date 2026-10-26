'use client'

import { cn } from "cn"
import { gameText } from "@/core/components/game/surfaces"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn(
        "paper-surface group/card flex flex-col gap-(--gutter) rounded-2xl border-4 border-frame-wood bg-overlay py-(--gutter) text-overlay-fg shadow-piece [--gutter:--spacing(6)] has-[table]:overflow-hidden has-[table]:not-has-data-[slot=card-footer]:pb-0 **:data-[slot=table-header]:bg-parchment-deep/60 has-[table]:**:data-[slot=card-footer]:pt-0 **:[table]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export function CardHeader({ className, title, description, children, ...props }: HeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-(--gutter) has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    >
      {title && <CardTitle>{title}</CardTitle>}
      {description && <CardDescription>{description}</CardDescription>}
      {!title && typeof children === "string" ? <CardTitle>{children}</CardTitle> : children}
    </div>
  )
}

export function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        gameText({ role: "title", tone: "inherit" }),
        "text-balance",
        className
      )}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      data-slot="card-description"
      className={cn(
        gameText({ role: "body", tone: "inherit" }),
        "row-start-2 text-pretty text-muted-fg",
        className
      )}
      {...props}
    />
  )
}

export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--gutter) has-[table]:border-t-2 has-[table]:border-parchment-rule", className)}
      {...props}
    />
  )
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-(--gutter) group-has-[table]/card:pt-(--gutter) [.border-t]:pt-6",
        className
      )}
      {...props}
    />
  )
}
