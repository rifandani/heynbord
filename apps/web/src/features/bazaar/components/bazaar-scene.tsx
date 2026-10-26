import { BAZAAR_COLORS, BAZAAR_CSS } from "@/features/bazaar/tokens";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/** The painting of the Bazaar inside (11 — Town Concepts 16): 1536 × 1024. */
const BAZAAR_IMAGE = "/town/bazaar-inside.webp";

/**
 * The darker edges and the dim center over the scene, so that the item plates,
 * the Heynstone prices and the Town Bar stay easy to read (as the Hall inside).
 */
const SHADE = BAZAAR_CSS.shade;

/**
 * The lanterns under the awning, in painting percent: the two at the left and
 * the two at the right. Each one breathes a little, as a flame does.
 */
const LANTERNS: readonly {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly delay: number;
}[] = [
  { x: 6.6, y: 8.7, size: 8, delay: 0 },
  { x: 22.1, y: 7.8, size: 8, delay: -1.9 },
  { x: 77.9, y: 10.9, size: 9, delay: -3.2 },
  { x: 71, y: 17.6, size: 8, delay: -1.1 },
];

/**
 * The painted Bazaar inside, in full above the Town Bar (`FittedPainting`), so
 * that a point in painting percent stays on the same thing in the painting at
 * all screen sizes. The lanterns breathe; with reduced motion they are still.
 */
export const BazaarScene = () => (
  <div
    className="absolute inset-0 overflow-hidden"
    style={{ backgroundColor: BAZAAR_COLORS.scene }}
    aria-hidden
    data-testid="bazaar-scene"
  >
    <FittedPainting src={BAZAAR_IMAGE} width={1536} height={1024}>
      {LANTERNS.map((lantern) => (
        <span
          key={`${lantern.x}:${lantern.y}`}
          className="pointer-events-none absolute aspect-square -translate-1/2 rounded-full opacity-85 motion-safe:animate-[shop-lamp_5.5s_ease-in-out_infinite]"
          style={{
            backgroundImage: BAZAAR_CSS.lantern,
            left: `${lantern.x}%`,
            top: `${lantern.y}%`,
            width: `${lantern.size}%`,
            animationDelay: `${lantern.delay}s`,
          }}
          aria-hidden
        />
      ))}
      <div className="absolute inset-0" style={{ background: SHADE }} />
    </FittedPainting>
  </div>
);
