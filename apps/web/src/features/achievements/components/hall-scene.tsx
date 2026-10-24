import { cn } from "cn";

import { achievementsArt } from "@/features/achievements/achievements-art";
import { FittedPainting } from "@/features/town/components/fitted-painting";

/**
 * The darker edges and the dim center over the scene, so that the flags,
 * the roll, the plates and the Town Bar stay easy to read (as the Hero
 * screen).
 */
const SHADE = [
  "radial-gradient(ellipse 62% 56% at 50% 52%, rgba(18,12,8,0.32), transparent 75%)",
  "linear-gradient(180deg, rgba(18,12,8,0.42) 0%, transparent 18%, transparent 80%, rgba(18,12,8,0.55) 100%)",
].join(", ");

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
    <div className="absolute -top-[1.2vw] -right-[0.9vw] -left-[0.9vw] h-[1.1vw] min-h-2 rounded-full bg-[linear-gradient(180deg,#7a5233,#3b2616)] shadow-[0_2px_0_rgba(0,0,0,0.4)]" />
    <div
      className="absolute inset-0 bg-[#c99442]"
      style={{ clipPath: SWALLOWTAIL }}
    />
    <div
      className="absolute inset-[0.35vw] bg-[linear-gradient(90deg,#6f1717,#8e1f1f_30%,#8e1f1f_70%,#6a1515)]"
      style={{ clipPath: SWALLOWTAIL }}
    />
    <svg
      viewBox="-10 -10 20 20"
      className="absolute top-[22%] left-1/2 w-[58%] -translate-x-1/2 text-[#e9c46a]"
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
          stroke="rgba(0,0,0,0.24)"
          strokeWidth="2"
        />
        <path
          d="M0 3H168M0 59H168M3 2V56M87 58V112"
          stroke="rgba(255,236,206,0.07)"
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
    style={{
      background: [
        // The light from the high windows at the upper left.
        "radial-gradient(ellipse 60% 55% at 16% 6%, rgba(255,204,140,0.3), transparent 70%)",
        "radial-gradient(ellipse 26% 30% at 86% 14%, rgba(255,204,140,0.12), transparent 70%)",
        // The beam across the top: dark timber with a lit top edge.
        "linear-gradient(180deg, transparent 0 4%, rgba(255,214,150,0.14) 4% 4.4%, #2c1b0f 4.4% 7.2%, rgba(0,0,0,0.38) 7.2% 8%, transparent 8%)",
        // The stone floor in shadow.
        "linear-gradient(0deg, #1f1a16 0 12%, #4a4038 12% 12.5%, transparent 12.5%)",
        // Soft stones of light and shadow.
        "radial-gradient(ellipse 24% 18% at 30% 40%, rgba(190,176,156,0.2), transparent 70%)",
        "radial-gradient(ellipse 20% 16% at 72% 34%, rgba(190,176,156,0.16), transparent 70%)",
        "radial-gradient(ellipse 18% 14% at 58% 70%, rgba(10,8,6,0.22), transparent 70%)",
        "linear-gradient(180deg, #7d7165 0%, #675d53 50%, #4c443d 100%)",
      ].join(", "),
    }}
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
    <div className="absolute inset-0 overflow-hidden bg-[#3a332d]" aria-hidden>
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
