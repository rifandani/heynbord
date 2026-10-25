import { heroArt } from "@/features/hero/hero-art";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/**
 * The darker edges and the dim center over the painting, so that the plates
 * and the Town Bar stay easy to read (as the Workshop).
 */
const SHADE = [
  "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(18,10,6,0.35), transparent 75%)",
  "linear-gradient(180deg, rgba(18,10,6,0.45) 0%, transparent 18%, transparent 78%, rgba(18,10,6,0.55) 100%)",
].join(", ");

/**
 * The timber wall that holds the place of the Barracks inside until a person
 * paints it (11 — Town Concepts 11): dark planks of the same wood as the Town
 * Bar, heavy beams at the top, a warm light from the upper left and a stone
 * floor in shadow at the bottom. It is calm, as the painting must be at its
 * center.
 */
const TimberWall = () => (
  <div
    className="absolute inset-0"
    style={{
      background: [
        // The light from the high window at the upper left (art direction 5).
        "radial-gradient(ellipse 70% 60% at 18% 8%, rgba(255,196,120,0.22), transparent 70%)",
        // Two beams across the wall: a dark timber with a lit top edge.
        "linear-gradient(180deg, transparent 0 9%, rgba(255,214,150,0.12) 9% 9.3%, #1c120b 9.3% 11.2%, rgba(0,0,0,0.35) 11.2% 11.8%, transparent 11.8%)",
        "linear-gradient(180deg, transparent 0 74%, rgba(255,214,150,0.1) 74% 74.3%, #1c120b 74.3% 75.8%, rgba(0,0,0,0.35) 75.8% 76.4%, transparent 76.4%)",
        // The stone floor in shadow.
        "linear-gradient(0deg, #15100c 0 13%, #2a2018 13% 13.6%, transparent 13.6%)",
        // The planks: a dark seam, a light edge, then the wood.
        "repeating-linear-gradient(90deg, rgba(0,0,0,0.42) 0 3px, rgba(255,214,150,0.07) 3px 5px, transparent 5px 7.5vw)",
        "linear-gradient(180deg, #3b2616 0%, #2e1d11 55%, #24170d 100%)",
      ].join(", "),
    }}
    data-testid="hero-scene-fallback"
  />
);

/**
 * The inside of the Barracks (11 — Town Concepts 11), in full above the Town
 * Bar (`FittedPainting`), as the Workshop. Until the painting exists, a
 * timber wall holds its place.
 */
export const HeroScene = () => {
  const painting = heroArt("barracksInside");
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#24170f]" aria-hidden>
      {painting ? (
        <FittedPainting src={painting} width={1536} height={1024}>
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </FittedPainting>
      ) : (
        <>
          <TimberWall />
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </>
      )}
    </div>
  );
};
