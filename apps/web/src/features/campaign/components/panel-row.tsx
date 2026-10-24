import { cn } from "cn";
import type { ReactNode } from "react";

/** A parchment panel row with a label and its content. */
export const PanelRow = ({
  label,
  children,
  className,
  anchor,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly anchor?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:grid-cols-[4rem_1fr] [@media(max-height:500px)]:py-1.5",
      className
    )}
  >
    <p
      className="font-display pt-0.5 text-sm font-bold text-[#2a1d12]"
      data-hint-anchor={anchor}
    >
      {label}
    </p>
    <div className="min-w-0">{children}</div>
  </div>
);
