import type { DamageType } from "@workspace/rules";
import { cn } from "cn";
import { useId } from "react";

import { DAMAGE_COLORS } from "@/core/components/game/tokens";

/** The steel of the blade: a cool ramp, so the sword reads as iron, not wood. */
const STEEL = [
  ["0%", "#ffffff"],
  ["18%", "#e9eff4"],
  ["45%", "#c3ccd5"],
  ["70%", "#8b96a2"],
  ["88%", "#b6c0ca"],
  ["100%", "#f5f8fb"],
] as const;

/** The darker steel of the guard, the pommel and the collar. */
const STEEL_DARK = [
  ["0%", "#f4f8fb"],
  ["35%", "#bcc6cf"],
  ["70%", "#7d8893"],
  ["100%", "#d2dae1"],
] as const;

/**
 * The Attack of a Creature Card as a diagonal iron sword, from the point at the
 * lower left to the hilt at the upper right: a steel blade with a fuller, a
 * steel guard and pommel, and a leather grip. The number sits on top of it, with
 * a thick ink edge and a bronze rim of its own, so two digits may run over the
 * blade and the guard. The Damage Type keeps its color on the pommel gem. All
 * sizes are in the `80 × 80` box, so the font size of the card sets the size.
 */
export const AttackPlate = ({
  damageType,
  value,
  className,
}: {
  readonly damageType: DamageType;
  readonly value: number;
  readonly className?: string;
}) => {
  // The gradients are per plate, because a page shows many cards.
  const uid = useId().replaceAll(/[^a-zA-Z0-9_-]/gu, "");
  const id = `atk-sword-${uid}`;
  const color = DAMAGE_COLORS[damageType];
  const number = String(value);

  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden
      className={cn(
        "absolute z-10 h-auto w-[2.43em] drop-shadow-[0_0.14em_0.28em_rgba(0,0,0,0.65)]",
        className
      )}
    >
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0.25" y2="1">
          {STEEL.map(([offset, stop]) => (
            <stop key={offset} offset={offset} stopColor={stop} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-steel-dark`} x1="0" y1="0" x2="0.3" y2="1">
          {STEEL_DARK.map(([offset, stop]) => (
            <stop key={offset} offset={offset} stopColor={stop} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-leather`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a1608" />
          <stop offset="40%" stopColor="#5a3517" />
          <stop offset="70%" stopColor="#6b4320" />
          <stop offset="100%" stopColor="#241206" />
        </linearGradient>
      </defs>

      {/* The sword: point at the lower left, hilt at the upper right. */}
      <g transform="rotate(45 40 40)">
        <path
          d="M28 34 H52 L47 60 L40 78 L33 60 Z"
          fill={`url(#${id}-steel)`}
          stroke="#2a1a08"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M40 37 V72"
          stroke="#4b555f"
          strokeOpacity="0.5"
          strokeWidth="1.8"
        />
        <path
          d="M31 38 L37 70"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="1.1"
        />
        <path d="M40 78 L37 66 H43 Z" fill="#ffffff" opacity="0.22" />

        <path
          d="M12 29 L18 24 H62 L68 29 L62 34 L56 31 H24 L18 34 Z"
          fill={`url(#${id}-steel-dark)`}
          stroke="#2a1a08"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M20 29.5 H60"
          stroke="#ffffff"
          strokeOpacity="0.6"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        <path
          d="M34.5 14 H45.5 V28 H34.5 Z"
          fill={`url(#${id}-leather)`}
          stroke="#2a1a08"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M34.5 17 L45.5 16.3 M34.5 20 L45.5 19.3 M34.5 23 L45.5 22.3 M34.5 26 L45.5 25.3"
          stroke="#c9a46a"
          strokeOpacity="0.8"
          strokeWidth="1.1"
        />

        <circle
          cx="40"
          cy="8.5"
          r="6.5"
          fill={`url(#${id}-steel-dark)`}
          stroke="#2a1a08"
          strokeWidth="2.2"
        />
        <circle cx="40" cy="8.5" r="2.8" fill={color} />
      </g>

      {/* The number: a bronze rim, an ink edge, then the cream face. */}
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="36"
        fontWeight="900"
        fill="none"
        stroke="#e7bb6a"
        strokeLinejoin="round"
        strokeWidth="8"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {number}
      </text>
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="36"
        fontWeight="900"
        fill="none"
        stroke="#2a1a08"
        strokeLinejoin="round"
        strokeWidth="6"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {number}
      </text>
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="36"
        fontWeight="900"
        fill="#fff6df"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {number}
      </text>
    </svg>
  );
};
