import { tv } from "tailwind-variants";

/**
 * The material recipes of the Heynbord Design System.
 *
 * A component composes these strings; it does not write its own hex, shadow or
 * gradient. The tokens live in `globals.css` (DESIGN.md, Colors, Elevation &
 * Depth, Shapes).
 */

/**
 * The 4px focus ring of every interactive piece. The ring token is
 * `focus-cream` on the night plate and `gold-deep` on parchment, so the one
 * ring stays visible on both materials.
 */
const focusRing =
  "outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-(--ring)";

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
const piece =
  "shadow-piece data-[pressed]:translate-y-px data-[pressed]:shadow-piece-press";

/**
 * The shared face of a raised control (a button, a toggle, a tab): a thick
 * border, the hard Piece Drop and the 1px press. An intent adds its material.
 */
export const controlFace = [
  "relative inline-flex items-center justify-center gap-2 rounded-lg border-2 font-semibold select-none",
  "transition-[transform,filter,background-color,border-color] duration-100",
  piece,
  focusRing,
  "data-[hovered]:brightness-110 data-[disabled]:cursor-not-allowed data-[disabled]:border-dashed data-[disabled]:grayscale",
].join(" ");

/**
 * The face of a control in a groove (an input, a select, a well): a thick
 * bronze edge and the inner shadow that makes the surface look cut in.
 */
export const wellFace =
  "rounded-lg border-2 border-input bg-(--control-bg,var(--color-plate-socket)) text-fg shadow-well";

/** The focus ring of a well: the edge turns gold, then the 4px ring shows. */
export const wellFocusRing =
  "outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-(--ring)";

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
export const gameText = tv(
  {
    base: "",
    variants: {
      role: {
        display:
          "font-display text-[length:var(--text-display)] leading-[1.1] font-black",
        headline:
          "font-display text-[length:var(--text-headline)] leading-[1.2] font-black tracking-[0.025em]",
        title:
          "font-display text-[length:var(--text-title)] leading-[1.25] font-bold",
        body: "text-sm",
        small: "text-xs",
        label:
          "text-[length:var(--text-label)] leading-none font-bold tracking-[0.025em] uppercase",
        number: "leading-none font-black tabular-nums",
      },
      tone: {
        inherit: "",
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
  },
  // A role is a font size and a tone is a color. Tailwind Merge reads both as
  // `text-*`, so without this it drops the size and keeps only the color.
  { twMerge: false }
);
