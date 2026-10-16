import { dungeonArt } from "@/features/dungeons/dungeon-art";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/**
 * The darker edges and the dim center over the scene, so that the notice
 * board, the plates and the Town Bar stay easy to read (as the Hero screen).
 */
const SHADE = [
  "radial-gradient(ellipse 62% 56% at 50% 52%, rgba(18,12,8,0.3), transparent 75%)",
  "linear-gradient(180deg, rgba(18,12,8,0.4) 0%, transparent 18%, transparent 80%, rgba(18,12,8,0.55) 100%)",
].join(", ");

/**
 * The mine gallery that holds the place of the cave inside until a person
 * paints it (11 — Town Concepts 13): a wall of grey-brown rock between two
 * timber props and a beam, warm lantern light from the upper left (art
 * direction 5) and a smaller lantern at the right, and a dark floor. It is
 * calm at its center, where the notice board stands.
 */
const MineGallery = () => (
  <div
    className="absolute inset-0"
    style={{
      background: [
        // The lanterns: the main light at the upper left, a small one at the right.
        "radial-gradient(ellipse 55% 50% at 14% 12%, rgba(255,190,110,0.32), transparent 70%)",
        "radial-gradient(ellipse 22% 26% at 90% 22%, rgba(255,190,110,0.2), transparent 70%)",
        // The beam across the top: dark timber with a lit top edge.
        "linear-gradient(180deg, transparent 0 6%, rgba(255,214,150,0.16) 6% 6.4%, #2c1b0f 6.4% 9.6%, rgba(0,0,0,0.4) 9.6% 10.4%, transparent 10.4%)",
        // The two props at the sides, lit on the side of the main lantern.
        "linear-gradient(90deg, transparent 0 2.5%, rgba(255,214,150,0.14) 2.5% 2.8%, #3b2616 2.8% 5.4%, rgba(0,0,0,0.38) 5.4% 6%, transparent 6% 94%, rgba(255,214,150,0.08) 94% 94.3%, #33200f 94.3% 96.9%, rgba(0,0,0,0.38) 96.9% 97.5%, transparent 97.5%)",
        // The floor of packed earth.
        "linear-gradient(0deg, #1d1712 0 12%, #3a3029 12% 12.5%, transparent 12.5%)",
        // The rock: soft stones of light and shadow on the wall.
        "radial-gradient(ellipse 26% 20% at 24% 38%, rgba(150,138,122,0.28), transparent 70%)",
        "radial-gradient(ellipse 22% 18% at 70% 30%, rgba(150,138,122,0.22), transparent 70%)",
        "radial-gradient(ellipse 30% 16% at 52% 66%, rgba(150,138,122,0.18), transparent 70%)",
        "radial-gradient(ellipse 18% 14% at 84% 62%, rgba(10,8,6,0.35), transparent 70%)",
        "radial-gradient(ellipse 20% 16% at 10% 70%, rgba(10,8,6,0.3), transparent 70%)",
        "linear-gradient(180deg, #554a40 0%, #463c33 50%, #322a23 100%)",
      ].join(", "),
    }}
    data-testid="cave-scene-fallback"
  />
);

/**
 * The inside of the Dungeons cave (11 — Town Concepts 13), in full above the
 * Town Bar (`FittedPainting`), as the Hero screen. Until the painting
 * exists, a mine gallery in code holds its place.
 */
export const CaveScene = () => {
  const painting = dungeonArt("caveInside");
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#2a221c]" aria-hidden>
      {painting ? (
        <FittedPainting src={painting} width={1536} height={1024}>
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </FittedPainting>
      ) : (
        <>
          <MineGallery />
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </>
      )}
    </div>
  );
};
