import type { Glyph } from "@/features/battle/glyphs";
import { FILLED_GLYPHS, GLYPHS } from "@/features/battle/glyphs";

const glyphRole = (label: string | undefined) => (label ? "img" : undefined);

const glyphHidden = (label: string | undefined) => (label ? undefined : true);

const glyphStroke = (glyph: Glyph) =>
  FILLED_GLYPHS.has(glyph) ? "none" : "currentColor";

const glyphStrokeWidth = (glyph: Glyph) => (FILLED_GLYPHS.has(glyph) ? 0 : 6);

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
    role={glyphRole(label)}
    aria-label={label}
    aria-hidden={glyphHidden(label)}
  >
    <path
      d={GLYPHS[glyph]}
      fill="currentColor"
      fillRule="evenodd"
      stroke={glyphStroke(glyph)}
      strokeWidth={glyphStrokeWidth(glyph)}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);
