import { cn } from "cn";

import { achievementsArt } from "@/features/achievements/achievements-art";
import {
  ACHIEVEMENTS_BANNER_CLOTH,
  ACHIEVEMENTS_BANNER_ROD,
  ACHIEVEMENTS_HALL_BG,
  ACHIEVEMENTS_JOINT_DARK,
  ACHIEVEMENTS_JOINT_LIGHT,
  ACHIEVEMENTS_ROD_SHADOW,
  ACHIEVEMENTS_SHADE,
  ACHIEVEMENTS_STONE,
} from "@/features/achievements/tokens";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/**
 * The darker edges and the dim center over the scene, so that the flags,
 * the roll, the plates and the Town Bar stay easy to read (as the Hero
 * screen).
 */
const SHADE = ACHIEVEMENTS_SHADE;

/** The swallowtail of a hanging banner: the cut at its bottom edge. */
const SWALLOWTAIL = "polygon(0 0, 100% 0, 100% 100%, 50% 88%, 0 100%)";

/**
 * One tall banner on the wall: Blood Banner cloth with a gold hem that
 * follows the swallowtail, and the four-point star of the Heynbord emblem
 * in gold. The hem is the gold layer under the cloth, so the cut keeps it.
 */
const WallBanner = ({ className }: { readonly className: string }) => (
  <div
    className={cn(
      "absolute top-[9%] hidden h-[56%] w-24 min-[1320px]:block",
      className
    )}
  >
    {/* The rod: dark timber with bronze ends. */}
    <div
      className="absolute -top-[1.2vw] -right-[0.9vw] -left-[0.9vw] h-[1.1vw] min-h-2 rounded-full"
      style={{
        background: ACHIEVEMENTS_BANNER_ROD,
        boxShadow: ACHIEVEMENTS_ROD_SHADOW,
      }}
    />
    <div
      className="bg-bronze-mid absolute inset-0"
      style={{ clipPath: SWALLOWTAIL }}
    />
    <div
      className="absolute inset-[0.35vw]"
      style={{ clipPath: SWALLOWTAIL, background: ACHIEVEMENTS_BANNER_CLOTH }}
    />
    <svg
      viewBox="-10 -10 20 20"
      className="text-gold-trim absolute top-[22%] left-1/2 w-[58%] -translate-x-1/2"
    >
      <path
        d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z"
        fill="currentColor"
      />
    </svg>
  </div>
);

/**
 * The joints of the stone blocks: a dark line with a light edge under it at
 * each course, and the vertical joints of each course offset by half a block
 * from the course above, as a real wall is laid.
 */
const StoneJoints = () => (
  <svg aria-hidden className="absolute inset-x-0 top-[8%] h-[79.5%] w-full">
    <defs>
      <pattern
        id="hall-joints"
        width="168"
        height="112"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M0 1H168M0 57H168M1 0V56M85 56V112"
          stroke={ACHIEVEMENTS_JOINT_DARK}
          strokeWidth="2"
        />
        <path
          d="M0 3H168M0 59H168M3 2V56M87 58V112"
          stroke={ACHIEVEMENTS_JOINT_LIGHT}
          strokeWidth="2"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hall-joints)" />
  </svg>
);

/**
 * The stone hall that holds the place of the Hall inside until a person
 * paints it (11 — Town Concepts 15): a wall of warm grey stone in courses, a
 * timber beam at the top, a warm light from the high windows at the upper
 * left (art direction 5), two tall Blood Banner banners at the sides and a
 * stone floor in shadow. It is calm at its center, where the flags and the
 * roll stand.
 */
const StoneHall = () => (
  <div
    className="absolute inset-0"
    style={{ background: ACHIEVEMENTS_STONE }}
    data-testid="hall-scene-fallback"
  >
    {/* Each banner hangs at the middle of the gutter beside the 1080px
        content box; a narrower screen has no gutter, so it shows none. */}
    <StoneJoints />
    <WallBanner className="left-[calc((100vw-1080px)/4-3rem)]" />
    <WallBanner className="right-[calc((100vw-1080px)/4-3rem)]" />
  </div>
);

/**
 * The inside of the Hall of banners (11 — Town Concepts 15), in full above
 * the Town Bar (`FittedPainting`), as the Hero screen. Until the painting
 * exists, a stone hall in code holds its place.
 */
export const HallScene = () => {
  const painting = achievementsArt("hallInside");
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: ACHIEVEMENTS_HALL_BG }}
      aria-hidden
    >
      {painting ? (
        <FittedPainting src={painting} width={1536} height={1024}>
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </FittedPainting>
      ) : (
        <>
          <StoneHall />
          <div className="absolute inset-0" style={{ background: SHADE }} />
        </>
      )}
    </div>
  );
};
