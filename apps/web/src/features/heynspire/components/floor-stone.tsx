import { cn } from "cn";
import { useId } from "react";

import { GLYPHS } from "@/features/battle/glyphs";
import type { FloorState } from "@/features/heynspire/heynspire";

/**
 * A Floor stone is an arched door of the tower, in a 100 × 112 box: the
 * stone frame with its keystone, the door in it, and the sill that it
 * stands on.
 */
const FRAME = "M8 102 V48 A42 42 0 0 1 92 48 V102 H8 Z";
const DOOR = "M19 102 V50 A31 31 0 0 1 81 50 V102 Z";
const KEYSTONE = "M43 4 H57 L55 17 H45 Z";
const SILL =
  "M2 100 H98 Q100 100 100 102 V108 Q100 111 97 111 H3 Q0 111 0 108 V102 Q0 100 2 100 Z";

/**
 * The paint of each state, as the Stage Marker shields (DESIGN.md, Campaign):
 * the card metal and a gold face for the Current Floor, the one place to
 * act; bronze around Tavern Wood for a won Floor; cold pewter around stone
 * for a locked Floor.
 */
const PAINT: Readonly<
  Record<
    FloorState,
    {
      readonly rim: readonly string[];
      readonly door: readonly string[];
    }
  >
> = {
  current: {
    rim: ["#f7dc9c", "#d9a85a", "#b47f36", "#8a5a20"],
    door: ["#fff3c4", "#ffd75a", "#e2a93b", "#b9801f"],
  },
  won: {
    rim: ["#f0d08c", "#c99a4f", "#a3722f", "#7a4f1b"],
    door: ["#8a5d38", "#6b4423", "#4a2d16", "#3a2412"],
  },
  locked: {
    rim: ["#e6e8ea", "#b8bcc0", "#8d9297", "#62676c"],
    door: ["#a9aeb3", "#8e9399", "#757a80", "#5d6166"],
  },
};

const Mark = ({ state }: { readonly state: FloorState }) => {
  if (state === "current") {
    // Crossed swords: the next fight.
    return (
      <g fill="#2a1a05">
        <path
          d={GLYPHS.sword}
          transform="translate(50 74) rotate(40) scale(0.36)"
        />
        <path
          d={GLYPHS.sword}
          transform="translate(50 74) rotate(-40) scale(0.36)"
        />
      </g>
    );
  }
  if (state === "won") {
    return (
      <path
        d="M35 75 L46 86 L66 62"
        fill="none"
        stroke="#fff6df"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  return (
    <path
      d={GLYPHS.lock}
      transform="translate(50 76) scale(0.3)"
      fill="#2b2e31"
      fillRule="evenodd"
      opacity={0.85}
    />
  );
};

const gradientStops = (colors: readonly string[]) =>
  colors.map((color, index) => (
    <stop
      key={color}
      offset={colors.length === 1 ? 0 : index / (colors.length - 1)}
      stopColor={color}
    />
  ));

/**
 * One Floor stone: an arched door of the tower in the paint of its state,
 * with the mark of the state on the door (crossed swords, a check or a
 * lock). The light comes from the upper left (art direction 5). The focus
 * ring follows the frame of the door. Decorative: its button says the Floor
 * and the state.
 */
export const FloorStone = ({
  state,
  className,
}: {
  readonly state: FloorState;
  readonly className?: string;
}) => {
  const id = useId();
  const paint = PAINT[state];
  return (
    <svg
      viewBox="-6 -2 112 116"
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          {gradientStops(paint.rim)}
        </linearGradient>
        <radialGradient id={`${id}-door`} cx="0.32" cy="0.22" r="1">
          {gradientStops(paint.door)}
        </radialGradient>
      </defs>
      {/* The focus ring: a dark edge and the Focus Cream line around the door. */}
      <path
        d={FRAME}
        fill="none"
        stroke="#1c140e"
        strokeWidth={15}
        strokeLinejoin="round"
        className="opacity-0 group-data-[focus-visible]:opacity-100"
      />
      <path
        d={FRAME}
        fill="none"
        stroke="#fff2a8"
        strokeWidth={9}
        strokeLinejoin="round"
        className="opacity-0 group-data-[focus-visible]:opacity-100"
      />
      <path
        d={FRAME}
        fill={`url(#${id}-rim)`}
        stroke="#2a1a0c"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={DOOR}
        fill={`url(#${id}-door)`}
        stroke="rgba(42,26,12,0.6)"
        strokeWidth={2}
      />
      {/* The light on the upper-left curve of the arch. */}
      <path
        d="M14 46 A36 36 0 0 1 36 15"
        fill="none"
        stroke="rgba(255,250,230,0.85)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={KEYSTONE}
        fill={`url(#${id}-rim)`}
        stroke="#2a1a0c"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d={SILL}
        fill="#e8dec7"
        stroke="#2a1a0c"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Mark state={state} />
    </svg>
  );
};
