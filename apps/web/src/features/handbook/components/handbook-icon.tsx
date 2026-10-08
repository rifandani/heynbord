import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { paintedIcon } from "@/features/town/town";

/** The icon of the Handbook: its painted icon, or the open book until a person paints it. */
export const HandbookIcon = ({ className }: { readonly className: string }) => {
  const painted = paintedIcon("handbook");
  return painted ? (
    <img
      src={painted}
      alt=""
      width={128}
      height={128}
      draggable={false}
      className={cn("select-none", className)}
    />
  ) : (
    <GlyphIcon
      glyph="book"
      className={cn(
        "text-[#fff6df] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]",
        className
      )}
    />
  );
};
