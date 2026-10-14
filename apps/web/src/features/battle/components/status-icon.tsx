import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { FX_ANCHORS } from "@/features/battle/palette";
import {
  FX_ATLAS_SIZE,
  FX_ATLAS_URL,
  FX_SLOTS,
  UNPAINTED_SLOTS,
} from "@/features/battle/scene/fx-slots";
import type { Status } from "@/features/battle/scene/status-visuals";
import { STATUS_ICON } from "@/features/battle/scene/status-visuals";

/**
 * The glyph and the color of the placeholder of each Status icon that the
 * painted atlas can be without (`UNPAINTED_SLOTS`). They are the same as the
 * canvas placeholder of its slot.
 */
const PLACEHOLDER: Partial<
  Record<Status, { readonly glyph: Glyph; readonly color: string }>
> = {
  ward: { glyph: "shield", color: FX_ANCHORS.iconWard },
  steadfast: { glyph: "anchor", color: FX_ANCHORS.iconSteadfast },
  exposed: { glyph: "brokenShield", color: FX_ANCHORS.iconExposed },
  paralyze: { glyph: "bolt", color: FX_ANCHORS.iconParalyze },
  grounded: { glyph: "grounded", color: FX_ANCHORS.iconGrounded },
};

/** A CSS position of a cell in the atlas, in % of the free space. */
const atlasPosition = (at: number, size: number) =>
  `${(at / (FX_ATLAS_SIZE - size)) * 100}%`;

/**
 * The icon of a Status from the effects atlas: the same art as the Status
 * Badge above a Unit. Decorative; the Status name is next to it. A slot that
 * the painted atlas does not have yet shows the glyph of its placeholder.
 */
export const StatusIcon = ({
  status,
  className,
}: {
  readonly status: Status;
  readonly className?: string;
}) => {
  const slot = STATUS_ICON[status];
  const placeholder = PLACEHOLDER[status];
  if (UNPAINTED_SLOTS.has(slot) && placeholder) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-grid place-items-center drop-shadow-[0_0_1px_#2a1d12]",
          className
        )}
        style={{ color: placeholder.color }}
      >
        <GlyphIcon glyph={placeholder.glyph} className="size-[80%]" />
      </span>
    );
  }
  const { x, y, w } = FX_SLOTS[slot].cell;
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
