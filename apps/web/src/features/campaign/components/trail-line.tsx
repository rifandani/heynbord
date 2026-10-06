import { useId } from "react";

import type { RegionMap } from "@/features/campaign/region-map";
import { MAP, smoothPath } from "@/features/campaign/region-map";

/**
 * The progress line on the center of the painted road (GDD 11.5): solid
 * dashes from the Trail entry to the last Done Stage, faint dots after it.
 * The walked part draws in once when the screen opens.
 */
export const TrailLine = ({
  map,
  walked,
}: {
  readonly map: RegionMap;
  /** The number of legs from the Trail entry to the last Done Stage. */
  readonly walked: number;
}) => {
  const id = useId();
  const paths = map.legs.map((leg) => smoothPath(leg));
  const done = paths.slice(0, walked).join(" ");
  const ahead = paths.slice(walked).join(" ");
  return (
    <svg
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden
    >
      <defs>
        <mask id={`${id}-draw`} maskUnits="userSpaceOnUse">
          <path
            d={done}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={40}
            strokeDasharray="1 1"
            className="[stroke-dashoffset:0] motion-safe:animate-[campaign-trail-draw_1100ms_cubic-bezier(0.3,0.7,0.2,1)_both]"
          />
        </mask>
      </defs>
      {ahead ? (
        <g fill="none" strokeLinecap="round">
          <path
            d={ahead}
            stroke="rgba(42,26,12,0.35)"
            strokeWidth={9}
            strokeDasharray="0.1 18"
          />
          <path
            d={ahead}
            stroke="rgba(255,246,223,0.8)"
            strokeWidth={5.5}
            strokeDasharray="0.1 18"
          />
        </g>
      ) : null}
      {done ? (
        <g
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          mask={`url(#${id}-draw)`}
        >
          <path
            d={done}
            stroke="rgba(42,26,12,0.55)"
            strokeWidth={13}
            strokeDasharray="16 13"
          />
          <path
            d={done}
            stroke="#fff6df"
            strokeWidth={7.5}
            strokeDasharray="16 13"
          />
        </g>
      ) : null}
    </svg>
  );
};
