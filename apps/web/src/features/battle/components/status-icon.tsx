import { cn } from "cn";

import {
  FX_ATLAS_SIZE,
  FX_ATLAS_URL,
  FX_SLOTS,
} from "@/features/battle/scene/fx-slots";
import type { Status } from "@/features/battle/scene/status-visuals";
import { STATUS_ICON } from "@/features/battle/scene/status-visuals";

/** A CSS position of a cell in the atlas, in % of the free space. */
const atlasPosition = (at: number, size: number) =>
  `${(at / (FX_ATLAS_SIZE - size)) * 100}%`;

/**
 * The icon of a Status from the effects atlas: the same art as the Status
 * Badge above a Unit. Decorative; the Status name is next to it.
 */
export const StatusIcon = ({
  status,
  className,
}: {
  readonly status: Status;
  readonly className?: string;
}) => {
  const { x, y, w } = FX_SLOTS[STATUS_ICON[status]].cell;
  return (
    <span
      aria-hidden
      className={cn("inline-block bg-no-repeat", className)}
      style={{
        backgroundImage: `url(${FX_ATLAS_URL})`,
        backgroundSize: `${(FX_ATLAS_SIZE / w) * 100}%`,
        backgroundPosition: `${atlasPosition(x, w)} ${atlasPosition(y, w)}`,
      }}
    />
  );
};
