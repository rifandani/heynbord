import { useId } from "react";

import { EMBLEM_EDGE, EMBLEM_GOLD } from "@/features/battle/tokens";

/**
 * The Heynbord emblem from the logo: two hexagon halves with a notch, and a
 * four-point star between them. Decorative.
 */
export const HeynbordEmblem = ({
  className,
}: {
  readonly className?: string;
}) => {
  const gold = useId();
  return (
    <svg viewBox="-50 -54 100 108" className={className} aria-hidden>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          {EMBLEM_GOLD.map((stop, index) => (
            <stop
              key={stop}
              offset={["0", "0.45", "1"][index]}
              stopColor={stop}
            />
          ))}
        </linearGradient>
      </defs>
      <g fill={`url(#${gold})`} stroke={EMBLEM_EDGE} strokeWidth={1.5}>
        <path d="M-10 -48 L-40 -29 L-40 27 L-10 49 L-10 12 L-33 -3 L-10 -22 Z" />
        <path d="M10 -48 L40 -29 L40 27 L10 49 L10 12 L33 -3 L10 -22 Z" />
        <path d="M0 -27 Q3 -9 18 -5 Q3 -1 0 20 Q-3 -1 -18 -5 Q-3 -9 0 -27 Z" />
      </g>
    </svg>
  );
};
