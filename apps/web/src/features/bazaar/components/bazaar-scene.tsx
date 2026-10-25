import { FittedPainting } from "@/features/town/components/fitted-painting";

/** The painting of the Bazaar inside (11 — Town Concepts 16): 1536 × 1024. */
const BAZAAR_IMAGE = "/town/bazaar-inside.webp";

/**
 * The darker edges and the dim center over the scene, so that the item plates,
 * the Heynstone prices and the Town Bar stay easy to read (as the Hall inside).
 */
const SHADE = [
  // The far side of the square behind the list: dim and soft, so the item
  // plates and their prices stay easy to read. The sides stay bright.
  "linear-gradient(90deg, transparent 10%, rgba(18,12,8,0.34) 32%, rgba(18,12,8,0.34) 68%, transparent 90%)",
  "radial-gradient(ellipse 54% 50% at 50% 52%, rgba(18,12,8,0.4), transparent 78%)",
  "linear-gradient(180deg, rgba(18,12,8,0.44) 0%, transparent 18%, transparent 78%, rgba(18,12,8,0.55) 100%)",
].join(", ");

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
    className="absolute inset-0 overflow-hidden bg-[#2a1c12]"
    aria-hidden
    data-testid="bazaar-scene"
  >
    <FittedPainting src={BAZAAR_IMAGE} width={1536} height={1024}>
      {LANTERNS.map((lantern) => (
        <span
          key={`${lantern.x}:${lantern.y}`}
          className="pointer-events-none absolute aspect-square -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,206,130,0.3),rgba(255,180,90,0.1)_55%,transparent)] opacity-85 motion-safe:animate-[shop-lamp_5.5s_ease-in-out_infinite]"
          style={{
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
