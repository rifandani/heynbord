import { tv } from "tailwind-variants";

/**
 * The material recipes of the Heynbord Design System.
 *
 * A component composes these strings; it does not write its own hex, shadow or
 * gradient. The tokens live in `globals.css` (DESIGN.md, Colors, Elevation &
 * Depth, Shapes).
 */

/** The 4px focus ring of every interactive piece. Nothing else uses it. */
export const focusRing =
  "outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-focus-cream";

/** The face of a gold piece: the one main action of a panel. */
export const goldFace =
  "border-gold-deep bg-gradient-to-b from-gold-light to-gold text-ink-on-gold";

/** The face of a wood piece: the default button. */
export const woodFace =
  "border-wood-edge bg-gradient-to-b from-wood-light to-wood text-cream";

/** The face of a ghost piece: a small HUD control over the Board. */
export const ghostFace = "border-cream/30 bg-night-plate/70 text-cream";

/**
 * A piece sits on the table: a hard drop with no blur, and a 1px press. The
 * soft `shadow-lift` is only for a thing that floats over the Board.
 */
export const piece =
  "shadow-piece data-[pressed]:translate-y-px data-[pressed]:shadow-piece-press";

/** The dark HUD surface. Text on it is cream, never gold. */
export const nightPlateStyles = tv({
  base: "border-gold-trim/70 bg-night-plate/85 text-cream shadow-piece border-2",
  variants: {
    kind: {
      plate: "rounded-xl",
      panel: "rounded-2xl",
      chip: "rounded-sm",
      tooltip: "rounded-lg",
    },
    padding: {
      none: "",
      xs: "px-1 py-0.5",
      sm: "px-2.5 py-1.5",
      md: "px-3 py-2",
      lg: "p-4",
    },
  },
  defaultVariants: { kind: "plate", padding: "md" },
});

/** The paper surfaces: dialogs, panels, wells and insets. */
export const parchmentStyles = tv({
  base: "border-frame-wood bg-parchment text-ink",
  variants: {
    kind: {
      dialog: "rounded-2xl border-4 shadow-2xl",
      panel: "rounded-2xl border-4",
      inset: "border-parchment-rule rounded-lg border-2",
      well: "border-parchment-rule bg-parchment-deep rounded-xl border-2",
    },
    padding: {
      none: "",
      xs: "p-1.5",
      sm: "p-3",
      md: "p-5",
    },
  },
  defaultVariants: { kind: "panel", padding: "none" },
});

/**
 * The type ramp (DESIGN.md, Typography). `role` sets the size and the family;
 * `tone` sets the color of the surface that the text sits on.
 */
export const gameText = tv({
  base: "",
  variants: {
    role: {
      display: "font-display text-display",
      headline: "font-display text-headline",
      title: "font-display text-title",
      body: "text-sm",
      small: "text-xs",
      label: "text-label uppercase",
      number: "leading-none font-black tabular-nums",
    },
    tone: {
      ink: "text-ink",
      soft: "text-ink-soft",
      faded: "text-ink-faded",
      cream: "text-cream",
      dim: "text-cream-dim",
      gold: "text-gold",
      rust: "text-keyword-rust",
    },
  },
  defaultVariants: { role: "body", tone: "ink" },
});
