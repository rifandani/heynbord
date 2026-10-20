import { useAtomValue } from "@effect/atom-react";
import type { CosmeticId } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";

import { cardBackArt } from "@/features/battle/card-back-art";
import { BRONZE } from "@/features/battle/components/card-frame";
import { HeynbordEmblem } from "@/features/battle/components/heynbord-emblem";
import { activeCardBackAtom } from "@/features/profile/profile.atoms";

/** The Standard Back, in code: dark leather with a fine diamond tooling. */
const LEATHER = [
  "radial-gradient(ellipse at 50% 42%, rgba(120,62,28,0.85) 0%, transparent 62%)",
  "repeating-linear-gradient(45deg, rgba(231,187,106,0.09) 0 0.08em, transparent 0.08em 1.1em)",
  "repeating-linear-gradient(-45deg, rgba(231,187,106,0.09) 0 0.08em, transparent 0.08em 1.1em)",
  "linear-gradient(180deg, #3a2014, #1b0e08)",
].join(", ");

/**
 * The Card Back: the face-down side that all cards share. The size is in `em`
 * like the Card Frame (9em × 12.6em), so the parent font size sets it.
 *
 * `back` is the Cosmetic that the card shows. When it is absent, the card
 * shows the Active Cosmetic of the `cardBack` family. `null` is the Standard
 * Back: the enemy Side never shows the Player's Card Back.
 */
export const CardBack = ({
  className,
  back,
}: {
  readonly className?: string;
  readonly back?: CosmeticId | null;
}) => {
  const active = useAtomValue(activeCardBackAtom);
  const id = back === undefined ? active : back;
  const art = id === null ? null : cardBackArt(id);
  return (
    <span
      className={cn(
        "relative block h-[12.6em] w-[9em] rounded-[0.85em] p-[0.36em] shadow-[inset_0_0.1em_0_rgba(255,243,210,0.85),inset_0_-0.12em_0_rgba(60,30,5,0.75),0_0.3em_0.7em_rgba(0,0,0,0.55)]",
        className
      )}
      style={{ background: BRONZE }}
      data-card-back={id ?? "standard"}
      aria-hidden
    >
      <span className="relative flex size-full items-center justify-center overflow-hidden rounded-[0.55em] border-[0.14em] border-[#e7bb6a]">
        {art === null ? (
          <span className="absolute inset-0" style={{ background: LEATHER }} />
        ) : (
          <img
            src={art}
            alt=""
            draggable={false}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {/* The inner tooled line. */}
        <span className="absolute inset-[0.45em] rounded-[0.35em] border-[0.08em] border-[#e7bb6a]/55" />
        <HeynbordEmblem className="relative w-[4.6em] drop-shadow-[0_0.15em_0.2em_rgba(0,0,0,0.7)]" />
      </span>
    </span>
  );
};

/**
 * An empty place for a card: a dark inset with a faint mark. The mark is the
 * Heynbord emblem if `mark` is not given. It has the height of the Card Frame
 * and the width of its parent.
 */
export const EmptyCardPlace = ({
  className,
  mark,
}: {
  readonly className?: string;
  readonly mark?: ReactNode;
}) => (
  <span
    className={cn(
      "flex h-[12.6em] w-full items-center justify-center rounded-[0.85em] border-[0.12em] border-[#7a5530]/70 bg-[#1f140b]/75 shadow-[inset_0_0.35em_0.8em_rgba(0,0,0,0.7),0_0.08em_0_rgba(255,226,170,0.18)]",
      className
    )}
    aria-hidden
  >
    {mark ?? <HeynbordEmblem className="w-[3.6em] opacity-[0.16] grayscale" />}
  </span>
);
