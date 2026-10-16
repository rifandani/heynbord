import { heynspireArt } from "@/features/heynspire/heynspire-art";
import { FittedPainting } from "@/features/town/components/fitted-painting";
import { PAINTING_IMAGE } from "@/features/town/town";

/**
 * The part of the Town painting (1986 × 941 px) that the fallback shows: a
 * 600 × 338 px box (16:9) around x 893 and y 169, so that the castle of
 * Heynspire (11 — Town Concepts 2.2, its tower at x 667) stands in the left
 * margin, beside the Floor rail. The rail is the
 * tower in front of it, so the painted spire never shows above the summit
 * cap of the rail.
 */
const CROP = { width: 600, height: 338, x: 893, y: 169 } as const;
const IMAGE = { width: 1986, height: 941 } as const;

/**
 * The image, at the size that makes the crop cover the screen (the larger of
 * the zoom for the screen width and for the screen height), with the center
 * of the crop at the center of the screen. All values are CSS, so the crop
 * follows the screen size with no script.
 */
const PLACE = {
  width: `max(${(IMAGE.width / CROP.width) * 100}vw, ${(IMAGE.width / CROP.height) * 100}vh)`,
  height: "auto",
  left: `calc(50vw - max(${(CROP.x / CROP.width) * 100}vw, ${(CROP.x / CROP.height) * 100}vh))`,
  top: `calc(50vh - max(${(CROP.y / CROP.width) * 100}vw, ${(CROP.y / CROP.height) * 100}vh))`,
} as const;

/**
 * The darker edges and the dim center over the scene, so that the Floor
 * rail, the plates and the Town Bar stay easy to read (as the Hero screen).
 */
const SHADE = [
  "radial-gradient(ellipse 60% 62% at 50% 50%, rgba(18,12,8,0.38), transparent 78%)",
  "linear-gradient(180deg, rgba(18,12,8,0.45) 0%, transparent 20%, transparent 74%, rgba(18,12,8,0.62) 100%)",
  "linear-gradient(90deg, rgba(18,12,8,0.4) 0%, transparent 18%, transparent 82%, rgba(18,12,8,0.4) 100%)",
].join(", ");

/**
 * The castle of the Town painting, zoomed in and softened, that holds the
 * place of the Heynspire inside until a person paints it, so the Player sees
 * where they are.
 */
const TownCastle = () => (
  <>
    <img
      src={PAINTING_IMAGE}
      alt=""
      width={IMAGE.width}
      height={IMAGE.height}
      draggable={false}
      decoding="async"
      className="absolute max-w-none blur-[3px] saturate-[0.9] select-none"
      style={PLACE}
      data-testid="tower-scene-fallback"
    />
    <div className="absolute inset-0" style={{ background: SHADE }} />
  </>
);

/**
 * The tower behind the Heynspire screen (11 — Town Concepts 14), in full
 * above the Town Bar (`FittedPainting`), as the cave inside. Until the
 * painting exists, the castle of the Town painting holds its place. It is
 * calm: it has no ambient motion.
 */
export const TowerScene = () => {
  const painting = heynspireArt("towerInside");
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#9fcbe8]"
      aria-hidden
      data-testid="tower-scene"
    >
      {painting ? (
        <FittedPainting src={painting} width={1536} height={1024}>
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </FittedPainting>
      ) : (
        <TownCastle />
      )}
    </div>
  );
};
