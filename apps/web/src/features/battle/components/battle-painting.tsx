/**
 * The meadow that shows under the Battle Painting: while the image loads, and
 * in place of a painting that does not exist yet. A forest clearing in light
 * from the upper left, with dark forest at the edges (art direction 5.4).
 */
const MEADOW = [
  "radial-gradient(ellipse 55% 45% at 36% 38%, rgba(255, 233, 160, 0.32), transparent 70%)",
  "linear-gradient(to bottom, rgba(18, 38, 14, 0.6), transparent 24%, transparent 72%, rgba(18, 38, 14, 0.55))",
  "radial-gradient(ellipse 80% 70% at 50% 48%, #86bd55 0%, #679f40 42%, #44772c 72%, #24451b 100%)",
];

/**
 * The Battle Painting behind the transparent 3D canvas (web ADR-0007). It
 * covers the screen and crops its edges. It is decoration, so screen readers
 * skip it.
 */
export const BattlePainting = ({ src }: { readonly src: string | null }) => (
  <div
    aria-hidden
    data-battle-painting
    className="absolute inset-0 bg-[#44772c] bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: (src ? [`url("${src}")`, ...MEADOW] : MEADOW).join(","),
    }}
  />
);
