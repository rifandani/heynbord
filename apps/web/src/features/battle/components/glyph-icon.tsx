import type { Glyph } from "@/features/battle/glyphs";
import { GLYPHS } from "@/features/battle/glyphs";

/** A flat icon from the shared glyph set. Decorative unless it has a label. */
export const GlyphIcon = ({
  glyph,
  className,
  label,
}: {
  readonly glyph: Glyph;
  readonly className?: string;
  readonly label?: string;
}) => (
  <svg
    viewBox="-54 -54 108 108"
    className={className}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <path
      d={GLYPHS[glyph]}
      fill="currentColor"
      fillRule="evenodd"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);
