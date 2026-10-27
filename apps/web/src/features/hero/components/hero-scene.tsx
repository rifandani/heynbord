import { heroArt } from "@/features/hero/hero-art";
import {
  HERO_SCENE_FALLBACK,
  HERO_SCENE_SHADE,
  HERO_TIMBER_WALL,
} from "@/features/hero/tokens";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/**
 * The timber wall that holds the place of the Barracks inside until a person
 * paints it (11 — Town Concepts 11). It is calm, as the painting must be at
 * its center.
 */
const TimberWall = () => (
  <div
    className="absolute inset-0"
    style={{ background: HERO_TIMBER_WALL }}
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
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: HERO_SCENE_FALLBACK }}
      aria-hidden
    >
      {painting ? (
        <FittedPainting src={painting} width={1536} height={1024}>
          <div
            className="absolute inset-0"
            style={{ background: HERO_SCENE_SHADE }}
          />
        </FittedPainting>
      ) : (
        <>
          <TimberWall />
          <div
            className="absolute inset-0"
            style={{ background: HERO_SCENE_SHADE }}
          />
        </>
      )}
    </div>
  );
};
