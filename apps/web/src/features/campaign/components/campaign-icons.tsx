import { cn } from "cn";
import type { CSSProperties } from "react";
import { useId } from "react";

import { GLYPHS } from "@/features/battle/glyphs";
import type { StageState } from "@/features/campaign/region-map";

/** A five-point Star in a 24 × 24 box. */
const STAR =
  "M12 2.2l2.95 6.07 6.68.86-4.88 4.63 1.24 6.62L12 17.15l-5.99 3.23 1.24-6.62-4.88-4.63 6.68-.86z";

/** The empty Star socket on a dark plate and on parchment. */
const EMPTY_STAR = {
  plate: { fill: "rgba(255,246,223,0.16)", stroke: "rgba(255,246,223,0.45)" },
  parchment: { fill: "#e3d6b8", stroke: "#a8987a" },
} as const;

type StarTone = keyof typeof EMPTY_STAR;

/** One Star: gold when earned, a dim socket when not. Decorative. */
export const StarIcon = ({
  earned,
  tone = "plate",
  className,
}: {
  readonly earned: boolean;
  readonly tone?: StarTone;
  readonly className?: string;
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      d={STAR}
      fill={earned ? "#ffd75a" : EMPTY_STAR[tone].fill}
      stroke={earned ? "#7a5310" : EMPTY_STAR[tone].stroke}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

/** The best Stars of a Stage in a row of 3 (GDD 4.11). Decorative: the label says the count. */
export const StarRow = ({
  stars,
  tone,
  className,
  starClassName,
}: {
  readonly stars: number;
  readonly tone?: StarTone;
  readonly className?: string;
  readonly starClassName?: string;
}) => (
  <span className={cn("flex items-center", className)} aria-hidden>
    {[1, 2, 3].map((star) => (
      <StarIcon
        key={star}
        earned={star <= stars}
        tone={tone}
        className={starClassName}
      />
    ))}
  </span>
);

/**
 * A treasure chest for the Star chest plate. Closed: a domed lid with a lock.
 * Open (its Stars are earned): the lid stands back and gold light comes out.
 */
export const ChestIcon = ({
  earned,
  className,
}: {
  readonly earned: boolean;
  readonly className?: string;
}) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    {earned ? (
      <>
        {/* The lid stands open behind the box: its dark inside and its bronze rim. */}
        <path
          d="M5.5 16 Q5.5 3.5 16 3.5 Q26.5 3.5 26.5 16 Z"
          fill="#7a5233"
          stroke="#2a1a0c"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <path d="M8.5 16 Q8.5 6.5 16 6.5 Q23.5 6.5 23.5 16 Z" fill="#2a1a0c" />
        <path
          d="M6.4 15 Q6.4 4.5 16 4.5 Q25.6 4.5 25.6 15"
          fill="none"
          stroke="#e7bb6a"
          strokeWidth={1.2}
        />
        {/* A mound of gold above the rim of the box. */}
        <path
          d="M6.5 17 Q8.5 9.5 16 9.5 Q23.5 9.5 25.5 17 Z"
          fill="#ffd75a"
          stroke="#7a5310"
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
        <circle
          cx={11.8}
          cy={13.6}
          r={1.9}
          fill="#fff2a8"
          stroke="#b9801f"
          strokeWidth={0.8}
        />
        <circle
          cx={16.2}
          cy={11.9}
          r={1.9}
          fill="#fff2a8"
          stroke="#b9801f"
          strokeWidth={0.8}
        />
        <circle
          cx={20.4}
          cy={13.8}
          r={1.9}
          fill="#fff2a8"
          stroke="#b9801f"
          strokeWidth={0.8}
        />
      </>
    ) : (
      <path
        d="M5 16 Q5 7.5 16 7.5 Q27 7.5 27 16 Z"
        fill="#7a5233"
        stroke="#2a1a0c"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    )}
    <rect
      x={5}
      y={16}
      width={22}
      height={11.5}
      rx={1.5}
      fill="#563720"
      stroke="#2a1a0c"
      strokeWidth={1.5}
    />
    <path
      d={
        earned
          ? "M11 16 V27.5 M21 16 V27.5"
          : "M11 8.6 V27.5 M21 8.6 V27.5 M5 16 H27"
      }
      stroke="#e7bb6a"
      strokeWidth={1.8}
      fill="none"
    />
    {earned ? null : (
      <rect
        x={13.5}
        y={13.5}
        width={5}
        height={6}
        rx={1}
        fill="#e7bb6a"
        stroke="#2a1a0c"
        strokeWidth={1.2}
      />
    )}
  </svg>
);

/** The heater shield of a Stage Marker, in a 100 × 116 box. */
const SHIELD =
  "M50 3 C63 9 79 11 95 9 C97 53 85 88 50 113 C15 88 3 53 5 9 C21 11 37 9 50 3 Z";
const FACE =
  "M50 12 C61 17 74 19 86 17.5 C86 54 76 82 50 103 C24 82 14 54 14 17.5 C26 19 39 17 50 12 Z";

/** The metal of the rim and the paint of the face for each state. */
const SHIELD_PAINT: Readonly<
  Record<
    StageState,
    { readonly rim: readonly string[]; readonly face: readonly string[] }
  >
> = {
  // The card metal (DESIGN.md, Warm Bronze) and a gold face: the one place to act.
  open: {
    rim: ["#f7dc9c", "#d9a85a", "#b47f36", "#8a5a20"],
    face: ["#fff3c4", "#ffd75a", "#e2a93b", "#b9801f"],
  },
  // A won Stage: bronze around Tavern Wood.
  done: {
    rim: ["#f0d08c", "#c99a4f", "#a3722f", "#7a4f1b"],
    face: ["#8a5d38", "#6b4423", "#4a2d16", "#3a2412"],
  },
  // A locked Stage: cold pewter around stone.
  locked: {
    rim: ["#e6e8ea", "#b8bcc0", "#8d9297", "#62676c"],
    face: ["#a9aeb3", "#8e9399", "#757a80", "#5d6166"],
  },
};

/** Crossed swords: the next fight. Two shared sword glyphs, scaled into the face. */
const OpenMark = () => (
  <g fill="#2a1a05">
    <path d={GLYPHS.sword} transform="translate(50 56) rotate(38) scale(0.5)" />
    <path
      d={GLYPHS.sword}
      transform="translate(50 56) rotate(-38) scale(0.5)"
    />
  </g>
);

const DoneMark = () => (
  <path
    d="M31 57 L45 71 L71 41"
    fill="none"
    stroke="#fff6df"
    strokeWidth={11}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const LockedMark = () => (
  <path
    d={GLYPHS.lock}
    transform="translate(50 56) scale(0.42)"
    fill="#2b2e31"
    fillRule="evenodd"
    opacity={0.85}
  />
);

const MARKS: Readonly<Record<StageState, () => React.JSX.Element>> = {
  open: OpenMark,
  done: DoneMark,
  locked: LockedMark,
};

/**
 * The shield of a Stage Marker: a metal rim, a painted face with a top-left
 * light (art direction: light from the upper left), and the mark of its
 * state. The focus ring follows the shield edge.
 */
export const StageShield = ({
  state,
  className,
}: {
  readonly state: StageState;
  readonly className?: string;
}) => {
  const id = useId();
  const paint = SHIELD_PAINT[state];
  const Mark = MARKS[state];
  return (
    <svg
      viewBox="-8 -8 116 132"
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          {paint.rim.map((color, index) => (
            <stop
              key={color}
              offset={index / (paint.rim.length - 1)}
              stopColor={color}
            />
          ))}
        </linearGradient>
        <radialGradient id={`${id}-face`} cx="0.36" cy="0.24" r="0.9">
          {paint.face.map((color, index) => (
            <stop
              key={color}
              offset={index / (paint.face.length - 1)}
              stopColor={color}
            />
          ))}
        </radialGradient>
      </defs>
      {/* The focus ring: a dark edge and the Focus Cream line, on the shield edge. */}
      <path
        d={SHIELD}
        fill="none"
        stroke="#1c140e"
        strokeWidth={17}
        strokeLinejoin="round"
        className="opacity-0 group-data-[focus-visible]:opacity-100"
      />
      <path
        d={SHIELD}
        fill="none"
        stroke="#fff2a8"
        strokeWidth={10}
        strokeLinejoin="round"
        className="opacity-0 group-data-[focus-visible]:opacity-100"
      />
      <path
        d={SHIELD}
        fill={`url(#${id}-rim)`}
        stroke="#2a1a0c"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={FACE}
        fill={`url(#${id}-face)`}
        stroke="rgba(42,26,12,0.55)"
        strokeWidth={2}
      />
      {/* The light on the upper-left facet of the rim. */}
      <path
        d="M9 13 C22 15 37 13 50 7"
        fill="none"
        stroke="rgba(255,250,230,0.8)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Mark />
    </svg>
  );
};

/** The crown of a Boss Stage Marker (GDD 11.5), on the top of the shield. */
export const BossCrown = ({
  className,
  style,
}: {
  readonly className?: string;
  readonly style?: CSSProperties;
}) => (
  <svg
    viewBox="-54 -54 108 108"
    className={className}
    style={style}
    aria-hidden
  >
    <path
      d={GLYPHS.crown}
      fill="#ffd75a"
      stroke="#5b3a0c"
      strokeWidth={7}
      strokeLinejoin="round"
      paintOrder="stroke"
    />
  </svg>
);
