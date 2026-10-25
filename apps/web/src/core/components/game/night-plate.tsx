import { cn } from "cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { gameText, nightPlateStyles } from "./surfaces";

export type NightPlateProps = {
  readonly kind?: "plate" | "panel" | "chip" | "tooltip";
  readonly padding?: "none" | "xs" | "sm" | "md" | "lg";
  readonly className?: string;
  readonly children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"div">, "className" | "children">;

/**
 * The dark HUD surface of the game (DESIGN.md, HUD plate): a Night Plate at
 * 85%, a 2px gold-trim border at 70%, a 12px corner and the Piece Drop. Text
 * on it is cream. It holds information, so it has no press and no glow.
 */
export const NightPlate = ({
  kind,
  padding,
  className,
  children,
  ...props
}: NightPlateProps) => (
  <div
    {...props}
    className={cn(nightPlateStyles({ kind, padding }), className)}
  >
    {children}
  </div>
);

/** A small uppercase label on a Night Plate, e.g. "Tutorial". */
export const NightPlateLabel = ({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}) => (
  <span className={gameText({ role: "label", tone: "gold", className })}>
    {children}
  </span>
);
