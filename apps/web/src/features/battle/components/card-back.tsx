import { cn } from "cn";
import { useId } from "react";

import { BRONZE } from "@/features/battle/components/card-frame";

/**
 * The Heynbord emblem from the logo: two hexagon halves with a notch, and a
 * four-point star between them. Decorative.
 */
const HeynbordEmblem = ({ className }: { readonly className?: string }) => {
  const gold = useId();
  return (
    <svg viewBox="-50 -54 100 108" className={className} aria-hidden>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0b8" />
          <stop offset="0.45" stopColor="#e3b55a" />
          <stop offset="1" stopColor="#9a6421" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gold})`} stroke="#3a2208" strokeWidth={1.5}>
        <path d="M-10 -48 L-40 -29 L-40 27 L-10 49 L-10 12 L-33 -3 L-10 -22 Z" />
        <path d="M10 -48 L40 -29 L40 27 L10 49 L10 12 L33 -3 L10 -22 Z" />
        <path d="M0 -27 Q3 -9 18 -5 Q3 -1 0 20 Q-3 -1 -18 -5 Q-3 -9 0 -27 Z" />
      </g>
    </svg>
  );
};

/**
 * The Card Back: the face-down side that all cards share. The size is in `em`
 * like the Card Frame (9em × 12.6em), so the parent font size sets it.
 */
export const CardBack = ({ className }: { readonly className?: string }) => (
  <span
    className={cn(
      "relative block h-[12.6em] w-[9em] rounded-[0.85em] p-[0.36em] shadow-[inset_0_0.1em_0_rgba(255,243,210,0.85),inset_0_-0.12em_0_rgba(60,30,5,0.75),0_0.3em_0.7em_rgba(0,0,0,0.55)]",
      className
    )}
    style={{ background: BRONZE }}
    aria-hidden
  >
    <span
      className="relative flex size-full items-center justify-center overflow-hidden rounded-[0.55em] border-[0.14em] border-[#e7bb6a]"
      style={{
        // Dark leather with a fine diamond tooling.
        background: [
          "radial-gradient(ellipse at 50% 42%, rgba(120,62,28,0.85) 0%, transparent 62%)",
          "repeating-linear-gradient(45deg, rgba(231,187,106,0.09) 0 0.08em, transparent 0.08em 1.1em)",
          "repeating-linear-gradient(-45deg, rgba(231,187,106,0.09) 0 0.08em, transparent 0.08em 1.1em)",
          "linear-gradient(180deg, #3a2014, #1b0e08)",
        ].join(", "),
      }}
    >
      {/* The inner tooled line. */}
      <span className="absolute inset-[0.45em] rounded-[0.35em] border-[0.08em] border-[#e7bb6a]/55" />
      <HeynbordEmblem className="relative w-[4.6em] drop-shadow-[0_0.15em_0.2em_rgba(0,0,0,0.7)]" />
    </span>
  </span>
);

/**
 * An empty place for a card: a dark inset with a faint emblem. It has the
 * height of the Card Frame and the width of its parent.
 */
export const EmptyCardPlace = ({
  className,
}: {
  readonly className?: string;
}) => (
  <span
    className={cn(
      "flex h-[12.6em] w-full items-center justify-center rounded-[0.85em] border-[0.12em] border-[#7a5530]/70 bg-[#1f140b]/75 shadow-[inset_0_0.35em_0.8em_rgba(0,0,0,0.7),0_0.08em_0_rgba(255,226,170,0.18)]",
      className
    )}
    aria-hidden
  >
    <HeynbordEmblem className="w-[3.6em] opacity-[0.16] grayscale" />
  </span>
);
